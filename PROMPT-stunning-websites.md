# Prompt: award-level motion websites for any subject

Copy everything inside the box, fill in the five lines under **MY BRIEF**, and paste it to Claude.
Leave a line blank and Claude will choose for you.

```
You are a creative director and senior creative developer at a studio that wins Awwwards Site of the Day. Design and build a single-page website that feels cinematic, editorial and unlike any template.

MY BRIEF
- Subject: [who or what the site is about]
- Purpose and audience: [e.g. fan tribute for friends, portfolio for recruiters, launch page for customers]
- Mood in three words: [e.g. bold, playful, luxurious]
- Must include: [sections, facts, links, a form, anything required]
- Images I have: [describe them, or "none: leave labelled placeholders"]

STEP 1: THE CONCEPT (write this before any code, under 200 words)
- One big idea that turns the content into a story, e.g. "a life in chapters", "a night at the museum", "a field journal". Give it a name.
- Break the page into 4–6 chapters. For each, give: its job, its colour palette, its type treatment and its motion personality (e.g. slow and filmic, assertive, playful, hushed).
- One signature moment a visitor will remember and tell someone about.
- Palette: name each colour and its role. Every text/background pair must pass WCAG contrast: body text at least 7:1, small or accent text at least 4.5:1.
- Typography: a characterful display face paired with a clean body face, both from Google Fonts, chosen for this subject (avoid Inter, Roboto, Poppins, Montserrat, Space Grotesk). Set a type scale and stick to it.

STEP 2: BUILD IT
Use as many of these as serve the concept, never all of them just because they exist:
- A preloader (count-up, curtain or shape) that hands over into the hero instead of simply fading away.
- Smooth scrolling with Lenis, and GSAP ScrollTrigger driving the scroll motion.
- A hero with real presence: oversized kinetic type that splits into letters, plus either a WebGL effect (Three.js shader ripple or distortion that follows the cursor) or a full-bleed image reveal.
- Scroll-scrubbed motion, so scrolling back up rewinds everything.
- At least one pinned scene that tells a story as you scroll (colours, images and text change in sequence).
- A horizontal-scroll gallery with clip-path reveals, tilt and parallax inside each frame.
- Transitions between chapters: clip-path or SVG wipes, a different wipe per chapter, and the whole page re-theming its colours as each chapter arrives.
- Marquee text bands whose speed and skew react to scroll velocity.
- Desktop extras: a custom cursor that morphs ("View" over images, a magnetic dot over buttons), magnetic buttons, a hover text-scramble, and an image trail that spawns photos along the mouse path.
- A fullscreen menu with staggered link reveals, and the current chapter name shown in the header.
- Texture: a subtle film-grain overlay and soft glows.

STEP 3: CRAFT AND QUALITY RULES
- One self-contained HTML file. Load libraries only from cdnjs.cloudflare.com or cdn.jsdelivr.net, pinned to exact versions (e.g. GSAP 3.12.5, Lenis 1.1.13, Three.js r128).
- A CONFIG block at the top of the file for colours, fonts, text and image paths, with comments, so I can change things without touching the code.
- Images: use only files I own or have licensed. Where I have none, draw labelled placeholders that name the CONFIG slot to fill. Remote image URLs may be blocked, so reference local files like images/hero.jpg. Give every image a short, accurate alt text.
- Mobile-first and fully responsive: no sideways scrolling at 390px wide, a 16px side gutter, touch-friendly fallbacks for every cursor effect, and readable type at every size.
- Accessible: semantic HTML, a skip link, a keyboard-friendly menu (focus moves in, Tab stays inside, Escape closes), visible focus states, and split text that screen readers still read as whole sentences.
- Respect prefers-reduced-motion: turn off smooth scroll, pinning and the preloader, and show every section as a complete, static, still-beautiful page.
- Aim for 60fps: animate only transform, opacity, clip-path and filter; pause WebGL when it is off screen; lazy-load images.
- Content: only use facts you are confident about, and never invent quotes. If a fact or quote is uncertain, leave it out and tell me.
- If the site is about a real person or brand, label it clearly as unofficial and add a no-affiliation note.

STEP 4: CHECK BEFORE YOU HAND IT OVER
Render it at desktop and phone width and with reduced motion. Confirm there are no console errors, no sideways scrolling, no clipped or unreadable text, and that scrolling down and back up works smoothly. Fix what you find.

STEP 5: DELIVER
1. The concept from Step 1.
2. The complete, commented file.
3. How to view it and how to swap in my images.
4. Five ideas to push it even further.
```

## Tips

- **Be specific about mood.** "Warm, literary, a little magical" gives a far better result than "nice".
- **Name a reference** you love, such as a website, a film or a magazine. Claude will borrow its feel without copying it.
- **Ask for options.** Adding "show me three palettes and three font pairings as a live switcher" lets you compare looks on the real page before choosing.
- **Iterate in small steps** once it's built: "more motion in the hero", "make the colours more vivid", "slow the transitions down".
