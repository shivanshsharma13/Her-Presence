"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { beats } from "./beats";
import { storyState } from "./storyState";

const SWIPE_PX = 36;
/** Wheel events closer together than this belong to one gesture (trackpad inertia). */
const WHEEL_GESTURE_GAP_MS = 320;
const BACK_LOCK_MS = 700;

interface Options {
  /** She has pressed "Begin". */
  started: boolean;
  /** Input is ignored while this is false (e.g. while the letter is open). */
  enabled: boolean;
}

/**
 * One swipe, tap, wheel gesture or key press moves exactly one moment.
 * Moving forward waits until the current moment's words have appeared, so
 * scrolling fast can never skip past anything.
 */
export function useBeatNavigation({ started, enabled }: Options) {
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const indexRef = useRef(0);
  const shownAt = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const go = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(beats.length - 1, next));
    if (clamped === indexRef.current) return;
    indexRef.current = clamped;
    shownAt.current = performance.now();
    setIndex(clamped);
  }, []);

  const forward = useCallback(() => {
    if (!enabledRef.current) return;
    const wait = storyState.reducedMotion ? 600 : beats[indexRef.current].readySeconds * 1000;
    if (performance.now() - shownAt.current < wait) return;
    go(indexRef.current + 1);
  }, [go]);

  const back = useCallback(() => {
    if (!enabledRef.current) return;
    if (performance.now() - shownAt.current < BACK_LOCK_MS) return;
    go(indexRef.current - 1);
  }, [go]);

  // The sky glides toward wherever the current moment lives on the timeline.
  useEffect(() => {
    storyState.s = started ? beats[index].target : 0;
  }, [index, started]);

  // `ready` drives the "tap to continue" hint.
  useEffect(() => {
    if (!enabled) return;
    setReady(false);
    const wait = storyState.reducedMotion ? 600 : beats[index].readySeconds * 1000;
    const t = window.setTimeout(() => setReady(true), wait);
    return () => window.clearTimeout(t);
  }, [index, enabled]);

  useEffect(() => {
    if (enabled) shownAt.current = performance.now();
  }, [enabled]);

  // Development only: `?moment=12` jumps straight to a moment for previewing.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !started) return;
    const m = Number(new URLSearchParams(window.location.search).get("moment"));
    if (m > 0) go(m);
  }, [started, go]);

  useEffect(() => {
    let lastWheel = 0;
    let wheelAcc = 0;
    let wheelUsed = false;
    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      if (now - lastWheel > WHEEL_GESTURE_GAP_MS) {
        wheelAcc = 0;
        wheelUsed = false;
      }
      lastWheel = now;
      if (wheelUsed) return;
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) < 30) return;
      wheelUsed = true;
      if (wheelAcc > 0) forward();
      else back();
    };

    let startY = 0;
    let startX = 0;
    let tracking = false;
    const onTouchStart = (e: TouchEvent) => {
      tracking = e.touches.length === 1;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dy = startY - t.clientY;
      const dx = startX - t.clientX;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return; // a tap: handled by click
      const delta = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
      if (delta > 0) forward();
      else back();
    };

    const onClick = (e: MouseEvent) => {
      if ((e.target as Element).closest("button, a, [data-no-advance]")) return;
      forward();
    };

    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) {
        if (e.key === "Enter" && (e.target as Element).closest("button")) return;
        e.preventDefault();
        forward();
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        back();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [forward, back]);

  return { index, ready, isLast: index === beats.length - 1, total: beats.length };
}
