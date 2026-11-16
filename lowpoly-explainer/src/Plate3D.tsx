import {useThree} from '@react-three/fiber';
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import type {Shot} from './types';

/* Camera movement for path-traced plates.

   Each plate has a depth map. The picture is laid over a fine mesh, every vertex is pushed back
   to its real distance, and the mesh is viewed through a camera that travels during the shot.
   Near things then slide past far things, as they would for a real dolly or track.
   Where the move uncovers something the still never saw, layers behind show through: the same
   picture with whatever stood in front filled in from behind, first a little way (the wall behind
   a railing), then as far as the shot needs (the sky behind a building). blender/layers.py makes them. */

const RATE = 0.055; // travel per second, as a fraction of the distance to the subject
const NEAR = 0.1; // must match NEAR in blender/lib.py
const PAD = 0.06; // the mesh runs a little past the picture, so its edges never show
const SEG_X = 420;
const SEG_Y = 746;
const CLIP_FRAMES = 150;

const vertexShader = /* glsl */ `
  uniform sampler2D uDepth;
  uniform vec2 uTan;      // tangent of half the field of view, x and y
  uniform float uShift;   // lens shift, as a fraction of the frame height
  uniform vec3 uMove;     // camera position: right, up, forward (metres)
  uniform float uPad;
  varying vec2 vUv;
  varying float vDisp;

  void main() {
    vUv = uv * (1.0 + 2.0 * uPad) - uPad;
    vec4 t = texture2D(uDepth, clamp(vUv, 0.0, 1.0));
    float d = (t.r * 65280.0 + t.g * 255.0) / 65535.0;
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
  uniform sampler2D uDepth;
  uniform float uMode;    // 2 front, 1 middle, 0 back
  uniform vec2 uTan;
  uniform float uShift;
  uniform vec3 uMove;
  uniform vec2 uView;     // drawing-buffer size in pixels
  uniform vec2 uCell;     // one mesh cell, in picture coordinates
  varying vec2 vUv;
  varying float vDisp;

  void main() {
    vec2 uv = clamp(vUv, 0.0, 1.0);
    if (uMode > 1.5) {
      // Front: re-project this picture pixel from its own depth and compare with where the mesh
      // drew it. Inside a surface the two agree. Where a mesh cell is stretched across a step in
      // depth they do not: drop the pixel and let the layers behind show.
      vec4 t = texture2D(uDepth, uv);
      if (t.b > 0.5) discard; // background right beside a near edge, tinted by it: the layers behind have it clean
      float d = (t.r * 65280.0 + t.g * 255.0) / 65535.0;
      float z = min(${NEAR.toFixed(1)} / max(d, 1e-5), 3000.0);
      vec2 ndc = vUv * 2.0 - 1.0;
      vec3 p = vec3(ndc.x * uTan.x * z, (ndc.y + 2.0 * uShift) * uTan.y * z, z) - uMove;
      float w = max(p.z, 0.02);
      vec2 expect = vec2(p.x / uTan.x, p.y / uTan.y - 2.0 * uShift * w) / w;
      vec2 actual = gl_FragCoord.xy / uView * 2.0 - 1.0;
      if (length((expect - actual) * uView * 0.5) > 1.5) discard;
    } else if (uMode > 0.5) {
      // Middle: open a hole only where the cell spans a real jump in depth (the same 12% rule the
      // fills were built with), so the far fill shows there. Smaller steps just stretch.
      vec2 ux = dFdx(vUv);
      vec2 uy = dFdy(vUv);
      float det = ux.x * uy.y - ux.y * uy.x;
      vec2 gs = vec2(dFdx(vDisp), dFdy(vDisp));
      vec2 grad = vec2(gs.x * uy.y - gs.y * ux.y, gs.y * ux.x - gs.x * uy.x) / (abs(det) < 1e-12 ? 1e-12 : det);
      if (length(grad * uCell) > 0.12 * vDisp) discard;
    }
    gl_FragColor = vec4(texture2D(uColor, uv).rgb, 1.0);
  }
`;

// The camera's path, in units of the subject distance. Every move is linear, and every move
// includes some travel forward, which keeps the picture's edges out of frame.
const moveAt = (shot: Shot, t: number, dur: number): [number, number, number] => {
  // shot.move shortens the move on shots where the camera passes close to something
  const amount = Math.min(0.16, Math.max(0.05, RATE * dur)) * (shot.move ?? 1);
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
  const gl = useThree((s) => s.gl);
  const meta = shot.meta!;
  const local = frame - shot.from;
  const base = `${story}/plates/`;
  const n = String(Math.min(local + 1, CLIP_FRAMES)).padStart(4, '0');
  const file = (stem: string, clipPrefix: string, ext: string) =>
    staticFile(shot.clip ? `${base}${shot.clip}/${clipPrefix}_${n}.${ext}` : `${base}${shot.plate}${stem}.${ext}`);
  const color = useTexture(file('', 'c', 'jpg'), false);
  const depth = useTexture(file('_d', 'd', 'png'), true);
  const midColor = useTexture(file('_bg', 'b', 'jpg'), false);
  const midDepth = useTexture(file('_bgd', 'e', 'png'), true);
  const backColor = useTexture(file('_bg2', 'f', 'jpg'), false);
  const backDepth = useTexture(file('_bg2d', 'g', 'png'), true);

  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2, SEG_X, SEG_Y), []);
  // Three layers of the same mesh: the picture, then the near fill, then the far fill. The front
  // drops pixels that are not where their depth says, the middle opens only at real depth jumps,
  // and the back always draws.
  const [front, mid, back] = useMemo(
    () =>
      [0, 1, 2].map(
        (layer) =>
          new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
              uColor: {value: null}, uDepth: {value: null}, uTan: {value: new THREE.Vector2()}, uShift: {value: 0},
              uMove: {value: new THREE.Vector3()}, uPad: {value: PAD}, uMode: {value: 2 - layer},
              uView: {value: new THREE.Vector2()}, uCell: {value: new THREE.Vector2((1 + 2 * PAD) / SEG_X, (1 + 2 * PAD) / SEG_Y)},
            },
            // Each layer sits a hair behind the one before it, so where they show the same surface
            // the front one always wins and nothing flickers.
            polygonOffset: layer > 0,
            polygonOffsetFactor: layer,
            polygonOffsetUnits: layer * 4,
          }),
      ),
    [],
  );
  const ty = 18 / meta.lens; // 36 mm sensor on the long (vertical) side
  const [mx, my, mz] = moveAt(shot, local / fps, (shot.to - shot.from) / fps);
  for (const [material, c, d] of [[front, color, depth], [mid, midColor, midDepth], [back, backColor, backDepth]] as const) {
    const u = material.uniforms;
    u.uColor.value = c;
    u.uDepth.value = d;
    u.uTan.value.set((ty * 1080) / 1920, ty);
    u.uShift.value = meta.shift_y;
    u.uMove.value.set(mx * meta.focus, my * meta.focus, mz * meta.focus);
    gl.getDrawingBufferSize(u.uView.value);
  }

  // Hold the frame until both textures for it are in and the canvas has been redrawn with them.
  const hold = useRef<number | null>(null);
  const ready = Boolean(color && depth && midColor && midDepth && backColor && backDepth);
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
  }, [ready, color, depth, midColor, midDepth, backColor, backDepth, frame, advance, mx, my, mz]);
  useEffect(() => () => {
    if (hold.current !== null) continueRender(hold.current);
  }, []);

  if (!ready) return null;
  return (
    <>
      <mesh geometry={geometry} material={back} frustumCulled={false} renderOrder={0} />
      <mesh geometry={geometry} material={mid} frustumCulled={false} renderOrder={1} />
      <mesh geometry={geometry} material={front} frustumCulled={false} renderOrder={2} />
    </>
  );
};
