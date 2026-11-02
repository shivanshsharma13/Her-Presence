"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TAN_HALF, introFade } from "@/lib/frustum";
import { seededRandom } from "@/lib/textures";
import { storyState } from "@/lib/storyState";
import { starOpacity, warmth } from "@/lib/timeline";

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uOpacity;
  uniform float uWarmth;
  uniform float uTwinkle;
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aTint;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
    tw = mix(0.8, tw, uTwinkle);
    gl_PointSize = aSize * uPixelRatio * (0.8 + 0.3 * tw);
    vAlpha = uOpacity * (0.3 + 0.7 * tw);
    vec3 cool = mix(vec3(0.86, 0.9, 1.0), vec3(0.72, 0.7, 0.92), aTint);
    vec3 warm = mix(vec3(1.0, 0.95, 0.86), vec3(1.0, 0.86, 0.62), aTint);
    vColor = mix(cool, warm, uWarmth * 0.7);
  }
`;

const fragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float a = core * core * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

interface Props {
  count: number;
}

/** Thousands of softly twinkling stars on a slowly turning sky. */
export function StarField({ count }: Props) {
  const aspect = useThree((s) => s.size.width / s.size.height);
  const dpr = useThree((s) => s.viewport.dpr);
  const group = useRef<THREE.Group>(null);
  // Regenerate only when the screen shape changes meaningfully (rotation).
  const aspectBucket = Math.round(aspect * 5) / 5;

  const geometry = useMemo(() => {
    const rand = seededRandom(7);
    const positions = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    const tint = new Float32Array(count);
    // A disk just larger than the screen diagonal keeps the frame full while
    // the sky rotates, without wasting stars off-screen on tall phones.
    const diag = Math.sqrt(1 + aspectBucket * aspectBucket) * 1.08;
    for (let i = 0; i < count; i++) {
      const depth = 60 + rand() * 80;
      const radius = Math.sqrt(rand()) * depth * TAN_HALF * diag;
      const angle = rand() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = -depth;
      const bright = rand();
      size[i] = bright > 0.985 ? 4.5 + rand() * 2.5 : bright > 0.9 ? 2.8 + rand() * 1.4 : 1.4 + rand() * 1.4;
      phase[i] = rand() * Math.PI * 2;
      speed[i] = 0.3 + rand() * 2.2;
      tint[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aTint", new THREE.BufferAttribute(tint, 1));
    return g;
  }, [count, aspectBucket]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uOpacity: { value: 0 },
          uWarmth: { value: 0 },
          uTwinkle: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((state) => {
    const s = storyState.smooth;
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uPixelRatio.value = dpr;
    u.uOpacity.value = starOpacity(s) * introFade(0.2, 4.5);
    u.uWarmth.value = warmth(s);
    u.uTwinkle.value = storyState.reducedMotion ? 0.25 : 1;
    if (group.current && !storyState.reducedMotion) {
      // The sky turns imperceptibly, and we drift forward through it.
      group.current.rotation.z = state.clock.elapsedTime * 0.0045 + s * 0.035;
      group.current.position.z = s * 1.3;
    }
  });

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} renderOrder={0} frustumCulled={false} />
    </group>
  );
}
