import { gsap } from 'gsap';
import { $, reduced, store } from './env';
import { scroller } from './scroll';
import { sound } from './sound';

/**
 * Chapter 0 — the cover. The page counter tracks REAL loading (fonts + the portrait),
 * never a fake timer. At 100 the cover swings open on its hinge. Click/Enter skips.
 */
export function initCover(onOpen: () => void) {
  const cover = $('[data-cover]');
  if (!cover) { onOpen(); return; }
  const root = document.documentElement;
  const countEl = $('[data-cover-count]', cover)!;
  const statusEl = $('[data-cover-status]', cover)!;
  const board = $('.cover__board', cover)!;
  const book = $('[data-cover-book]', cover)!;
  const openBtn = $<HTMLButtonElement>('[data-cover-open]', cover)!;

  root.classList.add('is-cover');
  scroller.stop();

  const repeat = store.get('marginalia-opened') === '1';
  const portrait = $<HTMLImageElement>('.prologue__portrait img');
  const tasks: Promise<unknown>[] = [
    document.fonts.load('300 64px Fraunces'),
    document.fonts.load('italic 300 64px Fraunces'),
    document.fonts.load('500 16px "Hanken Grotesk"'),
    document.fonts.load('500 24px Caveat'),
    portrait ? (portrait.complete ? Promise.resolve() : new Promise((r) => { portrait.addEventListener('load', r, { once: true }); portrait.addEventListener('error', r, { once: true }); })) : Promise.resolve(),
  ];

  const counter = { v: 0 };
  let target = 0;
  let opened = false;
  const render = () => {
    const n = Math.round(counter.v);
    countEl.textContent = String(n);
    statusEl.textContent = n < 100 ? `Binding pages… ${n} of 100` : 'Ready. Opening the book.';
  };
  const advance = () => {
    gsap.to(counter, { v: target, duration: repeat ? 0.25 : 0.55, ease: 'power2.out', onUpdate: render, overwrite: true, onComplete: () => { if (target >= 100) open(); } });
  };

  let done = 0;
  tasks.forEach((t) => t.catch(() => undefined).then(() => { done++; target = Math.round((done / tasks.length) * 100); advance(); }));
  // never trap anyone behind the cover: give up waiting after 4 s
  const failsafe = window.setTimeout(() => { target = 100; advance(); }, 4000);

  function open() {
    if (opened) return;
    opened = true;
    window.clearTimeout(failsafe);
    store.set('marginalia-opened', '1');
    counter.v = 100; render();
    cover!.classList.add('is-open');
    const finish = () => {
      cover!.style.display = 'none';
      root.classList.remove('is-cover');
      scroller.start();
    };
    if (reduced) {
      gsap.to(cover!, { opacity: 0, duration: 0.2, onComplete: finish });
      onOpen();
      return;
    }
    sound.pageTurn();
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(board, { rotationY: -165, duration: 0.95, ease: 'power3.inOut' }, 0)
      .to(book, { xPercent: 22, scale: 1.04, duration: 0.95, ease: 'power3.inOut' }, 0)
      .to('.cover__count', { opacity: 0, y: 12, duration: 0.35, ease: 'power2.in' }, 0)
      .add(() => onOpen(), 0.55)
      .to(cover!, { opacity: 0, duration: 0.45, ease: 'power1.out' }, 0.7);
  }

  openBtn.addEventListener('click', () => { target = 100; gsap.killTweensOf(counter); counter.v = 100; open(); });
}
