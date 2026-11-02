import * as THREE from "three";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const seededRandom = mulberry32;

/**
 * Paints a soft, wispy cloud into a canvas once. Sampling a texture is far
 * cheaper on phones than evaluating fractal noise per pixel every frame.
 */
export function createCloudTexture(seed: number) {
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed);

  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    // Puffs cluster toward the middle and flatten toward the bottom.
    const u = (rand() + rand() + rand()) / 3;
    const x = w * (0.12 + 0.76 * u);
    const y = h * (0.42 + (rand() - 0.5) * 0.32 * (1 - Math.abs(u - 0.5)));
    const r = h * (0.08 + rand() * 0.2) * (1.15 - Math.abs(u - 0.5));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.06 + rand() * 0.08;
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(0.6, `rgba(255,255,255,${a * 0.45})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.6, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}
