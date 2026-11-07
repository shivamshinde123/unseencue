# Product Requirements — Unseencue

## Goal
Read a script while recording without looking away from the webcam, and without the script showing up in the recording or screen share.

## User
Just the author (a solo creator on Windows 11), with a webcam at the top-middle of the monitor. Not distributed to others for now.

## Requirements

| # | Requirement | Status |
|---|---|---|
| R1 | Script window sits **top-centre, directly under the webcam**, always on top | Done |
| R2 | Window is **invisible to recordings / screen share** (OBS, Zoom, Teams, Snipping Tool) | Done |
| R3 | **Manual speed** control (slider in UI, no keyboard shortcuts) | Done (v0.1) |
| R4 | **Voice follow**: scroll while I'm talking, **stop when I stop talking** | Done (v0.1) |
| R5 | **Head follow**: pause when I look away from the screen, resume when I look back | Done (v0.1) |
| R6 | Load a **.txt file** | Done |
| R7 | **Markdown** in the .txt: headings, text colour, background/highlight colour, so headings stand out from body text | Done (v0.1) |
| R8 | Change **font, size, colours** (text, background, heading) | Done (v0.1) |
| R9 | Configurable **reading marker** (style, colour, vertical position) | Done (v0.1) |
| R10 | **Countdown** before scrolling starts, length set by me | Done (v0.1) |
| R11 | Controls on screen (buttons / settings panel), **no keyboard shortcuts needed** | Done (v0.1) |
| R12 | Packaged as a **Windows app** (.exe) | Done |
| R13 | **Rounded corners** on the prompter window | Done (v0.2) |
| R14 | **Resize from every edge and corner** (top, bottom, sides, diagonals) | Done (v0.2) |
| R15 | **Paste or type** the script straight into the window, not only open a file | Done (v0.2) |
| R16 | Polished look following the "Dimension" design reference | Done (v0.2) |

## Markdown subset (R7)
- `#`, `##`, `###` headings, `**bold**`, `*italic*`
- Colour: `{red}text{/}` or inline HTML `<span style="color:#f00;background:#ff0">text</span>` (both work; shorthand also supports `{red|#ff0}text{/}` and `{|#333}text{/}`)
- `---` as a pause / section break

## Acceptance criteria
- A 5-second OBS recording of the screen shows nothing where the window is.
- With voice follow on, scrolling stops within ~0.5 s of silence and resumes when I speak.
- Settings persist between launches.

## Resolved questions (2026-11-06)
1. Head follow = **pause when I look away**, resume when I look back.
2. Privacy = **hidden from recordings / screen share** only.
3. Recorder: OBS for me, but it **must work alongside any recorder** (Zoom, Teams, Loom, ...). Camera handling: pick any camera in settings, including virtual cameras. If the camera is busy, show "Head follow unavailable: camera in use" with a hint. Voice and manual scrolling keep working.
4. Stack: **Electron** approved.

## Out of scope (for now)
Mirror mode, remote control, multi-monitor, cloud sync, distribution/installer signing.
