/* Collage-explainer scenes: paper, cut-outs and prints that arrive on their words, callouts, hand-drawn
   circles and arrows, a Europe map, a timeline and highlighted documents. Positions are in a 1920 x 1080
   design frame; the scene is scaled to the real frame. Each item's `f` is its entrance, in frames from the
   start of its scene (pipeline/build_doc.py turns a spoken cue into it). */
import '@fontsource/caveat/700.css';
import '@fontsource/eb-garamond/500.css';
import '@fontsource/oswald/500.css';
import '@fontsource/oswald/700.css';
import {createContext, useContext} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {DocShot} from './types';

export const INK = '#1d1a17';

/* Colour themes: the paper, and everything drawn on it. A scene can pick its own (shot.theme). */
export type Theme = {paper: string; text: string; tagBg: string; tagText: string; hl: string; hlText: string; red: string;
  note: string; card: string; land: string; landLine: string; hatch: string; river: string; pin: string; sub: string;
  accent: string; grainBlend: 'multiply' | 'overlay'; grainOpacity: number; scrap: [string, string]};
export const THEMES: Record<string, Theme> = {
  parchment: {scrap: ['#e4d9c0', '#d8cbad'], paper: 'paper', text: INK, tagBg: INK, tagText: '#fff', hl: '#ffd23f', hlText: INK, red: '#d23a2a', note: '#d23a2a',
    card: '#fbf8f1', land: '#e2d6bb', landLine: INK, hatch: '#b9ab8c', river: '#7d9bb0', pin: '#d23a2a', sub: '#5c5348',
    accent: '#d23a2a', grainBlend: 'multiply', grainOpacity: 0.35},
  night: {scrap: ['#1f3d47', '#2a4f5a'], paper: 'paper_night', text: '#f3e9d6', tagBg: '#f3e9d6', tagText: '#13252c', hl: '#ff8c2a', hlText: '#1b1209',
    red: '#ff6a3d', note: '#ffb347', card: '#efe3c8', land: '#2f5965', landLine: '#efe3c8', hatch: '#3a6a75', river: '#5fa3bd',
    pin: '#ff6a3d', sub: '#9fb7bb', accent: '#ff8c2a', grainBlend: 'overlay', grainOpacity: 0.5},
  crimson: {scrap: ['#6c1d21', '#7e272b'], paper: 'paper_crimson', text: '#f6ead2', tagBg: '#140b0b', tagText: '#f6ead2', hl: '#f5b331', hlText: '#1a0d06',
    red: '#ffd166', note: '#ffd166', card: '#f1e5cb', land: '#8c2c30', landLine: '#f6e7c8', hatch: '#9a3539', river: '#e9a46a',
    pin: '#ffd166', sub: '#e2b8a8', accent: '#f5b331', grainBlend: 'overlay', grainOpacity: 0.5},
  forest: {scrap: ['#21422f', '#2c573d'], paper: 'paper_forest', text: '#f1ead6', tagBg: '#f1ead6', tagText: '#10241a', hl: '#e8c547', hlText: '#14200f',
    red: '#ff7b54', note: '#ffcf6b', card: '#efe6cd', land: '#386650', landLine: '#efe5cb', hatch: '#437559', river: '#7fb7a8',
    pin: '#ff7b54', sub: '#a9c1b0', accent: '#e8c547', grainBlend: 'overlay', grainOpacity: 0.5},
};
export const ThemeCtx = createContext<Theme>(THEMES.night);

/* ---------------------------------------------------------------- collage decoration */
const rng = (seed: number) => {
  let x = Math.abs(Math.floor(seed * 9301 + 49297)) % 233280 || 1;
  return () => ((x = (x * 9301 + 49297) % 233280) / 233280);
};

/* A torn-paper outline for a w x h rectangle, as a CSS clip-path polygon (in px). */
export const torn = (w: number, h: number, seed: number, rough = 10) => {
  const r = rng(seed);
  const pts: string[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number, n: number, nx: number, ny: number) => {
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const j = (r() - 0.5) * rough * 2 + (r() < 0.12 ? (r() - 0.5) * rough * 3 : 0);
      pts.push(`${(x0 + (x1 - x0) * u + nx * j).toFixed(1)}px ${(y0 + (y1 - y0) * u + ny * j).toFixed(1)}px`);
    }
  };
  edge(0, 0, w, 0, Math.max(8, Math.round(w / 18)), 0, 1);
  edge(w, 0, w, h, Math.max(8, Math.round(h / 18)), -1, 0);
  edge(w, h, 0, h, Math.max(8, Math.round(w / 18)), 0, -1);
  edge(0, h, 0, 0, Math.max(8, Math.round(h / 18)), 1, 0);
  return `polygon(${pts.join(', ')})`;
};

const HALFTONE = (c: string) => `radial-gradient(circle, ${c} 1.6px, transparent 2.2px) 0 0 / 11px 11px`;
const SCRAPS = ['anglo_saxon_chronicle_d.jpg', 'beowulf_first_page.jpg', 'harley3244_elephant_dragon_page.jpg', 'kircher_dragon.jpg'];

/* Paper scraps, manuscript clippings, halftone patches and tape behind a scene. Placed by a seed, so
   every scene is different but renders the same on every machine; kept to the edges of the frame. */
export const Decor = ({seed, story}: {seed: number; story: string}) => {
  const T = useT();
  const r = rng(seed);
  const corner = (k: number) => [[-120, -80], [1500, -120], [-160, 760], [1480, 720]][k % 4];
  const order = [0, 1, 2, 3].sort(() => r() - 0.5);
  const els: React.ReactNode[] = [];
  // two big torn sheets in the chapter's colours
  for (let i = 0; i < 2; i++) {
    const [x, y] = corner(order[i]);
    const w = 620 + r() * 380;
    const h = 420 + r() * 300;
    els.push(<div key={`s${i}`} style={{position: 'absolute', left: x, top: y, width: w, height: h, background: T.scrap[i],
      clipPath: torn(w, h, seed + i * 7, 12), transform: `rotate(${(r() - 0.5) * 16}deg)`,
      boxShadow: '0 0 0 rgba(0,0,0,0)'}} />);
  }
  // a clipping of a real manuscript page, faint
  {
    const [x, y] = corner(order[2]);
    const w = 520 + r() * 200;
    const h = 380 + r() * 160;
    const src = SCRAPS[Math.floor(r() * SCRAPS.length)];
    els.push(
      <div key="m" style={{position: 'absolute', left: x + 60, top: y + 40, width: w, height: h, clipPath: torn(w, h, seed + 31, 9),
        transform: `rotate(${(r() - 0.5) * 14}deg)`, opacity: T.grainBlend === 'overlay' ? 0.2 : 0.35, overflow: 'hidden'}}>
        <Img src={staticFile(`${story}/art/${src}`)} style={{width: w * 1.6, marginLeft: -w * 0.2 * r(), marginTop: -h * 0.3 * r(),
          filter: 'grayscale(1) contrast(1.2)'}} />
      </div>,
    );
  }
  // a halftone patch and a cut-out circle
  {
    const [x, y] = corner(order[3]);
    const w = 380 + r() * 200;
    els.push(<div key="h" style={{position: 'absolute', left: x + 120, top: y + 80, width: w, height: w * 0.7,
      background: HALFTONE(T.grainBlend === 'overlay' ? 'rgba(255,240,210,0.18)' : 'rgba(40,30,20,0.18)'),
      clipPath: torn(w, w * 0.7, seed + 47, 14), transform: `rotate(${(r() - 0.5) * 20}deg)`}} />);
    const d = 160 + r() * 140;
    els.push(<div key="c" style={{position: 'absolute', left: 200 + r() * 1500, top: r() < 0.5 ? -d * 0.4 : 1080 - d * 0.6,
      width: d, height: d, borderRadius: '50%', background: T.hl, opacity: 0.85}} />);
  }
  // loose tape strips
  for (let i = 0; i < 2; i++) {
    els.push(<div key={`t${i}`} style={{position: 'absolute', left: 100 + r() * 1700, top: r() < 0.5 ? 30 + r() * 80 : 960 + r() * 60,
      width: 170, height: 44, background: 'rgba(233,222,190,0.55)', transform: `rotate(${(r() - 0.5) * 50}deg)`,
      clipPath: torn(170, 44, seed + 60 + i, 3)}} />);
  }
  return <>{els}</>;
};
const useT = () => useContext(ThemeCtx);
const ease = Easing.bezier(0.33, 0, 0.2, 1);

export type Item = {
  type: 'img' | 'label' | 'callout' | 'circle' | 'arrow' | 'big' | 'strike' | 'note' | 'clip' | 'tape';
  f?: number; // entrance frame, from the scene's start
  out?: number; // optional exit frame
  x?: number; y?: number; w?: number; h?: number; rot?: number;
  src?: string; look?: 'print' | 'ink' | 'sticker' | 'duotone' | 'plain' | 'torn';
  crop?: [number, number, number, number]; // x0, y0, x1, y1 as fractions of the image
  enter?: 'pop' | 'left' | 'right' | 'up' | 'down' | 'fade' | 'drop';
  text?: string; size?: number; color?: string; bg?: 'black' | 'yellow' | 'red' | 'none'; align?: 'left' | 'center' | 'right';
  to?: [number, number]; // callout / arrow target
  rx?: number; ry?: number; bend?: number;
  clip_start?: number;
  ar?: number; // height / width of the picture (the builder fills it in)
};

const local = (frame: number, shot: DocShot) => frame - shot.from;

const enterStyle = (t: number, it: Item, fps: number) => {
  const s = spring({frame: t, fps, config: {damping: 14, stiffness: 140, mass: 0.7}});
  const p = interpolate(t, [0, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  switch (it.enter ?? 'pop') {
    case 'left': return {transform: `translateX(${(1 - p) * -1400}px)`, opacity: t < 0 ? 0 : 1};
    case 'right': return {transform: `translateX(${(1 - p) * 1400}px)`, opacity: t < 0 ? 0 : 1};
    case 'up': return {transform: `translateY(${(1 - p) * 900}px)`, opacity: t < 0 ? 0 : 1};
    case 'down': return {transform: `translateY(${(1 - p) * -900}px)`, opacity: t < 0 ? 0 : 1};
    case 'fade': return {opacity: p};
    case 'drop': return {transform: `scale(${1.25 - 0.25 * s})`, opacity: Math.min(1, t / 4)};
    default: return {transform: `scale(${0.6 + 0.4 * s})`, opacity: t < 0 ? 0 : Math.min(1, t / 3)};
  }
};

/* A wobbly, hand-drawn ellipse as an SVG path. */
const wobblyEllipse = (rx: number, ry: number, seed: number) => {
  const pts: string[] = [];
  const n = 48;
  for (let i = 0; i <= n + 6; i++) {
    const a = (i / n) * Math.PI * 2 - 0.4;
    const k = 1 + 0.035 * Math.sin(i * 1.7 + seed) + 0.02 * Math.sin(i * 3.1 + seed * 2) + (i > n ? 0.06 * (i - n) / 6 : 0);
    pts.push(`${(Math.cos(a) * rx * k).toFixed(1)},${(Math.sin(a) * ry * k).toFixed(1)}`);
  }
  return 'M' + pts.join('L');
};

const ImgItem = ({it, story}: {it: Item; story: string}) => {
  const T = useT();
  const w = it.w ?? 600;
  const src = staticFile(`${story}/art/${it.src}`);
  const [cx0, cy0, cx1, cy1] = it.crop ?? [0, 0, 1, 1];
  const inner = (
    <div style={{width: w, height: it.h ?? undefined, overflow: 'hidden', position: 'relative'}}>
      <Img src={src} style={{
        display: 'block', width: w / (cx1 - cx0), marginLeft: (-cx0 * w) / (cx1 - cx0),
        marginTop: (-cy0 * w * (it.ar ?? 0.75)) / (cx1 - cx0),
        // a woodcut as transparent ink (art/*_ink.png): dark lines on light paper, light chalky lines on dark paper
        filter: it.look === 'duotone' ? 'grayscale(1) sepia(0.55) contrast(1.15) brightness(1.02)'
          : it.look === 'ink' && T.grainBlend === 'overlay' ? 'invert(1) sepia(0.3) brightness(1.05)' : undefined,
      }} />
    </div>
  );
  if (it.look === 'sticker') {
    return (
      <Img src={src} style={{width: w, display: 'block', filter:
        'drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(0 14px 18px rgba(0,0,0,0.35))'}} />
    );
  }
  if (it.look === 'ink' || it.look === 'plain') return inner;
  if (it.look === 'torn') { // a print torn out of a page: ragged white edge, the picture inside it
    const seed = Math.round((it.x ?? 0) * 7 + (it.y ?? 0) * 3 + w);
    const ih = it.h ?? 0;
    return (
      <div style={{filter: 'drop-shadow(0 16px 22px rgba(0,0,0,0.45))'}}>
        <div style={{background: T.card, padding: 22, clipPath: ih ? torn(w + 44, ih + 44, seed, 9) : undefined}}>
          {inner}
        </div>
      </div>
    );
  }
  return ( // a print: white border, shadow, a strip of tape
    <div style={{background: T.card, padding: 14, boxShadow: '0 18px 40px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.25)',
      position: 'relative'}}>
      {inner}
      <div style={{position: 'absolute', top: -18, left: '50%', width: 150, height: 40, marginLeft: -75,
        background: 'rgba(233,222,190,0.78)', transform: 'rotate(-3deg)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)'}} />
    </div>
  );
};

const Label = ({it}: {it: Item}) => {
  const T = useT();
  const size = it.size ?? 54;
  const bg = it.bg ?? 'black';
  const colors = {black: [T.tagBg, T.tagText], yellow: [T.hl, T.hlText], red: [T.red, T.hlText], none: ['transparent', it.color ?? T.text]}[bg];
  return (
    <div style={{fontFamily: 'Oswald', fontWeight: 700, fontSize: size, lineHeight: 1.05, textTransform: 'uppercase',
      letterSpacing: '0.02em', background: colors[0], color: colors[1], padding: bg === 'none' ? 0 : `${size * 0.12}px ${size * 0.3}px`,
      whiteSpace: 'pre', boxShadow: bg === 'none' ? undefined : '0 6px 14px rgba(0,0,0,0.25)'}}>
      {it.text}
    </div>
  );
};

/* One item, placed (x, y = its centre) and animated in. */
const Placed = ({it, t, story, start = 0}: {it: Item; t: number; story: string; start?: number}) => {
  const T = useT();
  const {fps} = useVideoConfig();
  if (t < 0) return null;
  const exit = it.out !== undefined ? interpolate(t, [it.out - (it.f ?? 0), it.out - (it.f ?? 0) + 8], [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const anchor = it.align === 'left' ? '0%' : it.align === 'right' ? '-100%' : '-50%';
  const base = {position: 'absolute' as const, left: it.x ?? 960, top: it.y ?? 540,
    transform: `translate(${anchor}, -50%) rotate(${it.rot ?? 0}deg)`};
  const e = enterStyle(t, it, fps);
  let body: React.ReactNode = null;
  if (it.type === 'img') body = <ImgItem it={it} story={story} />;
  else if (it.type === 'label') body = <Label it={it} />;
  else if (it.type === 'note') {
    body = <div style={{fontFamily: 'Caveat', fontWeight: 700, fontSize: it.size ?? 56, color: it.color ?? T.note,
      whiteSpace: 'pre', lineHeight: 1, textShadow: '0 2px 0 rgba(0,0,0,0.55), 0 0 14px rgba(0,0,0,0.55)'}}>{it.text}</div>;
  } else if (it.type === 'big') {
    const p = interpolate(t, [6, 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
    body = (
      <div style={{fontFamily: 'Oswald', fontWeight: 700, fontSize: it.size ?? 220, lineHeight: 0.95, color: it.color ?? T.text,
        whiteSpace: 'pre', padding: '0 24px 0.12em',
        // a highlighter stroke behind the lower half; on dark paper a thick underline reads better
        background: it.bg === 'yellow' ? (T.grainBlend === 'overlay'
          ? `linear-gradient(${T.hl}, ${T.hl}) no-repeat 0 100% / ${p * 100}% 14%`
          : `linear-gradient(${T.hl}, ${T.hl}) no-repeat 0 78% / ${p * 100}% 38%`) : undefined}}>
        {it.text}
      </div>
    );
  } else if (it.type === 'clip') {
    const plain = it.look === 'plain';
    body = (
      <div style={plain ? {} : {background: T.card, padding: 14, boxShadow: '0 18px 40px rgba(0,0,0,0.45)'}}>
        <div style={{width: it.w ?? 900, height: it.h ?? 506, overflow: 'hidden'}}>
          <Sequence from={start} layout="none">
            <OffthreadVideo src={staticFile(`${story}/clips/${it.src}`)} startFrom={Math.round((it.clip_start ?? 0) * fps)} muted
              style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </Sequence>
        </div>
      </div>
    );
  }
  return (
    <div style={{...base, opacity: exit}}>
      <div style={e}>{body}</div>
    </div>
  );
};

/* Lines drawn over the scene: circles, arrows, callout leaders, strike-throughs. */
const Strokes = ({items, t0}: {items: Item[]; t0: number}) => {
  const T = useT();
  return <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {items.map((it, i) => {
      const t = t0 - (it.f ?? 0);
      if (t < 0) return null;
      const p = interpolate(t, [0, it.type === 'strike' ? 8 : 16], [0, 1], {extrapolateRight: 'clamp', easing: ease});
      const color = it.color ?? T.red;
      if (it.type === 'circle') {
        const d = wobblyEllipse(it.rx ?? 120, it.ry ?? it.rx ?? 120, i * 1.3);
        return <path key={i} d={d} transform={`translate(${it.x} ${it.y}) rotate(${it.rot ?? -6})`} fill="none" stroke={color}
          strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />;
      }
      if (it.type === 'arrow' || it.type === 'callout') {
        const [x0, y0] = it.type === 'arrow' ? [it.x ?? 0, it.y ?? 0] : [it.x ?? 0, it.y ?? 0];
        const [x1, y1] = it.to ?? [x0 + 200, y0];
        const mx = (x0 + x1) / 2 - (y1 - y0) * (it.bend ?? 0.2);
        const my = (y0 + y1) / 2 + (x1 - x0) * (it.bend ?? 0.2);
        const ang = Math.atan2(y1 - my, x1 - mx);
        const head = p > 0.95 ? (
          <path d={`M${x1 - 30 * Math.cos(ang - 0.45)},${y1 - 30 * Math.sin(ang - 0.45)} L${x1},${y1} L${x1 - 30 * Math.cos(ang + 0.45)},${y1 - 30 * Math.sin(ang + 0.45)}`}
            fill="none" stroke={it.type === 'callout' ? T.text : color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        ) : null;
        return (
          <g key={i}>
            <path d={`M${x0},${y0} Q${mx},${my} ${x1},${y1}`} fill="none" stroke={it.type === 'callout' ? T.text : color} strokeWidth={7}
              strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
            {head}
          </g>
        );
      }
      if (it.type === 'strike') {
        const w = it.w ?? 400;
        return <line key={i} x1={(it.x ?? 0) - w / 2} y1={(it.y ?? 0) + 10} x2={(it.x ?? 0) - w / 2 + w * p} y2={(it.y ?? 0) - 10}
          stroke={color} strokeWidth={16} strokeLinecap="round" />;
      }
      return null;
    })}
  </svg>;
};

export const Paper = ({story, dark}: {story: string; dark?: boolean}) => {
  const T = useT();
  const frame = useCurrentFrame();
  const jx = ((frame * 37) % 97) - 48;
  const jy = ((frame * 53) % 89) - 44;
  return (
    <AbsoluteFill>
      <Img src={staticFile(`${story}/fx/${dark ? 'paper_dark' : T.paper}.jpg`)}
        style={{position: 'absolute', width: '104%', height: '104%', left: '-2%', top: '-2%', objectFit: 'cover'}} />
      <Img src={staticFile(`${story}/fx/grain.png`)}
        style={{position: 'absolute', width: '110%', height: '110%', left: -96 + jx, top: -54 + jy, opacity: T.grainOpacity, mixBlendMode: T.grainBlend}} />
    </AbsoluteFill>
  );
};

/* The camera on a scene: a slow move between two views (centre x, centre y, zoom) of the design frame. */
const camTransform = (shot: DocShot & {cam?: {from: number[]; to: number[]}}, frame: number, depth = 1) => {
  const [x0, y0, z0] = shot.cam?.from ?? [960, 540, 1];
  const [x1, y1, z1] = shot.cam?.to ?? [960, 540, 1.04];
  const p = depth * interpolate(frame, [shot.from, shot.to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  const z = z0 + (z1 - z0) * p;
  const x = x0 + (x1 - x0) * p;
  const y = y0 + (y1 - y0) * p;
  return `translate(${960 - x * z}px, ${540 - y * z}px) scale(${z})`;
};

const Stage = ({children}: {children: React.ReactNode}) => {
  const {width, height} = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', width: 1920, height: 1080, left: (width - 1920 * s) / 2, top: (height - 1080 * s) / 2,
        transform: `scale(${s})`, transformOrigin: '0 0'}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

type SceneShot = DocShot & {items?: Item[]; cam?: {from: number[]; to: number[]}; dark?: boolean; decor?: boolean};

export const Scene = ({shot, story}: {shot: SceneShot; story: string}) => {
  const frame = useCurrentFrame();
  const t0 = local(frame, shot);
  const items = shot.items ?? [];
  const lines = items.filter((it) => ['circle', 'arrow', 'callout', 'strike'].includes(it.type));
  return (
    <AbsoluteFill>
      <Paper story={story} dark={shot.dark} />
      <Stage>
        {shot.decor === false ? null : (
          <div style={{position: 'absolute', inset: 0, transform: camTransform(shot, frame, 0.4), transformOrigin: '0 0'}}>
            <Decor seed={shot.from + 17} story={story} />
          </div>
        )}
        <div style={{position: 'absolute', inset: 0, transform: camTransform(shot, frame), transformOrigin: '0 0'}}>
          {items.filter((it) => it.type !== 'callout').map((it, i) => (
            <Placed key={i} it={it} t={t0 - (it.f ?? 0)} story={story} start={shot.from + (it.f ?? 0)} />
          ))}
          <Strokes items={lines} t0={t0} />
          {items.filter((it) => it.type === 'callout').map((it, i) => (
            <Placed key={`c${i}`} it={{...it, type: 'label', enter: 'pop'}} t={t0 - (it.f ?? 0)} story={story} />
          ))}
        </div>
      </Stage>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ map */
export type MapData = {lon0: number; lat1: number; cos: number; k: number; width: number; height: number; land: string; rivers: string};
type Pin = {name: string; lat: number; lon: number; f?: number; side?: 'left' | 'right'; color?: string};
type MapShot = DocShot & {pins?: Pin[]; view?: {from: number[]; to: number[]}; items?: Item[]; routes?: {from: number; to: number; f?: number}[]};

export const MapScene = ({shot, story, map}: {shot: MapShot; story: string; map: MapData | null}) => {
  const T = useT();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!map) return <Paper story={story} />;
  const t0 = local(frame, shot);
  const P = (lon: number, lat: number) => [(lon - map.lon0) * map.cos * map.k, (map.lat1 - lat) * map.k];
  // view: centre lon, centre lat, zoom (1 = the whole map width across the frame)
  const [lo0, la0, z0] = shot.view?.from ?? [12, 48, 1];
  const [lo1, la1, z1] = shot.view?.to ?? [lo0, la0, z0 * 1.08];
  const p = interpolate(frame, [shot.from, shot.to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  const z = z0 + (z1 - z0) * p;
  const [cx, cy] = P(lo0 + (lo1 - lo0) * p, la0 + (la1 - la0) * p);
  const vw = map.width / z;
  const vh = (vw * 1080) / 1920;
  const unit = vw / 1920; // map units per design pixel, to keep strokes and labels a constant size
  return (
    <AbsoluteFill>
      <Paper story={story} />
      <Stage>
        <svg width={1920} height={1080} viewBox={`${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}`} style={{position: 'absolute'}}>
          <defs>
            <pattern id="hatch" width={14 * unit} height={14 * unit} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <line x1={0} y1={0} x2={0} y2={14 * unit} stroke={T.hatch} strokeWidth={2 * unit} opacity={0.6} />
            </pattern>
          </defs>
          <path d={map.land} fill={T.land} stroke={T.landLine} strokeWidth={2.2 * unit} strokeLinejoin="round" />
          <path d={map.land} fill="url(#hatch)" />
          <path d={map.rivers} fill="none" stroke={T.river} strokeWidth={1.6 * unit} opacity={0.7} />
          {(shot.routes ?? []).map((r, i) => {
            const a = shot.pins![r.from];
            const b = shot.pins![r.to];
            const [x0, y0] = P(a.lon, a.lat);
            const [x1, y1] = P(b.lon, b.lat);
            const q = interpolate(t0 - (r.f ?? 0), [0, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
            const mx = (x0 + x1) / 2 - (y1 - y0) * 0.25;
            const my = (y0 + y1) / 2 + (x1 - x0) * 0.25;
            return <path key={i} d={`M${x0},${y0} Q${mx},${my} ${x1},${y1}`} fill="none" stroke={T.pin} strokeWidth={6 * unit}
              strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - q} />;
          })}
        </svg>
        {(shot.pins ?? []).map((pin, i) => {
          const t = t0 - (pin.f ?? 0);
          if (t < 0) return null;
          const [px, py] = P(pin.lon, pin.lat);
          const sx = (px - (cx - vw / 2)) / unit;
          const sy = (py - (cy - vh / 2)) / unit;
          const s = spring({frame: t, fps, config: {damping: 12, stiffness: 160}});
          const ring = interpolate(t % 45, [0, 45], [0, 1]);
          const right = pin.side !== 'left';
          return (
            <div key={i} style={{position: 'absolute', left: sx, top: sy}}>
              <div style={{position: 'absolute', width: 70, height: 70, left: -35, top: -35, borderRadius: '50%',
                border: `4px solid ${pin.color ?? T.pin}`, transform: `scale(${0.3 + ring})`, opacity: 1 - ring}} />
              <div style={{position: 'absolute', width: 26, height: 26, left: -13, top: -13, borderRadius: '50%',
                background: pin.color ?? T.pin, border: '5px solid #fff', boxShadow: '0 3px 8px rgba(0,0,0,0.35)', transform: `scale(${s})`}} />
              <div style={{position: 'absolute', top: -30, [right ? 'left' : 'right']: 30, transform: `scale(${s})`,
                transformOrigin: right ? '0 50%' : '100% 50%', fontFamily: 'Oswald', fontWeight: 700, fontSize: 40, color: T.tagText,
                background: T.tagBg, padding: '4px 14px', whiteSpace: 'pre', textTransform: 'uppercase'}}>{pin.name}</div>
            </div>
          );
        })}
        {(shot.items ?? []).map((it, i) => <Placed key={i} it={it} t={t0 - (it.f ?? 0)} story={story} start={shot.from + (it.f ?? 0)} />)}
      </Stage>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ timeline */
type TLEvent = {year: number; label: string; f?: number; up?: boolean};
type TimelineShot = DocShot & {events?: TLEvent[]; range?: [number, number]; focus?: {from: [number, number]; to: [number, number]}};

export const TimelineScene = ({shot, story}: {shot: TimelineShot; story: string}) => {
  const T = useT();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t0 = local(frame, shot);
  const [a0, b0] = shot.focus?.from ?? shot.range ?? [500, 1600];
  const [a1, b1] = shot.focus?.to ?? [a0, b0];
  const p = interpolate(frame, [shot.from, shot.to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  const A = a0 + (a1 - a0) * p;
  const B = b0 + (b1 - b0) * p;
  const X = (y: number) => 120 + ((y - A) / (B - A)) * 1680;
  const ticks = [];
  for (let y = Math.ceil(A / 100) * 100; y <= B; y += 100) ticks.push(y);
  const grow = interpolate(t0, [0, 20], [0, 1], {extrapolateRight: 'clamp', easing: ease});
  return (
    <AbsoluteFill>
      <Paper story={story} />
      <Stage>
        <div style={{position: 'absolute', left: 120, top: 560, width: 1680 * grow, height: 10, background: T.text}} />
        {ticks.map((y) => (
          <div key={y} style={{position: 'absolute', left: X(y), top: 540, opacity: grow}}>
            <div style={{position: 'absolute', left: -3, width: 6, height: 50, background: T.text}} />
            <div style={{position: 'absolute', left: -60, width: 120, top: 62, textAlign: 'center', fontFamily: 'Oswald', fontWeight: 500,
              fontSize: 36, color: T.sub}}>{y}</div>
          </div>
        ))}
        {(shot.events ?? []).map((ev, i) => {
          const t = t0 - (ev.f ?? 0);
          if (t < 0) return null;
          const s = spring({frame: t, fps, config: {damping: 13, stiffness: 150}});
          const up = ev.up ?? i % 2 === 0;
          return (
            <div key={i} style={{position: 'absolute', left: X(ev.year), top: 565}}>
              <div style={{position: 'absolute', width: 34, height: 34, left: -17, top: -17, borderRadius: '50%', background: T.red,
                border: '6px solid #fff', boxShadow: '0 3px 8px rgba(0,0,0,0.3)', transform: `scale(${s})`}} />
              <div style={{position: 'absolute', left: -2, width: 4, height: 110 * s, top: up ? -130 : 20, background: T.text}} />
              <div style={{position: 'absolute', top: up ? -290 : 135, left: 0, transform: `translateX(-50%) scale(${s})`,
                textAlign: 'center', whiteSpace: 'pre'}}>
                <div style={{fontFamily: 'Oswald', fontWeight: 700, fontSize: 78, color: T.accent, lineHeight: 1}}>{ev.year}</div>
                <div style={{fontFamily: 'Oswald', fontWeight: 700, fontSize: 52, color: T.tagText, background: T.tagBg, padding: '4px 16px',
                  textTransform: 'uppercase'}}>{ev.label}</div>
              </div>
            </div>
          );
        })}
      </Stage>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ document */
type DocItem = DocShot & {highlights?: {words: string; f?: number}[]};

export const DocumentScene = ({shot, story}: {shot: DocItem; story: string}) => {
  const T = useT();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t0 = local(frame, shot);
  const words = (shot.text ?? '').split(' ');
  // which highlight (if any) each word belongs to
  const marks: (number | null)[] = words.map(() => null);
  (shot.highlights ?? []).forEach((h, hi) => {
    const target = h.words.toLowerCase().split(' ');
    for (let i = 0; i + target.length <= words.length; i++) {
      if (target.every((w, k) => words[i + k].toLowerCase().replace(/[^a-z0-9]/g, '') === w.replace(/[^a-z0-9]/g, ''))) {
        for (let k = 0; k < target.length; k++) marks[i + k] = hi;
        break;
      }
    }
  });
  const s = spring({frame: t0, fps, config: {damping: 15, stiffness: 120}});
  const typed = Math.floor(interpolate(t0, [6, 6 + words.length * 1.6], [0, words.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <AbsoluteFill>
      <Paper story={story} />
      <Stage>
        <Decor seed={shot.from + 9} story={story} />
        <div style={{position: 'absolute', left: 230, top: 540, width: 1460, padding: '70px 90px 60px', background: '#fbf7ec',
          translate: '0 -50%',
          boxShadow: '0 24px 60px rgba(30,20,10,0.35)', transform: `translateY(${(1 - s) * 500}px) rotate(-1.2deg)`}}>
          <div style={{fontFamily: 'EB Garamond', fontWeight: 500, fontSize: 78, lineHeight: 1.3, color: INK}}>
            {words.map((w, i) => {
              const hi = marks[i];
              const h = hi === null ? null : (shot.highlights ?? [])[hi];
              const q = h ? interpolate(t0 - (h.f ?? 0), [0, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease}) : 0;
              return (
                <span key={i} style={{opacity: i < typed ? 1 : 0, background: h ? `linear-gradient(${T.hl}, ${T.hl}) no-repeat 0 85% / ${q * 100}% 55%` : undefined}}>
                  {w}{' '}
                </span>
              );
            })}
          </div>
          <div style={{marginTop: 40, fontFamily: 'Oswald', fontWeight: 500, fontSize: 32, letterSpacing: '0.12em', color: '#b8322a'}}>
            {shot.by}
          </div>
        </div>
      </Stage>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ chapter */
export const ChapterScene = ({shot, story}: {shot: DocShot & {num?: string}; story: string}) => {
  const T = useT();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t0 = local(frame, shot);
  const s = spring({frame: t0, fps, config: {damping: 14, stiffness: 120}});
  const hl = interpolate(t0, [12, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  return (
    <AbsoluteFill>
      <Paper story={story} />
      <Stage>
        <Decor seed={shot.from + 5} story={story} />
        <div style={{position: 'absolute', left: 170, top: 250, fontFamily: 'Oswald', fontWeight: 700, fontSize: 380, lineHeight: 0.8,
          color: T.accent, transform: `translateX(${(1 - s) * -600}px)`}}>{shot.num}</div>
        <div style={{position: 'absolute', left: 640, top: 380, transform: `translateX(${(1 - s) * 900}px)`}}>
          <div style={{fontFamily: 'Oswald', fontWeight: 500, fontSize: 40, letterSpacing: '0.3em', color: T.sub}}>CHAPTER</div>
          <div style={{fontFamily: 'Oswald', fontWeight: 700, fontSize: 120, lineHeight: 1.05, color: T.text, textTransform: 'uppercase',
            padding: '0 10px 0.1em', background: T.grainBlend === 'overlay'
              ? `linear-gradient(${T.hl}, ${T.hl}) no-repeat 0 100% / ${hl * 100}% 12%`
              : `linear-gradient(${T.hl}, ${T.hl}) no-repeat 0 80% / ${hl * 100}% 40%`}}>{shot.title}</div>
        </div>
      </Stage>
    </AbsoluteFill>
  );
};
