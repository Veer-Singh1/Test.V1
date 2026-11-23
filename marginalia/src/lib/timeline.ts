import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, reduced } from './env';
import { sound } from './sound';

/**
 * Chapter V — one hand-wobbled ink line runs down the page, its stroke scrubbed to scroll.
 * Each milestone inks itself (opacity + a circled year) when the line reaches it.
 */
function wobblyLine(h: number, w: number): string {
  const cx = w / 2;
  let d = `M${cx.toFixed(1)} 0`;
  let s = 7;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const step = 110;
  for (let y = step; y <= h + step; y += step) {
    const yy = Math.min(y, h);
    const x = cx + (r() - 0.5) * w * 0.32;
    const c1 = cx + (r() - 0.5) * w * 0.5;
    d += ` C ${c1.toFixed(1)} ${(yy - step * 0.66).toFixed(1)}, ${x.toFixed(1)} ${(yy - step * 0.33).toFixed(1)}, ${cx.toFixed(1)} ${yy.toFixed(1)}`;
    if (yy === h) break;
  }
  return d;
}

export function initTimeline() {
  const root = $('[data-timeline]');
  if (!root) return;
  const svg = root.querySelector<SVGSVGElement>('.timeline__ink');
  const path = root.querySelector<SVGPathElement>('[data-timeline-path]');
  if (!svg || !path) return;
  const items = $$('[data-milestone]', root);

  const draw = () => {
    const r = svg.getBoundingClientRect();
    const h = Math.max(1, Math.round(r.height));
    const w = Math.max(1, Math.round(r.width));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    path.setAttribute('d', wobblyLine(h, w));
  };
  draw();
  ScrollTrigger.addEventListener('refreshInit', draw);

  if (reduced) {
    items.forEach((i) => i.classList.add('is-inked'));
    return;
  }
  gsap.fromTo(path, { strokeDashoffset: 1 }, {
    strokeDashoffset: 0, ease: 'none', autoRound: false,
    scrollTrigger: { trigger: root, start: 'top 55%', end: 'bottom 75%', scrub: 0.5 },
  });
  items.forEach((item) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 62%',
      onEnter: () => { item.classList.add('is-inked'); sound.pen(); },
      onLeaveBack: () => item.classList.remove('is-inked'),
    });
  });
}
