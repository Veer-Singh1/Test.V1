# Phase 1 — Inspiration research

*Marginalia: an unofficial Emma Watson fan tribute. Research compiled 23 Nov 2026.*

This file records what nine award-winning sites actually do, so that Marginalia can borrow
**principles**, not designs. Nothing here (code, assets, layouts, branding) is to be copied.

---

## How this research was done

- **Live sites, not screenshots from galleries.** Each site was rendered in headless Chromium at
  **1440 × 900** and **390 × 844**. I captured the loader (at 0.6 s, 1.5 s, 3 s and 5 s), ten scroll
  positions driven by real wheel events (so Lenis and ScrollTrigger respond), one page transition
  (by clicking an internal link) and five mobile positions.
- **Measured, not guessed.** Fonts come from `document.fonts` and computed styles. Colours come from
  each site's own CSS custom properties, or are sampled from pixels for WebGL scenes. Libraries come
  from `window` globals and script URLs. Image formats and lazy-loading come from the DOM.
- **Awards verified separately.** awwwards.com blocks automated access (the upstream request fails),
  so Awwwards facts come from its own listing snippets via web search. CSSDA facts were read directly
  from cssdesignawards.com.
- **Limits, stated plainly:**
  - FWA's winner list loads from a host this environment can't reach, so no FWA winner was studied
    directly. *Mouthful of Dust* carries an FWA laurel, which is the nearest FWA data point.
  - Messenger could not be driven past its title screen headlessly, so its gameplay description
    comes from press coverage (80.lv, Aftermath).
  - Trevor Noah's page transition could not be triggered (the nav click timed out), so it is not
    described.

## The shortlist (9 sites)

| # | Site | Studio | Award (verified) | Why it's here |
|---|------|--------|------------------|---------------|
| 1 | **Lando Norris** | OFF+BRAND | Awwwards **Site of the Year 2025** (+ Developer Award; SOTD 17 Nov 2025) | A famous person's site at the very top of the field |
| 2 | **Trevor Noah** | OFF+BRAND | Awwwards **Site of the Day, 3 Sep 2026** | A celebrity site with humour; a page-count loader |
| 3 | **Ousmane Dembélé — Né pour briller** | FLOT NOIR | Awwwards **Honorable Mention, 13 Nov 2025** | One person's life told as chapters |
| 4 | **Messenger** | abeto | Awwwards **Developer Site of the Year 2025** (listed with the SOTY 2025 tag) | Storytelling by doing, not reading |
| 5 | **Paris by Emily** | LOOP | Awwwards **SOTD 26 Dec 2025** + Developer Award | Editorial, photographic warmth |
| 6 | **Made With GSAP** | Made With GSAP | Awwwards **SOTD** (score 7.65) | Motion-technique reference |
| 7 | **Mouthful of Dust** | State Library Victoria (SLV LAB) | Webby nominee 2026 (Cultural Institutions); Good Design Award 2025; shows Awwwards + FWA laurels | A library, archives, new writing, exemplary accessibility |
| 8 | **Gianluca Boccia — Still Drawing** | Gianluca Boccia | CSSDA **Website of the Day, 14 Nov 2026** (8.32) | A pen line that draws itself as you scroll |
| 9 | **Henrietta Said** | Tattoo Digital | CSSDA **Website of the Day, 13 Nov 2026** (8.52) | A deliberate outlier: loaders, pinned chapters, "page-edge" tabs |

> Two corrections to the brief. **Messenger** won *Developer* Site of the Year 2025; the overall
> Site of the Year was **Lando Norris**. The Dembélé site received an Awwwards **Honorable Mention**,
> not a Site of the Day.

**Stack at a glance.** Five of the nine expose GSAP 3.13–3.15 on the page (Lando's and Trevor's
custom bundles may include it, but I couldn't confirm), and six load Lenis. Five are built in Webflow. WebGL appears only where the concept needs it: Lando's helmet reveal, Messenger's world and
Mouthful's 3D scans. Paris by Emily, Henrietta and Dembélé serve images as AVIF or WebP with
`loading="lazy"` on nearly every image.

---

## 1. Lando Norris — OFF+BRAND
`landonorris.com` · Webflow, Lenis, jQuery, a custom bundle, 21 `<canvas>` · 133 images (131 lazy, WebP)

- **Layout & grid.** The hero is a full-bleed, centred portrait. Below it, photos scatter loosely
  across a 12-column field at different depths. "On Track / Off Track" is a 50/50 split, and the
  helmet "Hall of Fame" is a four-column grid of keylined cards. Tokens: `--padding--container:
  1.25rem`, `--gap: 1.25rem`, `--text--impact: 7.94rem`.
- **Type pairing.** **Brier** (a serif) for accent words and quotes, and **Mona Sans Variable**
  (grotesk) for everything else. Uppercase grotesk headlines swap single words to lime serif
  mid-sentence: "**REDEFINING** LIMITS, FIGHTING FOR **WINS** … **LEGACY**".
- **Palette.** `#282c20` dark green · `#f4f4ed` off-white · `#111112` black · `#d2ff00` lime ·
  `#b2c73a` lime-off · `#dde1d2` / `#b4b8a5` sage tints.
- **Signature interaction.** Moving the cursor over the hero portrait paints his helmet livery onto
  his face in blob-shaped patches (WebGL). On mobile this becomes **"TAP TO LOOK"**.
- **Scroll choreography.** "Message from Lando" puts distorted marquee type behind a desaturated
  portrait. A manifesto statement follows. A photo collage then drifts at several parallax speeds
  over a faint topographic contour texture, each photo captioned with **place and year**. The
  background moves from dark green to sage to paper. Quotes are set in serif and closed by a
  **handwritten signature**.
- **Page transitions.** A full-screen lime sheet with the monogram covers the page in about 150 ms.
  The next page then builds behind a huge "TRACK" headline.
- **Loading.** A lime full-bleed sheet holds for about 1.5 s with a tiny "LOAD NORRIS" label, then
  uncovers the cream hero.
- **Image treatment.** A cut-out portrait. Collage photos are often desaturated to sit in the palette.
  Helmets are studio-lit cut-outs on near-black.
- **Memorable because** the object most tied to his identity (the helmet) is literally mapped onto
  him, and the track contour lines become a texture.

## 2. Trevor Noah — OFF+BRAND
`trevornoah.com` · Webflow, Lenis, custom bundle · 28 images (WebP, 22 lazy)

- **Layout & grid.** A centred, single-column story. His name runs about 360 px tall across the
  width. Every section title is a **two-line pair**, a white category over a pink subtitle: "Media /
  On The Screen", "About / This Guy", "Latest / Where's Trevor?", "Books / On The Page". News items
  are table rows of date, title and blurb.
- **Type pairing.** One superfamily, **Die Grotesk** (cuts B, C, D; 400–700). Emphasis comes from
  **colour** (pink), not from a second typeface.
- **Palette.** `#1d2440` navy · `#ff9bb4` pink · `#f9fcf4` off-white · `#2b2b2b` charcoal ·
  `#dde3f9` body text on navy.
- **Signature interaction.** "Head as interface." A sticker-cut photo of his head, the top lifted off,
  with his world spilling out: a mic, books, a video player, a brain, a heart. The head comes back as
  a guide through later sections, and a cut-out hand holds a pen.
- **Scroll choreography.** Centred statements reveal with pink emphasis words, and media objects
  float around a "View All Media" pill. The navy gives way to charcoal. A **torn-paper edge** leads
  into a pull-quote with big pink quote marks. Book covers fan in at the end.
- **Quotes are cited on the page.** "If you laugh with somebody, then you know you share something"
  is followed by *Trevor Noah, PEOPLE Magazine Interview, Sep 28, 2015*.
- **Page transitions.** Not captured (see Limits).
- **Loading.** A navy screen with a **giant pink counter** top-left counting up (0 → 38 → …). Then the
  sticker-cut head scales in, and the site begins.
- **Image treatment.** Sticker cut-outs with a white keyline, like a scrapbook.
- **Memorable because** his personality is made literal, and it's funny.

## 3. Ousmane Dembélé — Né pour briller — FLOT NOIR
`ousmaneballondor.fr` · Webflow, GSAP 3.13, ScrollTrigger, Lenis · 14 videos, 3 canvases · WebP/AVIF, all lazy · ~40,000 px tall

- **Layout & grid.** Full-bleed chapters. Paired headline words pin to opposite edges of the screen
  ("NÉ POUR … BRILLER", "LES PREMIERS DRIBBLES … DU DESTIN"). The top nav is the **career as a
  table of contents**: Évreux · Stade Rennais · Borussia Dortmund · FC Barcelone · Paris Saint-Germain.
- **Type pairing.** **Being** (900, ultra-heavy caps) with **Doner** (200–900 sans). Chapter labels are
  letter-spaced ("L E S   R A C I N E S"). Club names are **hand-brushed script** drawn as artwork.
- **Palette.** `#fffcf5` off-white paper · `#0d0d0d` black · `#c1b28b` gold. Each chapter has its own
  club colour as a token: Évreux `#981616`, Rennes `#610505`, Dortmund `#ffd400`, Barça
  `#590d20`/`#05192e`, PSG `#aa2221`/`#091a34`.
- **Signature interaction.** A jersey rotates in 3D as you scroll, with the club name brush-painted
  behind it. About 120 frames come from one asset bucket, so this is probably an image sequence
  (inferred from request counts).
- **Scroll choreography.** The intro paragraph lights up **word by word**, grey to white, as you
  scroll. Each chapter swaps in its club colour. Giant **outlined numerals** (2004, 2009) act as
  timeline markers. Photo collages sit around the jersey.
- **Page transitions.** A single page; the chapter nav jumps within it.
- **Loading.** Cream paper with visible grain while gold **handwriting writes itself**: "Né pour…".
  On mobile the loader is a sphere of gold particles, the Ballon d'Or itself.
- **Image treatment.** Red-and-black **halftone duotone** portraits, film grain over everything,
  cut-out jerseys and fabric textures.
- **Memorable because** one life is told as five chapters, each with its own colour, and the trophy
  is the loader.

## 4. Messenger — abeto
`messenger.abeto.co` · a single WebGL scene (Three.js, per press) · no DOM content beyond the canvas

- **Layout & world.** No page at all, just a tiny walkable planet. The UI is drawn inside the scene.
- **Type.** The title is **hand-built block lettering as 3D geometry**, "MES / SEN / GER" stacked
  3 × 3 on the planet. "Loading" and "Begin" are hand-lettered. No web fonts load on the title screen.
- **Palette** (sampled). Sea teal `≈#60b6ad`, cream letterforms `≈#ccd7d1`, a mustard "Begin"
  button, and cel-shaded pastels with ink outlines.
- **Signature interaction.** You are a courier delivering letters and parcels for the planet's
  residents. Other walkers are real players, and you can talk to them only with emotes (80.lv,
  Aftermath). The story happens through errands, not reading.
- **Choreography.** The camera dollies in from a speck to a close-up of the planet, which slowly turns.
- **Transitions.** A **diagonal teal wipe** sweeps across from the loader into the world.
- **Loading.** A white page with a small **hand-drawn envelope** and "LOADING". The loader is the
  story's object, a letter.
- **Image treatment.** Toon-shaded, ink-outlined, hand-painted textures: illustration, not photography.
- **Memorable because** you're inside the story, and the letter motif runs from the loader to the
  gameplay.

## 5. Paris by Emily — LOOP
`parisbyemily.com` · Webflow, GSAP 3.15 (ScrollTrigger, **SplitText**, ScrollSmoother, Draggable, Inertia, Observer, CustomEase), Lenis · 65 AVIF, 80 lazy

- **Layout & grid.** An entry "selector" on black (a headline plus two fanned portrait cards, Paris
  and Rome) leads to a city page. That page opens on a **framed hero**: an inset, rounded card inside
  a page margin. The cream flow below has a centred headline among scattered rounded photos, a marquee
  row, stacked sticky experience cards, tape-like ribbons, and an index list on hairline rules.
- **Type pairing.** **Roslindale Display Condensed** (a high-contrast condensed serif, 400/700) for
  display, **PP Neue Montreal** for UI, and **Mango Grotesque** (condensed caps) for tags and
  testimonial names.
- **Palette.** Black (entry only) · cream `#fbf5ee` · ink `#1a1a1a` · lavender `#d3d3ff` ·
  coral `#ff7782` · aqua `#b8e3e9`.
- **Signature interaction.** Tilted postcard-like video cards on the selector cycle through clips.
  On the city page, **washi-tape ribbons** in pastel colours cross diagonally, holding round sticker
  photos between words ("TOUR · FOOD · WINE · CHEESE · MACARON").
- **Scroll choreography.** The hero card shrinks as you scroll and photos drift in parallax. Experience
  cards stack, each new one sliding over a **blurred, dimmed** previous one. Ribbons cross. Small
  sparkle and asterisk glyphs act as **doodles** in the margins.
- **Page transitions.** From selector to city: a peach colour wash, then black, then the chosen
  video card scales up with the wordmark into the framed hero. It reads as one object carried across.
- **Loading.** Black, while the headline rises **word by word on staggered baselines** (SplitText).
- **Image treatment.** Warm-graded photos and video, all with rounded corners.
- **Memorable because** it has the warmth of a lifestyle magazine plus scrapbook details: tape,
  stickers and doodles.

## 6. Made With GSAP
`madewithgsap.com` · GSAP 3.15 (ScrollTrigger, SplitText, CustomEase, MorphSVG, Draggable, Inertia), Lenis, Matter.js · 24 preview videos

- **Layout & grid.** Centred and generous. The pill nav carries live counts ("COLLECTION 127"). Card
  grids are three across, and the pricing sits on a single card.
- **Type pairing.** **Lay Grotesk** (500/800) with **PP Neue Montreal Mono** for uppercase UI labels.
- **Palette.** `#0a0a0b` near-black · `#fff`/`#f1f1f1` · lime `#c9fe6e` · green `#28df7d` ·
  greys `#232323`/`#999`.
- **Signature interaction.** A small hero media card is **scrubbed to full-bleed**, flipping the page
  from white to black. A **scrambled headline resolves** as you scroll ("17 fct e on wek" becomes
  "127+ effects. New one every week."). Feature cards are **dealt like a hand of playing cards**.
- **Scroll choreography.** Statements pin in place, cards deal in, and a live **"ON SCREEN • 090"**
  counter sits bottom-right.
- **Page transitions.** The old page dims, cuts to black, and the next page's header ("Collection
  127") builds in.
- **Loading.** About 3 s on black, then the hero card appears.
- **Image treatment.** Effect previews are **looping videos**, not live demos, which keeps the page fast.
- **Motion catalogue** (from `/effects`). 129 effects, tagged **Scroll 92 · Mouse-move 35 ·
  Infinite 19 · Drag 13 · Click 9**. Scroll-linked motion dominates award-level work.

## 7. Mouthful of Dust — State Library Victoria
`mouthfulofdust.slv.vic.gov.au` · one bundled JS app (Vite-style asset names, inferred), WebGL, Typekit (Proxima Nova) · cinematic and time-based

- **Structure.** A sequence of gates: an Acknowledgement of Country, then a title page with award
  laurels, a content warning, a captioned intro film, and finally a 3D exploration of scanned objects
  (Ned Kelly's armour, rifle, boot, death mask and the Jerilderie Letter, per SLV). New writing by
  several authors accompanies the objects.
- **Type pairing.** **Proxima Nova** in widely tracked caps, with **handwritten script** layered across
  the title ("MOUTH*ful of dust*"). The content warning italicises the work's title, as print does.
- **Palette.** Black, white and greys. The colour comes from **sepia archival photography**
  (`≈#bdb09d`).
- **Signature interaction.** Archival photographs move in slow 2.5D push-ins. Original **handwritten
  annotations on the archive prints** stay visible ("Melbourne 2.3.18").
- **Choreography.** Time-based, not scroll-based, with player controls: play/pause, **captions,
  audio description, Skip**, and a sound toggle.
- **Transitions.** Fades through black between stages.
- **Loading.** **Honest progress**: "about 30 seconds", "Fetching textures…", "Fetching intro
  audio…" over a hairline bar. Graphics quality is set automatically ("Graphics set to Low. Adjust
  via settings").
- **Accessibility.** SLV LAB worked with the Centre for Accessibility Australia to reach WCAG 2.2 AA
  (SLV LAB update notes).
- **Memorable because** it brings a library, an archive and literature together with restraint and
  care. This is the closest cousin to a tribute about a reader.

## 8. Gianluca Boccia — Still Drawing
`gianlucaboccia.me` · GSAP 3.15 + ScrollTrigger, hand-written modules (`line-passage.js`, `case-character.js`) · all SVG, no raster images · ~52,000 px tall

- **Layout & grid.** A single-column narrative. A small label and a headline sit on the left, with a
  paragraph on the right. The drawing fills the lower half of the screen. A bottom bar shows a
  **chapter counter** ("01  Campania, Italy  +") and "Keep going ↓".
- **Type pairing.** **Helvetica Neue** only, from 13 px labels to a 112 px name. Labels are tracked
  small caps ("CAMPANIA, ITALY · THE BEGINNING").
- **Palette.** `--ink: #171717` · `--paper: #fff` · `--muted: #72716c` · `--hair: #deded9`. Chapter
  backgrounds shift `#dbdfe8` → `#53587e` → `#415987` → `#5d556d` → `#7c5254`.
- **Signature interaction.** **One continuous pen line, drawn by an illustrated hand, scrubbed by
  scroll.** It starts as his signature, then becomes a character, mountains and an envelope. Even the
  cookie card's rule has a small wave in it.
- **Scroll choreography.** The line draws in step with scroll, text blocks swap per chapter, and the
  background blends from one chapter colour to the next.
- **Transitions.** "Animated story" pairs with a **text-only "Story" page**, a calm, static version of
  the same narrative.
- **Loading.** None. The page is white with "Scroll to begin", and content is instant.
- **Memorable because** a single self-drawing line is the spine of the whole story. It is humble,
  personal, and fast.

## 9. Henrietta Said — Tattoo Digital *(deliberate off-brief outlier)*
`henrietta.wearetattoodigital.com` · Webflow, GSAP 3.15 (SplitText, ScrollTrigger, CustomEase, CustomWiggle), Lenis · 42 AVIF, 44 lazy

- **Layout & grid.** The whole site sits inside a **blush frame**, like a passe-partout around the
  viewport. A pinned horizontal run of flavour chapters places a giant knocked-out word behind each
  pack, followed by split panels.
- **Type pairing.** **Sink** (condensed display caps), **The Dodger Inky** (an inky, hand-drawn face)
  and **Changa One**.
- **Palette.** Blush `#e3a898` · kimchi red `#d32929` · dark red `#761615` · brown `#8b231a` ·
  orange `#f45016` · lemon `#efc415` · dark `#2d2a26`.
- **Signature interaction.** Pinned flavour chapters change background colour, giant word and pack
  together. "Some call us spicy" ends in **stacked colour stripes on the right edge that look like a
  book's fore-edge tabs** and slide open into panels.
- **Page transitions.** The current page shrinks back into the frame while **bands of the next page
  rise from below** in alternating colours.
- **Loading.** A **% counter** at the bottom centre under the logo, while product characters peek in
  from the corners as it fills.
- **Memorable because** chapters are colours, the loader has personality, and the fore-edge tabs
  make an unexpected book metaphor.

---

## Patterns across the nine

1. **Loaders tell you something.** Trevor uses a counter, Lando a brand-coloured sheet, Dembélé
   handwriting that writes itself, Mouthful an honest time estimate, Messenger the story's object.
   None use a spinner.
2. **Chapters are environments.** Boccia shifts background colour, Dembélé club colours, Lando paper
   tone, Henrietta product colour. A chapter change is felt, not just labelled.
3. **The hand is present.** Lando's signature, Boccia's pen line, Dembélé's brush script, Mouthful's
   script title and archive annotations, Messenger's hand-lettering, Paris's doodles. Award juries
   reward evidence of a person.
4. **Wayfinding is designed.** Boccia's footer chapter counter, MWG's "ON SCREEN" counter, Dembélé's
   career table of contents, Trevor's two-line section titles.
5. **Emphasis by contrast inside one line.** Lando swaps serif and grotesk, Trevor colour, Mouthful
   print and script.
6. **One hero idea, then restraint.** Each site has one unforgettable mechanic (the face reveal,
   head-as-interface, the self-drawing line, the walkable planet) and keeps everything else calm.
7. **Mobile changes the idea, not just the size.** Cursor becomes "TAP TO LOOK" (Lando), a card fan
   becomes a swipe carousel (MWG), a giant word becomes a label (Henrietta), quality adapts to the
   device (Mouthful).
8. **Performance is invisible craft.** AVIF/WebP with lazy loading (Paris 65 AVIF, Henrietta 42,
   Lando 131 lazy), videos instead of live demos (MWG), SVG-only illustration (Boccia).

## What this means for Marginalia (to be designed in Phase 2)

| Chapter | Borrowed principle | Seen in |
|---|---|---|
| 0 Cover / loader | A loader that tells you something: a folio page count, then the cover opens | Trevor, Mouthful, Messenger |
| 1 Prologue | One hero mechanic, then restraint: name split by letter, portrait mask reveal | Lando, Trevor |
| 2 The Roles | Content as physical objects; mobile changes the idea (shelf becomes a vertical stack) | Trevor's books, Paris's cards, MWG's dealt cards |
| 3 The Voice | Scrubbed text reveal that the reader controls; quotes cited on the page | Dembélé, Trevor |
| 4 The Reader | Objects you can handle: a draggable stack | MWG, Paris |
| 5 Timeline | A line that draws itself as the spine of the story | Boccia, Dembélé's outlined years |
| 6 Epilogue | An honest ending, credits as content | Mouthful (credits, care), Boccia (text version) |

---

## Steal the principle, not the design

Ten techniques to borrow, each with how Marginalia will express it **in its own visual language**,
and the line we won't cross.

1. **Make the loader part of the story.**
   *Seen in:* Trevor's giant counter, Mouthful's honest ETA, Messenger's envelope.
   *Marginalia:* a closed book cover with a running **folio**, "p. 0" to "p. 100", that tracks real
   asset loading (fonts and the first image), never a fake timer. At 100 the cover opens. Under
   300 ms it is skipped; on repeat visits it is shortened.
   *Won't copy:* a giant pink numeral in the corner, or a brand-colour sheet.

2. **Draw the hand's marks with the scroll.**
   *Seen in:* Boccia's self-drawing pen line, Dembélé's handwriting write-on, Lando's signature.
   *Marginalia:* an **editor's pen vocabulary** (circles around words, underlines, carets, brackets,
   arrows, marginal comments) as SVG paths animated by stroke-dashoffset or GSAP DrawSVG and scrubbed
   to scroll. Marks never cover body text, and each one has a text equivalent for screen readers.
   *Won't copy:* an illustrated drawing hand, or a continuous illustrative line.

3. **Give the page two voices: print and hand.**
   *Seen in:* Lando's serif/grotesk swaps, Mouthful's script over tracked caps.
   *Marginalia:* the **book** speaks in a high-contrast serif (facts, titles), and the **reader** speaks
   in handwriting (commentary only). Facts never appear in the handwritten voice.
   *Won't copy:* lime accent words, or the "MOUTHful of dust" lock-up.

4. **Make each chapter an environment.**
   *Seen in:* Boccia's chapter colours, Dembélé's club colours, Lando's tonal shifts.
   *Marginalia:* the palette stays strict (cream, ink, editor's red), so chapters change **paper state**
   instead: fresh cream, an aged leaf, an ink-reversed page for The Voice, a ruled index for the
   Timeline.
   *Won't copy:* a new hue per chapter.

5. **Design the wayfinding.**
   *Seen in:* Boccia's footer chapter counter, MWG's live "ON SCREEN" counter, Dembélé's career contents.
   *Marginalia:* a real book's apparatus. A **running header** (chapter title on the verso side, the
   book title on the recto side), a **folio** "p. 37 of 112" computed from scroll, and a contents page
   that doubles as navigation.
   *Won't copy:* pill navigation with counts.

6. **Carry one object across a transition.**
   *Seen in:* Paris's card scaling into the hero, Lando's monogram wipe, Messenger's diagonal wipe.
   *Marginalia:* the **page turn**. The outgoing chapter folds from the fore-edge around the spine (CSS
   3D `rotateY`), and the chapter numeral is carried across the gutter. With reduced motion it becomes a
   short crossfade.
   *Won't copy:* full-screen colour wipes.

7. **Treat content as things you can handle.**
   *Seen in:* Trevor's fanned books, Paris's tape and stickers, MWG's dealt cards, Henrietta's tabs.
   *Marginalia:* film titles as **book spines** on a shelf, and favourite books as a **draggable stack of
   index cards** with typed labels. All flat, printed paper, with no 3D renders.
   *Won't copy:* sticker cut-outs, washi-tape ribbons, or a playing-card fan.

8. **Cite quotes on the page.**
   *Seen in:* Trevor's "PEOPLE Magazine Interview, Sep 28, 2015".
   *Marginalia:* every quote carries a **footnote marker**, and the footnote appears as a margin note
   with source and date. The content rule (only sourced quotes) becomes a design feature.

9. **Let the reader set the pace of a text reveal.**
   *Seen in:* Dembélé's word-by-word lighting, Paris's SplitText rise, MWG's scramble.
   *Marginalia:* the HeForShe pull-quote is **typeset word by word as you scroll**, with ink appearing
   rather than letters sliding. The full sentence stays in the DOM, with SplitText's ARIA handling, so
   screen readers hear it once and in full.
   *Won't copy:* scramble or glitch text.

10. **Simplify for mobile by changing the idea.**
    *Seen in:* Lando's "TAP TO LOOK", MWG's swipe carousel, Henrietta's label, Mouthful's automatic
    graphics setting.
    *Marginalia:* the horizontal shelf becomes a **vertical stack of spines** (tap to open), margin notes
    move **inline** as footnotes, the page turn becomes a vertical page lift, and WebGL is skipped.

### Baseline we also take, without exception
- **Accessibility as craft** (Mouthful): a content-note pattern, Skip on every timed sequence, sound
  off by default with a visible toggle.
- **A calm version of the same story** (Boccia's text-only page): our `prefers-reduced-motion` mode.
- **Performance discipline** (Paris, Henrietta, Lando): AVIF/WebP, `loading="lazy"`, explicit sizes
  to avoid layout shift, and SVG for every hand-drawn mark.

### Template traps to check against in Phase 4
- Every section fading up by 40 px with the same ease and the same delay.
- A centred hero plus a three-card grid plus a marquee plus a footer, the "Awwwards starter kit".
- A cursor blob that does nothing a native cursor couldn't.
- A fake progress timer.
- Headlines set in images (bad for accessibility and SEO).
- Identical section rhythm with no change of pace or environment.

---

## Sources

- Lando Norris on Awwwards: https://www.awwwards.com/sites/lando-norris · Annual Awards winners: https://www.awwwards.com/annual-awards/winners
- Trevor Noah on Awwwards: https://www.awwwards.com/sites/trevor-noah
- Ousmane Dembélé on Awwwards: https://www.awwwards.com/sites/ousmane-dembele-ballon-dor · project credits on Contra: https://contra.com/p/YvW2N2cg-httpswwwousmaneballondorfr-ousmane-dembele-from-the-st
- Messenger on Awwwards: https://www.awwwards.com/sites/messenger · gameplay: https://80.lv/articles/deliver-mail-on-tiny-colorful-planet-in-this-relaxing-web-game and https://aftermath.site/messenger-browser-game-abeto
- Paris by Emily on Awwwards: https://www.awwwards.com/sites/paris-by-emily
- Made With GSAP on Awwwards: https://www.awwwards.com/sites/made-with-gsap-1 · effects index: https://madewithgsap.com/effects
- Mouthful of Dust: https://winners.webbyawards.com/2026/websites-and-mobile-sites/general-desktop-mobile-sites/cultural-institutions/361817/mouthful-of-dust · https://good-design.org/projects/mouthful-of-dust/ · https://lab.slv.vic.gov.au/articles/updates-v117
- Gianluca Boccia (CSSDA WOTD): https://www.cssdesignawards.com/sites/gianluca-boccia/50363/
- Henrietta Said (CSSDA WOTD): https://www.cssdesignawards.com/sites/henrietta-said/50359/
- GSAP licence (all plugins, including SplitText and DrawSVG, free for commercial use since 30 Apr 2025): https://gsap.com/licensing/
