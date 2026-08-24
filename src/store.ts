// App state: locations, alarms, and the home workday. Local-first, persisted via
// AsyncStorage (which is backed by localStorage on web). Default state IS the
// seed, so a fresh install starts with San Francisco + a standard workday.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Alarm, Location, Recurrence } from './types';
import type { Language } from './lib/i18n';
import { shouldUse24Hour } from './lib/i18n';

const OLD_STORE_KEY = 'anchor-store-v2';
const NEW_STORE_KEY = 'moondial-store-v1';

// Migration: convert old 'anchorZone' field to 'pinnedZone' for existing user data
function migrateAlarms(alarms: unknown[]): Alarm[] {
  return alarms.map((a: unknown) => {
    const alarm = a as Record<string, unknown>;
    if ('anchorZone' in alarm && !('pinnedZone' in alarm)) {
      const { anchorZone, ...rest } = alarm;
      return { ...rest, pinnedZone: anchorZone } as Alarm;
    }
    return alarm as Alarm;
  });
}

// One-time migration from old storage key to new one (runs before store hydrates)
export async function migrateFromAnchorStore(): Promise<void> {
  try {
    const newData = await AsyncStorage.getItem(NEW_STORE_KEY);
    if (newData) return; // Already migrated or fresh install

    const oldData = await AsyncStorage.getItem(OLD_STORE_KEY);
    if (!oldData) return; // No old data to migrate

    // Parse and migrate the old data
    const parsed = JSON.parse(oldData);
    if (parsed?.state?.alarms) {
      parsed.state.alarms = migrateAlarms(parsed.state.alarms);
    }
    parsed.version = 1; // Set version for new store format

    // Write to new key and remove old key
    await AsyncStorage.setItem(NEW_STORE_KEY, JSON.stringify(parsed));
    await AsyncStorage.removeItem(OLD_STORE_KEY);
  } catch {
    // Migration failed silently - user will get fresh seed data
  }
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const HOME_ZONE = 'America/Los_Angeles';

const DEFAULT_LABEL_OPTIONS = ['Wake', 'Work', 'Appt'];

const SEED_LOCATIONS: Location[] = [
  { id: 'home', name: 'San Francisco, CA, USA', ianaZone: HOME_ZONE, isHome: true, order: 0 },
];

const weekdays: Recurrence = { type: 'weekdays' };

const SEED_ALARMS: Alarm[] = [
  { id: 'seed-start', locationId: 'home', label: 'Start work', time: '09:00', pinnedZone: HOME_ZONE, recurrence: weekdays, enabled: true },
  { id: 'seed-lunch', locationId: 'home', label: 'Lunch', time: '12:00', pinnedZone: HOME_ZONE, recurrence: weekdays, enabled: true },
  { id: 'seed-back', locationId: 'home', label: 'Back from lunch', time: '13:00', pinnedZone: HOME_ZONE, recurrence: weekdays, enabled: true },
  { id: 'seed-end', locationId: 'home', label: 'End work', time: '17:00', pinnedZone: HOME_ZONE, recurrence: weekdays, enabled: true },
];

export type ThemePref = 'light' | 'dark' | 'system';

export type LastAlarmSettings = {
  label: string;
  time: string;
  recType: 'daily' | 'weekdays' | 'none' | 'custom' | 'monthly' | 'yearly';
  selectedDays: number[];
};

type State = {
  hasHydrated: boolean;
  themePref: ThemePref;
  use24Hour: boolean;
  use24HourManuallySet: boolean;
  language: Language;
  notificationPromptDismissed: boolean;
  lastAlarmSettings: LastAlarmSettings;
  locations: Location[];
  alarms: Alarm[];
  labelOptions: string[];

  setThemePref: (pref: ThemePref) => void;
  setUse24Hour: (use24: boolean) => void;
  setLanguage: (lang: Language) => void;
  dismissNotificationPrompt: () => void;
  setLastAlarmSettings: (settings: Partial<LastAlarmSettings>) => void;

  addLocation: (name: string, ianaZone: string) => void;
  removeLocation: (id: string) => void;
  toggleLocationDisabled: (id: string) => void;
  toggleHome: (id: string) => void;

  addAlarm: (alarm: Omit<Alarm, 'id'>) => void;
  updateAlarm: (id: string, patch: Partial<Omit<Alarm, 'id'>>) => void;
  toggleAlarm: (id: string) => void;
  removeAlarm: (id: string) => void;

  addLabelOption: (label: string) => void;
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      hasHydrated: false,
      themePref: 'system',
      use24Hour: false,
      use24HourManuallySet: false,
      language: 'en' as Language,
      notificationPromptDismissed: false,
      lastAlarmSettings: {
        label: 'Wake',
        time: '09:00',
        recType: 'weekdays',
        selectedDays: [1, 2, 3, 4, 5],
      },
      locations: SEED_LOCATIONS,
      alarms: SEED_ALARMS,
      labelOptions: DEFAULT_LABEL_OPTIONS,

      setThemePref: (pref) => set({ themePref: pref }),
      setUse24Hour: (use24) => set({ use24Hour: use24, use24HourManuallySet: true }),
      setLanguage: (lang) => set((s) => ({ 
        language: lang, 
        use24Hour: s.use24HourManuallySet ? s.use24Hour : shouldUse24Hour(lang) 
      })),
      dismissNotificationPrompt: () => set({ notificationPromptDismissed: true }),
      setLastAlarmSettings: (settings) => set((s) => ({ 
        lastAlarmSettings: { ...s.lastAlarmSettings, ...settings } 
      })),

      addLocation: (name, ianaZone) =>
        set((s) => {
          if (s.locations.some((l) => l.name === name)) return s; // no duplicate city
          const order = s.locations.reduce((m, l) => Math.max(m, l.order), -1) + 1;
          return {
            locations: [...s.locations, { id: uid(), name, ianaZone, isHome: false, order }],
          };
        }),

      removeLocation: (id) =>
        set((s) => {
          const loc = s.locations.find((l) => l.id === id);
          if (!loc || loc.isHome) return s; // never remove home
          return {
            locations: s.locations.filter((l) => l.id !== id),
            alarms: s.alarms.filter((a) => a.locationId !== id), // drop its alarms too
          };
        }),

      toggleLocationDisabled: (id) =>
        set((s) => ({
          locations: s.locations.map((l) =>
            l.id === id ? { ...l, disabled: !l.disabled } : l
          ),
        })),

      toggleHome: (id) =>
        set((s) => ({
          locations: s.locations.map((l) =>
            l.id === id ? { ...l, isHome: !l.isHome } : l
          ),
        })),

      addAlarm: (alarm) => set((s) => ({ alarms: [...s.alarms, { ...alarm, id: uid() }] })),

      updateAlarm: (id, patch) =>
        set((s) => ({ alarms: s.alarms.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

      toggleAlarm: (id) =>
        set((s) => ({ alarms: s.alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)) })),

      removeAlarm: (id) => set((s) => ({ alarms: s.alarms.filter((a) => a.id !== id) })),

      addLabelOption: (label) =>
        set((s) => {
          if (s.labelOptions.includes(label)) return s;
          return { labelOptions: [...s.labelOptions, label] };
        }),
    }),
    {
      name: NEW_STORE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ locations, alarms, themePref, use24Hour, use24HourManuallySet, language, labelOptions, notificationPromptDismissed, lastAlarmSettings }) => ({ locations, alarms, themePref, use24Hour, use24HourManuallySet, language, labelOptions, notificationPromptDismissed, lastAlarmSettings }),
      migrate: (persisted: unknown, version: number) => {
        // Migrate from anchor-store-v2 format (anchorZone -> pinnedZone)
        const data = persisted as { alarms?: unknown[] } | null;
        if (data?.alarms) {
          data.alarms = migrateAlarms(data.alarms);
        }
        return data as State;
      },
      version: 1,
      onRehydrateStorage: () => (state) => {
        useStore.setState({ hasHydrated: true });
        void state;
      },
    },
  ),
);
