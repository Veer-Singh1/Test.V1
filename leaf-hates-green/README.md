# That leaf hates green (Physics Shorts kit)

Finished videos:
- `that_leaf_hates_green.mp4`: 1080×1920, 30 fps, 44.5 s, voiceover plus your song ("Idea 10" by Gibran Alcocer) as the bed, −14 LUFS.
- `that_leaf_hates_green_original_music.mp4`: the same picture with the original royalty-free music bed (safe from copyright claims).

Built from the template in `../head-older-than-feet` (same kit captions and elements). Script, picture notes and fact check are in `script.md`.

## Render it yourself (Windows)

- `render.bat` renders `final.mp4` (with the song soundtrack in `public/soundtrack.wav`).
- `test_render.bat` renders a quick 6-second half-size test.

## Rebuild the sound

1. Voice: `python scripts/synth_line.py <kokoro_dir> src/script.json public/voiceover.wav am_fenrir 0.97`
2. Song bed: convert the song to `out/song.wav`, then run `python scripts/song_bed.py out/song.wav 1.4 src/script.json public/music.wav 44.478 <voice LUFS> <song-section LUFS>`
3. Mix: `MUSIC_DB=0 scripts/mix.sh 44.478 public/music.wav public/soundtrack.wav`
   (Original bed instead: `python scripts/make_music.py src/script.json out/music_original.wav 44.478`, then `MUSIC_DB=-20 scripts/mix.sh 44.478 out/music_original.wav out/soundtrack_original.wav`.)
