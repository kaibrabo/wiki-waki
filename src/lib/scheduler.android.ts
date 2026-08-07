// Android scheduler: uses expo-notifications with AlarmManager for exact alarms.
// These alarms will wake the device and ring even when the app is closed.

import * as Notifications from 'expo-notifications';
import { DateTime } from 'luxon';
import type { Alarm } from '../types';
import type { AlarmScheduler } from './alarm';
import { nextFireInstant, displayInZone, currentZone } from './schedule';
import { labelForZone } from './zones';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

class AndroidScheduler implements AlarmScheduler {
  readonly canRingLoud = true;
  private stopFn: (() => void) | null = null;

  permission(): 'granted' | 'denied' | 'default' | 'unsupported' {
    // We check this synchronously from cached state; actual check is async
    return 'default';
  }

  async requestPermission(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;
    
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  start(getAlarms: () => Alarm[]): () => void {
    // Cancel any existing scheduled notifications
    Notifications.cancelAllScheduledNotificationsAsync();
    
    // Schedule all enabled alarms
    const scheduleAlarms = async () => {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      const now = DateTime.now();
      const alarms = getAlarms();
      
      for (const alarm of alarms) {
        if (!alarm.enabled) continue;
        
        const instant = nextFireInstant(alarm, now);
        if (!instant) continue;
        
        const local = displayInZone(instant, currentZone());
        const pinned = `${labelForZone(alarm.pinnedZone)} ${alarm.time}`;
        
        const trigger = instant.toJSDate();
        
        // Only schedule if in the future
        if (trigger > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: alarm.label,
              body: `${local} here (${pinned})`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.MAX,
              data: { alarmId: alarm.id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: trigger,
            },
          });
        }
      }
    };
    
    // Initial schedule
    scheduleAlarms();
    
    // Re-schedule every minute to handle recurring alarms
    const interval = setInterval(() => {
      scheduleAlarms();
    }, 60000);
    
    this.stopFn = () => {
      clearInterval(interval);
      Notifications.cancelAllScheduledNotificationsAsync();
    };
    
    return this.stopFn;
  }
}

export const scheduler: AlarmScheduler = new AndroidScheduler();
