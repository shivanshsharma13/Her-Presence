import { storyState } from "./storyState";

export const FOV = 50;
export const TAN_HALF = Math.tan(((FOV / 2) * Math.PI) / 180);

/** Half width / height of the visible area at a given distance from the camera. */
export function halfExtents(depth: number, aspect: number) {
  const halfH = depth * TAN_HALF;
  return { halfW: halfH * aspect, halfH };
}

/** Converts normalised screen coordinates (-1..1) at a depth to world space. */
export function toWorld(nx: number, ny: number, depth: number, aspect: number): [number, number, number] {
  const { halfW, halfH } = halfExtents(depth, aspect);
  return [nx * halfW, ny * halfH, -depth];
}

/** 0 → 1 over the first seconds after load: the sky slowly appearing. */
export function introFade(delaySeconds: number, durationSeconds: number) {
  if (storyState.reducedMotion) return 1;
  const t = (performance.now() - storyState.startedAt) / 1000 - delaySeconds;
  const v = Math.min(1, Math.max(0, t / durationSeconds));
  return v * v * (3 - 2 * v);
}
