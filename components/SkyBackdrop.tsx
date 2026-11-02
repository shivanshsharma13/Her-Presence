"use client";

import { useEffect, useMemo, useRef } from "react";
import { storyState } from "@/lib/storyState";
import { bloom, moon, sunrise, warmth } from "@/lib/timeline";
import { seededRandom } from "@/lib/textures";

/**
 * The sky behind the WebGL layer: the colour of the night shifting from
 * midnight blue to gold. Pure CSS, so it also stands alone when WebGL is
 * unavailable (with a few CSS stars and a CSS moon added).
 */
export function SkyBackdrop({ fallback }: { fallback: boolean }) {
  const warm = useRef<HTMLDivElement>(null);
  const dawn = useRef<HTMLDivElement>(null);
  const flare = useRef<HTMLDivElement>(null);
  const cssMoon = useRef<HTMLDivElement>(null);
  const cssStars = useRef<HTMLDivElement>(null);

  const stars = useMemo(() => {
    const rand = seededRandom(3);
    return Array.from({ length: 140 }, () => ({
      left: rand() * 100,
      top: rand() * 100,
      size: rand() > 0.9 ? 2.5 : 1 + rand(),
      tw: 2.5 + rand() * 5,
      delay: rand() * -6,
    }));
  }, []);

  useEffect(() => {
    let raf = 0;
    let smooth = storyState.s;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      smooth += (storyState.s - smooth) * (storyState.reducedMotion ? 1 : 1 - Math.exp(-dt * 1.8));
      const s = smooth;
      if (warm.current) warm.current.style.opacity = String(warmth(s));
      if (dawn.current) dawn.current.style.opacity = String(sunrise(s));
      if (flare.current) flare.current.style.opacity = String(bloom(s) * 0.85);
      if (cssStars.current) cssStars.current.style.opacity = String(1 - sunrise(s) * 0.7);
      if (cssMoon.current) {
        const m = moon(s);
        const size = Math.max(9, m.r * 46);
        cssMoon.current.style.opacity = String(m.opacity);
        cssMoon.current.style.width = cssMoon.current.style.height = `min(${size}vw, ${size * 0.8}vh)`;
        cssMoon.current.style.left = `${50 + m.x * 50}%`;
        cssMoon.current.style.top = `${50 - m.y * 50}%`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* Night */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#060b1a_0%,#080e20_38%,#0d1733_72%,#16264b_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(90%_55%_at_75%_12%,rgba(169,164,213,0.13),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_45%_at_50%_105%,rgba(38,60,103,0.55),transparent_70%)]" />

      {/* Her warmth */}
      <div
        ref={warm}
        className="absolute inset-0 opacity-0 bg-[radial-gradient(80%_50%_at_50%_30%,rgba(245,217,155,0.14),transparent_70%),radial-gradient(120%_50%_at_50%_110%,rgba(245,200,140,0.18),transparent_70%)]"
      />

      {/* Sunrise */}
      <div
        ref={dawn}
        className="absolute inset-0 opacity-0 bg-[linear-gradient(180deg,#141c40_0%,#2c3466_26%,#5d5788_48%,#a27f97_66%,#d9a888_82%,#f2cf98_100%)]"
      />

      {fallback && (
        <>
          <div ref={cssStars} className="absolute inset-0">
            {stars.map((st, i) => (
              <span
                key={i}
                className="animate-twinkle absolute rounded-full bg-ivory"
                style={{
                  left: `${st.left}%`,
                  top: `${st.top}%`,
                  width: st.size,
                  height: st.size,
                  ["--tw" as string]: `${st.tw}s`,
                  animationDelay: `${st.delay}s`,
                }}
              />
            ))}
          </div>
          <div
            ref={cssMoon}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_38%_35%,#fbf8f0_0%,#e9e5da_45%,#bdbacb_100%)] shadow-[0_0_80px_20px_rgba(201,198,234,0.25)]"
          />
        </>
      )}

      {/* The bloom on "a little lighter" */}
      <div
        ref={flare}
        className="absolute inset-0 opacity-0 bg-[radial-gradient(60%_45%_at_50%_50%,rgba(255,236,196,0.5),rgba(245,217,155,0.16)_45%,transparent_75%)]"
      />

      {/* Vignette and grain keep the gradients soft and cinematic. */}
      <div className="absolute inset-0 bg-[radial-gradient(130%_90%_at_50%_45%,transparent_55%,rgba(4,7,18,0.55)_100%)]" />
    </div>
  );
}

/** Film grain over everything; hides gradient banding on cheap screens. */
export function Grain() {
  return <div className="grain pointer-events-none fixed inset-0 z-30" aria-hidden />;
}
