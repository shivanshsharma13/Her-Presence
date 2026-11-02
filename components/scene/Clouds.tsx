"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { halfExtents, introFade } from "@/lib/frustum";
import { createCloudTexture, seededRandom } from "@/lib/textures";
import { storyState } from "@/lib/storyState";
import { cloudAmount, sunrise, warmth } from "@/lib/timeline";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform vec3 uShadow;
  uniform vec3 uLight;
  varying vec2 vUv;

  void main() {
    float a = texture2D(uMap, vUv).a;
    // Lit from above: brighter crowns, darker undersides.
    float lit = smoothstep(0.2, 0.75, vUv.y);
    vec3 col = mix(uShadow, uLight, lit);
    gl_FragColor = vec4(col, a * uOpacity);
  }
`;

interface Cloud {
  nx: number;
  ny: number;
  depth: number;
  width: number;
  speed: number;
  alpha: number;
  tex: number;
}

const nightShadow = new THREE.Color("#1b2547");
const nightLight = new THREE.Color("#6f73a6");
const warmLight = new THREE.Color("#e3c48f");
const dawnShadow = new THREE.Color("#7b6a96");
const dawnLight = new THREE.Color("#f6d4a8");

/** Slow, soft clouds drifting across the sky. */
export function Clouds({ count }: { count: number }) {
  const aspect = useThree((s) => s.size.width / s.size.height);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  const textures = useMemo(() => [createCloudTexture(3), createCloudTexture(11), createCloudTexture(29)], []);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);

  const clouds = useMemo<Cloud[]>(() => {
    const rand = seededRandom(91);
    return Array.from({ length: count }, (_, i) => ({
      nx: rand() * 3 - 1.5,
      // Keep most clouds in the upper and lower thirds, away from the words.
      ny: i % 2 === 0 ? 0.35 + rand() * 0.6 : -0.45 - rand() * 0.5,
      depth: 18 + rand() * 14,
      width: 0.9 + rand() * 0.9,
      speed: (0.006 + rand() * 0.01) * (rand() > 0.5 ? 1 : -1),
      alpha: 0.6 + rand() * 0.4,
      tex: i % 3,
    }));
  }, [count]);

  const materials = useMemo(
    () =>
      clouds.map(
        (c) =>
          new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            uniforms: {
              uMap: { value: textures[c.tex] },
              uOpacity: { value: 0 },
              uShadow: { value: new THREE.Color() },
              uLight: { value: new THREE.Color() },
            },
            transparent: true,
            depthWrite: false,
            depthTest: false,
          }),
      ),
    [clouds, textures],
  );

  const shadow = useMemo(() => new THREE.Color(), []);
  const light = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const s = storyState.smooth;
    const amount = cloudAmount(s) * introFade(0.5, 5);
    const w = warmth(s);
    const sr = sunrise(s);
    shadow.copy(nightShadow).lerp(dawnShadow, sr);
    light.copy(nightLight).lerp(warmLight, w * 0.7).lerp(dawnLight, sr);
    const dt = storyState.reducedMotion ? 0 : Math.min(delta, 0.1);

    clouds.forEach((c, i) => {
      c.nx += c.speed * dt;
      if (c.nx > 1.9) c.nx = -1.9;
      if (c.nx < -1.9) c.nx = 1.9;
      const mesh = meshes.current[i];
      if (!mesh) return;
      const { halfW, halfH } = halfExtents(c.depth, aspect);
      const width = Math.max(halfW, halfH * 0.9) * c.width;
      mesh.position.set(c.nx * halfW, c.ny * halfH, -c.depth);
      mesh.scale.set(width * 2, width, 1);
      const u = materials[i].uniforms;
      u.uOpacity.value = amount * c.alpha;
      (u.uShadow.value as THREE.Color).copy(shadow);
      (u.uLight.value as THREE.Color).copy(light);
    });
  });

  return (
    <>
      {clouds.map((c, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          material={materials[i]}
          renderOrder={3}
        >
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </>
  );
}
