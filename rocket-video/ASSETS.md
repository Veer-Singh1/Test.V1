# Asset log

Every visual and audio asset in the video, where it came from, its licence, and what was
done to it. The end-card credits (`src/credits.ts`) are built from this file.

**Summary.** The only third-party files in the video are two Google Fonts (SIL OFL 1.1).
Everything else was drawn or synthesised in code for this project and is released with it.
No CC BY / BY-SA media is used, so no attribution is legally required on screen, but the
end card credits fonts and fact sources anyway. No logos of any agency or company appear
anywhere; the rockets and the airliner are generic designs with no markings.

Why there are no downloaded photos: see DECISIONS.md §2. The build sandbox could not reach
NASA Images, Wikimedia Commons, Openverse, Unsplash, Pexels, Pixabay, Freesound, Free Music
Archive or ccMixter, so no archival photo could be downloaded and licence-checked on its
page. The archival halftone look comes from procedural "photo" plates run through the same
halftone/duotone pipeline a real photo would go through (`scripts/process_assets.py`,
treatment `photo`, ready for real files dropped into `assets/raw/`).

## Third-party assets

| File | Source URL | Author | Licence | Changes |
|---|---|---|---|---|
| `assets/raw/fonts/Oswald-500.ttf`, `Oswald-700.ttf` (copied to `assets/fonts/`) | https://fonts.google.com/specimen/Oswald (files from fonts.gstatic.com via the Google Fonts CSS API) | The Oswald Project Authors (Vernon Adams et al.) | SIL Open Font License 1.1 (`assets/raw/fonts/OFL_Oswald.txt`, from https://github.com/google/fonts/blob/main/ofl/oswald/OFL.txt) | None. Used for headlines. |
| `assets/raw/fonts/Inter-500.ttf`, `Inter-700.ttf`, `Inter-800.ttf` (copied to `assets/fonts/`) | https://fonts.google.com/specimen/Inter | The Inter Project Authors (Rasmus Andersson) | SIL Open Font License 1.1 (`assets/raw/fonts/OFL_Inter.txt`, from https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt) | None. Used for labels and captions. |

## Original assets made for this video (code-generated)

Licence: same as this project. You can use them freely. Author: this project.

### Visuals: drawn by `scripts/generate_assets.py`, processed by `scripts/process_assets.py` (recipe in `assets/manifest.json`)

| Cut-out (`assets/cutouts/`) | Raw (`assets/raw/generated/`) | What it is | Processing |
|---|---|---|---|
| `rocket_lower.png`, `rocket_upper.png`, `nozzle_small.png` | `rocket_lower*.png`, `rocket_upper*.png`, `nozzle_small*.png` | Generic two-stage paper rocket (no markings or logos) | Flat paper colours + 6 px halftone shading dots, paper fibre, slightly uneven scissor edge, 4–9 px cream border |
| `rocket_cutaway.png` | `rocket_cutaway*.png` | Rocket sliced open: payload, oxidiser and fuel tanks, engines | Same, 7 px dots, 5–10 px border |
| `balloon.png` | `balloon*.png` | Party balloon | Halftone shading in dark orange ink, border |
| `flame_0…3.png` | `flame_0…3.png` | Four hand-torn layered flames (orange / yellow / cream) for replacement animation | Torn edges, fibre, 2–5 px white torn-fibre border |
| `smoke_0…3.png` | `smoke_0…3*.png` | Four torn-paper smoke clouds | Halftone shading, torn edges, border |
| `earth.png` | `earth*.png` | Paper Earth: orthographic globe centred on Africa, continents hand-traced from approximate coastline coordinates, torn-paper land and cloud pieces with a raised-paper shadow | Terminator shading as 8 px halftone dots, 6–12 px border |
| `mountain.png`, `cannon.png` | `mountain*.png`, `cannon*.png` | Newton's mountain and cannon | Halftone shading, border |
| `jet.png` | `jet*.png` | Generic airliner silhouette (no airline livery or logos) | Halftone shading, border |
| `star_0…2.png`, `star_dot.png` | `star_*.png` | Cut-out paper stars and dots (also used as cannonballs) | Torn edges |
| `strip_orange/cream/yellow/navy.png` | `strip_*.png` | Torn paper strips for the bar charts | Torn edges, fibre |
| `plate_launch.png` | `plate_launch.png` | Procedural "archival photo" of a launch (tower, rocket, billowing exhaust) | Halftone duotone (ink #1B1B1B on #EDE5D3), torn edges, 6–12 px border |
| `plate_clouds.png` | `plate_clouds*.png` | Procedural cloud deck seen from above | Halftone duotone (ink #5D6B8C on cream), torn edges |

| Texture (`assets/tex/`) | What it is |
|---|---|
| `bg_warm.png` | Warm off-white #EFE8DA paper: mottling, grain, fibres |
| `bg_navy.png` | Deep navy #1C2440 construction paper with light fibres |
| `sheet_warm.png`, `sheet_navy.png` | The same papers with a torn leading edge, for sheet-slide transitions |
| `grain_0…3.png` | Four film/paper grain overlays, swapped on twos |
| `vignette.png` | Edge darkening |
| `fibre.png` | Fibre overlay for the paper text strips |
| `stamp.png` | Rubber-stamp grunge mask |

Drawn live in React/SVG (no files): marker strokes and arrows, the push-pin, the thread
in the end beat, the launch pad, the cannonball trails.

### Audio: synthesised by `scripts/make_audio.py` (no samples, no downloads)

| Output (`out/`) | What it is |
|---|---|
| `music_bed.flac` | Original 120 BPM playful percussive track: synthesised marimba arpeggios, Karplus-Strong plucked bass, kick, snare/clap, hats, shaker, offbeat chord plucks, glockenspiel melody. Rises into a hit at launch (1.0 s) and stage separation (28.0 s); fades out over the last 2 s. −20 LUFS. |
| `sfx.flac` | All sound effects, placed from `SFX` and `MARKS` in `src/timeline.ts`: paper rustles on every sheet transition; launch rumble (brown noise, roar, crackle); stage-separation clunk (inharmonic metal partials, thump, pop); rubber-stamp thuds; marker squeaks on every annotation; cannon pops; whooshes for the balloon, the orbiting cannonball and the final coast. |
| `final_mix.wav` (not committed; rebuilt by `build.sh audio`) | Music + SFX, −14.0 LUFS integrated, true peak −3.5 dBTP, leaving headroom for the AAC encode (the final MP4 measures −14.1 LUFS / −2.7 dBTP). |

### Voice

None in the delivered cut. The ElevenLabs connector was available, but every generation
request answered "free generations are busy" (three tries, about 75 minutes apart in total;
nothing was charged). See `voiceover_script.md` to add a voice later.
