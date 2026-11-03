# Veer Singh: Personal Website

A single-page, dark-mode personal site built with **HTML5, Tailwind CSS (CDN) and vanilla JavaScript**. There is no build step.

```
veer-singh-site/
├── index.html            # the whole site: markup, styles, scripts (all commented)
└── assets/
    └── emma-watson.jpg   # Hall of Fame portrait
```

## How to view it

**Option 1: just open it.** Double-click `index.html`, or drag it into Chrome, Edge, Firefox or Safari. You need an internet connection because Tailwind and the Google Fonts load from a CDN.

**Option 2: run a local server** (recommended while editing):

```bash
cd veer-singh-site
python -m http.server 8000
# then open http://localhost:8000
```

Or in VS Code, install the **Live Server** extension, right-click `index.html`, and choose *Open with Live Server*.

**Option 3: put it online for free.** In GitHub, go to *Settings → Pages*, set the source to this branch, and the site will be served at
`https://<username>.github.io/<repo>/veer-singh-site/`.

## Sections

1. **Hero**: glowing "VS" monogram, slam-in title, typewriter tagline, spark particles and punch-trail streaks.
2. **About**: Brains & Brawn bio with 3D-tilt cards.
3. **Hall of Fame**: Mike Tyson & MMA tribute poster, plus the Emma Watson portrait and quote.
4. **Stats**: animated count-up numbers.
5. **Skills & Ambitions**: animated skill bars and a "Road Ahead" timeline.
6. **Connect**: a 10-second *Punch Meter* mini-game (best score is saved in the browser) and a contact form.

## Scroll animations

| # | Effect | Where |
|---|--------|-------|
| 1 | Gold/crimson scroll-progress bar | top of the page |
| 2 | Navbar shrinks and blurs; active link underlines | navigation |
| 3 | Parallax background layers and monogram | hero |
| 4 | Two marquee rows that slide in opposite directions as you scroll | below the hero |
| 5 | Fade-up, slide-left/right, zoom-blur and 3D flip reveals with stagger | every section |
| 6 | Curtain-wipe (clip-path) reveal | quotes and the Emma Watson photo |
| 7 | Slow zoom-out of the portrait while it crosses the screen | Emma Watson photo |
| 8 | Heading underlines that draw in | every section title |
| 9 | Counters that count up | stats |
| 10 | Skill bars that fill | skills |
| 11 | Timeline line that grows with scroll and lights each milestone | ambitions |

All motion is turned off automatically for visitors who set **"reduce motion"** in their OS settings.

## Customising

Things to personalise (the stats and skill bars are marked **`EDIT ME`** in `index.html`):

- **Stats**: change the `data-target="…"` numbers.
- **Skill bars**: change the `data-w="…"` percentages and the matching labels.
- **Typewriter words**: edit the `words` array in the `typewriter()` script.
- **Colours**: edit `tailwind.config` near the top (`gold`, `crimson`, …).

### Making the contact form send real email

Right now the form only checks the fields and shows a confirmation. To receive messages, create a free form at [formspree.io](https://formspree.io), then:

1. Add `action="https://formspree.io/f/YOUR_ID" method="POST"` to the `<form id="contact-form">` tag.
2. Delete `e.preventDefault();` and `form.reset();` in the contact-form script so the browser submits it.

## Image note

`assets/emma-watson.jpg` is a **Getty Images press photo** that still has its watermark. It's fine for a private or personal page, but before publishing the site publicly, swap it for a properly licensed image, for example one from [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Emma_Watson) with the attribution it asks for. Keep the same filename and nothing else needs to change.
