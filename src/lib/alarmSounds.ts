// Per-alarm sound catalog, preview helper, and the mapping to the notification
// sound name. The .wav files are bundled via the expo-notifications `sounds`
// config plugin (see app.json) so iOS can play them when an alarm fires.
//
// expo-audio is a native module, loaded lazily and gated on
// requireOptionalNativeModule so a binary that predates it (or web) degrades to
// a silent no-op instead of crashing. The actual alarm sound is played by iOS
// from the bundled .wav, so it works even without expo-audio.

import { requireOptionalNativeModule } from 'expo';
import type { AudioPlayer } from 'expo-audio';
import type { AlarmSound } from '../types';

const HAS_AUDIO = requireOptionalNativeModule('ExpoAudio') != null;

type SoundOption = {
  id: AlarmSound;
  label: string;
  module: number; // require()'d asset for preview + bundling
};

// require() must be static so Metro can bundle each asset.
export const SOUND_OPTIONS: SoundOption[] = [
  { id: 'chime', label: 'Chime', module: require('../../assets/sounds/chime.wav') },
  { id: 'beacon', label: 'Beacon', module: require('../../assets/sounds/beacon.wav') },
  { id: 'radar', label: 'Radar', module: require('../../assets/sounds/radar.wav') },
  { id: 'pulse', label: 'Pulse', module: require('../../assets/sounds/pulse.wav') },
  { id: 'reveille', label: 'Reveille', module: require('../../assets/sounds/reveille.wav') },
];

export const DEFAULT_SOUND: AlarmSound = 'chime';

/** Coerce any persisted/legacy value (undefined, old 'default', etc.) to a valid sound. */
export function coerceSound(sound: AlarmSound | string | undefined): AlarmSound {
  return SOUND_OPTIONS.some((o) => o.id === sound) ? (sound as AlarmSound) : DEFAULT_SOUND;
}

/** The base filename to pass to expo-notifications `content.sound`. */
export function notificationSoundName(sound: AlarmSound | undefined): string {
  return `${coerceSound(sound)}.wav`;
}

let previewPlayer: AudioPlayer | null = null;
let previewTimeout: ReturnType<typeof setTimeout> | null = null;
let audioModeSet = false;

// Previews are capped so tapping through the list is quick; Reveille (a real
// ~21s bugle call) is exempt and plays to the end.
const PREVIEW_MAX_MS = 5000;

/** Immediately stop and release any currently-playing preview. */
function releasePreview(): void {
  if (previewTimeout) {
    clearTimeout(previewTimeout);
    previewTimeout = null;
  }
  if (previewPlayer) {
    try {
      previewPlayer.pause();
    } catch {
      // ignore
    }
    try {
      previewPlayer.remove();
    } catch {
      // ignore
    }
    previewPlayer = null;
  }
}

/** Play a short preview of the given sound (no-op when audio isn't linked). */
export function previewSound(sound: AlarmSound): void {
  if (!HAS_AUDIO) return;
  const option = SOUND_OPTIONS.find((o) => o.id === sound);
  if (!option) return;
  // Stop whatever is currently previewing, immediately.
  releasePreview();
  try {
    const expoAudio = require('expo-audio') as typeof import('expo-audio');
    const { createAudioPlayer, setAudioModeAsync } = expoAudio;
    // Let previews play even when the ringer/silent switch is on (once).
    if (!audioModeSet) {
      audioModeSet = true;
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
    previewPlayer = createAudioPlayer(option.module);
    previewPlayer.play();
    // Cap every sound except Reveille at 5s.
    if (sound !== 'reveille') {
      previewTimeout = setTimeout(releasePreview, PREVIEW_MAX_MS);
    }
  } catch (e) {
    console.warn('Failed to preview sound:', e);
  }
}

/** Release the shared preview player (call when the editor closes). */
export function stopPreview(): void {
  releasePreview();
}
