import React from "react";
import { T } from "../theme";

/** A monitor with a webcam at the top-centre and a dusk desktop with two faint app windows. */
export const Monitor: React.FC<{ width: number; children?: React.ReactNode; camGlow?: number; style?: React.CSSProperties; desktop?: React.ReactNode }> = ({
  width,
  children,
  camGlow = 1,
  style,
  desktop,
}) => {
  const height = (width * 9) / 16;
  return (
    <div style={{ width, ...style }}>
      <div
        style={{
          position: "relative",
          width,
          height,
          borderRadius: "26px 26px 10px 10px",
          overflow: "hidden",
          background: [
            "radial-gradient(60% 80% at 15% 100%, rgba(255,150,90,.45), transparent 60%)",
            "radial-gradient(70% 90% at 90% 100%, rgba(60,90,220,.55), transparent 65%)",
            "linear-gradient(180deg, #14121c 0%, #1d1a2a 55%, #2a2140 100%)",
          ].join(", "),
          boxShadow: `0 0 0 12px #0d0d10, 0 0 0 13px ${T.hairline}, 0 50px 120px rgba(0,0,0,.6)`,
        }}
      >
        {desktop ?? (
          <>
            <FakeWindow style={{ left: "5%", top: "34%", width: "42%", height: "56%" }} />
            <FakeWindow style={{ left: "44%", top: "46%", width: "50%", height: "48%" }} />
          </>
        )}
        {children}
        {/* webcam */}
        <div style={{ position: "absolute", top: -2, left: "50%", translate: "-50% 0", width: 16, height: 16, borderRadius: 999, background: "#050505", boxShadow: "0 0 0 4px #222, inset 0 0 0 4px #1b2a4a", zIndex: 5 }}>
          <div style={{ position: "absolute", inset: -40, borderRadius: 999, background: `radial-gradient(rgba(${T.violet}, ${0.45 * camGlow}), transparent 65%)` }} />
        </div>
      </div>
      <div style={{ width: width * 0.2, height: 40, margin: "0 auto", background: "linear-gradient(#141418, #0c0c0f)", borderRadius: "0 0 10px 10px", boxShadow: `inset 0 1px 0 ${T.hairline}` }} />
    </div>
  );
};

export const FakeWindow: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode; title?: string }> = ({ style, children, title }) => (
  <div style={{ position: "absolute", borderRadius: 14, background: "rgba(255,255,255,.06)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)", overflow: "hidden", ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 9, height: 9, borderRadius: 9, background: "rgba(255,255,255,.18)" }} />
      ))}
      {title ? <span style={{ marginLeft: 8, font: `500 15px ${T.ui}`, color: T.smoke }}>{title}</span> : <span style={{ marginLeft: 10, width: "40%", height: 8, borderRadius: 4, background: "rgba(255,255,255,.12)" }} />}
    </div>
    {children}
  </div>
);
