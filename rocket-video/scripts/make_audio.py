#!/usr/bin/env python3
"""Synthesise the soundtrack (music + SFX) from build/timeline.json and mix it.

Everything here is original and generated in code (seeded, repeatable), so there are
no third-party licences to track for the audio. Outputs (out/):
  music_bed.flac   music alone, -20 LUFS (the level it sits at under a voice)
  sfx.flac         sound effects alone
  voiceover.flac   only if assets/raw/voice/voiceover.wav exists
  final_mix.wav    music + SFX (+ voice), -14 LUFS integrated, true peak <= -3.5 dBTP
                   (headroom so the AAC encode in the MP4 stays below 0 dBTP)
Run:  node scripts/export_timeline.mts && .venv/bin/python scripts/make_audio.py
"""
from __future__ import annotations

import json
import os

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SR = 48000
TL = json.load(open(os.path.join(ROOT, 'build', 'timeline.json')))
FPS = TL['fps']
DUR = TL['duration'] / FPS  # 60.0 s
N = int(round(DUR * SR))
rng = np.random.default_rng(2024)


def t_of(frame: float) -> float:
    return frame / FPS


def env_ad(n, a, d, curve=4.0):
    """attack (s) / exponential decay (s) envelope of n samples"""
    t = np.arange(n) / SR
    att = np.clip(t / max(a, 1e-4), 0, 1)
    dec = np.exp(-curve * np.clip(t - a, 0, None) / max(d, 1e-4))
    return att * dec


def bandpass(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def lowpass(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='low', fs=SR, output='sos'), x)


def highpass(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x)


def place(buf, x, at_s, gain=1.0, pan=0.0):
    """Add mono x into stereo buf at time at_s with equal-power pan."""
    i = int(at_s * SR)
    if i >= buf.shape[0] or i + len(x) <= 0:
        return
    j = min(buf.shape[0], i + len(x))
    seg = x[: j - i] * gain
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[i:j, 0] += seg * l
    buf[i:j, 1] += seg * r


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


# --------------------------------------------------------------------------- instruments
def kick(level=1.0):
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env_ad(n, 0.002, 0.28, 5)
    click = highpass(rng.normal(0, 1, n), 2000) * env_ad(n, 0.0005, 0.01, 6) * 0.25
    return (x + click) * level


def snare(level=1.0):
    n = int(0.22 * SR)
    noise = bandpass(rng.normal(0, 1, n), 1200, 6500) * env_ad(n, 0.001, 0.16, 5)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 190 * t) * env_ad(n, 0.001, 0.07, 5) * 0.5
    return (noise * 0.7 + tone) * level


def clap(level=1.0):
    n = int(0.25 * SR)
    x = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022, 0.034]):
        i = int(off * SR)
        m = n - i
        x[i:] += bandpass(rng.normal(0, 1, m), 900, 3500) * env_ad(m, 0.0005, 0.03 if k < 3 else 0.17, 5)
    return x * 0.6 * level


def hat(level=1.0, open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    x = highpass(rng.normal(0, 1, n), 7000, 4) * env_ad(n, 0.0005, 0.18 if open_ else 0.04, 5)
    return x * 0.5 * level


def shaker(level=1.0):
    n = int(0.08 * SR)
    x = bandpass(rng.normal(0, 1, n), 4000, 11000) * env_ad(n, 0.012, 0.06, 4)
    return x * 0.3 * level


def pluck_bass(note, dur=0.42, level=1.0):
    """Karplus-Strong plucked bass."""
    f = midi(note)
    n = int(dur * SR)
    period = int(SR / f)
    buf = rng.uniform(-1, 1, period)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = 0.5 * (buf[i % period] + buf[(i + 1) % period]) * 0.996
    out = lowpass(out, 900)
    t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * f * t) * env_ad(n, 0.003, dur, 3) * 0.6
    return (out * 0.8 + sub) * env_ad(n, 0.002, dur, 2.5) * level


def marimba(note, dur=0.5, level=1.0):
    f = midi(note)
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * f * t) * env_ad(n, 0.001, dur, 4)
         + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * env_ad(n, 0.0005, dur * 0.25, 5)
         + 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * env_ad(n, 0.0005, dur * 0.08, 5))
    return x * level


def glock(note, dur=0.9, level=1.0):
    f = midi(note)
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 8)
         + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 14))
    return x * env_ad(n, 0.001, dur, 4) * level


def pluck_chord(notes, dur=0.18, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for nt in notes:
        f = midi(nt)
        saw = 2 * ((f * t) % 1) - 1
        x += saw
    x = lowpass(x, 2600) * env_ad(n, 0.002, dur, 4)
    return x / len(notes) * level


def crash(level=1.0):
    n = int(1.6 * SR)
    x = highpass(rng.normal(0, 1, n), 3500, 2) * env_ad(n, 0.002, 1.5, 4)
    return x * 0.35 * level


def riser(dur, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    # sweep a band upward
    out = np.zeros(n)
    chunks = 24
    for c in range(chunks):
        a, b = c * n // chunks, (c + 1) * n // chunks
        fc = 400 * (12 ** (c / chunks))
        out[a:b] = bandpass(noise[a:b], fc * 0.7, min(fc * 1.6, 20000))
    return out * (t / dur) ** 2 * 0.5 * level


def reverb(x, secs=1.3, wet=0.22, seed=7):
    r = np.random.default_rng(seed)
    n = int(secs * SR)
    ir = r.normal(0, 1, n) * np.exp(-np.arange(n) / SR * 5.5)
    ir = lowpass(ir, 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    out = np.zeros_like(x)
    for ch in range(x.shape[1]):
        out[:, ch] = signal.fftconvolve(x[:, ch], ir, mode='full')[: x.shape[0]]
    return x * (1 - wet) + out * wet * 1.4


# --------------------------------------------------------------------------- music
BPM = TL['music']['bpm']
BEAT = 60 / BPM          # 0.5 s
BAR = 4 * BEAT           # 2 s
# chord per bar (root midi, chord tones) – a sunny I-vi-IV-V loop with a lift
PROG = [
    (48, [60, 64, 67, 71]),  # Cmaj7
    (45, [57, 60, 64, 67]),  # Am7
    (41, [57, 60, 65, 69]),  # Fmaj7
    (43, [59, 62, 67, 71]),  # G
]
LIFT_PROG = [
    (41, [57, 60, 65, 69]),  # F
    (43, [59, 62, 67, 71]),  # G
    (45, [57, 60, 64, 69]),  # Am
    (48, [60, 64, 67, 72]),  # C
]


def music() -> np.ndarray:
    drums = np.zeros((N, 2))
    tonal = np.zeros((N, 2))
    launch = t_of(TL['music']['lifts'][0])
    sep = t_of(TL['music']['lifts'][1])
    orbit_from = t_of(TL['beats']['orbit']['from'])
    number_from = t_of(TL['beats']['number']['from'])
    end_from = t_of(TL['beats']['end']['from'])
    melody = [76, 79, 81, 79, 84, 81, 79, 76, 74, 76, 79, 76, 72, 74, 76, 79]

    nbars = int(np.ceil(DUR / BAR))
    for bar in range(nbars):
        t0 = bar * BAR
        lifted = sep <= t0 < orbit_from or number_from <= t0 < end_from
        root, chord = (LIFT_PROG if lifted else PROG)[bar % 4]
        if t0 >= 58.0:
            root, chord = 48, [60, 64, 67, 72]
        for b8 in range(8):  # eighth notes
            t = t0 + b8 * BEAT / 2
            if t >= DUR:
                break
            swing = 0.018 if b8 % 2 else 0.0
            ts = t + swing
            started = t >= launch - 1e-6
            in_orbit = orbit_from <= t < number_from
            breakdown = sep - 4 <= t < sep  # thin out before separation
            # marimba arpeggio throughout (the playful hook)
            note = chord[[0, 2, 1, 3, 2, 1, 3, 2][b8]] + (12 if lifted else 0)
            place(tonal, marimba(note, 0.45, 0.33 if started else 0.42), ts, pan=-0.25)
            if not started:
                continue
            # drums
            if b8 in (0, 4) and not breakdown:
                place(drums, kick(0.8 if not in_orbit else 0.55), t)
            if b8 in (2, 6) and not breakdown:
                place(drums, (clap(0.55) if t >= t_of(TL['beats']['fuel']['from']) else snare(0.45)), t, pan=0.05)
            if not in_orbit or b8 % 2 == 1:
                place(drums, hat(0.55 if b8 % 2 else 0.35, open_=(b8 == 7 and bar % 2 == 1)), ts, pan=0.35)
            for s16 in range(2):
                place(drums, shaker(0.5), ts + s16 * BEAT / 4, pan=-0.4)
            # bass
            if b8 in (0, 3, 4, 6) and not (breakdown and b8 != 0):
                bn = root - 12 if b8 != 6 else root - 12 + 7
                place(tonal, pluck_bass(bn + 12, 0.4, 0.85), t, pan=0.0)
            # offbeat chord plucks once the story gets going
            if b8 % 2 == 1 and t >= t_of(TL['beats']['fuel']['from']) and not breakdown:
                place(tonal, pluck_chord(chord, 0.16, 0.32), ts, pan=0.3)
            # glockenspiel melody in space / lifted sections
            if (in_orbit or lifted) and b8 % 2 == 0:
                place(tonal, glock(melody[(bar * 4 + b8 // 2) % 16], 0.8, 0.22), ts, pan=0.2)
    # launch + separation lifts: riser into a hit
    for lift in (launch, sep):
        rs = riser(1.2 if lift > 2 else 0.9, 0.8)
        place(drums, rs, lift - len(rs) / SR, pan=0.0)
        # at separation the clunk SFX carries the impact, so the music hit is lighter
        place(drums, crash(0.8 if lift < 2 else 0.6), lift, pan=-0.1)
        place(drums, kick(0.75 if lift < 2 else 0.45), lift)
    place(drums, crash(0.7), number_from)
    # final chord ring-out
    for nt in (48, 60, 64, 67, 72):
        place(tonal, glock(nt + 12, 1.8, 0.18) if nt > 50 else pluck_bass(nt + 12, 1.6, 0.9), 58.0)

    mix = reverb(tonal, 1.4, 0.25) + reverb(drums, 0.6, 0.10, seed=9)
    # fade out over the last 2 s
    fade_from = t_of(TL['music']['fadeOutFrom'])
    t = np.arange(N) / SR
    g = np.clip((DUR - t) / (DUR - fade_from), 0, 1) ** 1.5
    return mix * g[:, None]


# --------------------------------------------------------------------------- SFX
def sfx_rustle():
    n = int(0.55 * SR)
    x = np.zeros(n)
    for _ in range(70):
        i = int(rng.uniform(0, 0.42) * SR)
        m = int(rng.uniform(0.004, 0.02) * SR)
        if i + m < n:
            x[i:i + m] += rng.normal(0, 1, m) * rng.uniform(0.2, 1.0) * np.hanning(m)
    x = bandpass(x, 1800, 9000)
    body = bandpass(rng.normal(0, 1, n), 300, 1800) * 0.4
    e = np.sin(np.pi * np.clip(np.arange(n) / n, 0, 1)) ** 0.7
    return (x + body) * e * 0.8


def sfx_rumble(dur=3.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    brown = np.cumsum(rng.normal(0, 1, n))
    brown = highpass(brown, 20)
    brown /= np.max(np.abs(brown)) + 1e-9
    low = lowpass(brown, 160, 3) * 2.2
    roar = bandpass(rng.normal(0, 1, n), 250, 1400) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t) * rng.uniform(0.5, 1))
    crackle = np.zeros(n)
    for _ in range(int(dur * 60)):
        i = int(rng.uniform(0, dur - 0.01) * SR)
        crackle[i:i + 60] += rng.normal(0, 1, 60) * np.hanning(60)
    crackle = highpass(crackle, 1500) * 0.5
    e = np.clip(t / 0.25, 0, 1) * np.clip((dur - t) / 1.2, 0, 1)
    return (low + roar * 0.35 + crackle) * e * 0.55


def sfx_clunk():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in
            [(182, 0.7, 14), (417, 0.5, 18), (693, 0.35, 22), (1131, 0.25, 30), (1720, 0.15, 40)])
    thump = np.sin(2 * np.pi * 62 * t) * np.exp(-t * 12) * 0.9
    pop = highpass(rng.normal(0, 1, n), 1500) * np.exp(-t * 60) * 0.6
    return (x + thump + pop) * 0.7


def sfx_stamp():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * 72 * t) * np.exp(-t * 18) + 0.5 * np.sin(2 * np.pi * 165 * t) * np.exp(-t * 26)
    slap = lowpass(rng.normal(0, 1, n), 2500) * np.exp(-t * 70) * 0.8
    return (thud + slap) * 0.9


def sfx_squeak(dur=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 2300 + 350 * np.sin(2 * np.pi * 9 * t) + rng.uniform(-200, 200)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) * (0.5 + 0.5 * (rng.random(n) > 0.35))
    scratch = bandpass(rng.normal(0, 1, n), 3000, 8000) * 0.5
    e = np.clip(t / 0.03, 0, 1) * np.clip((dur - t) / 0.05, 0, 1)
    return lowpass(tone * 0.25 + scratch, 7000) * e * 0.35


def sfx_whoosh(dur=1.1):
    n = int(dur * SR)
    noise = rng.normal(0, 1, n)
    out = np.zeros(n)
    chunks = 30
    for c in range(chunks):
        a, b = c * n // chunks, (c + 1) * n // chunks
        p = c / chunks
        fc = 350 + 2400 * np.sin(np.pi * p) ** 2
        out[a:b] = bandpass(noise[a:b], fc * 0.6, fc * 1.5)
    e = np.sin(np.pi * np.arange(n) / n) ** 1.6
    return out * e * 0.9


def sfx_pop():
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (60 + 80 * np.exp(-t * 30)) * t) * np.exp(-t * 14)
    burst = lowpass(rng.normal(0, 1, n), 900) * np.exp(-t * 25) * 0.9
    return (boom + burst) * 0.8


def sfx() -> np.ndarray:
    buf = np.zeros((N, 2))
    makers = {'rustle': sfx_rustle, 'rumble': sfx_rumble, 'clunk': sfx_clunk, 'stamp': sfx_stamp,
              'whoosh': sfx_whoosh, 'pop': sfx_pop}
    levels = {'rustle': 0.55, 'rumble': 0.9, 'clunk': 0.75, 'stamp': 0.6, 'whoosh': 0.45, 'pop': 0.55}
    for c in TL['sfx']:
        x = makers[c['kind']]()
        pan = float(rng.uniform(-0.3, 0.3))
        place(buf, x, t_of(c['at']), levels[c['kind']] * c.get('gain', 1.0), pan)
    for at in TL['marks'].values():
        place(buf, sfx_squeak(float(rng.uniform(0.25, 0.4))), t_of(at), 0.5, float(rng.uniform(-0.4, 0.4)))
    return buf


# --------------------------------------------------------------------------- mix
def lufs(x):
    return pyln.Meter(SR).integrated_loudness(x)


def to_lufs(x, target):
    return x * 10 ** ((target - lufs(x)) / 20)


def limiter(x, ceiling_db=-1.0, look_ms=12.0):
    """Look-ahead peak limiter: gain = min over a window, smoothed (vectorised)."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    ceil = 10 ** (ceiling_db / 20)
    # true-peak aware: estimate inter-sample peaks from a 4x oversampled copy
    up = signal.resample_poly(x, 4, 1, axis=0)[: 4 * len(x)]
    absx = np.max(np.abs(up), axis=1).reshape(-1, 4).max(axis=1)
    absx = np.maximum(absx, np.max(np.abs(x), axis=1))
    gain = np.minimum(1.0, ceil / np.maximum(absx, 1e-9))
    la = max(3, int(look_ms / 1000 * SR))
    g = minimum_filter1d(gain, size=2 * la + 1, mode='nearest')
    g = uniform_filter1d(g, size=la, mode='nearest')
    g = np.minimum(g, minimum_filter1d(gain, size=3, mode='nearest'))
    return x * g[:, None]


def compress(x, thr_db=-8.0, ratio=3.0, att=0.004, rel=0.15):
    """Feed-forward peak compressor (smooth envelope) to tame the crest factor before
    the brick-wall limiter, so the limiter only shaves the last few dB."""
    lvl = np.max(np.abs(x), axis=1)
    a_att = np.exp(-1 / (att * SR))
    a_rel = np.exp(-1 / (rel * SR))
    env = np.empty_like(lvl)
    e = 0.0
    for i, v in enumerate(lvl):
        c = a_att if v > e else a_rel
        e = c * e + (1 - c) * v
        env[i] = e
    over = 20 * np.log10(env + 1e-9) - thr_db
    gr = np.where(over > 0, over * (1 / ratio - 1), 0.0)
    return x * (10 ** (gr / 20))[:, None]


def true_peak_db(x):
    up = signal.resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def main():
    os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
    print('synthesising music...')
    m = to_lufs(music(), -20.0)
    print('synthesising sfx...')
    s = sfx()
    voice_path = os.path.join(ROOT, 'assets', 'raw', 'voice', 'voiceover.wav')
    has_voice = os.path.exists(voice_path)
    if has_voice:
        v, vsr = sf.read(voice_path, always_2d=True)
        v = signal.resample_poly(v, SR, vsr, axis=0) if vsr != SR else v
        if v.shape[1] == 1:
            v = np.repeat(v, 2, axis=1)
        vv = np.zeros((N, 2))
        vv[: min(N, len(v))] = v[:N]
        vv = to_lufs(vv, -16.0)
        sf.write(os.path.join(ROOT, 'out', 'voiceover.flac'), vv, SR, subtype='PCM_24')
    else:
        vv = np.zeros((N, 2))
    # SFX sit a little under the music bed's peaks
    s = s * (10 ** ((-23.0 - lufs(s)) / 20))
    sf.write(os.path.join(ROOT, 'out', 'music_bed.flac'), m, SR, subtype='PCM_24')
    sf.write(os.path.join(ROOT, 'out', 'sfx.flac'), s, SR, subtype='PCM_24')
    mix = m + s + vv
    mix = to_lufs(mix, -14.0)
    mix = to_lufs(compress(mix, -10.0, 3.0, att=0.002), -14.0)
    for _ in range(3):
        mix = limiter(mix, -3.5)
        mix = to_lufs(mix, -14.0)
    mix = limiter(mix, -3.5)
    sf.write(os.path.join(ROOT, 'out', 'final_mix.wav'), mix, SR, subtype='PCM_24')
    report = {
        'music_bed_lufs': round(lufs(m), 2),
        'sfx_lufs': round(lufs(s), 2),
        'final_lufs': round(float(lufs(mix)), 2),
        'final_sample_peak_db': round(20 * np.log10(np.max(np.abs(mix))), 2),
        'final_true_peak_db': round(true_peak_db(mix), 2),
        'duration_s': len(mix) / SR,
        'voice': has_voice,
    }
    json.dump(report, open(os.path.join(ROOT, 'build', 'audio_report.json'), 'w'), indent=1)
    print(report)


if __name__ == '__main__':
    main()
