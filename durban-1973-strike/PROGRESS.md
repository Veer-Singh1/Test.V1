# PROGRESS: Durban 1973 story video (EMS Module 14)

## Done
1. **Ideas.** Five fact-checked trade union stories were drawn from Module 14 (Trade Unions). Durban 1973 was chosen.
2. **Script.** `script.md` has the shot table, rulebook check, fact map and what was left out on purpose. The voiceover script is in `voiceover_script.pdf`. 142 words, about 43 s.
3. **Timing.** No voiceover yet, so `scripts/estimate_times.mjs` estimates `src/sentence_times.json` at 3.35 words/s overall. One `CUTS` array is derived from it in `src/timing.js`.
4. **Build.** Remotion 4 + three.js 0.186 + React Three Fiber 8. Everything is procedural:
   - `src/kit.js`: painted canvas textures with wear, 3-band toon shading, ink outlines (inverted hull + edge lines, ink #351f22), and helpers for facades, gable and saw roofs, chimneys, lamp posts, signs and write-on chalk.
   - `src/char.js`: 2D flat characters in the house design. Palettes, hats and glasses vary. Each has a wobbly ink band, idle bob and arm sway, a walk cycle, limited yaw toward the camera (±0.7 rad) and a contact-shadow blob.
   - `src/world.js`: six locations at different x offsets. A brickworks (x=0), a stadium (60), the manager's office (120), the Frame textile mill (180), a map room (260) and a government office (340).
   - `src/camera.js`: camera keys per shot tied to word beats, monotone cubic warp, light and fog per location, cooler light at the pivot and golden light at the end.
   - `src/post.js`: 2× supersampling, depth of field at the look-at distance, light vignette, 0.4 s dip to cream at location changes.
5. **Checks (stills only).** Stills were rendered at the beat times and reviewed as contact sheets. Fixed so far:
   - the calendar was hidden behind a brick stack, so the date moved onto the easel chalkboard
   - the stadium crowd was too far away to read
   - the map was buried inside the table
   - a hanging lamp blocked the map room
   - the stamp's ink lines were baked at the origin
   - a worker was too close to the lens in shot 4
   - a brick stack covered the boss in shot 8
   - the office ceiling was blown out
   - mill workers walked into the lens
   - a 15-frame test render to mp4 worked (720×1280, 30 fps)

## Not done / known issues
- **No voiceover yet.** Cuts and beats are estimated. After recording `voiceover.wav` (in this folder), ask Claude:
  > Transcribe voiceover.wav with word timestamps, update src/sentence_times.json and re-check the stills.

  Everything re-times from that file.
- The full video has **not** been rendered here, because the cloud machine has no graphics card. It needs `render.bat` on your PC.
- Characters stand and turn but do not blink.
- Map pins are spread for illustration. They are not the real locations of the 1973 strikes.
- The "R8,97 A WEEK" placard is illustrative. The wage is from the sources, the placard is invented.

## Continue in a new session
> This is a continuing project. Read PROGRESS.md, script.md and camera_plan.md first. Keep the script, timing, facts, characters and ink colour #351f22 exactly. First task: [what you want next].
