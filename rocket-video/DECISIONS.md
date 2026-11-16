# Decisions log

Choices made during the unattended build, with the reasons.

## 1. Project location
The repository already held an unrelated Python starter project (README.md and
requirements.txt at the root). The video project lives in its own folder, `rocket-video/`,
so neither project touches the other. Paths in the brief (`out/…`, `scenes/…`, `script.md`,
…) are relative to that folder.

## 2. Assets: everything visual is generated, because no photo source was reachable
The cloud sandbox has a limited network: package registries (npm, PyPI, Ubuntu archive),
GitHub and Google Fonts are reachable, but NASA Images, images-assets.nasa.gov, Wikimedia
Commons, Openverse, Unsplash, Pexels, Pixabay, Freesound, Free Music Archive, ccMixter,
archive.org, ESA and the Library of Congress were all refused by the egress proxy.
- I did **not** ask for the network to be widened. That needs an approval prompt you would have
  had to answer while away, and the run would have stalled.
- I did **not** pull images from other people's GitHub repositories or route around the
  policy with a cloud browser. The brief requires checking each asset's licence on its own
  page, which a mirror can't give, and routing around the proxy isn't acceptable.
- Following the brief's fallback ("If you can't get enough assets, generate them"), every
  visual is drawn in code (`scripts/generate_assets.py`) and run through a real, repeatable,
  manifest-driven cut-out pipeline (`scripts/process_assets.py`: halftone/duotone, torn
  edge, uneven paper border, paper fibre).
- **Known limitation:** there are no genuine archival photos. The "archival collage"
  feeling comes from procedural halftone photo plates (`plate_launch`, `plate_clouds`).
  The pipeline has a `photo` treatment (rembg background removal if installed, otherwise
  a luma key or a mask file) so real public-domain photos can be dropped into
  `assets/raw/` and listed in `assets/manifest.json` later.
- rembg was not installed, since all generated art already has exact alpha.

## 3. Music and SFX synthesised in code
For the same network reason, no CC0 / CC BY music could be downloaded and licence-checked.
The track and every sound effect are synthesised (`scripts/make_audio.py`). Two upsides:
the music lifts land exactly on the launch (1.0 s) and stage-separation (28.0 s) frames, and
there is nothing to license.

## 4. Voiceover: captions instead of TTS
An ElevenLabs connector was available, and I chose the South-African-accented "Sekou" voice.
The direct API key stored for the sandbox was rejected ("invalid API key"). Every
connector generation returned "Free generations are busy right now… nothing was charged"
(tries at about 20:30, 20:50 and 21:45 UTC). Following the brief's fallback, the narration is
on screen as bold paper-strip captions timed to the beats, and `voiceover_script.md` has
per-line timings. The audio pipeline mixes a voice in automatically if
`assets/raw/voice/voiceover.wav` exists.

## 5. Loudness with no voice
The brief asks for music at about −20 LUFS under the voice and a final mix at about −14
LUFS. With no voice, normalising the final mix to −14 LUFS lifts the music bed above −20.
So the deliverables are:
- `out/rocket_orbit_60s.mp4`: music + SFX at −14.1 LUFS integrated, true peak −2.1 dBTP.
  The master is limited to −3 dBTP because the AAC encode adds about 1 dB of overshoot. A
  −1.6 dBTP master measured +0.2 dBTP after encoding.
- `out/music_bed.flac` (−20 LUFS) and `out/sfx.flac` as separate stems, so a recorded voice
  can be laid on top and remixed to spec with `scripts/make_audio.py`.

## 5b. Delivery encode
Remotion renders a high-quality master (`out/video_noaudio.mp4`, CRF 16, about 130 MB, not
committed). The mux step re-encodes it with x264 at CRF 21 (preset slow) into the
deliverable (about 45 MB). That keeps it under GitHub's 100 MB file limit; the paper grain
changes on every held step, which is expensive to encode.

## 6. Remotion, with assets/ as the public folder
I used Remotion 4 (React + TypeScript) as the brief asked. Remotion's `publicDir` is set to
`assets/`, so the processed cut-outs in `assets/cutouts/` are used directly and not duplicated
into `public/`. Rendering uses the sandbox's pre-installed Chromium headless shell
(`remotion.config.ts`).

## 7. On twos, enforced in one place
- `useOnTwos()` (src/lib/twos.ts) quantises the frame, and every scene computes all motion,
  boil, flicker and grain from it.
- Every Sequence starts on an even frame, so local and global quantisation agree.
- No `spring()`, CSS transitions or raw-frame interpolation are used in scenes.
- `scripts/check_twos.py` verifies it on rendered PNG frames: frames 2k and 2k+1 must be
  identical, and motion must change on 2k+1 → 2k+2. Result on the final build: all held pairs
  are identical apart from ≤ 76 px of 1-level antialiasing noise at text-strip edges (Chromium
  rasterises a clip-path edge slightly differently in parallel tabs). That is not motion; the
  checker reports these pairs separately.

## 8. Story and staging choices
- **Hook camera pull-back.** This is a real stepped zoom of a world space: a huge paper
  Earth whose top is the launch pad, so the ground looks flat up close and curves away on
  pull-back. A "fig. 1" halftone launch plate is pinned on the desk and then pulled away.
- **Warm paper / navy paper.** Warm paper is used for launch/Earth scenes (hook, how it
  moves, fuel). Navy is used for space scenes (staging, orbit, number, payoff). In beat 2 a
  navy sheet slides in behind the rocket to show "no air needed".
- **Earth on a pin.** In the orbit and payoff beats the paper Earth is pinned through its
  centre with a push-pin. In the payoff, a thread from the pin to the coasting rocket is a
  desk-model nod to gravity.
- **Newton's cannon.** The paths are simulated with inverse-square gravity, not hand-placed:
  three shots at 0.42, 0.64 and 0.82 of circular speed land farther and farther away; the
  fourth, at circular speed, keeps looping.
- **Fuel bar.** The launch-mass bar is the same height as the rocket beside it (a visual
  rhyme), split ~90% propellant / ~10% everything else.
- **No named rocket.** No specific rocket is named for the 90% figure, because it varies by
  vehicle (see FACTS.md #3).
- **British/SA spelling** ("kilometres", "oxidiser"), since you are in South Africa.

## 9. Text sizes and safe zones
- Headlines are Oswald 700 at 76–118 px; labels and captions are Inter 700 at 40–56 px.
- Captions sit in the lower third with their bottom edge at y = 1742 (178 px from the bottom).
  Headlines sit at y ≈ 300 (top edge ≥ 230 px).
- The end-card credits are Inter 26 px. The brief allows small credit text on the final card,
  and they are not labels.

## 10. Transition handling
Each scene's Sequence stays alive 10 frames past its beat, so the next sheet slides over
it (5 held steps). There are no dissolves anywhere.
