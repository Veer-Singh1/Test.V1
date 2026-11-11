// Screen-space pieces: the live counter and the named-concept stamp.
import React from 'react';
import { C, FONT, SAFE, TYPE } from '../style';

export const Counter: React.FC<{ value: string; label: string; opacity: number; top?: number; color?: string }> = ({ value, label, opacity, top = 1350, color = C.white }) => (opacity > 0.01 ? (
  <div style={{ position: 'absolute', left: SAFE.left, right: SAFE.right, top, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity }}>
    <div style={{ fontFamily: FONT.sans, fontWeight: TYPE.counter.weight, fontSize: TYPE.counter.size, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1, textShadow: '0 0 24px rgba(0,0,0,0.9)' }}>{value}</div>
    <div style={{ fontFamily: FONT.sans, fontWeight: TYPE.label.weight, fontSize: TYPE.label.size, color: C.mist, letterSpacing: TYPE.label.spacing, marginTop: 14, whiteSpace: 'nowrap', textShadow: '0 0 16px rgba(0,0,0,0.9)' }}>{label.toUpperCase()}</div>
  </div>
) : null);
export const Stamp: React.FC<{ lines: string[]; scale: number; opacity: number; top: number; color?: string }> = ({ lines, scale, opacity, top, color = C.white }) => (scale > 0 && opacity > 0.01 ? (
  <div style={{ position: 'absolute', left: 0, right: SAFE.right - 80, top, display: 'flex', justifyContent: 'center', opacity }}>
    <div style={{ transform: `rotate(-6deg) scale(${scale})`, border: `8px solid ${color}`, borderRadius: 14, padding: '20px 38px', textAlign: 'center', background: 'rgba(0,0,0,0.7)' }}>
      {lines.map((l) => <div key={l} style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 92, color, lineHeight: 1.02 }}>{l}</div>)}
    </div>
  </div>
) : null);
