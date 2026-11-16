// Single source of truth for timing. 24 fps timeline, everything animated on twos.
// All frame numbers here are GLOBAL frames. Every scene start is an even frame so
// local (in-Sequence) frames quantise exactly like global frames.
// scripts/export_timeline.mts dumps this file to JSON for the audio mixer.

export const FPS = 24;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 1440; // 60.0 s

export const sec = (s: number) => Math.round(s * FPS / 2) * 2; // seconds -> even frame

export type SceneId = 'hook' | 'move' | 'fuel' | 'staging' | 'orbit' | 'number' | 'end';

export const BEATS: Record<SceneId, {from: number; to: number}> = {
  hook: {from: 0, to: 120},       // 0-5 s
  move: {from: 120, to: 336},     // 5-14 s
  fuel: {from: 336, to: 576},     // 14-24 s
  staging: {from: 576, to: 816},  // 24-34 s
  orbit: {from: 816, to: 1152},   // 34-48 s
  number: {from: 1152, to: 1320}, // 48-55 s
  end: {from: 1320, to: 1440},    // 55-60 s
};

export const TRANSITION = 10; // frames a new paper sheet takes to slide in (5 held steps)

// Key story events (global frames)
export const EV = {
  ignition: 14,
  liftoff: 24,
  pullBack: 58,
  balloonGo: 124,
  rocketThrust: 216,
  vacuumSheet: 286,
  cutawaySlice: 372,
  cutawaySwap: 392,
  barGrow: 432,
  barStamp: 478,
  meco: 664,          // first-stage engine cut-off
  separation: 672,    // 28.0 s
  upperIgnition: 694,
  shot1: 864,
  shot2: 896,
  shot3: 928,
  shot4: 976,         // the one that never lands
  neverLands: 1066,
  orbitHeadline: 1084,
  speedStamp: 1170,
  compare: 1210,
  timesFaster: 1252,
  endHeadline1: 1340,
  endHeadline2: 1364,
  titleCard: 1394,    // card is fully in by 1404 (58.5 s) and holds 1.5 s
};

// Camera bumps: 2 held steps (4 frames) of shake
export const BUMPS = [EV.liftoff, EV.separation, EV.speedStamp];

// On-screen narration (also the voiceover script). Seconds.
export const CAPTIONS: {from: number; to: number; text: string}[] = [
  {from: 0.3, to: 2.6, text: "To reach orbit, you don't just go up."},
  {from: 2.6, to: 5.0, text: 'You go sideways… really, really fast.'},
  {from: 5.2, to: 7.6, text: 'A rocket throws mass out the back.'},
  {from: 7.6, to: 10.6, text: 'Push exhaust down, and it pushes you up.'},
  {from: 10.6, to: 13.9, text: 'No air needed: it even works in empty space.'},
  {from: 14.2, to: 17.6, text: 'The catch? You have to carry all that propellant with you.'},
  {from: 17.6, to: 23.8, text: "Roughly 90% of a rocket's mass on the launch pad is propellant."},
  {from: 24.2, to: 26.4, text: 'So rockets come in stages.'},
  {from: 26.4, to: 30.4, text: "When a stage runs dry, it's dropped. No hauling empty tanks."},
  {from: 30.4, to: 33.8, text: 'Lighter rocket, more speed from the same fuel.'},
  {from: 34.2, to: 37.0, text: 'Newton imagined a cannon on a mountain.'},
  {from: 37.0, to: 40.2, text: 'Fire faster, and the ball lands farther away.'},
  {from: 40.2, to: 44.6, text: 'Fire fast enough, and the ground curves away as fast as the ball falls.'},
  {from: 44.6, to: 47.8, text: "It never lands. That's orbit."},
  {from: 48.2, to: 51.4, text: 'Low Earth orbit needs about 28,000 km/h.'},
  {from: 51.4, to: 54.8, text: "That's about thirty times faster than an airliner."},
  {from: 55.2, to: 58.2, text: "So orbit isn't up. It's sideways: falling, and always missing."},
];

// Sound-effect cues (global frames) used by scripts/make_audio.py
export const SFX: {at: number; kind: string; gain?: number}[] = [
  // paper rustles on every sheet transition
  ...[120, 336, 576, 816, 1152, 1320].map((at) => ({at, kind: 'rustle'})),
  {at: EV.vacuumSheet, kind: 'rustle', gain: 0.7},
  {at: EV.titleCard, kind: 'rustle'},
  // launch
  {at: EV.ignition, kind: 'rumble', gain: 1.0},
  {at: EV.rocketThrust, kind: 'rumble', gain: 0.45},
  {at: 576, kind: 'rumble', gain: 0.5},
  {at: EV.balloonGo, kind: 'whoosh', gain: 0.6},
  // staging
  {at: EV.separation, kind: 'clunk'},
  {at: EV.upperIgnition, kind: 'rumble', gain: 0.4},
  // stamps
  {at: EV.barStamp, kind: 'stamp'},
  {at: EV.speedStamp, kind: 'stamp'},
  {at: EV.neverLands, kind: 'stamp', gain: 0.8},
  {at: EV.endHeadline1, kind: 'stamp', gain: 0.7},
  {at: EV.endHeadline2, kind: 'stamp', gain: 0.8},
  // cannon shots + the orbit loop
  {at: EV.shot1, kind: 'pop'},
  {at: EV.shot2, kind: 'pop'},
  {at: EV.shot3, kind: 'pop'},
  {at: EV.shot4, kind: 'pop'},
  {at: EV.shot4 + 4, kind: 'whoosh', gain: 0.9},
  {at: 1324, kind: 'whoosh', gain: 0.6},
];

// Marker draw-ons (global frames). Each gets a squeak; scenes read them by key.
export const MARKS = {
  hookSideways: 92,
  hookUpCross: 84,
  moveDown: 226,
  moveUp: 244,
  fuelSlice: EV.cutawaySlice,
  fuelBracket: 420,
  stagingArrow: 688,
  stagingLight: 740,
  orbitFaster1: 900,
  orbitFaster2: 934,
  numberUnderline: 1186,
  numberBracket: EV.timesFaster - 8,
};

// Music sections: the mixer lifts the arrangement at launch and separation.
export const MUSIC = {bpm: 120, lifts: [EV.liftoff, EV.separation], fadeOutFrom: DURATION - 48};
