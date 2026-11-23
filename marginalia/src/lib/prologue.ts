import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { $, reduced } from './env';

/**
 * Chapter I. The name is split by letter. Letters rise out of a baseline mask as the cover
 * opens (so the first screen is never empty — see research/psychology.md §10), then scrolling
 * pulls them apart letter by letter while the portrait's mask is drawn back.
 */
let revealTl: gsap.core.Timeline | null = null;

export function initPrologue() {
  const name = $('[data-name]');
  const frame = $('.prologue__portrait .photo__frame');
  const img = $('.prologue__portrait img');
  if (!name) return;
  if (reduced) return;

  const parts = Array.from(name.querySelectorAll<HTMLElement>('.display-name__first, .display-name__last'));
  const splits = parts.map((p) => SplitText.create(p, { type: 'chars', charsClass: 'char', mask: 'chars', aria: 'none' }));
  const chars = splits.flatMap((s) => s.chars as HTMLElement[]);
  gsap.set(chars, { yPercent: 112 });
  if (frame) gsap.set(frame, { clipPath: 'inset(100% 0% 0% 0%)' });
  if (img) gsap.set(img, { scale: 1.16 });

  revealTl = gsap.timeline({ paused: true })
    .to(chars, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.045 }, 0)
    .to(frame, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' }, 0.25)
    .to(img, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.35);

  // scroll: letters drift apart by index; portrait settles a little slower than the page
  const drift = [-26, 12, -8, 20, -16, 6, -22, 14, -4, 18, -12];
  gsap.to(chars, {
    y: (i: number) => drift[i % drift.length] * 3,
    rotation: (i: number) => (i % 2 ? 1.5 : -1.5),
    ease: 'none',
    scrollTrigger: { trigger: '.chapter--prologue', start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
  if (frame) {
    gsap.to(frame, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  }
}

/** Called when the cover opens. */
export function revealPrologue() {
  revealTl?.play();
}
