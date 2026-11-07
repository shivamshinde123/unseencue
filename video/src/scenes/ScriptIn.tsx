import React from "react";
import { enter, lerp, prog, useSeconds } from "../anim";
import { Icon } from "../components/Icons";
import { Prompter } from "../components/Prompter";
import { Scene, wordAt } from "../components/Scene";
import { T } from "../theme";

const SOURCE = [
  { text: "# My AI Agent Workflow", color: "#fff" },
  { text: "Hi! In this video I'll walk you through", color: T.ash },
  { text: "how I build software with **AI agents**,", color: T.ash },
  { text: "how I use {gold}agent skills{/}...", color: T.ash },
  { text: "", color: T.ash },
  { text: "## 1 · Plan Before Any Code", color: "#fff" },
  { text: "> SHOW: the docs folder", color: T.ash },
];

/** Paste, type or upload → formatted script. */
export const ScriptIn: React.FC = () => {
  const t = useSeconds();
  const ways = [
    { label: "Paste", icon: "paste", at: wordAt("script", "Paste") },
    { label: "Type", icon: "edit", at: wordAt("script", "type") },
    { label: "Upload a file", icon: "upload", at: wordAt("script", "drop") },
  ];
  const typeStart = wordAt("script", "type") - 0.1;
  const total = SOURCE.reduce((n, l) => n + l.text.length + 1, 0);
  const typed = Math.floor(total * prog(t, typeStart, 2.6, (x) => x));
  const formatted = prog(t, wordAt("script", "Headings") - 0.3, 0.9);
  const tH = wordAt("script", "Headings"), tC = wordAt("script", "colours"), tQ = wordAt("script", "cue");
  const highlight = t >= tQ - 0.1 && t < tQ + 1.6 ? "cue" : t >= tC - 0.1 && t < tQ - 0.1 ? "colour" : t >= tH - 0.1 && t < tC - 0.1 ? "h1" : null;
  // scroll the preview down to the cue box when it's mentioned
  const previewScroll = lerp(-10, 330, prog(t, tQ - 0.6, 0.8));

  let left = typed;
  return (
    <Scene vo="script">
      {/* three ways in */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 96, display: "flex", justifyContent: "center", gap: 18 }}>
        {ways.map((w) => {
          const p = prog(t, w.at - 0.05, 0.5);
          return (
            <div
              key={w.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 64,
                padding: "0 28px",
                borderRadius: 999,
                background: p > 0.5 ? "#fff" : "rgba(22,22,22,.85)",
                color: p > 0.5 ? T.graphite : T.bone,
                boxShadow: `inset 0 0 0 1px ${T.hairlineStrong}`,
                font: `500 30px ${T.ui}`,
                opacity: lerp(0.35, 1, p),
                scale: String(lerp(0.94, 1, p)),
              }}
            >
              <Icon name={w.icon} size={28} /> {w.label}
            </div>
          );
        })}
      </div>

      {/* the editor with Markdown being typed */}
      <div style={{ position: "absolute", left: 110, top: 220, width: 780, height: 560, borderRadius: 26, overflow: "hidden", background: "#0e0e10", boxShadow: `inset 0 0 0 1px ${T.hairline}, 0 40px 100px rgba(0,0,0,.5)`, ...enter(t, 0.2, 0.9, 30) }}>
        <div style={{ padding: "26px 34px", font: `400 30px/1.65 ${T.ui}` }}>
          {SOURCE.map((l, i) => {
            const shown = l.text.slice(0, Math.max(0, left));
            left -= l.text.length + 1;
            return (
              <div key={i} style={{ minHeight: 50, color: l.color, whiteSpace: "pre" }}>
                {shown}
                {left < 0 && left > -(l.text.length + 2) && typed < total && (
                  <span style={{ display: "inline-block", width: 3, height: 34, background: "#fff", verticalAlign: "middle", opacity: Math.sin(t * 10) > 0 ? 1 : 0 }} />
                )}
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 24px", borderTop: `1px solid ${T.hairline}`, display: "flex", gap: 12, justifyContent: "flex-end" }}>
          {["Formatting help", "Paste", "Upload file"].map((b) => (
            <div key={b} style={{ padding: "10px 20px", borderRadius: 999, boxShadow: `inset 0 0 0 1px ${T.hairline}`, font: `500 22px ${T.ui}`, color: T.bone, whiteSpace: "nowrap" }}>
              {b}
            </div>
          ))}
          <div style={{ padding: "10px 22px", borderRadius: 999, background: "#fff", color: T.graphite, font: `500 22px ${T.ui}` }}>Done</div>
        </div>
      </div>

      {/* arrow */}
      <div style={{ position: "absolute", left: 912, top: 470, opacity: formatted, translate: `${(1 - formatted) * -20}px 0` }}>
        <svg width="96" height="40" viewBox="0 0 96 40" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h84M70 6l18 14-18 14" />
        </svg>
      </div>

      {/* formatted result */}
      <div style={{ position: "absolute", left: 1030, top: 260, opacity: formatted, scale: String(lerp(0.94, 1, formatted)) }}>
        <div style={{ position: "relative" }}>
          <Prompter width={780} height={480} size={26} scroll={previewScroll} showBar={false} markerPos={0.15} highlight={highlight} />
        </div>
      </div>
    </Scene>
  );
};
