import type {SceneProps} from '../Stage';
import {B, Building, Cyl, Figure, Gem, Glow, HERO, Lamp, Sign, Tree, lerp, rnd} from '../parts';

const GROUND = {day: '#8fa39a', dusk: '#8a6a5c', night: '#141c33'};

// The diamond district: one landmark building, neighbours, lamps and passers-by.
export const Street = ({shot, t}: SceneProps) => {
  const night = shot.time === 'night';
  const lit = shot.time === 'day' ? 0.08 : night ? 0.3 : 0.6;
  const stone = night ? '#59607a' : shot.time === 'dusk' ? '#d7b08a' : '#d8cbb4';
  const neighbours = [-2, -1, 1, 2].map((i) => {
    const h = 6 + rnd(`nb${i}`) * 5;
    return <Building key={i} p={[i * 6.6 + Math.sign(i) * 1.2, 0, -0.6]} s={[6, h, 5]} c={i % 2 ? '#a9917c' : '#8c97a3'} lit={lit} seed={`nb${i}`} />;
  });
  const back = Array.from({length: 9}, (_, i) => (
    <Building key={i} p={[(i - 4) * 7, 0, -14 - rnd(`bk${i}`) * 6]} s={[6, 9 + rnd(`bh${i}`) * 9, 5]} c="#76808f" lit={lit} seed={`bk${i}`} />
  ));
  return (
    <>
      <B p={[0, -0.1, 0]} s={[160, 0.2, 120]} c={GROUND[shot.time]} />
      <B p={[0, 0.02, 7]} s={[160, 0.06, 5]} c={night ? '#0e1426' : '#4d4f57'} />
      <B p={[0, 0.08, 3.6]} s={[160, 0.16, 2]} c={night ? '#27304a' : '#b8b2a6'} />
      {/* Diamond Centre */}
      <Building p={[0, 0, 0]} s={[6.6, 10, 5.2]} c={stone} lit={night ? 0.05 : lit} seed="centre" />
      <B p={[0, 1.3, 2.62]} s={[1.9, 2.6, 0.1]} c="#1c2230" />
      <B p={[0, 2.9, 2.9]} s={[3.6, 0.16, 0.9]} c="#2a2f3a" />
      <Sign p={[0, 3.7, 2.68]} s={[4.6, 0.9]} text="DIAMOND CENTRE" bg="#11141b" fg="#f6d27a" />
      <Gem p={[0, 11.4, 0]} size={0.9} c="#bfeaff" e={night ? 1.2 : 0.5} />
      {night ? <Glow p={[0, 11.4, 0]} size={5} c="#9fdcff" strength={0.5} /> : null}
      {neighbours}
      {back}
      {[-9, -3.6, 3.6, 9].map((x) => (
        <group key={x} position={[x, 0, 4.2]}>
          <Cyl p={[0, 1.7, 0]} s={[0.05, 0.08, 3.4]} seg={5} c="#22252d" />
          <Lamp p={[0, 3.5, 0]} power={shot.time === 'day' ? 0 : 16} halo={shot.time === 'day' ? 0.01 : 2.6} light={shot.time !== 'day'} />
        </group>
      ))}
      {night
        ? null
        : [0, 1, 2, 3, 4].map((i) => {
            const dir = i % 2 ? 1 : -1;
            const x = (rnd(`w${i}`) * 16 - 8) + dir * t * 1.6;
            return <Figure key={i} p={[x, 0.16, 3.3 + rnd(`wz${i}`) * 0.9]} coat={i === 2 ? HERO : ['#4b5a6b', '#7a5a4a', '#3c4f45', '#6b6470'][i % 4]} rot={dir * 1.57} />;
          })}
    </>
  );
};

// City at a distance: towers, a cathedral spire, water and a low sun or moon.
export const Skyline = ({shot}: SceneProps) => {
  const night = shot.time === 'night';
  const towers = Array.from({length: 46}, (_, i) => {
    const row = i % 3;
    const x = (rnd(`sx${i}`) - 0.5) * 80;
    const h = 4 + rnd(`sh${i}`) * (10 - row * 2);
    return <Building key={i} p={[x, 0, -row * 7 - rnd(`sz${i}`) * 4]} s={[3 + rnd(`sw${i}`) * 3, h, 4]} c={['#39435c', '#4a546c', '#2e3750'][row]} lit={night ? 0.42 : 0.2} seed={`sk${i}`} />;
  });
  return (
    <>
      <B p={[0, -0.1, 0]} s={[240, 0.2, 200]} c={night ? '#0c1730' : '#7a5f6b'} />
      <B p={[0, 0.02, 14]} s={[240, 0.06, 20]} c={night ? '#12224a' : '#c98a66'} />
      {towers}
      {/* cathedral */}
      <B p={[-6, 5, -10]} s={[3, 10, 3]} c="#55607a" />
      <Cyl p={[-6, 14, -10]} s={[0, 1.8, 8]} seg={6} c="#6b7690" />
      <Lamp p={[night ? 16 : -18, night ? 26 : 9, -60]} c={night ? '#dfe8ff' : '#ffd08a'} size={night ? 2.6 : 4} halo={night ? 22 : 40} light={false} />
    </>
  );
};

// A road through woods: verge, guard rail, optional car, dumped bag and people.
export const Roadside = ({shot, t}: SceneProps) => {
  const night = shot.time !== 'day';
  const trees = Array.from({length: 44}, (_, i) => (
    <Tree key={i} p={[(rnd(`tx${i}`) - 0.5) * 44, 0, -3.2 - rnd(`tz${i}`) * 16]} h={3 + rnd(`th${i}`) * 3.5} c={night ? ['#1f4a3e', '#27564a', '#1b4238'][i % 3] : ['#3f7a55', '#4d8a5c', '#356b4d'][i % 3]} />
  ));
  const moving = shot.car && !shot.bag;
  const carX = moving ? lerp(-4, 2, t) : 3.4;
  return (
    <>
      <B p={[0, -0.1, 0]} s={[120, 0.2, 80]} c={night ? '#1d3a2c' : '#6f9a63'} />
      {night ? <directionalLight color="#8fa8e8" intensity={1.1} position={[-4, 8, 6]} /> : null}
      <B p={[0, 0.02, 3.4]} s={[120, 0.06, 5]} c={night ? '#1b1f2b' : '#5a5d66'} />
      {Array.from({length: 14}, (_, i) => (
        <B key={i} p={[(i - 7) * 3.4, 0.07, 3.4]} s={[1.5, 0.02, 0.14]} c="#e9e3cf" e={0.2} />
      ))}
      {/* guard rail */}
      <B p={[0, 0.6, 0.7]} s={[60, 0.2, 0.06]} c="#9aa3ad" />
      {Array.from({length: 20}, (_, i) => (
        <B key={i} p={[(i - 10) * 3, 0.3, 0.7]} s={[0.1, 0.6, 0.1]} c="#6f7780" />
      ))}
      {trees}
      {shot.car ? (
        <group position={[carX, 0, 3.2]}>
          <B p={[0, 0.55, 0]} s={[3.2, 0.6, 1.4]} c="#7f8a99" />
          <B p={[-0.2, 1.05, 0]} s={[1.7, 0.5, 1.25]} c="#3b4350" />
          {[-1, 1].map((sx) => [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} p={[sx * 1.05, 0.3, sz * 0.7]} s={[0.3, 0.3, 0.2]} r={[Math.PI / 2, 0, 0]} seg={8} c="#15171b" />))}
          <Lamp p={[1.65, 0.6, 0.45]} c="#fff1c4" size={0.1} halo={1.8} power={10} />
          <Lamp p={[1.65, 0.6, -0.45]} c="#fff1c4" size={0.1} halo={1.8} light={false} />
          <B p={[-1.62, 0.62, 0]} s={[0.04, 0.12, 1.2]} c="#ff3b2e" e={2} />
        </group>
      ) : null}
      {shot.bag ? (
        <group position={[-0.5, 0, 1.5]}>
          <mesh position={[0, 0.42, 0]} scale={[1, 0.85, 0.9]}>
            <icosahedronGeometry args={[0.55, 0]} />
            <meshStandardMaterial color="#23262d" flatShading roughness={1} />
          </mesh>
          <Cyl p={[0.05, 0.92, 0]} s={[0.12, 0.05, 0.18]} seg={5} c="#23262d" />
          <B p={[0.75, 0.04, 0.3]} s={[0.5, 0.02, 0.3]} r={[0, 0.5, 0]} c="#f1ecdf" e={0.15} />
          <B p={[0.55, 0.05, 0.75]} s={[0.5, 0.02, 0.3]} r={[0, -0.4, 0]} c="#f1ecdf" e={0.15} />
          <B p={[-0.7, 0.05, 0.5]} s={[0.3, 0.02, 0.5]} r={[0, 0.2, 0]} c="#e7dcc0" e={0.15} />
          {night ? <pointLight position={[0.6, 2.2, 1.6]} color="#cfe0ff" intensity={22} distance={9} decay={1.5} /> : null}
        </group>
      ) : null}
      {shot.crew ? <Figure p={[1.0, 0, 1.3]} coat="#1b2230" hat="beanie" rot={-0.9} /> : null}
      {shot.local ? <Figure p={[1.0, 0, 1.2]} coat="#4f6b3c" hat="brim" rot={-1.1} /> : null}
    </>
  );
};

// Dark backdrop for the title card: a few dim gems drifting upward.
export const TitleVoid = ({t}: SceneProps) => (
  <>
    <color attach="background" args={['#070a14']} />
    {Array.from({length: 18}, (_, i) => (
      <Gem
        key={i}
        p={[(rnd(`gx${i}`) - 0.5) * 9, rnd(`gy${i}`) * 9 - 2 + t * (0.5 + rnd(`gs${i}`)), -rnd(`gz${i}`) * 8]}
        size={0.12 + rnd(`gsz${i}`) * 0.22}
        r={[rnd(`gr${i}`) * 3, t * 1.5 + i, 0.4]}
        c="#5d7fb8"
        e={0.25}
      />
    ))}
    <Glow p={[2.5, 1, -6]} size={16} c="#f74e30" strength={0.14} />
  </>
);
