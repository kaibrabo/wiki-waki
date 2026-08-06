// Web scheduler: soft browser notifications, reliable only while the app/PWA is
// open. The loud, background, wake-you-up alarm is the native (AlarmKit /
// AlarmManager) job — see scheduler.ts for the platform seam.

import { DateTime } from 'luxon';
import type { Alarm } from '../types';
import type { AlarmScheduler } from './alarm';
import { nextFireInstant, displayInZone, currentZone } from './schedule';
import { labelForZone } from './zones';

const hasNotif = typeof globalThis !== 'undefined' && 'Notification' in globalThis;

function notify(alarm: Alarm, instant: DateTime) {
  const local = displayInZone(instant, currentZone());
  const pinned = `${labelForZone(alarm.pinnedZone)} ${alarm.time}`;
  try {
    // eslint-disable-next-line no-new
    new Notification(alarm.label, {
      body: `Now · ${local} here (${pinned})`,
      tag: `${alarm.id}-${instant.toISO()}`,
    });
  } catch {
    // Some browsers require the service worker's showNotification; ignore here.
  }
}

class WebReminders implements AlarmScheduler {
  readonly canRingLoud = false;

  permission(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!hasNotif) return 'unsupported';
    return Notification.permission as 'granted' | 'denied' | 'default';
  }

  async requestPermission(): Promise<boolean> {
    if (!hasNotif) return false;
    if (Notification.permission === 'granted') return true;
    const res = await Notification.requestPermission();
    return res === 'granted';
  }

  start(getAlarms: () => Alarm[]): () => void {
    let lastCheck = DateTime.now();
    const id = setInterval(() => {
      const now = DateTime.now();
      if (this.permission() === 'granted') {
        for (const alarm of getAlarms()) {
          if (!alarm.enabled) continue;
          const inst = nextFireInstant(alarm, lastCheck);
          if (inst && inst <= now) notify(alarm, inst);
        }
      }
      lastCheck = now;
    }, 1000);
    return () => clearInterval(id);
  }
}

export const scheduler: AlarmScheduler = new WebReminders();
