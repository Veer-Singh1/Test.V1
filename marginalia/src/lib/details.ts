import { gsap } from 'gsap';
import { $, $$, clamp, finePointer, reduced } from './env';
import { scroller } from './scroll';

/** Pen-nib cursor: an ink dot that becomes a nib over anything you can click. Fine pointers only. */
export function initPen() {
  const pen = $('[data-pen]');
  if (!pen || !finePointer || reduced) return;
  document.documentElement.classList.add('has-pen');
  const x = gsap.quickTo(pen, 'x', { duration: 0.18, ease: 'power3.out' });
  const y = gsap.quickTo(pen, 'y', { duration: 0.18, ease: 'power3.out' });
  const interactive = 'a, button, summary, [data-spine], .card, [role="button"]';
  window.addEventListener('pointermove', (e) => {
    x(e.clientX); y(e.clientY);
    const t = e.target as Element | null;
    pen.classList.toggle('is-link', !!t?.closest(interactive));
    pen.classList.toggle('is-reversed', !!t?.closest('.paper--reversed, .cover__board, .foot, .spine--ink, .spine--red'));
  }, { passive: true });
  document.addEventListener('pointerleave', () => gsap.to(pen, { opacity: 0, duration: 0.2 }));
  document.addEventListener('pointerenter', () => gsap.to(pen, { opacity: 1, duration: 0.2 }));
}

/** Magnetic buttons: pulled up to 8px toward the pointer, spring back on leave. */
export function initMagnetic() {
  if (!finePointer || reduced) return;
  $$('.magnetic').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x(clamp(-8, 8, (e.clientX - (r.left + r.width / 2)) * 0.3));
      y(clamp(-8, 8, (e.clientY - (r.top + r.height / 2)) * 0.3));
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }));
  });
}

/** Velocity skew: images lean (±3°) with scroll speed and settle back. Desktop, motion allowed. */
export function initSkew() {
  if (reduced || !finePointer) return;
  const imgs = $$('.skew');
  const setters = imgs.map((img) => gsap.quickTo(img, 'skewY', { duration: 0.45, ease: 'power3.out' }));
  scroller.onVelocity((v) => {
    const s = clamp(-3, 3, v * -0.09);
    setters.forEach((set) => set(s));
  });
}

/** Hover distortion: an SVG "ink bleed" displacement on photographs (no WebGL needed). */
export function initDistort() {
  if (reduced || !finePointer) return;
  const map = document.querySelector('[data-bleed]');
  if (!map) return;
  const state = { scale: 0 };
  const apply = () => map.setAttribute('scale', state.scale.toFixed(2));
  $$('[data-distort]').forEach((frame) => {
    frame.addEventListener('pointerenter', () => {
      frame.classList.add('is-bleeding');
      gsap.to(state, { scale: 16, duration: 0.7, ease: 'power2.out', onUpdate: apply, overwrite: true });
    });
    frame.addEventListener('pointerleave', () => {
      gsap.to(state, { scale: 0, duration: 0.5, ease: 'power2.inOut', onUpdate: apply, overwrite: true, onComplete: () => frame.classList.remove('is-bleeding') });
    });
  });
}
