/**
 * The visual score of the whole piece. Every scene parameter is a function
 * of the story position `s` (chapter index + local progress, 0 → 8):
 *
 * 0 quiet beginning · 1 some days · 2 something changes · 3 your presence
 * 4 the little things · 5 a night I remember · 6 the future · 7 a little promise
 */

type Key = readonly [s: number, value: number];

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export function track(s: number, keys: readonly Key[]): number {
  if (s <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [s1, v1] = keys[i];
    if (s <= s1) {
      const [s0, v0] = keys[i - 1];
      const t = s1 === s0 ? 1 : (s - s0) / (s1 - s0);
      return v0 + (v1 - v0) * smoothstep(t);
    }
  }
  return keys[keys.length - 1][1];
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 0 = cool midnight, 1 = full golden warmth. */
export const warmth = (s: number) =>
  track(s, [[0, 0], [2, 0], [2.85, 0.5], [3.1, 0.45], [4.5, 0.6], [5, 0.62], [5.3, 0.62], [5.45, 0.3], [5.62, 0.3], [5.8, 0.72], [6.2, 0.75], [6.75, 1], [7.2, 1], [7.5, 0.85], [7.82, 0.88], [8, 1]]);

/** Sunrise sky in chapter 6, receding to golden moonlight in chapter 7. */
export const sunrise = (s: number) =>
  track(s, [[0, 0], [6.05, 0], [6.6, 0.8], [6.95, 1], [7.12, 1], [7.45, 0.18], [7.82, 0.2], [8, 0.62]]);

export const starOpacity = (s: number) =>
  track(s, [[0, 1], [6.1, 1], [6.75, 0.32], [7.1, 0.3], [7.45, 0.85], [7.82, 0.85], [8, 0.5]]);

export const fireflyAmount = (s: number) =>
  track(s, [[0, 0], [2.04, 0], [2.6, 0.75], [3, 0.65], [4.05, 1], [5, 1], [5.3, 1], [5.45, 0.25], [5.62, 0.25], [5.8, 1], [6, 1], [6.8, 0.55], [7.35, 1], [8, 1]]);

export const cloudAmount = (s: number) =>
  track(s, [[0, 0.3], [1.1, 0.75], [1.9, 0.7], [2.6, 0.5], [3.1, 0.65], [4.1, 0.35], [5, 0.4], [5.45, 0.75], [5.62, 0.75], [5.8, 0.45], [6.3, 0.6], [7.4, 0.6], [8, 0.55]]);

/** Momentary golden bloom on "Everything feels a little lighter." */
export const bloom = (s: number) =>
  track(s, [[0, 0], [2.76, 0], [2.86, 1], [2.97, 0.5], [3.08, 0]]);

/** Soft light rays: bloom, moonlight, sunrise, golden moonlight. */
export const rays = (s: number) =>
  Math.max(
    bloom(s) * 0.9,
    track(s, [[0, 0], [3, 0], [3.25, 0.32], [3.95, 0.32], [4.2, 0.12], [6.2, 0.15], [6.75, 0.7], [7.1, 0.7], [7.45, 0.38], [8, 0.42]]),
  );

/** Where rays come from: 0 = the moon, 1 = the horizon. */
export const raysFromHorizon = (s: number) => track(s, [[0, 0], [6.2, 0], [6.6, 1], [7.15, 1], [7.4, 0]]);

/**
 * Moon placement in normalised screen space (x, y in -1..1 of the half
 * extents) and radius as a fraction of `moonRadius` (see below).
 */
export const moon = (s: number) => ({
  x: track(s, [[0, 0.52], [1, 0.48], [2, 0.36], [2.85, 0], [3.95, 0], [4.3, -0.5], [6, -0.56], [6.9, -0.62], [7.1, 0.42], [8, 0.4]]),
  y: track(s, [[0, 0.6], [1, 0.58], [2, 0.56], [2.85, 0.5], [3.95, 0.52], [4.3, 0.64], [6, 0.66], [6.9, 0.9], [7.1, 0.85], [7.45, 0.7], [8, 0.68]]),
  r: track(s, [[0, 0.09], [1, 0.1], [2, 0.13], [2.85, 0.48], [3.95, 0.5], [4.3, 0.17], [6, 0.17], [6.9, 0.15], [7.25, 0.2], [8, 0.22]]),
  opacity: track(s, [[0, 1], [6.2, 1], [6.85, 0], [7.15, 0], [7.4, 1], [8, 1]]),
});

/** The two connected stars of chapter 4. */
export const constellation = (s: number) => ({
  visible: track(s, [[0, 0], [3.06, 0], [3.2, 1], [4.05, 1], [4.3, 0]]),
  draw: track(s, [[0, 0], [3.18, 0], [3.42, 1]]),
});

/** World radius of the moon: wide on phones, never taller than the words allow on desktops. */
export const moonRadius = (r: number, halfW: number, halfH: number) => r * Math.min(halfW, halfH * 0.8);
