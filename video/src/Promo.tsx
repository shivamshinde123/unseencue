import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React from "react";
import { AbsoluteFill, interpolate, staticFile, useVideoConfig } from "remotion";
import { VO_DELAY_S } from "./components/Scene";
import { Cta } from "./scenes/Cta";
import { Custom } from "./scenes/Custom";
import { Follow } from "./scenes/Follow";
import { Hidden } from "./scenes/Hidden";
import { Hook } from "./scenes/Hook";
import { Origin } from "./scenes/Origin";
import { Problem } from "./scenes/Problem";
import { Responsible } from "./scenes/Responsible";
import { Reveal } from "./scenes/Reveal";
import { ScriptIn } from "./scenes/ScriptIn";
import { T } from "./theme";
import voiceover from "./voiceover.json";

// Scene lengths in seconds, in order. Each scene's voiceover starts VO_DELAY_S in.
export const SCENES = [
  { id: "hook", seconds: 9 },
  { id: "problem", seconds: 13 },
  { id: "origin", seconds: 16 },
  { id: "reveal", seconds: 10 },
  { id: "hidden", seconds: 15 },
  { id: "script", seconds: 12.5 },
  { id: "follow", seconds: 13 },
  { id: "custom", seconds: 12 },
  { id: "responsible", seconds: 10 },
  { id: "cta", seconds: 11 },
] as const;
export const FPS = 30;
export const TRANSITION_FRAMES = 18;
export const TOTAL_FRAMES = SCENES.reduce((n, s) => n + Math.round(s.seconds * FPS), 0) - (SCENES.length - 1) * TRANSITION_FRAMES;

/** Global time ranges (in frames) where the narrator is speaking, used to duck the music. */
const SPEECH: [number, number][] = (() => {
  const out: [number, number][] = [];
  let start = 0;
  for (const s of SCENES) {
    const line = voiceover.find((v) => v.id === s.id)!;
    const a = start + Math.round(VO_DELAY_S * FPS);
    out.push([a, a + Math.round((line.durationMs / 1000) * FPS)]);
    start += Math.round(s.seconds * FPS) - TRANSITION_FRAMES;
  }
  return out;
})();

const musicVolume = (f: number) => {
  // 0 → 1 over the first 2 s, out over the last 3 s
  const edge = interpolate(f, [0, 60, TOTAL_FRAMES - 90, TOTAL_FRAMES], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // duck smoothly under the voice
  let duck = 1;
  for (const [a, b] of SPEECH) {
    const d = interpolate(f, [a - 12, a, b, b + 18], [1, 0.42, 0.42, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    duck = Math.min(duck, d);
  }
  return 0.3 * edge * duck;
};

const SCENE_COMPONENTS: Record<(typeof SCENES)[number]["id"], React.FC> = {
  hook: Hook,
  problem: Problem,
  origin: Origin,
  reveal: Reveal,
  hidden: Hidden,
  script: ScriptIn,
  follow: Follow,
  custom: Custom,
  responsible: Responsible,
  cta: () => <Cta seconds={SCENES[SCENES.length - 1].seconds} />,
};

export const Promo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: T.void }}>
      <TransitionSeries>
        {SCENES.flatMap((s, i) => {
          const Comp = SCENE_COMPONENTS[s.id];
          const seq = (
            <TransitionSeries.Sequence key={s.id} name={s.id} durationInFrames={Math.round(s.seconds * fps)}>
              <Comp />
            </TransitionSeries.Sequence>
          );
          return i === 0
            ? [seq]
            : [<TransitionSeries.Transition key={`t-${s.id}`} presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />, seq];
        })}
      </TransitionSeries>
      <Audio src={staticFile("music/ambient.wav")} volume={musicVolume} name="Music" />
    </AbsoluteFill>
  );
};
