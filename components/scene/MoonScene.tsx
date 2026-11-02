"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { halfExtents, introFade } from "@/lib/frustum";
import { storyState } from "@/lib/storyState";
import { moon, moonRadius, warmth } from "@/lib/timeline";

export const MOON_DEPTH = 40;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const moonFragment = /* glsl */ `
  uniform float uOpacity;
  uniform float uWarmth;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float d = length(p);
    float edge = smoothstep(1.0, 0.985, d);
    if (edge <= 0.0) discard;

    // Treat the disc as a sphere so light and texture wrap around it.
    vec3 n = vec3(p, sqrt(max(0.0, 1.0 - d * d)));
    vec2 sp = n.xy / (0.6 + n.z * 0.4);

    float maria = smoothstep(0.42, 0.68, fbm(sp * 1.6 + vec2(3.1, 1.7)));
    float grain = fbm(sp * 9.0) * 0.5 + fbm(sp * 24.0) * 0.5;
    float crater = smoothstep(0.62, 0.7, noise(sp * 7.0 + 11.0)) * 0.6;

    vec3 light = normalize(vec3(-0.35, 0.3, 0.9));
    float shading = mix(0.32, 1.0, smoothstep(-0.15, 0.65, dot(n, light)));
    float limb = 0.78 + 0.22 * n.z;

    vec3 ivory = vec3(1.0, 0.985, 0.955);
    vec3 shade = vec3(0.7, 0.7, 0.8);
    vec3 col = mix(ivory, shade, maria * 0.4 + crater * 0.12);
    col *= 0.93 + grain * 0.12;
    col *= shading * limb * 1.04;
    col = mix(col, col * vec3(1.06, 0.92, 0.7), uWarmth * 0.6);

    gl_FragColor = vec4(col, edge * uOpacity);
  }
`;

const haloFragment = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColor;
  uniform float uRatio; // halo size / moon radius
  varying vec2 vUv;

  void main() {
    float d = length(vUv * 2.0 - 1.0) * uRatio; // in moon radii
    float glow = exp(-max(d - 0.95, 0.0) * 1.6) * 0.5 + exp(-max(d - 0.95, 0.0) * 6.0) * 0.5;
    glow *= smoothstep(uRatio, uRatio * 0.7, d);
    float a = glow * uOpacity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

const HALO_RATIO = 5;
const silver = new THREE.Color("#c9c6ea");
const gold = new THREE.Color("#F5D99B");

/** The moon: distant at first, then large and close when she arrives. */
export function MoonScene() {
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  const moonRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const moonMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: moonFragment,
        uniforms: { uOpacity: { value: 0 }, uWarmth: { value: 0 } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );

  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: haloFragment,
        uniforms: { uOpacity: { value: 0 }, uColor: { value: new THREE.Color() }, uRatio: { value: HALO_RATIO } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((state) => {
    const s = storyState.smooth;
    const m = moon(s);
    const { halfW, halfH } = halfExtents(MOON_DEPTH, aspect);
    const radius = moonRadius(m.r, halfW, halfH);
    // A gentle parallax drift against the stars as the story scrolls.
    const local = s - Math.floor(s);
    const drift = storyState.reducedMotion ? 0 : Math.sin(local * Math.PI) * 0.025;
    const bob = storyState.reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.12) * 0.006;
    const x = m.x * halfW;
    const y = (m.y + drift + bob) * halfH;
    const fade = introFade(0.8, 4) * m.opacity;
    const w = warmth(s);

    if (moonRef.current) {
      moonRef.current.position.set(x, y, -MOON_DEPTH);
      moonRef.current.scale.setScalar(radius * 2);
    }
    if (haloRef.current) {
      haloRef.current.position.set(x, y, -MOON_DEPTH);
      haloRef.current.scale.setScalar(radius * 2 * HALO_RATIO);
    }
    moonMat.uniforms.uOpacity.value = fade;
    moonMat.uniforms.uWarmth.value = w;
    haloMat.uniforms.uOpacity.value = fade * (0.6 + w * 0.3);
    (haloMat.uniforms.uColor.value as THREE.Color).copy(silver).lerp(gold, w);
  });

  return (
    <>
      <mesh ref={haloRef} material={haloMat} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh ref={moonRef} material={moonMat} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </>
  );
}
