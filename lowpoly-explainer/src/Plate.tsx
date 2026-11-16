import {Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Shot} from './types';

const RATE = 0.02; // zoom per second: the same slow push as the street clip
const PAN = 1.2; // percent of the frame per second

/* A path-traced still or clip, with a linear 2D move so the picture never sits still.
   The 3D camera is locked off when these are rendered (see blender/street.py). */
export const Plate = ({shot, story}: {shot: Shot; story: string}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = (frame - shot.from) / fps;
  const dur = (shot.to - shot.from) / fps;
  let scale = 1 + RATE * t;
  let tx = 0;
  let ty = 0;
  if (shot.camera === 'pull_out') scale = 1 + RATE * (dur - t);
  if (shot.camera === 'pan_left' || shot.camera === 'pan_right') {
    scale = 1.07;
    tx = (shot.camera === 'pan_left' ? 1 : -1) * (t - dur / 2) * PAN;
  }
  if (shot.camera === 'tilt_up' || shot.camera === 'tilt_down') {
    scale = 1.07;
    ty = (shot.camera === 'tilt_up' ? 1 : -1) * (t - dur / 2) * PAN;
  }
  const [ax, ay] = shot.anchor ?? [0.5, 0.55];
  const style = {
    position: 'absolute' as const, width: '100%', height: '100%', objectFit: 'cover' as const,
    transformOrigin: `${ax * 100}% ${ay * 100}%`, transform: `translate(${tx}%, ${ty}%) scale(${scale})`,
  };
  if (shot.clip) {
    return (
      <Sequence from={shot.from} layout="none">
        <OffthreadVideo src={staticFile(`${story}/plates/${shot.clip}.mp4`)} muted style={style} />
      </Sequence>
    );
  }
  return <Img src={staticFile(`${story}/plates/${shot.plate}.jpg`)} style={style} />;
};
