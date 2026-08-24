import { Platform } from 'react-native';
import { setWidgetData, reloadAllTimelines } from '../../modules/moondial-widget';

// Type definitions for widget data. These mirror the Codable structs in
// ios/MoondialWidgetExtension/MoondialWidget.swift — keep the two in sync.

export interface WidgetAlarmData {
  label: string;
  time: string; // wall-clock time in the alarm's pinned zone, pre-formatted
  locationName: string;
  timezone: string;
  fireEpoch: number; // Unix seconds of the next fire instant — powers the live countdown
  enabled: boolean;
}

export interface WidgetLocationData {
  name: string;
  timezone: string;
  currentTime: string;
}

export interface WidgetData {
  nextAlarm: WidgetAlarmData | null;
  currentTime: string;
  currentTimezone: string;
  locations: WidgetLocationData[];
}

/**
 * Writes the widget payload into the App Group shared container (iOS) and asks
 * WidgetKit to refresh. No-op on Android/web, where the native module is absent.
 */
export function updateWidget(data: WidgetData): void {
  if (Platform.OS !== 'ios') return;
  try {
    setWidgetData(JSON.stringify(data));
    reloadAllTimelines();
  } catch (error) {
    console.warn('Failed to update widget:', error);
  }
}

/** Reloads all widget timelines to refresh their data. */
export function reloadWidgets(): void {
  if (Platform.OS !== 'ios') return;
  try {
    reloadAllTimelines();
  } catch (error) {
    console.warn('Failed to reload widgets:', error);
  }
}
