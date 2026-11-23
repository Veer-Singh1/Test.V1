# Marginalia

**An unofficial fan tribute to Emma Watson, designed as an annotated book.**
*Unofficial fan tribute. Not affiliated with Emma Watson or her representatives.*

Six chapters, a cover that opens, page turns between chapters, and a red editor's pen that
annotates the pages as you read. Every fact links to the source it was checked against.

| | |
|---|---|
| Stack | Vite + TypeScript, GSAP (ScrollTrigger, SplitText, Flip, Draggable, Inertia), Lenis |
| Content | `src/content/data.ts` (facts, with a source on every entry) and `src/content/images.ts` (every image) |
| Design | `design/system.md` (tokens, type, grid, motion), `research/` (inspiration and psychology) |
| Lighthouse (mobile, simulated 4G) | Performance 90–91 · Accessibility 100 · Best Practices 100 · SEO 100 |

## Run it

```bash
cd marginalia
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then builds to dist/
npm run preview    # serves dist/ at http://localhost:4173
```

Node 20 or newer. The whole book is pre-rendered into `index.html` at build time from the content
files (see `vite.config.ts`), so it reads without JavaScript. The scripts only add motion.

## Swap the photos

All image paths live in **`src/content/images.ts`**. Credits on the Colophon page are generated from it.

1. Put the original in `assets-src/`. Use Creative Commons or your own photos only, never press or agency photos.
2. Add it to the `jobs` list in `scripts/optimise-images.mjs` (output name and widths).
3. Run `npm run images`. This writes AVIF and WebP files at each width into `public/images/`.
4. Update the entry in `images.ts`: `base`, `width`/`height` (the aspect ratio of the generated files), `alt`, `caption` and `credit`.
5. Remove `placeholder: true` if the entry was a placeholder.

**Two placeholders are waiting:**

- **`uruguay`** (The Voice): the CC BY-SA photo is already chosen and credited. Wikimedia rate-limited
  the download during the build, so the download command is in a comment above the entry.
- **`bookDrop`** (The Reader): an open slot for any CC photo of a book left for a stranger.

## Edit the text

- **Facts, roles, quotes, timeline, book club:** `src/content/data.ts`. Keep a `source` URL on everything you add, and keep quotes short.
- **The reader's handwritten notes:** `notes` in the same file. They're commentary only; facts never go in the handwriting.
- **Chapter titles, epigraphs and page ranges:** `chapters` in the same file.

## Deploy

The site is static: `npm run build` produces `dist/`.

**Vercel:** import the repo, set the *Root Directory* to `marginalia`, and keep the detected Vite preset
(build `npm run build`, output `dist`). Or from the CLI:

```bash
cd marginalia && npx vercel --prod
```

**Netlify:** set *Base directory* `marginalia`, *Build command* `npm run build`, *Publish directory*
`marginalia/dist`. Or drag `dist/` onto app.netlify.com/drop.

To serve from a sub-path such as `/marginalia/`, set `base: '/marginalia/'` in `vite.config.ts`, and
change the absolute `/fonts/` and `/images/` URLs in `src/styles/main.css`, `index.html` and
`src/content/images.ts` to match.

## Accessibility and motion

- **`prefers-reduced-motion`:** you get a designed *calm edition*. Lenis isn't loaded, the page turns
  are removed, marks appear already inked, the quote is shown whole, and the shelf, stack and timeline
  are static. Sound is always off until you switch it on.
- **Semantics:** the content is semantic HTML (landmarks, headings in order, real buttons, dialogs
  with focus handling, a skip link), with alt text on every image and visible focus rings.
- **Contrast:** every text colour pair passes WCAG AA, and most pass AAA (see `design/system.md`).

## Credits

Photographs are credited on the Colophon page. Fonts are Fraunces, Hanken Grotesk and Caveat
(SIL OFL 1.1, self-hosted in `public/fonts/` with their licences). GSAP is used under its standard
no-charge licence, and Lenis under MIT.
