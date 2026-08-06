// The platform seam. The UI talks only to this interface; M1 wires the web
// implementation (soft browser notifications). Phase 3 (iOS) will provide an
// AlarmKit-backed implementation with the same shape, without touching the UI.

import type { Alarm } from '../types';

export interface AlarmScheduler {
  /** Whether real/loud alarms are possible on this platform (false on web). */
  readonly canRingLoud: boolean;
  /** Ask the user for permission to alert. Resolves true if granted. */
  requestPermission(): Promise<boolean>;
  /** Current permission state without prompting. */
  permission(): 'granted' | 'denied' | 'default' | 'unsupported';
  /** Start delivering reminders for the given alarms; returns a stop fn. */
  start(getAlarms: () => Alarm[]): () => void;
}
