import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AbsoluteFill, useCurrentFrame, useDelayRender, getInputProps } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import '@fontsource/bebas-neue';
import '@fontsource/permanent-marker';
import { buildWorld, LOC } from './world.js';
import { SHOTS, LIGHTS, SHOT_LIGHT, cameraAt } from './camera.js';
import { FPS, CUTS, N_SHOTS, shotOf } from './timing.js';
import { Post } from './post.js';
import { CHAR_MAT } from './char.js';

THREE.ColorManagement.enabled = false;
const W = 720, H = 1280;

// 0.4 s dip to cream at every location change
function dipAt(t) {
  let d = 0;
  for (let n = 2; n <= N_SHOTS; n++) {
    if (SHOTS[n].loc === SHOTS[n - 1].loc && n === 2) continue;
    if (SHOTS[n].loc === SHOTS[n - 1].loc) continue;
    const c = CUTS[n - 1];
    d = Math.max(d, 1 - Math.abs(t - c) / 0.2);
  }
  return Math.max(0, d);
}

const Scene = ({ frame, ss }) => {
  const { gl } = useThree();
  const world = useMemo(() => buildWorld(), []);
  const cam = useMemo(() => new THREE.PerspectiveCamera(80, W / H, 0.15, 900), []);
  const post = useMemo(() => new Post(), []);
  const fr = useRef(frame);
  fr.current = frame;
  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.outputColorSpace = THREE.LinearSRGBColorSpace;
    gl.toneMapping = THREE.NoToneMapping;
    gl.setClearColor('#e8d6b6', 1);
  }, [gl]);
  useFrame(() => {
    const t = fr.current / FPS;
    const shot = shotOf(t);
    const plan = SHOTS[shot];
    const locX = LOC[plan.loc];
    const { pos, look } = cameraAt(shot, t, locX);
    cam.position.copy(pos);
    cam.lookAt(look);
    cam.updateMatrixWorld();
    // lighting for this shot
    const L = { ...LIGHTS[plan.loc], ...(SHOT_LIGHT[shot] || {}) };
    const tgt = new THREE.Vector3(look.x, 0, look.z);
    const dir = new THREE.Vector3(...L.dir).normalize();
    world.key.position.copy(tgt).addScaledVector(dir, 40);
    world.key.target.position.copy(tgt);
    world.key.target.updateMatrixWorld();
    world.key.color.set(L.key); world.key.intensity = L.keyI;
    world.hemi.color.set(L.sky); world.hemi.groundColor.set(L.gnd); world.hemi.intensity = L.hemiI;
    world.scene.fog.color.set(L.fog[0]); world.scene.fog.near = L.fog[1]; world.scene.fog.far = L.fog[2];
    world.sky.position.copy(cam.position);
    world.sky.material.color.set(L.skyTint);
    CHAR_MAT.color.set(L.tint);
    if (L.lamp) { world.lamp.intensity = L.lamp; world.lamp.position.set(locX + L.lampPos[0], L.lampPos[1], L.lampPos[2]); } else world.lamp.intensity = 0;
    gl.setClearColor(L.fog[0], 1);
    for (const [k, Lc] of Object.entries(world.locs)) Lc.group.visible = k === plan.loc;
    world.scene.updateMatrixWorld();
    world.locs[plan.loc].update(t, cam.position, shot);
    world.scene.updateMatrixWorld();
    const focus = pos.distanceTo(look);
    post.render(gl, world.scene, cam, { focus, aperture: plan.aperture, dip: dipAt(t), ss });
  }, 1);
  return null;
};

export const Full = () => {
  const frame = useCurrentFrame();
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender('Loading fonts'));
  const [ready, setReady] = useState(false);
  const props = getInputProps();
  const preview = props.quality === 'preview';
  const draft = props.quality === 'draft'; // full size, no supersampling (cloud preview renders)
  useEffect(() => {
    Promise.all([
      document.fonts.load('100px "Bebas Neue"'),
      document.fonts.load('100px "Permanent Marker"'),
    ]).then(() => { setReady(true); continueRender(handle); });
  }, [handle, continueRender]);
  return (
    <AbsoluteFill style={{ backgroundColor: '#f3e7cf' }}>
      {ready ? (
        <ThreeCanvas width={W} height={H} linear flat legacy dpr={preview ? 0.5 : 1}
          gl={{ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}>
          <Scene frame={frame} ss={preview || draft ? 1 : 2} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
