# Original ambient music bed, generated in code (so it is royalty-free and yours):
# 64 BPM, slow minor pad + soft mid-range pulse + sparse piano-like notes.
# usage: python make_music.py <script.json> <out.wav> <duration_s>
import json, sys, numpy as np, soundfile as sf
src, out, dur = sys.argv[1], sys.argv[2], float(sys.argv[3])
sr = 44100; n = int(dur * sr); t = np.arange(n) / sr
rng = np.random.default_rng(7)
def note(f): return 440.0 * 2 ** ((f - 69) / 12)
def tone(freq, length, harm=(1, .5, .25, .12), decay=None):
    tt = np.arange(int(round(length * sr))) / sr
    y = sum(a * np.sin(2 * np.pi * freq * (i + 1) * tt + rng.uniform(0, 6)) for i, a in enumerate(harm))
    if decay: y *= np.exp(-tt / decay)
    return y
bpm = 64; beat = 60 / bpm; bar = 4 * beat
mix = np.zeros(n)
# pad: two chords alternating every 2 bars (Am(add9) -> Fmaj7), slow attack/release
chords = [[57, 64, 67, 71, 72], [53, 60, 64, 67, 69]]
seg = 2 * bar
for c in range(int(dur / seg) + 1):
    start = int(c * seg * sr)
    ln = min(int((seg + 1.5) * sr), n - start)
    if ln <= 0: break
    env = np.minimum(1, np.arange(ln) / (1.2 * sr)) * np.minimum(1, (ln - np.arange(ln)) / (1.5 * sr))
    pad = sum(tone(note(m), ln / sr, harm=(1, .35, .12))[:ln] for m in chords[c % 2]) / 5
    mix[start:start + ln] += 0.35 * pad * env
# soft pulse on every beat: low-mid thump (110 Hz + 220 Hz), short decay
pulse = np.zeros(n)
for b in range(int(dur / beat) + 1):
    s = int(b * beat * sr); ln = min(int(0.5 * sr), n - s)
    if ln <= 0: break
    tt = np.arange(ln) / sr
    p = (np.sin(2 * np.pi * 110 * tt) + 0.6 * np.sin(2 * np.pi * 220 * tt)) * np.exp(-tt / 0.09) * (1.0 if b % 4 == 0 else 0.6)
    pulse[s:s + ln] += 0.5 * p
# sparse piano-like notes (pentatonic A minor), one every bar, alternating
mel = [76, 72, 74, 69, 72, 67, 69, 64]
for i in range(int(dur / bar) + 1):
    s = int((i * bar + 2 * beat) * sr); ln = min(int(3.0 * sr), n - s)
    if ln <= 0: break
    mix[s:s + ln] += 0.22 * tone(note(mel[i % len(mel)]), ln / sr, harm=(1, .45, .2, .08), decay=0.9)[:ln]
# structure: music drops out ~1 s before the named concept, the pulse fades over the last 5 s
data = json.load(open(src)); concept = next(s for s in data['sentences'] if s.get('concept'))['start']
gate = np.ones(n)
a, b = int((concept - 1.05) * sr), int((concept + 0.05) * sr)
gate[a:b] = 0.0
for k, (x0, x1) in enumerate([(a - int(0.15 * sr), a), (b, b + int(0.35 * sr))]):
    rampn = x1 - x0; gate[x0:x1] = np.linspace(1, 0, rampn) if k == 0 else np.linspace(0, 1, rampn)
fade = np.ones(n); f0 = int((dur - 5) * sr); fade[f0:] = np.linspace(1, 0, n - f0)
y = (mix + pulse * fade) * gate
y *= np.minimum(1, t / 1.0)  # gentle start
y = y / np.max(np.abs(y)) * 0.8
sf.write(out, np.stack([y, y], 1).astype(np.float32), sr, subtype='PCM_16')
print('music', out, f'{dur:.1f}s; dropout {concept - 1.05:.2f}-{concept + 0.05:.2f}s')
