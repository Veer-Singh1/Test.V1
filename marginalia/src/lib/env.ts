/** Capability + preference flags, read once (and kept live where it matters). */
const mq = (q: string) => window.matchMedia(q);

export const reduced = document.documentElement.classList.contains('calm') || mq('(prefers-reduced-motion: reduce)').matches;
export const finePointer = mq('(hover: hover) and (pointer: fine)').matches;
export const desktopQuery = '(min-width: 1024px)';
export const isDesktop = () => mq(desktopQuery).matches;

export const clamp = (min: number, max: number, v: number) => Math.min(max, Math.max(min, v));

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

export const store = {
  get(key: string): string | null {
    try { return sessionStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { sessionStorage.setItem(key, value); } catch { /* storage unavailable: fine */ }
  },
};
