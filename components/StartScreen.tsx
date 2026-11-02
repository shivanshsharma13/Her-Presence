"use client";

import { AnimatePresence, motion } from "framer-motion";
import { welcome } from "@/lib/story";

const EASE = [0.22, 1, 0.36, 1] as const;

/** A quiet threshold. Her tap here also lets the browser start the song. */
export function StartScreen({ visible, onBegin }: { visible: boolean; onBegin: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center px-6 text-center"
          exit={{ opacity: 0, filter: "blur(8px)", transition: { duration: 1.4, ease: EASE } }}
        >
          <motion.p
            className="story-text t-displayLg"
            initial={{ opacity: 0, y: 12, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { delay: 1.2, duration: 2, ease: EASE } }}
          >
            {welcome.title}
          </motion.p>
          <motion.p
            className="story-text t-body mt-4 !text-ivory/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 2.4, duration: 2 } }}
          >
            {welcome.subtitle}
          </motion.p>
          <motion.button
            type="button"
            onClick={onBegin}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 3.4, duration: 1.6, ease: EASE } }}
            className="mt-12 min-h-12 rounded-full border border-gold/35 bg-gold/[0.07] px-10 py-3 text-[0.8rem] uppercase tracking-[0.3em] text-ivory/90 shadow-[0_0_50px_rgba(245,217,155,0.15)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold/60 active:bg-gold/15"
          >
            {welcome.button}
          </motion.button>
          <motion.p
            className="mt-5 text-[0.72rem] tracking-[0.2em] text-ivory/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 4.2, duration: 1.6 } }}
          >
            {welcome.note}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Appears once a moment has fully arrived: a gentle cue that there's more. */
export function ContinueHint({ visible, showText }: { visible: boolean; showText: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-3"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: visible ? 1.6 : 0.4 }}
    >
      {showText && <span className="text-[0.66rem] uppercase tracking-[0.32em] text-ivory/45">{welcome.hint}</span>}
      <span className="relative block h-10 w-px overflow-hidden bg-ivory/10">
        <span className="animate-scroll-hint absolute inset-0 bg-gradient-to-b from-gold/0 via-gold/80 to-gold/0" />
      </span>
    </motion.div>
  );
}

/** A single hairline of gold that fills as the story goes on. */
export function MomentProgress({ value, hidden }: { value: number; hidden: boolean }) {
  return (
    <div
      className={`pointer-events-none fixed right-[max(0.9rem,env(safe-area-inset-right))] top-1/2 z-20 h-24 w-px -translate-y-1/2 bg-ivory/10 transition-opacity duration-700 ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden
    >
      <motion.div
        className="h-full w-full origin-top bg-gold/80 shadow-[0_0_8px_rgba(245,217,155,0.8)]"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: value }}
        transition={{ duration: 1.6, ease: EASE }}
      />
    </div>
  );
}
