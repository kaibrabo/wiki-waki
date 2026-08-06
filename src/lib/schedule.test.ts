import { DateTime } from 'luxon';
import {
  nextFireInstant,
  displayInZone,
  workStatus,
  countdownTo,
} from './schedule';
import type { Alarm, Workday } from '../types';

const SF = 'America/Los_Angeles';
const RIO = 'America/Sao_Paulo';
const HNL = 'Pacific/Honolulu';

function daily(pinnedZone: string, time: string): Alarm {
  return { id: 'a', locationId: 'l', label: 't', time, pinnedZone, recurrence: { type: 'daily' }, enabled: true };
}

describe('pinned projection', () => {
  test('SF 09:00 work-start reads as 1:00 PM in Rio (summer, 4h ahead)', () => {
    const now = DateTime.fromISO('2026-07-16T00:00', { zone: SF });
    const fire = nextFireInstant(daily(SF, '09:00'), now)!;
    expect(displayInZone(fire, SF)).toBe('9:00 AM');
    expect(displayInZone(fire, RIO)).toBe('1:00 PM');
  });

  test('Rio 18:00 video call reads as 2:00 PM back in SF (summer)', () => {
    const now = DateTime.fromISO('2026-07-16T00:00', { zone: RIO });
    const fire = nextFireInstant(daily(RIO, '18:00'), now)!;
    expect(displayInZone(fire, RIO)).toBe('6:00 PM');
    expect(displayInZone(fire, SF)).toBe('2:00 PM');
  });
});

describe('DST is automatic via IANA zones', () => {
  test('SF 09:00 → Honolulu is 6:00 AM in summer (3h behind)', () => {
    const now = DateTime.fromISO('2026-07-16T00:00', { zone: SF });
    const fire = nextFireInstant(daily(SF, '09:00'), now)!;
    expect(displayInZone(fire, HNL)).toBe('6:00 AM');
  });

  test('SF 09:00 → Honolulu is 7:00 AM in winter (2h behind)', () => {
    const now = DateTime.fromISO('2026-01-15T00:00', { zone: SF });
    const fire = nextFireInstant(daily(SF, '09:00'), now)!;
    expect(displayInZone(fire, HNL)).toBe('7:00 AM');
  });
});

describe('recurrence', () => {
  test('weekdays alarm on Saturday fires next Monday', () => {
    const sat = DateTime.fromISO('2026-07-15T10:00', { zone: SF }).set({ weekday: 6 });
    expect(sat.weekday).toBe(6); // Saturday
    const alarm: Alarm = {
      id: 'a', locationId: 'l', label: 't', time: '09:00', pinnedZone: SF,
      recurrence: { type: 'weekdays' }, enabled: true,
    };
    const fire = nextFireInstant(alarm, sat)!;
    expect(fire.setZone(SF).weekday).toBe(1); // Monday
    expect(fire.setZone(SF).toFormat('yyyy-MM-dd')).toBe(
      sat.plus({ days: 2 }).toFormat('yyyy-MM-dd'),
    );
  });

  test('once alarm in the future fires on its date', () => {
    const now = DateTime.fromISO('2026-07-16T00:00', { zone: SF });
    const alarm: Alarm = {
      id: 'a', locationId: 'l', label: 't', time: '18:00', pinnedZone: RIO,
      recurrence: { type: 'once', date: '2026-07-20' }, enabled: true,
    };
    const fire = nextFireInstant(alarm, now)!;
    expect(fire.setZone(RIO).toFormat('yyyy-MM-dd')).toBe('2026-07-20');
    expect(displayInZone(fire, RIO)).toBe('6:00 PM');
  });

  test('once alarm in the past does not fire', () => {
    const now = DateTime.fromISO('2026-07-16T00:00', { zone: SF });
    const alarm: Alarm = {
      id: 'a', locationId: 'l', label: 't', time: '09:00', pinnedZone: SF,
      recurrence: { type: 'once', date: '2020-01-01' }, enabled: true,
    };
    expect(nextFireInstant(alarm, now)).toBeNull();
  });
});

describe('workStatus', () => {
  const wd: Workday = { zone: SF, start: '09:00', lunchStart: '12:00', lunchEnd: '13:00', end: '17:00' };
  const wed = (hhmm: string) =>
    DateTime.fromISO(`2026-07-15T${hhmm}`, { zone: SF }).set({ weekday: 3 }); // Wednesday

  test('working mid-morning', () => expect(workStatus(wd, wed('10:00'))).toBe('working'));
  test('lunch at 12:30', () => expect(workStatus(wd, wed('12:30'))).toBe('lunch'));
  test('off in the evening', () => expect(workStatus(wd, wed('19:00'))).toBe('off'));
  test('off before work', () => expect(workStatus(wd, wed('07:00'))).toBe('off'));
  test('off on weekend', () => {
    const sat = DateTime.fromISO('2026-07-15T10:00', { zone: SF }).set({ weekday: 6 });
    expect(workStatus(wd, sat)).toBe('off');
  });
});

describe('countdownTo', () => {
  test('formats hours and minutes', () => {
    const now = DateTime.fromISO('2026-07-16T09:00', { zone: SF });
    expect(countdownTo(now.plus({ hours: 3, minutes: 12 }), now)).toBe('in 3h 12m');
    expect(countdownTo(now.plus({ minutes: 45 }), now)).toBe('in 45m');
    expect(countdownTo(now.plus({ seconds: 20 }), now)).toBe('in 20s');
  });
});
