"""Generate the voiceover one segment at a time with Kokoro, then write build/timing.json.

    python -m pipeline.tts            # generate (cached) at VOICE_SPEED
    python -m pipeline.tts --fit      # also retune speed once so the video lands on TARGET_TOTAL
"""
import argparse
import hashlib
import json

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import resample_poly

from . import timeline
from .config import (BUILD, KOKORO_MODEL, KOKORO_VOICES, LANG, PHONEME_FIXES, SR, TARGET_TOTAL,
                     VOICE, VOICE_SPEED)
from .scenes import SCENES

VOICE_DIR = BUILD / "voice"
CACHE = VOICE_DIR / "cache.json"
SEG_LUFS = -20.0


def trim(x, sr, floor_db=-42.0, pre=0.04, post=0.09):
    win = int(sr * 0.01)
    frames = len(x) // win
    rms = np.sqrt(np.mean(x[:frames * win].reshape(frames, win) ** 2, axis=1) + 1e-12)
    loud = np.where(20 * np.log10(rms / (rms.max() + 1e-12)) > floor_db)[0]
    a = max(0, loud[0] * win - int(pre * sr))
    b = min(len(x), (loud[-1] + 1) * win + int(post * sr))
    out = x[a:b].copy()
    fade = int(0.01 * sr)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


def level(x, sr):
    meter = pyln.Meter(sr)
    padded = np.concatenate([x, np.zeros(max(0, int(0.5 * sr) - len(x)))])
    gain = SEG_LUFS - meter.integrated_loudness(padded)
    return x * 10 ** (np.clip(gain, -4, 4) / 20)


def segments():
    for sc in SCENES:
        for i, s in enumerate(sc["segments"]):
            if not s["silent"]:
                yield timeline.seg_id(sc, i), s["tts"] or s["text"], s["pace"]


def generate(speed):
    from kokoro_onnx import Kokoro
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    kokoro, durations = None, {}
    for sid, text, pace in segments():
        key = hashlib.sha1(json.dumps([text, VOICE, speed * pace, PHONEME_FIXES]).encode()).hexdigest()
        path = VOICE_DIR / f"{sid}.wav"
        if cache.get(sid, {}).get("key") != key or not path.exists():
            kokoro = kokoro or Kokoro(str(KOKORO_MODEL), str(KOKORO_VOICES))
            ph = kokoro.tokenizer.phonemize(text, LANG)
            for a, b in PHONEME_FIXES.items():
                ph = ph.replace(a, b)
            x, sr = kokoro.create(ph, voice=VOICE, speed=speed * pace, lang=LANG, is_phonemes=True)
            x = trim(np.asarray(x, dtype=np.float64), sr)
            x = level(resample_poly(x, SR // sr, 1) if SR % sr == 0 else resample_poly(x, SR, sr), SR)
            sf.write(path, x.astype(np.float32), SR)
            cache[sid] = {"key": key, "phonemes": ph, "dur": len(x) / SR}
            print(f"  {sid} {len(x) / SR:5.2f}s  {text[:60]}")
        durations[sid] = cache[sid]["dur"]
    CACHE.write_text(json.dumps(cache, indent=1, ensure_ascii=False))
    return durations


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fit", action="store_true")
    ap.add_argument("--speed", type=float, default=VOICE_SPEED)
    args = ap.parse_args()
    speed = args.speed
    durations = generate(speed)
    tl = timeline.build(durations)
    if args.fit and abs(tl["total"] - TARGET_TOTAL) > 2.0:
        speech = sum(durations.values())
        speed = float(np.clip(speed * speech / (speech - (tl["total"] - TARGET_TOTAL)), 0.82, 1.0))
        print(f"total {tl['total']:.1f}s -> retuning speed to {speed:.3f}")
        durations = generate(speed)
        tl = timeline.build(durations)
    tl["voice_speed"] = speed
    timeline.save(tl)
    words = sum(len(t.split()) for _, t, _ in segments())
    print(f"speed {speed:.3f}  speech {sum(durations.values()):.1f}s  total {tl['total']:.1f}s "
          f"({int(tl['total'] // 60)}:{tl['total'] % 60:04.1f})  ~{words / tl['total'] * 60:.0f} wpm overall")


if __name__ == "__main__":
    main()
