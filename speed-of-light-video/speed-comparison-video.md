# Speed Comparison Video: "How fast is light, really?"

A ~40-second vertical physics short using **Format B (scale journey)** from `video-style-guide.md`, with narration added. Each new speed's bar makes the previous ones look tiny, and the camera keeps zooming out. It ends on a reversal of the opening line, then loops.

Use this file in two parts:

1. **Part 1:** paste the script into ElevenLabs and export one audio file per line.
2. **Part 2:** put those audio files, this file and `video-style-guide.md` in one folder, open Claude Code there, and paste the prompt.

---

## Part 1: ElevenLabs script

### Settings

- **Voice:** one confident, clear voice, the same one you'll use for every video. A slightly deeper male or neutral narrator voice fits this style.
- **Model:** Eleven Multilingual v2 (most stable for narration).
- **Stability** 45%, **Similarity** 75%, **Style** 20%, **Speed** 1.05–1.10.
- Generate **one clip per numbered line**. Name them `01.mp3`, `02.mp3`, and so on. That lets Claude Code time each animation beat to the exact length of each clip.
- Numbers are written out in words so the voice says them correctly. Keep them that way.
- Write the lines exactly as below. Pauses come from the gaps between clips, so don't add pause tags.

### Script (18 lines, ~120 words, ~40 s)

| # | Say this (paste into ElevenLabs) | On-screen number |
|---|---|---|
| 01 | How fast is light, really? | – |
| 02 | Let's race. | – |
| 03 | You walk at about five kilometres an hour. | 5 km/h |
| 04 | Usain Bolt? Forty-four. | 44 km/h |
| 05 | A cheetah hits around a hundred. | ~100 km/h |
| 06 | A diving falcon: three hundred and ninety. | 390 km/h |
| 07 | A passenger jet cruises at nine hundred. | 900 km/h |
| 08 | Sound itself: twelve hundred and thirty-five. | 1,235 km/h |
| 09 | The space station: twenty-eight thousand. | 28,000 km/h |
| 10 | To escape Earth's gravity, you need forty thousand. | 40,270 km/h |
| 11 | Earth races around the Sun at a hundred and seven thousand. | 107,000 km/h |
| 12 | The fastest thing we've ever built, the Parker Solar Probe, hit six hundred and ninety-two thousand. | 692,000 km/h |
| 13 | And light? | – |
| 14 | One billion, seventy-nine million kilometres an hour. | 1,079,252,849 km/h |
| 15 | Over fifteen hundred times faster than our fastest machine. | ×1,560 |
| 16 | And sunlight still takes eight minutes to reach you. | 8 min 20 s |
| 17 | To cross our galaxy? About a hundred thousand years. | ~100,000 years |
| 18 | Light isn't slow. The universe is just that big. | – |

### Fact check

Every number here is a standard published figure:

- Walking pace: about 5 km/h.
- Usain Bolt's top speed: 44.7 km/h.
- Cheetah: roughly 100 km/h (measured 93–104).
- Peregrine falcon dive: about 389 km/h.
- Cruising jet: about 900 km/h.
- Speed of sound: 1,235 km/h (at 20 °C).
- ISS orbit: about 28,000 km/h.
- Earth's escape velocity: 40,270 km/h (11.2 km/s).
- Earth's orbit around the Sun: 107,000 km/h.
- Parker Solar Probe: about 692,000 km/h, set in December 2024.
- Speed of light: 1,079,252,849 km/h. That is about 1,560 times the probe's record.
- Sunlight takes about 8 min 20 s to reach Earth.
- The Milky Way is roughly 100,000 light-years across, though estimates vary.

---

## Part 2: Claude Code prompt

Copy everything inside the box.

````
Build a 1080x1920, 30 fps vertical explainer video called "How fast is light, really?".

## Inputs in this folder
- `video-style-guide.md`: my style guide. Follow Format B ("one continuous journey") and the Style Spec section exactly.
- `speed-comparison-video.md`: the script, with on-screen numbers in the Part 1 table.
- `audio/01.mp3` ... `audio/18.mp3`: narration, one clip per script line.

## Timing
1. Read each clip's duration with ffprobe.
2. Build the timeline from those durations: clip N starts when clip N-1 ends, plus a gap.
3. Gaps: 0.25 s normally. Use 0.6 s before line 13 ("And light?") and 0.9 s after it, so the reveal lands after a real pause. Hold 3 s after line 18.
4. Every visual beat for a line starts with its clip. Print the final timeline as a table before rendering.

## Look (from the style guide, Palette B)
- Background: vertical gradient from #140C26 (top) to #06050E (bottom), with faint stars at 4-8% opacity. More stars appear once the camera has zoomed past the Earth's scale.
- Text: white. Data numbers and the progress bar are mint #58F6CD.
- Font: Nunito Bold or Baloo 2 Bold (Google Fonts), sentence case.
- One horizontal glowing ground line, colour #D3B682.
- No hard cuts. No element appears without an animation.
- Keep text out of the top 10%, the bottom 20% and the right 12% of the frame.

## HUD (always on screen)
- Title, fixed at about 14% from the top: "How fast is light, really?"
- Below it, a live readout: "<name> = <speed>". Only the speed is in mint. When the speed changes, roll the number up over 0.8 s with ease-in-out.
- Below that, a progress bar on a LOG scale, from 1 km/h to the speed of light, with a small glowing light icon at the right end. Add a milestone dot for each racer. The fill grows to the current racer's position.
- A small "@myhandle" watermark at 30% opacity, bottom-centre, above the safe zone. Make the handle an easy variable to change.

## The stage: a bar chart that keeps rescaling
- Each racer is a vertical glowing bar standing on the ground line. Bar height is LINEAR in speed (km/h).
- Each bar has a neon outline icon above it, plus a label: name in white, speed in mint.
  Racers and icon tints:
  you (green), Usain Bolt (green), cheetah (yellow), falcon (orange), passenger jet (blue), sound wave rings (cyan), space station (blue), rocket for "escape Earth" (red), Earth (blue/green), Parker Solar Probe (gold).
  Draw every icon as simple geometric outlines with 2-3 px strokes and a soft glow. No images or emoji.
- The newest bar is always the hero: it is centred, glows warm cream #FFDEB4 with an orange #E7B46E edge, and is the brightest thing on screen.
- When a new racer appears, older bars slide left and fade to 50% opacity.
- After each new bar appears, the camera zooms out smoothly so the new bar fills about 55% of the stage height. Because the scale is linear, the older bars shrink into slivers. This shrinking is the main visual payoff of the video, so make it smooth and satisfying (ease-in-out, about 1 s).
- Hide labels that would overlap; keep only the newest three visible.

## Beat plan (line number: what happens)
01: Fade in from black within 3 frames, with the title already on screen. A single spark of light flickers at the far right of the progress bar.
02: The ground line draws left to right. A starting-line tick appears.
03-12: Each line adds its racer, as described in the stage section. The readout rolls to the new number. The progress bar fill advances on the log scale.
   - 05 to 06: hold one extra beat on the cheetah, so the falcon's bar visibly towers over it.
   - 09: the ground line starts curving into Earth's horizon as the camera passes orbital speeds.
   - 11: the Earth icon becomes the actual curved horizon underneath everything.
   - 12: the Parker probe bar is the tallest yet. Brief golden heat-shimmer around its icon.
13: Freeze everything. The music drops out completely (see the audio section). All bars dim to 30%.
14: The light bar shoots up from the ground and keeps going, far past the top of the frame. Then the camera zooms out hard over 2 s until the light bar fills the stage. Every previous bar, including Parker's, is now less than 1 px tall. Add one thin mint bracket labelled "everything else" around those invisible slivers. The readout rolls to 1,079,252,849 km/h. The progress bar fills completely and the light icon pulses once.
15: Under the readout, "×1,560 faster than Parker" pops in, scaling 0.8 to 1.0 over 0.25 s.
16: A small Sun appears at the top of the light bar, and a dot of light travels down the bar to Earth. A timer "8 min 20 s" counts up beside it.
17: The camera zooms out once more to a faint spiral galaxy outline. The bar is now a tiny line across it. The label reads "~100,000 years".
18: Final line in the largest text size (120-140 px), centred, with a soft white glow: "Light isn't slow. The universe is just that big." Hold 3 s.
Loop: in the last 0.5 s, quickly rewind (reverse-zoom blur with a small ⏪ icon) back to the opening frame, so the end joins the start seamlessly.

## Audio
- Narration clips go on top, unmodified.
- Music: generate a simple synth bed procedurally (Web Audio or a Python numpy script):
  - A low drone around 70-75 Hz.
  - A soft plucked note on every racer reveal, stepping UP the scale one note per racer (lines 03-12), so the pitch climbs as the speeds climb.
  - Bed level about 14 dB under the voice.
- Silence the music from line 13 until the end. Line 14 gets a single deep bass hit (40-60 Hz, 1.2 s decay) exactly as the light bar launches.
- Quiet sound effects: a soft whoosh on each camera zoom, and a tick on each number roll.
- Mix to peaks near -1 dBFS, average about -20 dB.

## Build approach
- One HTML file with a <canvas>. All animation is driven by a single timeline array of beats, generated from the audio durations:
  {start, end, line, readout, actions[]}
- Reusable helpers: rollNumber(), addRacer(), zoomTo(), popLabel(), fadeBars(), drawIcon(name).
- Render deterministically. Do not use real-time playback. Step a virtual clock frame by frame (frame / 30), capture each frame with Playwright, then encode with ffmpeg:
  H.264, yuv420p, CRF 18, AAC 192k.
- Output: `out/speed-of-light.mp4`.
- Also export `out/preview.png`, a contact sheet at 1 fps, so I can check it.

## Checks before you finish
- Text is on screen from frame 1. Something moves within the first second.
- Nothing stays still for more than 2 s.
- No text is inside the safe-zone margins.
- Every number on screen matches the Part 1 table exactly.
- Watch it muted: the captions and readout alone should make sense.
- Report the final duration (target 38-45 s).
````

---

## Swapping the topic later

The same prompt works for any physics comparison. Replace the racers and the script with a new list, keeping 10–12 steps from familiar to absurd, a pause before the final reveal, and a closing line that answers the opening question. Good next ones:

- Temperatures, from absolute zero to the core of the Sun.
- Sizes, from a proton to the observable universe.
- Loudness, from a whisper to the Krakatoa eruption.
- Densities, from air to a neutron star.
