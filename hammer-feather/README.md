# The hammer and the feather (low-poly 3D, Remotion + three.js)

Finished video: `out/hammer-feather.mp4` (1080×1920, 30 fps, H.264 + AAC, 66.1 s, −14 LUFS).
Narration: your ElevenLabs v4 take (`assets/narration.mp3`), timed with `scripts/align_audio.py`.

- `src/world3d.ts`: the low-poly models (astronaut, hammer, feather, Moon terrain, park, vacuum chamber).
- `src/scenes.tsx`: camera poses, the animation and the 2D overlays, all timed with `at('word')`.
- `src/style.ts`, `src/kit/`: the shared style tokens, captions and counters.

Render: `npx remotion render src/index.ts Short out/hammer-feather.mp4 --gl=swangle --crf=17` (about 5 minutes here).
Music and mix: `python scripts/music.py assets/timings.json free <duration> assets/music.wav 62`, then `scripts/mix.sh <duration> 20`.

## Fact check

- Apollo 15, 2 August 1971: Commander David Scott dropped a 1.32 kg geological hammer and a 0.03 kg falcon feather; they landed together.
- The hammer is 44 times heavier, so gravity pulls 44 times harder on it, and it is 44 times harder to accelerate. Both fall at the Moon's 1.62 m/s².
- The on-screen fall time (1.22 s from hand height) is the real time for that height on the Moon, and the drop plays in real time.
- The vacuum-chamber drop: NASA's Space Power Facility in Ohio, filmed for the BBC's *Human Universe* (2014).
- Aristotle lived 384–322 BC; "two-thousand-year-old idea" is fair (about 2,300 years).
- "Almost no air": the Moon has only an extremely thin exosphere.
