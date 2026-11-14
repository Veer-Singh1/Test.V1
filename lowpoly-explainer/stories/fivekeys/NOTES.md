# Five Keys short: work in progress (handoff note, delete when the video is done)

Goal: a 60-second short on the Brink's robbery using the user's ElevenLabs take
(`voices/fivekeys_elevenlabs.mp3`, already copied to `public/fivekeys/voice_raw.wav`).
Every shot is a path-traced still ("plate") with a slow 2D move added in Remotion, except the
street clip (`out/street/frames`, 150 frames), which is the one animated shot.

The user's rule: if a usage limit hits, do not use extra usage. Schedule a continuation
(send_later, about 5 h 15 min ahead) and stop.

## Done
- `blender/lib.py` (shared palette, Geo, figure, props, render setup), `blender/street.py`
  refactored to `build()`, `blender/fivekeys.py` with all plate scenes (A street, B corridor
  and locks, C bench and calendar, D counting room, E cash, F pact, G cell, interview, prison).
- B and C plates previewed at low quality. Known fixes: B4 hand hid the lock (move the hand to
  the left), B5 too dark, B6-B10 figure too close to camera, C1 vice too dark.

## To do, in order
1. Preview D, E, F, G, A plates (`python blender/fivekeys.py --out /tmp/x --scale 30 --samples 10 --only ...`), fix framing.
2. Render all plates at full quality: `python blender/fivekeys.py` (about 1 to 2 min each, 35 plates).
3. `stories/fivekeys/script.json`: sentences as clauses, each with `{"scene": "plate", "plate": "B1", "camera": "push_in"}`;
   the truck clip is `{"scene": "plate", "clip": "street"}`. Text must match the voice (script is in the chat and in the fact check).
4. Remotion: plate/clip shots in `src/Explainer.tsx` (image or video with a linear 2D zoom or pan); keep captions and overlays.
   `pipeline/build_timeline.py`: do not split plate shots; honour `"keep": true` to skip the 1-second merge (key one ... key five).
5. `python pipeline/run.py fivekeys --skip-tts`, render with Remotion (`GL=swangle`, `CHROME_PATH` = Playwright headless shell),
   check frames, write `out/fivekeys/fivekeys.mp4`, commit, push, send to the user.

## If the container was replaced
`npm install`; `pip install bpy pillow sherpa-onnx soundfile numpy`; download
`sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8` from the sherpa-onnx GitHub `asr-models` release into `models/`.
The street clip frames are not in git: use `out/street/street.mp4` (already has the zoom baked in) if they are gone.
