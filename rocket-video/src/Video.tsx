import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Hook} from '../scenes/01_hook';
import {HowItMoves} from '../scenes/02_how_it_moves';
import {FuelProblem} from '../scenes/03_fuel_problem';
import {Staging} from '../scenes/04_staging';
import {OrbitCannon} from '../scenes/05_orbit_cannon';
import {TheNumber} from '../scenes/06_the_number';
import {EndCard} from '../scenes/07_endcard';
import {CameraBump, Captions, Overlays} from './components/Paper';
import {BEATS, DURATION, SceneId, TRANSITION} from './timeline';
import './fonts';

const SCENES: [SceneId, React.FC][] = [
  ['hook', Hook],
  ['move', HowItMoves],
  ['fuel', FuelProblem],
  ['staging', Staging],
  ['orbit', OrbitCannon],
  ['number', TheNumber],
  ['end', EndCard],
];

export const RocketVideo: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#EFE8DA', overflow: 'hidden'}}>
    <CameraBump>
      {SCENES.map(([id, Scene], i) => {
        const b = BEATS[id];
        const last = i === SCENES.length - 1;
        // keep each scene alive under the next sheet while it slides in
        const dur = (last ? DURATION : b.to + TRANSITION) - b.from;
        return (
          <Sequence key={id} from={b.from} durationInFrames={dur} name={id}>
            <Scene />
          </Sequence>
        );
      })}
      <Captions />
    </CameraBump>
    <Overlays />
  </AbsoluteFill>
);
