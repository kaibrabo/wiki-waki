// Core domain types for Moondial.
//
// The key idea: every Alarm carries a `pinnedZone` (an IANA timezone). The
// alarm's `time` is a wall-clock time *in that zone*. So "Start work" pinned
// to America/Los_Angeles at 09:00 resolves to a real instant that, viewed from
// Rio, reads as 1:00 PM. Alarms are stored once and projected into every
// location card.

export type Recurrence =
  | { type: 'daily' }
  | { type: 'weekdays' } // Mon-Fri
  | { type: 'weekly'; days: number[] } // 0=Sun .. 6=Sat
  | { type: 'once'; date: string } // YYYY-MM-DD (in the pinned zone)
  | { type: 'monthly'; dayOfMonth: number } // 1-31
  | { type: 'yearly'; month: number; dayOfMonth: number }; // month 1-12, day 1-31

export type Alarm = {
  id: string;
  locationId: string; // the location that owns this alarm; shown only there
  label: string;
  time: string; // "HH:mm" wall-clock in pinnedZone
  pinnedZone: string; // IANA zone the alarm rings by - always its owner location's zone
  recurrence: Recurrence;
  enabled: boolean;
};

export type Location = {
  id: string;
  name: string; // display name, e.g. "Rio de Janeiro"
  ianaZone: string; // IANA zone, e.g. "America/Sao_Paulo"
  isHome: boolean;
  order: number;
  disabled?: boolean; // if true, all alarms for this location are silenced
};
