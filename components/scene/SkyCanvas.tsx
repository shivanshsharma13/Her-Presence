"use client";

import { Component, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { FOV } from "@/lib/frustum";
import { stepSmooth } from "@/lib/storyState";
import { SkyGradient } from "./SkyGradient";
import { StarField } from "./StarField";
import { MoonScene } from "./MoonScene";
import { Clouds } from "./Clouds";
import { LightRays } from "./LightRays";
import { ConstellationConnection } from "./ConstellationConnection";
import { FloatingParticles } from "./FloatingParticles";
import { FireflySystem } from "./FireflySystem";
import { CameraRig } from "./CameraRig";

/** Runs first each frame so every layer reads the same eased story position. */
function StoryClock() {
  useFrame((_, delta) => {
    stepSmooth(Math.min(delta, 0.1));
  }, -1);
  return null;
}

class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface Props {
  mobile: boolean;
  parallax: boolean;
  /** Stops rendering (e.g. while the letter covers the sky) to free the GPU. */
  paused?: boolean;
  fallback: ReactNode;
}

export default function SkyCanvas({ mobile, parallax, paused = false, fallback }: Props) {
  return (
    <WebGLBoundary fallback={fallback}>
      <Canvas
        className="!fixed inset-0"
        style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
        frameloop={paused ? "never" : "always"}
        dpr={mobile ? [1, 1.5] : [1, 2]}
        // An opaque canvas that paints its own sky: phones never have to blend it
        // with page layers underneath, which is what made the ending flicker.
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false, depth: false }}
        onCreated={({ gl }) => gl.setClearColor("#080e20", 1)}
        camera={{ fov: FOV, near: 0.1, far: 400, position: [0, 0, 0] }}
        aria-hidden
      >
        <StoryClock />
        <CameraRig parallax={parallax} />
        <SkyGradient />
        <StarField count={mobile ? 2600 : 5200} />
        <MoonScene />
        <Clouds count={mobile ? 6 : 9} />
        <LightRays />
        <ConstellationConnection />
        <FloatingParticles count={mobile ? 90 : 220} />
        <FireflySystem count={mobile ? 34 : 70} />
      </Canvas>
    </WebGLBoundary>
  );
}
