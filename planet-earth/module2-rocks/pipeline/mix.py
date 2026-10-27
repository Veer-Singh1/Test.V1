"""Audio mix: voice placed on the timeline, music ducked about 20 dB under it, SFX on cues."""
import json

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

from . import music, sfx
from .config import BUILD, SR

VOICE_DIR = BUILD / "voice"
SFX_DIR = BUILD / "sfx_events"
VOICE_LUFS = -16.0
DUCK_DB = -20.0      # music under speech, relative to the voice
OPEN_DB = -11.0      # music in long pauses (title card, countdown, end card)
BRIDGE = 1.2         # pauses shorter than this keep the music ducked


def speech_intervals(tl):
    iv = []
    for sc in tl["scenes"]:
        for s in sc["segments"]:
            if not s["silent"]:
                iv.append([sc["start"] + s["start"], sc["start"] + s["end"]])
    merged = []
    for a, b in sorted(iv):
        if merged and a - merged[-1][1] < BRIDGE:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    return merged


def duck_envelope(tl, n):
    hop = int(0.01 * SR)
    frames = n // hop + 1
    db = np.full(frames, OPEN_DB - DUCK_DB)
    for a, b in speech_intervals(tl):
        db[max(0, int((a - 0.3) * 100)):int((b + 0.45) * 100)] = 0.0
    k = 30  # 0.3 s smoothing
    db = np.convolve(np.pad(db, (k, k), mode="edge"), np.ones(2 * k + 1) / (2 * k + 1), mode="same")[k:-k]
    return 10 ** (np.interp(np.arange(n) / hop, np.arange(frames), db) / 20)


def sfx_events(tl):
    ev = []
    for sc in tl["scenes"][1:]:
        ev.append((sc["start"] - 0.3, "whoosh", -4.0))
    for sh in tl["shots"]:
        f = SFX_DIR / f"{sh['id']}.json"
        if sh["kind"] == "manim" and f.exists():
            ev += [(sh["start"] + e["t"], e["kind"], e["gain_db"]) for e in json.loads(f.read_text())]
        for lb in sh.get("labels", []):
            ev.append((sh["start"] + lb["at"], "pop", -3.0))
    return sorted(ev)


def limiter(x, ceiling_db=-1.0):
    thr = 10 ** (ceiling_db / 20)
    peak = np.abs(x).max(axis=1)
    hop = int(0.005 * SR)
    frames = int(np.ceil(len(peak) / hop))
    env = np.pad(peak, (0, frames * hop - len(peak))).reshape(frames, hop).max(axis=1)
    env = np.maximum(env, np.concatenate([env[1:], env[-1:]]))  # look one block ahead
    g = np.minimum(1.0, thr / np.maximum(env, 1e-9))
    for i in range(1, frames):  # instant attack, ~60 ms release
        g[i] = min(g[i], g[i - 1] + (1 - g[i - 1]) * 0.08)
    return x * np.repeat(g, hop)[:len(x), None]


def build(tl, out):
    n = int(round(tl["total"] * SR))
    meter = pyln.Meter(SR)
    voice = np.zeros(n)
    for sc in tl["scenes"]:
        for s in sc["segments"]:
            if s["silent"]:
                continue
            x, _ = sf.read(VOICE_DIR / f"{s['id']}.wav")
            a = int(round((sc["start"] + s["start"]) * SR))
            voice[a:a + len(x)] += x[:max(0, n - a)]
    voice *= 10 ** ((VOICE_LUFS - meter.integrated_loudness(voice)) / 20)

    mpath = BUILD / "music.wav"
    if mpath.exists() and abs(sf.info(mpath).duration - tl["total"]) < 0.01:
        bed, _ = sf.read(mpath)
    else:
        bed = music.render(tl["total"])
        sf.write(mpath, bed, SR)
    bed = bed[:n]
    bed = bed * 10 ** ((VOICE_LUFS + DUCK_DB - meter.integrated_loudness(bed)) / 20)
    bed = bed * duck_envelope(tl, len(bed))[:, None]

    fx = np.zeros(n)
    cache = {}
    for t, kind, gain in sfx_events(tl):
        x = cache.setdefault(kind, sfx.make(kind)) * 10 ** (gain / 20)
        a = int(round(t * SR))
        if 0 <= a < n:
            fx[a:a + len(x)] += x[:n - a]

    mix = voice[:, None] + fx[:, None] + np.pad(bed, ((0, n - len(bed)), (0, 0)))
    mix *= 10 ** ((VOICE_LUFS - meter.integrated_loudness(mix)) / 20)
    mix = limiter(mix)
    sf.write(out, mix.astype(np.float32), SR)
    return {"lufs": round(meter.integrated_loudness(mix), 1), "peak_db": round(20 * np.log10(np.abs(mix).max()), 1),
            "sfx_events": len(sfx_events(tl))}
