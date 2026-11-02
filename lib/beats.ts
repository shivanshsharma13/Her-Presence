import { chapters, type StoryLine } from "./story";

/** One moment of the story: what is on screen, and where the sky should be. */
export interface Beat {
  chapter: number;
  group: number;
  /** Lines of the group with `at` at or below this are visible. */
  step: number;
  /** Story position (chapter index + progress) the sky glides to. */
  target: number;
  /** Seconds until every word of this moment has appeared. */
  readySeconds: number;
}

export const WORD_SECONDS = 1.5;

export function staggerFor(line: Pick<StoryLine, "style" | "letters">) {
  if (line.letters) return 0.075;
  return line.style === "body" ? 0.07 : 0.11;
}

function revealSeconds(line: StoryLine) {
  const units = line.letters ? line.text.length : line.text.split(" ").length;
  return (line.delay ?? 0) + (units - 1) * staggerFor(line) + WORD_SECONDS;
}

function buildBeats(): Beat[] {
  const beats: Beat[] = [];
  chapters.forEach((chapter, c) => {
    chapter.groups.forEach((group, g) => {
      const steps = [...new Set(group.lines.map((l) => l.at ?? group.at))].sort((a, b) => a - b);
      steps.forEach((step, k) => {
        const end = Math.min(1, steps[k + 1] ?? group.until);
        const fresh = group.lines.filter((l) => (l.at ?? group.at) === step);
        const ready = group.card ? 1.8 : Math.max(...fresh.map(revealSeconds));
        beats.push({
          chapter: c,
          group: g,
          step,
          target: c + (step + end) / 2,
          readySeconds: Math.min(ready, 5.5),
        });
      });
    });
  });
  // The final moment rests at the very end of the timeline.
  beats[beats.length - 1].target = chapters.length;
  return beats;
}

export const beats = buildBeats();
