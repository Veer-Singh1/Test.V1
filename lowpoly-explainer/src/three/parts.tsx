import {useMemo} from 'react';
import {random} from 'remotion';
import * as THREE from 'three';

export type V3 = [number, number, number];

export const rnd = (seed: string | number) => random(`lp-${seed}`);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type MatProps = {c: string; e?: number; ec?: string; opacity?: number};

// Every surface is flat-shaded, fully rough and untextured.
export const Mat = ({c, e = 0, ec, opacity}: MatProps) => (
  <meshStandardMaterial
    color={c}
    flatShading
    roughness={1}
    metalness={0}
    emissive={ec ?? c}
    emissiveIntensity={e}
    transparent={opacity !== undefined}
    opacity={opacity ?? 1}
  />
);

export const B = ({p, s, r, ...m}: {p: V3; s: V3; r?: V3} & MatProps) => (
  <mesh position={p} rotation={r}>
    <boxGeometry args={s} />
    <Mat {...m} />
  </mesh>
);

export const Cyl = ({p, s, r, seg = 8, ...m}: {p: V3; s: [number, number, number]; r?: V3; seg?: number} & MatProps) => (
  <mesh position={p} rotation={r}>
    <cylinderGeometry args={[s[0], s[1], s[2], seg]} />
    <Mat {...m} />
  </mesh>
);

// Soft halo around a light source. Additive, so it reads as bloom without a post pass.
export const Glow = ({p, size, c, strength = 0.5}: {p: V3; size: number; c: string; strength?: number}) => {
  const tex = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const g = cv.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }, []);
  return (
    <sprite position={p} scale={[size, size, 1]}>
      <spriteMaterial map={tex} color={c} opacity={strength} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
};

// A lamp is an emissive bulb, a halo and (optionally) a real light.
export const Lamp = ({p, c = '#ffc46b', power = 14, size = 0.18, halo = 2.2, light = true}: {p: V3; c?: string; power?: number; size?: number; halo?: number; light?: boolean}) => (
  <group position={p}>
    <mesh>
      <icosahedronGeometry args={[size, 0]} />
      <meshBasicMaterial color={c} />
    </mesh>
    <Glow p={[0, 0, 0]} size={halo} c={c} />
    {light ? <pointLight color={c} intensity={power} distance={18} decay={1.6} /> : null}
  </group>
);

// Text for signs and documents, drawn to a canvas. Outfit is loaded before any scene mounts.
export const useLabel = (text: string, o: {w?: number; h?: number; bg?: string; fg?: string; size?: number} = {}) =>
  useMemo(() => {
    const {w = 512, h = 128, bg = '#14161c', fg = '#f4e6c2', size = 64} = o;
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const g = cv.getContext('2d')!;
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    g.font = `800 ${size}px Outfit, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + size * 0.04);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [text, o.w, o.h, o.bg, o.fg, o.size]);

export const Sign = ({p, s, r, text, bg, fg, e = 0.9}: {p: V3; s: [number, number]; r?: V3; text: string; bg?: string; fg?: string; e?: number}) => {
  const tex = useLabel(text, {w: 512, h: Math.round((512 * s[1]) / s[0]), bg, fg, size: Math.round((512 * s[1]) / s[0] * 0.55)});
  return (
    <mesh position={p} rotation={r}>
      <planeGeometry args={s} />
      <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={e} roughness={1} />
    </mesh>
  );
};

/* The character: a faceted head on a tapered six-sided coat, no limbs.
   Coat colour says who it is; an optional hat separates roles. */
export const SKIN = '#e3c3a0';
export const HERO = '#d9a441';
export const Figure = ({p, coat, rot = 0, hat, lying = false, scale = 1, mask, carry}: {p: V3; coat: string; rot?: number; hat?: 'cap' | 'beanie' | 'brim'; lying?: boolean; scale?: number; mask?: string; carry?: boolean}) => (
  <group position={lying ? [p[0], p[1] + 0.34, p[2]] : p} rotation={[0, rot, 0]} scale={scale}>
  <group rotation={[lying ? -Math.PI / 2 : 0, 0, 0]}>
    <Cyl p={[0, 0.62, 0]} s={[0.2, 0.37, 1.24]} seg={6} c={coat} />
    <Cyl p={[0, 1.26, 0]} s={[0.26, 0.2, 0.1]} seg={6} c="#2a2a30" />
    <mesh position={[0, 1.54, 0]}>
      <icosahedronGeometry args={[0.25, 0]} />
      <Mat c={mask ?? SKIN} />
    </mesh>
    {mask ? (
      <>
        <B p={[-0.09, 1.59, 0.2]} s={[0.08, 0.05, 0.06]} c="#0c0d10" />
        <B p={[0.09, 1.59, 0.2]} s={[0.08, 0.05, 0.06]} c="#0c0d10" />
        <B p={[0, 1.45, 0.19]} s={[0.13, 0.03, 0.06]} c="#0c0d10" />
      </>
    ) : null}
    {carry ? (
      <mesh position={[0.36, 0.78, 0.12]} scale={[1, 1.15, 0.9]}>
        <icosahedronGeometry args={[0.27, 0]} />
        <Mat c="#b9a27a" />
      </mesh>
    ) : null}
    {hat === 'beanie' ? <Cyl p={[0, 1.7, 0]} s={[0.14, 0.25, 0.2]} seg={6} c="#15171d" /> : null}
    {hat === 'cap' ? <Cyl p={[0, 1.74, 0]} s={[0.22, 0.25, 0.1]} seg={6} c="#3a4a5c" /> : null}
    {hat === 'brim' ? (
      <>
        <Cyl p={[0, 1.72, 0]} s={[0.36, 0.36, 0.03]} seg={8} c="#5b4630" />
        <Cyl p={[0, 1.8, 0]} s={[0.19, 0.22, 0.16]} seg={6} c="#5b4630" />
      </>
    ) : null}
  </group>
  </group>
);

// Who wears what. A shot can name a coat ("okeefe") or give a colour.
export const COATS: Record<string, string> = {
  pino: HERO,
  okeefe: '#c0503a',
  navy: '#1f2a44',
  worker: '#7f8a99',
  agent: '#2a2f3a',
  hitman: '#121418',
  prison: '#e0762f',
  judge: '#141418',
};
export const coatOf = (name: string | undefined, fallback: string) => (name ? COATS[name] ?? name : fallback);
export const MASKS = ['#e8d26a', '#c9775a', '#9fc28a', '#d9d4c7'];

// A texture drawn once on a canvas: newspapers, calendars, book covers.
export const useCanvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, deps: unknown[]) =>
  useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    draw(cv.getContext('2d')!);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

export const Tree = ({p, h = 3, c = '#2f5d4a'}: {p: V3; h?: number; c?: string}) => (
  <group position={p}>
    <Cyl p={[0, h * 0.15, 0]} s={[0.1, 0.14, h * 0.3]} seg={5} c="#4a3526" />
    <Cyl p={[0, h * 0.5, 0]} s={[0, h * 0.28, h * 0.5]} seg={6} c={c} />
    <Cyl p={[0, h * 0.78, 0]} s={[0, h * 0.2, h * 0.42]} seg={6} c={c} />
  </group>
);

// A cut gem: two cones sharing a girdle.
export const Gem = ({p, size = 0.2, c = '#bfeaff', r = [0, 0, 0] as V3, e = 0.35}: {p: V3; size?: number; c?: string; r?: V3; e?: number}) => (
  <group position={p} rotation={r} scale={size}>
    <Cyl p={[0, 0.25, 0]} s={[0.55, 1, 0.5]} seg={8} c={c} e={e} />
    <Cyl p={[0, -0.5, 0]} s={[1, 0, 1]} seg={8} c={c} e={e * 0.6} />
  </group>
);

export const Building = ({p, s, c, lit, seed, win = '#ffcf7a'}: {p: V3; s: V3; c: string; lit: number; seed: string; win?: string}) => {
  const cols = Math.max(2, Math.round(s[0] / 1.1));
  const rows = Math.max(2, Math.round(s[1] / 1.3));
  const windows = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const on = rnd(`${seed}-${i}-${j}`) < lit;
      windows.push(
        <B
          key={`${i}-${j}`}
          p={[(i + 0.5) / cols * s[0] - s[0] / 2, (j + 0.6) / rows * s[1] - s[1] / 2, s[2] / 2 + 0.02]}
          s={[(s[0] / cols) * 0.5, (s[1] / rows) * 0.5, 0.04]}
          c={on ? win : '#27323f'}
          e={on ? 1.6 : 0}
        />,
      );
    }
  }
  return (
    <group position={[p[0], p[1] + s[1] / 2, p[2]]}>
      <B p={[0, 0, 0]} s={s} c={c} />
      <B p={[0, s[1] / 2 + 0.1, 0]} s={[s[0] + 0.3, 0.2, s[2] + 0.3]} c="#3a3f4a" />
      {windows}
    </group>
  );
};
