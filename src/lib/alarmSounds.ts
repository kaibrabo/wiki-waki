// Per-alarm sound + haptic catalog, preview helpers, and the mapping to the
// notification sound name. The .wav files are bundled via the expo-notifications
// `sounds` config plugin (see app.json) so iOS can play them when an alarm fires.
//
// expo-audio and expo-haptics are native modules. They're loaded lazily and
// defensively here: if the running binary predates their install (a native
// rebuild is needed) or on web, preview/haptics degrade to no-ops instead of
// crashing the app. The actual alarm sound is played by iOS from the bundled
// .wav, so it works regardless of expo-audio.

import { Platform } from 'react-native';
import type { AudioPlayer } from 'expo-audio';
import type { AlarmSound, AlarmHaptic } from '../types';

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
  { id: 'success', label: 'Success' },
];

export const DEFAULT_SOUND: AlarmSound = 'default';
export const DEFAULT_HAPTIC: AlarmHaptic = 'medium';

// Lazy, guarded native-module access — never throws at import time.
function getAudio(): typeof import('expo-audio') | null {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-audio');
  } catch {
    return null;
  }
}

function getHaptics(): typeof import('expo-haptics') | null {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-haptics');
  } catch {
    return null;
  }
}

/**
 * The value to pass to expo-notifications `content.sound`. The OS default is the
 * string 'default'; bundled sounds are referenced by their base filename.
 */
export function notificationSoundName(sound: AlarmSound | undefined): string {
  const id = sound ?? DEFAULT_SOUND;
  return id === 'default' ? 'default' : `${id}.wav`;
}

let previewPlayer: AudioPlayer | null = null;

/** Play a short preview of the given sound (no-op for the OS default or if audio is unavailable). */
export function previewSound(sound: AlarmSound): void {
  const option = SOUND_OPTIONS.find((o) => o.id === sound);
  if (!option || option.module == null) return;
  const audio = getAudio();
  if (!audio) return;
  try {
    if (previewPlayer) {
      previewPlayer.replace(option.module);
    } else {
      previewPlayer = audio.createAudioPlayer(option.module);
    }
    previewPlayer.seekTo(0);
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

/** Fire the given haptic once (used for both preview and foreground delivery). */
export function playHaptic(haptic: AlarmHaptic): void {
  if (haptic === 'none') return;
  const H = getHaptics();
  if (!H) return;
  try {
    switch (haptic) {
      case 'light':
        H.impactAsync(H.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        H.impactAsync(H.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        H.impactAsync(H.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        H.notificationAsync(H.NotificationFeedbackType.Success);
        break;
    }
  } catch (e) {
    console.warn('Failed to play haptic:', e);
  }
}
