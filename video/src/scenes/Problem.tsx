import React from "react";
import { enter, lerp, prog, useSeconds } from "../anim";
import { FakeWindow, Monitor } from "../components/Monitor";
import { Scene, wordAt } from "../components/Scene";
import { T } from "../theme";

/** Eyes drift to a notes window, and the notes end up in the recording. */
export const Problem: React.FC = () => {
  const t = useSeconds();
  const drift = prog(t, wordAt("problem", "drift"), 0.9);
  const worse = wordAt("problem", "Worse");
  const recIn = prog(t, worse, 0.6);
  const caught = prog(t, wordAt("problem", "screen"), 0.6);
  const lines = [0.9, 0.75, 0.85, 0.6, 0.8, 0.7, 0.5];

  return (
    <Scene vo="problem">
      {/* the presenter, as seen by their webcam */}
      <div style={{ position: "absolute", left: 130, top: 230, ...enter(t, 0.2) }}>
        <div style={{ position: "relative", width: 320, height: 320, borderRadius: 999, overflow: "hidden", background: "linear-gradient(160deg, #2a2440, #16131f)", boxShadow: `0 0 0 6px #0d0d10, 0 0 0 7px ${T.hairlineStrong}, 0 30px 60px rgba(0,0,0,.5)` }}>
          {/* head */}
          <div style={{ position: "absolute", left: 70, top: 60, width: 180, height: 220, borderRadius: "48% 48% 44% 44%", background: "#3a3350" }} />
          {/* eyes: look at the lens, then drift right toward the notes */}
          {[118, 180].map((x) => (
            <div key={x} style={{ position: "absolute", left: x, top: 150, width: 34, height: 22, borderRadius: 999, background: "#f2f0f7", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 3, left: lerp(10, 18, drift), width: 15, height: 15, borderRadius: 999, background: "#1b1726" }} />
            </div>
          ))}
          <div style={{ position: "absolute", left: 140, top: 228, width: 40, height: 6, borderRadius: 6, background: "#5a5070" }} />
        </div>
        <div style={{ marginTop: 22, textAlign: "center", font: `500 28px ${T.ui}`, color: T.smoke }}>Your webcam view</div>
        <div
          style={{
            marginTop: 14,
            marginLeft: 40,
            padding: "10px 18px",
            borderRadius: 999,
            width: "fit-content",
            background: "rgba(255,77,109,.14)",
            boxShadow: "inset 0 0 0 1px rgba(255,120,140,.45)",
            font: `600 28px ${T.ui}`,
            color: "#ffc2cc",
            opacity: drift,
            translate: `0 ${(1 - drift) * 12}px`,
          }}
        >
          Eyes off the lens
        </div>
      </div>

      {/* the screen being recorded */}
      <div style={{ position: "absolute", left: 600, top: 110, ...enter(t, 0.1, 0.9, 40) }}>
        <Monitor
          width={1180}
          desktop={
            <>
              <FakeWindow style={{ left: "4%", top: "12%", width: "52%", height: "76%" }} title="My workflow demo" />
              <FakeWindow
                title="script.txt"
                style={{
                  left: "60%",
                  top: "24%",
                  width: "36%",
                  height: "58%",
                  background: "rgba(22,22,22,.92)",
                  boxShadow: `inset 0 0 0 ${lerp(1, 3, caught)}px ${caught > 0.01 ? `rgba(255,77,109,${0.4 + 0.6 * caught})` : "rgba(255,255,255,.12)"}`,
                  scale: String(lerp(1, 1.03, drift)),
                }}
              >
                <div style={{ padding: "10px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {lines.map((w, i) => (
                    <div key={i} style={{ height: 12, width: `${w * 100}%`, borderRadius: 6, background: i === 0 ? "rgba(255,255,255,.45)" : "rgba(255,255,255,.18)" }} />
                  ))}
                </div>
              </FakeWindow>
            </>
          }
        >
          {/* recording overlay */}
          <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 ${lerp(0, 6, recIn)}px rgba(255,59,78,.85)`, borderRadius: "26px 26px 10px 10px", zIndex: 4 }} />
          <div style={{ position: "absolute", left: 28, top: 26, display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 999, background: "rgba(10,10,10,.75)", font: `600 24px ${T.ui}`, color: "#fff", opacity: recIn, zIndex: 4 }}>
            <span style={{ width: 14, height: 14, borderRadius: 99, background: "#ff3b4e", boxShadow: `0 0 ${10 + 6 * Math.sin(t * 6)}px rgba(255,59,78,.9)` }} />
            Screen recording
          </div>
          <div
            style={{
              position: "absolute",
              right: "3%",
              top: "84%",
              padding: "10px 18px",
              borderRadius: 999,
              background: "#ff3b4e",
              color: "#fff",
              font: `600 26px ${T.ui}`,
              opacity: caught,
              translate: `0 ${(1 - caught) * 14}px`,
              zIndex: 4,
            }}
          >
            Your notes, in the video
          </div>
        </Monitor>
      </div>
    </Scene>
  );
};
