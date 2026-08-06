import type { AlarmScheduler } from './alarm';

// Native default scheduler (used by iOS/Android until real alarm modules land).
// Metro resolves platform-specific overrides at bundle time:
//   scheduler.web.ts     → soft browser notifications (implemented)
//   scheduler.android.ts → Android AlarmManager        (next: real alarms)
//   scheduler.ios.ts     → iOS AlarmKit, iOS 26+        (deferred)
// This base is what TypeScript resolves for `./scheduler`, and the fallback for
// any platform without an override. It performs no scheduling.
class NoopScheduler implements AlarmScheduler {
  readonly canRingLoud = false;
  permission() {
    return 'unsupported' as const;
  }
  async requestPermission() {
    return false;
  }
  start() {
    return () => {};
  }
}

export const scheduler: AlarmScheduler = new NoopScheduler();
