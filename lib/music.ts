"use client";

import { AmbientMusic } from "./ambientMusic";
import { music as config } from "./story";

const FADE_MS = 2500;

/**
 * Plays her song (`public/song.mp3`), fading in and out gently. If the file
 * is missing or can't play, the generated ambient track plays instead.
 */
class MusicPlayer {
  private audio?: HTMLAudioElement;
  private ambient?: AmbientMusic;
  private useAmbient = false;
  private fadeRaf = 0;
  private listeners = new Set<(on: boolean) => void>();
  on = false;

  subscribe(fn: (on: boolean) => void) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  private set(on: boolean) {
    this.on = on;
    this.listeners.forEach((fn) => fn(on));
  }

  /** Checks ahead of time whether the song exists, so the first tap can start the right thing. */
  async prepare() {
    try {
      const res = await fetch(config.src, { method: "HEAD" });
      if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("audio")) this.useAmbient = true;
    } catch {
      this.useAmbient = true;
    }
  }

  /** Must be called from a tap or click so the browser allows playback. */
  async play() {
    this.set(true);
    if (this.useAmbient) return this.playAmbient();
    if (!this.audio) {
      this.audio = new Audio(config.src);
      this.audio.loop = true;
      this.audio.preload = "auto";
      this.audio.volume = 0;
      this.audio.addEventListener("error", () => this.fallBack());
    }
    try {
      await this.audio.play();
      this.fadeTo(config.volume);
    } catch {
      this.fallBack();
    }
  }

  pause() {
    this.set(false);
    if (this.useAmbient) return this.ambient?.stop();
    this.fadeTo(0, () => this.audio?.pause());
  }

  toggle() {
    if (this.on) this.pause();
    else void this.play();
  }

  private fallBack() {
    if (this.useAmbient) return;
    this.useAmbient = true;
    this.audio?.pause();
    if (this.on) void this.playAmbient();
  }

  private playAmbient() {
    this.ambient ??= new AmbientMusic();
    return this.ambient.start();
  }

  private fadeTo(target: number, done?: () => void) {
    const audio = this.audio;
    if (!audio) return;
    cancelAnimationFrame(this.fadeRaf);
    const from = audio.volume;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS);
      audio.volume = from + (target - from) * t;
      if (t < 1) this.fadeRaf = requestAnimationFrame(step);
      else done?.();
    };
    this.fadeRaf = requestAnimationFrame(step);
  }
}

export const musicPlayer = typeof window === "undefined" ? (null as unknown as MusicPlayer) : new MusicPlayer();
