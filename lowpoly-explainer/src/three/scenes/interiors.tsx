import {useMemo, type ReactElement} from 'react';
import * as THREE from 'three';
import type {SceneProps} from '../Stage';
import {B, Cyl, Figure, Gem, Glow, HERO, Lamp, Sign, lerp, rnd, type V3} from '../parts';

const STEEL = '#8f9aa6';
const CREW = '#1b2230';
const PRISON = '#e0762f';

// Floor, back wall, side walls and ceiling. Open towards the camera (+z).
const Room = ({w, h, back, front = 14, wall, floor, ceil}: {w: number; h: number; back: number; front?: number; wall: string; floor: string; ceil?: string}) => {
  const depth = front - back;
  const mid = (front + back) / 2;
  return (
    <>
      <B p={[0, -0.1, mid]} s={[w, 0.2, depth]} c={floor} />
      <B p={[0, h / 2, back - 0.1]} s={[w, h, 0.2]} c={wall} />
      <B p={[-w / 2 - 0.1, h / 2, mid]} s={[0.2, h, depth]} c={wall} />
      <B p={[w / 2 + 0.1, h / 2, mid]} s={[0.2, h, depth]} c={wall} />
      <B p={[0, h + 0.1, mid]} s={[w, 0.2, depth]} c={ceil ?? wall} />
    </>
  );
};

const Lasers = ({n = 7, w, z0 = 0.5}: {n?: number; w: number; z0?: number}) => (
  <>
    {Array.from({length: n}, (_, i) => (
      <B key={i} p={[0, 0.5 + rnd(`ly${i}`) * 3, z0 + i * 0.8]} s={[w, 0.022, 0.022]} r={[0, 0, (rnd(`lr${i}`) - 0.5) * 0.5]} c="#ff1a1a" ec="#ff0000" e={1.2} />
    ))}
  </>
);

// Corridor ending in a round steel vault door. Options: lasers, open, crew.
export const VaultDoor = ({shot, t}: SceneProps) => {
  const swing = shot.open ? lerp(-1.2, -1.75, t) : 0;
  return (
    <>
      <Room w={7} h={5} back={-2} front={16} wall="#4d6470" floor="#39414d" ceil="#2e3640" />
      {[1, 5, 9, 13].map((z) => (
        <group key={z}>
          <B p={[0, 4.95, z]} s={[2.4, 0.08, 0.3]} c="#dff1ff" e={2.2} />
          <pointLight position={[0, 4.4, z]} color="#cfe6ff" intensity={7} distance={10} decay={1.6} />
        </group>
      ))}
      {/* frame */}
      <Cyl p={[0, 2.3, -1.85]} s={[2.35, 2.35, 0.3]} r={[Math.PI / 2, 0, 0]} seg={12} c="#3b434d" />
      {shot.open ? (
        <>
          <Cyl p={[0, 2.3, -1.72]} s={[1.9, 1.9, 0.1]} r={[Math.PI / 2, 0, 0]} seg={12} c="#0a0c10" />
          <Lamp p={[0.3, 2.6, -1.5]} c="#ffb766" size={0.01} halo={5} power={10} />
        </>
      ) : null}
      {/* door, hinged on the left */}
      <group position={[-1.9, 2.3, -1.6]} rotation={[0, swing, 0]}>
        <group position={[1.9, 0, 0.1]}>
          <Cyl p={[0, 0, 0]} s={[1.9, 1.9, 0.5]} r={[Math.PI / 2, 0, 0]} seg={12} c={STEEL} />
          <Cyl p={[0, 0, 0.3]} s={[1.3, 1.3, 0.12]} r={[Math.PI / 2, 0, 0]} seg={12} c="#a9b3bf" />
          {[0, 1, 2].map((i) => (
            <B key={i} p={[0, 0, 0.45]} s={[1.7, 0.14, 0.12]} r={[0, 0, (i * Math.PI) / 3 + t * 0.6]} c="#d9a441" />
          ))}
          <Cyl p={[0, 0, 0.5]} s={[0.24, 0.24, 0.2]} r={[Math.PI / 2, 0, 0]} seg={8} c="#3b434d" />
          {Array.from({length: 12}, (_, i) => (
            <Cyl key={i} p={[Math.cos((i * Math.PI) / 6) * 1.62, Math.sin((i * Math.PI) / 6) * 1.62, 0.28]} s={[0.09, 0.09, 0.1]} r={[Math.PI / 2, 0, 0]} seg={6} c="#59626e" />
          ))}
        </group>
      </group>
      {/* keypad and camera */}
      <B p={[2.75, 2.2, -1.9]} s={[0.5, 0.8, 0.12]} c="#22272e" />
      <B p={[2.75, 2.4, -1.83]} s={[0.34, 0.2, 0.02]} c={shot.open ? '#4dff88' : '#ff4a3a'} e={3} />
      <Glow p={[2.75, 2.4, -1.7]} size={1.1} c={shot.open ? '#4dff88' : '#ff4a3a'} strength={0.6} />
      <B p={[-2.6, 4.5, 0]} s={[0.35, 0.3, 0.7]} r={[0.4, -0.5, 0]} c="#1c2026" />
      <B p={[-2.47, 4.38, 0.36]} s={[0.08, 0.08, 0.04]} r={[0.4, -0.5, 0]} c="#ff2a2a" e={4} />
      {shot.lasers ? <Lasers w={7} /> : null}
      {Array.from({length: shot.crew ?? 0}, (_, i) => (
        <Figure key={i} p={[[1.3, -1.6, 2.4][i] + (shot.open ? 0 : 0), 0, [0.6, 1.4, 2.4][i] - t * 0.5]} coat={i === 0 ? HERO : CREW} hat="beanie" rot={Math.PI + (i - 1) * 0.3} />
      ))}
    </>
  );
};

// Walls of safe-deposit boxes. "open" pulls most of them out and litters the floor.
export const VaultRoom = ({shot}: SceneProps) => {
  const fronts: ReactElement[] = [];
  const wallOf = (key: string, cols: number, place: (i: number, j: number, pulled: boolean) => {p: V3; s: V3}) => {
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < 7; j++) {
        const pulled = !!shot.open && rnd(`${key}${i}-${j}`) < 0.66;
        const {p, s} = place(i, j, pulled);
        fronts.push(<B key={`${key}${i}-${j}`} p={p} s={s} c={pulled ? '#0b0d12' : j % 2 ? STEEL : '#9ba6b2'} />);
      }
    }
  };
  wallOf('b', 9, (i, j, pulled) => ({p: [(i - 4) * 0.86, 0.55 + j * 0.56, pulled ? -3.98 : -3.9], s: [0.78, 0.48, 0.12]}));
  wallOf('l', 8, (i, j, pulled) => ({p: [pulled ? -3.98 : -3.9, 0.55 + j * 0.56, -3.4 + i * 0.86], s: [0.12, 0.48, 0.78]}));
  wallOf('r', 8, (i, j, pulled) => ({p: [pulled ? 3.98 : 3.9, 0.55 + j * 0.56, -3.4 + i * 0.86], s: [0.12, 0.48, 0.78]}));
  return (
    <>
      <Room w={8} h={4.7} back={-4} front={14} wall="#3d4a56" floor="#4a4f58" ceil="#2a3038" />
      {fronts}
      <B p={[0, 4.62, -0.5]} s={[1.6, 0.08, 1.6]} c="#ffe2b0" e={2.4} />
      <pointLight position={[0, 4, -0.5]} color={shot.time === 'night' ? '#ffc98a' : '#fff0d8'} intensity={shot.time === 'night' ? 16 : 26} distance={16} decay={1.5} />
      <Glow p={[0, 4.5, -0.5]} size={4} c="#ffd9a0" strength={0.45} />
      <B p={[0, 0.5, -0.8]} s={[2.2, 1, 1.2]} c="#59626e" />
      {shot.lasers ? <Lasers w={8} n={6} z0={1} /> : null}
      {shot.open
        ? Array.from({length: 22}, (_, i) => (
            <group key={i} position={[(rnd(`dx${i}`) - 0.5) * 6.4, 0, -2.6 + rnd(`dz${i}`) * 5.5]} rotation={[0, rnd(`dr${i}`) * 6, 0]}>
              <B p={[0, 0.16, 0]} s={[0.72, 0.3, 1]} c={STEEL} />
              <B p={[0, 0.3, 0]} s={[0.6, 0.04, 0.88]} c="#14171c" />
              {i % 3 === 0 ? <B p={[0.8, 0.02, 0.2]} s={[0.5, 0.02, 0.36]} r={[0, 0.6, 0]} c="#efe9da" /> : null}
              {i % 4 === 0 ? <Gem p={[-0.7, 0.1, 0.3]} size={0.09} e={0.9} /> : null}
            </group>
          ))
        : null}
    </>
  );
};

// A pile of cut stones on dark cloth under one lamp.
export const Diamonds = ({shot, t}: SceneProps) => (
  <>
    <Room w={30} h={12} back={-9} front={16} wall="#141a2c" floor="#1b1630" />
    <Cyl p={[0, 0.03, 0]} s={[1.9, 2, 0.06]} seg={10} c="#2a1f4a" />
    {Array.from({length: 54}, (_, i) => {
      const a = rnd(`ga${i}`) * Math.PI * 2;
      const r = Math.sqrt(rnd(`gr${i}`)) * 1.45;
      const size = 0.09 + rnd(`gs${i}`) * 0.15;
      const high = Math.max(0, 0.5 - r * 0.4) * rnd(`gh${i}`);
      return (
        <Gem
          key={i}
          p={[Math.cos(a) * r, 0.1 + size * 0.5 + high, Math.sin(a) * r]}
          size={size}
          r={[rnd(`gt${i}`) * 1.2 - 0.6, a + t * 0.5, rnd(`gu${i}`) * 1.2 - 0.6]}
          c={['#9fd8f5', '#6fb8e8', '#c9ecfb', '#8fd6d0'][i % 4]}
          e={0.12}
        />
      );
    })}
    <pointLight position={[0.6, 3, 1]} color={shot.time === 'day' ? '#fff4dc' : '#ffd9a0'} intensity={9} distance={12} decay={1.5} />
    <Glow p={[0, 0.6, 0]} size={5.5} c="#9fdcff" strength={0.16} />
  </>
);

// Rented office: desk, lamp, window with blinds, and the main character.
export const Office = ({shot}: SceneProps) => (
  <>
    <Room w={11} h={5} back={-3.5} wall="#3f6f6a" floor="#5a4a3c" ceil="#2f524e" />
    <B p={[2.2, 3, -3.38]} s={[3.2, 2.4, 0.08]} c={shot.time === 'night' ? '#22386b' : '#ffb26b'} e={1.5} />
    <Glow p={[2.2, 3, -3.2]} size={6} c="#ffb26b" strength={shot.time === 'night' ? 0 : 0.35} />
    {Array.from({length: 8}, (_, i) => (
      <B key={i} p={[2.2, 1.95 + i * 0.3, -3.3]} s={[3.3, 0.1, 0.06]} c="#254441" />
    ))}
    <B p={[-3.2, 3.2, -3.38]} s={[1.4, 1, 0.06]} c="#d9c9a8" />
    <B p={[-3.2, 3.2, -3.34]} s={[1.1, 0.7, 0.04]} c="#6f8fa0" />
    {/* desk */}
    <B p={[0, 1, 0]} s={[3.6, 0.12, 1.5]} c="#7b5637" />
    <B p={[-1.5, 0.5, 0]} s={[0.4, 0.9, 1.3]} c="#63452c" />
    <B p={[1.5, 0.5, 0]} s={[0.4, 0.9, 1.3]} c="#63452c" />
    <Cyl p={[-1.2, 1.3, -0.2]} s={[0.03, 0.03, 0.5]} seg={5} c="#22252d" />
    <Cyl p={[-1.2, 1.6, -0.2]} s={[0.12, 0.26, 0.2]} seg={6} c="#d9a441" e={0.6} />
    <Lamp p={[-1.2, 1.5, -0.2]} size={0.06} halo={2.4} power={9} />
    <B p={[0.3, 1.08, 0.1]} s={[0.8, 0.02, 0.55]} c="#1f2430" />
    {[0, 1, 2, 3, 4].map((i) => (
      <Gem key={i} p={[0.15 + i * 0.09, 1.12, 0.1 + (i % 2) * 0.1]} size={0.045} e={1} />
    ))}
    <B p={[1.1, 1.14, -0.2]} s={[0.5, 0.14, 0.34]} c="#2a2f3a" />
    {/* cabinet and safe */}
    <B p={[-4.3, 1.1, -2.7]} s={[1.2, 2.2, 1]} c="#6f7f86" />
    {[0, 1, 2].map((i) => (
      <B key={i} p={[-4.3, 0.5 + i * 0.7, -2.18]} s={[1, 0.56, 0.04]} c="#86979e" />
    ))}
    <B p={[4.3, 0.7, -2.7]} s={[1.3, 1.4, 1.1]} c="#2f3640" />
    <Cyl p={[4.3, 0.75, -2.12]} s={[0.2, 0.2, 0.08]} r={[Math.PI / 2, 0, 0]} seg={8} c="#d9a441" />
    <Figure p={[0.2, 0, -1.1]} coat={HERO} />
  </>
);

const useBlueprint = () =>
  useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 768;
    cv.height = 544;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#1f4f8f';
    g.fillRect(0, 0, 768, 544);
    g.strokeStyle = 'rgba(255,255,255,0.14)';
    for (let x = 0; x < 768; x += 32) g.strokeRect(x, 0, 32, 544);
    for (let y = 0; y < 544; y += 32) g.strokeRect(0, y, 768, 32);
    g.strokeStyle = '#eaf3ff';
    g.lineWidth = 5;
    g.strokeRect(90, 80, 420, 380);
    g.strokeRect(510, 200, 170, 140);
    g.beginPath();
    g.arc(510, 270, 62, 0, Math.PI * 2);
    g.stroke();
    for (let y = 110; y < 440; y += 34) g.strokeRect(110, y, 60, 22);
    for (let y = 110; y < 440; y += 34) g.strokeRect(430, y, 60, 22);
    g.fillStyle = '#eaf3ff';
    g.font = '800 44px Outfit, sans-serif';
    g.fillText('VAULT', 232, 285);
    g.font = '700 22px Outfit, sans-serif';
    g.fillText('LEVEL -2', 250, 320);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

const BreadLayer = ({y, c}: {y: number; c: string}) => (
  <>
    {/* three strips of different length give the bitten end its jagged edge */}
    <B p={[-0.05, y, -0.17]} s={[0.9, 0.12, 0.17]} c={c} />
    <B p={[-0.15, y, 0]} s={[0.7, 0.12, 0.17]} c={c} />
    <B p={[-0.09, y, 0.17]} s={[0.82, 0.12, 0.17]} c={c} />
  </>
);

// Desk-top close-up. prop: blueprint | envelopes | sandwich
export const Desk = ({shot}: SceneProps) => {
  const blueprint = useBlueprint();
  return (
    <>
      <Room w={26} h={10} back={-7} front={12} wall={shot.time === 'day' ? '#56797a' : '#2f3d4a'} floor="#7b5637" />
      {Array.from({length: 9}, (_, i) => (
        <B key={i} p={[0, 0.005, -4 + i * 1.1]} s={[26, 0.01, 0.03]} c="#5f4129" />
      ))}
      <Cyl p={[-1.7, 0.45, -1.2]} s={[0.04, 0.04, 0.9]} seg={5} c="#22252d" />
      <Cyl p={[-1.7, 0.05, -1.2]} s={[0.22, 0.26, 0.08]} seg={8} c="#22252d" />
      <Cyl p={[-1.7, 0.95, -1.2]} s={[0.14, 0.34, 0.26]} seg={6} c="#d9a441" e={0.7} />
      <Lamp p={[-1.7, 0.8, -1.2]} size={0.07} halo={3} power={shot.time === 'day' ? 5 : 12} />
      {shot.prop === 'blueprint' ? (
        <>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0.06]}>
            <planeGeometry args={[2.6, 1.84]} />
            <meshStandardMaterial map={blueprint} emissiveMap={blueprint} emissive="#ffffff" emissiveIntensity={0.25} roughness={1} />
          </mesh>
          <Cyl p={[1.0, 0.05, 0.75]} s={[0.025, 0.025, 0.8]} r={[0, 0.5, Math.PI / 2]} seg={6} c="#d9a441" />
          <B p={[-0.8, 0.04, 1.1]} s={[1.2, 0.02, 0.14]} r={[0, 0.2, 0]} c="#e9e3cf" />
          <Cyl p={[1.75, 0.16, -0.5]} s={[0.17, 0.15, 0.3]} seg={8} c="#e9e3cf" />
          <Cyl p={[1.75, 0.3, -0.5]} s={[0.14, 0.14, 0.02]} seg={8} c="#3a2418" />
        </>
      ) : null}
      {shot.prop === 'envelopes' ? (
        <>
          {[0, 1, 2, 3].map((i) => (
            <group key={i} position={[-0.6 + i * 0.4, 0.02 + i * 0.022, 0.25 - i * 0.14]} rotation={[0, -0.4 + i * 0.27, 0]}>
              <B p={[0, 0, 0]} s={[1.15, 0.02, 0.66]} c={i % 2 ? '#f4efe2' : '#e9e2d0'} />
              <B p={[0, 0.012, -0.16]} s={[1.15, 0.004, 0.02]} c="#b9b09a" />
              <Gem p={[-0.4, 0.03, 0.18]} size={0.045} c="#3a8fd0" e={0.6} />
            </group>
          ))}
          <Sign p={[0.62, 0.105, -0.12]} s={[0.66, 0.13]} r={[-Math.PI / 2, 0, -0.41]} text="DIAMOND CENTRE" bg="#f4efe2" fg="#1f4f8f" e={0.2} />
        </>
      ) : null}
      {shot.prop === 'sandwich' ? (
        <>
          <B p={[0.05, 0.012, 0.05]} s={[1.9, 0.02, 1.3]} r={[0, 0.25, 0]} c="#ece5d3" />
          <B p={[0.5, 0.03, 0.35]} s={[0.7, 0.02, 0.6]} r={[0.05, -0.5, 0.04]} c="#dfd7c2" />
          <group position={[0, 0.03, 0]} rotation={[0, -0.2, 0]}>
            <BreadLayer y={0.06} c="#d6a35c" />
            <B p={[-0.1, 0.135, 0]} s={[0.86, 0.03, 0.56]} c="#6fa84a" />
            {[-0.33, -0.08, 0.17].map((x, i) => (
              <Cyl key={i} p={[x, 0.17, i % 2 ? 0.1 : -0.08]} s={[0.21, 0.21, 0.04]} seg={8} c="#b5443c" />
            ))}
            <B p={[-0.12, 0.2, 0]} s={[0.8, 0.02, 0.5]} c="#f0d98a" />
            <BreadLayer y={0.27} c="#e0b470" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <B key={i} p={[0.5 + rnd(`cx${i}`) * 0.35, 0.03, (rnd(`cz${i}`) - 0.5) * 0.6]} s={[0.04, 0.03, 0.04]} c="#d6a35c" />
            ))}
          </group>
          <B p={[-1.25, 0.02, 0.75]} s={[0.36, 0.01, 0.95]} r={[0, 0.35, 0]} c="#fbfaf5" />
          {[0, 1, 2, 3, 4].map((i) => (
            <B key={i} p={[-1.25 + (i - 2) * 0.055, 0.03, 0.75 + (i - 2) * 0.15]} s={[0.24, 0.004, 0.03]} r={[0, 0.35, 0]} c="#8a8a86" />
          ))}
        </>
      ) : null}
    </>
  );
};

// A row of characters against a wall. prison: orange coats and height lines.
export const Lineup = ({shot}: SceneProps) => {
  const n = shot.count ?? 5;
  return (
    <>
      <Room w={16} h={5} back={-1.6} wall={shot.prison ? '#39445c' : '#7f9a94'} floor={shot.prison ? '#2c3140' : '#6d6258'} />
      {shot.prison
        ? [1.2, 1.5, 1.8, 2.1, 2.4].map((y) => <B key={y} p={[0, y, -1.48]} s={[16, 0.03, 0.02]} c="#c9d2e6" e={0.3} />)
        : <B p={[0, 1, -1.48]} s={[16, 0.12, 0.04]} c="#5e7872" />}
      <B p={[0, 4.92, 1]} s={[3, 0.08, 0.5]} c="#fff0d0" e={2.2} />
      <pointLight position={[0, 4.2, 1.5]} color={shot.prison ? '#cfe0ff' : '#fff0d8'} intensity={22} distance={16} decay={1.5} />
      {Array.from({length: n}, (_, i) => {
        const x = (i - (n - 1) / 2) * 0.98;
        const hero = i === shot.highlight;
        const coat = shot.prison ? PRISON : hero ? HERO : ['#5d6b78', '#6b6470', '#4f5f58', '#70685c'][i % 4];
        return (
          <group key={i}>
            <Figure p={[x, 0, 0]} coat={coat} hat={!shot.prison && i % 2 ? 'cap' : undefined} scale={0.94 + rnd(`ls${i}`) * 0.12} />
            {shot.prison ? null : <B p={[x + 0.4, 0.2, 0.25]} s={[0.1, 0.3, 0.4]} c="#3b2d22" />}
          </group>
        );
      })}
    </>
  );
};

// Evidence board: photo cards joined with red string.
export const Board = (_: SceneProps) => {
  const cards: V3[] = [
    [0, 2.2, 0], [-1.7, 3.2, 0], [1.6, 3.25, 0], [-1.9, 1.5, 0], [1.8, 1.4, 0], [0.1, 3.5, 0], [-0.7, 1.15, 0], [0.9, 2.2, 0],
  ];
  const tint = [HERO, '#6f8fa0', '#8a6a5c', '#4f6b3c', '#d6a35c', '#7f8a99', '#b5443c', '#a9dcff'];
  return (
    <>
      <Room w={14} h={6} back={-1} wall="#2f4b52" floor="#3a3530" />
      <B p={[0, 2.3, -0.9]} s={[5.4, 3.7, 0.1]} c="#5f4129" />
      <B p={[0, 2.3, -0.84]} s={[5.1, 3.4, 0.06]} c="#b0855a" />
      {cards.map((c, i) => (
        <group key={i} position={[c[0], c[1], -0.78]} rotation={[0, 0, (rnd(`cr${i}`) - 0.5) * 0.3]}>
          <B p={[0, 0, 0]} s={i === 0 ? [0.95, 1.1, 0.02] : [0.72, 0.6, 0.02]} c="#f4efe2" e={0.15} />
          <B p={[0, i === 0 ? 0.08 : 0.04, 0.012]} s={i === 0 ? [0.78, 0.8, 0.01] : [0.6, 0.42, 0.01]} c={i === 0 ? '#39445c' : tint[i]} />
          {i === 0 ? (
            <>
              <B p={[0, -0.08, 0.02]} s={[0.4, 0.4, 0.01]} c={HERO} />
              <B p={[0, 0.24, 0.02]} s={[0.24, 0.24, 0.01]} c="#e3c3a0" />
            </>
          ) : null}
          <Cyl p={[0, i === 0 ? 0.5 : 0.25, 0.03]} s={[0.035, 0.035, 0.04]} r={[Math.PI / 2, 0, 0]} seg={6} c="#f74e30" e={0.8} />
        </group>
      ))}
      {cards.slice(1).map((c, i) => {
        const dx = c[0] - cards[0][0];
        const dy = c[1] - cards[0][1];
        return <B key={i} p={[cards[0][0] + dx / 2, cards[0][1] + dy / 2 + 0.3, -0.74]} s={[Math.hypot(dx, dy), 0.018, 0.01]} r={[0, 0, Math.atan2(dy, dx)]} c="#f74e30" e={1.2} />;
      })}
      <Cyl p={[0, 4.75, 0.4]} s={[0.2, 0.5, 0.3]} seg={6} c="#22252d" />
      <Lamp p={[0, 4.55, 0.4]} size={0.1} halo={3.5} power={34} />
    </>
  );
};

// Prison cell seen through the bars.
export const Cell = (_: SceneProps) => (
  <>
    <Room w={8} h={5} back={-2.6} wall="#2d3447" floor="#262b38" />
    <B p={[1.6, 3.7, -2.48]} s={[1.3, 0.9, 0.06]} c="#cfe0ff" e={2.2} />
    {[0, 1, 2, 3].map((i) => (
      <B key={i} p={[1.15 + i * 0.3, 3.7, -2.42]} s={[0.06, 0.9, 0.06]} c="#151923" />
    ))}
    <Glow p={[1.6, 3.7, -2.2]} size={5} c="#bcd3ff" strength={0.4} />
    <pointLight position={[1.4, 3.4, -1.4]} color="#bcd3ff" intensity={20} distance={12} decay={1.5} />
    <B p={[-2.5, 0.55, -1.4]} s={[2.6, 0.14, 1.2]} c="#4a5368" />
    <B p={[-2.5, 0.7, -1.4]} s={[2.5, 0.16, 1.1]} c="#8b93a6" />
    <B p={[-3.55, 0.82, -1.4]} s={[0.5, 0.12, 0.8]} c="#d8dce6" />
    <B p={[-2.5, 0.25, -1.4]} s={[2.6, 0.5, 0.1]} c="#3a4154" />
    <Figure p={[0.1, 0, -0.4]} coat={PRISON} rot={-0.3} />
    <pointLight position={[0, 2.6, 1.2]} color="#8fa6d8" intensity={8} distance={8} decay={1.5} />
    {Array.from({length: 11}, (_, i) => (
      <Cyl key={i} p={[(i - 5) * 0.78 + 0.39, 2.5, 2.4]} s={[0.05, 0.05, 5]} seg={6} c="#151923" />
    ))}
    <B p={[0, 1, 2.4]} s={[8, 0.1, 0.12]} c="#151923" />
    <B p={[0, 3.9, 2.4]} s={[8, 0.1, 0.12]} c="#151923" />
  </>
);
