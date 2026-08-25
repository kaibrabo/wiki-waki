// Per-alarm sound + haptic catalog, preview helpers, and the mapping to the
// notification sound name. The .wav files are bundled via the expo-notifications
// `sounds` config plugin (see app.json) so iOS can play them when an alarm fires.
//
// expo-audio and expo-haptics are NATIVE modules: they only exist in a binary
// that was rebuilt after they were added (a Metro JS reload is not enough). We
// gate every use on `requireOptionalNativeModule`, which returns null instead of
// throwing when the native side is absent, so a not-yet-rebuilt binary (or web)
// silently no-ops instead of crashing. The actual alarm sound is played by iOS
// from the bundled .wav via the notification, so it works without expo-audio.

import { requireOptionalNativeModule } from 'expo';
import type { AudioPlayer } from 'expo-audio';
import type { AlarmSound, AlarmHaptic } from '../types';

// Presence checks — evaluated once, never throw.
const HAS_AUDIO = requireOptionalNativeModule('ExpoAudio') != null;
const HAS_HAPTICS = requireOptionalNativeModule('ExpoHaptics') != null;

type SoundOption = {
  id: AlarmSound;
  label: string;
  module: number | null; // require()'d asset for preview; null = OS default (no preview)
};

// require() must be static so Metro can bundle each asset.
export const SOUND_OPTIONS: SoundOption[] = [
  { id: 'default', label: 'Default', module: null },
  { id: 'chime', label: 'Chime', module: require('../../assets/sounds/chime.wav') },
  { id: 'beacon', label: 'Beacon', module: require('../../assets/sounds/beacon.wav') },
  { id: 'radar', label: 'Radar', module: require('../../assets/sounds/radar.wav') },
  { id: 'pulse', label: 'Pulse', module: require('../../assets/sounds/pulse.wav') },
];

export const HAPTIC_OPTIONS: { id: AlarmHaptic; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'heavy', label: 'Heavy' },
];

export const DEFAULT_SOUND: AlarmSound = 'default';
export const DEFAULT_HAPTIC: AlarmHaptic = 'medium';

/**
 * The value to pass to expo-notifications `content.sound`. The OS default is the
 * string 'default'; bundled sounds are referenced by their base filename.
 */
export function notificationSoundName(sound: AlarmSound | undefined): string {
  const id = sound ?? DEFAULT_SOUND;
  return id === 'default' ? 'default' : `${id}.wav`;
}

let previewPlayer: AudioPlayer | null = null;
let audioModeSet = false;

/** Play a short preview of the given sound (no-op for the OS default or when audio isn't linked). */
export function previewSound(sound: AlarmSound): void {
  if (!HAS_AUDIO) return;
  const option = SOUND_OPTIONS.find((o) => o.id === sound);
  if (!option || option.module == null) return;
  try {
    // Safe to require now that the native module is present.
    const expoAudio = require('expo-audio') as typeof import('expo-audio');
    const { createAudioPlayer, setAudioModeAsync } = expoAudio;
    // Let previews play even when the ringer/silent switch is on (once).
    if (!audioModeSet) {
      audioModeSet = true;
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
    // Fresh one-shot player each tap — avoids reuse/seek edge cases.
    if (previewPlayer) {
      try {
        previewPlayer.remove();
      } catch {
        // ignore
      }
    }
    previewPlayer = createAudioPlayer(option.module);
    previewPlayer.play();
  } catch (e) {
    console.warn('Failed to preview sound:', e);
  }
}

/** Release the shared preview player (call when the editor closes). */
export function stopPreview(): void {
  try {
    previewPlayer?.remove();
  } catch {
    // ignore
  }
  previewPlayer = null;
}

/** Fire the given haptic once (used for both preview and foreground delivery). No-op when haptics aren't linked. */
export function playHaptic(haptic: AlarmHaptic): void {
  if (!HAS_HAPTICS || haptic === 'none') return;
  try {
    const Haptics = require('expo-haptics') as typeof import('expo-haptics');
    // impactAsync/notificationAsync return promises that reject if the native
    // side is missing — swallow both the sync throw (try/catch) and the async
    // rejection (.catch) so nothing leaks as an unhandled rejection.
    const swallow = () => {};
    switch (haptic) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(swallow);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(swallow);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(swallow);
        break;
    }
  } catch (e) {
    console.warn('Failed to play haptic:', e);
  }
}
