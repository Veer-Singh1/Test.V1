# Camera plan: The brickworks that woke up a country

The video is 9:16, 720×1280, 30 fps and 43.0 s long, with an 80° vertical field of view. The timing is **estimated** at 3.35 words/s overall (see `src/sentence_times.json`). Camera keys are tied to word beats, so the plan re-times itself when real sentence times replace the estimate.

Moves use a monotone cubic time warp with ease-in and ease-out, and every move ends at rest. Each location change has a 0.4 s dip to cream. Shots 1→2 are one continuous move.

| Shot | Time (s) | Location | Camera path (start → end) | Move / speed | Foreground / midground / background | In-world labels (appear on) |
|---|---|---|---|---|---|---|
| 1 | 0.00–4.17 | A Brickworks yard | (0.55,1.35,4.1) → (0.35,1.40,3.4) | slow push in, about 0.7 m in 4 s | dirt / three workers with bricks, who set them down on "stopped" / gate, gatehouse, wall | chalkboard "9 JANUARY 1973" (from t=0), gate sign |
| 2 | 4.17–7.96 | A (continuous) | → (−0.5,1.6,1.55) on "January" → (−0.3,2.2,1.2) on "works" | track left, then crane up to the sign | chalkboard (blurred at end) / workers / gate | "9 JANUARY 1973" board on "January"; "CORONATION BRICK & TILE · DURBAN" on "works" |
| 3 | 7.96–12.86 | B Football stadium | (−2.4,1.15,3.6) → (−1.9,1.7,3.3) on "nine" → (−1.2,2.7,4.3) | crane up and slight pull back (reveal) | corner flag + ball near lens / crowd, more marching in from the right on "marched" / terraces, stand roof, city | placard "R8,97 A WEEK" raised on "nine" |
| 4 | 12.86–16.37 | A Gate notice board | (3.55,1.7,−1.4) → (4.3,1.8,−2.95) | push in about 1.7 m | brick stack near lens / notice board / wall, lamp | "NOTICE · STRIKES ILLEGAL" |
| 5 | 16.37–21.47 | C Manager's office | (0.35,1.62,2.9) → (0.05,1.7,1.6) | push in about 1.3 m | desk + phone + nameplate / boss behind desk, two worker reps / chalkboard, clock, pendant lamp | "+ R1,50" on "one"; strike-through + "NO" on "no"; "+ R2,07" ✓ on "two" |
| 6 | 21.47–24.43 | D Frame textile mill | (−3.9,1.45,4.6) → (−2.2,1.6,4.4) | sideways track right, about 1.7 m | barrels / workers streaming out of the gate / mill facade, sawtooth roof, chimney | "FRAME TEXTILES"; gate chalkboard "6 000 OUT" written on "six" |
| 7 | 24.43–29.05 | E Map room | (0.6,3.3,2.4) → (0.25,2.35,2.9) | crane down from the map to the tally board | table edge / 3D map of Durban, factory pins lighting up one by one / chalk tally board | "DURBAN 1973" map title; "60 000+ workers" on "sixty"; "100+ firms" on "hundred" |
| 8 | 29.05–33.87 | A Brickworks yard (cool light, the pivot) | (6.4,1.35,3.9) → (6.55,1.45,4.15) on "fire" → (7.4,3.3,6.8) on "all" | hold on the two-shot, then crane up and back to reveal the crowd | — / boss (bowler) points at one worker / the whole crowd, gate, notice, kiln chimney | gate sign and notice in the background |
| 9 | 33.87–38.69 | F Government office | (0.45,1.62,1.6) → (0.15,1.38,0.85) | push in and down onto the desk | desk lamp / report folder + page + stamp / official, bookshelf | "REPORT · WIEHAHN COMMISSION · 1979"; stamp prints "RECOGNISED" on "recognised" |
| 10 | 38.69–43.03 | A Brickworks yard (sunrise) | (0.7,1.45,8.2) → (−0.3,1.3,6.9) | slow push in, ends at rest | yard / one worker places the last brick on a low stack on "bricks" / crowd, gatehouse, chimney | gate sign in the background |

## Rules used
- Net travel in every shot, mostly 1–2 m per shot. The pivot crane in shot 8 is the one bigger move.
- The mix is push (shots 1, 4, 5, 9, 10), crane (3, 7, 8, 2) and sideways track (2, 6).
- Depth of field focuses at the look-at distance: foreground props blur, the midground stays sharp, and the background is softly blurred.
- Labels are part of the world (signs, chalkboards, a placard, a map title, a report cover), never floating captions.
