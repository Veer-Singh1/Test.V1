# Low-poly true-crime explainer

A pipeline that turns a `script.json` into a 9:16 narrated video: full-screen low-poly 3D scenes,
karaoke captions, kicker titles, gold number badges and name tags. Built from the production spec
(Remotion + React Three Fiber for picture, Python + FFmpeg for voice and timing).

The test story is `stories/antwerp`: a 65-second original script about the 2003 Antwerp diamond
heist. Output: `out/antwerp/antwerp-test.mp4`.

## Run it

```bash
npm install
pip install -r pipeline/requirements.txt

# voice -> speed-up -> word timings -> shot list   (steps 3 to 7)
python pipeline/run.py antwerp --provider elevenlabs     # needs ELEVENLABS_API_KEY
python pipeline/run.py antwerp --provider local          # free stand-in voice

# render   (step 8)
npm run render -- out/antwerp/antwerp.mp4 --props='{"story":"antwerp"}'

# contact sheet, one frame per shot   (step 9)
npm run sheet -- antwerp
npm run sheet -- antwerp --overlays

# live preview while editing scenes
npm run studio
```

On a machine without a GPU, add `GL=swangle` in front of the render and sheet commands.
To use a Chrome that is already installed, set `CHROME_PATH` to its binary.

## Models

Two model folders go in `models/` (or point `EXPLAINER_MODELS` at them). Both download from
the sherpa-onnx GitHub releases page:

| Folder | Used for | Needed when |
| --- | --- | --- |
| `sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8` | Word timings (`asr-models` release) | Always |
| `kokoro-multi-lang-v1_0` | Stand-in voice (`tts-models` release) | Only with `--provider local` |

The spec suggested faster-whisper for timings. Its models could not be downloaded on the build
machine, so alignment uses Parakeet instead. Only the `recognise` function in `pipeline/align.py`
would change to swap it back.

## How a video is put together

| Step | File | What it does |
| --- | --- | --- |
| 1. Script | `stories/<slug>/script.json` | Beats, sentences, one shot and optional overlay per sentence |
| 2. Fact check | `stories/<slug>/factcheck.md` | Every number, name and date with its status |
| 3. Voice | `pipeline/tts.py` | One call per beat, joined into `voice_raw.wav` |
| 4. Process | `pipeline/process_voice.py` | Caps silences at 0.12 s, speeds up to 235 wpm, normalises to -14 LUFS |
| 5. Align | `pipeline/align.py` | Word start times from the processed audio, snapped to the script text |
| 6-7. Timeline | `pipeline/build_timeline.py` | Shots, caption chunks and overlay cues as `public/<slug>/timeline.json` |
| 8. Render | `src/` | Remotion draws scene, captions and overlays per frame and muxes audio |
| 9. Check | `scripts/contact-sheet.mjs` | Contact sheets of shots and overlays |

Timeline rules, all from the spec:

- A sentence with a `shot` starts a new shot on its first word. A sentence without one continues the previous shot.
- A shot under 1 s merges into the one before. A shot over 6 s splits in two with a second camera move.
- Captions are chunks of up to 3 words and 16 characters, breaking after punctuation.
- An overlay starts on its `on_word`.

## Writing a script

```json
{
  "text": "More than 100 million dollars in diamonds, gone.",
  "shot": {"scene": "diamonds", "camera": "orbit_low", "time": "night"},
  "overlay": {"kind": "badge", "value": 100, "prefix": "$", "suffix": " MILLION", "label": "IN DIAMONDS", "on_word": "100"}
}
```

- `camera`: `push_in`, `pull_out`, `track_left`, `track_right`, `orbit_low`, `top_down`. All move linearly for the whole shot.
- `time`: `day`, `dusk`, `night`.
- Overlay `kind`: `badge` (`value`, `prefix`, `suffix`, `label`), `kicker` (`line1`, `line2`, `red`), `nametag` (`name`, `place`).
- The title card is a shot with `"scene": "title"`. Its text comes from the top-level `title`.

## Scene library

Twelve scenes, registered in `src/three/Stage.tsx`. Reusing a scene with a different camera,
time of day or switch gives a new-looking shot.

| Scene | Switches |
| --- | --- |
| `street` | |
| `skyline` | |
| `roadside` | `car`, `bag`, `crew`, `local` |
| `vault_door` | `lasers`, `open`, `crew` (count) |
| `vault_room` | `lasers`, `open` |
| `diamonds` | |
| `office` | |
| `desk` | `prop`: `blueprint`, `envelopes`, `sandwich` |
| `lineup` | `count`, `highlight`, `prison` |
| `board` | |
| `cell` | |
| `title` | |

To add a scene, write a component in `src/three/scenes/`, add it to `SCENES` with a camera target
and distance, and use its key in `script.json`. Shared pieces (boxes, lamps, signs, the character)
are in `src/three/parts.tsx`.

## Differences from the spec

- **Bloom and vignette** are done without a post-processing pass: lamps carry an additive halo and the vignette is a CSS gradient. Same look, much faster to render.
- **Character design is my own**, as the spec asked: a faceted head on a tapered six-sided coat with no limbs.
- **Remotion** is free for individuals and small teams. Larger companies need a licence.
