import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/800.css';
import '@fontsource/eb-garamond/400-italic.css';
import '@fontsource/eb-garamond/500.css';
import {AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {DocShot} from './types';

const GOLD = '#d4b06a';
const PARCHMENT = '#f1e6cc';
const ease = Easing.bezier(0.42, 0, 0.58, 1);

const progress = (frame: number, shot: DocShot) =>
  interpolate(frame, [shot.from, shot.to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

/* An image moved slowly between two views. A view is the point of the image at the frame's centre
   and a zoom on top of fitting the image to the frame. */
export const ArtShot = ({shot, story}: {shot: DocShot; story: string}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const iw = shot.w ?? 1600;
  const ih = shot.h ?? 1200;
  const contain = shot.fit === 'contain';
  const base = contain ? Math.min(W / iw, H / ih) * 0.92 : Math.max(W / iw, H / ih);
  const p = progress(frame, shot);
  const [x0, y0, z0] = shot.start ?? [0.5, 0.5, 1];
  const [x1, y1, z1] = shot.end ?? [0.5, 0.5, 1.08];
  const z = z0 + (z1 - z0) * p;
  const s = base * z;
  let cx = x0 + (x1 - x0) * p;
  let cy = y0 + (y1 - y0) * p;
  if (!contain) {
    // never show past the image's edge
    const hx = W / (2 * iw * s);
    const hy = H / (2 * ih * s);
    cx = Math.min(1 - hx, Math.max(hx, cx));
    cy = Math.min(1 - hy, Math.max(hy, cy));
  }
  const src = staticFile(`${story}/art/${shot.src}`);
  const img = {
    position: 'absolute' as const,
    width: iw * s,
    height: ih * s,
    left: W / 2 - cx * iw * s,
    top: H / 2 - cy * ih * s,
  };
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#0b0907'}}>
      {contain ? (
        <Img
          src={src}
          style={{position: 'absolute', width: '110%', height: '110%', left: '-5%', top: '-5%', objectFit: 'cover',
            filter: 'blur(40px) brightness(0.38) saturate(0.8)'}}
        />
      ) : null}
      <Img src={src} style={{...img, boxShadow: contain ? '0 20px 80px rgba(0,0,0,0.75)' : undefined}} />
    </AbsoluteFill>
  );
};

/* A rendered 3D clip, with an optional slow zoom. */
export const ClipShot = ({shot, story}: {shot: DocShot; story: string}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [za, zb] = shot.zoom ?? [1, 1];
  const z = za + (zb - za) * progress(frame, shot);
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: 'black'}}>
      <Sequence from={shot.from} layout="none">
        <OffthreadVideo
          src={staticFile(`${story}/clips/${shot.src}`)}
          startFrom={Math.round((shot.clip_start ?? 0) * fps)}
          playbackRate={shot.rate ?? 1}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`}}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

const fadeInOut = (frame: number, shot: DocShot, inF = 20, outF = 20) =>
  interpolate(frame, [shot.from, shot.from + inF, shot.to - outF, shot.to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

const Rule = ({width}: {width: number}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 18, justifyContent: 'center'}}>
    <div style={{width, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD})`}} />
    <div style={{width: 9, height: 9, transform: 'rotate(45deg)', border: `1.5px solid ${GOLD}`}} />
    <div style={{width, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)`}} />
  </div>
);

/* "Chapter II" over a darkened, blurred picture. */
export const ChapterCard = ({shot, story}: {shot: DocShot; story: string}) => {
  const frame = useCurrentFrame();
  const {width: W} = useVideoConfig();
  const u = W / 1920; // sizes are designed for 1920 wide
  const o = fadeInOut(frame, shot);
  const rise = interpolate(frame - shot.from, [0, 40], [24, 0], {extrapolateRight: 'clamp', easing: ease});
  const zoom = 1.04 + 0.05 * progress(frame, shot);
  return (
    <AbsoluteFill style={{backgroundColor: '#070605', alignItems: 'center', justifyContent: 'center'}}>
      {shot.bg ? (
        <Img
          src={staticFile(`${story}/art/${shot.bg}`)}
          style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`,
            filter: 'blur(6px) brightness(0.28) sepia(0.4)'}}
        />
      ) : null}
      <div style={{position: 'relative', opacity: o, transform: `translateY(${rise * u}px)`, textAlign: 'center',
        padding: `0 ${120 * u}px`}}>
        <div style={{fontFamily: 'Cinzel', fontWeight: 600, fontSize: 34 * Math.max(u, 0.75), letterSpacing: '0.42em',
          color: GOLD, marginBottom: 26 * u}}>
          {shot.label}
        </div>
        <Rule width={150 * u} />
        <div style={{fontFamily: 'EB Garamond', fontStyle: 'italic', fontSize: 104 * Math.max(u, 0.7), color: PARCHMENT,
          margin: `${18 * u}px 0`, lineHeight: 1.1, textShadow: '0 4px 30px rgba(0,0,0,0.8)'}}>
          {shot.title}
        </div>
        <Rule width={150 * u} />
      </div>
    </AbsoluteFill>
  );
};

/* The opening title. */
export const TitleShot = ({shot}: {shot: DocShot}) => {
  const frame = useCurrentFrame();
  const {width: W} = useVideoConfig();
  const u = W / 1920;
  const o = fadeInOut(frame, shot, 30, 30);
  const spread = interpolate(frame - shot.from, [0, 90], [0.6, 0.32], {extrapolateRight: 'clamp', easing: ease});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0.15), rgba(0,0,0,0.65))'}}>
      <div style={{opacity: o, textAlign: 'center'}}>
        <div style={{fontFamily: 'Cinzel', fontWeight: 800, fontSize: 150 * Math.max(u, 0.62), letterSpacing: `${spread}em`,
          color: PARCHMENT, textShadow: '0 6px 40px rgba(0,0,0,0.9), 0 0 60px rgba(255,140,40,0.25)', lineHeight: 1.05}}>
          {shot.title}
        </div>
        <div style={{marginTop: 28 * u}}><Rule width={220 * u} /></div>
        <div style={{fontFamily: 'EB Garamond', fontStyle: 'italic', fontSize: 52 * Math.max(u, 0.8), color: GOLD,
          marginTop: 22 * u, textShadow: '0 3px 20px rgba(0,0,0,0.9)'}}>
          {shot.sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* A quotation from a primary source, over a darkened picture. */
export const QuoteCard = ({shot, story}: {shot: DocShot; story: string}) => {
  const frame = useCurrentFrame();
  const {width: W} = useVideoConfig();
  const u = W / 1920;
  const o = fadeInOut(frame, shot, 18, 18);
  const zoom = 1.02 + 0.06 * progress(frame, shot);
  return (
    <AbsoluteFill style={{backgroundColor: '#0a0806', alignItems: 'center', justifyContent: 'center'}}>
      {shot.bg ? (
        <Img
          src={staticFile(`${story}/art/${shot.bg}`)}
          style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`,
            filter: 'brightness(0.32) sepia(0.35) blur(2px)'}}
        />
      ) : null}
      <div style={{position: 'relative', opacity: o, maxWidth: W > 1200 ? 1350 * u : W * 0.84, textAlign: 'center'}}>
        <div style={{fontFamily: 'EB Garamond', fontSize: 120 * Math.max(u, 0.7), color: GOLD, lineHeight: 0.6,
          height: 60 * Math.max(u, 0.7)}}>&ldquo;</div>
        <div style={{fontFamily: 'EB Garamond', fontStyle: 'italic', fontSize: 66 * Math.max(u, 0.66), color: PARCHMENT,
          lineHeight: 1.3, textShadow: '0 3px 24px rgba(0,0,0,0.9)'}}>
          {shot.text}
        </div>
        <div style={{fontFamily: 'Cinzel', fontWeight: 600, fontSize: 26 * Math.max(u, 0.8), letterSpacing: '0.25em',
          color: GOLD, marginTop: 36 * u}}>
          {shot.by}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* Closing card: subscribe, then the credits the licences ask for. */
export const EndCard = ({shot, story}: {shot: DocShot; story: string}) => {
  const frame = useCurrentFrame();
  const {width: W} = useVideoConfig();
  const u = W / 1920;
  const o = fadeInOut(frame, shot, 24, 30);
  return (
    <AbsoluteFill style={{backgroundColor: '#070605', alignItems: 'center', justifyContent: 'center'}}>
      {shot.bg ? (
        <Img src={staticFile(`${story}/art/${shot.bg}`)}
          style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.2) blur(8px)'}} />
      ) : null}
      <div style={{position: 'relative', opacity: o, textAlign: 'center', padding: `0 ${80 * u}px`}}>
        <div style={{fontFamily: 'Cinzel', fontWeight: 800, fontSize: 70 * Math.max(u, 0.7), color: PARCHMENT,
          letterSpacing: '0.2em'}}>{shot.title}</div>
        <div style={{margin: `${24 * u}px 0 ${40 * u}px`}}><Rule width={180 * u} /></div>
        {(shot.lines ?? []).map((l, i) => (
          <div key={i} style={{fontFamily: 'EB Garamond', fontSize: 27 * Math.max(u, 0.8), color: '#cbbf9f',
            lineHeight: 1.45}}>{l}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* Title and date of the artwork on screen, small, lower left. */
export const Credit = ({shot}: {shot: DocShot}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const u = Math.min(W, H) / 1080;
  const o = interpolate(frame, [shot.from + 20, shot.from + 40, shot.to - 30, shot.to - 12], [0, 0.85, 0.85, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  if (!shot.credit) return null;
  const wide = W > H;
  return (
    <div style={{position: 'absolute', left: wide ? 60 * u : 0, right: wide ? undefined : 0, textAlign: wide ? 'left' : 'center',
      top: wide ? 52 * u : 150 * u, opacity: o, fontFamily: 'Cinzel', fontWeight: 600, fontSize: 25 * u,
      letterSpacing: '0.18em', color: '#e8dcc0', textShadow: '0 2px 10px rgba(0,0,0,0.95)'}}>
      {shot.credit}
    </div>
  );
};
