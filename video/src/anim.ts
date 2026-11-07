import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Current time in seconds within the scene. */
export const useSeconds = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** 0→1 progress between two times (seconds), eased. */
export const prog = (t: number, start: number, dur = 0.7, easing = EASE) => interpolate(t, [start, start + dur], [0, 1], { ...clamp, easing });

/** Fade + rise in at `start`. */
export const enter = (t: number, start: number, dur = 0.8, rise = 24) => {
  const p = prog(t, start, dur);
  return { opacity: p, translate: `0 ${(1 - p) * rise}px` } as const;
};

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Deterministic pseudo-random in [0,1). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
