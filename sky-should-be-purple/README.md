# Why the sky should be purple (Physics Shorts kit)

Finished videos:
- `why_the_sky_should_be_purple.mp4`: 1080×1920, 30 fps, 52 s, voiceover plus "Idea 10" by Gibran Alcocer as the bed, −14 LUFS.
- `why_the_sky_should_be_purple_original_music.mp4`: the same picture with the original royalty-free bed.

Script, picture notes, fact check and SEO pack are in `script.md`. Built from the same kit template as `../head-older-than-feet` and `../leaf-hates-green`.

- `render.bat` renders `final.mp4` on Windows (the soundtrack is `public/soundtrack.wav`).
- `test_render.bat` renders a quick 6-second half-size test.

To rebuild the sound: `scripts/synth_line.py` (voice, speed 1.0), then `scripts/song_bed.py out/song.wav 7.2 src/script.json public/music.wav 51.949 <voice LUFS> <song LUFS>`, then `MUSIC_DB=0 scripts/mix.sh 51.949 public/music.wav public/soundtrack.wav`.
