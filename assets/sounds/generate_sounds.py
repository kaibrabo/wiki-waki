#!/usr/bin/env python3
"""Synthesize Moondial's alarm tones as 16-bit PCM WAV files.

These are original, royalty-free placeholder tones (Apple's alarm sounds are
copyrighted). Swap in real audio by dropping same-named .wav files here and
re-running `expo prebuild` so expo-notifications re-bundles them.

Run: python3 assets/sounds/generate_sounds.py
"""
import math
import struct
import wave

SR = 44100  # sample rate


def envelope(i, n, attack=0.01, release=0.25):
    """Simple attack/release amplitude envelope in [0, 1]."""
    t = i / SR
    dur = n / SR
    a = min(1.0, t / attack) if attack > 0 else 1.0
    r = min(1.0, (dur - t) / release) if release > 0 else 1.0
    return max(0.0, min(a, r))


def tone(freqs, dur, amp=0.6, harmonics=(1.0, 0.3, 0.12)):
    """A blended sine tone (with a few harmonics) for `dur` seconds."""
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        s = 0.0
        for f in freqs:
            for h, ha in enumerate(harmonics, start=1):
                s += ha * math.sin(2 * math.pi * f * h * t)
        s *= amp / (len(freqs) * sum(harmonics))
        out.append(s * envelope(i, n))
    return out


def silence(dur):
    return [0.0] * int(SR * dur)


def sweep(f0, f1, dur, amp=0.6):
    """Linear frequency sweep (radar-ping character)."""
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        f = f0 + (f1 - f0) * (t / dur)
        out.append(amp * math.sin(2 * math.pi * f * t) * envelope(i, n, 0.005, 0.15))
    return out


def write_wav(name, samples):
    frames = bytearray()
    for s in samples:
        v = int(max(-1.0, min(1.0, s)) * 32767)
        frames += struct.pack('<h', v)
    with wave.open(name, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(bytes(frames))
    print(f"wrote {name} ({len(samples) / SR:.1f}s)")


# chime: gentle ascending bell arpeggio (C5, E5, G5, C6)
chime = []
for f in (523.25, 659.25, 783.99, 1046.50):
    chime += tone([f], 0.5, amp=0.5)
write_wav('chime.wav', chime)

# beacon: insistent two-note beep-beep, repeated
beacon = []
for _ in range(3):
    beacon += tone([880.0], 0.16, amp=0.7, harmonics=(1.0, 0.0))
    beacon += silence(0.08)
    beacon += tone([1174.66], 0.16, amp=0.7, harmonics=(1.0, 0.0))
    beacon += silence(0.22)
write_wav('beacon.wav', beacon)

# radar: repeated rising ping
radar = []
for _ in range(4):
    radar += sweep(600, 1400, 0.22, amp=0.6)
    radar += silence(0.18)
write_wav('radar.wav', radar)

# pulse: steady pulsing low-mid tone
pulse = []
for _ in range(6):
    pulse += tone([440.0], 0.18, amp=0.6, harmonics=(1.0, 0.25))
    pulse += silence(0.12)
write_wav('pulse.wav', pulse)
