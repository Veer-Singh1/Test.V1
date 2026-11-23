import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from './env';

/**
 * Smooth scrolling that never hijacks: Lenis only eases wheel input (lerp 0.1, native rate),
 * touch stays native, and in the calm edition Lenis isn't started at all.
 */
let lenis: Lenis | null = null;
const velocityListeners = new Set<(v: number) => void>();

export function initScroll() {
  if (reduced) {
    window.addEventListener('scroll', () => ScrollTrigger.update(), { passive: true });
    return;
  }
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', (l: Lenis) => {
    ScrollTrigger.update();
    velocityListeners.forEach((fn) => fn(l.velocity));
  });
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export const scroller = {
  stop: () => lenis?.stop(),
  start: () => lenis?.start(),
  to(target: number | HTMLElement, opts: { immediate?: boolean; duration?: number; offset?: number } = {}) {
    if (lenis) {
      lenis.scrollTo(target, { immediate: opts.immediate, duration: opts.duration ?? 1.2, offset: opts.offset ?? 0, force: true });
    } else {
      const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0);
      window.scrollTo({ top: y, behavior: 'auto' });
    }
  },
  onVelocity(fn: (v: number) => void) {
    velocityListeners.add(fn);
  },
};
