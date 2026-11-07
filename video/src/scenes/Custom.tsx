import React from "react";
import { enter, lerp, prog, useSeconds } from "../anim";
import { Marker, Prompter } from "../components/Prompter";
import { Scene, wordAt } from "../components/Scene";
import { T } from "../theme";

const FONTS = [
  { name: "DM Sans", css: T.ui },
  { name: "Georgia", css: "Georgia, serif" },
  { name: "Bahnschrift", css: "Bahnschrift, 'Segoe UI', sans-serif" },
];
const COLOURS = ["#ededed", T.gold, T.sky, T.mint, "#ff8c69", "#a29bfe"];
const MARKERS: Marker[] = ["arrows", "glow", "band"];

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 34 }}>
    <div style={{ font: `500 26px ${T.ui}`, color: T.ash, marginBottom: 14 }}>{label}</div>
    {children}
  </div>
);

/** Settings change, the live preview follows. */
export const Custom: React.FC = () => {
  const t = useSeconds();
  // what the cursor picks, timed to the words
  const tFont = wordAt("custom", "font");
  const tSize = wordAt("custom", "size");
  const tColour = wordAt("custom", "colour");
  const tMarker = wordAt("custom", "marker");
  const tPreview = wordAt("custom", "preview");
  const font = t < tFont + 0.3 ? 0 : t < tPreview + 0.6 ? 1 : 2;
  const colour = t < tColour + 0.3 ? 0 : t < tPreview + 1.2 ? 1 : 2;
  const marker = t < tMarker + 0.3 ? 0 : t < tPreview + 1.8 ? 1 : 2;
  const sizeP = prog(t, tSize, 0.8);
  const size = Math.round(lerp(28, 34, sizeP));

  // cursor path between controls
  const targets = [
    { at: 0.6, x: 330, y: 350 },
    { at: tFont, x: 330 + 190, y: 350 },
    { at: tSize, x: 120 + 260, y: 490 },
    { at: tColour, x: 120 + 56 + 66, y: 620 },
    { at: tMarker, x: 120 + 300, y: 755 },
    { at: tPreview + 0.6, x: 330 + 380, y: 350 },
    { at: tPreview + 1.2, x: 120 + 56 + 132, y: 620 },
    { at: tPreview + 1.8, x: 120 + 470, y: 755 },
  ];
  let cx = targets[0].x, cy = targets[0].y;
  for (let i = 1; i < targets.length; i++) {
    const p = prog(t, targets[i].at - 0.45, 0.45);
    cx = lerp(cx, targets[i].x, p);
    cy = lerp(cy, targets[i].y, p);
  }
  const press = targets.some((g) => t > g.at - 0.05 && t < g.at + 0.12);

  const panel = enter(t, 0.2, 0.9, 30);
  return (
    <Scene vo="custom">
      {/* settings panel */}
      <div style={{ position: "absolute", left: 110, top: 200, width: 700, padding: "34px 36px 6px", borderRadius: 28, background: T.frost, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.05)", ...panel }}>
        <div style={{ font: `500 40px ${T.head}`, color: "#fff", marginBottom: 30 }}>Settings</div>
        <Row label="Font">
          <div style={{ display: "flex", gap: 10 }}>
            {FONTS.map((f, i) => (
              <div key={f.name} style={{ padding: "10px 20px", borderRadius: 999, font: `500 26px ${f.css}`, background: i === font ? "#fff" : "transparent", color: i === font ? T.graphite : T.bone, boxShadow: `inset 0 0 0 1px ${T.hairlineStrong}` }}>
                {f.name}
              </div>
            ))}
          </div>
        </Row>
        <Row label={`Text size · ${size} px`}>
          <div style={{ position: "relative", height: 4, borderRadius: 4, background: T.hairlineStrong, margin: "16px 0 10px" }}>
            <div style={{ position: "absolute", left: `${lerp(30, 52, sizeP)}%`, top: -10, width: 24, height: 24, borderRadius: 99, background: "#fff", translate: "-50% 0" }} />
          </div>
        </Row>
        <Row label="Text colour">
          <div style={{ display: "flex", gap: 14 }}>
            {COLOURS.map((c, i) => (
              <div key={c} style={{ width: 50, height: 50, borderRadius: 99, background: c, boxShadow: i === colour ? `0 0 0 4px ${T.void}, 0 0 0 7px #fff` : "inset 0 0 0 1px rgba(255,255,255,.2)" }} />
            ))}
          </div>
        </Row>
        <Row label="Reading marker">
          <div style={{ display: "flex", gap: 6, padding: 6, borderRadius: 999, background: T.graphite, boxShadow: `inset 0 0 0 1px ${T.hairline}` }}>
            {MARKERS.map((m, i) => (
              <div key={m} style={{ flex: 1, textAlign: "center", padding: "12px 0", borderRadius: 999, font: `500 26px ${T.ui}`, textTransform: "capitalize", background: i === marker ? "#fff" : "transparent", color: i === marker ? T.graphite : T.smoke }}>
                {m}
              </div>
            ))}
          </div>
        </Row>
      </div>

      {/* cursor */}
      <svg width="44" height="44" viewBox="0 0 24 24" style={{ position: "absolute", left: cx, top: cy, scale: press ? "0.85" : "1", opacity: panel.opacity, filter: "drop-shadow(0 4px 8px rgba(0,0,0,.6))" }}>
        <path d="M4 3l15 7-6.5 2L10 19z" fill="#fff" stroke="#111" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>

      {/* live preview */}
      <div style={{ position: "absolute", left: 900, top: 180, ...enter(t, 0.4, 0.9, 30) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, font: `500 30px ${T.head}`, color: "#fff", marginBottom: 20 }}>
          <span style={{ width: 12, height: 12, borderRadius: 99, background: T.mint, boxShadow: `0 0 10px ${T.mint}` }} />
          Live preview
        </div>
        <Prompter width={900} height={600} size={size} font={FONTS[font].css} textColor={COLOURS[colour]} marker={MARKERS[marker]} scroll={0} />
      </div>
    </Scene>
  );
};
