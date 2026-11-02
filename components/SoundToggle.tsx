"use client";

import { useEffect, useState } from "react";
import { musicPlayer } from "@/lib/music";

/** Mutes or resumes the music. */
export function SoundToggle({ visible }: { visible: boolean }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(musicPlayer.on);
    return musicPlayer.subscribe(setOn);
  }, []);

  return (
    <button
      type="button"
      onClick={() => musicPlayer.toggle()}
      aria-pressed={on}
      aria-label={on ? "Turn music off" : "Turn music on"}
      className={`fixed right-[max(0.5rem,env(safe-area-inset-right))] top-[max(0.5rem,env(safe-area-inset-top))] z-50 flex h-11 w-11 items-center justify-center rounded-full text-ivory/55 transition-[color,opacity] duration-700 focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold/50 active:text-gold ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden>
        {[2, 6, 10, 14, 18].map((x, i) => (
          <line
            key={x}
            x1={x}
            x2={x}
            y1={on ? 7 - [2, 5, 6.5, 4, 2.5][i] : 6.5}
            y2={on ? 7 + [2, 5, 6.5, 4, 2.5][i] : 7.5}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ transition: "all 0.6s cubic-bezier(0.22,1,0.36,1)" }}
            className={on ? "text-gold" : ""}
          />
        ))}
      </svg>
    </button>
  );
}
