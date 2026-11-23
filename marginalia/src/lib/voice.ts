import { gsap } from 'gsap';
import { $, $$, reduced } from './env';

/**
 * Chapter III — the peak. On an ink-reversed page the quote is typeset word by word as you
 * scroll: words appear as if inked (opacity + a blur clearing), they don't slide.
 * The full sentence is always in the DOM via aria-label, so screen readers hear it whole.
 */
export function initVoice() {
  const pin = $('[data-voice]');
  if (!pin || reduced) return;
  const words = $$('.vw', pin);
  const quoteNote = $('.note--voice', pin);
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: pin, start: 'top top', end: 'bottom bottom', scrub: 0.5 },
  });
  tl.to(words, { opacity: 1, filter: 'blur(0px)', duration: 0.35, stagger: 0.22 })
    .fromTo('.voice__stage .pullquote__by', { opacity: 0 }, { opacity: 1, duration: 0.3 })
    .add(() => quoteNote?.classList.add('is-inked'));
}
