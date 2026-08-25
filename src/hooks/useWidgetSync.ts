import { useEffect } from 'react';
import { DateTime } from 'luxon';
import { useStore } from '../store';
import { updateWidget, WidgetData, WidgetAlarmData, WidgetLocationData } from '../lib/widget';
import { allUpcomingAlarms } from '../lib/schedule';
import { codeForLocation } from '../lib/zones';
import { getTranslations } from '../lib/i18n';
import { useEffectiveTheme } from './useEffectiveTheme';
import type { Alarm, Location } from '../types';

/**
 * The soonest upcoming alarm, restricted to enabled alarms on non-disabled
 * locations — the same rule the home screen uses (see LocationsScreen). Reuses
 * the canonical scheduling logic in schedule.ts so the widget can never diverge
 * from the app (the old hand-rolled copy here lacked monthly/yearly recurrence).
 */
function getUpcomingAlarms(
  alarms: Alarm[],
  locations: Location[],
  use24Hour: boolean,
  now: DateTime,
  count = 3,
): WidgetAlarmData[] {
  const enabledLocationIds = new Set(locations.filter((l) => !l.disabled).map((l) => l.id));
  const activeAlarms = alarms.filter((a) => a.enabled && enabledLocationIds.has(a.locationId));
  const timeFormat = use24Hour ? 'HH:mm' : 'h:mm a';

  return allUpcomingAlarms(activeAlarms, now)
    .slice(0, count)
    .map(({ alarm, instant }) => {
      const location = locations.find((l) => l.id === alarm.locationId);
      const code = location ? codeForLocation(location.name, location.ianaZone) ?? '' : '';
      return {
        label: alarm.label,
        time: instant.setZone(alarm.pinnedZone).toFormat(timeFormat),
        locationName: location?.name.split(',')[0] ?? '',
        code,
        timezone: alarm.pinnedZone,
        fireEpoch: Math.round(instant.toSeconds()),
        enabled: true,
      };
    });
}

/** Current wall-clock in each location's zone, city name only. */
function getLocationTimes(locations: Location[], use24Hour: boolean, now: DateTime): WidgetLocationData[] {
  const timeFormat = use24Hour ? 'HH:mm' : 'h:mm a';
  return locations.map((location) => ({
    name: location.name.split(',')[0],
    timezone: location.ianaZone,
    currentTime: now.setZone(location.ianaZone).toFormat(timeFormat),
  }));
}

/**
 * Keeps the iOS widget in sync with the store. Writes on any alarm/location/format
 * change and once a minute so the world-clock times stay fresh. The next-alarm
 * countdown itself ticks natively in SwiftUI from `fireEpoch`, so it stays live
 * between these writes.
 */
export function useWidgetSync() {
  const alarms = useStore((s) => s.alarms);
  const locations = useStore((s) => s.locations);
  const use24Hour = useStore((s) => s.use24Hour);
  const dateFormat = useStore((s) => s.dateFormat);
  const language = useStore((s) => s.language);
  const currentPlace = useStore((s) => s.currentPlace);
  const hasHydrated = useStore((s) => s.hasHydrated);
  const theme = useEffectiveTheme();

  useEffect(() => {
    if (!hasHydrated) return;

    const syncWidget = () => {
      const now = DateTime.now();
      const timeFormat = use24Hour ? 'HH:mm' : 'h:mm a';
      const activeZone = now.zoneName || 'Local';

      // The current location = the device's exact reverse-geocoded place (e.g.
      // "San Rafael, CA"). Fall back to the saved location at the current
      // timezone, then to the timezone's city name.
      const currentLoc = locations.find((l) => l.ianaZone === activeZone);
      const placeLabel = currentPlace
        ? [currentPlace.city, currentPlace.region].filter(Boolean).join(', ')
        : '';
      const currentLocationName =
        placeLabel ||
        (currentLoc
          ? currentLoc.name.split(',')[0]
          : (activeZone.split('/').pop() || activeZone).replace(/_/g, ' '));

      const upcomingAlarms = getUpcomingAlarms(alarms, locations, use24Hour, now, 3);

      const currentDate = now.toFormat(dateFormat === 'DMY' ? 'dd/MM/yyyy' : 'MM/dd/yyyy');
      const t = getTranslations(language);

      const widgetData: WidgetData = {
        nextAlarm: upcomingAlarms[0] ?? null,
        upcomingAlarms,
        currentTime: now.toFormat(timeFormat),
        use24Hour,
        currentDate,
        currentTimezone: activeZone,
        currentLocationName,
        theme,
        strings: { next: t.next, saved: t.saved, noAlarms: t.noUpcomingAlarms },
        locations: getLocationTimes(locations, use24Hour, now),
      };

      updateWidget(widgetData);
    };

    syncWidget();
    const interval = setInterval(syncWidget, 60000);
    return () => clearInterval(interval);
  }, [alarms, locations, use24Hour, dateFormat, language, currentPlace, hasHydrated, theme]);
}
