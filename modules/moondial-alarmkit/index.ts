// JS interface for the MoondialAlarmKit native module (iOS 26+ AlarmKit).
// Absent on iOS < 26, Android, and web -> callers should fall back to the
// expo-notifications scheduler.

import { requireOptionalNativeModule } from 'expo';

type Native = {
  isSupported: () => Promise<boolean>;
  requestAuthorization: () => Promise<string>; // 'authorized' | 'denied' | 'notDetermined' | 'unsupported'
  authorizationState: () => Promise<string>;
  scheduleFixed: (id: string, epochSeconds: number, title: string, soundName: string | null) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  cancelAll: () => Promise<void>;
};

const M = requireOptionalNativeModule<Native>('MoondialAlarmKit');

/** True when the native module is present in this binary (iOS build with the module). */
export const isAvailable = M != null;

/** True when the OS actually supports AlarmKit (iOS 26+). */
export async function isSupported(): Promise<boolean> {
  return (await M?.isSupported()) ?? false;
}

export async function requestAuthorization(): Promise<string> {
  return (await M?.requestAuthorization()) ?? 'unsupported';
}

export async function authorizationState(): Promise<string> {
  return (await M?.authorizationState()) ?? 'unsupported';
}

/** Schedule a one-time alarm at an absolute instant (Unix seconds). */
export async function scheduleFixed(
  id: string,
  epochSeconds: number,
  title: string,
  soundName: string | null = null
): Promise<void> {
  await M?.scheduleFixed(id, epochSeconds, title, soundName);
}

export async function cancel(id: string): Promise<void> {
  await M?.cancel(id);
}

/** Cancel every AlarmKit alarm this app scheduled (used to reconcile). */
export async function cancelAll(): Promise<void> {
  await M?.cancelAll();
}
