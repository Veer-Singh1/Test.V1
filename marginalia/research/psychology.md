# What makes Marginalia attractive — the psychology behind the decisions

*Written 23 Nov 2026. You asked me to make the final call using research into human psychology.
This file records the findings and what each one decides. The design system
(`design/system.md`) follows from it.*

Each finding is labelled with **how much weight it can bear**. Lab studies of screenshots are not
real browsing, and several marketing findings were tested on physical packaging. Where the evidence
is thin, the design treats it as a nudge, not a rule.

---

## 1. The verdict comes in a blink, and it rewards "simple and familiar"

- Visitors judge a page's visual appeal within **50 ms**, and those split-second judgments match the
  ones they make after looking longer (Lindgaard et al., 2006, *Behaviour & IT* 25(2)). *Strong,
  widely replicated.*
- At first glance, pages with **low visual complexity and high prototypicality** (they look like what
  they are) are liked best. Complexity registers within 17 ms, and prototypicality catches up by
  about 1 s (Tuch et al., 2012, *IJHCS* 70(11)). *Strong (lab screenshots).*
- Tolerance for complexity and colour varies by group, so there is no universal optimum (Reinecke &
  Gajos, 2014, CHI). *Strong, large sample.*

**Decision:**
- **The first screen is one object, a closed book cover**: cream paper, one name, one red mark. It
  is about as prototypical as an image gets.
- **The palette stays at three colours** (paper, ink, editor's red). No gradients, no glass, no
  floating UI on the first screen.
- **Complexity comes in later chapters, after the visitor has already decided to like the site.**

## 2. Familiar first, then a surprise: the MAYA balance

- People prefer **novel designs as long as the novelty doesn't damage typicality**. Novelty and
  typicality each help, but they suppress each other (Hekkert, Snelders & van Wieringen, 2003,
  *British Journal of Psychology* 94). This is Raymond Loewy's "Most Advanced Yet Acceptable".
  *Moderate (product design; later studies refine the boundary conditions).*

**Decision:**
- **The book metaphor is the "acceptable" half.** Chapter numbers, running heads, folios, footnotes,
  a contents page: everyone knows how a book works, so the site needs no instructions.
- **The "advanced" half is what a printed book can't do.** Margin notes ink themselves, a quote is
  typeset at your reading pace, and pages turn.
- **We never break the metaphor for an effect.** There are no 3D planets, no glitch text and no
  neon. Every surprise is something a book could plausibly do if it were alive.

## 3. Easy to process feels beautiful (and trustworthy)

- **Processing fluency**: the easier something is to perceive, the more pleasing it feels. Contrast,
  symmetry, repetition and prototypicality all help (Reber, Schwarz & Winkielman, 2004, *PSPR* 8(4)).
  *Strong, foundational theory.*
- **Beauty is read as usability.** Interfaces that look good are judged easier to use, before and
  after real use (Kurosu & Kashimura, 1995; Tractinsky, Katz & Ikar, 2000, *Interacting with
  Computers* 13(2)). *Moderate to strong.*
- **Reading line length**: about **55 characters per line** gave better comprehension than about 100
  on screen (Dyson & Haselgrove, 2001, *IJHCS* 54). *Moderate (results vary by task).*

**Decision:**
- **Body text runs 18–21 px, line-height 1.55, with a measure capped at 60ch** (aiming for 55–65
  characters).
- **All type meets WCAG AA contrast or better.** The ink on paper is about 15:1.
- **One display family (Fraunces) uses its optical-size axis** to stay crisp from 14 px to 200 px, so
  there are fewer families to switch between, which is more fluent.
- **Motion clarifies; it never decorates body copy.** Paragraphs fade in once and are never animated
  while you read them.

## 4. Handwriting says "a person was here"

- **Handwritten typefaces create a sense of human presence**, which builds emotional attachment and
  more favourable evaluations, with measurably higher sales of hedonic products (Schroll, Schnurr &
  Grewal, 2018, *Journal of Consumer Research* 45(3)). The effect **reverses for functional
  products** and weakens for brands people already love. *Moderate (tested on packaging, not
  websites).*
- The nine award sites from Phase 1 all leave a human trace: signatures, pen lines, brush script,
  hand-lettering.

**Decision:**
- **Handwriting is the "reader's voice"** (comments, circles, arrows), because a fan tribute is
  hedonic, not functional.
- **Handwriting is never used for facts, navigation or buttons.** That's where it would reverse, and
  where legibility matters most.
- **We pick a legible hand (Caveat), not a cursive script**, to protect fluency. Notes stay short:
  three to eight words.

## 5. Curves feel safer than corners

- People **like curved objects more than sharp-angled ones**, even at brief exposures. One proposed
  reason is that sharp angles signal threat (Bar & Neta, 2006, *Psychological Science* 17(8)).
  *Moderate (replicated with caveats).*

**Decision:**
- **Annotations are curves**: loose ellipses around words, swooping underlines, curved arrows.
- **UI chips and buttons use soft 999 px radii.**
- **The paper itself stays square-cornered, because books are.** The curves belong to the hand,
  which is exactly the contrast we want.

## 6. Curiosity needs a visible gap

- **Curiosity is the felt gap between what you know and what you want to know**, and it needs a
  little prior knowledge to start (Loewenstein, 1994, *Psychological Bulletin* 116(1)). *Strong,
  foundational.*

**Decision:**
- **Margin notes are teasers that open gaps** ("she was nine →", "read this twice"), always placed
  before the content that answers them.
- **Each chapter opens on its chapter number and a one-line epigraph**, a question the chapter
  answers.
- **On the shelf, each spine shows only a title and year.** Pulling a spine out answers the question.

## 7. Stories transport people, and transported people care

- **Narrative transportation**: when attention is absorbed by a story, its persuasive and emotional
  effect grows, and literary text transports more than functional prose (Green & Brock, 2000, *JPSP*
  79(5)). *Moderate (some manipulations failed; the correlation is robust).*

**Decision:**
- **The site is one continuous book with chapters, not a stack of "sections".**
- **Running headers and page turns keep the reader inside the frame.**
- **Copy is written in short literary sentences, not marketing bullets.**

## 8. Progress you can see pulls you forward

- The **goal-gradient effect**: people speed up as a goal gets closer, and **perceived** progress
  counts as much as real progress (Kivetz, Urminsky & Zheng, 2006, *Journal of Marketing Research*
  43). *Strong field evidence.*
- The **endowed progress effect**: a head start increases completion (Nunes & Drèze, 2006, *Journal
  of Consumer Research* 32(4)). *Strong field evidence.*
- People's sense of how long a wait lasts depends on how a progress bar moves (Harrison et al., 2007,
  UIST). *Moderate.*

**Decision:**
- **A "p. 12 of 96" folio is always visible.**
- **Folio counting starts at the title page (p. 5), not p. 1**, so the reader begins with honest
  endowed progress, the way real books number their front matter.
- **The loader counts real loading (fonts and the hero image).** It is never a fake timer, and it is
  skipped entirely when assets are cached.

## 9. People remember the peak and the end

- Overall judgments of an experience track its **most intense moment and its final moment** far more
  than its length (Fredrickson & Kahneman, 1993; Kahneman et al., 1993). A 2022 meta-analysis
  supports the rule, but the average of the whole experience predicts nearly as well. *Strong, with
  nuance.*

**Decision:**
- **We design one clear peak**: The Voice. The HeForShe quote is typeset word by word on an
  ink-reversed page, the one dark spread in the book.
- **We design a real ending**: the Epilogue's "The End" sets itself in type and the pen signs off.
- **The rest of the experience stays calm and pleasant**, because the average still matters.

## 10. Attention is front-loaded, so the opening must carry the story

- **57%** of page viewing time goes to the first screenful and **17%** to the second (Nielsen Norman
  Group, 2018, "Scrolling and Attention"). *Strong (large eye-tracking dataset).*
- **Faces draw the eye, and gaze direction steers it** (eye-tracking studies on web pages and ads).
  *Moderate.*

**Decision:**
- **The cover is brief.** It opens within about 1.2 s of first paint, and the Prologue (name plus
  portrait) is the first full screen.
- **The portrait sits beside the name**, with the subject's gaze or body angled towards the text
  where the chosen photograph allows.

## 11. Don't hijack the scroll, and don't hide content sideways

- **Scrolljacking** caused disorientation in every NN/g test participant on the worst example. It
  hurts most when people need to read while the scroll rate is altered. It is tolerated best when it
  reveals information progressively in a few steps (NN/g, "Scrolljacking 101"). *Strong.*
- **People don't expect horizontal scrolling**, and even obvious cues get missed (NN/g, "Horizontal
  Scrolling"). *Strong.*

**Decision:**
- **Lenis smooths the scroll but never changes its rate or direction.** We use a gentle `lerp`,
  native wheel behaviour, and no snapping.
- **The Roles shelf is the one horizontal moment.** It is pinned and driven by vertical scroll (you
  keep scrolling down), with spines peeking past the edge as the affordance, keyboard arrows, and
  a "Film index" list beneath it as a second path.
- **On mobile the shelf becomes vertical.**

## 12. Motion can make people unwell

- About **35% of US adults over 40** showed vestibular dysfunction in national survey data (Agrawal et
  al., 2009, *Archives of Internal Medicine*). That is a balance-test measure, not a count of people
  made unwell by animation, but it shows the population at risk is large. *Strong epidemiology.*

**Decision:**
- **`prefers-reduced-motion` gets a fully designed calm mode, not a disabled one.**
  - Page turns become 200 ms cross-fades.
  - Margin notes appear already inked.
  - Skew, parallax and the cursor trail are off.
  - The HeForShe quote is shown whole.
  - Lenis is not loaded at all.
- **Sound is off by default.**

---

## The resulting direction in one paragraph

**A quiet, literate, unmistakably human book.** The first screen is a simple cover, for a fluent,
prototypical first impression. It opens into chapters a reader already knows how to navigate
(familiar), where a red editor's pen annotates the pages as you read (novel, human, curved,
curiosity-making). There is one intense peak, the HeForShe speech set on a dark page, and one
satisfying ending. A visible folio pulls you through. Nothing hijacks your scroll, nothing makes you
dizzy, and nothing is hard to read.

## Sources

- Lindgaard, Fernandes, Dudek & Brown (2006). *Behaviour & Information Technology* 25(2), 115–126. https://doi.org/10.1080/01449290500330448
- Tuch, Presslaber, Stöcklin, Opwis & Bargas-Avila (2012). *IJHCS* 70(11), 794–811. https://research.google/pubs/pub38315/
- Reinecke & Gajos (2014). Quantifying Visual Preferences Around the World. CHI '14. https://kgajos.seas.harvard.edu/papers/reinecke14visual.pdf
- Hekkert, Snelders & van Wieringen (2003). *British Journal of Psychology* 94, 111–124. https://research.vu.nl/en/publications/most-advanced-yet-acceptable-typicality-and-novelty-as-joint-pred/
- Reber, Schwarz & Winkielman (2004). *PSPR* 8(4), 364–382. https://pages.ucsd.edu/~pwinkielman/reber-schwarz-winkielman-beauty-PSPR-2004.pdf
- Tractinsky, Katz & Ikar (2000). *Interacting with Computers* 13(2), 127–145. https://academic.oup.com/iwc/article-abstract/13/2/127/898608
- Dyson & Haselgrove (2001). *IJHCS* 54, 585–612 (summarised in https://ialab.it.monash.edu/~mwybrow/papers/braganza-www-2009.pdf)
- Schroll, Schnurr & Grewal (2018). Humanizing Products with Handwritten Typefaces. *JCR* 45(3), 648–672. https://news.osu.edu/handwriting-the-foodie-font-of-love/
- Bar & Neta (2006). *Psychological Science* 17(8), 645–648. https://pubmed.ncbi.nlm.nih.gov/16913943/
- Loewenstein (1994). *Psychological Bulletin* 116(1), 75–98. https://www.cmu.edu/dietrich/sds/docs/golman/golman_loewenstein_curiosity.pdf
- Green & Brock (2000). *JPSP* 79(5), 701–721.
- Kivetz, Urminsky & Zheng (2006). *JMR* 43, 39–58. https://business.columbia.edu/sites/default/files-efs/pubfiles/1200/goalgradient.pdf
- Nunes & Drèze (2006). *JCR* 32(4), 504–512. https://ideas.repec.org/a/oup/jconrs/v32y2006i4p504-512.html
- Harrison, Amento, Kuznetsov & Bell (2007). Rethinking the Progress Bar. UIST '07. https://www.chrisharrison.net/index.php/Research/ProgressBars
- Fredrickson & Kahneman (1993). *JPSP* 65(1). https://bear.warrington.ufl.edu/brenner/mar7588/Papers/fredr-kahneman-jpsp1993.pdf
- Nielsen Norman Group (2018). Scrolling and Attention. https://www.nngroup.com/articles/scrolling-and-attention/
- Nielsen Norman Group. Scrolljacking 101. https://www.nngroup.com/articles/scrolljacking-101/
- Nielsen Norman Group. Horizontal Scrolling. https://www.nngroup.com/articles/horizontal-scrolling/
- Agrawal, Carey, Della Santina, Schubert & Minor (2009). *Archives of Internal Medicine* 169(10). https://pubmed.ncbi.nlm.nih.gov/19468085
