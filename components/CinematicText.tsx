"use client";

import { motion, type Variants } from "framer-motion";
import type { LineStyle } from "@/lib/story";
import { WORD_SECONDS, staggerFor } from "@/lib/beats";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  text: string;
  style: LineStyle;
  shown: boolean;
  delay?: number;
  reducedMotion: boolean;
  /** Reveal letter by letter instead of word by word. */
  letters?: boolean;
  className?: string;
}

/**
 * A line that arrives word by word, each word drifting from blur into focus.
 * It leaves all at once, quietly.
 */
export function CinematicText({ text, style, shown, delay = 0, reducedMotion, letters, className = "" }: Props) {
  const words = text.split(" ");
  const stagger = staggerFor({ style, letters });

  const container: Variants = {
    hidden: { transition: { staggerChildren: 0 } },
    shown: { transition: { delayChildren: delay, staggerChildren: reducedMotion ? 0 : stagger } },
  };

  const unit: Variants = reducedMotion
    ? {
        hidden: { opacity: 0, transition: { duration: 0.6 } },
        shown: { opacity: 1, transition: { duration: 1.2 } },
      }
    : {
        hidden: { opacity: 0, filter: "blur(10px)", y: "0.3em", transition: { duration: 0.9, ease: EASE } },
        shown: { opacity: 1, filter: "blur(0px)", y: "0em", transition: { duration: WORD_SECONDS, ease: EASE } },
      };

  return (
    <motion.p
      className={`story-text t-${style} mx-auto ${className}`}
      variants={container}
      initial="hidden"
      animate={shown ? "shown" : "hidden"}
    >
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <span key={i} aria-hidden>
          {letters ? (
            <span className="inline-block whitespace-nowrap">
              {Array.from(word).map((ch, j) => (
                <motion.span key={j} className="word" variants={unit}>
                  {ch}
                </motion.span>
              ))}
            </span>
          ) : (
            <motion.span className="word" variants={unit}>
              {word}
            </motion.span>
          )}
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </motion.p>
  );
}
