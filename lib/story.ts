/**
 * Every word of the experience lives here, so the letter can be edited
 * without touching any animation code.
 *
 * Timing model
 * ------------
 * The story moves one "moment" at a time: each swipe, tap, scroll or key
 * press advances exactly one moment, however fast she scrolls.
 *
 * - Each group becomes one moment. A group whose lines have different `at`
 *   values becomes several moments, with earlier lines staying on screen.
 * - `at` / `until` (0 → 1 within a chapter) place each moment on the visual
 *   timeline in `lib/timeline.ts` (moon, warmth, sunrise, fireflies...).
 * - `delay` is seconds before a line starts revealing. She can't move on
 *   until the moment's words have fully appeared.
 */

export type LineStyle = "display" | "displayLg" | "body" | "hand" | "glow";

export interface StoryLine {
  text: string;
  style: LineStyle;
  /** Seconds after the line becomes eligible before it starts revealing. */
  delay?: number;
  /** Chapter progress at which this line appears (a moment of its own). */
  at?: number;
  /** Reveal letter by letter instead of word by word. */
  letters?: boolean;
}

export interface StoryGroup {
  at: number;
  until: number;
  lines: StoryLine[];
  /** Renders the group as a small glowing card (used in "The Little Things"). */
  card?: boolean;
}

export interface Chapter {
  id: string;
  /** Vertical placement of the text stage. */
  align?: "center" | "low";
  groups: StoryGroup[];
}

export const chapters: Chapter[] = [
  {
    id: "the-quiet-beginning",
    groups: [
      {
        at: 0.2,
        until: 0.98,
        lines: [
          { text: "Hey, Shinu...", style: "displayLg", letters: true, delay: 0.8 },
          { text: "I wanted to tell you something.", style: "body", delay: 3 },
        ],
      },
    ],
  },
  {
    id: "some-days",
    groups: [
      {
        at: 0.04,
        until: 0.3,
        lines: [{ text: "Some days, life feels a little overwhelming.", style: "display" }],
      },
      {
        at: 0.36,
        until: 0.63,
        lines: [
          {
            text: "I have so many things on my mind. My career, my dreams, the future, and all the things I'm still trying to figure out.",
            style: "body",
          },
        ],
      },
      {
        at: 0.69,
        until: 0.97,
        lines: [
          { text: "The answers aren't always clear.", style: "display" },
          { text: "And sometimes, I get a little scared too.", style: "hand", delay: 1.6 },
        ],
      },
    ],
  },
  {
    id: "something-changes",
    groups: [
      {
        at: 0.04,
        until: 0.24,
        lines: [{ text: "And then there's you.", style: "displayLg" }],
      },
      {
        at: 0.3,
        until: 0.54,
        lines: [
          { text: "Nothing necessarily changes around me.", style: "body" },
          { text: "My problems don't disappear. Tomorrow is still uncertain.", style: "body", delay: 1.8 },
        ],
      },
      {
        at: 0.59,
        until: 0.73,
        lines: [{ text: "But somehow...", style: "hand" }],
      },
      {
        at: 0.77,
        until: 0.98,
        lines: [{ text: "Everything feels a little lighter.", style: "glow" }],
      },
    ],
  },
  {
    id: "your-presence",
    align: "low",
    groups: [
      {
        at: 0.06,
        until: 0.97,
        lines: [
          { text: "You don't have to be here physically.", style: "display", at: 0.06 },
          { text: "It's your presence that makes things better.", style: "display", at: 0.36 },
          { text: "And it's you.", style: "glow", at: 0.64 },
        ],
      },
    ],
  },
  {
    id: "little-things",
    groups: [
      { at: 0.03, until: 0.19, card: true, lines: [{ text: "Sometimes, just seeing your name makes me smile.", style: "body" }] },
      { at: 0.22, until: 0.38, card: true, lines: [{ text: "Sometimes, remembering something you said changes my entire mood.", style: "body" }] },
      { at: 0.41, until: 0.58, card: true, lines: [{ text: "Sometimes, I don't need a conversation. Just knowing that it's you is enough.", style: "body" }] },
      { at: 0.61, until: 0.77, card: true, lines: [{ text: "I love how you adore little things and value moments.", style: "body" }] },
      { at: 0.8, until: 0.97, card: true, lines: [{ text: "You make ordinary days feel special.", style: "body" }] },
    ],
  },
  {
    id: "the-future",
    groups: [
      {
        at: 0.04,
        until: 0.3,
        lines: [
          { text: "I don't know exactly what tomorrow holds.", style: "display" },
          { text: "I don't know how quickly things will fall into place.", style: "body", delay: 1.8 },
        ],
      },
      {
        at: 0.36,
        until: 0.62,
        lines: [
          { text: "But I'll keep trying.", style: "display" },
          { text: "I'll keep dreaming.", style: "display", delay: 1.1 },
          { text: "I'll keep building the life I've imagined.", style: "display", delay: 2.2 },
        ],
      },
      {
        at: 0.68,
        until: 0.97,
        lines: [
          {
            text: "And when I imagine the little moments along the way, I'm so happy that you're part of them.",
            style: "glow",
          },
        ],
      },
    ],
  },
  {
    id: "a-little-promise",
    groups: [
      {
        at: 0.03,
        until: 0.3,
        lines: [
          { text: "I cannot promise that every day will be easy.", style: "display" },
          {
            text: "But I can promise that I'll keep showing up, keep working towards my dreams, and keep appreciating the beautiful person I have in my life.",
            style: "body",
            delay: 1.9,
          },
        ],
      },
      {
        at: 0.36,
        until: 0.62,
        lines: [
          { text: "You don't have to do anything extraordinary to make a difference in my life.", style: "body" },
          { text: "You already make a difference simply by being you.", style: "glow", delay: 2 },
        ],
      },
      {
        at: 0.66,
        until: 0.84,
        lines: [
          { text: "It's not always about having you beside me, Shinu.", style: "display" },
          { text: "Sometimes, knowing that it's you is more than enough.", style: "body", delay: 2 },
          { text: "I love you. ❤️", style: "hand", delay: 4 },
        ],
      },
      {
        // Written at night, opened in the morning. The final moment never leaves.
        at: 0.88,
        until: 2,
        lines: [
          { text: "I made this for you last night, while you were asleep.", style: "display" },
          {
            text: "The moon has handed the sky over to the sun now, but everything I felt last night is still right here.",
            style: "body",
            delay: 2,
          },
          { text: "Good morning, Shinu. ☀️", style: "hand", delay: 4.8 },
        ],
      },
    ],
  },
];

export const finalButton = "Read one last little thing";

export const welcome = {
  title: "For Shinu",
  subtitle: "Somewhere in my universe, there's you.",
  button: "Begin",
  note: "Sound on, if you can.",
  hint: "tap or swipe to continue",
};

/**
 * Put your song at `public/song.mp3` (or change the path). If the file is
 * missing, a soft generated ambient track plays instead.
 */
export const music = {
  src: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/song.mp3`,
  volume: 0.7,
};

export const letter = {
  salutation: "Shinu,",
  paragraphs: [
    "I've been carrying this feeling around for a while, and I wanted to put it somewhere it could stay.",
    "These days I spend a lot of time inside my own head: applications, interviews, waiting, wondering if I'm good enough, wondering if the life I keep picturing is really on its way. Some nights it gets loud in there.",
    "And then I think of you. Not of you doing anything, or saying the right thing, or fixing something for me. Just you. Your name lighting up my screen. Something you said weeks ago that I still replay. The way you get excited about little things and hold on to small moments, because to you, they matter.",
    "That's what I keep coming back to. You don't have to be beside me for it to work. You don't have to be available all the time, or be strong for me, or have the answers. You only have to be you, somewhere in this world, and somehow my world gets softer.",
    "I don't know exactly where I'll be a year from now. But I know I'll keep trying, and I know I want you in the little moments along the way.",
    "So on the days you feel ordinary, please remember this: for someone, you are the steady thing. The quiet light. The one sure thing in a very unsure time.",
    "Thank you for being you. That has always been enough.",
  ],
  closing: "Yours, always,",
  signature: "Shivansh",
  postscript:
    "P.S. I wrote this late last night, so you were the last thing on my mind before I slept. I hope you slept well. Take your time this morning, have something warm, and know that today, someone is quietly thinking of you. Good morning. ☀️",
};
