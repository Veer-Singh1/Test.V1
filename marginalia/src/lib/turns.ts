import { gsap } from 'gsap';
import { $$, $, reduced, desktopQuery } from './env';
import { sound } from './sound';

/**
 * Between chapters a leaf turns on its spine as you scroll through a short sticky stage.
 * Desktop: rotateY around the left edge (a book page). Mobile: the page lifts upwards
 * (rotateX from the top edge), lighter and easier to read on a narrow screen.
 * The calm edition removes the leaf entirely (CSS).
 */
export function initTurns() {
  if (reduced) return;
  const mm = gsap.matchMedia();
  const turns = $$('[data-turn]').filter((t) => $('[data-leaf]', t));

  mm.add({ desk: desktopQuery, mob: '(max-width: 1023px)' }, (ctx) => {
    const { desk } = ctx.conditions as { desk: boolean };
    turns.forEach((turn) => {
      const leaf = $('[data-leaf]', turn)!;
      const shade = $('.leaf__shade', leaf)!;
      const opener = $('.opener', turn)!;
      let played = false;
      leaf.classList.toggle('is-mobile', !desk);
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: turn,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          onUpdate: (st) => {
            if (!played && st.progress > 0.3 && st.direction > 0) { played = true; sound.pageTurn(); }
            if (st.progress < 0.05) played = false;
          },
        },
      });
      if (desk) {
        tl.fromTo(leaf, { rotationY: 0 }, { rotationY: -180, duration: 1, ease: 'power1.inOut' }, 0);
      } else {
        tl.fromTo(leaf, { rotationX: 0, yPercent: 0 }, { rotationX: 86, yPercent: -12, duration: 1, ease: 'power1.in' }, 0)
          .to(leaf, { autoAlpha: 0, duration: 0.15 }, 0.85);
      }
      tl.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
        .to(shade, { opacity: 0, duration: 0.5 }, 0.5)
        .fromTo(opener, { scale: 0.96, opacity: 0.35 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.15);
    });
  });
}
