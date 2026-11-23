import { $, store } from './env';

/**
 * Sound is OFF by default. When switched on, page turns and pen strokes are synthesised
 * with WebAudio (filtered noise), so the site ships no audio files.
 */
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let enabled = false;
let last = 0;

function ensure() {
  if (ctx) return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  const len = ctx.sampleRate * 1.2;
  noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
}

function burst(opts: { dur: number; freq: number; q: number; gain: number; type?: BiquadFilterType; sweep?: number }) {
  if (!enabled || !ctx || !noise) return;
  const now = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = opts.type ?? 'bandpass';
  filter.frequency.setValueAtTime(opts.freq, now);
  if (opts.sweep) filter.frequency.exponentialRampToValueAtTime(opts.sweep, now + opts.dur);
  filter.Q.value = opts.q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(opts.gain, now + opts.dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, now + opts.dur);
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start(now, Math.random() * 0.5, opts.dur + 0.05);
}

export const sound = {
  pageTurn() {
    const t = performance.now();
    if (t - last < 350) return;
    last = t;
    burst({ dur: 0.42, freq: 900, sweep: 2600, q: 0.7, gain: 0.16 });
  },
  pen() {
    burst({ dur: 0.18, freq: 3800, q: 2.5, gain: 0.05, type: 'bandpass' });
    setTimeout(() => burst({ dur: 0.14, freq: 4400, q: 3, gain: 0.04 }), 120);
  },
};

export function initSound() {
  const btn = $('[data-sound]');
  if (!btn) return;
  const set = (on: boolean) => {
    enabled = on;
    btn.setAttribute('aria-pressed', String(on));
    store.set('marginalia-sound', on ? '1' : '0');
    if (on) {
      ensure();
      void ctx?.resume();
      sound.pageTurn();
    }
  };
  // Always starts off. The choice is remembered only to label the button helpfully.
  if (store.get('marginalia-sound') === '1') btn.title = 'You had sound on earlier. Click to turn it back on.';
  btn.addEventListener('click', () => set(!enabled));
}
