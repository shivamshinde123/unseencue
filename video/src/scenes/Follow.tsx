import React from "react";
import { useVideoConfig } from "remotion";
import { enter, lerp, prog, rand, useSeconds } from "../anim";
import { Icon } from "../components/Icons";
import { Prompter } from "../components/Prompter";
import { Scene, VO_DELAY_S, wordAt } from "../components/Scene";
import voiceover from "../voiceover.json";
import { T } from "../theme";

const line = voiceover.find((v) => v.id === "follow")!;

/** Is the narrator speaking at time t (scene seconds)? Small gaps count as speech, like the real app. */
const speaking = (t: number) => {
  const ms = (t - VO_DELAY_S) * 1000;
  return line.words.some((w) => ms >= w.startMs - 40 && ms <= w.endMs + 250);
};

/** Voice follow and head follow, driven by the actual narration. */
export const Follow: React.FC = () => {
  const t = useSeconds();
  const { fps } = useVideoConfig();
  const headWord = wordAt("follow", "Head");
  const awayStart = wordAt("follow", "look") - 0.2;
  const awayEnd = awayStart + 2.2;
  const lookingAway = t >= awayStart && t < awayEnd;
  const turn = prog(t, awayStart, 0.5) * (1 - prog(t, awayEnd, 0.5));

  // integrate scroll: moves only while talking and looking at the screen
  let scroll = 0;
  for (let f = 0; f < Math.round(t * fps); f++) {
    const s = f / fps;
    const voiceGate = s < headWord ? speaking(s) : true;
    const headGate = !(s >= awayStart && s < awayEnd);
    if (s > 0.6 && voiceGate && headGate) scroll += 34 / fps;
  }

  const talking = speaking(t);
  const inVoicePart = t < headWord;
  const status = lookingAway ? "Look at the screen to continue" : inVoicePart && !talking && t > 0.8 ? "Listening — start talking" : null;
  const levels = Array.from({ length: 28 }, (_, i) => (talking ? 0.35 + 0.65 * rand(i * 7 + Math.floor(t * 12)) : 0.05 + 0.08 * rand(i + Math.floor(t * 8))));
  const voiceCard = enter(t, 0.3);
  const headCard = enter(t, headWord - 0.4);

  return (
    <Scene vo="follow">
      <div style={{ position: "absolute", left: 110, top: 200, ...enter(t, 0.1, 0.9, 30) }}>
        <Prompter width={1000} height={470} size={34} scroll={scroll + 40} status={status} micOn hearing={talking && inVoicePart} headOn={t >= headWord} playing />
      </div>

      {/* voice follow card */}
      <div style={{ position: "absolute", left: 1170, top: 200, width: 640, padding: "28px 30px", borderRadius: 24, background: T.frost, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.05)", ...voiceCard, opacity: voiceCard.opacity * (inVoicePart ? 1 : 0.45) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, font: `500 36px ${T.head}`, color: "#fff" }}>
          <Icon name="mic" size={34} /> Voice follow
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 7, height: 110, marginTop: 22 }}>
          {levels.map((l, i) => (
            <div key={i} style={{ flex: 1, height: `${l * 100}%`, borderRadius: 4, background: talking ? "#fff" : T.slate }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: "30%", height: 2, background: `rgb(${T.violet})`, boxShadow: `0 0 10px rgba(${T.violet}, .9)` }} />
        </div>
        <div style={{ marginTop: 16, font: `500 28px ${T.ui}`, color: talking ? "#fff" : T.smoke }}>{talking ? "Hearing you: scrolling" : "Quiet: paused"}</div>
      </div>

      {/* head follow card */}
      <div style={{ position: "absolute", left: 1170, top: 500, width: 640, padding: "26px 30px", borderRadius: 24, background: T.frost, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.05)", display: "flex", alignItems: "center", gap: 30, ...headCard }}>
        {/* a head that turns away */}
        <div style={{ position: "relative", width: 150, height: 150, borderRadius: 999, background: "linear-gradient(160deg, #2a2440, #16131f)", boxShadow: `inset 0 0 0 1px ${T.hairline}`, overflow: "hidden", flex: "none" }}>
          <div style={{ position: "absolute", left: 35 + 22 * turn, top: 26, width: 80, height: 100, borderRadius: "48% 48% 44% 44%", background: "#3a3350", scale: `${lerp(1, 0.82, turn)} 1` }} />
          {[55, 85].map((x) => (
            <div key={x} style={{ position: "absolute", left: x + 34 * turn, top: 66, width: 14, height: 9, borderRadius: 9, background: "#f2f0f7", opacity: 1 - turn * 0.7 }} />
          ))}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, font: `500 36px ${T.head}`, color: "#fff" }}>
            <Icon name="face" size={34} /> Head follow
          </div>
          <div style={{ marginTop: 10, font: `500 28px ${T.ui}`, color: lookingAway ? "#ffc2cc" : T.smoke }}>{lookingAway ? "Looked away: waiting" : "Looking at the screen"}</div>
        </div>
      </div>
    </Scene>
  );
};
