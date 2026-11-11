# Time a voiceover against src/script.json from the audio itself (no speech recognition needed).
#  - Full mode (an external voiceover, e.g. from ElevenLabs): finds the speech segments by silence and
#    groups them into the script's sentences (dynamic programming on expected length), writing start/end.
#  - --marks-only (start/end already known, e.g. our own TTS): just finds the pauses inside sentences.
# Both modes store the pauses inside a sentence ("…", commas) as marks, so word reveals skip the pause.
# usage: python align_vo.py <voice.wav> <script.json> [--marks-only]
import json, sys, re, numpy as np, soundfile as sf
wav, src = sys.argv[1], sys.argv[2]
marks_only = '--marks-only' in sys.argv
y, sr = sf.read(wav, always_2d=True); y = y.mean(axis=1)
hop = int(0.01 * sr)
env = np.array([np.sqrt(np.mean(y[i:i + hop] ** 2)) for i in range(0, len(y) - hop, hop)])
db = 20 * np.log10(env + 1e-9)
speech = db > (np.percentile(db, 99) - 38)
# fill tiny dips (< 0.1 s) and drop blips (< 0.06 s)
def runs(mask):
    out, i = [], 0
    while i < len(mask):
        j = i
        while j < len(mask) and mask[j] == mask[i]: j += 1
        out.append([bool(mask[i]), i, j]); i = j
    return out
for v, a, b in runs(speech):
    if not v and b - a < 10 and a > 0: speech[a:b] = True
for v, a, b in runs(speech):
    if v and b - a < 6: speech[a:b] = False
segs = [(a * 0.01, b * 0.01) for v, a, b in runs(speech) if v]
data = json.load(open(src)); S = data['sentences']
letters = lambda s: max(1, len(re.sub(r'[^A-Za-z0-9]', '', s)))
L = [letters(s['display']) for s in S]
PUNCT = re.compile(r'(…|,|:|;|\?|!|\.)$')
inner_punct = [sum(1 for w in s['display'].split()[:-1] if PUNCT.search(w.replace('*', ''))) for s in S]

if not marks_only:
    N, M = len(S), len(segs)
    if M < N: sys.exit(f'only {M} speech segments for {N} sentences: some sentences run together; split the script differently')
    rate = (segs[-1][1] - segs[0][0]) / sum(L)
    for _ in range(3):
        INF = 1e18
        cost = np.full((N + 1, M + 1), INF); back = np.zeros((N + 1, M + 1), int); cost[0, 0] = 0
        for i in range(1, N + 1):
            for j in range(i, M + 1):
                for k in range(i - 1, j):
                    if cost[i - 1, k] >= INF: continue
                    dur = segs[j - 1][1] - segs[k][0]; exp = L[i - 1] * rate
                    extra = max(0, (j - k - 1) - inner_punct[i - 1])
                    c = cost[i - 1, k] + (dur - exp) ** 2 / exp + 0.6 * extra
                    if c < cost[i, j]: cost[i, j] = c; back[i, j] = k
        groups, j = [], M
        for i in range(N, 0, -1): k = back[i, j]; groups.append((k, j)); j = k
        groups.reverse()
        rate = sum(segs[j - 1][1] - segs[k][0] for k, j in groups) / sum(L)
    for s, (k, j) in zip(S, groups):
        s['start'], s['end'] = round(segs[k][0], 3), round(segs[j - 1][1], 3)
        s['pauseBefore'] = None

# pauses inside each sentence -> marks after the punctuated word nearest to each pause
for s in S:
    s.pop('marks', None)
    inner = [(a, b) for a, b in zip([e for _, e in segs], [st for st, _ in segs[1:]]) if a > s['start'] + 0.05 and b < s['end'] - 0.05 and b - a >= 0.12]
    words = s['display'].split()
    cand = [i for i, w in enumerate(words[:-1]) if PUNCT.search(w.replace('*', ''))]
    if not inner or not cand: continue
    tot = sum(letters(w) for w in words); acc, pos = 0, {}
    for i, w in enumerate(words): acc += letters(w); pos[i] = s['start'] + (s['end'] - s['start']) * acc / tot
    marks, used = [], set()
    for a, b in inner:
        i = min((c for c in cand if c not in used), key=lambda c: abs(pos[c] - a), default=None)
        if i is None: continue
        used.add(i); marks.append([i, round(a, 3), round(b, 3)])
    s['marks'] = sorted(marks)
json.dump(data, open(src, 'w'), indent=1, ensure_ascii=False)
for s in S: print(f"{s['start']:6.2f}-{s['end']:6.2f} {s['display']}  {s.get('marks', '')}")
