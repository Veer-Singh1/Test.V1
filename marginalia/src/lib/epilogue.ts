import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { $, reduced } from './env';

/** Chapter VI — "The End" sets itself letter by letter, then the pen draws a flourish (peak-end). */
export function initEpilogue() {
  const end = $('[data-theend]');
  const text = $('.theend__text em', end ?? undefined);
  if (!end || !text || reduced) return;
  const split = SplitText.create(text, { type: 'chars', mask: 'chars', aria: 'none' });
  gsap.from(split.chars, {
    yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.06,
    scrollTrigger: { trigger: end, start: 'top 70%', once: true },
  });
}
