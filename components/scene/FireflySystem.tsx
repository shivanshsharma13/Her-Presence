"use client";

import * as THREE from "three";
import { GlowPoints } from "./GlowPoints";
import { fireflyAmount, sunrise } from "@/lib/timeline";

const gold = new THREE.Color("#F5D99B");
const amber = new THREE.Color("#f2b866");
const core = new THREE.Color("#fff6e2");
const color = new THREE.Color();
const DEPTH: [number, number] = [5, 16];

/** Warm fireflies that arrive with her: the world itself growing warmer. */
export function FireflySystem({ count }: { count: number }) {
  return (
    <GlowPoints
      count={count}
      seed={21}
      depth={DEPTH}
      size={34}
      wander={1}
      rise={0.004}
      renderOrder={8}
      drive={(s) => {
        color.copy(gold).lerp(amber, 0.35 + sunrise(s) * 0.3);
        return { amount: fireflyAmount(s), opacity: 1 - sunrise(s) * 0.25, color, core };
      }}
    />
  );
}
