import React from "react";
import { T, WASH } from "../theme";
import { Icon } from "./Icons";

export type Marker = "arrows" | "glow" | "band" | "line";

type Props = {
  width: number;
  height: number;
  /** Scroll offset of the script in px. */
  scroll?: number;
  size?: number;
  font?: string;
  textColor?: string;
  marker?: Marker;
  markerColor?: string;
  markerPos?: number; // 0..1 from top
  showBar?: boolean;
  highlight?: Highlight;
  status?: string | null;
  micOn?: boolean;
  hearing?: boolean;
  headOn?: boolean;
  playing?: boolean;
  style?: React.CSSProperties;
};

/** The formatted AI-agent workflow script, same content as the app's sample script. */
export type Highlight = "h1" | "colour" | "cue" | null;
const GLOW = "0 0 0 3px #fff, 0 0 28px rgba(107,98,242,.9)";

export const ScriptContent: React.FC<{ size: number; font: string; textColor: string; highlight?: Highlight }> = ({ size, font, textColor, highlight = null }) => {
  const C = (color: string, children: React.ReactNode) => (
    <span style={{ color, padding: "0 .1em", borderRadius: 4, boxShadow: highlight === "colour" ? GLOW : "none" }}>{children}</span>
  );
  const Hi = (bg: string, children: React.ReactNode, color = "#fff") => (
    <span style={{ background: bg, color, padding: "0 .14em", borderRadius: 4, boxShadow: highlight === "colour" ? GLOW : "none" }}>{children}</span>
  );
  const h = (lvl: 1 | 2 | 3, children: React.ReactNode) => {
    if (lvl === 1)
      return (
        <div style={{ fontFamily: font === T.ui ? T.head : font, fontWeight: 600, fontSize: size * 1.3, letterSpacing: "-0.03em", color: "#fff", background: "rgba(212,212,212,.12)", padding: ".16em .5em", borderRadius: 10, width: "fit-content", margin: "0 0 .45em", boxShadow: highlight === "h1" ? GLOW : "none" }}>
          {children}
        </div>
      );
    if (lvl === 2)
      return (
        <div style={{ fontFamily: font === T.ui ? T.head : font, fontWeight: 500, fontSize: size * 1.1, letterSpacing: "-0.02em", color: "#fff", padding: ".05em .1em .22em", width: "fit-content", margin: ".55em 0 .4em", background: `${WASH} bottom / 100% 2px no-repeat` }}>
          {children}
        </div>
      );
    return <div style={{ fontFamily: font === T.ui ? T.head : font, fontWeight: 500, fontSize: size * 0.7, letterSpacing: ".1em", textTransform: "uppercase", color: T.ash, margin: ".5em 0 .35em" }}>{children}</div>;
  };
  const p = (children: React.ReactNode) => <div style={{ margin: "0 0 .55em" }}>{children}</div>;
  const li = (children: React.ReactNode) => (
    <div style={{ display: "flex", gap: ".5em", margin: "0 0 .2em" }}>
      <span style={{ color: T.slate }}>•</span>
      <span>{children}</span>
    </div>
  );
  const cue = (label: React.ReactNode, children: React.ReactNode) => (
    <div style={{ fontSize: size * 0.72, color: T.ash, background: T.frost, borderRadius: 10, boxShadow: highlight === "cue" ? GLOW : `inset 0 0 0 1px ${T.hairline}`, padding: ".35em .7em", width: "fit-content", margin: ".2em 0 .7em" }}>
      {label} {children}
    </div>
  );
  return (
    <div style={{ fontFamily: font, fontSize: size, lineHeight: 1.45, color: textColor }}>
      {h(1, "My AI Agent Workflow")}
      {p(
        <>
          Hi! In this video I'll walk you through how I build software with <b style={{ color: "#fff" }}>AI agents</b>: how I plan, how I use {C(T.gold, "agent skills")}, and how I keep the agent {Hi(`rgb(${T.violet})`, "honest and on track")}.
        </>,
      )}
      {h(2, "1 · Plan Before Any Code")}
      {p(<>Every project starts with a short spec, not a prompt. I write down the <i>goal</i>, the <i>users</i>, and what "done" looks like.</>)}
      {li(<>{C(T.sky, "Requirements first")}: the agent asks questions before building.</>)}
      {li(<>{C(T.mint, "Docs as memory")}: decisions live in a docs folder.</>)}
      {li(<><b style={{ color: "#fff" }}>One task at a time</b>, each with a clear finish line.</>)}
      {cue(Hi(T.gold, "SHOW:", "#000"), "The docs folder and the decision log.")}
      {h(2, "2 · Agent Skills Do the Heavy Lifting")}
      {p(<>A <b style={{ color: "#fff" }}>skill</b> is a packaged playbook the agent loads when a task matches: design rules, a review checklist, a deploy routine.</>)}
      {h(3, "The skills I use most")}
      {li(<><b style={{ color: "#fff" }}>Design system</b> keeps every screen consistent.</>)}
      {li(<><b style={{ color: "#fff" }}>Code review</b> catches bugs before I do.</>)}
      {li(<><b style={{ color: "#fff" }}>Browser testing</b> clicks through the app like a real user.</>)}
      {cue(Hi(T.rose, "SAY:"), "Skills turn \"be careful\" into a repeatable process.")}
      {h(2, "3 · Verify, Don't Trust")}
      {p(<>I never accept "it works" without proof. The agent runs the tests, takes screenshots, and shows me what it checked.</>)}
    </div>
  );
};

const BarButton: React.FC<{ children: React.ReactNode; on?: boolean; primary?: boolean; wide?: boolean; s: number }> = ({ children, on, primary, wide, s }) => (
  <div
    style={{
      height: 32 * s,
      minWidth: 32 * s,
      padding: wide ? `0 ${12 * s}px` : 0,
      borderRadius: 999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6 * s,
      border: `1px solid ${primary ? "#fff" : T.hairline}`,
      background: primary ? "#fff" : on ? "rgba(255,255,255,.14)" : "transparent",
      color: primary ? T.graphite : "rgba(255,255,255,.85)",
      font: `500 ${13 * s}px ${T.ui}`,
      position: "relative",
    }}
  >
    {children}
  </div>
);

export const Prompter: React.FC<Props> = ({
  width,
  height,
  scroll = 0,
  size = 30,
  font = T.ui,
  textColor = T.bone,
  marker = "arrows",
  markerColor = "#6b62f2", // hex: the glow and band add an alpha suffix
  markerPos = 0.32,
  showBar = true,
  highlight = null,
  status = null,
  micOn = false,
  hearing = false,
  headOn = false,
  playing = false,
  style,
}) => {
  const s = width / 806; // control sizes scale with the window
  const my = height * markerPos;
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 24 * s,
        overflow: "hidden",
        background: "rgba(10,10,10,.92)",
        boxShadow: `inset 0 0 0 1px ${T.hairline}, 0 30px 80px rgba(0,0,0,.45)`,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          WebkitMaskImage: "linear-gradient(transparent 0, #000 16%, #000 80%, transparent 100%)",
          maskImage: "linear-gradient(transparent 0, #000 16%, #000 80%, transparent 100%)",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: my - size * 0.8 - scroll, padding: `0 ${40 * s}px` }}>
          <ScriptContent size={size} font={font} textColor={textColor} highlight={highlight} />
        </div>
      </div>

      {/* reading marker */}
      {marker === "arrows" && (
        <>
          <div style={{ position: "absolute", left: 12 * s, top: my - 8 * s, width: 0, height: 0, borderTop: `${8 * s}px solid transparent`, borderBottom: `${8 * s}px solid transparent`, borderLeft: `${11 * s}px solid ${markerColor}` }} />
          <div style={{ position: "absolute", right: 12 * s, top: my - 8 * s, width: 0, height: 0, borderTop: `${8 * s}px solid transparent`, borderBottom: `${8 * s}px solid transparent`, borderRight: `${11 * s}px solid ${markerColor}` }} />
        </>
      )}
      {marker === "glow" && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: my - 1, height: 2, background: `linear-gradient(90deg, transparent 4%, ${markerColor} 50%, transparent 96%)` }} />
          <div style={{ position: "absolute", left: "10%", right: "10%", top: my - 24, height: 48, background: `radial-gradient(50% 50% at 50% 50%, ${markerColor}55, transparent)` }} />
        </>
      )}
      {marker === "line" && <div style={{ position: "absolute", left: 0, right: 0, top: my, borderTop: `1px solid ${markerColor}` }} />}
      {marker === "band" && (
        <div style={{ position: "absolute", left: 12 * s, right: 12 * s, top: my - (size * 1.45) / 2, height: size * 1.45, borderRadius: 10 * s, background: `${markerColor}24`, boxShadow: `inset 0 0 0 1px ${markerColor}40` }} />
      )}

      {/* grab pill */}
      <div style={{ position: "absolute", top: 8 * s, left: "50%", translate: "-50% 0", width: 44 * s, height: 4 * s, borderRadius: 999, background: "rgba(255,255,255,.3)" }} />

      {status && (
        <div style={{ position: "absolute", top: 14 * s, left: 16 * s, display: "flex", alignItems: "center", gap: 7 * s, height: 26 * s, padding: `0 ${12 * s}px`, borderRadius: 999, background: "rgba(22,22,22,.85)", boxShadow: `inset 0 0 0 1px ${T.hairline}`, font: `500 ${12 * s}px ${T.ui}`, color: T.ash }}>
          <span style={{ width: 6 * s, height: 6 * s, borderRadius: 999, background: T.ash }} />
          {status}
        </div>
      )}

      {showBar && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 14 * s,
            translate: "-50% 0",
            display: "flex",
            alignItems: "center",
            gap: 6 * s,
            padding: 6 * s,
            borderRadius: 999,
            background: "rgba(22,22,22,.9)",
            boxShadow: `inset 0 0 0 1px ${T.hairline}`,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 * s, padding: `0 ${6 * s}px 0 ${8 * s}px`, font: `600 ${13 * s}px ${T.head}`, color: T.smoke }}>
            <Icon name="unseen" size={15 * s} color={T.slate} /> Unseencue
          </div>
          <div style={{ width: 1, height: 18 * s, background: T.hairline }} />
          <BarButton s={s} wide>
            <Icon name="paste" size={15 * s} /> Paste
          </BarButton>
          <BarButton s={s} wide>
            <Icon name="upload" size={15 * s} /> Upload
          </BarButton>
          <BarButton s={s}>
            <Icon name="edit" size={15 * s} />
          </BarButton>
          <div style={{ width: 1, height: 18 * s, background: T.hairline }} />
          <BarButton s={s}>
            <Icon name="restart" size={15 * s} />
          </BarButton>
          <BarButton s={s} primary>
            {playing ? (
              <svg width={15 * s} height={15 * s} viewBox="0 0 24 24" stroke={T.graphite} strokeWidth={2.4} strokeLinecap="round">
                <path d="M8 5v14M16 5v14" />
              </svg>
            ) : (
              <Icon name="play" size={15 * s} />
            )}
          </BarButton>
          <div style={{ display: "flex", alignItems: "center", gap: 8 * s, padding: `0 ${6 * s}px` }}>
            <div style={{ position: "relative", width: 72 * s, height: 2 * s, background: T.hairlineStrong, borderRadius: 2 }}>
              <div style={{ position: "absolute", left: 18 * s, top: -6 * s, width: 14 * s, height: 14 * s, borderRadius: 999, background: "#fff" }} />
            </div>
            <span style={{ font: `500 ${12 * s}px ${T.ui}`, color: T.smoke }}>40</span>
          </div>
          <div style={{ width: 1, height: 18 * s, background: T.hairline }} />
          <BarButton s={s} on={micOn}>
            <Icon name="mic" size={15 * s} />
            {micOn && <span style={{ position: "absolute", top: 6 * s, right: 6 * s, width: 5 * s, height: 5 * s, borderRadius: 999, background: hearing ? "#fff" : T.slate, boxShadow: hearing ? "0 0 6px rgba(255,255,255,.8)" : "none" }} />}
          </BarButton>
          <BarButton s={s} on={headOn}>
            <Icon name="face" size={15 * s} />
          </BarButton>
          <div style={{ width: 1, height: 18 * s, background: T.hairline }} />
          <BarButton s={s}>
            <Icon name="sliders" size={15 * s} />
          </BarButton>
          <BarButton s={s}>
            <Icon name="x" size={15 * s} />
          </BarButton>
        </div>
      )}
    </div>
  );
};
