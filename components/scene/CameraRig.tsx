"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { storyState } from "@/lib/storyState";

/**
 * Advances the smoothed story position once per frame and adds a whisper of
 * pointer parallax on devices with a mouse. Touch devices get none.
 */
export function CameraRig({ parallax }: { parallax: boolean }) {
  const camera = useThree((s) => s.camera);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!parallax) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [parallax]);

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 1.5);
    const active = parallax && !storyState.reducedMotion;
    const tx = active ? -pointer.current.y * 0.012 : 0;
    const ty = active ? -pointer.current.x * 0.018 : 0;
    camera.rotation.x += (tx - camera.rotation.x) * k;
    camera.rotation.y += (ty - camera.rotation.y) * k;
  });

  return null;
}
