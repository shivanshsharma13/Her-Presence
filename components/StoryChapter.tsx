"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CinematicText } from "./CinematicText";
import { finalButton, type Chapter, type StoryGroup } from "@/lib/story";
import type { Beat } from "@/lib/beats";

interface Props {
  chapter: Chapter;
  index: number;
  /** The moment currently on screen, or null before she begins. */
  beat: Beat | null;
  reducedMotion: boolean;
  /** Present only on the final chapter. */
  onOpenLetter?: () => void;
}

/**
 * One chapter's words, layered on the shared full-screen stage. Only the
 * current moment is mounted, so a phone never holds hundreds of animated
 * words in memory at once.
 */
export function StoryChapter({ chapter, index, beat, reducedMotion, onOpenLetter }: Props) {
  const here = beat?.chapter === index;
  const gi = here ? beat!.group : -1;
  const group = here ? chapter.groups[gi] : null;
  const finale = !!onOpenLetter && gi === chapter.groups.length - 1;

  return (
    <section className="pointer-events-none absolute inset-0" aria-hidden={!here} aria-label={chapter.id}>
      <AnimatePresence>
        {group && (
          <motion.div
            key={gi}
            className={`absolute inset-0 flex flex-col items-center px-6 text-center ${
              chapter.align === "low" ? "justify-start pt-[57svh]" : "justify-center"
            }`}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -10, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }}
          >
            {group.card ? (
              <LittleCard group={group} reducedMotion={reducedMotion} index={gi} />
            ) : (
              <div className="flex flex-col items-center gap-[clamp(1rem,3.2svh,2rem)]">
                {group.lines.map((line, li) => (
                  <CinematicText
                    key={li}
                    text={line.text}
                    style={line.style}
                    delay={line.delay}
                    letters={line.letters}
                    shown={(line.at ?? group.at) <= beat!.step}
                    reducedMotion={reducedMotion}
                  />
                ))}
                {finale && <FinaleButton delay={7.2} onClick={onOpenLetter!} />}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function LittleCard({ group, reducedMotion, index }: { group: StoryGroup; reducedMotion: boolean; index: number }) {
  // Each card rests a little off-centre, like a note placed by hand.
  const offset = index % 2 === 0 ? "-2.5vw" : "2.5vw";
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 1.6, ease: [0.22, 1, 0.36, 1] } }}
      style={{ x: offset }}
      className="w-full max-w-[26rem]"
    >
      <div className="animate-float-soft relative rounded-[1.75rem] border border-gold/20 bg-[linear-gradient(160deg,rgba(38,60,103,0.42),rgba(8,14,32,0.55))] px-7 pb-8 pt-9 shadow-[0_0_70px_rgba(245,217,155,0.10),inset_0_1px_0_rgba(245,241,233,0.08)]">
        <span className="animate-firefly absolute left-1/2 top-0 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_14px_4px_rgba(245,217,155,0.65)]" />
        <p className="story-text card-text">{group.lines[0].text}</p>
      </div>
    </motion.div>
  );
}

function FinaleButton({ delay, onClick }: { delay: number; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { delay, duration: 1.6 } }}
      className="pointer-events-auto mt-[clamp(0.75rem,3svh,2.25rem)] min-h-11 rounded-full border border-gold/30 bg-gold/[0.06] px-6 py-3 text-[0.8rem] tracking-[0.18em] text-ivory/85 uppercase shadow-[0_0_40px_rgba(245,217,155,0.12)] transition-colors duration-500 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold/60 active:bg-gold/15 [@media(hover:hover)]:hover:border-gold/60 [@media(hover:hover)]:hover:bg-gold/10"
    >
      {finalButton}
    </motion.button>
  );
}
