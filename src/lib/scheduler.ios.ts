// iOS scheduler.
//
// On iOS 26+ with AlarmKit authorized, alarms are real system alarms (ring
// through silent mode / Focus, full-screen Stop UI). We schedule a rolling
// window of each alarm's upcoming fire instants as fixed one-time AlarmKit
// alarms - fixed (not AlarmKit's device-local recurrence) so a timezone-anchored
// alarm still fires at its pinned wall-clock time wherever the user is.
//
// Otherwise we fall back to expo-notifications (a banner + one-shot sound).

import * as Notifications from 'expo-notifications';
import { DateTime } from 'luxon';
import type { Alarm } from '../types';
import type { AlarmScheduler } from './alarm';
import { nextFireInstant, upcomingFireInstants } from './schedule';
import { codeForLocation, formatLocationName } from './zones';
import { notificationSoundName } from './alarmSounds';
import { logError } from './log';
import { useStore } from '../store';
import * as AlarmKit from '../../modules/moondial-alarmkit';

/**
 * The single-line text shown when an alarm fires - the SAME string on the
 * AlarmKit full-screen alert, the notification banner, and the lock screen.
 * Format: "Work (SFO) 9/4/26" (label, location code, date in the pinned zone).
 *
 * Wrapped in try/catch and returning a plain string so it can NEVER throw into
 * the scheduler - a failure here just falls back to the bare label, and alarms
 * keep scheduling.
 */
function alarmText(alarm: Alarm, instant: DateTime): string {
  try {
    const loc = useStore.getState().locations.find((l) => l.id === alarm.locationId);
    const code = loc ? codeForLocation(loc.name, loc.ianaZone) : null;
    const locPart = code
      ? `(${code})`
      : loc
        ? formatLocationName(loc.name, loc.ianaZone)
        : '';
    const dateStr = instant.setZone(alarm.pinnedZone).toFormat('M/d/yy'); // "9/4/26"
    const text = [alarm.label.trim(), locPart, dateStr].filter(Boolean).join(' ');
    return text || alarm.label;
  } catch {
    return alarm.label;
  }
}

// Rolling window: how many future occurrences of each alarm to pre-schedule, and
// a safety cap on the total (AlarmKit is a finite system resource).
const WINDOW_PER_ALARM = 6;
const MAX_TOTAL = 60;
const RECONCILE_MS = 60_000;

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
  private usingAlarmKit = false;
  // The active reconcile fn (AlarmKit or notifications), set once init() picks a
  // path. reschedule() calls this so a just-added alarm is handed to the OS
  // immediately instead of waiting up to RECONCILE_MS for the next tick.
  private reconcileNow: (() => void) | null = null;

  permission(): 'granted' | 'denied' | 'default' | 'unsupported' {
    return 'default';
  }

  reschedule(): void {
    this.reconcileNow?.();
  }

  async requestPermission(): Promise<boolean> {
    // Prefer AlarmKit (real alarms) on iOS 26+.
    try {
      if (AlarmKit.isAvailable && (await AlarmKit.isSupported())) {
        const state = await AlarmKit.requestAuthorization();
        if (state === 'authorized') return true;
      }
    } catch (e) {
      // fall through to notifications
      logError(e, { tag: 'scheduler', extra: { at: 'requestPermission:alarmkit' } });
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowCriticalAlerts: true },
    });
    return status === 'granted';
  }

  start(getAlarms: () => Alarm[]): () => void {
    let stopped = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    // --- AlarmKit path: real ringing alarms ---
    const reconcileAlarmKit = async () => {
      try {
        await AlarmKit.cancelAll();
      } catch (e) {
        // Non-fatal: stale alarms may linger, but the reschedule below still runs.
        logError(e, { tag: 'scheduler', extra: { at: 'reconcile:cancelAll' } });
      }
      const now = DateTime.now();
      let total = 0;
      for (const alarm of getAlarms()) {
        if (!alarm.enabled) continue;
        const instants = upcomingFireInstants(alarm, now, WINDOW_PER_ALARM);
        for (const instant of instants) {
          if (total >= MAX_TOTAL) break;
          try {
            await AlarmKit.scheduleFixed(
              `${alarm.id}#${instant.toMillis()}`,
              Math.round(instant.toSeconds()),
              alarmText(alarm, instant),
              notificationSoundName(alarm.sound)
            );
            total += 1;
          } catch (e) {
            // One failure shouldn't stop the rest - but a silently dropped alarm
            // means it won't ring, so record which one and when.
            logError(e, {
              tag: 'scheduler',
              extra: { at: 'scheduleFixed', alarmId: alarm.id, fireEpoch: Math.round(instant.toSeconds()) },
            });
          }
        }
      }
    };

    // --- Fallback path: local notifications ---
    const reconcileNotifications = async () => {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const now = DateTime.now();
      for (const alarm of getAlarms()) {
        if (!alarm.enabled) continue;
        const instant = nextFireInstant(alarm, now);
        if (!instant) continue;
        const trigger = instant.toJSDate();
        if (trigger > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: alarmText(alarm, instant),
              sound: notificationSoundName(alarm.sound),
              data: { alarmId: alarm.id },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
          });
        }
      }
    };

    const init = async () => {
      let useAK = false;
      try {
        if (AlarmKit.isAvailable && (await AlarmKit.isSupported())) {
          let state = await AlarmKit.authorizationState();
          if (state === 'notDetermined') state = await AlarmKit.requestAuthorization();
          useAK = state === 'authorized';
        }
      } catch (e) {
        useAK = false;
        logError(e, { tag: 'scheduler', extra: { at: 'init:authCheck' } });
      }
      if (stopped) return;
      this.usingAlarmKit = useAK;

      if (useAK) {
        // Don't double up with notifications.
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (e) {
          logError(e, { tag: 'scheduler', extra: { at: 'init:cancelNotifications' } });
        }
      }

      const reconcile = useAK ? reconcileAlarmKit : reconcileNotifications;
      this.reconcileNow = () => {
        void reconcile();
      };
      await reconcile();
      if (!stopped) interval = setInterval(reconcile, RECONCILE_MS);
    };

    void init();

    this.stopFn = () => {
      stopped = true;
      this.reconcileNow = null;
      if (interval) clearInterval(interval);
      if (this.usingAlarmKit) {
        AlarmKit.cancelAll().catch(() => {});
      } else {
        Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      }
    };
    return this.stopFn;
  }
}

export const scheduler: AlarmScheduler = new IOSScheduler();
