import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, reduced } from './env';
import { scroller } from './scroll';
import { sound } from './sound';

/**
 * Running header (current chapter on the verso), folio "p. X of 96", paper state
 * for the header colours, and the Contents dialog with a page-turn jump.
 */
export function initFolio() {
  const folio = $('[data-folio]');
  const verso = $('[data-runhead-chapter]');
  const chapters = $$('[data-chapter]');
  const colophon = $('#credits');
  const root = document.documentElement;
  type Span = { el: HTMLElement; top: number; bottom: number; paperTop: number; start: number; end: number; title: string; paper: string };
  let spans: Span[] = [];

  const measure = () => {
    spans = chapters.map((el) => {
      const r = el.getBoundingClientRect();
      const [start, end] = (el.dataset.pages ?? '1,1').split(',').map(Number);
      const paper = (el.className.match(/paper--(\w+)/) ?? [])[1] ?? 'fresh';
      const top = r.top + window.scrollY;
      // the header keeps the previous page's colours until the leaf is half turned
      const turn = el.querySelector<HTMLElement>('[data-turn]');
      const paperTop = turn && turn.querySelector('[data-leaf]') ? top + Math.max(0, turn.offsetHeight - window.innerHeight) * 0.5 : top;
      return { el, top, bottom: r.bottom + window.scrollY, paperTop, start, end, title: el.dataset.title ?? '', paper };
    });
  };

  let lastPage = -1;
  let lastTitle = '';
  let lastPaper = '';
  const update = () => {
    if (!spans.length) return;
    const y = window.scrollY + window.innerHeight * 0.35;
    const s = spans.find((sp) => y >= sp.top && y < sp.bottom) ?? (y < spans[0].top ? spans[0] : spans[spans.length - 1]);
    const p = Math.min(1, Math.max(0, (y - s.top) / Math.max(1, s.bottom - s.top)));
    const page = Math.round(s.start + p * (s.end - s.start));
    if (page !== lastPage && folio) { folio.textContent = String(page); lastPage = page; }
    if (s.title !== lastTitle && verso) { verso.textContent = s.title; lastTitle = s.title; }
    const idx = spans.indexOf(s);
    const raw = window.scrollY + 24 < s.paperTop && idx > 0 ? spans[idx - 1].paper : s.paper;
    let paper = raw === 'ruled' ? 'fresh' : raw;
    if (colophon && colophon.getBoundingClientRect().top < 48) paper = 'aged';
    if (paper !== lastPaper) { root.dataset.paper = paper; lastPaper = paper; }
  };

  measure();
  update();
  ScrollTrigger.addEventListener('refresh', () => { measure(); update(); });
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }, { passive: true });
}

export function initContents() {
  const dialog = $<HTMLDialogElement>('[data-contents]');
  const openBtn = $('[data-contents-open]');
  if (!dialog || !openBtn) return;
  openBtn.addEventListener('click', () => {
    dialog.showModal();
    if (!reduced) gsap.fromTo(dialog, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out' });
  });
  $('[data-contents-close]', dialog)?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  $$<HTMLAnchorElement>('[data-contents-link]', dialog).forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector<HTMLElement>(a.getAttribute('href')!);
      dialog.close();
      if (!target) return;
      jumpWithPageTurn(target);
    }),
  );
}

/** A full-screen leaf turns while the scroll jumps underneath (contents navigation). */
export function jumpWithPageTurn(target: HTMLElement) {
  const focusTarget = () => {
    const heading = target.querySelector<HTMLElement>('h1, h2') ?? target;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  };
  // land just after the chapter's page-turn, on its opener
  const turn = target.querySelector<HTMLElement>('[data-turn]');
  const y = turn && !reduced
    ? turn.getBoundingClientRect().top + window.scrollY + turn.offsetHeight - window.innerHeight
    : target.getBoundingClientRect().top + window.scrollY - 48;
  if (reduced) { scroller.to(y, { immediate: true }); focusTarget(); return; }

  const leaf = document.createElement('div');
  leaf.className = 'jump-leaf';
  leaf.setAttribute('aria-hidden', 'true');
  document.body.appendChild(leaf);
  sound.pageTurn();
  gsap.timeline({ onComplete: () => { leaf.remove(); focusTarget(); } })
    .fromTo(leaf, { rotationY: 0, opacity: 1, transformPerspective: 2200 }, { rotationY: -90, duration: 0.42, ease: 'power2.in' })
    .add(() => scroller.to(y, { immediate: true }))
    .to(leaf, { rotationY: -180, duration: 0.48, ease: 'power2.out' })
    .to(leaf, { opacity: 0, duration: 0.15 }, '-=0.12');
}
