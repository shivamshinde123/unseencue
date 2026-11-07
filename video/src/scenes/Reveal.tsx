import React from "react";
import { lerp, prog, useSeconds } from "../anim";
import { Img, staticFile } from "remotion";
import { Monitor } from "../components/Monitor";
import { Prompter } from "../components/Prompter";
import { Scene, wordAt } from "../components/Scene";
import { HORIZON, T } from "../theme";

/** "Meet Unseencue" — the product appears under the webcam. */
export const Reveal: React.FC = () => {
  const t = useSeconds();
  const name = wordAt("reveal", "Unseencue");
  const tele = wordAt("reveal", "teleprompter");
  const lens = wordAt("reveal", "lens");
  const bg = prog(t, 0, 1.4);
  const mark = prog(t, name - 0.15, 1.0);
  const up = prog(t, tele - 0.2, 1.2);
  const slide = prog(t, tele + 0.5, 1.0);
  const glow = 0.6 + 0.6 * prog(t, lens - 0.3, 0.5) * (0.6 + 0.4 * Math.sin(t * 5));

  return (
    <Scene vo="reveal">
      <div style={{ position: "absolute", inset: 0, background: HORIZON, opacity: bg }} />

      {/* wordmark: big and centred, then moves up to make room for the product */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: lerp(390, 46, up),
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: lerp(30, 16, up),
          opacity: mark,
          scale: String(lerp(0.92, 1, mark) * lerp(1, 0.5, up)),
          filter: `blur(${(1 - mark) * 14}px)`,
        }}
      >
        <Img src={staticFile("icon.png")} style={{ width: 170, height: 170, filter: "drop-shadow(0 18px 40px rgba(0,0,0,.45))" }} />
        <span style={{ font: `600 170px ${T.head}`, letterSpacing: "-0.04em", color: "#fff" }}>Unseencue</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 600, textAlign: "center", font: `500 46px ${T.ui}`, color: T.ash, opacity: mark * (1 - up) }}>
        The teleprompter that lives under your webcam
      </div>

      {/* the product */}
      <div style={{ position: "absolute", left: 960 - 620, top: lerp(1100, 250, up) }}>
        <Monitor width={1240} camGlow={glow}>
          <div style={{ position: "absolute", left: "50%", top: lerp(-300, 22, slide), translate: "-50% 0", opacity: slide }}>
            <Prompter width={640} height={246} size={23} scroll={0} showBar={false} />
          </div>
        </Monitor>
      </div>
    </Scene>
  );
};
