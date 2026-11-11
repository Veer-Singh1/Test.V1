// Every style decision lives here. A new video changes script.ts and scenes.tsx, not this file.
export const VIDEO = { width: 1080, height: 1920, fps: 30, tail: 1.2 }; // tail = seconds after the last word
export const C = { void: '#000000', white: '#FFFFFF', mist: '#8A8A8A', ash: '#5C5C5C', graphite: '#2A2A2A', volt: '#3DA9FF' };
export const FONT = { sans: "'Inter', system-ui, sans-serif", serif: "'Playfair Display', Georgia, serif" };
export const TYPE = {
  caption: { size: 60, weight: 700 },                    // Inter Bold
  punch: { size: 120, weight: 900 },                     // Inter Black, ALL CAPS
  soft: { size: 68, weight: 400 },                       // Playfair Display Italic
  label: { size: 28, weight: 600, spacing: '0.25em' },   // Inter SemiBold, ALL CAPS
  counter: { size: 130, weight: 900 },                   // Inter Black, tabular numbers
};
export const SAFE = { top: 120, bottom: 380, right: 160, left: 90 };
export const LINE = 4; // px, round caps
export const CAPTION = { top: 170, maxLines: 2, maxChars: 24, wordIn: 0.18, lineOut: 0.25, blur: 12, rise: 8, punchScale: 1.15, ring: 0.6 };
export const CAMERA = { drift: 0.015, anchor: [500, 900] as [number, number], minMove: 0.6, maxMove: 1.2 };
export const MUSIC = { bpm: 62, underVoiceDb: 20, dropBefore: 1.0, fadeOut: 5 };
export const LOUDNESS = { lufs: -14, truePeak: -1 };
