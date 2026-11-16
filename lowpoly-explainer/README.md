# Low-poly true-crime explainer

A pipeline that turns a `script.json` into a 9:16 narrated video: full-screen low-poly 3D scenes,
karaoke captions, kicker titles, gold number badges and name tags. Built from the production spec
(Remotion + React Three Fiber for picture, Python + FFmpeg for voice and timing).

| Story | Length | Output |
| --- | --- | --- |
| `stories/antwerp`: the 2003 Antwerp diamond heist | 65 s test | `out/antwerp/antwerp-elevenlabs.mp4` |
| `stories/brinks`: the 1950 Brink's robbery in Boston | 6.4 min, full format | `out/brinks/brinks-preview.mp4` (stand-in voice) |
| `stories/fivekeys`: the Brink's robbery as a one-minute short | 62 s, path-traced look | `out/fivekeys/fivekeys.mp4` |

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

On a machine without a GPU, add `GL=swangle` in front of the render and sheet commands of the 3D
explainers (they need WebGL). Leave it off for the `Documentary` composition: it has no WebGL, and
software GL emulation renders its collage frames about 4× slower than Chrome's own CPU rasteriser
(1.1 vs ~4.5 frames a second on a 4-core machine).
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
python blender/street.py --out out/street/frames --frames 90 --hold 60 --scale 75 --samples 24
python blender/assemble.py out/street/frames out/street/street.mp4 --zoom 1.10
```

Outputs: `out/street/street-still.jpg` and `out/street/street.mp4` (5 seconds, no audio, no text). The truck pulls up over 90 frames; `--hold 60` adds two seconds where it waits and the driver switches the headlights off.

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

### Fast drafts, and splitting a render between two computers

`--fast` cuts light bounces from 5 to 3 and turns off motion blur. At `--scale 50 --samples 8` a frame
takes 7.6 s on the cloud machine instead of 37 s, and still looks close to the full version. Each run
writes `times_<label>.json` with the seconds for every frame and prints the average at the end, so two
computers can be compared. A run skips frames that already exist, so it can be stopped and resumed.

```bash
# laptop (about 0.6x the cloud's speed) takes the first 37% of the frames, the cloud the rest;
# frame 34 is rendered on both to check that the two halves match
py -3.13 blender/street.py --out out/test/laptop --frames 90 --start 1 --end 34 --scale 50 --samples 8 --fast --label laptop
python3 blender/street.py --out out/test/cloud --frames 90 --start 34 --end 90 --scale 50 --samples 8 --fast --label cloud
```

Measured: the laptop (Intel Iris Xe, so CPU only) took 10.4 s a frame and the cloud 7.3 s, so the laptop
is about 0.7x as fast and should take about 41% of the frames. Frame 34 from the two machines differed by
0.26/255 on average, a third of the change between neighbouring frames, so the join cannot be seen.

### Dragon in flight

The default look is realistic, built from free CC0 assets by [Poly Haven](https://polyhaven.com), which
the script downloads into `blender/assets/polyhaven/` (not committed: about 100 MB):

- the sky and its light: [Belfast Sunset (Pure Sky)](https://polyhaven.com/a/belfast_sunset_puresky), 4k HDRI, turned so the sun sets just right of frame
- [fir_sapling_medium](https://polyhaven.com/a/fir_sapling_medium): 1,600 instances of one 1.5-million-triangle fir
- [snow_02](https://polyhaven.com/a/snow_02) and [aerial_rocks_02](https://polyhaven.com/a/aerial_rocks_02) on a 10 km terrain: snow on gentle slopes, grey rock on steep ones, mountains rising kilometres away

The dragon gets a smooth, subdivided skin with a scale bump, and the fire and smoke puffs are smooth spheres
whose edges fade out. Each see-through puff costs two transparent bounces, so the limit is 64; at 16 the
smoke turned into flat opaque patches. A frame takes about 21 s at 648 x 1152 with 10 samples.
`--lowpoly` renders the earlier faceted look described below.


`blender/dragon.py` renders 10 seconds of a low-poly dragon flying over a snowy valley at sunset and
breathing fire twice, with the camera travelling alongside it.

- **The dragon** is built in the script from faceted shapes on a skeleton (armature) of 17 bones, so the
  wings beat, the neck rears back and lunges, the jaw opens and the tail sways.
- **The fire** is about 440 low-poly puffs, each keyed frame by frame. They leave the mouth as stretched,
  white-hot tongues, carry the dragon's speed, slow in the air, rise, cool through orange and red, and turn
  to grey smoke. A hot core and two flickering lights in the flame light the dragon's head and wings.
- **The scenery** is free CC0 models by [Quaternius](https://quaternius.com): mountains, clouds, pine
  trees and rocks, in `blender/assets/quaternius/`. Missing ones are downloaded on the first run from a
  public mirror of the packs ([quaternius-showcase](https://github.com/trebeljahr/quaternius-showcase)).

```bash
python3 blender/dragon.py --out frame.png --frame 140 --scale 60 --samples 10 --fast    # one test frame
# split between the laptop (frames 1-123, 41%) and the cloud (123-300); frame 123 is done on both
py -3.13 blender/dragon.py --out out/dragon/laptop --start 1 --end 123 --scale 60 --samples 10 --fast --jpg --label laptop
python3 blender/dragon.py --out out/dragon/cloud --start 123 --end 300 --scale 60 --samples 10 --fast --jpg --label cloud
python3 blender/assemble.py out/dragon/frames out/dragon/dragon.mp4 --zoom 1.0         # after joining the two folders
```

At 648 x 1152 and 10 samples a frame takes 8 to 14 s on the cloud machine; the fire frames are the slow
ones. The smoke is see-through, which makes the mist pass grainy there, so the script blurs that pass a
little before the haze uses it.

Measured on the first full render: the laptop did frames 1-123 in 26 min (12.7 s a frame) and the cloud
frames 123-300 in 35 min (11.9 s a frame). On the same frame the laptop was 0.62x the cloud's speed, but its
share had no fire in the first 3 seconds, so it finished early; give it frames 1-150 next time. Frame 123
from the two machines differed by 0.07/255 on average.

Two choices keep the render time sane on a machine with no GPU:

- **The camera is locked off in 3D** and the slow push-in is added afterwards as a zoom. With a
  fixed noise seed, every pixel the truck does not affect is then identical from frame to frame,
  so 24 samples per pixel is enough and nothing shimmers. `--dolly` moves the camera for real,
  but needs roughly three times the samples to look as clean.
- **Frames render at 75% size** and are upscaled to 1080 x 1920 when assembled.

The script targets Blender 5.3 (`bpy` 5.3.0). Its compositor is set to CPU because the default needs a GPU.

### A whole video in the path-traced look: Five Keys

`stories/fivekeys` is a 62-second short made entirely in this look. Animating every shot in 3D
would take days on a CPU, so each shot is one path-traced still (a "plate") plus a depth map,
and Remotion moves a virtual camera through it. Only the truck clip is animated in Blender.

**How the camera moves through a still** (`src/Plate3D.tsx`): the picture is laid over a fine
mesh, each point pushed back to its real distance from the depth map, and seen through a camera
that travels during the shot. Near things slide past far things, as with a real dolly or track.
A move uncovers things the still never saw, so three layers are drawn:

| Layer | What it is | Where it shows |
| --- | --- | --- |
| Front | The picture, cut exactly at its depth edges | Everywhere it is still valid |
| Middle | The picture with near things filled in from what is just behind them (the wall behind a railing) | Small gaps, and the 2-pixel fringe around each figure |
| Back | The same, filled as far as the shot's widest gap needs (the sky behind a building) | Large gaps |

```bash
python blender/fivekeys.py --samples 48 --threshold 0.03    # 35 plates into public/fivekeys/plates (about 55 min)
python blender/fivekeys.py --only D2 --force                # redo one plate
python blender/fivekeys.py --depth --clip --force           # depth maps, plates and truck clip (about 15 min)
python blender/layers.py public/fivekeys/plates --force     # fringe flags and fill layers (about 11 min)
python pipeline/run.py fivekeys --skip-tts                  # voice -> timings -> timeline
npm run render -- out/fivekeys/raw.mp4 --props='{"story":"fivekeys"}'   # about 1 h 40 min without a GPU
```

`public/fivekeys/plates/reach.json` sets how far each back layer is filled. It comes from
measuring the widest gap each shot's move opens. The truck clip's per-frame files
(`plates/street/`, 900 files) are not in git; the two `--depth --clip` and `layers.py` commands
rebuild them.

In `script.json` a plate shot is `{"scene": "plate", "plate": "B1", "camera": "push_in"}` and the
clip is `{"scene": "plate", "clip": "street"}`. Camera moves: `push_in`, `pull_out`,
`track_left`, `track_right`, `rise`. `"move": 0.4` shortens a move where the camera passes close
to something (the street, the alarm close-up). `"keep": true` lets a shot run shorter than one
second (the five doors), and `"cut": true` on an overlay ends it with its shot.

| File | What it holds |
| --- | --- |
| `blender/lib.py` | Shared palette, geometry collector, the character, props, render and depth settings |
| `blender/street.py` | The street: `build()` takes options for crew, truck, cars, daylight |
| `blender/fivekeys.py` | One function per plate: corridor and locks, bench, calendar, counting room, cash, pact, cell, interview room, prison |
| `blender/layers.py` | Fringe flags and the middle and back fill layers |
| `src/Plate3D.tsx` | Moves a camera through a plate (used when it has a depth map) |
| `src/Plate.tsx` | The older 2D zoom or pan, for plates without depth |

## Differences from the spec

- **Bloom and vignette** are done without a post-processing pass: lamps carry an additive halo and the vignette is a CSS gradient. Same look, much faster to render.
- **Character design is my own**, as the spec asked: a faceted head on a tapered six-sided coat with no limbs.
- **Remotion** is free for individuals and small teams. Larger companies need a licence.
