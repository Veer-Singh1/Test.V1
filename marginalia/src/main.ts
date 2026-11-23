import './styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { initScroll } from './lib/scroll';
import { initCover } from './lib/cover';
import { initSound } from './lib/sound';
import { initInk, initReveal } from './lib/ink';
import { initFolio, initContents } from './lib/chrome';
import { initPrologue, revealPrologue } from './lib/prologue';
import { initTurns } from './lib/turns';
import { initShelf } from './lib/shelf';
import { initVoice } from './lib/voice';
import { initStack } from './lib/stack';
import { initTimeline } from './lib/timeline';
import { initEpilogue } from './lib/epilogue';
import { initPen, initMagnetic, initSkew, initDistort } from './lib/details';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });
if (location.search.includes('debug')) (window as unknown as { __ST: typeof ScrollTrigger }).__ST = ScrollTrigger;

/** Run work in idle time (the cover is up for ~1 s anyway), with a deadline so it is never late. */
const idle = (fn: () => void) =>
  'requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 900 }) : setTimeout(fn, 1);

function boot() {
  // critical path: what the first screen needs
  initScroll();
  initSound();
  initPrologue();
  initCover(() => {
    revealPrologue();
    initInk();
  });
  initFolio();
  initContents();

  // everything below the fold is wired up while the reader looks at the cover
  idle(() => {
    initReveal();
    initTurns();
    initShelf();
    initVoice();
    initStack();
    initTimeline();
    initEpilogue();
    idle(() => {
      initPen();
      initMagnetic();
      initSkew();
      initDistort();
      ScrollTrigger.refresh();
    });
  });

  // layout settles once fonts and images are in; re-measure every pinned/sticky stage
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

boot();
