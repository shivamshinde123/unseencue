import React from "react";
import { enter, lerp, prog, useSeconds } from "../anim";
import { FakeWindow } from "../components/Monitor";
import { Prompter } from "../components/Prompter";
import { Scene, wordAt } from "../components/Scene";
import { T } from "../theme";

const Desktop: React.FC<{ children?: React.ReactNode; glow: number; badge?: React.ReactNode }> = ({ children, glow, badge }) => (
  <div
    style={{
      position: "relative",
      width: 780,
      height: 470,
      borderRadius: 26,
      overflow: "hidden",
      background: [
        "radial-gradient(60% 80% at 15% 100%, rgba(255,150,90,.42), transparent 60%)",
        "radial-gradient(70% 90% at 90% 100%, rgba(60,90,220,.5), transparent 65%)",
        "linear-gradient(160deg, #1d1a2a, #2a2140)",
      ].join(", "),
      boxShadow: `inset 0 0 0 1px ${T.hairline}, 0 0 0 ${lerp(0, 3, glow)}px rgba(255,255,255,${0.6 * glow}), 0 30px 80px rgba(0,0,0,.5)`,
    }}
  >
    <FakeWindow style={{ left: "6%", top: "38%", width: "48%", height: "52%" }} />
    <FakeWindow style={{ left: "42%", top: "52%", width: "52%", height: "42%" }} />
    <div style={{ position: "absolute", top: 4, left: "50%", translate: "-50% 0", width: 12, height: 12, borderRadius: 99, background: "#050505", boxShadow: "0 0 0 3px #222" }} />
    {children}
    {badge}
  </div>
);

const APPS = [
  { name: "OBS Studio", word: "OBS" },
  { name: "Loom", word: "Loom" },
  { name: "Zoom", word: "Zoom" },
  { name: "Google Meet", word: "Meet", nth: 0 },
  { name: "Microsoft Teams", word: "Teams" },
];

/** What you see vs. what the recording sees. */
export const Hidden: React.FC = () => {
  const t = useSeconds();
  const scan = prog(t, wordAt("hidden", "through") - 0.3, 1.2, (x) => x);
  const youSee = prog(t, wordAt("hidden", "You", 0), 0.5) * (1 - prog(t, wordAt("hidden", "Your"), 0.4));
  const theyDont = prog(t, wordAt("hidden", "Your"), 0.5);

  return (
    <Scene vo="hidden">
      <div style={{ position: "absolute", left: 0, right: 0, top: 90, display: "flex", justifyContent: "center", gap: 80 }}>
        {/* what you see */}
        <div style={{ ...enter(t, 0.2, 0.9, 30) }}>
          <Desktop glow={youSee}>
            <div style={{ position: "absolute", left: "50%", top: 16, translate: "-50% 0" }}>
              <Prompter width={440} height={170} size={16} showBar={false} />
            </div>
          </Desktop>
          <div style={{ marginTop: 26, textAlign: "center", font: `500 40px ${T.head}`, color: "#fff" }}>What you see</div>
          <div style={{ marginTop: 6, textAlign: "center", font: `400 28px ${T.ui}`, color: T.smoke }}>Your script, right under the lens</div>
        </div>

        {/* what the recording / screen share sees */}
        <div style={{ ...enter(t, 0.45, 0.9, 30) }}>
          <Desktop
            glow={theyDont}
            badge={
              <div style={{ position: "absolute", left: 18, bottom: 18, display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 999, background: "rgba(10,10,10,.75)", font: `600 22px ${T.ui}`, color: "#fff" }}>
                <span style={{ width: 12, height: 12, borderRadius: 99, background: "#ff3b4e", boxShadow: `0 0 ${8 + 5 * Math.sin(t * 6)}px rgba(255,59,78,.9)` }} />
                Recording · Screen share
              </div>
            }
          >
            {/* nothing there: just a faint outline of where it would be */}
            <div style={{ position: "absolute", left: "50%", top: 16, translate: "-50% 0", width: 440, height: 170, borderRadius: 14, border: "2px dashed rgba(255,255,255,.16)" }} />
            {/* capture scan line */}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: `${lerp(-10, 110, scan)}%`, width: 120, translate: "-50% 0", background: `linear-gradient(90deg, transparent, rgba(${T.violet}, .35), transparent)`, opacity: scan > 0 && scan < 1 ? 1 : 0 }} />
          </Desktop>
          <div style={{ marginTop: 26, textAlign: "center", font: `500 40px ${T.head}`, color: "#fff" }}>What they see</div>
          <div style={{ marginTop: 6, textAlign: "center", font: `400 28px ${T.ui}`, color: T.smoke }}>Just your desktop</div>
        </div>
      </div>

      {/* recorders and screen shares it stays out of, timed to the voice */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center", gap: 16 }}>
        {APPS.map((a) => {
          const p = prog(t, wordAt("hidden", a.word, a.nth ?? 0) - 0.05, 0.5);
          return (
            <div
              key={a.name}
              style={{
                padding: "12px 26px",
                borderRadius: 999,
                boxShadow: `inset 0 0 0 1px ${T.hairlineStrong}`,
                background: "rgba(22,22,22,.7)",
                font: `500 30px ${T.ui}`,
                color: T.bone,
                opacity: p,
                translate: `0 ${(1 - p) * 16}px`,
                scale: String(lerp(0.85, 1, p)),
              }}
            >
              {a.name}
            </div>
          );
        })}
      </div>
    </Scene>
  );
};
