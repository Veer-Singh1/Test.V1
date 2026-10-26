# Voltage, Current & Resistance: explainer video

A 6:20, 1920×1080 / 30 fps explainer for curious beginners. It combines licensed stock footage, Manim animations, an AI voiceover, an original music bed, sound effects and burned-in subtitles. The narration and shot list are in [`script.md`](script.md).

## Status
- [x] Script written, fact-checked and approved (v2, 26 Oct 2026)
- [x] Tools installed
- [x] Voiceover generated (Kokoro `af_heart`, per segment)
- [x] All animations built (17 Manim shots)
- [x] Music and SFX (original, synthesised)
- [x] 20-second style preview
- [x] Full edit, mix and subtitles → `final_video.mp4`, `subtitles.srt`, `qc_report.md`
- [ ] **Stock footage and photos**: blocked so far, because Pexels, Pixabay and Wikimedia Commons aren't reachable from the build environment. The 13 footage and photo shots currently show clearly labelled "pending" placeholders (see below).

## Decisions
- **Length:** 6:20. **Spelling:** UK. **Mains examples:** 230 V.
- **Voice:** Kokoro `af_heart` (warm US female) via `kokoro-onnx`, speed 0.9, with a few lines slowed for emphasis. Two words are corrected at the phoneme level ("nichrome", "Georg").
- **Style:** navy `#0B1A33` background, cyan `#22D3EE` for current, amber `#FBBF24` for voltage, coral `#FB7185` for resistance, Inter throughout (vendored in `fonts/`, SIL OFL).
- **Stock media:** only from the Pexels API, the Pixabay API and Wikimedia Commons. Commons files must be CC0, CC BY or public domain (BY-SA, NC and ND are filtered out). Every file is logged in `assets/credits.csv`.
- **Music and SFX:** synthesised from scratch (`pipeline/music.py`, `pipeline/sfx.py`), so there is nothing to license. The music is ducked to 20 dB under the voice and opens up in pauses.
- **Mix:** voice normalised to −16 LUFS integrated, −1 dBFS peak ceiling.

## Layout
```
script.md               narration, visuals, on-screen text, timings, fact-check log
pipeline/scenes.py      narration segments (must match script.md), shot list, stock-media wish list
pipeline/tts.py         Kokoro voiceover per segment -> build/voice/, build/timing.json
pipeline/timeline.py    frame-accurate timeline of scenes, segments and shots
pipeline/render_manim.py  renders animations/*.py shots (parallel)
pipeline/fetch_assets.py  Pexels / Pixabay / Commons search, review sheets, download + credits.csv
pipeline/media.py       per-shot clips: Manim, footage, Ken Burns stills, placeholders, labels
pipeline/mix.py         voice + ducked music + SFX, loudness and limiter
pipeline/subtitles.py   SRT (delivered) and styled ASS (burned in)
pipeline/build.py       crossfade assembly, subtitles burn-in, final encode
pipeline/qc.py          automated checks -> qc_report.md
animations/kit.py       palette, text helpers, circuit parts, narration-synced Shot base class
animations/s01..s12     one module per scene
```

## Re-render from scratch
```bash
python3 -m venv .venv && .venv/bin/pip install manim kokoro-onnx soundfile numpy scipy pillow pyloudnorm requests
sudo apt-get install -y libcairo2-dev libpango1.0-dev pkg-config ffmpeg
mkdir -p models/kokoro && cd models/kokoro && \
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx && \
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin && cd ../..
# install fonts/Inter-*.ttf system-wide (e.g. ~/.local/share/fonts) so Pango and libass find them

.venv/bin/python -m pipeline.check_script        # narration in scenes.py == script.md
.venv/bin/python -m pipeline.tts                 # voiceover + build/timing.json
.venv/bin/python -m pipeline.render_manim        # all animations at 1080p30
.venv/bin/python -m pipeline.build --preview 22.4 42.4   # optional 20 s preview
.venv/bin/python -m pipeline.build               # final_video.mp4 + subtitles.srt
.venv/bin/python -m pipeline.qc                  # qc_report.md
```
Changing narration: edit `script.md` and `pipeline/scenes.py` together, re-run `tts`, then re-render (the animations re-time themselves from `build/timing.json`).

## Dropping in the real stock footage
1. Allow these domains in the environment's network settings: `api.pexels.com`, `videos.pexels.com`, `images.pexels.com`, `pixabay.com`, `cdn.pixabay.com`, `commons.wikimedia.org`, `upload.wikimedia.org`.
2. Set `PEXELS_API_KEY` and `PIXABAY_API_KEY` as environment variables (free keys: pexels.com/api, pixabay.com/api/docs).
3. Run:
```bash
.venv/bin/python -m pipeline.fetch_assets --candidates   # contact sheets in build/candidates/<key>.jpg
.venv/bin/python -m pipeline.fetch_assets --pick lightning=0 city_night=2 ...   # or --auto for the top-ranked
.venv/bin/python -m pipeline.render_manim S06Resistance S12End   # Ohm portrait + credits on the end card
.venv/bin/python -m pipeline.build && .venv/bin/python -m pipeline.qc
```
