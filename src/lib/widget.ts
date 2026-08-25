import { Platform } from 'react-native';
import { setWidgetData, reloadAllTimelines } from '../../modules/moondial-widget';

// Type definitions for widget data. These mirror the Codable structs in
// ios/MoondialWidgetExtension/MoondialWidget.swift — keep the two in sync.

export interface WidgetAlarmData {
  label: string;
  time: string; // wall-clock time in the alarm's pinned zone, pre-formatted
  locationName: string;
  code: string; // location/airport code like "SFO" (may be empty)
  timezone: string;
  fireEpoch: number; // Unix seconds of the next fire instant — powers the live countdown
  enabled: boolean;
}

export interface WidgetLocationData {
  name: string;
  timezone: string;
  currentTime: string;
}

// Localized UI strings so the widget follows the app's language setting.
export interface WidgetStrings {
  next: string;
  saved: string;
  noAlarms: string;
}

export interface WidgetData {
  nextAlarm: WidgetAlarmData | null;
  upcomingAlarms: WidgetAlarmData[]; // the next few alarms (queue), soonest first
  currentTime: string;
  use24Hour: boolean; // so the widget's live clock can honor the app's 12/24h setting
  currentDate: string; // current date, pre-formatted per the app's date-format setting
  currentTimezone: string;
  currentLocationName: string; // display name of the location at the current timezone
  theme: 'light' | 'dark'; // the app's effective theme, so the widget can match it
  strings: WidgetStrings; // localized UI labels
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
