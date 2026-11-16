# Voiceover script (for recording your own voice)

The video ships with the narration as on-screen captions. If you record a voiceover, read
each line so it **starts at the "In" time** and finishes before the "Out" time. The captions
in the video use exactly these windows (`CAPTIONS` in `src/timeline.ts`).

Target pace is about 150 words per minute (2.5 words per second), relaxed and conversational.
The total is 148 words in 60 s.

| # | In | Out | Line | Words |
|---|---|---|---|---|
| 1 | 0.3 s | 2.6 s | To reach orbit, you don't just go up. | 8 |
| 2 | 2.6 s | 5.0 s | You go sideways… really, really fast. | 6 |
| 3 | 5.2 s | 7.6 s | A rocket throws mass out the back. | 7 |
| 4 | 7.6 s | 10.6 s | Push exhaust down, and it pushes you up. | 8 |
| 5 | 10.6 s | 13.9 s | No air needed: it even works in empty space. | 9 |
| 6 | 14.2 s | 17.6 s | The catch? You have to carry all that propellant with you. | 11 |
| 7 | 17.6 s | 23.8 s | Roughly ninety percent of a rocket's mass on the launch pad is propellant. | 13 |
| 8 | 24.2 s | 26.4 s | So rockets come in stages. | 5 |
| 9 | 26.4 s | 30.4 s | When a stage runs dry, it's dropped. No hauling empty tanks. | 11 |
| 10 | 30.4 s | 33.8 s | Lighter rocket, more speed from the same fuel. | 8 |
| 11 | 34.2 s | 37.0 s | Newton imagined a cannon on a mountain. | 7 |
| 12 | 37.0 s | 40.2 s | Fire faster, and the ball lands farther away. | 8 |
| 13 | 40.2 s | 44.6 s | Fire fast enough, and the ground curves away as fast as the ball falls. | 14 |
| 14 | 44.6 s | 47.8 s | It never lands. That's orbit. | 5 |
| 15 | 48.2 s | 51.4 s | Low Earth orbit needs about twenty-eight thousand kilometres an hour. | 10 |
| 16 | 51.4 s | 54.8 s | That's about thirty times faster than an airliner. | 8 |
| 17 | 55.2 s | 58.2 s | So orbit isn't up. It's sideways: falling, and always missing. | 10 |

## Cues to hit with the voice

- 1.0 s: liftoff (camera bump, music lift). Line 1 is already under way.
- 28.0 s: stage separation clunk (inside line 9, near "dropped").
- 40.7 s: the fourth cannon shot starts its loop (during line 13).
- 49.0 s: the "28,000 KM/H" stamp thud (line 15).
- 58.1 s: the title card slides in. Keep the voice clear of 58.2–60 s.

## Adding the recording to the video

1. Save a 60 s mono or stereo WAV aligned to 0:00 as `assets/raw/voice/voiceover.wav`.
2. Run `node scripts/export_timeline.mts && .venv/bin/python scripts/make_audio.py`.
   The voice is normalised to about −16 LUFS, the music stays at −20 LUFS underneath, and the
   final mix is brought to −14 LUFS.
3. Run `bash scripts/build.sh mux` to rebuild `out/rocket_orbit_60s.mp4` with the new mix.
   Optionally set `HAS_VOICE = true` in `src/credits.ts` and re-render if you want a voice credit.
