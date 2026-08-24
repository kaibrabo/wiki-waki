import { useEffect } from 'react';
import { DateTime } from 'luxon';
import { useStore } from '../store';
import { updateWidget, WidgetData, WidgetAlarmData, WidgetLocationData } from '../lib/widget';
import type { Alarm, Location } from '../types';

/**
 * Finds the next upcoming alarm from a list of alarms.
 */
function getNextAlarm(alarms: Alarm[], locations: Location[], use24Hour: boolean): WidgetAlarmData | null {
  const now = DateTime.now();
  
  const enabledAlarms = alarms.filter(a => {
    const location = locations.find(l => l.id === a.locationId);
    return a.enabled && location && !location.disabled;
  });
  
  if (enabledAlarms.length === 0) return null;
  
  let nextAlarm: { alarm: Alarm; nextTime: DateTime } | null = null;
  
  for (const alarm of enabledAlarms) {
    const location = locations.find(l => l.id === alarm.locationId);
    if (!location) continue;
    
    // Parse the alarm time in its pinned zone
    const [hours, minutes] = alarm.time.split(':').map(Number);
    let alarmTime = now.setZone(alarm.pinnedZone).set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    
    // If the time has passed today, check tomorrow
    if (alarmTime <= now) {
      alarmTime = alarmTime.plus({ days: 1 });
    }
    
    // Check if this alarm should fire based on recurrence
    const shouldFire = checkRecurrence(alarm, alarmTime);
    if (!shouldFire) continue;
    
    if (!nextAlarm || alarmTime < nextAlarm.nextTime) {
      nextAlarm = { alarm, nextTime: alarmTime };
    }
  }
  
  if (!nextAlarm) return null;
  
  const location = locations.find(l => l.id === nextAlarm.alarm.locationId);
  const timeFormat = use24Hour ? 'HH:mm' : 'h:mm a';
  
  return {
    label: nextAlarm.alarm.label,
    time: nextAlarm.nextTime.toFormat(timeFormat),
    locationName: location?.name || '',
    timezone: nextAlarm.alarm.pinnedZone,
    enabled: true,
  };
}

/**
 * Checks if an alarm should fire on the given date based on its recurrence.
 */
function checkRecurrence(alarm: Alarm, dateTime: DateTime): boolean {
  const dayOfWeek = dateTime.weekday % 7; // 0 = Sunday, 6 = Saturday (Luxon uses 1-7)
  
  switch (alarm.recurrence.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekly':
      return alarm.recurrence.days.includes(dayOfWeek);
    case 'once':
      const alarmDate = DateTime.fromISO(alarm.recurrence.date, { zone: alarm.pinnedZone });
      return dateTime.hasSame(alarmDate, 'day');
    default:
      return true;
  }
}

/**
 * Generates current time strings for locations.
 */
function getLocationTimes(locations: Location[], use24Hour: boolean): WidgetLocationData[] {
  const now = DateTime.now();
  const timeFormat = use24Hour ? 'HH:mm' : 'h:mm a';
  
  return locations.map(location => ({
    name: location.name.split(',')[0], // Just the city name
    timezone: location.ianaZone,
    currentTime: now.setZone(location.ianaZone).toFormat(timeFormat),
  }));
}

/**
 * Hook that syncs the widget with the current store state.
 * Call this in your root component to keep the widget updated.
 */
export function useWidgetSync() {
  const alarms = useStore(s => s.alarms);
  const locations = useStore(s => s.locations);
  const use24Hour = useStore(s => s.use24Hour);
  const hasHydrated = useStore(s => s.hasHydrated);
  
  useEffect(() => {
    if (!hasHydrated) return;
    
    const syncWidget = () => {
      const now = DateTime.now();
      const timeFormat = use24Hour ? 'HH:mm' : 'h:mm a';
      
      const widgetData: WidgetData = {
        nextAlarm: getNextAlarm(alarms, locations, use24Hour),
        currentTime: now.toFormat(timeFormat),
        currentTimezone: now.zoneName || 'Local',
        locations: getLocationTimes(locations, use24Hour),
      };
      
      updateWidget(widgetData);
    };
    
    // Sync immediately
    syncWidget();
    
    // Sync every minute to keep times fresh
    const interval = setInterval(syncWidget, 60000);
    
    return () => clearInterval(interval);
  }, [alarms, locations, use24Hour, hasHydrated]);
}
