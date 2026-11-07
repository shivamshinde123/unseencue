import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import voiceover from "../voiceover.json";
import { T } from "../theme";
import { Captions } from "./Captions";

export const VO_DELAY_S = 0.5;

/** One scene: its background and visuals, plus its voiceover line and captions. */
export const Scene: React.FC<{ vo: string; background?: string; children: React.ReactNode }> = ({ vo, background = T.void, children }) => {
  const { fps } = useVideoConfig();
  const line = voiceover.find((v) => v.id === vo)!;
  return (
    <AbsoluteFill style={{ background, fontFamily: T.ui, color: T.bone, overflow: "hidden" }}>
      {children}
      <Sequence name={`Voiceover · ${vo}`} from={Math.round(VO_DELAY_S * fps)} layout="none">
        <Audio src={staticFile(`voiceover/${vo}.mp3`)} />
        <Captions words={line.words} text={line.text} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** Seconds after the voiceover start at which a given word is spoken (for syncing visuals). */
export const wordAt = (vo: string, word: string, nth = 0): number => {
  const line = voiceover.find((v) => v.id === vo)!;
  const hits = line.words.filter((w) => w.text.toLowerCase().startsWith(word.toLowerCase()));
  const w = hits[nth] ?? hits[0];
  return VO_DELAY_S + (w ? w.startMs / 1000 : 0);
};
