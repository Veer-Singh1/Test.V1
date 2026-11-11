# PROGRESS: Double-slit short

## Done
1. **Script.** Your 5-minute script was cut to 60 s, 12 shots and 190 words (`script.md`). The opening line is "Physics, please."
2. **Voiceover.** Generated with Kokoro TTS (voice am_fenrir, speed 1.12), one sentence at a time, with fixed pauses: 62.5 s at 3.04 words/s. Real sentence times are in `src/sentence_times.json`, and every cut and camera beat derives from them.
3. **Build.** It reuses the Durban kit:
   - painted textures, toon shading and ink outlines (#351f22), depth of field, and a dip to cream between locations
   - five sets: the host's lab (x=0), a paintball range (60), a wave tank (120), an electron lab (200) and a corner shop (280)
   - new pieces: a wave-field shader (the water tank and the electron's "wave of possibilities"), a canvas detector screen whose dots are sampled from the two-slit interference curve, paintball splats, and an electron character in sunglasses
4. **Checks (stills).** Fixed after the stills check:
   - the camera turned away from the strutting electron too early
   - closed door panels blocked the lab and shop doorways
   - the host was hidden behind the bench
   - the paintball sign blocked the stripes
   - the shop electrons walked through the counter
   - the barrier sat too far down the wave tank to show the pattern
   - the closing shot was focused on the board instead of the characters
5. **Preview render.** Rendered in the cloud at draft quality, with the voiceover attached.

## Known limits
- The voice is generated and nobody has listened to it yet; it was checked only for timing and pauses.
- The water and electron "waves" are illustrative (a two-source ripple field), not a simulation.
- The characters don't blink.
