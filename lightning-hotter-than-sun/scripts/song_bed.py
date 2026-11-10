# Music bed from a supplied song: take a section of it, drop it out for about 1 s before the
# named concept (then bring it back), fade the last 5 s, and set it 18 dB under the voice.
# usage: python song_bed.py <song.wav> <offset_s> <script.json> <out.wav> <duration_s> <voice_lufs> <song_lufs>
import json, sys, numpy as np, soundfile as sf
song, off, src, out, dur, lv, ls = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4], float(sys.argv[5]), float(sys.argv[6]), float(sys.argv[7])
y, sr = sf.read(song, always_2d=True)
a = int(off * sr); n = int(dur * sr)
y = y[a:a + n]
if len(y) < n: y = np.vstack([y, np.zeros((n - len(y), y.shape[1]))])
data = json.load(open(src)); concept = next(s for s in data['sentences'] if s.get('concept'))['start']
g = np.ones(n)
d0, d1 = int((concept - 1.05) * sr), int((concept + 0.05) * sr)
g[d0:d1] = 0
g[d0 - int(0.2 * sr):d0] = np.linspace(1, 0, int(0.2 * sr))
g[d1:d1 + int(0.5 * sr)] = np.linspace(0, 1, int(0.5 * sr))
f0 = int((dur - 5) * sr); g[f0:] *= np.linspace(1, 0, n - f0) ** 1.5
g[:int(0.3 * sr)] *= np.linspace(0, 1, int(0.3 * sr))
gain_db = (lv - 18) - ls
y = y * g[:, None] * 10 ** (gain_db / 20)
sf.write(out, y.astype(np.float32), sr, subtype='PCM_16')
print(f'section {off:.2f}-{off + dur:.2f} s of the song, gain {gain_db:+.1f} dB, drop {concept - 1.05:.2f}-{concept + 0.05:.2f} s')
