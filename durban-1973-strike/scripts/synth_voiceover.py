# Synthesize the voiceover sentence by sentence with Kokoro, trim silences,
# join with fixed pauses, and write voiceover.wav + sentence_times.json.
import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
model_dir, src_json, out_wav, out_json, voice, speed = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], float(sys.argv[6])
SAY = {"1973": "nineteen seventy-three", "1979": "nineteen seventy-nine"}
k = Kokoro(f"{model_dir}/kokoro-v1.0.onnx", f"{model_dir}/voices-v1.0.bin")
sents = json.load(open(src_json))["sentences"]
PAUSE_IN, PAUSE_SHOT = 0.24, 0.40
def trim(x, sr, thr=0.012):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0: return x
    a = max(0, idx[0] - int(0.025 * sr)); b = min(len(x), idx[-1] + int(0.07 * sr))
    return x[a:b]
pieces, out, t = [], [], 0.0
sr0 = None
for i, s in enumerate(sents):
    text = s["text"]
    for kk, v in SAY.items(): text = text.replace(kk, v)
    audio, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
    sr0 = sr
    a = trim(np.asarray(audio, dtype=np.float32), sr)
    if i == 0:  # first word at t=0
        idx = np.where(np.abs(a) > 0.012)[0]; a = a[max(0, idx[0] - int(0.005 * sr)):]
    start = t; dur = len(a) / sr; end = start + dur
    out.append({"shot": s["shot"], "text": s["text"], "start": round(start, 3), "end": round(end, 3)})
    pieces.append(a)
    if i + 1 < len(sents):
        gap = PAUSE_SHOT if sents[i + 1]["shot"] != s["shot"] else PAUSE_IN
        pieces.append(np.zeros(int(gap * sr), dtype=np.float32)); t = end + gap
    else:
        t = end
audio = np.concatenate(pieces)
peak = np.max(np.abs(audio)); audio = audio / peak * 0.89 if peak > 0 else audio
sf.write(out_wav, audio, sr0, subtype="PCM_16")
words = sum(len(s["text"].split()) for s in out)
json.dump({"source": f"Kokoro TTS v1.0, voice {voice}, speed {speed}", "sentences": out}, open(out_json, "w"), indent=2)
print(f"voice={voice} speed={speed} total={t:.2f}s words={words} wps={words / t:.2f}")
for s in out: print(f"{s['shot']:>2} {s['start']:6.2f}-{s['end']:6.2f}  {s['text']}")
