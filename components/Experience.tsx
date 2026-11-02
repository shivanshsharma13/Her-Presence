"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { chapters } from "@/lib/story";
import { beats } from "@/lib/beats";
import { musicPlayer } from "@/lib/music";
import { storyState } from "@/lib/storyState";
import { useDeviceProfile } from "@/lib/useDeviceProfile";
import { useBeatNavigation } from "@/lib/useBeatNavigation";
import { Grain, SkyBackdrop } from "./SkyBackdrop";
import { StoryChapter } from "./StoryChapter";
import { FinalLetter } from "./FinalLetter";
import { SoundToggle } from "./SoundToggle";
import { ContinueHint, MomentProgress, StartScreen } from "./StartScreen";

const SkyCanvas = dynamic(() => import("./scene/SkyCanvas"), { ssr: false });

export function Experience() {
  const profile = useDeviceProfile();
  const [started, setStarted] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const openLetter = useCallback(() => setLetterOpen(true), []);
  const closeLetter = useCallback(() => setLetterOpen(false), []);
  const nav = useBeatNavigation({ started, enabled: started && !letterOpen });

  useEffect(() => {
    storyState.startedAt = performance.now();
    void musicPlayer.prepare();
  }, []);

  useEffect(() => {
    storyState.reducedMotion = profile.reducedMotion;
  }, [profile.reducedMotion]);

  const begin = () => {
    void musicPlayer.play();
    setStarted(true);
  };

  const beat = started ? beats[nav.index] : null;
  const fallback = profile.ready && !profile.webgl;
  const finalIndex = chapters.length - 1;

  return (
    <main className="fixed inset-0 overflow-hidden">
      <SkyBackdrop fallback={fallback} />
      {profile.ready && profile.webgl && (
        <SkyCanvas
          mobile={profile.mobile}
          parallax={profile.finePointer}
          paused={letterOpen}
          fallback={<SkyBackdrop fallback />}
        />
      )}
      <Grain />

      {/* The stage: every chapter is layered here; only the current moment shows. */}
      <div className="absolute inset-0 z-10 touch-none select-none">
        {chapters.map((chapter, i) => (
          <StoryChapter
            key={chapter.id}
            index={i}
            chapter={chapter}
            beat={beat}
            reducedMotion={profile.reducedMotion}
            onOpenLetter={i === finalIndex ? openLetter : undefined}
          />
        ))}
      </div>

      <StartScreen visible={!started} onBegin={begin} />
      <ContinueHint visible={started && nav.ready && !nav.isLast && !letterOpen} showText={nav.index < 2} />
      <MomentProgress value={started ? nav.index / (nav.total - 1) : 0} hidden={!started || letterOpen} />
      <SoundToggle visible={started} />
      <FinalLetter open={letterOpen} onClose={closeLetter} reducedMotion={profile.reducedMotion} />
    </main>
  );
}
