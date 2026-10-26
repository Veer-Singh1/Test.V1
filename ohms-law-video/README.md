# Voltage, Current & Resistance: explainer video

A ~6:20, 1920×1080 / 30 fps explainer for curious beginners, made with real licensed footage, Manim animations, an AI voiceover, music and burned-in subtitles. The narration and shot list are in [`script.md`](script.md).

## Status
- [x] Script written, fact-checked, approved (v2, 26 Oct 2026)
- [ ] Tools installed
- [ ] Assets gathered and license-logged (`assets/credits.csv`)
- [ ] Voiceover generated
- [ ] Animations built
- [ ] 20-second style preview
- [ ] Final edit, mix and subtitles → `final_video.mp4`, `subtitles.srt`
- [ ] Quality checks (black frames, audio drift, on-screen text ≥ 2 s, physics, licences)

Production is scheduled to start on 27 Oct 2026 at 00:11 UTC, when the next 5-hour usage window opens.

## Decisions
- **Length:** ~6:20. **Spelling:** UK. **Mains examples:** 230 V.
- **Voice:** Kokoro `af_heart` (warm US female), run locally via `kokoro-onnx`. The model files come from the kokoro-onnx GitHub release.
- **Style:** navy `#0B1A33` background, cyan `#22D3EE` for current, amber `#FBBF24` for voltage, coral `#FB7185` for resistance, Inter font.
- **Footage and photos:** only from the Pexels API, the Pixabay API and Wikimedia Commons. Commons files must be CC0, CC BY or public domain (no BY-SA or NC). Every file is logged in `assets/credits.csv` (file, source URL, author, licence).
- **Music:** a CC0 / CC BY track from Wikimedia Commons if a suitable one exists, otherwise an original synthesised bed. Ducked to about −20 dB under the voice.
- **SFX:** whooshes and clicks synthesised locally.
- **Cost:** free tools only. Large media (footage, audio, renders) stays out of git; the final MP4 is delivered directly.

## Environment requirements
- Environment variables: `PEXELS_API_KEY`, `PIXABAY_API_KEY`
- Allowed domains: `api.pexels.com`, `videos.pexels.com`, `images.pexels.com`, `pixabay.com`, `cdn.pixabay.com`, `commons.wikimedia.org`, `upload.wikimedia.org`
