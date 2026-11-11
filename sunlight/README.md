# The sunlight on your face is 100,000 years old (Physics Shorts, Remotion)

Finished video: `out/sunlight.mp4` (1080×1920, 30 fps, H.264 + AAC, 77.9 s, −14 LUFS).
Narration: your ElevenLabs v4 take ("The Naturalist Soren"), uploaded as `assets/narration.mp3`.
Built on the same kit as `../moon` (style tokens in `src/style.ts`, reusable parts in `src/kit/`).

## Commands

| Step | Command |
|---|---|
| Word timings from the audio | `python scripts/align_audio.py <parakeet_model_dir> out/script.txt out/vo16.wav assets/timings.json` |
| Music bed (drops before the 2nd "random") | `python scripts/music.py assets/timings.json random:1 <duration> assets/music.wav 62` |
| Mix | `scripts/mix.sh <duration> 20` → `public/soundtrack.wav` |
| Check stills | `node scripts/stills.mjs out/stills 0 5 15 30 45 76.9` |
| Caption sync check | `python scripts/check_sync.py out/vo16.wav assets/timings.json` |
| Render | `npx remotion render src/index.ts Short out/sunlight.mp4 --crf=17` |

`scripts/narrate.ts` works as in the Moon project when `ELEVENLABS_API_KEY` and a `VOICE_ID` (in `src/script.ts`) are set. This take was made in the ElevenLabs app, so it wasn't used.

## Storyboard

| Time | Line | Picture |
|---|---|---|
| 0–6 s | The sunlight hitting your face right now… is about **ONE HUNDRED THOUSAND** years old. | The glowing Sun, a ray of light to YOU, counter 0 → 100,000 YEARS OLD, ring at your face |
| 7–13 s | Most people think sunlight takes eight minutes… That's only the **LAST** part. | "8 MINUTES" on the ray; a timeline: ~100,000 years inside the Sun, with the last 8 minutes as a tiny white tip |
| 14–21 s | Morning on your skin. Light through your window. A plant leaning toward the sky. | Three scenes: sun rays on a face, light through a window onto the floor, a plant bending toward the Sun |
| 22–24 s | But look at what's actually happening. | Into the Sun: core, radiative zone, surface |
| 25–36 s | That light is born in the Sun's core… packed so tight… a tiny fraction of a centimetre… | Zoom into the core: packed particles; the photon travels a short step ("A TINY FRACTION OF A CM") and crashes |
| 36–44 s | It bounces. Gets absorbed. Gets sent out again… in a random direction. | Bounce ring; the photon vanishes into a particle that glows (ABSORBED); it shoots out again in a random direction |
| 45–47 s | That's called a **RANDOM WALK**. | Music drops ~1 s before; stamp; the zig-zag path flashes Volt Blue (accent 1) |
| 48–62 s | Trillions upon trillions of bounces… about a hundred thousand. | Zoom out: the walk stumbles from the core to the surface; counters ~10²⁴ BOUNCES, then YEARS TO GET OUT → 100,000 |
| 63–69 s | And once it finally breaks free… straight to Earth in just eight minutes. | Volt Blue flash where it escapes (accent 2); it flies straight to your face; counter 0:00 → 8:20 |
| 70–78 s | So the warmth you feel today… while Neanderthals were still alive. | Your face glows warm; the timeline returns with Neanderthals at the start (100,000 YEARS AGO) and you at TODAY; loops back to frame 1 |

## Fact check

- **How long it takes.** Energy made in the core takes somewhere between about 10,000 and 170,000 years to reach the surface (NASA's range; estimates differ because the step length is uncertain). "Tens of thousands of years… often about a hundred thousand" is fair, and "about 100,000 years old" in the hook matches it.
- **It's not one photon.** Light is absorbed and re-emitted countless times, so what reaches you is the same *energy*, not literally the same particle. The script hints at this ("Gets absorbed. Gets sent out again"), and the picture shows it.
- **Step length.** In the dense interior a photon typically travels well under a millimetre, a tiny fraction of a centimetre, before interacting.
- **Number of steps.** A random walk needs about (radius ÷ step)² steps. With a radius of 7×10¹⁰ cm and steps of about 0.1 mm to 1 mm, that's roughly 10²³–10²⁵ steps, so "trillions upon trillions" (10²⁴) is right. The counter shows ~10²⁴.
- **8 minutes.** Light takes about 8 min 20 s to cross 150 million km, which the counter shows.
- **Neanderthals.** They lived from about 400,000 until about 40,000 years ago, so they were alive 100,000 years ago (and at the 10,000–170,000-year range's middle).

## Notes

- Length: 77.9 s, set by the narration (the kit aims for 45–50 s; this script runs 152 words).
- Volt Blue is used twice: RANDOM WALK and the moment the light breaks free.
- The random walk out of the Sun is drawn with a slight outward bias so it fits in 14 seconds. A true walk would wander for ~10²⁴ steps.
- Caption sync: 27 of 27 words that follow a pause land within 100 ms of the sound (median 0 ms, max 85 ms).
