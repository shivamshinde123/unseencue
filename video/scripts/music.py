"""Synthesize an original, calm ambient bed for the video (no licensing questions).

Slow, warm chords (detuned soft sines with a gentle overtone), each fading into the next,
a quiet high shimmer, a soft low pulse, and a simple feedback-delay "room".
Writes public/music/ambient.wav. Run from video/:  python scripts/music.py
"""
import pathlib
import wave

import numpy as np

SR = 44100
LENGTH = 126.0  # seconds; a little longer than the video so it can fade out under the end card
CHORD_LEN = 8.0
FADE = 3.0

# A minor-ish, hopeful loop: Fmaj7 - Am9 - Cmaj7 - G6/sus (MIDI notes)
CHORDS = [
    [41, 53, 57, 60, 64],  # Fmaj7
    [45, 57, 60, 64, 71],  # Am9
    [48, 55, 59, 64, 67],  # Cmaj7
    [43, 55, 60, 62, 64],  # Gsus/6
]

def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)

t_total = int(LENGTH * SR)
out = np.zeros((t_total, 2))
rng = np.random.default_rng(7)

# chords
n_chords = int(LENGTH // CHORD_LEN) + 1
for i in range(n_chords):
    start = int(i * CHORD_LEN * SR)
    dur = int((CHORD_LEN + FADE) * SR)
    if start >= t_total:
        break
    dur = min(dur, t_total - start)
    t = np.arange(dur) / SR
    env = np.minimum(1, t / FADE) * np.minimum(1, (CHORD_LEN + FADE - t) / FADE)
    env = env ** 1.5
    seg = np.zeros((dur, 2))
    for j, note in enumerate(CHORDS[i % len(CHORDS)]):
        f = hz(note)
        amp = 0.11 if j == 0 else 0.07
        for side, detune in ((0, -0.18), (1, 0.18)):
            ph = rng.uniform(0, 2 * np.pi)
            tone = np.sin(2 * np.pi * (f + detune) * t + ph)
            tone += 0.18 * np.sin(2 * np.pi * 2 * (f + detune) * t + ph)  # soft overtone
            seg[:, side] += amp * tone
    out[start:start + dur] += seg * env[:, None]

# high shimmer: slow, quiet bell tones from the chord, every 4 s
t_all = np.arange(t_total) / SR
for k in range(int(LENGTH // 4)):
    s = int((k * 4 + 1.5) * SR)
    d = min(int(3.5 * SR), t_total - s)
    if d <= 0:
        break
    tt = np.arange(d) / SR
    note = CHORDS[(k // 2) % len(CHORDS)][-1 - (k % 3)] + 12
    bell = np.sin(2 * np.pi * hz(note) * tt) * np.exp(-tt * 1.4) * 0.025
    pan = 0.3 + 0.4 * (k % 2)
    out[s:s + d, 0] += bell * (1 - pan)
    out[s:s + d, 1] += bell * pan

# soft low pulse on each chord change
for i in range(n_chords):
    s = int(i * CHORD_LEN * SR)
    d = min(int(2.5 * SR), t_total - s)
    if d <= 0:
        break
    tt = np.arange(d) / SR
    root = hz(CHORDS[i % len(CHORDS)][0] - 12)
    pulse = np.sin(2 * np.pi * root * tt) * np.exp(-tt * 1.8) * 0.12
    out[s:s + d] += pulse[:, None]

# one-pole low-pass to keep it warm
alpha = 0.18
for c in range(2):
    y = np.empty(t_total)
    acc = 0.0
    x = out[:, c]
    for n in range(t_total):
        acc += alpha * (x[n] - acc)
        y[n] = acc
    out[:, c] = y

# simple stereo feedback-delay room
for delay_s, gain, cross in ((0.37, 0.35, True), (0.53, 0.28, False), (0.71, 0.2, True)):
    d = int(delay_s * SR)
    wet = np.zeros_like(out)
    wet[d:] = out[:-d] * gain
    if cross:
        wet = wet[:, ::-1]
    out += wet

# master: fade in/out, normalise to -16 dBFS peak-ish
fade_in, fade_out = int(4 * SR), int(6 * SR)
out[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
out[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
out *= 0.16 / np.max(np.abs(out))

path = pathlib.Path(__file__).resolve().parent.parent / "public" / "music" / "ambient.wav"
path.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(path), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
print("wrote", path, f"{LENGTH:.0f}s")
