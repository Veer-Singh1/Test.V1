import { gsap } from 'gsap';
import { shelf as books } from '../content/data';
import { $, $$, reduced } from './env';
import { sound } from './sound';

/**
 * Chapter IV — a stack of index cards. Drag the top card aside (GSAP Draggable + Inertia)
 * and it goes to the bottom of the pile. Buttons do the same for keyboard and screen-reader
 * users, and a polite live region announces the card on top.
 */
export function initStack() {
  const root = $('[data-stack]');
  if (!root || reduced) return;
  const holder = $('[data-stack-cards]', root)!;
  const count = $('[data-stack-count]', root)!;
  let order = $$('[data-card]', holder);
  const n = order.length;
  const rot = [-2.2, 1.6, -1, 2.4, -2.8, 1.1, -1.6, 2];

  const layout = (animate = true) => {
    order.forEach((card, idx) => {
      card.style.zIndex = String(n - idx);
      // cards under the top one are out of reach for keyboard and screen readers
      card.inert = idx !== 0;
      gsap.to(card, { x: (idx % 2 ? 1 : -1) * idx * 3, y: idx * 5, rotation: idx === 0 ? -0.6 : rot[idx % rot.length], duration: animate ? 0.55 : 0, ease: 'power3.out', overwrite: 'auto' });
    });
    const top = order[0];
    const i = Number(top.style.getPropertyValue('--i'));
    count.textContent = `Card ${i + 1} of ${n}: ${books[i]?.title ?? ''}`;
  };

  type DraggableT = typeof import('gsap/Draggable').Draggable;
  type InertiaT = typeof import('gsap/InertiaPlugin').InertiaPlugin;
  let Draggable: DraggableT | null = null;
  let Inertia: InertiaT | null = null;
  let drag: InstanceType<DraggableT> | null = null;

  const bindDrag = () => {
    if (!Draggable) return;
    drag?.kill();
    const top = order[0];
    [drag] = Draggable.create(top, {
      type: 'x,y',
      inertia: false,
      zIndexBoost: false,
      onDrag() { gsap.set(top, { rotation: this.x / 18 }); },
      onRelease() {
        const vx = Inertia ? Inertia.getVelocity(top, 'x') : 0;
        if (Math.abs(this.x) > 110 || Math.abs(vx) > 900) next(Math.sign(this.x || vx) || 1);
        else gsap.to(top, { x: 0, y: 0, rotation: -0.6, duration: 0.6, ease: 'elastic.out(1, 0.6)' });
      },
    });
    if (Inertia) Inertia.track(top, 'x');
  };

  const next = (dir = 1) => {
    const top = order.shift()!;
    order.push(top);
    sound.pageTurn();
    gsap.timeline()
      .to(top, { x: dir * 560, y: -30, rotation: dir * 14, duration: 0.34, ease: 'power2.in' })
      .add(() => { layout(); bindDrag(); })
      .set(top, { zIndex: 0 });
  };
  const prev = () => {
    const last = order.pop()!;
    order.unshift(last);
    sound.pageTurn();
    gsap.set(last, { x: -560, rotation: -14, zIndex: n + 1 });
    layout();
    bindDrag();
  };

  layout(false);
  $('[data-stack-next]', root)!.addEventListener('click', () => next(1));
  $('[data-stack-prev]', root)!.addEventListener('click', prev);
  holder.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next(1);
    if (e.key === 'ArrowLeft') prev();
  });

  // Draggable + Inertia are only fetched when the stack is close
  const io = new IntersectionObserver(async (e) => {
    if (!e.some((x) => x.isIntersecting)) return;
    io.disconnect();
    const [d, i] = await Promise.all([import('gsap/Draggable'), import('gsap/InertiaPlugin')]);
    gsap.registerPlugin(d.Draggable, i.InertiaPlugin);
    Draggable = d.Draggable;
    Inertia = i.InertiaPlugin;
    bindDrag();
  }, { rootMargin: '60% 0px' });
  io.observe(root);
}
