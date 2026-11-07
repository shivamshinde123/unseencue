import React from "react";
import { enter, lerp, prog, rand, useSeconds } from "../anim";
import { Icon } from "../components/Icons";
import { Scene, wordAt } from "../components/Scene";
import { T } from "../theme";

const TOPICS = ["Planning with specs", "Agent skills", "Docs as memory", "Code review", "Browser testing", "Verification", "Design system", "Deploying", "Prompting", "Debugging"];

const CODE = [
  ["const ", "win", " = new BrowserWindow({ alwaysOnTop: true });"],
  ["win.", "setContentProtection", "(true);  // hidden from recordings"],
  ["placeUnder", "(webcam);"],
  ["scrollWhile", "(talking);"],
];

/** The job application, too much to cover, so I built a tool. */
export const Origin: React.FC = () => {
  const t = useSeconds();
  const lot = wordAt("origin", "lot");
  const ramble = wordAt("origin", "ramble");
  const built = wordAt("origin", "built");
  const mailOut = prog(t, lot - 0.2, 0.8);
  const gather = prog(t, built - 0.3, 0.9);

  return (
    <Scene vo="origin">
      {/* the application email */}
      <div
        style={{
          position: "absolute",
          left: 460,
          top: 200,
          width: 1000,
          padding: "40px 48px",
          borderRadius: 28,
          background: T.graphite,
          boxShadow: `inset 0 0 0 1px ${T.hairline}, 0 40px 100px rgba(0,0,0,.5)`,
          ...enter(t, 0.3, 0.9, 40),
          opacity: prog(t, 0.3) * (1 - mailOut),
          scale: String(lerp(1, 0.85, mailOut)),
          translate: `0 ${lerp((1 - prog(t, 0.3)) * 40, -80, mailOut)}px`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 26 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,.08)", display: "grid", placeItems: "center", color: "#fff" }}>
            <Icon name="mail" size={34} />
          </div>
          <div>
            <div style={{ font: `600 30px ${T.head}`, color: "#fff" }}>Hiring team</div>
            <div style={{ font: `400 24px ${T.ui}`, color: T.smoke }}>Next step in your application</div>
          </div>
        </div>
        <div style={{ font: `500 48px/1.25 ${T.head}`, letterSpacing: "-0.02em", color: "#fff" }}>
          "Walk us through your <span style={{ color: T.gold }}>AI-agent workflow</span>."
        </div>
        <div style={{ marginTop: 18, font: `400 30px/1.5 ${T.ui}`, color: T.ash }}>How you plan, how you use agent skills, and how you build applications.</div>
      </div>

      {/* everything there is to cover */}
      {TOPICS.map((topic, i) => {
        const appear = prog(t, lot + 0.15 * i, 0.6);
        const angle = (i / TOPICS.length) * Math.PI * 2 + 0.3;
        const rx = 640 + rand(i + 3) * 80;
        const ry = 260 + rand(i + 7) * 50;
        const wobble = t > ramble ? Math.sin(t * 5 + i) * 10 * (1 - gather) : 0;
        const x = 960 + Math.cos(angle) * rx * (1 - gather);
        const y = 450 + Math.sin(angle) * ry * (1 - gather) + wobble;
        return (
          <div
            key={topic}
            style={{
              position: "absolute",
              left: x,
              top: y,
              translate: "-50% -50%",
              padding: "14px 26px",
              borderRadius: 999,
              background: "rgba(22,22,22,.85)",
              boxShadow: `inset 0 0 0 1px ${T.hairlineStrong}`,
              font: `500 32px ${T.ui}`,
              color: T.bone,
              whiteSpace: "nowrap",
              opacity: appear * (1 - gather),
              scale: String(lerp(0.6, 1, appear) * lerp(1, 0.4, gather)),
            }}
          >
            {topic}
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", font: `500 64px ${T.head}`, letterSpacing: "-0.03em", color: "#fff", opacity: prog(t, lot + 0.6, 0.8) * (1 - gather) }}>
        So much to cover.
      </div>

      {/* …so I built a tool */}
      <div
        style={{
          position: "absolute",
          left: 410,
          top: 230,
          width: 1100,
          borderRadius: 24,
          overflow: "hidden",
          background: "#0f0f12",
          boxShadow: `inset 0 0 0 1px ${T.hairline}, 0 40px 100px rgba(0,0,0,.55), 0 0 120px rgba(${T.violet}, .18)`,
          opacity: gather,
          scale: String(lerp(0.9, 1, gather)),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 22px", borderBottom: `1px solid ${T.hairline}` }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c, opacity: 0.8 }} />
          ))}
          <span style={{ marginLeft: 12, font: `500 24px ${T.ui}`, color: T.smoke }}>main.js</span>
        </div>
        <div style={{ padding: "26px 34px", font: `500 30px/1.7 Consolas, "Cascadia Code", monospace` }}>
          {CODE.map((line, i) => {
            const start = built + 0.4 + i * 0.55;
            const full = line.join("");
            const n = Math.floor(full.length * prog(t, start, 0.5, (x) => x));
            let left = n;
            return (
              <div key={i} style={{ minHeight: 51, whiteSpace: "pre" }}>
                <span style={{ color: T.slate, marginRight: 26 }}>{i + 1}</span>
                {line.map((part, j) => {
                  const shown = part.slice(0, Math.max(0, left));
                  left -= part.length;
                  const color = j === 1 ? T.sky : part.includes("//") ? T.slate : T.bone;
                  return (
                    <span key={j} style={{ color }}>
                      {part.includes("//") ? (
                        <>
                          <span style={{ color: T.bone }}>{shown.split("//")[0]}</span>
                          {shown.includes("//") && <span style={{ color: T.mint }}>{"//" + shown.split("//")[1]}</span>}
                        </>
                      ) : (
                        shown
                      )}
                    </span>
                  );
                })}
                {n > 0 && n < full.length && <span style={{ display: "inline-block", width: 3, height: 34, background: "#fff", verticalAlign: "middle", opacity: Math.sin(t * 10) > 0 ? 1 : 0 }} />}
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
};
