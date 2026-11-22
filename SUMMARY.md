# SUMMARY.md: Manifest Coffee Roasters website

A four-page website for a made-up Durban speciality coffee roastery. It's built
around the fact that East African coffee comes ashore at Durban harbour.

## How to run it

There is no build step and nothing to install.

```bash
cd site
python3 -m http.server 8000      # or: npx serve .
# open http://localhost:8000
```

Opening `site/index.html` directly from disk also works. A local server is
only needed to make the font preloads behave exactly as they would in
production. To deploy, upload the `site/` folder to any static host
(Netlify, Cloudflare Pages, GitHub Pages, S3).

| File | Purpose |
|---|---|
| `site/index.html`, `about.html`, `services.html`, `contact.html` | The four pages |
| `site/css/styles.css` | All styles, with colour, spacing and type tokens at the top |
| `site/js/main.js` | Mobile nav, roaster status, stamps, voyage chart, form (about 300 lines, no libraries) |
| `site/fonts/` | Self-hosted fonts and their OFL licences |
| `site/tools/voyage-map.py` | Regenerates the coastline and route path data for the voyage chart |
| `site/screenshots/` | Review screenshots (listed below) |

## The concept: "Port of Entry"

Brand: **Manifest Coffee Roasters**, roasting out of an old bonded warehouse
off Maydon Wharf Road. The design language comes from the harbour: cargo
manifests, kraft shipping tags, customs stamps, stencilled containers and
bills of lading.

- **Palette:** Paper `#F3EADB`, Kraft `#DCC39A`, Harbour Ink `#14202B`,
  Container Rust `#B03A0A`, Crane Yellow `#F4B400`, Customs Blue `#2446A6`,
  Indian Ocean `#0E5E66` / `#0A3D44`.
- **Type:** Big Shoulders Stencil (display), Archivo variable (body, using its
  width axis for labels), Courier Prime (typewritten manifest data). No Inter,
  no Roboto, no purple gradients.
- **Mood:** *bold* (stencil type, hard offset shadows, saturated container
  colours), *warm* (kraft and paper tones, Durban sun yellow), *playful*
  ("Consignee: You (and whoever you're making coffee for)", "Handle with:
  Enthusiasm", "Contents: good news").

`DESIGN.md` describes all three concepts I considered and why this one won.

## Why it doesn't look like a template

1. **Signature 1: the voyage chart.** On the home page, a hand-drawn chart of
   the East African coast stays on screen while you scroll the ship's log. A
   dashed route draws itself, a small container ship sails from Djibouti to
   Mombasa, Dar es Salaam, Beira and Durban, each port lights up as the ship
   passes, and a day counter shows "days at sea". On phones the chart's view
   follows the ship, so the labels stay readable. It explains the roastery's
   supply chain in one scroll.
2. **Signature 2: customs stamps.** Each coffee in the manifest gets a
   rubber stamp ("CLEARED · ZADUR", "LIMITED · 32 bags left", "CUPPED · 88
   points") that presses down with a small bounce and a rough ink texture
   (an SVG turbulence filter with a multiply blend). Sending the contact form
   stamps it "RECEIVED".
3. **The layouts come from the theme, not a template:**
   - The hero is a rotated kraft shipping tag on a string.
   - This week's coffees are a ship's-manifest ledger, not cards.
   - Services are an uneven stack of corrugated shipping containers with
     container codes, locking bars and painted cargo symbols.
   - About has a ruled logbook, "terms & conditions of carriage" in place of
     a values list, and a crew manifest.
   - Contact is a customs declaration form plus a hand-drawn sketch map of
     Durban harbour.
4. **The copy is local:** naartjie, howzit, koki, car guards, Glenwood,
   Florida Road, the Bluff, eThekwini delivery zones, summer humidity
   throwing grinders off, and prices in rand. The header status pill uses
   Durban time ("Drum's hot · roasting till noon" / "Closed · back Tue 7am").

## Accessibility and responsiveness checks

- **Widths:** tested at **375 / 768 / 1440 px** (plus 640, 920 and 1024 for
  breakpoint edges). No horizontal overflow on any page at any width.
- **axe-core 4.10** (WCAG 2.0/2.1 A and AA plus best practice): **0
  violations** on all four pages at 375 and 1440 px.
- **Contrast:** every text and background pair was checked by hand (see the
  table in `DESIGN.md`). Corrugated textures only darken their base colour,
  so text on them never drops below that base colour's contrast ratio.
- **Keyboard:**
  - Every page has a skip link and a visible two-tone focus ring.
  - The mobile menu is a real button with `aria-expanded`. Esc closes it and
    focus returns to the button.
  - The FAQ uses native `<details>`, which works with the keyboard.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, stamps appear
  without animating, and the voyage chart shows the full route with the ship
  already docked in Durban.
- **Screen readers:**
  - The chart is `role="img"` with a text description, and the full voyage
    story is also in the log as plain HTML text.
  - Roast meters have text labels ("Medium roast, 3 of 5").
  - Form errors are linked to their fields with `aria-describedby`, and the
    form's status message is announced through `role="status"`.
- **Without JavaScript:** the navigation stays visible, stamps and the chart
  render statically, and all content is readable.
- **Images:** there are no stock photos. Every illustration is CSS or inline
  SVG. One clearly labelled taped-photo placeholder on About shows where a
  real photo should go.

## Screenshots (`site/screenshots/`)

Full-page captures, taken at device pixel ratio 1:

| Page | 375 px | 768 px | 1440 px |
|---|---|---|---|
| Home | `index-375.jpg` | `index-768.jpg` | `index-1440.jpg` |
| About | `about-375.jpg` | `about-768.jpg` | `about-1440.jpg` |
| Services | `services-375.jpg` | `services-768.jpg` | `services-1440.jpg` |
| Contact | `contact-375.jpg` | `contact-768.jpg` | `contact-1440.jpg` |

Interaction states:

- `state-voyage-midway-1440.jpg` and `state-voyage-midway-375.jpg`: the ship
  partway down the coast.
- `state-manifest-stamps-1440.jpg`: the ledger with stamps applied.
- `state-mobile-menu-375.jpg`: the open mobile menu.
- `state-form-received-1440.jpg`: the form after sending, with its "RECEIVED"
  stamp.

Full-page captures show the voyage chart at its starting position (ship in
Djibouti), because the ship only moves as you scroll.

## Process log (commits)

1. `DESIGN.md` (three concepts) and `DECISIONS.md`.
2. The home page: hero tag, container strip, voyage chart, manifest ledger,
   visit and wholesale split, footer.
3. The About, Services and Contact pages.
4. **Polish pass 1.** Fixes from reviewing screenshots at all three widths:
   - stamps were covering producer names;
   - roast beans read as zeros;
   - the logbook dates didn't render at full size (a CSS specificity bug);
   - containers on Services overlapped;
   - checkboxes stretched to tall boxes;
   - the footer overflowed at 768 px;
   - the coffee ledger was too tall on tablets;
   - text on the corrugated texture fell below AA contrast;
   - two duplicate landmark names were flagged by axe.
5. **Polish pass 2.** Fixes from a second review:
   - the price table became stacked rows on phones;
   - the form legend spacing didn't match the other fields;
   - the stamps on the form and the About photo sat over text;
   - link arrows could wrap onto their own line.

   This pass also added the review screenshots.

## Decisions to review

`DECISIONS.md` has the full list. These matter most:

1. **The brief's placeholders were empty**, so I built your first example: a
   Durban coffee roastery for local coffee drinkers and café owners, with
   the mood "bold, warm, playful". If you meant something else, the system
   (tokens, stamps, tags, containers) carries over to another port-city
   business, but the copy would need rewriting.
2. **Everything about the business is placeholder content:**
   - the name "Manifest";
   - the team's first names and the prices;
   - the address ("Unit 4, The Bond Store", off a real road);
   - the phone number `+27 31 000 0000` and the email at the reserved
     `.example` domain.

   Check the name is free to use in South Africa before launch.
3. **The contact form has no backend.** It validates and shows a success
   stamp, but sends nothing. Connect it to a form service or your own
   endpoint.
4. **The site lives in `site/`** because the repository root holds an
   unrelated quant-finance project. Move it if this repo becomes
   website-only.
5. **The voyage chart is an illustration**, not an accurate map, and its
   caption says so.
