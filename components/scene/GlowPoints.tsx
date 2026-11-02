"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TAN_HALF } from "@/lib/frustum";
import { seededRandom } from "@/lib/textures";
import { storyState } from "@/lib/storyState";

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uAspect;
  uniform float uTanHalf;
  uniform float uAmount;
  uniform float uSize;
  uniform float uWander;
  uniform float uRise;
  attribute vec3 aSeed;   // normalised x, y and depth
  attribute vec4 aRand;   // frequencies, phases, threshold
  varying float vAlpha;

  void main() {
    float t = uTime;
    vec2 n = aSeed.xy;
    // Each light follows its own looping, lazy path.
    n.x += (sin(t * aRand.x * 0.31 + aRand.z * 6.28) * 0.09 + sin(t * aRand.y * 0.17 + aRand.w * 9.0) * 0.05) * uWander;
    n.y += cos(t * aRand.y * 0.23 + aRand.z * 4.0) * 0.07 * uWander;
    n.y = mod(n.y + t * uRise * (0.4 + aRand.x) + 1.25, 2.5) - 1.25;
    float depth = aSeed.z;
    vec3 pos = vec3(n.x * depth * uTanHalf * uAspect, n.y * depth * uTanHalf, -depth);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    float blink = 0.5 + 0.5 * sin(t * (0.35 + aRand.x * 0.6) + aRand.w * 12.0);
    blink = smoothstep(0.05, 0.95, blink);
    // Lights join one by one as the amount rises.
    float present = smoothstep(aRand.w, aRand.w + 0.12, uAmount);
    vAlpha = present * (0.25 + 0.75 * blink);
    gl_PointSize = uSize * (0.6 + aRand.y * 0.8) * uPixelRatio * (10.0 / depth) * (0.85 + 0.15 * blink);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = exp(-d * d * 22.0);
    float halo = exp(-d * 4.2) * 0.45;
    float a = (core + halo) * smoothstep(1.0, 0.75, d) * vAlpha * uOpacity;
    if (a < 0.003) discard;
    vec3 col = mix(uColor, uCore, core);
    gl_FragColor = vec4(col * a, a);
  }
`;

export interface GlowPointsProps {
  count: number;
  seed: number;
  depth: [number, number];
  size: number;
  wander: number;
  rise: number;
  renderOrder: number;
  /** Called every frame to drive colour and amount from the story. */
  drive: (s: number) => { amount: number; opacity: number; color: THREE.Color; core: THREE.Color };
}

/**
 * A field of soft glowing points positioned in screen-relative space, so it
 * fills any aspect ratio. Shared by the fireflies and the floating dust.
 */
export function GlowPoints({ count, seed, depth, size, wander, rise, renderOrder, drive }: GlowPointsProps) {
  const aspect = useThree((s) => s.size.width / s.size.height);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const rand = seededRandom(seed);
    const seeds = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      seeds[i * 3] = (rand() * 2 - 1) * 1.05;
      seeds[i * 3 + 1] = rand() * 2.5 - 1.25;
      seeds[i * 3 + 2] = depth[0] + rand() * (depth[1] - depth[0]);
      rnd[i * 4] = rand();
      rnd[i * 4 + 1] = rand();
      rnd[i * 4 + 2] = rand();
      rnd[i * 4 + 3] = rand() * 0.88;
    }
    const g = new THREE.BufferGeometry();
    // Positions are computed in the shader; three still needs a position attribute.
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 4));
    return g;
  }, [count, seed, depth]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uAspect: { value: 1 },
          uTanHalf: { value: TAN_HALF },
          uAmount: { value: 0 },
          uOpacity: { value: 0 },
          uSize: { value: size },
          uWander: { value: wander },
          uRise: { value: rise },
          uColor: { value: new THREE.Color() },
          uCore: { value: new THREE.Color() },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [size, wander, rise],
  );

  useFrame((state) => {
    const u = material.uniforms;
    const d = drive(storyState.smooth);
    const reduced = storyState.reducedMotion;
    u.uTime.value = reduced ? 20 + state.clock.elapsedTime * 0.15 : state.clock.elapsedTime;
    u.uPixelRatio.value = dpr;
    u.uAspect.value = aspect;
    u.uAmount.value = d.amount;
    u.uOpacity.value = d.opacity;
    (u.uColor.value as THREE.Color).copy(d.color);
    (u.uCore.value as THREE.Color).copy(d.core);
  });

  return <points geometry={geometry} material={material} renderOrder={renderOrder} frustumCulled={false} />;
}
