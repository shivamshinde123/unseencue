import React from "react";
import { enter, lerp, prog, useSeconds } from "../anim";
import { Img, staticFile } from "remotion";
import { Icon } from "../components/Icons";
import { Scene, wordAt } from "../components/Scene";
import { HORIZON, T } from "../theme";

/** Name, promise, download. */
export const Cta: React.FC<{ seconds: number }> = ({ seconds }) => {
  const t = useSeconds();
  const end = seconds;
  const mark = prog(t, wordAt("cta", "Unseencue") - 0.2, 1.0);
  const stay = wordAt("cta", "Stay");
  const look = wordAt("cta", "Look");
  const out = prog(t, end - 1.3, 1.2);

  return (
    <Scene vo="cta" background={T.void}>
      <div style={{ position: "absolute", inset: 0, background: HORIZON, opacity: prog(t, 0, 1.2) }} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, opacity: mark, scale: String(lerp(0.94, 1, mark)), filter: `blur(${(1 - mark) * 12}px)` }}>
          <Img src={staticFile("icon.png")} style={{ width: 120, height: 120, filter: "drop-shadow(0 14px 30px rgba(0,0,0,.45))" }} />
          <span style={{ font: `600 110px ${T.head}`, letterSpacing: "-0.04em", color: "#fff" }}>Unseencue</span>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", font: `500 104px/1.05 ${T.ui}`, letterSpacing: "-0.035em", color: "#fff" }}>
          <span style={{ ...enter(t, stay - 0.1, 0.7), display: "inline-block" }}>Stay on script.</span>{" "}
          <span style={{ ...enter(t, look - 0.1, 0.7), display: "inline-block" }}>Look at the lens.</span>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", gap: 18, ...enter(t, wordAt("cta", "Free") - 0.1, 0.8) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, height: 84, padding: "0 40px", borderRadius: 999, background: "#fff", color: T.graphite, font: `500 36px ${T.ui}` }}>
            <Icon name="down" size={34} /> Download for Windows &amp; Mac
          </div>
          <div style={{ display: "flex", alignItems: "center", height: 84, padding: "0 36px", borderRadius: 999, boxShadow: `inset 0 0 0 1.5px ${T.hairlineStrong}`, color: "#fff", font: `500 34px ${T.ui}` }}>Free · Open source (MIT)</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", font: `500 36px ${T.ui}`, color: T.ash, letterSpacing: ".01em", ...enter(t, wordAt("cta", "Mac"), 0.8) }}>
          shivamshinde123.github.io/unseencue
        </div>
      </div>
    </Scene>
  );
};
