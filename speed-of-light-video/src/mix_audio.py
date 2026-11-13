#!/usr/bin/env python3
"""Build out/mix.wav: narration + procedural synth bed + sound effects.

Reads src/timeline.json (clip start times) and src/events.json (animation events
exported from video.html, so sound always lands on the same frame as the picture).
"""
import json, subprocess, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
EV = json.loads((ROOT / "src" / "events.json").read_text())["events"]
N = int(TL["duration"] * SR)
rs = np.random.RandomState(4)


def db(x): return 10 ** (x / 20)
def rms(x): return float(np.sqrt(np.mean(x ** 2) + 1e-12))


def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-f", "s16le", "-ac", "1",
                          "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768


def place(track, sig, t, gain=1.0):
    i = int(t * SR)
    if i >= len(track): return
    sig = sig[: len(track) - i]
    track[i:i + len(sig)] += sig * gain


def band_noise(dur, lo, hi):
    n = int(dur * SR)
    spec = np.fft.rfft(rs.randn(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    spec *= np.exp(-0.5 * ((np.log(f + 1) - np.log((lo * hi) ** 0.5)) / (np.log(hi / lo) / 2)) ** 2)
    x = np.fft.irfft(spec, n)
    return x / (np.max(np.abs(x)) + 1e-9)


# ---- narration (untouched apart from the tempo set in prepare.py) ----------
voice = np.zeros(N)
for l in TL["lines"]:
    place(voice, load(ROOT / "audio" / f"{l['n']:02d}.mp3"), l["start"])
voice *= db(-3) / np.max(np.abs(voice))
active = np.abs(voice) > db(-45)
voice_rms = rms(voice[active])

# ---- music bed: low drone + one rising pluck per racer ----------------------
t = np.arange(N) / SR
music_end = EV["musicOut"]
drone = (np.sin(2 * np.pi * 72 * t) + 0.5 * np.sin(2 * np.pi * 72.6 * t)
         + 0.35 * np.sin(2 * np.pi * 144 * t + 0.3) + 0.15 * np.sin(2 * np.pi * 216 * t))
drone *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.23 * t)
env = np.clip(t / 0.4, 0, 1) * np.clip((music_end - t) / 0.12, 0, 1)   # hard drop-out at line 13
drone *= env

SEMIS = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22]          # A minor pentatonic, climbing
plucks = np.zeros(N)
for k, tp in enumerate(EV["plucks"]):
    f0 = 220 * 2 ** (SEMIS[k] / 12)
    n = int(1.4 * SR); tt = np.arange(n) / SR
    sig = sum(np.sin(2 * np.pi * f0 * h * tt) * np.exp(-tt * (3.2 + 2.2 * h)) / h ** 1.3 for h in range(1, 6))
    sig *= np.clip(tt / 0.004, 0, 1)
    place(plucks, sig / np.max(np.abs(sig)), tp)
plucks *= (t < music_end + 0.0) * np.clip((music_end - t) / 0.08, 0, 1)

bed = drone / rms(drone[: int(music_end * SR)]) * 1.0 + plucks * 2.6
bed *= voice_rms * db(-14) / rms(bed[: int(music_end * SR)])           # ~14 dB under the voice

# ---- sound effects -----------------------------------------------------------
sfx = np.zeros(N)
for tw in EV["whooshes"]:
    big = abs(tw - EV["whooshes"][-2]) < 1e-6          # the hard zoom-out on light
    dur = 2.1 if big else 1.0
    w = band_noise(dur, 250, 1800) * np.hanning(int(dur * SR)) ** 1.5
    place(sfx, w, tw, voice_rms * db(-10 if big else -15))
tick_n = int(0.02 * SR); tk = np.arange(tick_n) / SR
tick = np.sin(2 * np.pi * 2400 * tk) * np.exp(-tk * 260)
for r in EV["rolls"]:
    count = int(r["dur"] * 14)
    for j in range(count):
        p = j / count
        place(sfx, tick, r["t"] + r["dur"] * (p ** 0.8), voice_rms * db(-17) * (0.5 + 0.5 * np.sin(np.pi * p)))
# deep bass hit as the light bar launches (40-60 Hz, 1.2 s decay) + a short click so phones hear it
n = int(2.2 * SR); tt = np.arange(n) / SR
freq = 42 + 18 * np.exp(-tt * 6)
hit = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt / 0.42)
hit += 0.35 * np.sin(2 * np.pi * np.cumsum(freq * 2) / SR) * np.exp(-tt / 0.25)
hit += 0.25 * band_noise(2.2, 80, 900) * np.exp(-tt / 0.05)
place(sfx, hit / np.max(np.abs(hit)), EV["bassHit"], db(-2.5))
# soft arrival ping when sunlight reaches Earth (line 16)
l16 = next(l for l in TL["lines"] if l["n"] == 16)
n = int(0.9 * SR); tt = np.arange(n) / SR
place(sfx, np.sin(2 * np.pi * 1320 * tt) * np.exp(-tt * 7) * np.clip(tt / 0.003, 0, 1), l16["end"] - 0.15, voice_rms * db(-12))
# rewind: rising sweep in the last half second
n = int((EV["duration"] - EV["rewind"]) * SR); tt = np.arange(n) / SR
f = 300 * (6 ** (tt / tt[-1]))
rw = (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + band_noise(n / SR, 600, 5000)[:n] * 0.7) * np.hanning(n)
rw *= 0.75 + 0.25 * np.sign(np.sin(2 * np.pi * 38 * tt))                # tape flutter
place(sfx, rw, EV["rewind"], voice_rms * db(-9))

# ---- master: peaks near -1 dBFS -------------------------------------------------
mix = voice + bed + sfx
mix = np.tanh(mix * 1.6) / np.tanh(1.6)                                  # gentle soft limit
mix *= db(-1) / np.max(np.abs(mix))
fade = int(0.01 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)

out = ROOT / "out" / "mix.wav"
out.parent.mkdir(exist_ok=True)
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    st = np.repeat((mix * 32767).astype(np.int16)[:, None], 2, axis=1)
    w.writeframes(st.tobytes())
print(f"mix.wav  {len(mix)/SR:.2f}s  peak {20*np.log10(np.max(np.abs(mix))):.1f} dBFS  "
      f"mean {20*np.log10(rms(mix)):.1f} dB  "
      f"voice-to-bed {20*np.log10(voice_rms / rms(bed[:int(music_end*SR)])):.1f} dB")
