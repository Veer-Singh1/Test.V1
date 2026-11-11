# Word timings for a narration file that came WITHOUT ElevenLabs timestamps (an upload, or the connector).
# It recognises the speech offline (sherpa-onnx, NeMo Parakeet TDT: gives a time for every token), matches
# the recognised words to the script's own words, and snaps words that follow a pause to the exact moment
# the sound starts. Output has the same shape as narrate.ts: assets/timings.json = {words:[{text,start,end}]}.
# usage: python scripts/align_audio.py <parakeet_model_dir> <script.txt> <narration.wav 16 kHz mono> <out timings.json>
import sys, re, json, difflib, numpy as np, soundfile as sf, sherpa_onnx
md, script_path, wav, out = sys.argv[1:5]
script = open(script_path, encoding='utf8').read()
words = re.sub(r'\[[^\]]*\]', ' ', script).split()           # delivery tags are not words
y, sr = sf.read(wav, dtype='float32')
rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{md}/encoder.int8.onnx', decoder=f'{md}/decoder.int8.onnx', joiner=f'{md}/joiner.int8.onnx', tokens=f'{md}/tokens.txt', model_type='nemo_transducer', num_threads=4)
s = rec.create_stream(); s.accept_waveform(sr, y); rec.decode_stream(s)
toks, ts = list(s.result.tokens), [float(x) for x in s.result.timestamps]
heard = []                                                   # recognised words with start times
for tok, t in zip(toks, ts):
    if tok.startswith(' ') or tok.startswith('▁') or not heard: heard.append([tok.strip(' ▁'), t])
    else: heard[-1][0] += tok
heard = [h for h in heard if re.sub(r'[^A-Za-z0-9]', '', h[0])]
NUM = {'four hundred': '400', 'twenty-two': '22', 'twentytwo': '22'}
norm = lambda w: re.sub(r'[^a-z0-9]', '', w.lower()).replace('centimetres', 'centimeters')
A, B = [norm(w) for w in words], [norm(h[0]) for h in heard]
# speech / silence from the loudness envelope (10 ms steps)
hop = int(0.01 * sr); env = np.array([np.sqrt(np.mean(y[i:i + hop] ** 2)) for i in range(0, len(y) - hop, hop)])
db = 20 * np.log10(env + 1e-9); sp = db > (np.percentile(db, 99) - 40)
onsets, offsets = [], []
i = 0
while i < len(sp):
    if sp[i]:
        j = i
        while j < len(sp) and (sp[j] or sp[j:j + 12].any()): j += 1
        if j - i >= 6: onsets.append(i * 0.01); offsets.append(j * 0.01)
        i = j
    else: i += 1
start = [None] * len(words)
sm = difflib.SequenceMatcher(a=A, b=B, autojunk=False)
for tag, a0, a1, b0, b1 in sm.get_opcodes():
    if tag == 'equal':
        for k in range(a1 - a0): start[a0 + k] = heard[b0 + k][1]
    elif a1 > a0 and b1 > b0:                               # e.g. "Four hundred" heard as "400": share the span by letters
        t0 = heard[b0][1]; t1 = heard[b1][1] if b1 < len(heard) else len(y) / sr
        L = [max(1, len(A[k])) for k in range(a0, a1)]; acc = 0
        for k in range(a0, a1): start[k] = t0 + (t1 - t0) * acc / sum(L); acc += L[k - a0]
assert all(v is not None for v in start), [w for w, v in zip(words, start) if v is None]
# snap: a word that follows a pause starts exactly where the sound starts
raw = list(start); snapped = 0
for k in range(len(words)):
    near = [o for o in onsets if abs(o - start[k]) <= 0.25]
    prev_gap = k == 0 or any(off <= start[k] + 0.12 and off >= (start[k - 1] if k else 0) for off in offsets)
    if near and prev_gap:
        o = min(near, key=lambda o: abs(o - start[k]))
        if k == 0 or o > start[k - 1] + 0.05: start[k] = o; snapped += 1
signed = [raw[k] - start[k] for k in range(len(words)) if raw[k] != start[k]]
bias = float(np.median(signed)) if signed else 0.0          # the recogniser's typical lag behind the true onset
for k in range(len(words)):
    if raw[k] == start[k]: start[k] = max(0.0, start[k] - bias)
for k in range(1, len(words)): start[k] = max(start[k], start[k - 1] + 0.08)
res = []
for k, w in enumerate(words):
    nxt = start[k + 1] if k + 1 < len(words) else len(y) / sr
    ends = [off for off in offsets if start[k] < off <= nxt + 0.02]
    res.append({'text': w, 'start': round(start[k], 3), 'end': round(min(ends) if ends else nxt, 3)})
json.dump({'source': 'offline alignment of the uploaded narration (scripts/align_audio.py)', 'duration': round(len(y) / sr, 3), 'words': res}, open(out, 'w'), indent=1, ensure_ascii=False)
dev = [abs(a - b) for a, b in zip(raw, start)]
print(f'recogniser lag {bias * 1000:+.0f} ms removed; ', end='')
print(f'{len(words)} script words, {len(heard)} heard; {snapped} words snapped to a sound onset; recogniser vs onset: median {np.median([d for d in dev if d > 0]) * 1000:.0f} ms, max {max(dev) * 1000:.0f} ms')
