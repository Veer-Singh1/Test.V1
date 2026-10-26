"""Synthesised sound effects (original, so there is nothing to license). Mono float arrays at SR."""
import numpy as np
from scipy.signal import butter, sosfilt

from .config import SR

RNG = np.random.default_rng(7)


def _env(n, attack, release):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-np.maximum(0, t - attack) / release)


def _norm(x, peak_db):
    return x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)


def whoosh(dur=0.7):
    n = int(dur * SR)
    noise = RNG.normal(0, 1, n)
    # sweep a band-pass upward by filtering short blocks with a moving centre frequency
    out, block = np.zeros(n), 512
    for i in range(0, n, block):
        u = i / n
        fc = 300 * (9 ** u)
        sos = butter(2, [fc * 0.6, min(fc * 1.6, SR / 2 - 100)], "bandpass", fs=SR, output="sos")
        out[i:i + block] = sosfilt(sos, noise[i:i + block])
    t = np.arange(n) / n
    shape = np.sin(np.pi * t) ** 1.6
    return _norm(out * shape, -12)


def click():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.008)
    tick = sosfilt(butter(2, 3000, "highpass", fs=SR, output="sos"), RNG.normal(0, 1, n)) * np.exp(-t / 0.003)
    return _norm(tone + 0.4 * tick, -16)


def pop():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 900 * np.exp(-t / 0.05) + 380
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.002, 0.03)
    return _norm(x, -17)


def tick():
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 1500 * t) * np.exp(-t / 0.018) + 0.3 * np.sin(2 * np.pi * 3100 * t) * np.exp(-t / 0.01)
    return _norm(x, -17)


def ding():
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    f0 = 1318.5  # E6
    x = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / d)
            for a, r, d in [(1.0, 1.0, 0.55), (0.35, 2.76, 0.22), (0.18, 5.4, 0.1), (0.25, 0.5, 0.7)])
    return _norm(x * _env(n, 0.003, 10), -15)


def spark():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for _ in range(26):
        i = int(RNG.uniform(0, 0.3) * SR)
        k = int(0.004 * SR)
        x[i:i + k] += RNG.normal(0, 1, k) * np.exp(-np.arange(k) / (0.001 * SR))
    x = sosfilt(butter(2, 2500, "highpass", fs=SR, output="sos"), x)
    shimmer = np.sin(2 * np.pi * 2637 * t) * np.exp(-t / 0.18) * 0.25
    return _norm(x * np.exp(-t / 0.2) + shimmer, -15)


BANK = {"whoosh": whoosh, "click": click, "pop": pop, "tick": tick, "ding": ding, "spark": spark}


def make(kind):
    return BANK[kind]()
