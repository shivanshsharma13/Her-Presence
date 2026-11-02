"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { halfExtents } from "@/lib/frustum";
import { storyState } from "@/lib/storyState";
import { moon, rays, raysFromHorizon, sunrise } from "@/lib/timeline";

const DEPTH = 30;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform vec2 uOrigin;
  uniform float uAspect;
  uniform float uIntensity;
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 d = (vUv * 2.0 - 1.0) - uOrigin;
    d.x *= uAspect;
    float ang = atan(d.y, d.x);
    float dist = length(d);
    float r = (0.5 + 0.5 * sin(ang * 7.0 + uTime * 0.05)) * (0.5 + 0.5 * sin(ang * 13.0 - uTime * 0.04 + 1.3));
    r += (0.5 + 0.5 * sin(ang * 23.0 + uTime * 0.03)) * 0.35;
    r = pow(r, 1.6);
    float a = (r * 0.42 * exp(-dist * 0.9) + exp(-dist * 2.2) * 0.45) * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

const gold = new THREE.Color("#F5D99B");
const dawn = new THREE.Color("#f7c98e");

/** Gentle golden rays from the moon, or from the horizon at sunrise. */
export function LightRays() {
  const aspect = useThree((s) => s.size.width / s.size.height);
  const mesh = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uOrigin: { value: new THREE.Vector2() },
          uAspect: { value: 1 },
          uIntensity: { value: 0 },
          uTime: { value: 0 },
          uColor: { value: new THREE.Color() },
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
    const intensity = rays(s);
    if (!mesh.current) return;
    mesh.current.visible = intensity > 0.005;
    if (!mesh.current.visible) return;
    const { halfW, halfH } = halfExtents(DEPTH, aspect);
    mesh.current.scale.set(halfW * 2, halfH * 2, 1);
    const m = moon(s);
    const h = raysFromHorizon(s);
    const u = material.uniforms;
    (u.uOrigin.value as THREE.Vector2).set(m.x * (1 - h), m.y * (1 - h) - 1.3 * h);
    u.uAspect.value = aspect;
    u.uIntensity.value = intensity;
    u.uTime.value = storyState.reducedMotion ? 0 : state.clock.elapsedTime;
    (u.uColor.value as THREE.Color).copy(gold).lerp(dawn, sunrise(s));
  });

  return (
    <mesh ref={mesh} material={material} position={[0, 0, -DEPTH]} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
