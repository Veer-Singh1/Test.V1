/* Scenes added for the Brink's story (Boston, 1950). Each one is reusable:
   switches in script.json change who is in it and what state it is in. */
import {useCurrentFrame} from 'remotion';
import type {SceneProps} from '../Stage';
import {B, COATS, Cyl, Figure, Glow, Lamp, MASKS, Sign, Tree, coatOf, lerp, rnd, type V3} from '../parts';

const BILL = '#7fa874';
const BAND = '#efe9da';
const CANVAS = '#b9a27a';

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

/* ---------- vehicles (front of the vehicle points to +x) ---------- */
const Wheel = ({p, r = 0.42}: {p: V3; r?: number}) => <Cyl p={p} s={[r, r, 0.3]} r={[Math.PI / 2, 0, 0]} seg={10} c="#15171b" />;
const Headlights = ({x, y, lit}: {x: number; y: number; lit: boolean}) => (
  <>
    <Lamp p={[x, y, 0.65]} c="#fff1c4" size={0.1} halo={lit ? 1.6 : 0.01} power={lit ? 8 : 0} light={lit} />
    <Lamp p={[x, y, -0.65]} c="#fff1c4" size={0.1} halo={lit ? 1.6 : 0.01} light={false} />
  </>
);

export const ArmoredTruck = ({p, rot = 0, lit = false}: {p: V3; rot?: number; lit?: boolean}) => (
  <group position={p} rotation={[0, rot, 0]}>
    <B p={[-0.5, 1.5, 0]} s={[3.6, 2.2, 2.1]} c="#56645a" />
    <B p={[-0.5, 2.65, 0]} s={[3.4, 0.12, 1.9]} c="#465249" />
    <B p={[1.95, 1.15, 0]} s={[1.3, 1.5, 2.0]} c="#56645a" />
    <B p={[2.85, 0.8, 0]} s={[0.7, 0.75, 1.9]} c="#465249" />
    <B p={[2.61, 1.55, 0]} s={[0.04, 0.5, 1.7]} c="#1c2430" />
    {[-1.6, -0.5, 0.6].map((x) => (
      <B key={x} p={[x, 2.1, 1.06]} s={[0.35, 0.22, 0.02]} c="#1c2430" />
    ))}
    <Sign p={[-0.5, 1.35, 1.07]} s={[2.5, 0.62]} text="BRINK'S" bg="#3d4a40" fg="#e9dfb8" e={0.35} />
    {[-1.6, 2.2].map((x) => [-1, 1].map((z) => <Wheel key={`${x}${z}`} p={[x, 0.42, z * 1.0]} />))}
    <Headlights x={3.22} y={0.85} lit={lit} />
  </group>
);

export const StakeTruck = ({p, rot = 0, lit = false, sacks = false}: {p: V3; rot?: number; lit?: boolean; sacks?: boolean}) => (
  <group position={p} rotation={[0, rot, 0]}>
    <B p={[1.55, 1.25, 0]} s={[1.3, 1.3, 1.9]} c="#3f6b45" />
    <B p={[2.5, 0.9, 0]} s={[0.9, 0.75, 1.6]} c="#3f6b45" />
    <B p={[2.21, 1.55, 0]} s={[0.04, 0.5, 1.6]} c="#1c2430" />
    <B p={[2.97, 0.85, 0]} s={[0.06, 0.5, 1.2]} c="#9aa3ad" />
    <B p={[-0.9, 0.85, 0]} s={[3.6, 0.15, 2.0]} c="#5b4630" />
    {[-0.95, 0.95].map((z) =>
      [1.15, 1.45, 1.75].map((y) => <B key={`${z}${y}`} p={[-0.9, y, z]} s={[3.6, 0.12, 0.06]} c="#7b5637" />),
    )}
    {[-2.65, -0.9, 0.85].map((x) => [-0.95, 0.95].map((z) => <B key={`${x}${z}`} p={[x, 1.35, z]} s={[0.1, 1.0, 0.1]} c="#5b4630" />))}
    {sacks
      ? [0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-2 + i * 0.75, 1.25, (i % 2) * 0.5 - 0.25]} scale={[1, 0.8, 0.9]}>
            <icosahedronGeometry args={[0.38, 0]} />
            <meshStandardMaterial color={CANVAS} flatShading roughness={1} />
          </mesh>
        ))
      : null}
    {[-1.9, 2.3].map((x) => [-1, 1].map((z) => <Wheel key={`${x}${z}`} p={[x, 0.42, z * 0.98]} />))}
    <Headlights x={2.98} y={0.95} lit={lit} />
  </group>
);

export const Sedan = ({p, rot = 0, c = '#3a4866', lit = true}: {p: V3; rot?: number; c?: string; lit?: boolean}) => (
  <group position={p} rotation={[0, rot, 0]}>
    <B p={[0, 0.72, 0]} s={[4.2, 0.65, 1.8]} c={c} />
    <B p={[-0.25, 1.3, 0]} s={[2.1, 0.6, 1.6]} c={c} />
    <B p={[-0.25, 1.3, 0.81]} s={[1.8, 0.4, 0.02]} c="#0d1018" />
    <B p={[-0.25, 1.3, -0.81]} s={[1.8, 0.4, 0.02]} c="#0d1018" />
    <B p={[2.12, 0.6, 0]} s={[0.06, 0.25, 1.5]} c="#9aa3ad" />
    {[-1.4, 1.4].map((x) => [-1, 1].map((z) => <Wheel key={`${x}${z}`} p={[x, 0.36, z * 0.85]} r={0.36} />))}
    <Headlights x={2.12} y={0.85} lit={lit} />
  </group>
);

/* ---------- counting room ---------- */
const MoneyStack = ({p, h}: {p: V3; h: number}) => (
  <group position={p}>
    {Array.from({length: h}, (_, k) => (
      <group key={k}>
        <B p={[0, 0.045 + k * 0.09, 0]} s={[0.5, 0.08, 0.24]} c={BILL} />
        <B p={[0, 0.045 + k * 0.09, 0]} s={[0.12, 0.085, 0.25]} c={BAND} />
      </group>
    ))}
  </group>
);

const Sack = ({p, s = 1}: {p: V3; s?: number}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.42, 0]} scale={[1, 1.15, 0.95]}>
      <icosahedronGeometry args={[0.42, 0]} />
      <meshStandardMaterial color={CANVAS} flatShading roughness={1} />
    </mesh>
    <Cyl p={[0, 0.92, 0]} s={[0.1, 0.16, 0.22]} seg={6} c={CANVAS} />
    <Cyl p={[0, 0.98, 0]} s={[0.12, 0.12, 0.04]} seg={6} c="#5b4630" />
  </group>
);

const Table = ({p, w = 3.2, d = 1.3, c = '#6b5a48'}: {p: V3; w?: number; d?: number; c?: string}) => (
  <group position={p}>
    <B p={[0, 0.9, 0]} s={[w, 0.1, d]} c={c} />
    {[-1, 1].map((sx) => [-1, 1].map((sz) => <B key={`${sx}${sz}`} p={[sx * (w / 2 - 0.1), 0.43, sz * (d / 2 - 0.1)]} s={[0.08, 0.86, 0.08]} c="#3b2d22" />))}
  </group>
);

export const CountingRoom = ({shot}: SceneProps) => {
  const workers = shot.workers ?? 4;
  const robbers = shot.robbers ?? 0;
  const full = !shot.empty;
  const tables: V3[] = [[-2.2, 0, 0], [2.4, 0, 0.5]];
  return (
    <>
      <Room w={12} h={4.6} back={-4} wall="#3f6f6a" floor="#55574f" ceil="#2f524e" />
      {/* wire cage in front of the safe */}
      {Array.from({length: 25}, (_, i) => (
        <B key={`v${i}`} p={[-6 + i * 0.5, 2.3, -3]} s={[0.03, 4.6, 0.03]} c="#8f9aa6" />
      ))}
      {Array.from({length: 9}, (_, j) => (
        <B key={`h${j}`} p={[0, 0.25 + j * 0.5, -3]} s={[12, 0.03, 0.03]} c="#8f9aa6" />
      ))}
      <B p={[3.8, 1.1, -3.6]} s={[1.7, 2.2, 0.7]} c="#2f3640" />
      <Cyl p={[3.8, 1.2, -3.22]} s={[0.22, 0.22, 0.06]} r={[Math.PI / 2, 0, 0]} seg={10} c="#d9a441" />
      <B p={[-3.4, 1.0, -3.6]} s={[2.2, 2.0, 0.7]} c="#6f7f86" />
      {tables.map((tp, ti) => (
        <group key={ti}>
          <Table p={tp} />
          {full
            ? Array.from({length: 8}, (_, i) => (
                <MoneyStack key={i} p={[tp[0] - 1.15 + (i % 4) * 0.75, 0.95, tp[2] - 0.3 + Math.floor(i / 4) * 0.55]} h={1 + Math.floor(rnd(`ms${ti}${i}`) * 4)} />
              ))
            : null}
          <Cyl p={[tp[0], 4.1, tp[2]]} s={[0.015, 0.015, 1.0]} seg={4} c="#22252d" />
          <Cyl p={[tp[0], 3.55, tp[2]]} s={[0.18, 0.55, 0.32]} seg={8} c="#2f524e" />
          <Lamp p={[tp[0], 3.38, tp[2]]} size={0.1} halo={2.2} power={16} />
        </group>
      ))}
      {full ? [[-4.3, 0, 1.4], [-3.5, 0, 1.9], [0.2, 0, 1.6], [4.5, 0, 1.8], [3.7, 0, 2.3]].map((sp, i) => <Sack key={i} p={sp as V3} s={0.9} />) : null}
      {/* workers: standing at the tables, or tied up on the floor */}
      {Array.from({length: workers}, (_, i) =>
        shot.tied ? (
          <group key={i} position={[-3.6 + i * 2.1, 0, 2.6 + (i % 2) * 0.5]} rotation={[0, 1.3 + rnd(`ty${i}`) * 0.6, 0]}>
            <Figure p={[0, 0, 0]} coat={COATS.worker} hat="cap" lying />
          </group>
        ) : (
          <Figure key={i} p={[[-3, -1.3, 1.7, 3.3][i % 4], 0, -1.0]} coat={COATS.worker} hat="cap" rot={(i % 2 ? -1 : 1) * 0.25} />
        ),
      )}
      {Array.from({length: robbers}, (_, i) => (
        <Figure
          key={i}
          p={[-2.6 + i * 2.2, 0, 3.3 - (i % 2) * 0.7]}
          coat={COATS.navy}
          hat="cap"
          rot={(i % 2 ? -1 : 1) * 0.55}
          mask={shot.masks ? MASKS[i % 4] : undefined}
          carry={shot.sacks}
        />
      ))}
    </>
  );
};

/* ---------- money on a table, close up ---------- */
export const Cash = ({shot, t}: SceneProps) => {
  const n = shot.few ? 2 : 24;
  return (
    <>
      <Room w={30} h={12} back={-9} front={16} wall="#1b2230" floor="#4a3526" />
      {Array.from({length: n}, (_, i) => (
        <MoneyStack
          key={i}
          p={shot.few ? [i * 0.7 - 0.35, 0, 0.1] : [(i % 6) * 0.62 - 1.55 + rnd(`cx${i}`) * 0.1, 0, Math.floor(i / 6) * 0.42 - 0.65]}
          h={shot.few ? 1 + i : 1 + Math.floor(rnd(`ch${i}`) * 5)}
        />
      ))}
      {Array.from({length: shot.few ? 3 : 14}, (_, i) => (
        <B
          key={i}
          p={[(rnd(`lx${i}`) - 0.5) * 3.6, 0.01 + i * 0.002, (rnd(`lz${i}`) - 0.5) * 2.4 + 0.4]}
          s={[0.5, 0.004, 0.24]}
          r={[0, rnd(`lr${i}`) * 3 + t * 0.2, 0]}
          c={BILL}
        />
      ))}
      {shot.sacks && !shot.few
        ? [[-1.9, 0, -1.2], [1.9, 0, -1.1], [-2.4, 0, 0.6], [2.3, 0, 0.8]].map((sp, i) => <Sack key={i} p={sp as V3} s={0.8} />)
        : null}
      <pointLight position={[0.4, 2.8, 1]} color="#ffd9a0" intensity={shot.few ? 5 : 12} distance={10} decay={1.5} />
      <Glow p={[0, 0.5, 0]} size={4.5} c="#b8e0a8" strength={shot.few ? 0.05 : 0.12} />
    </>
  );
};

/* ---------- one locked door, close up ---------- */
export const DoorLock = ({shot, t}: SceneProps) => {
  const swing = shot.open ? lerp(0, -1.25, Math.max(0, t * 1.4 - 0.3)) : 0;
  const out = shot.remove ? lerp(0, 0.75, t) : 0;
  const keyIn = shot.key ? lerp(0.8, 0.0, Math.min(1, t * 2)) : null;
  return (
    <>
      <Room w={6} h={4} back={-0.3} front={10} wall="#6b7f7a" floor="#3a3f48" ceil="#4d5f5b" />
      <B p={[0, 3.98, 2]} s={[6, 0.04, 0.2]} c="#4d5f5b" />
      <B p={[0, 1.45, -0.18]} s={[1.75, 3.0, 0.12]} c="#2a2f38" />
      {shot.open ? (
        <>
          <B p={[0, 1.35, -0.2]} s={[1.4, 2.7, 0.04]} c="#0b0d12" />
          <Glow p={[0.2, 1.5, -0.5]} size={3} c="#ffb766" strength={0.5} />
        </>
      ) : null}
      <group position={[-0.7, 0, -0.08]} rotation={[0, swing, 0]}>
        <group position={[0.7, 0, 0]}>
          <B p={[0, 1.35, 0]} s={[1.4, 2.7, 0.1]} c="#6b4a32" />
          <B p={[0, 1.95, 0.06]} s={[1.0, 0.9, 0.02]} c="#5d3f2a" />
          <B p={[0, 0.75, 0.06]} s={[1.0, 0.9, 0.02]} c="#5d3f2a" />
          <Cyl p={[0.5, 1.15, 0.1]} s={[0.07, 0.07, 0.1]} r={[Math.PI / 2, 0, 0]} seg={8} c="#d9a441" />
          <B p={[0.5, 1.45, 0.06]} s={[0.14, 0.24, 0.02]} c="#b8862b" />
          <group position={[0.5, 1.45 + out * 0.3, 0.1 + out]}>
            <Cyl p={[0, 0, 0]} s={[0.055, 0.055, 0.14]} r={[Math.PI / 2, 0, 0]} seg={10} c="#e0b45a" e={0.15} />
            <B p={[0, 0, 0.07]} s={[0.012, 0.055, 0.01]} c="#1a1a1a" />
          </group>
          {keyIn !== null ? (
            <group position={[0.5, 1.45, 0.17 + keyIn]}>
              <B p={[0, 0, 0.12]} s={[0.02, 0.05, 0.26]} c="#d9a441" />
              <Cyl p={[0, 0, 0.3]} s={[0.07, 0.07, 0.02]} r={[Math.PI / 2, 0, 0]} seg={8} c="#d9a441" />
            </group>
          ) : null}
        </group>
      </group>
      <Sign p={[0, 3.2, -0.1]} s={[0.6, 0.42]} text={shot.label ?? '1'} bg="#14161c" fg="#f6d27a" />
      <Lamp p={[0, 3.75, 1]} c="#ffe2b0" size={0.08} halo={1.6} power={9} />
      {Array.from({length: shot.crew ?? 0}, (_, i) => (
        <Figure key={i} p={[i % 2 ? -1.6 : 1.6, 0, 1.0 + i * 0.4]} coat={COATS.navy} hat="cap" rot={i % 2 ? 0.5 : -0.5} mask={shot.masks ? MASKS[i % 4] : undefined} />
      ))}
    </>
  );
};

/* ---------- stairwell: figures climb up, or come down carrying sacks ---------- */
export const Stairs = ({shot, t}: SceneProps) => {
  const N = 14;
  const rise = 0.28;
  const run = 0.42;
  const heightAt = (z: number) => Math.min(N, Math.max(0, Math.ceil(-z / run))) * rise;
  return (
    <>
      <Room w={3.2} h={9} back={-N * run - 3} front={8} wall="#4d6470" floor="#3a3f48" ceil="#2e3640" />
      {Array.from({length: N}, (_, i) => (
        <B key={i} p={[0, ((i + 1) * rise) / 2, -(i + 0.5) * run]} s={[2.6, (i + 1) * rise, run]} c={i % 2 ? '#5a5f68' : '#626872'} />
      ))}
      <B p={[0, (N * rise) / 2, -N * run - 1.5]} s={[3.2, N * rise, 3]} c="#5a5f68" />
      <B p={[0, N * rise + 1.4, -N * run - 2.95]} s={[1.3, 2.4, 0.06]} c={shot.time === 'night' ? '#1a1f2a' : '#ffcf7a'} e={shot.time === 'night' ? 0 : 0.8} />
      <B p={[1.25, 1 + (N * rise) / 2, -(N * run) / 2]} s={[0.06, 0.06, N * run * 1.18]} r={[Math.atan2(rise, run), 0, 0]} c="#22252d" />
      <Lamp p={[0, N * rise + 3, -N * run]} c="#ffe2b0" size={0.1} halo={2.5} power={14} />
      <Lamp p={[0, 3.2, 0.6]} c="#cfe0ff" size={0.08} halo={1.6} power={7} />
      {Array.from({length: shot.crew ?? 0}, (_, i) => {
        const down = !!shot.sacks;
        const u = Math.min(1, Math.max(0, lerp(0.15, 0.75, t) - i * 0.12));
        const z = down ? lerp(-N * run + 0.5, 1.2, u) : lerp(1.2, -N * run + 0.5, u);
        return (
          <Figure
            key={i}
            p={[(i % 2 ? -0.45 : 0.45), heightAt(z), z]}
            coat={COATS.navy}
            hat="cap"
            rot={down ? 0 : Math.PI}
            mask={shot.masks ? MASKS[i % 4] : undefined}
            carry={down}
          />
        );
      })}
    </>
  );
};

/* ---------- dump where the truck ends up ---------- */
export const Junkyard = ({shot}: SceneProps) => {
  const frame = useCurrentFrame();
  const flick = 0.75 + 0.25 * Math.sin(frame * 1.7) * Math.sin(frame * 0.63);
  const night = shot.time !== 'day';
  return (
    <>
      <B p={[0, -0.1, 0]} s={[120, 0.2, 80]} c={night ? '#3a3026' : '#7a6650'} />
      {Array.from({length: 30}, (_, i) => (
        <B key={i} p={[(i - 15) * 1.2, 1.1, -7]} s={[1.1, 2.2 + rnd(`fh${i}`) * 0.4, 0.1]} c={i % 2 ? '#5b4630' : '#6b5238'} />
      ))}
      {Array.from({length: 18}, (_, i) => (
        <Tree key={i} p={[(rnd(`jx${i}`) - 0.5) * 40, 0, -10 - rnd(`jz${i}`) * 10]} h={3 + rnd(`jh${i}`) * 3} c={night ? '#1f3a30' : '#4d7a55'} />
      ))}
      {Array.from({length: 7}, (_, k) => (
        <group key={k} position={[(k - 3) * 3.4 + rnd(`px${k}`), 0, -4 + rnd(`pz${k}`) * 1.5]}>
          {Array.from({length: 6}, (_, i) => (
            <B key={i} p={[(rnd(`a${k}${i}`) - 0.5) * 1.6, 0.25 + i * 0.22, (rnd(`b${k}${i}`) - 0.5) * 1.2]} s={[0.4 + rnd(`c${k}${i}`) * 0.8, 0.3, 0.4 + rnd(`d${k}${i}`) * 0.6]} r={[0, rnd(`e${k}${i}`) * 3, rnd(`f${k}${i}`) * 0.4]} c={['#8a5a3c', '#6f7780', '#59606a', '#7a4a32'][i % 4]} />
          ))}
        </group>
      ))}
      {[[-3.5, 0.3, 1.5], [3.8, 0.3, 2.2], [4.6, 0.3, 0.6]].map((tp, i) => (
        <Cyl key={i} p={tp as V3} s={[0.42, 0.42, 0.3]} r={[0, 0, 0]} seg={10} c="#15171b" />
      ))}
      {/* the green truck, in pieces */}
      <group position={[0, 0, 0.5]}>
        <B p={[-0.4, 0.6, 0]} s={[1.3, 1.2, 1.8]} r={[0.15, 0.4, 0.3]} c="#3f6b45" />
        <B p={[1.4, 0.3, 0.8]} s={[0.9, 0.5, 1.5]} r={[0, -0.6, 0.2]} c="#3f6b45" />
        <B p={[-1.9, 0.12, 1.2]} s={[2.2, 0.12, 1.1]} r={[0, 0.9, 0]} c="#5b4630" />
        {[0, 1, 2, 3].map((i) => (
          <B key={i} p={[0.6 + i * 0.35, 0.05, -1.1 + i * 0.2]} s={[2, 0.08, 0.08]} r={[0, 0.3 + i * 0.4, 0]} c="#7b5637" />
        ))}
        <B p={[2.1, 0.35, -0.8]} s={[0.8, 0.6, 0.7]} r={[0.2, 0.5, 0.15]} c="#4a4f58" />
        <Cyl p={[-1.3, 0.42, -1.2]} s={[0.42, 0.42, 0.3]} r={[Math.PI / 2, 0, 0.3]} seg={10} c="#15171b" />
      </group>
      {shot.fire ? (
        <>
          <pointLight position={[0.3, 1.2, 1.4]} color="#ff9a3c" intensity={30 * flick} distance={12} decay={1.6} />
          <Glow p={[0.3, 0.9, 1.3]} size={2.2 * flick} c="#ffd27a" strength={0.9} />
          <Glow p={[0.3, 0.9, 1.3]} size={5} c="#ff7a2a" strength={0.35} />
          {Array.from({length: 8}, (_, i) => (
            <B key={i} p={[0.3 + Math.sin(frame * 0.9 + i) * 0.4, 0.9 + ((frame * 0.05 + i * 0.17) % 1) * 0.9, 1.3 + Math.cos(frame * 0.7 + i) * 0.3]} s={[0.03, 0.03, 0.03]} c="#ffd27a" e={3} />
          ))}
          <Figure p={[0.9, 0, 2.1]} coat={COATS.navy} hat="cap" rot={-2.4} />
        </>
      ) : null}
      {Array.from({length: shot.agents ?? 0}, (_, i) => (
        <Figure key={i} p={[-1.4 + i * 2.6, 0, 2.6]} coat={COATS.agent} hat="brim" rot={Math.PI + (i ? -0.5 : 0.5)} />
      ))}
    </>
  );
};

/* ---------- Boston street of three-deckers ---------- */
export const Neighborhood = ({shot, t}: SceneProps) => {
  const frame = useCurrentFrame();
  const night = shot.time !== 'day';
  const colors = ['#8a9a8c', '#b8a07a', '#7f8fa3', '#a3786a', '#9a8a70'];
  const carX = lerp(-11, 9, t);
  const firing = shot.flash && frame % 4 < 2;
  return (
    <>
      <B p={[0, -0.1, 0]} s={[140, 0.2, 100]} c={night ? '#1b2238' : '#7f8a80'} />
      <B p={[0, 0.02, 7.5]} s={[140, 0.06, 6]} c={night ? '#12182a' : '#4d4f57'} />
      <B p={[0, 0.08, 3.8]} s={[140, 0.16, 2.4]} c={night ? '#2a3148' : '#b8b2a6'} />
      {[-12, -6, 0, 6, 12].map((x, i) => {
        const lit = night ? 0.45 : 0;
        return (
          <group key={x} position={[x, 0, -1.5]}>
            <B p={[0, 4.6, 0]} s={[5.2, 9.2, 6]} c={colors[i]} />
            <B p={[0, 9.4, 0]} s={[5.6, 0.4, 6.4]} c="#3a3f4a" />
            {[0, 1, 2].map((f) => (
              <group key={f}>
                <B p={[-0.8, 0.9 + f * 3, 3.6]} s={[3.2, 0.12, 1.2]} c="#e9e3cf" />
                <B p={[-0.8, 1.5 + f * 3, 4.15]} s={[3.2, 0.08, 0.08]} c="#e9e3cf" />
                {[-2.3, 0.7].map((px) => (
                  <B key={px} p={[px, 1.9 + f * 3, 4.15]} s={[0.1, 2.0, 0.1]} c="#e9e3cf" />
                ))}
                {[-1.4, 1.6].map((wx) => {
                  const on = rnd(`nw${i}${f}${wx}`) < lit;
                  return <B key={wx} p={[wx, 2.1 + f * 3, 3.02]} s={[0.8, 1.1, 0.04]} c={on ? '#ffcf7a' : '#27323f'} e={on ? 1.5 : 0} />;
                })}
              </group>
            ))}
          </group>
        );
      })}
      {[-7, 5].map((x) => (
        <group key={x} position={[x, 0, 4.6]}>
          <Cyl p={[0, 1.7, 0]} s={[0.05, 0.08, 3.4]} seg={5} c="#22252d" />
          <Lamp p={[0, 3.5, 0]} power={night ? 14 : 0} halo={night ? 2.4 : 0.01} light={night} />
        </group>
      ))}
      {shot.car ? <Sedan p={[carX, 0, 6.6]} lit={night} /> : null}
      {firing ? (
        <>
          <Glow p={[carX - 0.2, 1.3, 5.6]} size={1.6} c="#ffe08a" strength={1} />
          <pointLight position={[carX - 0.2, 1.4, 5.4]} color="#ffd27a" intensity={40} distance={10} decay={1.5} />
        </>
      ) : null}
      {shot.figure || shot.lying ? (
        shot.lying ? (
          <group position={[0.8, 0.16, 4.2]} rotation={[0, 1.4, 0]}>
            <Figure p={[0, 0, 0]} coat={coatOf(shot.figure, COATS.okeefe)} lying />
          </group>
        ) : (
          <Figure p={[0.8, 0.16, 3.9]} coat={coatOf(shot.figure, COATS.okeefe)} rot={0.3} />
        )
      ) : null}
      {Array.from({length: shot.agents ?? 0}, (_, i) => (
        <Figure key={i} p={[-2.2 + i * 1.3, 0.16, 4.1]} coat={COATS.agent} hat="brim" rot={0.4 - i * 0.3} />
      ))}
    </>
  );
};

/* ---------- interview room ---------- */
export const Interrogation = ({shot}: SceneProps) => (
  <>
    <Room w={7} h={4} back={-2.5} wall="#4f6b66" floor="#3a3d44" ceil="#3a504c" />
    <B p={[1.4, 2.1, -2.45]} s={[2.2, 1.2, 0.06]} c="#1a2230" e={0.1} />
    <B p={[1.4, 2.1, -2.48]} s={[2.4, 1.4, 0.04]} c="#2a2f38" />
    <B p={[0, 0.82, 0]} s={[1.5, 0.08, 1.0]} c="#6b5a48" />
    {[-1, 1].map((sx) => [-1, 1].map((sz) => <B key={`${sx}${sz}`} p={[sx * 0.65, 0.39, sz * 0.4]} s={[0.07, 0.78, 0.07]} c="#3b2d22" />))}
    <B p={[0.15, 0.87, 0.1]} s={[0.55, 0.02, 0.38]} r={[0, 0.2, 0]} c="#d9c38a" />
    <B p={[0.18, 0.885, 0.08]} s={[0.46, 0.01, 0.32]} r={[0, 0.2, 0]} c="#f1ecdf" />
    <Cyl p={[0, 3.3, 0]} s={[0.012, 0.012, 1.4]} seg={4} c="#22252d" />
    <Cyl p={[0, 2.55, 0]} s={[0.14, 0.42, 0.28]} seg={8} c="#2a2f38" />
    <Lamp p={[0, 2.42, 0]} size={0.08} halo={2} power={16} />
    <Figure p={[1.05, 0, -0.15]} coat={COATS.agent} hat="brim" rot={-1.25} />
    <Figure p={[-1.05, 0, 0.1]} coat={coatOf(shot.coat, COATS.okeefe)} rot={1.25} />
    {(shot.agents ?? 1) > 1 ? <Figure p={[0.4, 0, -1.6]} coat={COATS.agent} hat="brim" rot={-0.2} /> : null}
  </>
);

/* ---------- courtroom: judge facing camera, defendants' backs to it ---------- */
export const Courtroom = ({shot}: SceneProps) => {
  const n = shot.count ?? 0;
  return (
    <>
      <Room w={16} h={6} back={-6} wall="#6b4a32" floor="#5a4030" ceil="#4a3424" />
      {Array.from({length: 9}, (_, i) => (
        <B key={i} p={[(i - 4) * 1.8, 2.2, -5.85]} s={[0.12, 4.4, 0.08]} c="#5d3f2a" />
      ))}
      <Cyl p={[0, 4.1, -5.84]} s={[0.7, 0.7, 0.06]} r={[Math.PI / 2, 0, 0]} seg={12} c="#d9a441" e={0.2} />
      <B p={[0, 0.4, -4.7]} s={[6, 0.8, 2.2]} c="#5d3f2a" />
      <B p={[0, 1.45, -3.75]} s={[5, 1.3, 0.3]} c="#6b4a32" />
      <B p={[0, 2.12, -3.85]} s={[5.2, 0.08, 0.6]} c="#7b5637" />
      <Figure p={[0, 1.15, -4.4]} coat={COATS.judge} />
      <B p={[1.2, 2.2, -3.75]} s={[0.3, 0.08, 0.1]} r={[0, 0.4, 0]} c="#3b2d22" />
      {/* jury */}
      <B p={[-5.4, 0.6, -1.4]} s={[0.12, 1.2, 4.4]} c="#6b4a32" />
      {Array.from({length: 8}, (_, i) => (
        <Figure key={i} p={[-6.2 - (i % 2) * 0.9, (i % 2) * 0.3, -3.1 + Math.floor(i / 2) * 1.05]} coat={['#5d6b78', '#6b6470', '#4f5f58', '#70685c'][i % 4]} rot={Math.PI / 2} scale={0.9} />
      ))}
      {/* defence table and defendants */}
      {n > 0 ? <B p={[0, 0.8, -0.2]} s={[Math.max(3, n * 0.95), 0.08, 1]} c="#7b5637" /> : null}
      {Array.from({length: n}, (_, i) => (
        <Figure key={i} p={[(i - (n - 1) / 2) * 0.95, 0, 0.8]} coat={i % 2 ? '#2a2f3a' : '#3b3f4a'} rot={Math.PI} />
      ))}
      <pointLight position={[0, 5, -2]} color="#ffe2b0" intensity={24} distance={18} decay={1.5} />
      <pointLight position={[0, 4, 4]} color="#ffd9a8" intensity={14} distance={14} decay={1.5} />
    </>
  );
};
