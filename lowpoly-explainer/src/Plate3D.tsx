import {useThree} from '@react-three/fiber';
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import type {Shot} from './types';

/* Camera movement for path-traced plates.

   Each plate has a depth map. The picture is laid over a fine mesh, every vertex is pushed back
   to its real distance, and the mesh is viewed through a camera that travels during the shot.
   Near things then slide past far things, as they would for a real dolly or track.
   Where the move uncovers something the still never saw, the gap is filled from what lies behind. */

const RATE = 0.055; // travel per second, as a fraction of the distance to the subject
const NEAR = 0.1; // must match NEAR in blender/lib.py
const PAD = 0.06; // the mesh runs a little past the picture, so its edges never show
const SEG_X = 420;
const SEG_Y = 746;
const CLIP_FRAMES = 150;

const vertexShader = /* glsl */ `
  uniform sampler2D uDepth;
  uniform vec2 uRes;
  uniform vec2 uTan;      // tangent of half the field of view, x and y
  uniform float uShift;   // lens shift, as a fraction of the frame height
  uniform vec3 uMove;     // camera position: right, up, forward (metres)
  uniform float uPad;
  uniform float uBack;    // 1 for the background layer
  varying vec2 vUv;
  varying vec2 vSrc;
  varying float vDisp;

  float disparity(vec2 uv) {
    vec4 d = texture2D(uDepth, clamp(uv, 0.0, 1.0));
    return (d.r * 65280.0 + d.g * 255.0) / 65535.0;
  }

  void main() {
    vUv = uv * (1.0 + 2.0 * uPad) - uPad;
    vec2 src = clamp(vUv, 0.0, 1.0);
    float d = disparity(src);
    if (uBack > 0.5) {
      // Background layer: every point takes the farthest thing nearby, so the background
      // carries on underneath the edges of whatever stands in front of it.
      float r = 5.0;
      for (int ring = 0; ring < 5; ring++) {
        for (int k = 0; k < 8; k++) {
          float a = float(k) * 0.7853982 + float(ring) * 0.39;
          vec2 q = clamp(src + vec2(cos(a), sin(a)) * r / uRes, 0.0, 1.0);
          float dq = disparity(q);
          if (dq < d * 0.93) {
            d = dq;
            src = q;
          }
        }
        r *= 1.8;
      }
    }
    vSrc = src;
    vDisp = d;
    vec2 ndc = vUv * 2.0 - 1.0;
    float z = min(${NEAR.toFixed(1)} / max(d, 1e-5), 3000.0);
    // where this point is in space, seen from the camera that took the plate
    vec3 p = vec3(ndc.x * uTan.x * z, (ndc.y + 2.0 * uShift) * uTan.y * z, z);
    p -= uMove;
    float w = max(p.z, 0.02);
    gl_Position = vec4(p.x / uTan.x, p.y / uTan.y - 2.0 * uShift * w, w - 0.04, w);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uColor;
  uniform float uBack;
  uniform vec2 uCell;     // size of one mesh cell, in picture coordinates
  varying vec2 vUv;
  varying vec2 vSrc;
  varying float vDisp;

  void main() {
    if (uBack < 0.5) {
      // How much the depth jumps across this mesh cell. A big jump means the cell bridges
      // something near and something far: cut it out and let the background layer show.
      vec2 ux = dFdx(vUv);
      vec2 uy = dFdy(vUv);
      float det = ux.x * uy.y - ux.y * uy.x;
      vec2 gs = vec2(dFdx(vDisp), dFdy(vDisp));
      vec2 grad = vec2(gs.x * uy.y - gs.y * ux.y, gs.y * ux.x - gs.x * uy.x) / (abs(det) < 1e-12 ? 1e-12 : det);
      if (length(grad * uCell) > 0.1 * vDisp) discard;
      gl_FragColor = vec4(texture2D(uColor, clamp(vUv, 0.0, 1.0)).rgb, 1.0);
    } else {
      gl_FragColor = vec4(texture2D(uColor, vSrc).rgb, 1.0);
    }
  }
`;

// The camera's path, in units of the subject distance. Every move is linear, and every move
// includes some travel forward, which keeps the picture's edges out of frame.
const moveAt = (shot: Shot, t: number, dur: number): [number, number, number] => {
  const amount = Math.min(0.16, Math.max(0.05, RATE * dur));
  const p = Math.min(1, Math.max(0, t / dur));
  const side = shot.seed % 2 ? 1 : -1;
  switch (shot.camera) {
    case 'pull_out':
      return [side * 0.3 * amount * (1 - p), 0, amount * (1 - p)];
    case 'track_left':
      return [-0.75 * amount * p, 0, 0.55 * amount * p];
    case 'track_right':
      return [0.75 * amount * p, 0, 0.55 * amount * p];
    case 'rise':
      return [0, 0.5 * amount * p, 0.7 * amount * p];
    case 'push_in':
    default:
      return [side * 0.3 * amount * p, 0, amount * p];
  }
};

const useTexture = (url: string, data: boolean) => {
  const [loaded, setLoaded] = useState<{url: string; tex: THREE.Texture} | null>(null);
  useEffect(() => {
    let cancelled = false;
    let mine: THREE.Texture | null = null;
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.colorSpace = THREE.NoColorSpace; // pass the bytes through untouched
        tex.generateMipmaps = false;
        tex.minFilter = tex.magFilter = data ? THREE.NearestFilter : THREE.LinearFilter;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        mine = tex;
        if (cancelled) tex.dispose();
        else setLoaded({url, tex});
      },
      undefined,
      () => cancelRender(new Error(`Could not load ${url}`)),
    );
    return () => {
      cancelled = true;
      mine?.dispose();
    };
  }, [url, data]);
  return loaded && loaded.url === url ? loaded.tex : null;
};

export const Plate3D = ({shot, story}: {shot: Shot; story: string}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const advance = useThree((s) => s.advance);
  const meta = shot.meta!;
  const local = frame - shot.from;
  const base = `${story}/plates/`;
  const n = String(Math.min(local + 1, CLIP_FRAMES)).padStart(4, '0');
  const color = useTexture(staticFile(shot.clip ? `${base}${shot.clip}/c_${n}.jpg` : `${base}${shot.plate}.jpg`), false);
  const depth = useTexture(staticFile(shot.clip ? `${base}${shot.clip}/d_${n}.png` : `${base}${shot.plate}_d.png`), true);

  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2, SEG_X, SEG_Y), []);
  // Two layers of the same mesh: the picture itself, and an extended background behind it.
  const [front, back] = useMemo(
    () =>
      [0, 1].map(
        (layer) =>
          new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
              uColor: {value: null}, uDepth: {value: null}, uRes: {value: new THREE.Vector2(1080, 1920)},
              uTan: {value: new THREE.Vector2()}, uShift: {value: 0}, uMove: {value: new THREE.Vector3()},
              uPad: {value: PAD}, uBack: {value: layer},
              uCell: {value: new THREE.Vector2((1 + 2 * PAD) / SEG_X, (1 + 2 * PAD) / SEG_Y)},
            },
          }),
      ),
    [],
  );
  const ty = 18 / meta.lens; // 36 mm sensor on the long (vertical) side
  const [mx, my, mz] = moveAt(shot, local / fps, (shot.to - shot.from) / fps);
  for (const material of [front, back]) {
    const u = material.uniforms;
    u.uColor.value = color;
    u.uDepth.value = depth;
    u.uTan.value.set((ty * 1080) / 1920, ty);
    u.uShift.value = meta.shift_y;
    u.uMove.value.set(mx * meta.focus, my * meta.focus, mz * meta.focus);
  }

  // Hold the frame until both textures for it are in and the canvas has been redrawn with them.
  const hold = useRef<number | null>(null);
  const ready = Boolean(color && depth);
  useLayoutEffect(() => {
    if (!ready && hold.current === null) hold.current = delayRender(`Plate textures for frame ${frame}`);
  }, [ready, frame]);
  useEffect(() => {
    if (!ready) return;
    advance(performance.now());
    if (hold.current !== null) {
      continueRender(hold.current);
      hold.current = null;
    }
  }, [ready, color, depth, frame, advance, mx, my, mz]);
  useEffect(() => () => {
    if (hold.current !== null) continueRender(hold.current);
  }, []);

  if (!ready) return null;
  return (
    <>
      <mesh geometry={geometry} material={back} frustumCulled={false} renderOrder={0} />
      <mesh geometry={geometry} material={front} frustumCulled={false} renderOrder={1} />
    </>
  );
};
