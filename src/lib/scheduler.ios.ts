// iOS scheduler: uses expo-notifications for local notifications.
// For iOS 26+, AlarmKit could provide true "alarm" functionality,
// but expo-notifications works well for most use cases.

import * as Notifications from 'expo-notifications';
import { DateTime } from 'luxon';
import type { Alarm } from '../types';
import type { AlarmScheduler } from './alarm';
import { nextFireInstant, displayInZone, currentZone } from './schedule';
import { labelForZone } from './zones';
import { notificationSoundName } from './alarmSounds';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class IOSScheduler implements AlarmScheduler {
  readonly canRingLoud = true;
  private stopFn: (() => void) | null = null;

  permission(): 'granted' | 'denied' | 'default' | 'unsupported' {
    return 'default';
  }

  async requestPermission(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;
    
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowSound: true,
        allowCriticalAlerts: true, // For alarm-like behavior
      },
    });
    return status === 'granted';
  }

  start(getAlarms: () => Alarm[]): () => void {
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
        
        if (trigger > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: alarm.label,
              body: `${local} here (${pinned})`,
              sound: notificationSoundName(alarm.sound),
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
    
    scheduleAlarms();

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

export const scheduler: AlarmScheduler = new IOSScheduler();
