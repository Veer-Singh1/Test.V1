# Voiceover for the line-art format: one sentence at a time, trimmed, with the kit's pauses
# (0.3 s between sentences, 0.7 s before the named concept and before the final line).
# usage: python synth_line.py <model_dir> <script.json> <out.wav> <voice> <speed>
import json, sys, re, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
model_dir, src, out_wav, voice, speed = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5])
SAY = {"2010": "twenty ten", "33": "thirty-three"}
k = Kokoro(f"{model_dir}/kokoro-v1.0.onnx", f"{model_dir}/voices-v1.0.bin")
data = json.load(open(src))
def spoken(display):
    t = display.replace('*', '')
    t = re.sub(r"\b([A-Z]{3,})\b", lambda m: m.group(1) if m.group(1) == 'GPS' else m.group(1).lower(), t)
    for a, b in SAY.items(): t = re.sub(rf"\b{a}\b", b, t)
    return t
def trim(x, sr, thr=0.012):
    idx = np.where(np.abs(x) > thr)[0]
    a = max(0, idx[0] - int(0.025 * sr)); b = min(len(x), idx[-1] + int(0.07 * sr)); return x[a:b]
pieces, t = [], 0.0
for i, s in enumerate(data['sentences']):
    if i > 0:
        gap = s.get('pauseBefore', 0.3); pieces.append(np.zeros(int(gap * sr), dtype=np.float32)); t += gap
    audio, sr = k.create(spoken(s['display']), voice=voice, speed=speed, lang='en-us')
    a = trim(np.asarray(audio, dtype=np.float32), sr)
    if i == 0: a = a[max(0, np.where(np.abs(a) > 0.012)[0][0] - int(0.005 * sr)):]
    s['start'] = round(t, 3); t += len(a) / sr; s['end'] = round(t, 3); pieces.append(a)
audio = np.concatenate(pieces); audio = audio / np.max(np.abs(audio)) * 0.89
sf.write(out_wav, audio, sr, subtype='PCM_16')
data['voice'] = f'Kokoro TTS v1.0, {voice}, speed {speed}'
json.dump(data, open(src, 'w'), indent=1)
words = sum(len(s['display'].split()) for s in data['sentences'])
print(f'total {t:.2f}s, {words} words, {words / t * 60:.0f} wpm')
for s in data['sentences']: print(f"{s['start']:6.2f}-{s['end']:6.2f} {s['display']}")
