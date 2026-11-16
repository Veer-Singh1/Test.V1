# How a rocket actually gets to orbit: 60 s paper stop-motion explainer

A finished 60-second vertical (1080×1920, 24 fps, animated on twos) explainer in a
handmade paper-cut-out collage style. It is built entirely in code with Remotion
(React + TypeScript) plus a Python asset/audio pipeline.

**Deliverables**
- `out/rocket_orbit_60s.mp4`: H.264 High, yuv420p, 1080×1920, 24 fps, 60.0 s, AAC 192 kb/s 48 kHz,
  −14.1 LUFS integrated, true peak −2.1 dBTP (measured on the MP4 with ffmpeg ebur128).
- `out/contact_sheet.png`: five frames (0.5, 18, 28.5, 44, 59 s).
- `out/review/`: the seven review stills (0.5, 8, 18, 28, 40, 50, 58 s).
- `out/music_bed.flac` (−20 LUFS) and `out/sfx.flac`: audio stems for remixing with a voice.

## What's in the folder

```
rocket-video/
  scenes/01_hook.tsx … 07_endcard.tsx   one file per beat
  src/timeline.ts                       ALL timings: beats, events, captions, SFX cues, music lifts
  src/Video.tsx, Root.tsx               composition: scenes + captions + camera bump + overlays
  src/lib/twos.ts                       useOnTwos(), seeded boil/jitter, stepped tweens
  src/lib/paths.ts                      hand-drawn path helpers
  src/components/
    Cutout.tsx        <Cutout>       paper border, fixed-direction drop shadow, boil on twos
    MarkerStroke.tsx  <MarkerStroke> marker annotation that draws on over N held steps
    PaperStrip.tsx    <PaperStrip>   text on a jagged paper strip: typed / stamped / slid in
    PaperFlame.tsx    <PaperFlame>   replacement animation of 4 torn-paper flames (+ smoke)
    Paper.tsx         backgrounds, stars, sliding sheets, camera bump, grain/vignette/flicker, captions, pin
    Rocket.tsx        two-stage rocket assembly + transform group
  scripts/
    generate_assets.py   draws every art plate and texture (seeded)
    process_assets.py    manifest-driven cut-out pipeline: halftone/duotone, torn edge, paper border, fibre
    paperlib.py          shared noise/tear/border/halftone helpers
    export_timeline.mts  src/timeline.ts -> build/timeline.json (for audio)
    make_audio.py        synthesises music + SFX, mixes, loudness-normalises
    render_stills.mjs    renders review stills from the composition
    check_twos.py        proves on-twos timing on rendered PNG frames
    contact_sheet.py     5-frame contact sheet from the MP4
    build.sh             the whole pipeline
  assets/
    manifest.json        processing recipe for every visual
    raw/                 raw inputs: generated plates (raw/generated), fonts + licences (raw/fonts)
    cutouts/             processed paper cut-outs
    tex/                 backgrounds, grain, vignette, sheets, stamp mask
    fonts/               Oswald + Inter (SIL OFL)
  out/                   final video, contact sheet, review stills, audio stems
  script.md  voiceover_script.md  FACTS.md  ASSETS.md  DECISIONS.md
```

## Re-render

Requirements: Node 22+, Python 3.10+, ffmpeg, Chromium.
`remotion.config.ts` points at `/opt/pw-browsers/…`; change or remove that line on another
machine and Remotion will download its own headless shell.

```bash
cd rocket-video
npm install
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt

bash scripts/build.sh            # everything: assets → audio → video → mux → review → twos check
# or individual steps:
bash scripts/build.sh assets     # regenerate + process all art (about 30 s)
bash scripts/build.sh audio      # resynthesise music/SFX and remix (about 10 s)
bash scripts/build.sh video      # render 1,440 frames (about 7 min on 4 cores)
bash scripts/build.sh mux        # mux video + final_mix.wav -> out/rocket_orbit_60s.mp4
bash scripts/build.sh review     # review stills + contact sheet from the MP4
bash scripts/build.sh twos       # verify on-twos timing on rendered PNG frames
npm run studio                   # interactive Remotion Studio preview
```

Everything is seeded, so a re-render gives the same frames. To change timing, edit
`src/timeline.ts` only, then re-run `audio`, `video` and `mux`.

**Adding a voiceover:** see `voiceover_script.md` (put `assets/raw/voice/voiceover.wav` in
place, then run `audio` and `mux`).
**Adding real archival photos:** drop the file in `assets/raw/`, add a `photo` entry to
`assets/manifest.json` (optional crop, mask or luma key), log it in ASSETS.md, run
`assets`, and place it with `<Cutout name=…>`.

## Review results (final render)

- **Duration:** 60.000 s, 1,440 frames at 24 fps, 1080×1920, H.264 High, yuv420p, AAC 48 kHz.
- **Loudness:** −14.1 LUFS integrated, true peak −2.1 dBTP, so no clipping (the WAV master is −14.0 LUFS / −3.0 dBTP).
- **On twos:** `bash scripts/build.sh twos` renders PNG frames 24–55 (liftoff), 660–699
  (separation) and 976–1007 (orbit loop).
  - Every 2k / 2k+1 pair is identical. A few pairs differ by ≤ 76 pixels of 1-level antialiasing
    at a strip edge, which is renderer noise.
  - Every 2k+1 → 2k+2 step changes.
- **Stills:** the seven review stills are in `out/review/`.
  - Each cut-out has a border, a drop shadow and boil.
  - Flames and smoke are swapped paper pieces.
  - Headlines are ≥ 76 px, labels ≥ 40 px, captions 46 px, with nothing inside the 120 px top and
    bottom margins.
  - Navy scenes use cream strips with near-black text.
  - No logos appear.

## Known limitations

- **No voiceover.** The TTS connector stayed "busy" for the whole build window, so the
  narration is on-screen captions. `voiceover_script.md` has per-line timings.
- **No genuine archival photos.** The sandbox could not reach any photo library (see
  DECISIONS.md §2). The halftone "photos" are procedural plates processed the same way a
  real photo would be.
- **Music and SFX are synthesised.** They are serviceable and timed to the picture, but
  simpler than a produced library track.
- **Simplified continents.** They are hand-traced from approximate coordinates (fine for a
  paper Earth, not a map).
- **The cannon mountain is hugely exaggerated**, as in Newton's original diagram.
- **Approximate facts.** All numbers are rounded and marked as approximate on screen. The
  sources are in FACTS.md. They were checked through search-result quotes, because the
  sandbox blocked direct page fetches.
