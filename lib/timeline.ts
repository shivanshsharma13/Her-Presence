/**
 * The visual score of the whole piece. Every scene parameter is a function
 * of the story position `s` (chapter index + local progress, 0 → 7):
 *
 * 0 quiet beginning · 1 some days · 2 something changes · 3 your presence
 * 4 the little things · 5 the future · 6 a little promise
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
  track(s, [[0, 0], [2.0, 0], [2.85, 0.5], [3.1, 0.45], [4.5, 0.6], [5.2, 0.75], [5.75, 1], [6.2, 1], [6.5, 0.85], [6.82, 0.88], [7, 1]]);

/** Sunrise sky in chapter 6, receding to golden moonlight in chapter 7. */
export const sunrise = (s: number) =>
  track(s, [[0, 0], [5.05, 0], [5.6, 0.8], [5.95, 1], [6.12, 1], [6.45, 0.18], [6.82, 0.2], [7, 0.62]]);

export const starOpacity = (s: number) =>
  track(s, [[0, 1], [5.1, 1], [5.75, 0.32], [6.1, 0.3], [6.45, 0.85], [6.82, 0.85], [7, 0.5]]);

export const fireflyAmount = (s: number) =>
  track(s, [[0, 0], [2.04, 0], [2.6, 0.75], [3.0, 0.65], [4.05, 1], [5.0, 1], [5.8, 0.55], [6.35, 1], [7, 1]]);

export const cloudAmount = (s: number) =>
  track(s, [[0, 0.3], [1.1, 0.75], [1.9, 0.7], [2.6, 0.5], [3.1, 0.65], [4.1, 0.35], [5.3, 0.6], [6.4, 0.6], [7, 0.55]]);

/** Momentary golden bloom on "Everything feels a little lighter." */
export const bloom = (s: number) =>
  track(s, [[0, 0], [2.76, 0], [2.86, 1], [2.97, 0.5], [3.08, 0]]);

/** Soft light rays: bloom, moonlight, sunrise, golden moonlight. */
export const rays = (s: number) =>
  Math.max(
    bloom(s) * 0.9,
    track(s, [[0, 0], [3.0, 0], [3.25, 0.32], [3.95, 0.32], [4.2, 0.12], [5.2, 0.15], [5.75, 0.7], [6.1, 0.7], [6.45, 0.38], [7, 0.42]]),
  );

/** Where rays come from: 0 = the moon, 1 = the horizon. */
export const raysFromHorizon = (s: number) => track(s, [[0, 0], [5.2, 0], [5.6, 1], [6.15, 1], [6.4, 0]]);

/**
 * Moon placement in normalised screen space (x, y in -1..1 of the half
 * extents) and radius as a fraction of `moonRadius` (see below).
 */
export const moon = (s: number) => ({
  x: track(s, [[0, 0.52], [1, 0.48], [2, 0.36], [2.85, 0], [3.95, 0], [4.3, -0.5], [5.0, -0.56], [5.9, -0.62], [6.1, 0.42], [7, 0.4]]),
  y: track(s, [[0, 0.6], [1, 0.58], [2, 0.56], [2.85, 0.5], [3.95, 0.52], [4.3, 0.64], [5.0, 0.66], [5.9, 0.9], [6.1, 0.85], [6.45, 0.7], [7, 0.68]]),
  r: track(s, [[0, 0.09], [1, 0.1], [2, 0.13], [2.85, 0.48], [3.95, 0.5], [4.3, 0.17], [5.0, 0.17], [5.9, 0.15], [6.25, 0.2], [7, 0.22]]),
  opacity: track(s, [[0, 1], [5.2, 1], [5.85, 0], [6.15, 0], [6.4, 1], [7, 1]]),
});

/** The two connected stars of chapter 4. */
export const constellation = (s: number) => ({
  visible: track(s, [[0, 0], [3.06, 0], [3.2, 1], [4.05, 1], [4.3, 0]]),
  draw: track(s, [[0, 0], [3.18, 0], [3.42, 1]]),
});

/** World radius of the moon: wide on phones, never taller than the words allow on desktops. */
export const moonRadius = (r: number, halfW: number, halfH: number) => r * Math.min(halfW, halfH * 0.8);
