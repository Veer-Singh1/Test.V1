import { $$, reduced } from './env';
import { sound } from './sound';

/**
 * The reader's pen. Every [data-ink] element (circles, underlines, margin notes) inks itself
 * once as it enters, and stays inked: ink doesn't un-write when you scroll back.
 * The stroke itself is a CSS transition on stroke-dashoffset (pathLength="1"), so it is cheap.
 */
export function initInk() {
  const marks = $$('[data-ink]');
  if (reduced || !('IntersectionObserver' in window)) {
    marks.forEach((m) => m.classList.add('is-inked'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        // stagger notes slightly after the text they annotate
        window.setTimeout(() => { el.classList.add('is-inked'); sound.pen(); }, el.classList.contains('note') ? 350 : 120);
        io.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -18% 0px', threshold: 0.6 },
  );
  marks.forEach((m) => io.observe(m));
}

/** Gentle one-time reveal for prose and figures (12px rise + fade, 600ms). */
export function initReveal() {
  if (reduced || !('IntersectionObserver' in window)) return;
  const els = $$('.prose > *, .photo, .film-index, .stack__intro, .pullquote--closing, .footnotes, .colophon__grid > *, .epilogue__coda');
  els.forEach((el) => el.classList.add('rv'));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}
