# The Moon is running away (Physics Shorts, Remotion)

Finished video: `out/moon.mp4` (1080×1920, 30 fps, H.264 + AAC, 52.7 s, −14 LUFS).

## Commands

| Step | Command | Credits |
|---|---|---|
| Character count | `npx tsx scripts/narrate.ts --count` | none |
| Check key and voice | `npx tsx scripts/narrate.ts --check` | none |
| Generate narration + timings | `npx tsx scripts/narrate.ts --yes` | **spends credits** (cached by a hash of script, voice and model) |
| Timings from an audio file instead | `python scripts/align_audio.py <parakeet_model_dir> out/script.txt out/vo16.wav assets/timings.json` | none |
| Music bed | `python scripts/music.py assets/timings.json tidal <duration> assets/music.wav 62` | none |
| Mix | `scripts/mix.sh <duration> 20` → `public/soundtrack.wav` | none |
| Check stills | `node scripts/stills.mjs out/stills 0 5 15 30 45 51.6` | none |
| Caption sync check | `python scripts/check_sync.py out/vo16.wav assets/timings.json` | none |
| Render | `npx remotion render src/index.ts Short out/moon.mp4 --crf=17` | none |

`narrate.ts` reads `ELEVENLABS_API_KEY` from the environment or `.env` (never committed; see `.env.example`), calls
`/v1/text-to-speech/{voice}/with-timestamps` with `eleven_v4`, and writes `assets/narration.mp3`, `assets/alignment.json` and `assets/timings.json` with the `[tags]` removed.

**How this render's narration was made:** the cloud session could not reach the ElevenLabs API, so the narration is the ElevenLabs v4 file uploaded by hand, and the word timings come from `align_audio.py` (offline speech recognition matched to the script, with words after a pause snapped to the sound onset). There is therefore no `alignment.json` for this render.

## Making a new video

Only three things change:
1. `src/script.ts`: the script, voice and the soft (italic) words. ALL-CAPS words become punch words.
2. `src/scenes.tsx`: the scene list, camera keys and counters, all timed with `at('word')`.
3. Run narrate → music → mix → render.

Style tokens (colours, type sizes, safe zones, caption timing, camera drift, music settings) all live in `src/style.ts`. The reusable kit is in `src/kit/`.

## Notes

- Volt Blue is used twice: TIDAL FRICTION and the laser's return.
- The laser counter runs in real time: the 2.56 s on screen is the actual round-trip time of light to the Moon and back.
- The tidal bulge's lead angle is exaggerated (really about 3°) so it can be seen.
- For the seamless loop, leftover diagram parts fade out in the last two seconds, and the Moon is repositioned once while it is off screen (around 28 s).
- Facts: 3.8 cm a year (lunar laser ranging); about 22-hour days roughly 400 million years ago (Devonian coral growth rings, Wells 1963); Apollo 11, 14 and 15 left retroreflectors.
