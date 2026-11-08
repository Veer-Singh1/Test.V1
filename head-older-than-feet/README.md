# Your head is older than your feet (Physics Shorts kit)

Finished video: `head_older_than_feet.mp4` (1080×1920, 30 fps, 53.2 s, voiceover + music, −14 LUFS).

This is the first video built in the **Physics Shorts** house style (from *Physics Shorts Video Format & Style Production Kit*).
The folder doubles as a template for the next topic.

## Render it yourself (Windows)

- `render.bat` installs packages and renders `final.mp4`. The sound is already part of the composition.
- `test_render.bat` renders a quick 6-second half-size test into `out\test.mp4`.

## How it's built

| File | What it is |
|---|---|
| `src/script.json` | The 18 caption lines with their real spoken start/end times (written by the voice script) |
| `src/timing.js` | Word timings, `beat(sentence, word)` lookup, easing helpers |
| `src/kit/palette.js` | Kit colours (Void, White, Mist, Ash, Graphite, Volt Blue) and fonts (Inter, Playfair Display) |
| `src/kit/Captions.jsx` | Kit captions: top third, at most 2 lines, word-by-word grey→white blur reveal, ALL-CAPS punch words in Inter Black, *starred* feeling words in Playfair Italic |
| `src/kit/elements.jsx` | Line-art parts: figure, clock, labels, pill tag, shockwave ring, dot |
| `src/Scene.jsx` | The world (one continuous camera with eased moves and drift) and the overlays (counters, stamp) |
| `src/Video.jsx` / `src/Root.jsx` | Composition `HeadOlderThanFeet` |
| `scripts/synth_line.py` | Kokoro TTS per sentence → `public/voiceover.wav` + timings in `script.json` |
| `scripts/make_music.py` | Generates the original music bed → `public/music.wav` |
| `scripts/mix.sh` | Voice + music → loudness-normalised `public/soundtrack.wav` |
| `scripts/stills.mjs`, `scripts/sheet.py` | Check stills and contact sheets |

## Making the next Short from this template

1. Put the new lines in `src/script.json` (ALL CAPS = punch word, `*word*` = feeling word, `"concept": true` on the line that names the idea).
2. Run `scripts/synth_line.py`, then `scripts/make_music.py`, then `scripts/mix.sh <duration>`.
3. Replace the beats in `src/Scene.jsx` (camera keys + world objects). The captions follow the timings automatically.

Script and fact check: see `script.md`.
