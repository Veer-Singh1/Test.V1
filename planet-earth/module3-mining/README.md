# Planet Earth and Beyond — Module 3: Mining (ores, SA mines, refining, impacts, rehabilitation)

An ~8:00, 1920×1080 / 30 fps Grade 9 Natural Sciences explainer. It's based on the WBHS study guide "Planet Earth: Units 1–3" and made with the same pipeline and style as `ohms-law-video/`. The narration, shot list and fact-check log are in [`script.md`](script.md).

## Status
- [x] Script and fact-check, voiceover (Kokoro `af_heart`, fitted to ~8:00)
- [x] All animations (Manim), music and sound effects (synthesised), mix, subtitles
- [x] `final_video.mp4` rendered locally (not in git), `subtitles.srt`, `qc_report.md`
- [ ] Stock footage for the opening shots (smartphone, mine_tunnel, gold_pour, open_pit). This is blocked until Pexels, Pixabay and Wikimedia Commons are reachable; those shots show labelled placeholders for now.

## How this folder is set up
- `pipeline/`: the same pipeline as `ohms-law-video`, with this video's `scenes.py` (narration segments, shots, stock-media wish list), an 8:00 target, its own music key, and data-driven QC checks.
- `animations/`: `kit.py` (shared style kit), `common.py` (title card, flip cards, recap, quiz, end card), plus this video's drawing helpers and one module per scene.
- `.venv`, `models` and `fonts` are symlinks to `../../ohms-law-video/`, so the tools are installed only once.

## Re-render
```bash
.venv/bin/python -m pipeline.check_script   # narration in scenes.py == script.md
.venv/bin/python -m pipeline.tts --fit      # voiceover + build/timing.json, fitted to ~8:00
.venv/bin/python -m pipeline.render_manim   # all animations at 1080p30
.venv/bin/python -m pipeline.build          # final_video.mp4 + subtitles.srt
.venv/bin/python -m pipeline.qc             # qc_report.md
```
For real footage, allow the media hosts and set `PEXELS_API_KEY` / `PIXABAY_API_KEY` (see `ohms-law-video/README.md`). Then run `.venv/bin/python -m pipeline.fetch_assets --candidates`, pick candidates with `--pick` (or use `--auto`), re-render `S14End`, and rebuild.
