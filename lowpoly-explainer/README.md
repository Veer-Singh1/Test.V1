# Low-poly true-crime explainer

A pipeline that turns a `script.json` into a 9:16 narrated video: full-screen low-poly 3D scenes,
karaoke captions, kicker titles, gold number badges and name tags. Built from the production spec
(Remotion + React Three Fiber for picture, Python + FFmpeg for voice and timing).

| Story | Length | Output |
| --- | --- | --- |
| `stories/antwerp`: the 2003 Antwerp diamond heist | 65 s test | `out/antwerp/antwerp-elevenlabs.mp4` |
| `stories/brinks`: the 1950 Brink's robbery in Boston | 6.4 min, full format | `out/brinks/brinks-preview.mp4` (stand-in voice) |

## Run it

```bash
npm install
pip install -r pipeline/requirements.txt

# voice -> speed-up -> word timings -> shot list   (steps 3 to 7)
python pipeline/run.py antwerp --provider elevenlabs     # needs ELEVENLABS_API_KEY
python pipeline/run.py antwerp --provider local          # free stand-in voice

# or use a take made in the ElevenLabs app: convert it, then skip step 3
ffmpeg -i voices/antwerp_elevenlabs_brian.mp3 -ar 44100 -ac 1 public/antwerp/voice_raw.wav
python pipeline/run.py antwerp --skip-tts

# render   (step 8)
npm run render -- out/antwerp/antwerp.mp4 --props='{"story":"antwerp"}'

# narration as plain text, to paste into the ElevenLabs app
python pipeline/export_text.py brinks          # -> stories/brinks/voice_script.txt

# contact sheets, one frame per shot, in pages of 28   (step 9)
npm run sheet -- antwerp
npm run sheet -- antwerp --overlays
npm run sheet -- brinks --scenes=street,cell   # only some scenes, after changing them

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

The stand-in voice reads from a word list and skips words it doesn't have. `tts.py` builds the
missing entries for possessives, contractions and plurals from their base word. Names go in
`voice.local_lexicon` in `script.json` as phonemes, for example `"pino": "p ˈ i n O"`. Unknown
words are printed as `no pronunciation for: ...`. None of this affects ElevenLabs.

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
- `zoom`: multiplies the camera distance, for example `1.35` to fit an 11-man lineup.
- `time`: `day`, `dusk`, `night`.
- Overlay `kind`: `badge` (`value`, `prefix`, `suffix`, `label`), `kicker` (`line1`, `line2`, `red`), `nametag` (`name`, `place`).
- The title card is a shot with `"scene": "title"`. Its text comes from the top-level `title`.

## Scene library

Twenty scenes, registered in `src/three/Stage.tsx`. Reusing a scene with a different camera,
time of day or switch gives a new-looking shot.

| Scene | Switches |
| --- | --- |
| `street` | `sign`, `brick`, `gem`, `truck` (`armored`, `getaway`), `drive` (`in`, `out`), `crew`, `masks`, `sacks` |
| `skyline` | |
| `neighborhood` | `car`, `flash`, `figure` (coat), `lying`, `agents` |
| `roadside` | `car`, `bag`, `crew`, `local` |
| `junkyard` | `fire`, `agents` |
| `vault_door` | `lasers`, `open`, `crew` (count) |
| `vault_room` | `lasers`, `open` |
| `counting_room` | `workers`, `robbers`, `masks`, `tied`, `empty`, `sacks` |
| `door_lock` | `label`, `key`, `remove`, `open`, `crew`, `masks` |
| `stairs` | `crew`, `masks`, `sacks` (carrying down) |
| `diamonds` | |
| `cash` | `sacks`, `few` |
| `office` | `coat`, `hat`, `gems`, `files` |
| `desk` | `prop`: `blueprint` (`label`, `sub`), `envelopes`, `sandwich`, `keys`, `cylinder`, `masks`, `clues`, `newspaper`, `calendar`, `book` (`text`, `sub`) |
| `lineup` | `count`, `highlight`, `prison`, `cast: "crew"`, `outfit`, `masks`, `coat` and `hat` (one figure) |
| `board` | |
| `interrogation` | `coat`, `agents` |
| `courtroom` | `count` (defendants) |
| `cell` | `coat`, `empty` |
| `title` | `drift` (`gems`, `cash`) |

Coats can be named: `pino`, `okeefe`, `navy`, `worker`, `agent`, `hitman`, `prison`, `judge`,
or given as a colour.

To add a scene, write a component in `src/three/scenes/`, add it to `SCENES` with a camera target
and distance, and use its key in `script.json`. Shared pieces (boxes, lamps, signs, the character)
are in `src/three/parts.tsx`.

## Path-traced look test (Blender)

`blender/street.py` is an experiment in how realistic the low-poly look can get. The geometry is
still flat-shaded boxes, prisms and cones, but the light is simulated with Blender's Cycles path
tracer instead of the real-time renderer the videos use.

```bash
pip install bpy pillow                                   # Blender as a Python module; no GPU needed
python blender/street.py --out still.png --frame 82 --frames 90 --scale 100 --samples 96 --threshold 0.012
python blender/street.py --out out/street/frames --frames 90 --scale 75 --samples 24
python blender/assemble.py out/street/frames out/street/street.mp4
```

Outputs: `out/street/street-still.png` and `out/street/street.mp4` (3 seconds, no audio, no text).

What the path tracer adds over the Remotion scenes:

| Effect | Remotion + three.js scenes | This test |
| --- | --- | --- |
| Shadows | None | Soft, from every lamp |
| Bounced light | None (flat ambient) | Simulated: warm lamp light spills onto walls and road |
| Reflections | None | Wet setts and standing water mirror lamps, windows and headlights |
| Glow around lamps | Painted-on halo sprite | Bloom computed from the real brightness |
| Depth of field | None | Real lens blur at f/1.4, focused on the men at the door |
| Haze with distance | Linear fog | Depth haze from the render's mist pass |
| Render time per frame | about 0.3 s | about 40 s at 810 x 1440 on 4 CPU cores |

Two choices keep the render time sane on a machine with no GPU:

- **The camera is locked off in 3D** and the slow push-in is added afterwards as a zoom. With a
  fixed noise seed, every pixel the truck does not affect is then identical from frame to frame,
  so 24 samples per pixel is enough and nothing shimmers. `--dolly` moves the camera for real,
  but needs roughly three times the samples to look as clean.
- **Frames render at 75% size** and are upscaled to 1080 x 1920 when assembled.

The script targets Blender 5.3 (`bpy` 5.3.0). Its compositor is set to CPU because the default needs a GPU.

## Differences from the spec

- **Bloom and vignette** are done without a post-processing pass: lamps carry an additive halo and the vignette is a CSS gradient. Same look, much faster to render.
- **Character design is my own**, as the spec asked: a faceted head on a tapered six-sided coat with no limbs.
- **Remotion** is free for individuals and small teams. Larger companies need a licence.
