import React from 'react';
import {Composition} from 'remotion';
import {RocketVideo} from './Video';
import {DURATION, FPS, HEIGHT, WIDTH} from './timeline';

export const Root: React.FC = () => (
  <Composition id="RocketOrbit" component={RocketVideo} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
