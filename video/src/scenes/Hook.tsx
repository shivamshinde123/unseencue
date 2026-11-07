import React from "react";
import { enter, lerp, prog, useSeconds } from "../anim";
import { Scene, wordAt } from "../components/Scene";
import { T } from "../theme";

/** "You know exactly what you want to say… until the camera turns on." */
export const Hook: React.FC = () => {
  const t = useSeconds();
  const on = wordAt("hook", "camera"); // REC turns on here
  const rec = t >= on;
  const scatter = prog(t, on + 0.3, 1.6);
  const zoom = lerp(1.08, 1, prog(t, 0, 2.5));
  const secs = Math.max(0, Math.floor((t - on) * 1)) + 0;
  const items = ["Intro", "My agent workflow", "Planning with docs", "Agent skills", "Wrap up"];

  return (
    <Scene vo="hook" background={`radial-gradient(50% 50% at 50% 45%, rgba(${T.violet}, .14), transparent 70%), ${T.void}`}>
      {/* viewfinder */}
      <div style={{ position: "absolute", left: 300, top: 120, width: 1320, height: 700, scale: String(zoom) }}>
        {[
          { left: 0, top: 0, borderLeft: 1, borderTop: 1 },
          { right: 0, top: 0, borderRight: 1, borderTop: 1 },
          { left: 0, bottom: 0, borderLeft: 1, borderBottom: 1 },
          { right: 0, bottom: 0, borderRight: 1, borderBottom: 1 },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 70,
              height: 70,
              left: c.left,
              right: c.right,
              top: c.top,
              bottom: c.bottom,
              borderLeft: c.borderLeft ? `3px solid rgba(255,255,255,${rec ? 0.9 : 0.4})` : undefined,
              borderRight: c.borderRight ? `3px solid rgba(255,255,255,${rec ? 0.9 : 0.4})` : undefined,
              borderTop: c.borderTop ? `3px solid rgba(255,255,255,${rec ? 0.9 : 0.4})` : undefined,
              borderBottom: c.borderBottom ? `3px solid rgba(255,255,255,${rec ? 0.9 : 0.4})` : undefined,
              borderRadius: 6,
            }}
          />
        ))}
        {/* REC */}
        <div style={{ position: "absolute", left: 50, top: 44, display: "flex", alignItems: "center", gap: 14, font: `600 34px ${T.ui}`, letterSpacing: ".08em", color: rec ? "#fff" : T.slate }}>
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 99,
              background: rec ? "#ff3b4e" : "#3a3a3a",
              boxShadow: rec ? `0 0 ${18 + 10 * Math.sin(t * 6)}px rgba(255,59,78,.8)` : "none",
            }}
          />
          REC
        </div>
        <div style={{ position: "absolute", right: 50, top: 44, font: `500 32px ${T.ui}`, color: rec ? T.bone : T.slate, fontVariantNumeric: "tabular-nums" }}>
          00:00:{String(secs).padStart(2, "0")}
        </div>

        {/* the plan in your head… that falls apart once recording starts */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 160, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ ...enter(t, 0.3), font: `500 30px ${T.ui}`, letterSpacing: ".14em", textTransform: "uppercase", color: T.smoke, marginBottom: 10 }}>What I'll say</div>
          {items.map((it, i) => {
            // the plan comes apart: each line drifts its own way, evenly spread so it reads as "lost", not as a pile-up
            const SPREAD = [
              [-430, -40, -9],
              [380, -150, 7],
              [-300, 150, 6],
              [420, 120, -8],
              [-40, 230, 4],
            ];
            const dx = SPREAD[i][0] * scatter;
            const dy = SPREAD[i][1] * scatter;
            const rot = SPREAD[i][2] * scatter;
            return (
              <div
                key={it}
                style={{
                  ...enter(t, 0.5 + i * 0.12),
                  font: `500 54px ${T.head}`,
                  letterSpacing: "-0.02em",
                  color: "#fff",
                  translate: `${dx}px ${dy + (1 - prog(t, 0.5 + i * 0.12)) * 24}px`,
                  rotate: `${rot}deg`,
                  opacity: prog(t, 0.5 + i * 0.12) * (1 - scatter * 0.75),
                  filter: `blur(${scatter * 6}px)`,
                }}
              >
                {i + 1}. {it}
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
};
