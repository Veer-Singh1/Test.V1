# Check: do caption words land on the audio? Compares every word that follows a pause with the moment
# the sound actually starts (found from the loudness of the narration, independent of the recogniser).
# usage: python scripts/check_sync.py <narration 16 kHz wav> <timings.json>
import sys, json, numpy as np, soundfile as sf
y, sr = sf.read(sys.argv[1], dtype='float32'); words = json.load(open(sys.argv[2]))['words']
hop = int(0.005 * sr); env = np.array([np.sqrt(np.mean(y[i:i + hop] ** 2)) for i in range(0, len(y) - hop, hop)])
db = 20 * np.log10(env + 1e-9); sp = db > (np.percentile(db, 99) - 35)   # a different threshold and step from the aligner
on, i = [], 0
while i < len(sp):
    if sp[i]:
        j = i
        while j < len(sp) and (sp[j] or sp[j:j + 30].any()): j += 1
        if j - i >= 12: on.append(i * 0.005)
        i = j
    else: i += 1
dev = []
for o in on:
    w = min(words, key=lambda w: abs(w['start'] - o)); dev.append((abs(w['start'] - o), w['text'], o))
print(f"{len(on)} sound onsets checked: median {np.median([d[0] for d in dev]) * 1000:.0f} ms, max {max(dev)[0] * 1000:.0f} ms ({max(dev)[1]!r} at {max(dev)[2]:.2f} s); within 100 ms: {sum(d[0] <= 0.1 for d in dev)}/{len(dev)}")
