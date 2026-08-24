import { NativeModules, Platform } from 'react-native';

// Type definitions for widget data
export interface WidgetAlarmData {
  label: string;
  time: string;
  locationName: string;
  timezone: string;
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

const APP_GROUP = 'group.com.kaibrabo.moondial';
const WIDGET_DATA_KEY = 'widgetData';

/**
 * Updates the widget with current alarm and location data.
 * On iOS, this writes to the App Group shared UserDefaults.
 * On Android, this is a no-op (widgets not yet implemented).
 */
export async function updateWidget(data: WidgetData): Promise<void> {
  if (Platform.OS !== 'ios') {
    // Android widget support not implemented yet
    return;
  }

  try {
    // Use expo-secure-store or react-native-mmkv with App Group support
    // For now, we'll use a native module approach
    const { SharedGroupPreferences } = NativeModules;
    
    if (SharedGroupPreferences) {
      await SharedGroupPreferences.setItem(
        WIDGET_DATA_KEY,
        JSON.stringify(data),
        APP_GROUP
      );
      
      // Trigger widget refresh
      if (NativeModules.WidgetKit) {
        NativeModules.WidgetKit.reloadAllTimelines();
      }
    }
  } catch (error) {
    console.warn('Failed to update widget:', error);
  }
}

/**
 * Reloads all widget timelines to refresh their data.
 */
export async function reloadWidgets(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    if (NativeModules.WidgetKit) {
      NativeModules.WidgetKit.reloadAllTimelines();
    }
  } catch (error) {
    console.warn('Failed to reload widgets:', error);
  }
}
