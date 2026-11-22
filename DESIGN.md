# DESIGN.md — Manifest Coffee Roasters (Durban)

> Brief: a one-of-a-kind website for a **Durban speciality coffee roastery**.
> Audience: Durban coffee drinkers (Glenwood to Umhlanga), home brewers, and café
> and restaurant owners looking for a wholesale roaster.
> Mood: **bold, warm, playful**.
> Pages: Home, About, Services, Contact.
> (These were placeholders in the brief. See `DECISIONS.md` for why I chose them.)

The client is a made-up roastery called **Manifest**. It works out of an old
bonded warehouse near Durban harbour and roasts East African coffee that arrives
by sea. Each concept below tells that story in a different way.

---

## Concept A: "Tide Report"

The site works like a Durban surf report, with conditions, swell and tides,
applied to coffee.

| | |
|---|---|
| **Palette** | Deep Water `#0B3A4A` · Sea-glass `#8FD3C4` · Sun-bleached Sand `#F6EBD9` · Hibiscus `#E0442E` · Sunscreen `#FFC93C` · Zinc Cream `#FFF8EC` |
| **Fonts** | **Bricolage Grotesque** (display, uses its condensed optical sizes) + **Martian Mono** (readings and data) |
| **Layout** | The page scrolls as a single long report. A "conditions" strip gives roast level, batch number and wind (fan speed, as a joke). The roast calendar is drawn as an SVG tide chart. Each coffee is a "surf break" with a star rating and a swell graph of how its flavour develops. Bands change height like a swell plot. |
| **Signature** | **The type surfs.** Each letter of the hero headline sits on a sine wave, and the wave's phase follows scroll. A wave line also rises up the viewport as you scroll, like the tide coming in. |

**Strengths:** very Durban, warm and joyful. **Weaknesses:** lots of cafés already
use surf themes, and moving letters hurt readability and are a motion-sickness
risk.

## Concept B: "Port of Entry" ✅ chosen

Durban is Africa's busiest container port, and coffee from Ethiopia, Kenya,
Tanzania and Rwanda arrives through it. The site borrows the look of a port:
cargo manifests, shipping tags, customs stamps, stencilled containers and
bills of lading.

| | |
|---|---|
| **Palette** | Paper `#F3EADB` · Sand `#E8DCC4` · Kraft `#DCC39A` · Harbour Ink `#14202B` · Container Rust `#B03A0A` · Crane Yellow `#F4B400` · Customs Blue `#2446A6` · Indian Ocean `#0E5E66` / Deep Ocean `#0A3D44` |
| **Fonts** | **Big Shoulders Stencil Display** (display only, 32px and up) + **Archivo** variable (body; its width axis gives condensed labels and wide eyebrows) + **Courier Prime** (typewritten manifest data, form fields, stamps) |
| **Layout** | No standard hero with three cards. The hero is a large kraft **shipping tag** with joke consignment fields (consignee, contents, port of discharge `ZADUR`, "handle with: enthusiasm"). The coffee list is a **ship's manifest ledger**, not cards. The Services page is an **asymmetric stack of shipping containers** of different widths and colours with CSS-drawn corrugation. Contact is a **customs declaration form**. The grid deliberately breaks in places, with tags and stamps rotated a few degrees. |
| **Signature 1** | **The voyage.** A drawn chart of the East African coast stays on screen as you scroll. A dashed route draws itself from Djibouti to Mombasa, Dar es Salaam and Beira, ending in Durban. A small ship moves along it in step with your scroll, and each port lights up and shows its log entry as the ship passes. |
| **Signature 2** | **Customs stamps.** As each lot in the manifest scrolls into view, a rubber stamp ("CLEARED · ZADUR", "LIMITED", "CUPPED 88") presses down with a small overshoot and a rough ink edge from an SVG turbulence filter. When the contact form is sent, it gets a "RECEIVED" stamp. |

**Strengths:** the theme is based on something true and specific to this city.
It explains provenance and freshness ("roasted within ten days of the container
doors opening") instead of only decorating, and it gives the copy a playful
vocabulary (berths, cargo, declarations, cleared). **Weaknesses:** it could
feel cold and industrial. The warm kraft and paper tones, crane yellow,
slightly tilted tags and cheeky copy are there to prevent that.

## Concept C: "Sign-writer's Saturday"

Based on South African hand-painted shop signage: barbershop boards, spaza shop
walls and fruit-stall price boards.

| | |
|---|---|
| **Palette** | Whitewash `#FBF6EC` · Spaza Turquoise `#138A8A` · Chilli `#C8102E` · Mango `#FFA62B` · Pine `#123B2C` · Charcoal `#1E1E1E` |
| **Fonts** | **Shrikhand** (fat italic display) + **Bitter** (slab body) |
| **Layout** | Every section is a painted panel nailed to a wall. Panels have hard offset shadows, menus are chalk price boards, and blocks hang at slightly uneven angles as if a person put them up. |
| **Signature** | Headings are **painted in** by an SVG brush-stroke mask as they enter the viewport, and buttons get a short paint drip on hover. |

**Strengths:** loud, joyful and very local. **Weaknesses:** sign-writing is
made by hand, and imitating it with a font and a mask tends to look like a
copy. Brush-reveal headings are also a common effect.

---

## Why B wins

1. **It's true.** The theme comes from a real fact about Durban, so every
   device explains something about the coffee, such as where it came from or
   how fresh it is.
2. **It has its own layout.** Manifests, tags, containers and forms suggest
   page structures that look nothing like a template, so the layout isn't
   generic.
3. **The signatures carry meaning.** The voyage map is the supply chain
   explained in one scroll, and the stamps say "this lot is real, cupped and
   in stock". Neither is a gimmick added on top.
4. **It can be bold, warm and playful at once.** The stencil type is bold, the
   kraft paper and Durban sun colours are warm, and the copy and stamps are
   playful.

---

## System details (Concept B)

### Colour roles (all text pairs checked for WCAG AA)

| Token | Hex | Use | Checked pairs |
|---|---|---|---|
| `--paper` | `#F3EADB` | page background | Ink on paper 13.9:1 |
| `--sand` | `#E8DCC4` | alternate bands | Ink 12.2:1, Blue 6.2:1 |
| `--kraft` | `#DCC39A` | shipping tags | Ink 9.7:1, muted 5.3:1 |
| `--ink` | `#14202B` | text, outlines | Paper on ink 13.9:1 |
| `--muted` | `#4F4840` | secondary text | on paper 7.5:1 |
| `--rust` | `#B03A0A` | containers, CTAs, links | Paper on rust 5.1:1 |
| `--crane` | `#F4B400` | highlights, focus ring | Ink on crane 9.0:1 |
| `--stamp` | `#2446A6` | customs stamps, links | on paper 7.0:1 |
| `--sea` / `--sea-deep` | `#0E5E66` / `#0A3D44` | voyage chart, dark bands | Paper on deep 10.0:1, crane on deep 6.5:1 |

Rust on kraft (3.6:1) and crane on rust (3.3:1) only pass for large text, so
those pairs are used only for display type 32px and above.

### Type scale

The scale is fluid via `clamp()` and steps up by roughly 1.25 on mobile and 1.333 on desktop.
- Display (stencil): `clamp(3.2rem, 11vw, 10rem)`, uppercase, line-height 0.85.
- H2 (stencil): `clamp(2.4rem, 6vw, 5rem)`.
- Body: Archivo 1.0625rem, line-height 1.6, measure about 62ch.
- Labels: Archivo at `font-stretch: 112%`, 0.75rem, uppercase, letter-spacing 0.12em.
- Data: Courier Prime 0.95rem.

### Motion principles
- Motion is tied to things that physically happen in the story, like a ship
  moving or a stamp landing. Nothing loops just to decorate.
- The only animated properties are transform and opacity, so the browser
  doesn't have to recalculate layout. The scroll handler is throttled to one
  update per animation frame and only runs while its section is near the
  viewport.
- `prefers-reduced-motion: reduce` turns off stamp animations (stamps simply
  appear), shows the voyage route fully drawn with the ship already docked in
  Durban, and turns off smooth scrolling.

### Accessibility plan
- Skip link, landmarks, one `h1` per page, and logical heading order.
- A visible 3px crane-yellow and ink focus ring on every interactive element.
- The mobile menu is a real `<button>` with `aria-expanded`. Esc closes it and
  focus goes back to the button.
- The voyage chart is `role="img"` with a text description, and the port log
  is real HTML text, so screen readers get the full story without the
  animation.
- Decorative SVG is `aria-hidden`. There are no stock photos; illustrations
  are CSS or SVG with labels where they carry meaning.
- Form fields have visible `<label>`s, required fields are marked in text,
  errors appear inline with `aria-describedby`, and success is announced
  through `aria-live`.
