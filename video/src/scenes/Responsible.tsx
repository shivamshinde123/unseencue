import React from "react";
import { enter, prog, useSeconds } from "../anim";
import { Icon } from "../components/Icons";
import { Scene, wordAt } from "../components/Scene";
import { T } from "../theme";

const FOR = [
  { label: "YouTube videos", word: "videos" },
  { label: "Demos & walkthroughs", word: "demos" },
  { label: "Presentations", word: "presentations" },
];
const NOT = [
  { label: "Job interviews", word: "interviews" },
  { label: "Coding assessments", word: "interviews" },
  { label: "Exams", word: "exams" },
];

/** Made for creating, not for cheating. */
export const Responsible: React.FC = () => {
  const t = useSeconds();
  const card = (good: boolean): React.CSSProperties => ({
    width: 700,
    padding: "34px 40px",
    borderRadius: 28,
    background: good ? T.frost : "rgba(255,77,109,.08)",
    boxShadow: good ? "inset 0 0 0 1px rgba(255,255,255,.06)" : "inset 0 0 0 1px rgba(255,120,140,.35)",
  });
  return (
    <Scene vo="responsible">
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", ...enter(t, 0.2, 0.9) }}>
        <div style={{ font: `500 30px ${T.ui}`, letterSpacing: ".16em", textTransform: "uppercase", color: T.smoke }}>Responsible use</div>
        <div style={{ marginTop: 18, font: `500 96px ${T.head}`, letterSpacing: "-0.035em", color: "#fff" }}>Made for creating, not for cheating.</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 400, display: "flex", justifyContent: "center", gap: 40 }}>
        <div style={{ ...card(true), ...enter(t, wordAt("responsible", "creating") - 0.3) }}>
          <div style={{ font: `500 36px ${T.head}`, color: "#fff", marginBottom: 20 }}>Made for</div>
          {FOR.map((f) => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 16, font: `500 34px ${T.ui}`, color: T.bone, marginBottom: 14, ...enter(t, wordAt("responsible", f.word) - 0.1, 0.5, 14) }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(144,190,109,.18)", color: T.mint }}>
                <Icon name="check" size={28} stroke={2.4} />
              </span>
              {f.label}
            </div>
          ))}
        </div>
        <div style={{ ...card(false), ...enter(t, wordAt("responsible", "Not") - 0.3) }}>
          <div style={{ font: `500 36px ${T.head}`, color: "#fff", marginBottom: 20 }}>Not for</div>
          {NOT.map((f, i) => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 16, font: `500 34px ${T.ui}`, color: T.bone, marginBottom: 14, ...enter(t, wordAt("responsible", f.word) - 0.1 + i * 0.12, 0.5, 14) }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(255,77,109,.18)", color: "#ff8fa3" }}>
                <Icon name="x" size={26} stroke={2.4} />
              </span>
              {f.label}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", font: `400 28px ${T.ui}`, color: T.slate, opacity: prog(t, 6.2, 0.8) }}>
        If notes aren't allowed, don't use it.
      </div>
    </Scene>
  );
};
