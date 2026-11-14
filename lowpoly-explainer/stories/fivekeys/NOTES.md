# Five Keys short: work in progress (handoff note, delete when the video is done)

Goal: a 60-second short on the Brink's robbery using the user's ElevenLabs take
(`voices/fivekeys_elevenlabs.mp3`, already copied to `public/fivekeys/voice_raw.wav`).
Every shot is a path-traced still ("plate") with a slow 2D move added in Remotion, except the
street clip (`out/street/frames`, 150 frames), which is the one animated shot.

The user's rule: if a usage limit hits, do not use extra usage. Schedule a continuation
(send_later, about 5 h 15 min ahead) and stop.

## Done
- Blender scenes for every plate (`blender/fivekeys.py`), previewed and fixed.
- `stories/fivekeys/script.json` (generated; 40 clauses, 38 shots), voice processed to 235 wpm
  (atempo 1.5), words aligned, `public/fivekeys/timeline.json` built.
- Remotion shows plates and the truck clip (`src/Plate.tsx`); tested with preview plates.
- Full-quality plates render with `python blender/fivekeys.py --samples 48 --threshold 0.03`
  into `public/fivekeys/plates/` (it skips ones already there). 35 are needed:
  A1 A3 A4 A4b A5 A6 A7 A8 A9 B1-B10 C1-C4 D1-D3 E1 E2 E3 E5 F1 F2 G1 G2 G3.

## To do, in order
1. Finish any missing plates (same command; check `ls public/fivekeys/plates`).
2. Render: `CHROME_PATH=... GL=swangle npx remotion render src/index.ts Explainer out/fivekeys/raw.mp4 --crf 16 --props='{"story":"fivekeys"}'`
   then add light grain and re-encode to `out/fivekeys/fivekeys.mp4`.
3. Check frames (`node scripts/contact-sheet.mjs fivekeys`), commit plates and video, push, send to the user,
   delete this note and cancel the scheduled continuation.

## If the container was replaced
`npm install`; `pip install bpy pillow sherpa-onnx soundfile numpy`; download
`sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8` from the sherpa-onnx GitHub `asr-models` release into `models/`.
The street clip frames are not in git: use `out/street/street.mp4` (already has the zoom baked in) if they are gone.
