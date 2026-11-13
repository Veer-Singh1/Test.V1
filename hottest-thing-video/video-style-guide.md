# Short-Form Explainer Style Guide

A working template built from five reference videos: four monochrome "stick-figure" motivational shorts (videos 1–4, same channel, 35–67 s, landscape 1024×576) and one colour "scale journey" maths short (video 5, 35 s, vertical 576×1024, "How many folds to reach the Moon?").

**How this was analysed.** Frames were sampled across every video, the first 3 seconds were examined at 4–6 fps, caption changes were timed from frame differences, and the audio was measured (loudness per second, spectrogram, silences). Colours below are sampled from the frames.

**What could not be checked.** No speech-to-text model was reachable, so the scripts are read from the on-screen captions, not from the audio. Statements about the voice's tone are therefore limited; statements about timing, music and silence come from measurements.

---

## 1. The two formats in one glance

| | Format A: "Caption + stick figures" (videos 1–4) | Format B: "One continuous journey" (video 5) |
|---|---|---|
| Idea | A spoken argument, one line at a time, each line drawn as a tiny diagram | One question, answered by a single unbroken animation that keeps escalating |
| Narration | Yes, captions mirror it word for word | None visible; on-screen numbers and labels carry it, music does the pacing |
| Palette | Black and white only | Dark navy + warm orange subject + mint numbers |
| Cuts | Zero hard cuts; elements morph on one stage | Zero hard cuts; camera zooms out continuously |
| Best for physics when | You are explaining *why* something is true or busting a misconception | You are showing *scale*, growth, or a quantity changing (speed, size, energy, time) |

Both share the same core: **one stage, one idea on screen at a time, nothing decorative, constant motion, no cuts.**

---

## 2. What makes them work

### 2.1 The hook (first 2 seconds)

- **The first caption is on screen at frame 1** (measured: first caption change at 0.1 s in all four Format A videos). No logo, no intro, no "hey guys".
- **Format A opens with a statement that provokes disagreement**: "Good things come to those who wait? Bullsh*t." It takes a belief the viewer holds and attacks it. Video 1 stacks three short lines in the first 3 s, and each line gets its own visual action (three groups crossed out one by one, about 1 s apart).
- **Format B opens with a question whose answer feels impossible to guess**: "How many folds to reach the Moon?" The title never leaves the screen, so anyone joining late still knows the question.
- **A progress promise is visible immediately** in Format B: a bar with a Moon icon at the far end. The viewer can see how far there is to go, which is a reason to stay.

Physics equivalents: "Heavier things fall faster? Wrong." / "How fast would you have to throw a ball so it never comes down?"

### 2.2 Structure

Format A follows the same five beats every time:

1. **Provocation** (0–3 s): a bold claim or an attack on a common belief.
2. **Reframe** (3–6 s): one line that softens or redirects it ("Not because you hate them.").
3. **Evidence list** (6–25 s): 4–8 short, concrete examples, each one sentence, each with its own mini-diagram. Lists of three are everywhere (a sign / motivation / a shot; permission / Monday / ready; Fri / Sat / Sun).
4. **Command run** (25–32 s): two- or three-word orders in the biggest type ("GET UP." "GO GET IT."), delivered fast.
5. **Flip ending**: the opening line returns, reversed. "Good things come to those who wait?" becomes "They come to those who take them." "Four broke friends and you'll be the fifth" becomes "Go be the fifth millionaire." The last line is the largest text in the video and holds for 3–5 s.

Format B is one escalating ladder:

1. Question and rule stated once ("Each fold doubles the thickness").
2. Climb through familiar reference objects, each bigger than the last (dice, mug, cat, you, house, tower, Burj Khalifa, Everest, space, Earth, Moon).
3. **Payoff at about 60% of the runtime** ("Just 42 folds!" at ~21 s of 35 s).
4. **Overshoot**: instead of ending, it keeps going past the answer (Sun, nearest star, Andromeda, "103 folds: taller than the universe!"). This is the part people rewatch and share.
5. **Loop**: the last second rewinds to the folded paper at "3 folds", with a small rewind icon, so the replay starts seamlessly.

### 2.3 Pacing (measured)

| Video | Length | Caption changes | Median time per caption |
|---|---|---|---|
| 1 | 37.5 s | 16 | 1.4 s |
| 2 | 42.6 s | 27 | 1.45 s |
| 3 | 35.0 s | 19 | 1.35 s |
| 4 | 67.0 s | 25 | 2.0 s |
| 5 | 34.8 s | fold counter ticks continuously | – |

- **Something on screen changes roughly every 1.4 seconds**, even though there are no cuts.
- Script speed in video 1: about 105 words in 34 s, roughly **185 words per minute**. Fast, with no filler.
- Each video is followed by ~3 s of the platform's own end card; the content itself is 31–63 s. The four shortest ones are 31–36 s of content.
- Rhythm is varied on purpose: long sentences are held 3–6 s with several visual changes underneath; punch lines flash for under 1 s.

### 2.4 Script style

- **Second person, present tense.** "You", "your", never "people" or "one".
- **Short sentences.** Most are 4–9 words. The command lines are 2–3.
- **Concrete nouns over abstractions.** Not "nobody will support you financially" but "Your homies won't pay your rent."
- **Repetition with one word changed** ("Stop waiting for permission. Stop waiting for Monday. Stop waiting to feel ready.").
- **A recurring catchphrase** closes sections ("Lock the f*ck in" appears three times in video 3).
- **Numbers are specific**: "one in 137,500 chests", "87 matches", "credit 512", "2024 → 2026".
- The reference scripts lean on swearing for punch. That is a voice choice, not what makes them work; the structure and specificity carry over without it, and a clean script keeps the videos usable for school and safe for platform reach.

### 2.5 Captions and typography

- **Captions are the main visual, not a subtitle.** They sit in the top fifth of the frame, centred, all caps (Format A).
- **One sentence on screen at a time.** Multi-line captions build line by line: the upcoming line is shown dimmed grey, then lights up white as it is spoken.
- **Size carries emphasis.** Long sentences are small (about 3% of frame height); punch lines are 2–3× larger (about 7–9%); the final line is the largest of all (about 12%).
- Font: a clean geometric sans (Inter / Helvetica-like), bold weight, soft white glow.
- Tiny tracked-out labels (letter-spaced, ~1.5% height, grey) name things on stage: "FRIENDS", "CREDIT", "BROKE / RICH".
- Format B uses sentence case, a rounded bold sans, white text with **only the changing number in mint**. The eye goes straight to the number.

### 2.6 Visual style

**Format A (monochrome)**

- Background near-black `#040404`, a very faint perspective grid on the floor, sparse dim "dust" specks, faint vertical lines. Enough texture that black never looks empty.
- One thin white horizon line at ~80% of frame height. Everything stands on it.
- Characters: a circle head on a pill body. No faces, no limbs. The main character is pure white `#FFFFFF` and larger; everyone else is smaller and dimmer (`#D5D5D5` down to ~40% grey).
- **Brightness is the only "colour".** Importance = brighter and bigger. Rejected or irrelevant things fade to grey.
- A radial "energy burst" (concentric rings plus spokes) appears behind the hero at moments of resolve. It is the channel's signature mark.
- Props are thin white outlines only: boxes, clock, phone, chest, trophy, hourglass, calendar, speech pills.
- A small reusable vocabulary of motions: **X-out** (two diagonal lines strike through), **label pop-in** (rounded pill with text), **counter roll** (1/1,889 → 1/137,500; 2024 → 2026), **stack growth** (blocks pile up under the hero), **fade-to-grey**, **meter/progress bar** ("READY… 99%").
- Every line of script has a literal, instantly readable picture. "Waiting" is a figure on a chair beside a clock. "Half your talent" is a smaller figure standing on a podium marked 1.

**Format B (colour)**

- Background deep navy-purple `#140C26` fading to near-black `#06050E`; space sections `#0C0817`.
- One subject, always centred: the paper stack, glowing warm cream `#FFDEB4` with orange edge `#E7B46E`. It never leaves the screen.
- One accent colour for all data: mint `#58F6CD` (numbers, progress bar, measurements).
- Reference objects are neon outline drawings, each in its own tint (green house, blue tower, purple mountain), labelled with a name in white and a size in mint.
- The camera zooms out continuously so the subject stays the same height on screen while the world shrinks around it. The ground line curves into the Earth's horizon, then Earth becomes a dot.
- Environmental cues signal scale changes: clouds, then stars, then warp-speed streaks for the light-year section.
- A persistent HUD: title, live counter ("25 folds = 3.4 km"), progress bar with milestone dots.

### 2.7 Sound (measured)

- **Format A**: a continuous, dense audio bed with voice for roughly the first 60% of the runtime (steady around −20 dB). **Then the bed drops out completely and the voice is left dry, with real silence between lines** (video 2 from ~27 s; video 4 from ~32 s). The closing commands land in silence, which is why they hit harder. Video 3 ends on almost 3 s of silence under the final caption.
- **Format B**: music-led. The spectrogram shows stepped tones that **rise in pitch as the folds increase**, with heavy low bass (~74 Hz) throughout and a short dip just before the payoff at ~20 s. Rising pitch signals "this is still growing" without any words.
- Loudness is consistent across all five (mean about −19 to −21 dB, peaks at 0 dB).

### 2.8 Retention tricks, summarised

1. Text on screen from frame 1.
2. A visual change about every 1.4 s without a single cut.
3. One stage and one recurring character or object, so the viewer never has to re-orient.
4. Dimmed upcoming caption lines pull the eye forward.
5. Counters and progress bars create "how far will this go?" tension.
6. Payoff before the end, then an overshoot.
7. Ending that mirrors the opening (flip line, or literal loop back to the start).
8. Audio drop-out before the final lines.
9. Small unobtrusive handle watermark on screen the whole time.

---

## 3. Style spec (concrete values)

Build vertical for Shorts/TikTok/Reels. Four of the references are landscape, but the layout translates directly.

| Setting | Value |
|---|---|
| Canvas | 1080 × 1920, 30 fps |
| Length | 30–45 s of content (60 s maximum) |
| Safe zones | Keep text out of the top 10%, bottom 20%, and right 12% (platform buttons) |
| Caption zone | 12–28% from the top, centred, max 2 lines, max ~28 characters per line |
| Stage zone | 35–70% from the top |
| Horizon line (Format A) | ~68% from the top, 2 px, white at 60% opacity |
| Fonts | Inter Bold/ExtraBold (Format A, all caps); Nunito or Baloo 2 Bold (Format B, sentence case). Both free |
| Caption sizes at 1080 wide | Normal 44–52 px; emphasis 80–96 px; final line 120–140 px |
| Stage labels | 20–24 px, letter-spacing 0.2 em, 50% grey |
| Glow | Text and hero: white blur 12–20 px at ~35% opacity |
| Words per minute | 170–190 |
| Time per caption | 1.2–2.0 s typical; punch lines 0.7–1.0 s; final line 3–4 s |
| Animation timing | Pop-ins 0.2–0.3 s ease-out; X-out strokes 0.15 s each; counters 0.8–1.5 s ease-in-out; camera zoom continuous |
| Hard cuts | None |

**Palette A (monochrome)**

- Background `#040404`
- Hero / active text `#FFFFFF`
- Secondary figures `#D5D5D5`
- Dimmed / upcoming text `#8A8A8A`
- Faded / rejected `#4A4A4A`
- Grid and dust: white at 4–8% opacity

**Palette B (colour)**

- Background top `#140C26`, bottom `#06050E`, space `#0C0817`
- Subject `#FFDEB4` with edge `#E7B46E` and orange glow
- Data accent `#58F6CD`
- Text `#FFFFFF`
- Outline tints for reference objects: green, blue, purple, pink, one per object

**Audio**

- Voice: one consistent ElevenLabs voice for every video. Aim for confident and direct, medium-fast. Generate each sentence as its own clip so pauses can be placed exactly.
- Music bed: low, steady, 12–15 dB under the voice. Cut it entirely for the last 20–30% of the video.
- For Format B: a tone or note that steps up in pitch with each increment.
- Short, quiet sound effects on each visual action (tick, whoosh, soft thud). Optional, but they make the animation feel physical.
- Master so the loudest peaks just reach 0 dB and the average sits around −20 dB.

---

## 4. Script template

### Format A: misconception buster (30–40 s, ~95–115 words)

```
[0–3 s]   HOOK        State the common belief as a question, then reject it in one word.
                      "Heavier things fall faster? Wrong."
[3–6 s]   REFRAME     One line saying what is really going on.
                      "Gravity pulls everything down at the same rate."
[6–24 s]  EVIDENCE    4–6 one-sentence examples. Each must be drawable.
                      Use at least one list of three and at least one exact number.
                      "A hammer. A feather. On the Moon, they land together."
[24–30 s] COMMANDS    2–3 lines of 2–4 words in the biggest type.
                      "Remove the air. Drop them both. Watch."
[30–35 s] FLIP        Bring back the opening line, reversed. Hold 3–4 s.
                      "Heavier things don't fall faster. Air just gets in the way."
```

Rules: second person; sentences under 10 words; no "so basically", no "in this video"; every sentence must pass the test "can I draw this with circles, pills, boxes and lines?"

### Format B: scale journey (30–40 s, almost no narration)

```
TITLE (permanent)   A question with a surprising number as the answer.
RULE (first 4 s)    One line stating the rule that drives everything.
LADDER              10–14 reference objects in increasing size, familiar ones first.
PAYOFF (~60%)       The answer, highlighted in the accent colour.
OVERSHOOT           3–4 more steps beyond the answer, ending on something absurd.
LOOP (last 1 s)     Rewind to the opening frame.
```

Physics topics that fit: how fast to escape Earth; powers of ten from atom to galaxy; how long light takes to reach each planet; how much energy is in a sandwich compared with a lightning bolt; how deep the ocean is.

---

## 5. Shot list template

No cuts, so plan "beats" on one stage instead of shots.

| # | Time | Caption (exact words) | Size | What is on stage | Motion | Sound |
|---|---|---|---|---|---|---|
| 1 | 0.0–1.8 | HEAVIER THINGS FALL FASTER? | normal | Hammer and feather outlines held at same height | Both fade in, already on frame 1 | Bed starts |
| 2 | 1.8–2.6 | WRONG. | emphasis | Same | X-out over caption; burst behind text | Hit |
| 3 | … | … | … | … | … | … |
| last | 31–35 | (flip line) | final | Hero pose + burst | Slow push-in, hold | Silence |

Checks while filling it in: no beat longer than 3 s without something moving; no beat introduces more than one new element; the hero object is in every row.

---

## 6. Building it with Claude Code

1. Write the script in the template above and read it aloud with a timer. Trim to 170–190 wpm.
2. Generate narration in ElevenLabs, one file per sentence. Note each clip's duration; these durations set the beat times in the shot list.
3. Ask Claude Code to build the animation as a single HTML canvas/SVG scene (or three.js for low-poly objects) driven by a timeline array of beats: `{start, end, caption, size, actions[]}`. One file, one stage, reusable functions for `xOut()`, `popLabel()`, `rollCounter()`, `burst()`, `fadeToGrey()`.
4. Render frames with a headless browser at 1080×1920, 30 fps, and join them with the audio using ffmpeg.
5. Keep the timeline, palette and helper functions in one shared file so every video looks like the same channel.

A good first prompt: "Using the style spec in video-style-guide.md, Palette A, build a 1080×1920 30 fps canvas animation from this beat list and these audio clip durations. No hard cuts. Captions top-centred with the next line dimmed."

---

## 7. Pre-publish checklist

**Hook**
- [ ] Caption visible on the very first frame
- [ ] First line is a question or a claim people will want to argue with
- [ ] Something moves within the first second

**Script**
- [ ] 30–45 s, 170–190 wpm
- [ ] Every sentence under ~10 words and drawable
- [ ] At least one list of three and one exact number
- [ ] Last line mirrors or reverses the first (or the video loops)
- [ ] Every physics fact and number double-checked against a reliable source

**Visuals**
- [ ] One stage, no hard cuts
- [ ] A change on screen at least every 2 s
- [ ] One hero object, brighter and bigger than everything else
- [ ] Maximum one accent colour for data
- [ ] Emphasis lines 2× caption size; final line largest
- [ ] Nothing important in the platform's button zones

**Sound**
- [ ] Voice clear over the bed at phone volume
- [ ] Music drops out before the final lines
- [ ] Final line has a held pause after it

**Finish**
- [ ] Small handle watermark, same corner every video
- [ ] Watched once muted (captions alone must make sense) and once without looking (audio alone must make sense)
