"use client";

import { useEffect, useState } from "react";

export interface DeviceProfile {
  ready: boolean;
  mobile: boolean;
  /** Fine pointer with hover (desktop mouse / trackpad). */
  finePointer: boolean;
  reducedMotion: boolean;
  webgl: boolean;
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>({
    ready: false,
    mobile: true,
    finePointer: false,
    reducedMotion: false,
    webgl: true,
  });

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const mqFine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const webgl = hasWebGL();
    const update = () =>
      setProfile({
        ready: true,
        mobile: mqMobile.matches,
        finePointer: mqFine.matches,
        reducedMotion: mqReduced.matches,
        webgl,
      });
    update();
    mqMobile.addEventListener("change", update);
    mqReduced.addEventListener("change", update);
    return () => {
      mqMobile.removeEventListener("change", update);
      mqReduced.removeEventListener("change", update);
    };
  }, []);

  return profile;
}
