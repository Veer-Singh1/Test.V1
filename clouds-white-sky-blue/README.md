# Why are clouds white… when the sky is blue? (Physics Shorts kit)

Finished videos:
- `why_are_clouds_white.mp4`: 1080×1920, 30 fps, 54.5 s, your ElevenLabs voiceover plus "Idea 10" as the bed, −14 LUFS.
- `why_are_clouds_white_original_music.mp4`: the same, with the original royalty-free bed.

Script, picture notes, fact check and a suggested SEO pack are in `script.md`.

## Using your own voiceover (ElevenLabs or a recording)

1. Put the file in `public/voiceover.wav`, for example: `ffmpeg -i your.mp3 -ar 48000 -ac 1 public/voiceover.wav`.
2. `python scripts/align_vo.py public/voiceover.wav src/script.json` finds each sentence (and the "…" pauses) in the audio and writes the timings. It needs a short pause between sentences, which ElevenLabs gives.
3. Rebuild the music and mix (`scripts/song_bed.py`, then `MUSIC_DB=0 scripts/mix.sh <duration> public/music.wav public/soundtrack.wav`) and render. All captions and visual beats follow the new timings automatically.

- `render.bat` renders `final.mp4` on Windows.
- `test_render.bat` renders a quick 6-second half-size test.
