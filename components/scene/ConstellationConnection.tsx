"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { halfExtents } from "@/lib/frustum";
import { storyState } from "@/lib/storyState";
import { constellation, moon, moonRadius } from "@/lib/timeline";
import { MOON_DEPTH } from "./MoonScene";

const DEPTH = 30;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const starFragment = /* glsl */ `
  uniform float uOpacity;
  uniform float uTime;
  uniform float uPhase;
  uniform float uSpeed;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float d = length(p);
    float pulse = 0.72 + 0.28 * sin(uTime * uSpeed + uPhase);
    float core = exp(-d * d * 260.0);
    float halo = exp(-d * 6.0) * 0.4 * pulse;
    float spikes = (exp(-abs(p.x) * 70.0) * exp(-abs(p.y) * 4.0) + exp(-abs(p.y) * 70.0) * exp(-abs(p.x) * 4.0)) * 0.5 * pulse;
    float a = (core * 1.4 + halo + spikes) * smoothstep(1.0, 0.6, d) * uOpacity;
    vec3 col = mix(uColor, vec3(1.0, 0.98, 0.93), core);
    gl_FragColor = vec4(col * a, a);
  }
`;

const lineFragment = /* glsl */ `
  uniform float uOpacity;
  uniform float uDraw;
  uniform float uTime;
  uniform float uLength;
  uniform float uWidth;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    float along = vUv.x;
    float across = (vUv.y - 0.5) * uWidth;
    float core = exp(-pow(across / 0.028, 2.0));
    float glow = exp(-pow(across / 0.14, 2.0)) * 0.3;
    // Draw from both stars toward the middle, meeting halfway.
    float reach = uDraw * 0.52;
    float drawn = smoothstep(reach + 0.01, reach - 0.01, min(along, 1.0 - along));
    // A slow shimmer travels back and forth between them.
    float shimmer = 0.7 + 0.3 * sin(along * uLength * 0.9 - uTime * 0.8) * sin(along * uLength * 0.35 + uTime * 0.5);
    float ends = smoothstep(0.0, 0.03, along) * smoothstep(1.0, 0.97, along);
    float a = (core + glow) * shimmer * drawn * ends * uOpacity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

const gold = new THREE.Color("#F5D99B");
const ivory = new THREE.Color("#f8e7c2");

function makeStar(phase: number, speed: number, scale: number) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: starFragment,
    uniforms: {
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uPhase: { value: phase },
      uSpeed: { value: speed },
      uColor: { value: ivory.clone() },
    },
    userData: { scale },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
}

function makeLine(strength: number) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: lineFragment,
    uniforms: {
      uOpacity: { value: 0 },
      uDraw: { value: 0 },
      uTime: { value: 0 },
      uLength: { value: 1 },
      uWidth: { value: 0.6 },
      uColor: { value: gold.clone() },
    },
    userData: { strength },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Normalised offsets of the faint companion stars around each main star. */
const COMPANIONS: [number, number, number][] = [
  // [main star index, dx, dy]
  [0, -0.2, 0.17],
  [0, -0.1, -0.13],
  [1, 0.19, 0.15],
  [1, 0.09, -0.14],
];

/**
 * Two stars, each glowing in its own rhythm, joined by one thin golden line.
 * Two people who don't need the same space to stay connected.
 */
export function ConstellationConnection() {
  const aspect = useThree((s) => s.size.width / s.size.height);
  const group = useRef<THREE.Group>(null);

  const stars = useMemo(
    () => [
      makeStar(0, 0.9, 1),
      makeStar(2.1, 0.63, 1),
      ...COMPANIONS.map((_, i) => makeStar(i * 1.7, 0.5 + i * 0.13, 0.4)),
    ],
    [],
  );
  const lines = useMemo(() => [makeLine(1), ...COMPANIONS.map(() => makeLine(0.22))], []);
  const starMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const lineMeshes = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const s = storyState.smooth;
    const c = constellation(s);
    if (!group.current) return;
    group.current.visible = c.visible > 0.002;
    if (!group.current.visible) return;

    const t = storyState.reducedMotion ? 0 : state.clock.elapsedTime;
    const { halfW, halfH } = halfExtents(DEPTH, aspect);
    // Sit just beneath the moon of chapter four, above the words.
    const m = moon(3.5);
    const moonHalf = halfExtents(MOON_DEPTH, aspect);
    const moonRadiusY = moonRadius(m.r, moonHalf.halfW, moonHalf.halfH) / moonHalf.halfH;
    const baseY = m.y - moonRadiusY - 0.1;
    const main: [number, number][] = [
      [-0.62, baseY + 0.035],
      [0.62, baseY - 0.035],
    ];
    const points: [number, number][] = [
      ...main,
      ...COMPANIONS.map(([k, dx, dy]) => [main[k][0] + dx, main[k][1] + dy] as [number, number]),
    ];
    const world = points.map(([x, y]) => new THREE.Vector3(x * halfW, y * halfH, -DEPTH));
    const starSize = Math.min(halfW, halfH) * 0.32;

    stars.forEach((mat, i) => {
      const mesh = starMeshes.current[i];
      if (!mesh) return;
      mesh.position.copy(world[i]);
      mesh.scale.setScalar(starSize * (mat.userData.scale as number));
      mat.uniforms.uTime.value = t;
      // Companions appear after the main line has connected.
      const appear = i < 2 ? c.visible : c.visible * Math.min(1, Math.max(0, (c.draw - 0.6) / 0.4)) * 0.6;
      mat.uniforms.uOpacity.value = appear;
    });

    const segments: [number, number][] = [[0, 1], ...COMPANIONS.map(([k], i) => [k, i + 2] as [number, number])];
    lines.forEach((mat, i) => {
      const mesh = lineMeshes.current[i];
      if (!mesh) return;
      const [a, b] = segments[i];
      const pa = world[a];
      const pb = world[b];
      const len = pa.distanceTo(pb);
      mesh.position.copy(pa).add(pb).multiplyScalar(0.5);
      mesh.rotation.z = Math.atan2(pb.y - pa.y, pb.x - pa.x);
      const width = 0.6;
      mesh.scale.set(len, width, 1);
      const u = mat.uniforms;
      u.uLength.value = len;
      u.uWidth.value = width;
      u.uTime.value = t;
      u.uDraw.value = i === 0 ? c.draw : Math.min(1, Math.max(0, (c.draw - 0.7) / 0.3));
      u.uOpacity.value = c.visible * (mat.userData.strength as number);
    });
  });

  return (
    <group ref={group} visible={false}>
      {lines.map((mat, i) => (
        <mesh key={`l${i}`} ref={(m) => { lineMeshes.current[i] = m; }} material={mat} renderOrder={5}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
      {stars.map((mat, i) => (
        <mesh key={`s${i}`} ref={(m) => { starMeshes.current[i] = m; }} material={mat} renderOrder={6}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}
