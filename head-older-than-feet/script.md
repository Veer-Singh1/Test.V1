# Your head is older than your feet — script and fact map

Format: Physics Shorts kit (1080×1920, 30 fps, black / white / greys, one Volt Blue accent used 3 times).
Voice: Kokoro `am_fenrir`, speed 1.01, about 175 words a minute. Runtime 53.2 s.

| # | Line (on-screen caption) | What the picture does |
|---|---|---|
| 1 | Your head is **OLDER** than your feet. | Body clocks + "nanoseconds older" counter preview, then rewind |
| 2 | Most people think time ticks the same for everyone, everywhere. | Crowd of figures, identical clocks |
| 3 | You sleep on the top bunk, and you age faster than the person below. | Bunk bed, top clock glows |
| 4 | You live on a mountain, and your clock runs ahead of the beach. | Mountain vs beach clocks |
| 5 | You stand up, and your head pulls ahead of your toes. | Figure stands up; head clock vs feet clock |
| 6 | But look at what's actually happening. | Pull back: Earth appears, grid fades in |
| 7–9 | Gravity doesn't just pull on you. It *slows* time itself. The closer you are to Earth, the slower your clock ticks. | Grid bends toward Earth; FASTER/SLOWER clock column |
| 10 | That's **GRAVITATIONAL TIME DILATION.** | Music drop, Volt grid flash (accent 1), stamp |
| 11 | In 2010, scientists measured it with two clocks just 33 centimetres apart. | Two lab clocks, 33 CM bracket |
| 12–13 | Over a whole lifetime, your head gains about half a *microsecond*. Tiny. | Counter to 0.46 µs, shrinks on "Tiny" |
| 14–15 | But GPS satellites feel it every single day. Without correcting for it, your phone's map would drift by kilometres a day. | Satellite orbit, Volt signal beam (accent 2), map pin drifting, ~10 KM / DAY |
| 16–17 | So time isn't one clock everyone shares. Every part of you runs on its own time. | Back to the figure, every body part gets its own clock |
| 18 | And right now, the top of you is pulling **AHEAD.** | Head clock glows Volt + ring (accent 3), counter loops back to the hook |

## Fact check

- **Optical clocks 33 cm apart (2010):** Chou, Hume, Rosenband & Wineland, "Optical Clocks and Relativity", *Science* 329, 1630 (2010), NIST. They measured the faster tick of an aluminium-ion clock raised by about 33 cm.
- **Size of the effect:** the fractional rate difference is g·h/c² ≈ 9.81 × h / 9×10¹⁶ ≈ 1.1×10⁻¹⁶ per metre. NIST's own figure: 33 cm higher ages about 90 billionths of a second faster over 79 years.
- **Head vs feet over a lifetime:** for about 1.7 m and 80 years, 1.1×10⁻¹⁶ × 1.7 × 2.5×10⁹ s ≈ 4.6×10⁻⁷ s ≈ **0.46 µs (about half a microsecond)**, which is the 460 ns counter.
- **GPS:** gravity makes satellite clocks run about 45 µs/day fast and orbital speed slows them about 7 µs/day, about **+38 µs/day** net. Left uncorrected, the position error grows by **about 10 km per day** (38 µs × the speed of light ≈ 11 km). The script says "kilometres a day", and the pill shows "~10 KM / DAY".
- "Top bunk / mountain / standing up" are all the same effect, just with different heights. Every one of them is real but tiny.

## Production decisions

- Built as a reusable SVG template for the kit (no WebGL), so it renders in about a minute on any machine.
- The voiceover is timed per sentence, so cuts, word reveals, rings and the music drop land on the actual spoken words.
- Music is an original 64 BPM pulse pad generated in code (royalty-free). It drops out about 1 s before the named concept and fades over the last 5 s.
- The mix is loudness-normalised to −14 LUFS, true peak −1.5 dBTP.
