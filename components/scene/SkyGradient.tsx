"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { storyState } from "@/lib/storyState";
import { bloom, sunrise, warmth } from "@/lib/timeline";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // A full-screen quad drawn straight in clip space, behind everything.
    gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
  }
`;

// Colours are sRGB hex values, written as-is so they match the CSS palette.
const fragment = /* glsl */ `
  uniform float uWarmth;
  uniform float uSunrise;
  uniform float uBloom;
  uniform float uAspect;
  varying vec2 vUv;

  vec3 hex(float r, float g, float b) { return vec3(r, g, b) / 255.0; }

  // Stable on mobile GPUs (no large sin() arguments).
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float ellipse(vec2 uv, vec2 center, vec2 radius) {
    vec2 d = (uv - center) / radius;
    return length(d);
  }

  vec3 ramp4(float t, vec3 a, vec3 b, vec3 c, vec3 d, float sb, float sc) {
    if (t < sb) return mix(a, b, t / sb);
    if (t < sc) return mix(b, c, (t - sb) / (sc - sb));
    return mix(c, d, (t - sc) / (1.0 - sc));
  }

  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y); // 0 at the top, like CSS

    // Night
    vec3 col = ramp4(uv.y, hex(6., 11., 26.), hex(8., 14., 32.), hex(13., 23., 51.), hex(22., 38., 75.), 0.38, 0.72);
    col = mix(col, hex(169., 164., 213.), 0.13 * max(0.0, 1.0 - ellipse(uv, vec2(0.75, 0.12), vec2(0.9, 0.55)) / 0.7));
    col = mix(col, hex(38., 60., 103.), 0.55 * max(0.0, 1.0 - ellipse(uv, vec2(0.5, 1.05), vec2(1.2, 0.45)) / 0.7));

    // Her warmth
    float w1 = max(0.0, 1.0 - ellipse(uv, vec2(0.5, 0.3), vec2(0.8, 0.5)) / 0.7);
    float w2 = max(0.0, 1.0 - ellipse(uv, vec2(0.5, 1.1), vec2(1.2, 0.5)) / 0.7);
    col = mix(col, hex(245., 217., 155.), 0.14 * w1 * uWarmth);
    col = mix(col, hex(245., 200., 140.), 0.18 * w2 * uWarmth);

    // Sunrise
    vec3 dawnTop = ramp4(clamp(uv.y / 0.66, 0.0, 1.0), hex(20., 28., 64.), hex(44., 52., 102.), hex(93., 87., 136.), hex(162., 127., 151.), 0.39, 0.73);
    vec3 dawnLow = ramp4(clamp((uv.y - 0.66) / 0.34, 0.0, 1.0), hex(162., 127., 151.), hex(217., 168., 136.), hex(233., 190., 147.), hex(242., 207., 152.), 0.47, 0.75);
    vec3 dawn = uv.y < 0.66 ? dawnTop : dawnLow;
    col = mix(col, dawn, uSunrise);

    // The bloom on "a little lighter"
    float f = ellipse(uv, vec2(0.5, 0.5), vec2(0.6, 0.45));
    float flare = f < 0.45 ? mix(0.5, 0.16, f / 0.45) : mix(0.16, 0.0, clamp((f - 0.45) / 0.3, 0.0, 1.0));
    col = mix(col, hex(255., 236., 196.), flare * uBloom * 0.85);

    // Vignette
    float v = ellipse(uv, vec2(0.5, 0.45), vec2(1.3, 0.9));
    col = mix(col, hex(4., 7., 18.), 0.55 * smoothstep(0.55, 1.0, v));

    // Dither away gradient banding on 8-bit phone screens.
    col += (hash12(gl_FragCoord.xy) - 0.5) / 255.0 * 1.5;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/** The colour of the night itself, shifting from midnight blue to gold. */
export function SkyGradient() {
  const aspect = useThree((s) => s.size.width / s.size.height);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uWarmth: { value: 0 },
          uSunrise: { value: 0 },
          uBloom: { value: 0 },
          uAspect: { value: 1 },
        },
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );

  useFrame(() => {
    const s = storyState.smooth;
    const u = material.uniforms;
    u.uWarmth.value = warmth(s);
    u.uSunrise.value = sunrise(s);
    u.uBloom.value = bloom(s);
    u.uAspect.value = aspect;
  });

  return (
    <mesh material={material} renderOrder={-10} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
