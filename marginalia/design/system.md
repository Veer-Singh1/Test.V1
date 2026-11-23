# Marginalia — design system (Phase 2)

*An unofficial fan tribute to Emma Watson, designed as an annotated book.*
*The design reasoning is in `research/psychology.md`; the references are in `research/inspiration.md`.*

---

## 1. Concept in one line

**A quiet, literate book that a reader is annotating in red pen as you turn its pages.**

The design has two voices:

| Voice | Who speaks | Typeface | Used for | Never used for |
|---|---|---|---|---|
| **The book** | the printed page | Fraunces (serif) + Hanken Grotesk (UI) | facts, titles, body, navigation | — |
| **The reader** | the person annotating | Caveat (handwriting), editor's red | circles, underlines, arrows, short comments | facts, buttons, navigation, anything you must read to use the site |

This follows the MAYA principle. The book is familiar and needs no instructions; the
self-inking annotations are the novelty.

---

## 2. Colour

There are three hues: paper, ink, and one editor's red. Chapters change **paper state**, not hue.

```css
:root {
  /* paper */
  --paper:        #F3ECDF;  /* fresh cream: default page */
  --paper-aged:   #E9DFCC;  /* aged leaf: Reader, Credits */
  --paper-edge:   #D9CDB6;  /* page edges, spine shadows, card backs */

  /* ink */
  --ink:          #1C1A17;  /* 14.8:1 on paper; also the reversed page */
  --ink-2:        #4D473F;  /* secondary text: 7.8:1 on paper, 6.9:1 on aged */
  --ink-3:        #605950;  /* captions, folios: 5.9:1 on paper, 5.2:1 on aged */
  --rule:         rgb(28 26 23 / 0.18); /* hairlines (decorative, not meaningful) */

  /* the editor's pen */
  --red:          #A3322A;  /* 5.9:1 on paper, 5.2:1 on aged: text-safe */
  --red-on-ink:   #E27D6B;  /* 6.1:1 on ink: for the reversed Voice spread */

  /* reversed page (The Voice) */
  --paper-on-ink: #F3ECDF;  /* 14.8:1 */
  --ink-3-on-ink: #A79F92;  /* 6.6:1 */

  --grain-opacity: 0.07;    /* paper-grain overlay */
}
```

- **Contrast.** Every text pairing passes **WCAG AA at body size**, and most pass AAA. Hairlines are
  decorative, so the non-text 3:1 rule doesn't apply. Focus rings use `--red` (5.9:1) at 2 px.
- **Grain.** An inline SVG `feTurbulence` noise is tiled as a fixed pseudo-element with
  `mix-blend-mode: multiply`. It needs no image request and isn't painted again during scroll.
- **No pure white or pure black.** Paper is warm and ink is warm-black.

## 3. Typography

### Families (self-hosted, latin subset, `font-display: swap`)

| Role | Family | Axes used | Why |
|---|---|---|---|
| Display + body | **Fraunces Variable** (roman + italic) | `opsz` 9–144, `wght` 300–700, `SOFT` 0–50 | High-contrast "Old Style" serif. The optical-size axis lets one family do 200 px headlines and 18 px body copy crisply. Fewer families means faster and more fluent reading. |
| UI, labels, folios | **Hanken Grotesk Variable** | `wght` 400–600 | A clean, slightly warm grotesk. It stays out of the way. |
| Annotations | **Caveat Variable** | `wght` 400–700 | The most legible of the handwriting faces considered. Notes stay at 3–8 words. |

`font-variant-numeric: oldstyle-nums proportional-nums` is set on prose for a bookish rhythm,
and `lining-nums tabular-nums` on the folio counter and years.

### Fluid type scale (ratio about 1.25 at mobile, about 1.333 at desktop)

```css
:root {
  --step--2: clamp(0.75rem, 0.73rem + 0.1vw, 0.8125rem);   /* 12–13  folio, legal */
  --step--1: clamp(0.8125rem, 0.78rem + 0.15vw, 0.9375rem); /* 13–15  labels, captions */
  --step-0:  clamp(1.0625rem, 0.99rem + 0.35vw, 1.3125rem); /* 17–21  body */
  --step-1:  clamp(1.25rem, 1.12rem + 0.6vw, 1.625rem);     /* 20–26  lead / standfirst */
  --step-2:  clamp(1.5rem, 1.24rem + 1.2vw, 2.25rem);       /* 24–36  h3, card titles */
  --step-3:  clamp(2rem, 1.5rem + 2.4vw, 3.5rem);           /* 32–56  h2, chapter titles */
  --step-4:  clamp(2.75rem, 1.7rem + 4.8vw, 6rem);          /* 44–96  pull-quote */
  --step-5:  clamp(3.5rem, 1.4rem + 9.5vw, 11rem);          /* 56–176 chapter numerals */
  --step-6:  clamp(4rem, 0.4rem + 16.5vw, 17.5rem);         /* 64–280 Prologue name */
  --hand-0:  clamp(1.375rem, 1.25rem + 0.55vw, 1.75rem);    /* 22–28  margin notes */
  --hand-1:  clamp(1.75rem, 1.5rem + 1.1vw, 2.5rem);        /* 28–40  big notes */
}
```

### Text styles

| Token | Family | Size | Weight | Line-height | Tracking | Other |
|---|---|---|---|---|---|---|
| `display-name` | Fraunces | step-6 | 300 | 0.88 | -0.03em | `opsz 144`, `SOFT 50`; *Watson* in italic |
| `chapter-numeral` | Fraunces italic | step-5 | 300 | 1 | -0.02em | old-style roman numerals in red |
| `chapter-title` | Fraunces | step-3 | 400 | 1.05 | -0.015em | `opsz 96` |
| `pull-quote` | Fraunces | step-4 | 350 | 1.05 | -0.02em | `opsz 120` |
| `lead` | Fraunces | step-1 | 400 | 1.45 | 0 | `opsz 24` |
| `body` | Fraunces | step-0 | 400 | 1.55 | 0.003em | `opsz 14`, measure `≤ 60ch` |
| `label` | Hanken Grotesk | step--1 | 500 | 1.3 | 0.08em | uppercase, used for running heads |
| `ui` | Hanken Grotesk | step--1 | 500 | 1.2 | 0.02em | buttons, chips |
| `folio` | Hanken Grotesk | step--2 | 500 | 1 | 0.06em | tabular lining figures |
| `note` | Caveat | hand-0 | 500 | 1.1 | 0 | `--red`, rotated −2° to +2° |

## 4. Spacing

A 4 px base. Small steps are fixed; large steps are fluid.

```css
:root {
  --space-3xs: 0.25rem;  /*  4 */
  --space-2xs: 0.5rem;   /*  8 */
  --space-xs:  0.75rem;  /* 12 */
  --space-s:   1rem;     /* 16 */
  --space-m:   1.5rem;   /* 24 */
  --space-l:   2rem;     /* 32 */
  --space-xl:  clamp(2.5rem, 2rem + 2vw, 4rem);     /* 40–64 */
  --space-2xl: clamp(4rem, 3rem + 4vw, 6rem);       /* 64–96 */
  --space-3xl: clamp(6rem, 4rem + 8vw, 10rem);      /* 96–160 */
  --space-chapter: clamp(8rem, 5rem + 12vw, 16rem); /* gap between chapters */
  --gutter:    clamp(1rem, 0.6rem + 1.8vw, 2.5rem); /* page side margin, 16 at 390 px */
}
```

## 5. Grid: a book page

On desktop every chapter uses a **page grid with a real margin column for the notes**:

```
| gutter | 1fr | text (≤ 36rem ≈ 60ch) | margin (14–20rem) | 1fr | gutter |
          ^ spine side          ^ the reader writes here
```

```css
.page {
  display: grid;
  grid-template-columns:
    [bleed-start] var(--gutter)
    [wide-start] minmax(0, 1fr)
    [text-start] minmax(0, 36rem)
    [text-end margin-start] minmax(12rem, 20rem)
    [margin-end] minmax(0, 1fr)
    [wide-end] var(--gutter) [bleed-end];
  column-gap: var(--space-xl);
}
```

- A **12-column layout grid** (`repeat(12, 1fr)`, gap `--space-m`) is used inside full-width
  compositions (the Prologue, the shelf, the timeline).
- **Below 1024 px** the margin column folds away and notes become **inline asides**: smaller, still
  red, still handwritten, placed directly after the paragraph they annotate.
- The **running header** is a fixed bar 48 px tall. The verso (left) shows the chapter title; the
  recto (right) shows the book title. The folio "p. 12 of 96" sits bottom-right.

## 6. Breakpoints

| Name | Width | What changes |
|---|---|---|
| `xs` | < 480 | One column, notes inline, shelf vertical, page turn becomes a vertical lift |
| `sm` | ≥ 480 | Larger type steps begin |
| `md` | ≥ 768 | Two-column Prologue (name above, portrait plus text side by side) |
| `lg` | ≥ 1024 | **Margin column appears**, horizontal pinned shelf, page-turn leaf rotates on the Y axis |
| `xl` | ≥ 1440 | Container max 1440 px plus fluid gutters; type reaches its maximum |

Capability queries matter more than width:
`(hover: hover) and (pointer: fine)` enables the pen-nib cursor, magnetic buttons and hover
distortion. `(prefers-reduced-motion: reduce)` enables the calm mode (section 8).

## 7. Motion

### Easings

```css
:root {
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);    /* entrances: settle like paper */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);    /* page turns, Flip */
  --ease-in:     cubic-bezier(0.55, 0, 1, 0.45);    /* quick exits */
  --ease-ink:    cubic-bezier(0.45, 0.05, 0.25, 1); /* pen strokes: slow start, fast middle, slow lift */
}
```

The GSAP equivalents are `expo.out`, `power3.inOut`, `power2.in`, and
`CustomEase "ink" 0.45,0.05,0.25,1`.

### Durations

| Token | ms | Used for |
|---|---|---|
| `--dur-micro` | 150 | hover colour, cursor morph |
| `--dur-short` | 300 | buttons, chips, focus |
| `--dur-medium` | 600 | text reveals, mask reveals |
| `--dur-long` | 900 | page turn (on click), Flip open/close |
| `--dur-ink` | 700–1400 | a pen stroke, proportional to path length (about 900 px/s) |

### Rules

1. **Never alter scroll rate or direction.** Lenis runs at `lerp: 0.1`, `wheelMultiplier: 1`, with
   native touch scrolling. Pins are short (≤ 120vh) and only reveal information progressively.
2. **Annotations draw once, forwards, as they enter**, scrubbed to scroll over about 25vh, then stay.
   They don't undraw when you scroll back up: ink doesn't un-write.
3. **Body copy animates once** (a 12 px rise plus fade, 600 ms) and is never moved while you read it.
4. **Stagger budget**: letters 0.025 s, words 0.06 s, list items 0.08 s. A cascade never lasts more
   than 1.2 s.
5. **Velocity skew** on images is capped at ±3°, eases back over 400 ms, and is only on `lg` with a
   fine pointer.
6. **One peak.** The Voice is the only place with a long, dramatic sequence. Everywhere else is calm.

## 8. Reduced motion: the calm edition

With `prefers-reduced-motion: reduce`:

| Element | Full | Calm |
|---|---|---|
| Lenis | on | **not loaded** (native scroll) |
| Cover | opens in 3D | 200 ms cross-fade |
| Name split | letters rise | whole name shown |
| Portrait | mask reveal plus scale | shown |
| Margin notes | ink draws on scroll | **already inked** |
| Shelf | pinned horizontal scroll | normal vertical index, spines in a wrapped row |
| Flip panel | spine morphs to card | 200 ms fade |
| HeForShe quote | word-by-word | **whole quote** |
| Page turn | 3D leaf | none (chapter title page simply scrolls) |
| Skew, parallax, magnetic, cursor trail | on | off |
| Timeline line | draws with scroll | drawn |

## 9. Chapter specifications

The book has **96 pages**. Each chapter owns a page range, and the folio interpolates within it.

| # | Chapter | Pages | Paper state | Hero mechanic |
|---|---|---|---|---|
| 0 | Cover | 0 | cloth cover on paper | Page-count loader, then the cover opens |
| I | Prologue | 5–14 | fresh | Name split by letter, portrait mask reveal |
| II | The Roles | 15–38 | fresh | Pinned shelf of film spines; Flip into a detail card |
| III | The Voice | 39–52 | **reversed (ink)** | HeForShe quote typeset word by word; the peak |
| IV | The Reader | 53–70 | aged | Draggable stack of index cards |
| V | Timeline | 71–88 | ruled | Ink line draws down the page, with milestones pinned to it |
| VI | Epilogue | 89–96 | fresh, then aged colophon | "The End", credits, disclaimer |

**0 · Cover / loader.** A cloth-bound cover in ink sits centred on paper. On it: *Marginalia* in
Fraunces italic, a red ribbon bookmark, and the subtitle "An unofficial reader's tribute to Emma
Watson". Bottom-right, a folio counts **0 → 100** as fonts and the portrait load (real progress).
At 100 the cover swings open on its left hinge (`rotateY(-165deg)`, 900 ms, `--ease-in-out`),
revealing the Prologue's title page. Click, Enter or Space skips. Scroll is locked only until it
opens.

**I · Prologue.** A label (PROLOGUE), then **Emma *Watson*** at step-6, split into characters,
each rising from behind a baseline mask in sequence as you scroll the first 40vh. The portrait is
revealed by a `clip-path: inset()` wipe from the bottom, with the image settling from scale 1.12 to
1. The red pen circles the word *reader* in the standfirst and writes "← start here".

**II · The Roles.** About 20 spines (title plus year on the spine, set vertically) sit on a shelf
line. Desktop pins the shelf and translates it horizontally as you scroll down. Spines peek past
the right edge to show there's more, and arrow keys work. Hover (or focus) **pulls a spine out**
(`y: -18px, rotate: -2°`). Click opens the **detail card** with GSAP Flip: the spine becomes a book
lying open, showing year, role and one-line note, plus a source footnote. Esc or Close flips it
back. A plain "Index of films" table below is the accessible second path. On mobile the spines
stack vertically as horizontal bars.

**III · The Voice.** The page turns to **ink**. Context paragraph: the 20 September 2014 HeForShe
launch at UN Headquarters. Then the pull-quote is typeset **word by word as you scroll** (pinned
about 100vh). Words appear as if inked, with opacity and a 0.5 px blur clearing, not sliding. The
pen, in `--red-on-ink`, underlines one phrase and adds a footnote marker. The footnote cites the UN
Women transcript.

**IV · The Reader.** Aged paper. The story of the book club and the book-fairy project, followed by a
**stack of index cards** (book title, author, why it's here, source). You can drag the top card
aside (GSAP Draggable plus Inertia) and it slides to the bottom of the stack. "Next" and "Previous"
buttons do the same for keyboard and screen-reader users. A live region announces "Card 2 of 6:
*title*".

**V · Timeline.** Ruled paper (faint horizontal rules in a repeating gradient). One hand-wobbled
**SVG ink line** runs down the centre, its `stroke-dashoffset` scrubbed to scroll. Milestones
alternate left and right with a small circled year in red. Each milestone lights up when the line
reaches it.

**VI · Epilogue.** "*The End*" set at step-5 in italic, with the pen drawing a flourish beneath it
(the peak-end rule: end on a crafted moment). Then the **Colophon & Credits page** (aged paper):
photo credits (photographer, licence, link), typefaces (SIL OFL), sources, and the disclaimer at
readable size: ***"Unofficial fan tribute. Not affiliated with Emma Watson or her
representatives."*** The disclaimer also appears on the cover and in the footer.

### Page-turn transition (between chapters)
At each chapter boundary a **leaf** (a full-viewport paper sheet, `transform-origin: left`,
`perspective: 1800px`) turns from 0° to −180° as you scroll through a 70vh pinned gap. Its front
shows the previous chapter's last folio, and its back shows the next chapter's numeral. A soft
gradient shadow travels with the fold. Below 1024 px the leaf **lifts vertically** (`rotateX` from
the bottom edge). Contents links play the same turn over 900 ms while Lenis jumps underneath.

## 10. Components and signature details

| Component | Spec |
|---|---|
| **Running header** | Fixed, 48 px tall, paper background at 92% with backdrop blur. The verso shows the chapter title (`label`); the recto shows *Marginalia*. It hides on the Cover. |
| **Folio** | Fixed bottom-right: "p. **12** of 96". `aria-hidden`, since screen readers get chapter landmarks instead. |
| **Contents** | A button in the header opens a dialog styled as a contents page: chapter names with dotted leaders and page numbers. Focus is trapped and Esc closes it. |
| **Pen-nib cursor** | Fine pointers only. A 6 px ink dot follows with lerp 0.2 and morphs into a **pen-nib SVG** (rotated 45°) over links and buttons. The native cursor stays available: `cursor: none` only on `html.has-pen`. |
| **Magnetic buttons** | `.magnetic` elements pull up to 8 px toward the pointer within 60 px, and spring back with elastic.out(1, 0.4). |
| **Velocity skew** | `.skew` images: `skewY = clamp(velocity / -300, -3, 3)°`. |
| **Hover distortion** | Images get an SVG `feTurbulence` + `feDisplacementMap` "ink bleed" whose scale tweens 0 → 14 on hover. The fallback is a clip-path inset nudge. |
| **Sound** | Off by default; the toggle shows `aria-pressed`. Page turns and pen strokes are **synthesised with WebAudio** (filtered noise bursts), so there are no audio files. The setting is remembered for the session. |
| **Margin note** | `<aside class="note" aria-label="Reader's note: …">` holds an SVG stroke plus a Caveat caption. Decorative strokes are `aria-hidden`. |
| **Footnote** | A superscript red marker linking to a note with source and date (`role="doc-footnote"`). |

## 11. Imagery

- Every image path lives in `src/content/images.ts`.
- **Only** Creative Commons photographs from Wikimedia Commons (credited with photographer, licence
  and link) or clearly marked placeholders. No press or agency photos, no studio artwork, logos or
  crests.
- Images are delivered as **AVIF with a WebP fallback** in `<picture>`, with explicit
  `width`/`height` (no layout shift), `loading="lazy"` except the Prologue portrait
  (`fetchpriority="high"`), and `decoding="async"`.
- Photographs get a **subtle warm print treatment** (`filter: sepia(.12) contrast(1.02)` plus grain) so
  they sit on the paper.

## 12. Performance budget

| Budget | Target |
|---|---|
| JS (gzip) | ≤ 90 KB including GSAP core + ScrollTrigger + Flip + SplitText + Draggable + Inertia + Lenis |
| Fonts | 3 families, latin subset only; preload the display face |
| LCP image | ≤ 120 KB AVIF |
| CLS | 0 (explicit sizes, `size-adjust` fallback metrics) |
| Lighthouse Performance | ≥ 90 on mobile |

## 13. Decision log

| Decision | Why |
|---|---|
| Fraunces rather than Instrument Serif or Editorial New | Its optical-size axis covers display and body in one family (fewer requests, more fluency). It's OFL-licensed and self-hostable. |
| Caveat for the hand | It's the most legible option. The humanising effect of handwriting only helps if the notes are read easily. |
| No Three.js | The WebGL budget isn't needed. The one "hero moment" (the cover opening) is CSS 3D, which is cheaper and works everywhere. |
| SVG "ink bleed" distortion instead of a WebGL ripple | It's on-concept (ink on paper), weighs a few hundred bytes, and degrades cleanly. |
| A 96-page book | It's divisible into chapter ranges. Starting at p. 5 (front matter) gives honest endowed progress. |
| Site lives in `marginalia/` inside this repo | The owner asked me to decide. A folder is reversible, and a new repository needs their explicit request. |
