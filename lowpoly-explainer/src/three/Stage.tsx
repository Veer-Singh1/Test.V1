import type {ReactElement} from 'react';
import {useThree} from '@react-three/fiber';
import {useCurrentFrame} from 'remotion';
import type {PerspectiveCamera} from 'three';
import type {Shot} from '../types';
import {lerp, type V3} from './parts';
import {Roadside, Skyline, Street, TitleVoid} from './scenes/exteriors';
import {Board, Cell, Desk, Diamonds, Lineup, Office, VaultDoor, VaultRoom} from './scenes/interiors';

export type SceneProps = {shot: Shot; t: number};
type SceneDef = {
  C: (p: SceneProps) => ReactElement;
  target: V3; // what the camera looks at
  dist: number; // base distance from the target
  height: number; // camera height above the ground
  swing?: number; // how far the camera may move sideways (1 = open exterior)
  indoor?: boolean;
};

// To add a scene: build the component, register it here, then use its key in script.json.
export const SCENES: Record<string, SceneDef> = {
  street: {C: Street, target: [0, 4.2, 0], dist: 21, height: 3.2},
  skyline: {C: Skyline, target: [0, 6, 0], dist: 38, height: 9},
  roadside: {C: Roadside, target: [0, 1.3, 0], dist: 10.5, height: 2.3},
  title: {C: TitleVoid, target: [0, 2, 0], dist: 9, height: 2, swing: 0.4},
  vault_door: {C: VaultDoor, target: [0, 2.3, 0], dist: 10.5, height: 2.2, swing: 0.45, indoor: true},
  vault_room: {C: VaultRoom, target: [0, 2.2, -1], dist: 8.5, height: 2.3, swing: 0.5, indoor: true},
  diamonds: {C: Diamonds, target: [0, 0.35, 0], dist: 4.2, height: 1.7, indoor: true},
  office: {C: Office, target: [0, 1.6, 0], dist: 8, height: 1.9, swing: 0.5, indoor: true},
  desk: {C: Desk, target: [0, 0.15, 0], dist: 3.6, height: 1.6, indoor: true},
  lineup: {C: Lineup, target: [0, 1.3, 0], dist: 9, height: 1.5, swing: 0.6, indoor: true},
  board: {C: Board, target: [0, 2.1, 0], dist: 6, height: 2, swing: 0.5, indoor: true},
  cell: {C: Cell, target: [0, 1.6, 0], dist: 7.5, height: 1.7, swing: 0.45, indoor: true},
};

const LOOKS = {
  day: {bg: '#a9cfd0', amb: 0.8, key: '#fff0d2', keyI: 2.4, keyP: [8, 14, 10] as V3, fill: '#86b8c8', fillI: 0.7},
  dusk: {bg: '#e9925a', amb: 0.6, key: '#ffb26b', keyI: 2.3, keyP: [-10, 7, 8] as V3, fill: '#6c4f9a', fillI: 0.9},
  night: {bg: '#0a1430', amb: 0.4, key: '#6f8fe0', keyI: 1.2, keyP: [6, 12, 8] as V3, fill: '#22346e', fillI: 0.7},
};

/* Camera presets. Each moves linearly across the whole shot with no easing,
   so the motion never settles before the cut. The seed shifts the starting
   angle so a reused scene gets a new view. */
const cameraPose = (shot: Shot, def: SceneDef, t: number): {pos: V3; look: V3} => {
  const [tx, ty, tz] = def.target;
  const swing = def.swing ?? 1;
  const az0 = (((shot.seed * 37) % 5) - 2) * 0.1 * swing;
  const polar = (r: number, az: number, y: number): V3 => [tx + r * Math.sin(az), y, tz + r * Math.cos(az)];
  const d = def.dist;
  switch (shot.camera) {
    case 'pull_out':
      return {pos: polar(d * lerp(0.84, 1.1, t), az0, def.height), look: def.target};
    case 'track_left':
    case 'track_right': {
      const dir = shot.camera === 'track_right' ? 1 : -1;
      const x = dir * lerp(-0.2, 0.2, t) * d * swing;
      return {pos: [tx + x, def.height, tz + d * 0.95], look: [tx + x * 0.45, ty, tz]};
    }
    case 'orbit_low':
      return {pos: polar(d * 0.92, az0 + lerp(-0.32, 0.32, t) * swing, def.height * 0.45), look: def.target};
    case 'top_down':
      return {pos: [tx + lerp(-0.1, 0.1, t) * d, ty + d * lerp(1.12, 0.94, t), tz + d * 0.3], look: def.target};
    case 'push_in':
    default:
      return {pos: polar(d * lerp(1.1, 0.84, t), az0, def.height), look: def.target};
  }
};

export const Stage = ({shot}: {shot: Shot}) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const def = SCENES[shot.scene] ?? SCENES.skyline;
  const t = Math.min(1, Math.max(0, (frame - shot.from) / Math.max(1, shot.to - shot.from)));
  const look = LOOKS[shot.time] ?? LOOKS.night;

  const {pos, look: at} = cameraPose(shot, def, t);
  camera.position.set(...pos);
  camera.lookAt(...at);
  camera.updateMatrixWorld();

  const {C} = def;
  return (
    <>
      <color attach="background" args={[look.bg]} />
      {def.indoor ? null : <fog attach="fog" args={[look.bg, def.dist * 0.9, def.dist * 4.2]} />}
      <ambientLight intensity={def.indoor ? look.amb * 0.75 : look.amb} />
      <directionalLight color={look.key} intensity={def.indoor ? look.keyI * 0.5 : look.keyI} position={look.keyP} />
      <directionalLight color={look.fill} intensity={look.fillI} position={[-look.keyP[0], 5, 6]} />
      <C shot={shot} t={t} />
    </>
  );
};
