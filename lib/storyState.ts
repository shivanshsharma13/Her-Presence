/**
 * A tiny mutable store shared between the DOM scroll listener and the WebGL
 * render loop. Reading it inside `useFrame` avoids React re-renders on every
 * scroll event.
 */
export const storyState = {
  /** Continuous story position: chapter index + local progress (0 → 7). */
  s: 0,
  /** Smoothed copy of `s`, eased toward `s` every frame. */
  smooth: 0,
  /** Seconds since the page mounted; drives the opening fade-in. */
  startedAt: 0,
  reducedMotion: false,
};

export const CHAPTER_COUNT = 7;

/** Eases `storyState.smooth` toward `storyState.s`. Call once per frame. */
export function stepSmooth(delta: number) {
  const k = storyState.reducedMotion ? 1 : 1 - Math.exp(-delta * 1.8);
  storyState.smooth += (storyState.s - storyState.smooth) * k;
  return storyState.smooth;
}
