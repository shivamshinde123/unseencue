"""Synthesize an original, upbeat background track for the video (no licensing questions).

112 BPM, bright major key (C - G - Am - F), with a light pop/lo-fi groove:
kick on 1 & 3, claps on 2 & 4, swung hi-hats, a bouncy octave bass, plucky off-beat chords
and a marimba-style melody. Intro → groove → short breakdown → groove → ring-out.
Writes public/music/ambient.wav (name kept so the composition doesn't change).
Run from video/:  python scripts/music.py
"""
import pathlib
import wave

import numpy as np

SR = 44100
BPM = 112
BEAT = 60 / BPM
BAR = 4 * BEAT
LENGTH = 126.0
N = int(LENGTH * SR)
rng = np.random.default_rng(3)

L = np.zeros(N)
R = np.zeros(N)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(sig, t0, gain=1.0, pan=0.0):
    s = int(t0 * SR)
    if s >= N:
        return
    e = min(N, s + len(sig))
    seg = sig[: e - s] * gain
    L[s:e] += seg * (1 - pan) / 1.0 if pan > 0 else seg
    R[s:e] += seg * (1 + pan) / 1.0 if pan < 0 else seg


def env(n, attack=0.004, decay=0.25):
    t = np.arange(n) / SR
    return np.minimum(1, t / attack) * np.exp(-t / decay)


def tone(freq, dur, harmonics=((1, 1.0),), attack=0.004, decay=0.25):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * freq * k * t) for k, a in harmonics)
    return s * env(n, attack, decay)


def lowpass(x, a):
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc)
        y[i] = acc
    return y


# ---------- instruments ----------
def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 50 + 90 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * 0.9


def clap():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    noise = noise - lowpass(noise, 0.08)  # take the top end
    bursts = sum(np.exp(-np.maximum(0, t - d) * 60) * (t >= d) for d in (0, 0.011, 0.022))
    return noise * (bursts * 0.35 + np.exp(-t * 14) * 0.5) * 0.45


def hat(open_=False):
    n = int((0.22 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    noise = noise - lowpass(noise, 0.35)
    return noise * np.exp(-t * (9 if open_ else 70)) * 0.22


KICK, CLAP, HAT, OHAT = kick(), clap(), hat(), hat(True)

# C - G - Am - F  (bass roots, chord voicings, melody notes per bar)
PROG = [
    (36, [60, 64, 67, 72]),  # C
    (43, [59, 62, 67, 71]),  # G
    (45, [60, 64, 69, 72]),  # Am
    (41, [60, 65, 69, 72]),  # F
]
MELODY = [  # 8 eighth-notes per bar (None = rest), a sunny hook that loops over 4 bars
    [76, None, 79, 76, 74, None, 72, None],
    [74, None, 71, 74, 79, None, 74, None],
    [72, None, 76, 72, 69, None, 72, 74],
    [72, None, 69, 72, 77, 76, 74, None],
]

bars = int(LENGTH // BAR) + 1
for b in range(bars):
    t_bar = b * BAR
    if t_bar >= LENGTH - 2:
        break
    root, chord = PROG[b % 4]
    intro = b < 4
    breakdown = 44 <= b < 48
    outro = b >= bars - 3
    drums = not intro and not breakdown and not outro
    swing = 0.06 * BEAT

    # drums
    if drums:
        for beat in (0, 2):
            add(KICK, t_bar + beat * BEAT, 0.55)
        add(KICK, t_bar + 2.5 * BEAT, 0.22)  # little pickup kick
        for beat in (1, 3):
            add(CLAP, t_bar + beat * BEAT, 0.5)
    if not outro:
        for e in range(8):
            off = (e % 2) * swing
            if e == 7 and drums:
                add(OHAT, t_bar + e * BEAT / 2 + off, 0.4, pan=0.3)
            else:
                add(HAT, t_bar + e * BEAT / 2 + off, 0.6 if e % 2 else 0.35, pan=0.3)

    # bass: bouncy octave eighths (root, octave)
    if not intro and not breakdown:
        for e in range(8):
            note = root + (12 if e % 2 else 0)
            sig = tone(hz(note), BEAT / 2 * 0.95, ((1, 1), (2, 0.35), (3, 0.12)), 0.006, 0.18)
            add(lowpass(sig, 0.12), t_bar + e * BEAT / 2, 0.42)

    # plucky chord stabs on the off-beats (and a long pad in intro/breakdown/outro)
    if intro or breakdown or outro:
        for i, n_ in enumerate(chord):
            pad = tone(hz(n_), BAR + 0.6, ((1, 1), (2, 0.25)), 0.25, 1.8)
            add(pad, t_bar, 0.09, pan=(-0.3 if i % 2 else 0.3))
    if not outro:
        for e in (1, 3, 5, 7):
            for i, n_ in enumerate(chord):
                stab = tone(hz(n_), 0.3, ((1, 1), (2, 0.6), (3, 0.35), (4, 0.2), (5, 0.1)), 0.003, 0.11)
                add(stab, t_bar + e * BEAT / 2 + (e % 2) * swing, 0.2, pan=(-0.25 if i % 2 else 0.25))

    # marimba-style melody (from bar 8, and through the breakdown)
    if b >= 8 and not outro:
        for e, n_ in enumerate(MELODY[b % 4]):
            if n_ is None:
                continue
            mar = tone(hz(n_), 0.45, ((1, 1), (4, 0.25), (10, 0.05)), 0.002, 0.16)
            add(mar, t_bar + e * BEAT / 2 + (e % 2) * swing, 0.5, pan=-0.2)

# final ringing C chord
end_t = (bars - 3) * BAR
for i, n_ in enumerate([48, 60, 64, 67, 72, 76]):
    add(tone(hz(n_), 5.0, ((1, 1), (2, 0.3)), 0.01, 1.6), end_t, 0.09)

# gentle glue: soft room and a little low-pass on the whole mix
mix = np.stack([L, R], axis=1)
for d_s, g in ((0.19, 0.18), (0.29, 0.12)):
    d = int(d_s * SR)
    wet = np.zeros_like(mix)
    wet[d:] = mix[:-d] * g
    mix += wet[:, ::-1]
for c in range(2):
    mix[:, c] = lowpass(mix[:, c], 0.9)  # just takes the edge off

fade_in, fade_out = int(1.5 * SR), int(5 * SR)
mix[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
mix[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
mix = np.tanh(mix * 1.2) / np.tanh(1.2)  # soft limiter
mix *= 0.5 / np.max(np.abs(mix))

path = pathlib.Path(__file__).resolve().parent.parent / "public" / "music" / "ambient.wav"
path.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(path), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("wrote", path, f"{LENGTH:.0f}s @ {BPM} BPM")
