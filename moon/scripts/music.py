# Original ambient bed, synthesised here (nothing copyrighted): a soft low pulse at 62 BPM plus a mid pad
# and sparse bell notes. It drops out for 1 s before the named concept and fades over the last 5 s.
# usage: python scripts/music.py <timings.json> <drop word> <duration_s> <out.wav> [bpm]
import json, sys, re, numpy as np, soundfile as sf
src, drop_word, dur, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
bpm = float(sys.argv[5]) if len(sys.argv) > 5 else 62
sr = 48000; n = int(dur * sr); t = np.arange(n) / sr; rng = np.random.default_rng(7)
note = lambda m: 440.0 * 2 ** ((m - 69) / 12)
def tone(freq, length, harm=(1, .5, .25, .12), decay=None):
    tt = np.arange(int(round(length * sr))) / sr
    y = sum(a * np.sin(2 * np.pi * freq * (i + 1) * tt + rng.uniform(0, 6)) for i, a in enumerate(harm))
    return y * np.exp(-tt / decay) if decay else y
beat = 60 / bpm; bar = 4 * beat; mix = np.zeros(n)
chords = [[50, 57, 62, 65, 69], [46, 53, 58, 62, 65]]            # Dm(add9) <-> Bbmaj7, two bars each
seg = 2 * bar
for c in range(int(dur / seg) + 1):
    s = int(c * seg * sr); ln = min(int((seg + 1.5) * sr), n - s)
    if ln <= 0: break
    env = np.minimum(1, np.arange(ln) / (1.3 * sr)) * np.minimum(1, (ln - np.arange(ln)) / (1.5 * sr))
    mix[s:s + ln] += 0.35 * sum(tone(note(m), ln / sr, harm=(1, .35, .12))[:ln] for m in chords[c % 2]) / 5 * env
pulse = np.zeros(n)
for b in range(int(dur / beat) + 1):
    s = int(b * beat * sr); ln = min(int(0.5 * sr), n - s)
    if ln <= 0: break
    tt = np.arange(ln) / sr
    pulse[s:s + ln] += 0.5 * (np.sin(2 * np.pi * 98 * tt) + 0.6 * np.sin(2 * np.pi * 196 * tt)) * np.exp(-tt / 0.09) * (1.0 if b % 4 == 0 else 0.6)
mel = [74, 69, 72, 65, 69, 62, 67, 65]
for i in range(int(dur / bar) + 1):
    s = int((i * bar + 2 * beat) * sr); ln = min(int(3.0 * sr), n - s)
    if ln <= 0: break
    mix[s:s + ln] += 0.2 * tone(note(mel[i % len(mel)]), ln / sr, harm=(1, .45, .2, .08), decay=0.9)[:ln]
words = json.load(open(src))['words']
concept = next(w['start'] for w in words if re.sub(r'[^A-Za-z]', '', w['text']).lower() == drop_word.lower())
g = np.ones(n); a, b = int((concept - 1.05) * sr), int((concept - 0.02) * sr)
g[a:b] = 0; g[a - int(0.15 * sr):a] = np.linspace(1, 0, int(0.15 * sr)); g[b:b + int(0.4 * sr)] = np.linspace(0, 1, int(0.4 * sr))
fade = np.ones(n); f0 = int((dur - 5) * sr); fade[f0:] = np.linspace(1, 0, n - f0) ** 1.5
y = (mix + pulse) * g * fade * np.minimum(1, t / 1.0)
sf.write(out, (y / np.max(np.abs(y)) * 0.8).astype(np.float32), sr, subtype='PCM_16')
print(f'music {dur:.1f} s at {bpm:.0f} BPM; drop {concept - 1.05:.2f}-{concept:.2f} s; fade from {dur - 5:.1f} s')
