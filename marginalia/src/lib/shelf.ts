import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { filmsByYear } from '../content/data';
import { $, $$, clamp, desktopQuery, reduced } from './env';
import { scroller } from './scroll';
import { sound } from './sound';

type FlipT = typeof import('gsap/Flip').Flip;
let Flip: FlipT | null = null;
async function loadFlip() {
  if (Flip) return Flip;
  const mod = await import('gsap/Flip');
  gsap.registerPlugin(mod.Flip);
  Flip = mod.Flip;
  return Flip;
}

/**
 * Chapter II. Desktop: the shelf is pinned (CSS sticky) and slides sideways as you keep
 * scrolling DOWN — the scroll rate never changes. Spines lean slightly with scroll speed.
 * Click/Enter opens the film card with GSAP Flip; Esc/Close flips it back to its spine.
 */
export function initShelf() {
  const shelf = $('[data-shelf]');
  const track = $('[data-shelf-track]');
  const dialog = $<HTMLDialogElement>('[data-film-card]');
  const book = $('[data-film-book]');
  if (!shelf || !track || !dialog || !book) return;
  const spines = $$<HTMLButtonElement>('[data-spine]', track);

  // preload Flip when the shelf approaches
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { void loadFlip(); io.disconnect(); } }, { rootMargin: '100% 0px' });
    io.observe(shelf);
  }

  /* ---- horizontal travel (desktop, motion allowed) ---- */
  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
  if (!reduced) {
    const mm = gsap.matchMedia();
    mm.add(desktopQuery, () => {
      const setHeight = () => shelf.style.setProperty('--shelf-h', `${window.innerHeight + distance() + window.innerHeight * 0.25}px`);
      setHeight();
      ScrollTrigger.addEventListener('refreshInit', setHeight);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: { trigger: shelf, start: 'top top', end: 'bottom bottom', scrub: 0.4, invalidateOnRefresh: true },
      });
      // spines lean with scroll speed, then settle
      const lean = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3.out' });
      const st = tween.scrollTrigger!;
      const onTick = () => { lean(clamp(-4, 4, st.getVelocity() / -350)); };
      gsap.ticker.add(onTick);

      // keyboard: bring a focused spine into view by scrolling the page to it
      const onFocus = (e: FocusEvent) => {
        const spine = (e.target as HTMLElement).closest<HTMLElement>('[data-spine]');
        if (!spine || !st) return;
        const d = distance();
        if (d <= 0) return;
        const x = spine.offsetLeft + spine.offsetWidth / 2 - window.innerWidth / 2;
        const p = clamp(0, 1, x / d);
        scroller.to(st.start + p * (st.end - st.start), { duration: 0.6 });
      };
      track.addEventListener('focusin', onFocus);
      return () => {
        ScrollTrigger.removeEventListener('refreshInit', setHeight);
        gsap.ticker.remove(onTick);
        track.removeEventListener('focusin', onFocus);
        gsap.set(track, { clearProps: 'transform' });
        shelf.style.removeProperty('--shelf-h');
      };
    });
  }

  /* ---- the film card ---- */
  const field = (k: string) => $(`[data-fc-${k}]`, dialog)!;
  const content = $$('.film-card__page > *', dialog);
  let current = 0;
  let origin: HTMLElement | null = null;

  const fill = (i: number) => {
    const f = filmsByYear[i];
    field('year').textContent = String(f.year);
    field('role').textContent = f.role;
    field('title').textContent = f.title;
    field('note').textContent = f.note;
    field('index').textContent = `${i + 1} of ${filmsByYear.length}`;
    const src = field('source') as HTMLAnchorElement;
    src.href = f.source;
    src.textContent = new URL(f.source).hostname.replace('www.', '') + new URL(f.source).pathname.replace('/wiki/', ' · ').replace(/_/g, ' ');
  };

  async function open(i: number, from: HTMLElement) {
    current = i;
    origin = from;
    fill(i);
    sound.pageTurn();
    if (reduced) {
      dialog!.showModal();
      gsap.fromTo(dialog!, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      return;
    }
    const F = await loadFlip();
    from.dataset.flipId = 'film';
    const state = F.getState(from);
    delete from.dataset.flipId;
    dialog!.showModal();
    book!.dataset.flipId = 'film';
    gsap.set(content, { opacity: 0 });
    F.from(state, { targets: book!, duration: 0.85, ease: 'power3.inOut', scale: true });
    gsap.to(content, { opacity: 1, duration: 0.4, stagger: 0.04, delay: 0.55, ease: 'power2.out' });
  }

  async function close() {
    if (!dialog!.open) return;
    const to = origin && origin.isConnected && origin.getBoundingClientRect().width > 0 ? origin : null;
    if (reduced || !to) {
      gsap.to(dialog!, { opacity: 0, duration: 0.2, onComplete: () => { dialog!.close(); gsap.set(dialog!, { clearProps: 'opacity' }); origin?.focus(); } });
      return;
    }
    const F = await loadFlip();
    gsap.to(content, { opacity: 0, duration: 0.18 });
    F.fit(book!, to, {
      scale: true, duration: 0.65, ease: 'power3.inOut', delay: 0.12,
      onComplete: () => { dialog!.close(); gsap.set(book!, { clearProps: 'all' }); gsap.set(content, { clearProps: 'opacity' }); to.focus(); },
    });
  }

  const swap = (dir: 1 | -1) => {
    const next = (current + dir + filmsByYear.length) % filmsByYear.length;
    const tl = gsap.timeline();
    tl.to(content, { opacity: 0, x: -12 * dir, duration: reduced ? 0 : 0.18, ease: 'power2.in' })
      .add(() => { fill(next); current = next; origin = spines[next]; })
      .fromTo(content, { x: 12 * dir }, { opacity: 1, x: 0, duration: reduced ? 0 : 0.3, ease: 'power2.out', stagger: 0.02 });
    sound.pageTurn();
  };

  spines.forEach((s, i) => s.addEventListener('click', () => void open(i, s)));
  $$<HTMLButtonElement>('[data-spine-link]').forEach((b) =>
    b.addEventListener('click', () => {
      const i = Number(b.dataset.spineLink);
      const s = spines[i];
      // the spine may be off-screen (horizontal shelf); open from the index row instead
      const r = s.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
      void open(i, visible ? s : b);
    }),
  );
  $('[data-fc-close]', dialog)!.addEventListener('click', () => void close());
  $('[data-fc-next]', dialog)!.addEventListener('click', () => swap(1));
  $('[data-fc-prev]', dialog)!.addEventListener('click', () => swap(-1));
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); void close(); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) void close(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') swap(1);
    if (e.key === 'ArrowLeft') swap(-1);
  });
}
