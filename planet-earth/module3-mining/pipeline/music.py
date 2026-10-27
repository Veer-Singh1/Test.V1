"""An original ambient music bed (key and tempo set per video), synthesised so it carries no licence obligations.

Soft detuned pads on a I-vi-IV-V progression in D major, a gentle plucked arpeggio with a
dotted-eighth echo, a sine sub-bass and a synthetic reverb. The last chord lands on D.
"""
import numpy as np
from scipy.signal import butter, oaconvolve, sosfilt

from .config import SR

BPM = 88
BAR = 60 / BPM * 4
CHORDS = [  # (bass midi, pad voicing, arpeggio notes) - E minor, driving
    (40, [52, 55, 59, 66], [64, 67, 71, 76, 78, 76, 71, 67]),   # Em(add9)
    (36, [48, 52, 55, 59], [60, 64, 67, 72, 71, 72, 67, 64]),   # Cmaj7
    (43, [43, 50, 55, 59], [55, 59, 62, 67, 69, 67, 62, 59]),   # G
    (38, [50, 54, 57, 64], [62, 66, 69, 74, 76, 74, 69, 66]),   # D(add9)
]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def pad(notes, n, rng):
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for m in notes:
        for ch, det in ((0, -0.06), (1, 0.06)):
            for d in (-1, 1):
                f = hz(m) * 2 ** ((det + d * 0.05) / 12)
                ph = rng.uniform(0, 2 * np.pi)
                # soft "saw": first five harmonics with 1/k^1.6 roll-off
                out[:, ch] += sum(np.sin(2 * np.pi * f * k * t + ph * k) / k ** 1.6 for k in range(1, 6))
    return out / (len(notes) * 4)


def pluck(m, n):
    t = np.arange(n) / SR
    f = hz(m)
    x = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t))
    return x * np.minimum(1, t / 0.004) * np.exp(-t / 0.32)


def reverb_ir(seconds=2.4, rng=None):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.normal(0, 1, (n, 2)) * np.exp(-t / 0.55)[:, None]
    ir = sosfilt(butter(1, 4500, "lowpass", fs=SR, output="sos"), ir, axis=0)
    return ir / np.sqrt((ir ** 2).sum(axis=0))


def render(total, seed=11):
    rng = np.random.default_rng(seed)
    n_total = int(total * SR)
    out = np.zeros((n_total + int(4 * SR), 2))
    chord_len = 2 * BAR
    n_chords = int(np.ceil(total / chord_len))
    # shift the progression so the final chord is D
    offset = (-(n_chords - 1)) % len(CHORDS)
    xf = int(0.9 * SR)
    lp = butter(2, 1400, "lowpass", fs=SR, output="sos")
    for c in range(n_chords):
        bass, voicing, arp = CHORDS[(c + offset) % len(CHORDS)]
        a = int(c * chord_len * SR)
        n = int(chord_len * SR) + xf
        env = np.ones(n)
        env[:xf] = np.sin(np.linspace(0, np.pi / 2, xf)) ** 2
        env[-xf:] = np.cos(np.linspace(0, np.pi / 2, xf)) ** 2
        p = sosfilt(lp, pad(voicing, n, rng), axis=0) * env[:, None]
        out[a:a + n] += 0.55 * p
        tb = np.arange(n) / SR
        b = np.sin(2 * np.pi * hz(bass) * tb) * env * np.minimum(1, tb / 0.3)
        out[a:a + n] += 0.32 * b[:, None]
        step = 60 / BPM / 2
        for k in range(int(chord_len / step)):
            s = a + int(k * step * SR)
            m = arp[k % len(arp)]
            x = pluck(m, int(1.2 * SR)) * (0.9 if k % 2 == 0 else 0.6)
            pan = 0.5 + 0.25 * np.sin(k * 0.9)
            seg = out[s:s + len(x)]
            seg[:, 0] += 0.16 * x[:len(seg)] * (1 - pan)
            seg[:, 1] += 0.16 * x[:len(seg)] * pan
    # dotted-eighth echo on everything, then reverb
    d = int(60 / BPM * 0.75 * SR)
    echo = np.zeros_like(out)
    echo[d:] = out[:-d] * 0.22
    echo[2 * d:] += out[:-2 * d] * 0.08
    dry = out + echo[:, ::-1]
    ir = reverb_ir(rng=rng)
    wet = np.stack([oaconvolve(dry[:, ch], ir[:, ch])[:len(dry)] for ch in (0, 1)], axis=1)
    mix = 0.75 * dry + 0.45 * wet
    mix = mix[:n_total]
    # gentle fade in and a 4 s fade out
    fi, fo = int(1.5 * SR), int(4.0 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None]
    mix[-fo:] *= np.cos(np.linspace(0, np.pi / 2, fo))[:, None] ** 2
    return (mix / (np.abs(mix).max() + 1e-9) * 0.5).astype(np.float32)
