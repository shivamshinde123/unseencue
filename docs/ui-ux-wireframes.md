# UI / UX

## Design system
Follows the "Dimension" style reference (https://styles.refero.design/style/fbcf9cbb-7c6b-449d-862a-bce521a8ab1d). Tokens are in `renderer/tokens.css`.
- Surfaces: canvas #0a0a0a, graphite #161616, frosted panels rgba(212,212,212,.1), 1px hairlines rgba(229,229,229,.14)
- Text: bone #ededed body, ash #c2c2c2 secondary, slate #686868 hints
- Shape: 24px cards and window, 10px UI, 4px tags, pill buttons (white pill = primary action)
- Type: DM Sans for UI and the script, Geist for headings, mostly weight 400–500
- Accent: violet #6b62f2 only as a gradient wash (marker glow, h2 underline, `---` breaks, countdown glow)

## Prompter window
Top-centre, directly under the webcam. Rounded, translucent card; text fades out near the top and bottom edges.

```
            [ webcam ]
 ╭───────────── ═══ (drag) ─────────────╮
 │ ● Paused                             │
 │  ┌ Welcome ┐   (h1: frosted pill)    │
 │ ─────────── violet glow marker ───── │
 │  Hey everyone, today we're going …   │
 │   ╭───────────────────────────────╮  │
 │   │ Paste Upload ✎ │ ⟲ (▶) ━━●━━ 40 │ 🎤 ☺ 12%·1:42 │ ⚙ ✕ │
 │   ╰───────────────────────────────╯  │
 ╰──────────────────────────────────────╯
```
- Floating pill bar: shown on hover, and always while paused, empty or editing.
- Resize from any edge or corner. Move by the grab pill at the top.
- Labeled **Paste** (clipboard → script) and **Upload** (file) pills come first in the bar; ✎ opens the type/edit editor. Ctrl+V anywhere, right-click, or dropping a file also work. In the editor: Paste from clipboard · Upload file · Cancel · Done (primary white pill).
- 🎤 shows a small white dot while it hears you.

## Start flow
Paste text or open a file → ▶ → countdown (glowing number, length set in Settings) → scrolling.

## Settings window
Large window (~90% of the screen), centred, above the prompter, draggable. Left: scrolling settings. Right: live preview of the real prompter at its true size over a sample desktop, looping the current script. One frosted card per group: See-through (window opacity, background opacity) · Script text · Headings · Reading marker (segmented: Glow/Line/Arrows/Band/None) · Playback · Voice follow (switch, live mic meter with violet trigger line) · Head follow (switch, camera picker) · Position under your webcam (Top left/centre/right, save current spot as home) · Hidden from recordings & screen shares (what it covers, a "made for creating, not cheating" note, capture check, reset). Colour settings are preset swatches with a Custom picker last; text size is a slider (12–140 px); the font is a dropdown of bundled and installed fonts (each option in its own face); headings follow it unless it is the default DM Sans.

## States
Empty (editor open) · Editing · Countdown · Scrolling · Paused (manual / "Listening — start talking" / "Look at the screen to continue") · End of script.
