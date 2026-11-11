import React from 'react';
import { Composition } from 'remotion';
import { Video } from './Video';
import { VIDEO } from './style';
import { FRAMES } from './timeline';

export const Root: React.FC = () => <Composition id="Short" component={Video} durationInFrames={FRAMES} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />;
