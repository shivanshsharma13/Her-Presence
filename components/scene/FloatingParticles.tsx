"use client";

import * as THREE from "three";
import { GlowPoints } from "./GlowPoints";
import { introFade } from "@/lib/frustum";
import { warmth } from "@/lib/timeline";

const lavender = new THREE.Color("#A9A4D5");
const gold = new THREE.Color("#F5D99B");
const core = new THREE.Color("#F5F1E9");
const color = new THREE.Color();
const DEPTH: [number, number] = [4, 14];

/** Tiny motes of light drifting upward, always there, barely noticed. */
export function FloatingParticles({ count }: { count: number }) {
  return (
    <GlowPoints
      count={count}
      seed={5}
      depth={DEPTH}
      size={9}
      wander={0.45}
      rise={0.008}
      renderOrder={7}
      drive={(s) => {
        color.copy(lavender).lerp(gold, warmth(s));
        return { amount: 1, opacity: 0.45 * introFade(1.5, 4), color, core };
      }}
    />
  );
}
