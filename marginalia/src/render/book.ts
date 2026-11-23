/**
 * Renders the whole book as static, semantic HTML from content/data.ts and content/images.ts.
 * Runs at build time (and in dev) via the Vite plugin in vite.config.ts, so the page is
 * readable, indexable and fast before any JavaScript runs. main.ts only enhances it.
 */
import {
  chapters,
  filmsByYear,
  milestones,
  notes,
  prologue,
  reader,
  shelf,
  site,
  voice,
  typefaces,
  libraries,
  type Chapter,
} from '../content/data';
import { images, type Photo } from '../content/images';
import { flourishPath, mark, note } from './ink';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ch = (id: string) => chapters.find((c) => c.id === id) as Chapter;

/* ---------- pieces ---------- */

function picture(p: Photo, opts: { sizes: string; eager?: boolean; className?: string } ): string {
  if (p.placeholder) {
    return `<figure class="photo photo--placeholder ${opts.className ?? ''}" style="--ar:${p.width}/${p.height}">
      <div class="photo__frame" role="img" aria-label="${esc(/^placeholder/i.test(p.alt) ? p.alt : `Photo placeholder for: ${p.alt}`)}"><span class="photo__ph-label">${esc(p.placeholderLabel ?? 'PHOTO PLACEHOLDER')}</span></div>
      <figcaption class="caption">${esc(/^placeholder/i.test(p.caption) ? p.caption : `Photo placeholder. ${p.caption}`)}</figcaption></figure>`;
  }
  const srcset = (ext: string) => p.widths.map((w) => `${p.base}-${w}.${ext} ${w}w`).join(', ');
  const fallback = `${p.base}-${p.widths[Math.min(1, p.widths.length - 1)]}.webp`;
  const credit = p.credit ? ` <span class="caption__credit">Photo: ${esc(p.credit.author)}, <a href="${p.credit.licenseUrl}" rel="license noopener" target="_blank">${esc(p.credit.license)}</a></span>` : '';
  return `<figure class="photo ${opts.className ?? ''}" style="--ar:${p.width}/${p.height}">
    <div class="photo__frame" data-distort>
      <picture>
        <source type="image/avif" srcset="${srcset('avif')}" sizes="${opts.sizes}">
        <source type="image/webp" srcset="${srcset('webp')}" sizes="${opts.sizes}">
        <img class="photo__img skew" src="${fallback}" width="${p.width}" height="${p.height}" alt="${esc(p.alt)}" ${opts.eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async">
      </picture>
    </div>
    <figcaption class="caption">${esc(p.caption)}${credit}</figcaption>
  </figure>`;
}

function fn(id: string, n: number): string {
  return `<sup class="fn"><a href="#fn-${id}" id="fnref-${id}">${n}</a></sup>`;
}

/** Chapter opener inside a page-turn stage. The leaf shows the end of the previous chapter. */
function opener(c: Chapter, prev?: Chapter): string {
  const leaf = prev
    ? `<div class="leaf" aria-hidden="true" data-leaf>
        <div class="leaf__face leaf__front paper--${prev.paper}">
          <p class="leaf__end">End of ${esc(prev.title)}</p>
          <p class="leaf__folio">${prev.pages[1]}</p>
          <p class="leaf__hint">turn the page ↓</p>
        </div>
        <div class="leaf__face leaf__back"><p class="leaf__folio leaf__folio--verso">${prev.pages[1] + 1}</p></div>
        <div class="leaf__shade"></div>
      </div>`
    : '';
  return `<div class="turn${prev ? '' : ' turn--first'}" data-turn>
    <div class="turn__stage">
      <header class="opener">
        <p class="opener__numeral" aria-hidden="true">${c.numeral}</p>
        <p class="label opener__label">Chapter ${c.numeral}</p>
        <h2 class="opener__title" id="${c.id}-title">${esc(c.title)}</h2>
        <p class="opener__epigraph">${esc(c.epigraph)}</p>
        <p class="opener__folio">p. ${c.pages[0]}</p>
      </header>
      ${leaf}
    </div>
  </div>`;
}

function chapterAttrs(c: Chapter, extra = ''): string {
  return `id="${c.id}" class="chapter chapter--${c.id} paper--${c.paper} ${extra}" data-chapter data-title="${esc(c.title)}" data-pages="${c.pages[0]},${c.pages[1]}" aria-labelledby="${c.id}-title"`;
}

/* ---------- cover ---------- */

function cover(): string {
  return `<div class="cover" data-cover>
    <div class="cover__desk">
      <div class="cover__book" data-cover-book>
        <div class="cover__board">
          <p class="cover__series label">A reader’s edition</p>
          <p class="cover__title">${esc(site.title)}</p>
          <p class="cover__sub">${esc(site.subtitle)}</p>
          <span class="cover__ribbon" aria-hidden="true"></span>
          <p class="cover__disclaimer">${esc(site.disclaimer)}</p>
        </div>
        <div class="cover__inside" aria-hidden="true"></div>
      </div>
    </div>
    <div class="cover__count">
      <p class="cover__pages" aria-hidden="true"><span data-cover-count>0</span><span class="cover__of">/ 100</span></p>
      <p class="cover__status label" role="status" data-cover-status>Binding pages…</p>
      <button class="cover__open magnetic" type="button" data-cover-open>Open the book</button>
    </div>
  </div>`;
}

/* ---------- I. Prologue ---------- */

function prologueChapter(): string {
  const c = ch('prologue');
  const lead = esc(prologue.lead)
    .replace('back to the books', `back to the ${mark('books', 'underline', 9)}`);
  return `<section ${chapterAttrs(c)}>
    <div class="prologue page">
      <p class="label prologue__label"><span class="prologue__numeral">${c.numeral}</span> ${esc(c.title)} <span class="prologue__folio">p. ${c.pages[0]}</span></p>
      <h1 class="display-name" id="prologue-title" data-name aria-label="${prologue.firstName} ${prologue.lastName}">
        <span class="display-name__first" aria-hidden="true">${prologue.firstName}</span>
        <em class="display-name__last" aria-hidden="true">${prologue.lastName}</em>
      </h1>
      <div class="prologue__portrait" data-mask>${picture(images.portrait, { sizes: '(min-width: 1024px) 34vw, (min-width: 768px) 44vw, 92vw', eager: true })}</div>
      <div class="prologue__text prose">
        <p class="lead">${lead}${fn('prologue', 1)}</p>
        ${prologue.body.map((p) => `<p>${esc(p).replace('just a reader', `just a ${mark('reader', 'circle', 3)}`)}</p>`).join('')}
      </div>
      ${note(notes.prologue, { stroke: 'arrow', tilt: -4, className: 'note--prologue', seed: 12 })}
      <ol class="footnotes footnotes--inline"><li id="fn-prologue"><a href="${prologue.source}" target="_blank" rel="noopener">Wikipedia, “Emma Watson”</a>: birth, first audition, Brown University, Our Shared Shelf, Books on the Underground.</li></ol>
    </div>
  </section>`;
}

/* ---------- II. The Roles ---------- */

const spineTones = ['ink', 'red', 'edge', 'aged', 'paper', 'ink', 'edge', 'red-soft'];

function rolesChapter(): string {
  const c = ch('roles');
  const prev = ch('prologue');
  const spines = filmsByYear
    .map((film, i) => {
      // deterministic variety in height/width/tone
      const h = 64 + ((i * 37) % 26); // 64–89 %
      const w = 46 + ((i * 53) % 30); // 46–75 px
      const tone = spineTones[(i * 5) % spineTones.length];
      return `<li class="shelf__item"><button class="spine spine--${tone}" type="button" data-spine="${i}" aria-haspopup="dialog" aria-label="${esc(film.title)}, ${film.year}. Open details." style="--h:${h}%;--w:${w}px">
        <span class="spine__band" aria-hidden="true"></span>
        <span class="spine__title" aria-hidden="true">${esc(film.title)}</span>
        <span class="spine__year" aria-hidden="true">${film.year}</span>
      </button></li>`;
    })
    .join('');
  const rows = filmsByYear
    .map((f, i) => `<tr><td class="num">${f.year}</td><th scope="row"><button class="link-button" type="button" data-spine-link="${i}">${esc(f.title)}</button></th><td>${esc(f.role)}</td></tr>`)
    .join('');
  return `<section ${chapterAttrs(c)}>
    ${opener(c, prev)}
    <div class="roles page">
      <div class="prose roles__intro">
        <p class="lead">Twenty films, shelved by year, from a first role at eleven to Meg March at twenty-nine. Each spine opens to a page: the year, the part, and one line worth knowing.</p>
      </div>
      ${note(notes.roles, { stroke: 'none', tilt: 3, className: 'note--roles' })}
    </div>
    <div class="shelf" data-shelf>
      <div class="shelf__stage">
        <p class="shelf__hint label" aria-hidden="true"><span class="shelf__hint-desk">Keep scrolling to browse the shelf · select a spine to open it</span><span class="shelf__hint-touch">Tap a spine to open it</span></p>
        <ul class="shelf__track" data-shelf-track role="list" aria-label="Films, by year">${spines}</ul>
        <div class="shelf__plank" aria-hidden="true"></div>
      </div>
    </div>
    <div class="roles page">
      <details class="film-index">
        <summary><span class="label">Index of films</span> <span class="film-index__count">${filmsByYear.length} entries</span></summary>
        <table><caption class="visually-hidden">All films, by year</caption><thead><tr><th scope="col">Year</th><th scope="col">Title</th><th scope="col">Role</th></tr></thead><tbody>${rows}</tbody></table>
      </details>
      ${note(notes.rolesIndex, { stroke: 'arrow', tilt: -3, className: 'note--index', seed: 21 })}
    </div>
    <dialog class="film-card" data-film-card aria-labelledby="film-card-title">
      <div class="film-card__book" data-film-book>
        <div class="film-card__page film-card__page--left">
          <p class="film-card__year" data-fc-year></p>
          <p class="label">The part</p>
          <p class="film-card__role" data-fc-role></p>
        </div>
        <div class="film-card__page film-card__page--right">
          <p class="label">From the shelf · <span data-fc-index></span></p>
          <h3 class="film-card__title" id="film-card-title" data-fc-title></h3>
          <p class="film-card__note" data-fc-note></p>
          <p class="film-card__source">Source: <a data-fc-source href="#" target="_blank" rel="noopener"></a></p>
        </div>
      </div>
      <div class="film-card__actions">
        <button class="tool magnetic" type="button" data-fc-prev>← Previous</button>
        <button class="tool magnetic" type="button" data-fc-close>Close</button>
        <button class="tool magnetic" type="button" data-fc-next>Next →</button>
      </div>
    </dialog>
  </section>`;
}

/* ---------- III. The Voice ---------- */

function voiceChapter(): string {
  const c = ch('voice');
  const prev = ch('roles');
  const quoteWords = voice.quote.split(' ').map((w) => `<span class="vw">${esc(w)}</span>`).join(' ');
  return `<section ${chapterAttrs(c)}>
    ${opener(c, prev)}
    <div class="voice page">
      <div class="prose voice__context">
        <p class="lead">${esc(voice.context[0])}${fn('voice-1', 1)}</p>
        <p>${esc(voice.context[1]).replace('an invitation', `an ${mark('invitation', 'underline', 31)}`)}</p>
      </div>
      <div class="voice__photo">${picture(images.uruguay, { sizes: '(min-width: 1024px) 40vw, 92vw' })}</div>
    </div>
    <div class="voice__pin" data-voice>
      <div class="voice__stage">
        <blockquote class="pullquote" cite="${voice.quoteSource}">
          <p class="pullquote__text" data-voice-quote><span class="visually-hidden">${esc(voice.quote)}</span><span aria-hidden="true">${quoteWords}</span></p>
          <footer class="pullquote__by"><span class="label">Emma Watson</span> · <cite>${esc(voice.attribution)}</cite>${fn('voice-2', 2)}</footer>
        </blockquote>
        ${note(notes.voice, { stroke: 'bracket', tilt: 2, className: 'note--voice', seed: 33 })}
      </div>
    </div>
    <div class="voice page">
      <blockquote class="pullquote pullquote--closing" cite="${voice.quoteSource}">
        <p class="pullquote__text">${esc(voice.closing).replace('now', mark('now', 'circle', 41))}</p>
        <footer class="pullquote__by"><cite>The closing lines of the speech</cite>${fn('voice-2b', 3)}</footer>
      </blockquote>
      <ol class="footnotes" aria-label="Notes to The Voice">
        <li id="fn-voice-1"><a href="${voice.contextSource}" target="_blank" rel="noopener">Wikipedia, “Emma Watson”</a>: Goodwill Ambassador (July 2014) and the HeForShe launch.</li>
        <li id="fn-voice-2"><a href="${voice.quoteSource}" target="_blank" rel="noopener">UN Women, “Emma Watson: Gender equality is your issue too”</a>, speech transcript, 20 September 2014.</li>
        <li id="fn-voice-2b">Ibid.</li>
      </ol>
    </div>
  </section>`;
}

/* ---------- IV. The Reader ---------- */

function readerChapter(): string {
  const c = ch('reader');
  const prev = ch('voice');
  const paras = reader.paragraphs
    .map((p, i) => {
      let t = esc(p.text);
      if (i === 1) t = t.replace('a handwritten note', `a ${mark('handwritten note', 'underline', 51)}`);
      return `<p${i === 0 ? ' class="lead"' : ''}>${t}${fn(`reader-${i}`, i + 1)}</p>`;
    })
    .join('');
  const cards = shelf
    .map(
      (b, i) => `<article class="card" data-card aria-label="${i + 1} of ${shelf.length}: ${esc(b.title)} by ${esc(b.author)}" style="--i:${i}">
        <p class="card__no label">No. ${i + 1}</p>
        <h3 class="card__title">${esc(b.title)}</h3>
        <p class="card__author">${esc(b.author)}</p>
        <p class="card__note">${esc(b.note)}</p>
        <p class="card__src">Source: <a href="${b.source}" target="_blank" rel="noopener">${esc(b.sourceLabel)}</a></p>
      </article>`,
    )
    .join('');
  return `<section ${chapterAttrs(c)}>
    ${opener(c, prev)}
    <div class="reader page">
      <div class="prose reader__text">${paras}</div>
      ${note(notes.reader, { stroke: 'arrow', tilt: -3, className: 'note--reader', seed: 52 })}
      <div class="reader__photo">${picture(images.bookDrop, { sizes: '(min-width: 1024px) 30vw, 92vw' })}</div>
    </div>
    <div class="stack page" data-stack>
      <div class="stack__intro"><h3 class="stack__heading">From the shared shelf</h3><p class="stack__how label"><span class="stack__how-pointer">Drag the top card aside, or use the buttons</span><span class="stack__how-touch">Swipe the top card, or use the buttons</span></p></div>
      <div class="stack__cards" data-stack-cards role="group" aria-roledescription="card stack" aria-label="Books from Our Shared Shelf">${cards}</div>
      <div class="stack__controls">
        <button class="tool magnetic" type="button" data-stack-prev>← Previous</button>
        <p class="stack__count label" aria-live="polite" data-stack-count>Card 1 of ${shelf.length}</p>
        <button class="tool magnetic" type="button" data-stack-next>Next card →</button>
      </div>
    </div>
    <div class="reader page">
      <ol class="footnotes" aria-label="Notes to The Reader">
        ${reader.paragraphs.map((p, i) => `<li id="fn-reader-${i}"><a href="${p.source}" target="_blank" rel="noopener">${esc(new URL(p.source).hostname.replace('www.', ''))}</a></li>`).join('')}
      </ol>
    </div>
  </section>`;
}

/* ---------- V. Timeline ---------- */

function timelineChapter(): string {
  const c = ch('timeline');
  const prev = ch('reader');
  let lastYear = 0;
  const items = milestones
    .map((m, i) => {
      const showYear = m.year !== lastYear;
      lastYear = m.year;
      const side = i % 2 === 0 ? 'left' : 'right';
      return `<li class="milestone milestone--${side}" data-milestone>
        <p class="milestone__year${showYear ? '' : ' milestone__year--repeat'}"><span class="milestone__ring" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><path d="M50 4 C 80 4, 97 24, 96 50 C 95 78, 76 96, 50 96 C 22 96, 4 78, 5 50 C 6 22, 24 5, 54 6" pathLength="1" vector-effect="non-scaling-stroke"/></svg></span><span class="milestone__y">${m.year}</span></p>
        ${m.when ? `<p class="milestone__when label">${esc(m.when)}</p>` : ''}
        <h3 class="milestone__title">${esc(m.title)}</h3>
        <p class="milestone__text">${esc(m.text)} <a class="milestone__src" href="${m.source}" target="_blank" rel="noopener" aria-label="Source for ${esc(m.title)}">source</a></p>
        ${m.year === 2014 && showYear ? note(notes.timeline, { stroke: 'none', tilt: -4, className: 'note--timeline' }) : ''}
      </li>`;
    })
    .join('');
  return `<section ${chapterAttrs(c)}>
    ${opener(c, prev)}
    <div class="timeline page" data-timeline>
      <svg class="timeline__ink" aria-hidden="true" focusable="false" preserveAspectRatio="none"><path data-timeline-path pathLength="1"/></svg>
      <ol class="timeline__list">${items}</ol>
    </div>
  </section>`;
}

/* ---------- VI. Epilogue + Colophon ---------- */

function epilogueChapter(): string {
  const c = ch('epilogue');
  const prev = ch('timeline');
  const photoCredits = Object.values(images)
    .filter((p) => p.credit && !p.placeholder)
    .map((p) => {
      const cr = p.credit!;
      return `<li><span class="colophon__what">${esc(p.caption.split('.')[0])}</span>: “<a href="${cr.sourceUrl}" target="_blank" rel="noopener">${esc(cr.title)}</a>” by ${esc(cr.author)}, <a href="${cr.licenseUrl}" target="_blank" rel="license noopener">${esc(cr.license)}</a>, via Wikimedia Commons. ${esc(cr.changes)}</li>`;
    })
    .join('');
  const placeholders = Object.values(images).filter((p) => p.placeholder).length;
  return `<section ${chapterAttrs(c)}>
    ${opener(c, prev)}
    <div class="epilogue page">
      <div class="theend" data-theend data-ink>
        <p class="theend__text"><span class="visually-hidden">The End</span><em aria-hidden="true">The End</em></p>
        <svg class="theend__flourish" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${flourishPath()}" pathLength="1" vector-effect="non-scaling-stroke"/></svg>
        ${note(notes.epilogue, { stroke: 'none', tilt: -3, className: 'note--epilogue' })}
      </div>
      <p class="epilogue__coda prose">A life is still being written; this book only annotates a few of its pages. If you found something here worth reading, go and read one of the books on her shelf.</p>
    </div>
    <div class="colophon paper--aged" id="credits" aria-labelledby="credits-title">
      <div class="page colophon__page">
        <h2 class="colophon__title" id="credits-title">Colophon &amp; Credits</h2>
        <p class="colophon__disclaimer"><strong>${esc(site.disclaimer)}</strong> This is a not-for-profit fan project. It uses no press or agency photography and no film-studio artwork, logos or crests; films are referred to by title only.</p>
        <div class="colophon__grid">
          <div><h3 class="label">Photographs</h3><ul>${photoCredits}${placeholders ? `<li>${placeholders} clearly marked placeholder${placeholders > 1 ? 's' : ''}, ready to swap in <code>src/content/images.ts</code>. No photograph is shown without its credit.</li>` : ''}</ul></div>
          <div><h3 class="label">Typefaces</h3><ul>${typefaces.map((t) => `<li><a href="${t.url}" target="_blank" rel="noopener">${esc(t.name)}</a> by ${esc(t.by)}, ${esc(t.license)}.</li>`).join('')}</ul></div>
          <div><h3 class="label">Built with</h3><ul>${libraries.map((l) => `<li><a href="${l.url}" target="_blank" rel="noopener">${esc(l.name)}</a>, ${esc(l.license)}.</li>`).join('')}</ul></div>
          <div><h3 class="label">Facts &amp; sources</h3><p>Every fact on these pages links to the source it was checked against (November 2026). The main references are <a href="https://en.wikipedia.org/wiki/Emma_Watson" target="_blank" rel="noopener">Wikipedia</a> and the <a href="${voice.quoteSource}" target="_blank" rel="noopener">UN Women transcript</a> of the HeForShe speech.</p></div>
        </div>
      </div>
    </div>
  </section>`;
}

/* ---------- chrome ---------- */

function chrome(): string {
  const contents = chapters
    .map((c) => `<li><a href="#${c.id}" data-contents-link><span class="contents__num">${c.numeral}</span><span class="contents__name">${esc(c.title)}</span><span class="contents__dots" aria-hidden="true"></span><span class="contents__page">${c.pages[0]}</span></a></li>`)
    .join('');
  return `<a class="skip-link" href="#prologue-text">Skip to the story</a>
  <header class="runhead" data-runhead>
    <p class="runhead__verso label"><span class="visually-hidden">Current chapter: </span><span data-runhead-chapter>Prologue</span></p>
    <a class="runhead__title" href="#prologue">${esc(site.title)}</a>
    <div class="runhead__tools">
      <button class="tool magnetic" type="button" data-contents-open aria-haspopup="dialog">Contents</button>
      <button class="tool magnetic" type="button" data-sound aria-pressed="false" aria-label="Sound effects"><span class="tool__icon" aria-hidden="true"></span><span class="tool__label">Sound</span></button>
    </div>
  </header>
  <dialog class="contents" data-contents aria-labelledby="contents-title">
    <h2 class="contents__title" id="contents-title">Contents</h2>
    <ol class="contents__list">${contents}<li><a href="#credits" data-contents-link><span class="contents__num">·</span><span class="contents__name">Colophon &amp; Credits</span><span class="contents__dots" aria-hidden="true"></span><span class="contents__page">96</span></a></li></ol>
    <button class="tool magnetic contents__close" type="button" data-contents-close>Close</button>
  </dialog>
  <p class="folio" aria-hidden="true">p. <span data-folio>5</span> <span class="folio__of">of ${site.totalPages}</span></p>
  <div class="pen" aria-hidden="true" data-pen><svg class="pen__nib" viewBox="0 0 24 40" focusable="false"><path d="M12 39 L5 18 Q4 8 12 1 Q20 8 19 18 Z" /><path class="pen__slit" d="M12 38 L12 20"/><circle class="pen__hole" cx="12" cy="18" r="1.6"/></svg><span class="pen__dot"></span></div>
  <div class="grain" aria-hidden="true"></div>
  <svg class="svg-defs" aria-hidden="true" focusable="false" width="0" height="0"><defs>
    <filter id="ink-bleed" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" data-bleed/></filter>
  </defs></svg>`;
}

function footer(): string {
  return `<footer class="foot">
    <p class="foot__disclaimer">${esc(site.disclaimer)}</p>
    <p class="foot__meta"><a href="#credits">Colophon &amp; Credits</a> · <a href="#prologue">Back to the first page</a></p>
  </footer>`;
}

export function renderBook(): string {
  return `${chrome()}
  ${cover()}
  <main class="book" id="book">
    <span id="prologue-text" class="visually-hidden" tabindex="-1">Start of the book</span>
    ${prologueChapter()}
    ${rolesChapter()}
    ${voiceChapter()}
    ${readerChapter()}
    ${timelineChapter()}
    ${epilogueChapter()}
  </main>
  ${footer()}`;
}
