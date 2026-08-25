#!/usr/bin/env python3
"""Synthesize a ~20s brass bugle rendition of "Reveille" (a traditional,
public-domain U.S. military bugle call). Original synthesis - no third-party
audio - so there's no licensing risk. Bugles only sound the harmonic series,
so the melody uses just G4/C5/E5/G5/C6.

Run: python3 assets/sounds/generate_reveille.py
"""
import math
import struct
import wave

SR = 44100
TARGET_SECONDS = 20.0

# Bugle (harmonic-series) pitches.
N = {
    'G4': 392.00, 'C5': 523.25, 'E5': 659.25, 'G5': 783.99, 'C6': 1046.50, 'R': 0.0,
}

# Reveille-style melody as (note, beats). Rising G-C-E-G triplet calls with the
# characteristic dotted "wake-up" bounce.
MELODY = [
    ('G4', 0.5), ('C5', 0.5), ('E5', 1.0),
    ('C5', 0.5), ('E5', 0.5), ('G5', 1.0),
    ('E5', 0.5), ('C5', 0.5), ('G4', 1.0),
    ('C5', 1.5), ('R', 0.5),

    ('G4', 0.5), ('C5', 0.5), ('E5', 1.0),
    ('C5', 0.5), ('E5', 0.5), ('G5', 1.0),
    ('E5', 0.5), ('G5', 0.5), ('C6', 1.5), ('R', 0.5),

    ('G5', 0.5), ('E5', 0.5), ('C5', 0.5), ('E5', 0.5),
    ('G5', 1.0), ('E5', 1.0),
    ('C5', 0.5), ('G4', 0.5), ('C5', 1.5), ('R', 0.5),

    ('G4', 0.5), ('C5', 0.5), ('E5', 1.0),
    ('C5', 0.5), ('E5', 0.5), ('G5', 1.0),
    ('E5', 0.5), ('C5', 0.5), ('G4', 0.5), ('C5', 0.5),
    ('C5', 2.0),
]

total_beats = sum(b for _, b in MELODY)
BEAT = TARGET_SECONDS / total_beats  # scale so the whole call lands on ~20s


def brass_note(freq, dur):
    """A bright, brassy bugle tone with a fast attack, vibrato, and quick release."""
    n = int(SR * dur)
    out = []
    # Brass-ish spectrum: many harmonics rolling off.
    harmonics = [(k, 1.0 / k) for k in range(1, 11)]
    norm = sum(a for _, a in harmonics)
    for i in range(n):
        t = i / SR
        vib = 1.0 + 0.006 * math.sin(2 * math.pi * 5.5 * t)  # subtle vibrato
        s = 0.0
        for k, a in harmonics:
            s += a * math.sin(2 * math.pi * freq * k * t * vib)
        s /= norm
        # ADSR envelope (fast attack, small decay to sustain, quick release).
        attack, release = 0.012, 0.05
        if t < attack:
            env = t / attack
        elif t > dur - release:
            env = max(0.0, (dur - t) / release)
        else:
            env = 0.85
        out.append(0.7 * s * env)
    return out


def silence(dur):
    return [0.0] * int(SR * dur)


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


samples = []
for note, beats in MELODY:
    dur = beats * BEAT
    if note == 'R':
        samples += silence(dur)
    else:
        # Tiny gap between notes for articulation.
        gap = min(0.02, dur * 0.15)
        samples += brass_note(N[note], dur - gap)
        samples += silence(gap)

write_wav('reveille.wav', samples)
