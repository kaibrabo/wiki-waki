// Pure timezone/scheduling logic. No React, no storage - fully unit-testable.
//
// Luxon does all DST math for us: because alarms are pinned to IANA zone
// names (not fixed offsets), "America/Los_Angeles" observes DST while
// "Pacific/Honolulu" does not, so the SF↔Hawaii gap is automatically 3h in
// summer and 2h in winter without us tracking anything.

import { DateTime } from 'luxon';
import type { Alarm, Recurrence } from '../types';

/** Parse "HH:mm" into [hour, minute]. */
function parseHM(hhmm: string): [number, number] {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return [h || 0, m || 0];
}

/** Luxon weekday (1=Mon..7=Sun) → JS day (0=Sun..6=Sat). */
function jsDay(luxonWeekday: number): number {
  return luxonWeekday === 7 ? 0 : luxonWeekday;
}

function matchesRecurrence(candidate: DateTime, recurrence: Recurrence): boolean {
  switch (recurrence.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return candidate.weekday >= 1 && candidate.weekday <= 5;
    case 'weekly':
      return recurrence.days.includes(jsDay(candidate.weekday));
    case 'once':
      return candidate.toFormat('yyyy-MM-dd') === recurrence.date;
  }
}

/**
 * The next instant at or after `now` when this alarm fires. The alarm's `time`
 * is a wall-clock time in `alarm.pinnedZone`; the returned DateTime is a real
 * instant (carried in the pinned zone) that can be re-displayed in any zone.
 * Returns null for a 'once' alarm whose date/time has already passed.
 */
export function nextFireInstant(alarm: Alarm, now: DateTime = DateTime.now()): DateTime | null {
  const [hour, minute] = parseHM(alarm.time);
  const nowZ = now.setZone(alarm.pinnedZone);

  if (alarm.recurrence.type === 'once') {
    const target = DateTime.fromISO(`${alarm.recurrence.date}T${alarm.time}`, {
      zone: alarm.pinnedZone,
    }).set({ second: 0, millisecond: 0 });
    return target.isValid && target >= now ? target : null;
  }

  // Scan up to 8 days ahead to cover weekly recurrences.
  for (let i = 0; i < 8; i++) {
    const candidate = nowZ
      .plus({ days: i })
      .set({ hour, minute, second: 0, millisecond: 0 });
    if (candidate >= now && matchesRecurrence(candidate, alarm.recurrence)) {
      return candidate;
    }
  }
  return null;
}

/** Format an instant as local wall-clock in the given zone, e.g. "6:00 AM". */
export function displayInZone(instant: DateTime, ianaZone: string): string {
  return instant.setZone(ianaZone).toFormat('h:mm a');
}

/**
 * The same alarm's next fire, shown across several zones. Powers the
 * "1:00 PM Rio / 9:00 AM SF" equivalents. Returns [] if the alarm won't fire.
 */
export function alarmEquivalents(
  alarm: Alarm,
  zones: string[],
  now: DateTime = DateTime.now(),
): { zone: string; time: string }[] {
  const instant = nextFireInstant(alarm, now);
  if (!instant) return [];
  return zones.map((zone) => ({ zone, time: displayInZone(instant, zone) }));
}

/** The device's current IANA timezone — the "active" location where alarms ring. */
export function currentZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** The soonest upcoming enabled alarm across a list, or null if none fire. */
export function nextUpcoming(
  alarms: Alarm[],
  now: DateTime = DateTime.now(),
): { alarm: Alarm; instant: DateTime } | null {
  let best: { alarm: Alarm; instant: DateTime } | null = null;
  for (const alarm of alarms) {
    if (!alarm.enabled) continue;
    const instant = nextFireInstant(alarm, now);
    if (instant && (!best || instant < best.instant)) best = { alarm, instant };
  }
  return best;
}

/** Short human label for a recurrence, e.g. "Weekdays" or "Jul 20". */
export function recurrenceLabel(recurrence: Recurrence): string {
  switch (recurrence.type) {
    case 'daily':
      return 'Every day';
    case 'weekdays':
      return 'Weekdays';
    case 'weekly': {
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return recurrence.days.map((d) => names[d]).join(' ') || 'Weekly';
    }
    case 'once':
      return DateTime.fromISO(recurrence.date).toFormat('LLL d');
  }
}

/** Human-readable countdown to an instant, e.g. "in 3h 12m" or "in 45s". */
export function countdownTo(instant: DateTime, now: DateTime = DateTime.now()): string {
  const diff = instant.diff(now, ['hours', 'minutes', 'seconds']);
  const h = Math.floor(diff.hours);
  const m = Math.floor(diff.minutes);
  const s = Math.floor(diff.seconds);
  if (h > 0) return `in ${h}h ${m}m`;
  if (m > 0) return `in ${m}m`;
  return `in ${Math.max(s, 0)}s`;
}

/** Get all upcoming enabled alarms sorted by fire time. */
export function allUpcomingAlarms(
  alarms: Alarm[],
  now: DateTime = DateTime.now(),
): { alarm: Alarm; instant: DateTime }[] {
  const upcoming: { alarm: Alarm; instant: DateTime }[] = [];
  for (const alarm of alarms) {
    if (!alarm.enabled) continue;
    const instant = nextFireInstant(alarm, now);
    if (instant) upcoming.push({ alarm, instant });
  }
  return upcoming.sort((a, b) => a.instant.toMillis() - b.instant.toMillis());
}
