"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { letter } from "@/lib/story";

interface Props {
  open: boolean;
  onClose: () => void;
  reducedMotion: boolean;
}

/** One last little thing: the whole message, handwritten. */
export function FinalLetter({ open, onClose, reducedMotion }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const focus = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 400);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focus);
    };
  }, [open, onClose]);

  const paragraphs = [letter.salutation, ...letter.paragraphs];
  const step = reducedMotion ? 0 : 0.35;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(5,9,22,0.72)] px-4 py-[max(1rem,env(safe-area-inset-top))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.9 } }}
          exit={{ opacity: 0, transition: { duration: 0.7, delay: 0.2 } }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="A letter for Shinu"
        >
          <motion.article
            onClick={(e) => e.stopPropagation()}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 } }}
            exit={{ opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.6 } }}
            className="paper relative max-h-[calc(100svh-2rem)] w-full max-w-[34rem] overflow-y-auto overscroll-contain rounded-[0.4rem] px-[clamp(1.5rem,6vw,3rem)] pb-12 pt-14"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close the letter"
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-[#26304f]/50 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#26304f]/40 active:text-[#26304f]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="letter-text space-y-5">
              {paragraphs.map((p, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.9 + i * step, duration: 1.2 } }}
                >
                  {p}
                </motion.p>
              ))}
              <motion.div
                className="pt-4 text-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.9 + paragraphs.length * step + 0.4, duration: 1.4 } }}
              >
                <p>{letter.closing}</p>
                <p className="mt-1 text-[1.25em]">{letter.signature}</p>
              </motion.div>
            </div>

            <motion.div
              className="mt-10 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.9 + paragraphs.length * step + 1.2, duration: 1.2 } }}
            >
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 px-4 text-[0.72rem] uppercase tracking-[0.3em] text-[#26304f]/60 underline decoration-[#26304f]/20 underline-offset-8"
              >
                back to the stars
              </button>
            </motion.div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
