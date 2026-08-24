// JS interface for the MoondialWidget native module.
//
// The native module is iOS-only (it writes to the App Group shared container and
// reloads WidgetKit timelines). On Android/web `requireOptionalNativeModule`
// returns null, so every call becomes a safe no-op.

import { requireOptionalNativeModule } from 'expo';

const MoondialWidget = requireOptionalNativeModule<{
  setWidgetData: (json: string) => void;
  reloadAllTimelines: () => void;
}>('MoondialWidget');

/** Write the widget payload (JSON string) into the App Group shared UserDefaults. */
export function setWidgetData(json: string): void {
  MoondialWidget?.setWidgetData(json);
}

/** Ask WidgetKit to refresh every widget timeline now. */
export function reloadAllTimelines(): void {
  MoondialWidget?.reloadAllTimelines();
}

/** True when the native module is present (iOS with the widget extension built in). */
export const isAvailable = MoondialWidget != null;
