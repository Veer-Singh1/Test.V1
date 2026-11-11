// Post-processing: render the scene (supersampled) into a target with a depth texture,
// then one full-screen pass: depth of field focused at the look-at distance, light vignette,
// dip to cream at location changes, and downsampling.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { LINE_MATS } from './kit.js';

const frag = /* glsl */`
uniform sampler2D tColor; uniform sampler2D tDepth;
uniform float near; uniform float far; uniform float focus; uniform float aperture; uniform float maxBlur;
uniform float aspect; uniform float dip; uniform vec3 cream; uniform float vign;
varying vec2 vUv;
float linDepth(float d) { float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
float cocAt(vec2 uv, out float z) { z = linDepth(texture2D(tDepth, uv).x); return min(maxBlur, aperture * abs(1.0 - focus / max(z, 0.001))); }
void main() {
  float zc; float c = cocAt(vUv, zc);
  vec3 acc = texture2D(tColor, vUv).rgb; float wsum = 1.0;
  if (c > 0.0008) {
    const int N = 28;
    for (int i = 1; i <= N; i++) {
      float r = sqrt(float(i) / float(N));
      float a = float(i) * 2.39996323;
      vec2 off = vec2(cos(a) / aspect, sin(a)) * r * c;
      vec2 uv = vUv + off;
      float zs; float cs = cocAt(uv, zs);
      float dist = r * c;
      // nearer, sharper samples must not bleed into a blurred background
      float w = zs >= zc - 0.05 ? 1.0 : clamp(cs / max(dist, 1e-5), 0.0, 1.0);
      acc += texture2D(tColor, uv).rgb * w; wsum += w;
    }
  }
  vec3 col = acc / wsum;
  vec2 q = (vUv - 0.5) * vec2(1.0, 1.15);
  col *= mix(1.0, 1.0 - vign, smoothstep(0.35, 0.85, length(q) * 1.35));
  col = mix(col, cream, dip);
  gl_FragColor = vec4(col, 1.0);
}`;
const vert = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export class Post {
  constructor() {
    this.rt = new THREE.WebGLRenderTarget(4, 4, { depthTexture: new THREE.DepthTexture(4, 4), type: THREE.UnsignedByteType });
    this.rt.texture.minFilter = THREE.LinearFilter; this.rt.texture.magFilter = THREE.LinearFilter;
    this.rt.texture.generateMipmaps = false;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false,
      uniforms: {
        tColor: { value: this.rt.texture }, tDepth: { value: this.rt.depthTexture },
        near: { value: 0.15 }, far: { value: 900 }, focus: { value: 5 }, aperture: { value: 0.02 }, maxBlur: { value: 0.011 },
        aspect: { value: 720 / 1280 }, dip: { value: 0 }, cream: { value: new THREE.Color('#f3e7cf') }, vign: { value: 0.16 },
      },
    });
    this.quad = new FullScreenQuad(this.mat);
    this.size = new THREE.Vector2();
  }
  render(gl, scene, camera, { focus, aperture, dip, ss = 2 }) {
    gl.getDrawingBufferSize(this.size);
    const w = Math.round(this.size.x * ss), h = Math.round(this.size.y * ss);
    if (this.rt.width !== w || this.rt.height !== h) this.rt.setSize(w, h);
    for (const m of LINE_MATS) { m.resolution.set(w, h); m.linewidth = m.userData.basePx * (h / 1280); }
    const u = this.mat.uniforms;
    u.near.value = camera.near; u.far.value = camera.far; u.focus.value = focus; u.aperture.value = aperture;
    u.aspect.value = this.size.x / this.size.y; u.dip.value = dip;
    gl.setRenderTarget(this.rt);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    this.quad.render(gl);
  }
}
