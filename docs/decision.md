# Decisions (newest last)

## 2026-11-06 — Prototype in Python + tkinter (superseded below)
Fastest way to prove the core trick: `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)` hides a window from capture while still showing it on the monitor. Packaged with PyInstaller. Built before requirements were gathered; files deleted 2026-11-06 once the Electron build replaced it.

## 2026-11-06 — Rebuild in Electron (approved by user 2026-11-06)
**Why:** the real requirements are mostly UI + media:
- Markdown, fonts, colours, marker styles are trivial in HTML/CSS; painful in tkinter.
- Electron's `BrowserWindow.setContentProtection(true)` calls the same `WDA_EXCLUDEFROMCAPTURE` API — no ctypes needed.
- Microphone (voice activity) and webcam (head tracking via MediaPipe Face Landmarker) are first-class in the browser runtime.
- Offline speech recognition for word-level follow is available via Vosk (WASM) if needed later.

**Tradeoff:** ~100 MB app vs ~11 MB. Acceptable for a personal tool.
**Alternative considered:** Python + PySide6 (Qt has markdown and topmost windows) — rejected because the styling/settings UI is more work and MediaPipe + Qt packaging is heavier.

## 2026-11-06 — Voice follow starts as voice-activity detection
Scroll while mic level is above a threshold, stop after a short silence. Simple, offline, and meets "stop when I stop talking". Word-matching follow (scroll to where you are in the script) is a later upgrade.

## 2026-11-06 — Colour syntax: `{fg|bg}text{/}` shorthand + raw HTML spans
Shorthand is quick to type in Notepad. Colours are validated (name or hex) so a tag can't inject other CSS. Raw `<span style>` still works via marked for edge cases. A CSP blocks any script in a script file.

## 2026-11-06 — Head follow calibrates itself
Rather than a "calibrate" button, the baseline head pose is sampled when head follow turns on and during every countdown (you're looking at the screen then). Look-away = nose position (between cheeks / forehead–chin) drifts beyond the tolerance for 300 ms, or no face found.

## 2026-11-06 — Camera busy is a soft failure
If the recorder holds the webcam, head follow shows a message pointing to virtual cameras; voice and manual scrolling keep working. Camera is selectable in settings so any recorder's virtual camera works.

## 2026-11-06 — Packaging: portable exe, no exe resource editing
`signAndEditExecutable: false` because electron-builder's winCodeSign archive needs symlink privileges this PC doesn't grant. Cost: default Electron icon/metadata on the exe. Revisit with Developer Mode on, or when adding an icon.

## 2026-11-06 — Extras folded into v0.1
Capture self-test button (Settings → "Test: is it hidden"), resume position per script, progress bar, time-remaining estimate.

## 2026-11-06 — v0.2: adopt the "Dimension" style (Refero) as the design system
User asked for a nicer look following https://styles.refero.design/style/fbcf9cbb-7c6b-449d-862a-bce521a8ab1d. Taken: #0a0a0a canvas, #161616 graphite panels, frosted 10% panels, hairline borders, pill controls (white pill = primary), 10/24 px radii, DM Sans (UI/body) + Geist (headings), weight-500 restraint, violet #6b62f2 only as a gradient wash (marker glow, h2 underline, section break). Fonts bundled via @fontsource so it works offline. Tokens live in renderer/tokens.css.

## 2026-11-06 — Transparent window + custom resize handles
Rounded corners need a transparent window, and Windows can't natively resize transparent windows. So the window is `transparent, resizable:false` and 8 invisible handles (4 edges, 4 corners) call `window:set-bounds`. Drag-to-move is the grab pill at the top. Background opacity now applies to the card only (text stays fully opaque) instead of `setOpacity` on the whole window.

## 2026-11-06 — Voice follow: adaptive noise floor instead of a fixed threshold
Bug: v0.1 used a fixed RMS threshold of 0.04 (≈ −28 dB). With auto-gain off it was above normal speech on this mic, so voice follow never started. Measured noise floor here: −49 to −60 dB peak with noise suppression on. A fixed level can't fit every mic, so now: track the room's noise floor (falls fast, rises ≈1 dB/s), trigger = floor + margin (default 16 dB), floor never below −60 dB (noise suppression outputs digital silence, which would make clicks look like speech). AGC stays off because it pumps up room noise in pauses. `AudioContext.resume()` is called explicitly. Settings shows a live mic meter with the trigger line.

## 2026-11-06 — Paste / type scripts
An in-window editor (pencil button, or Ctrl+V anywhere) holds a "draft" script stored in settings.json. Opened files are never written to; editing a file's text turns it into a draft.

## 2026-11-06 — Settings version bump resets the look
`styleVersion` (now 3) in settings.json: when it doesn't match, look/behaviour settings reset to the new defaults while script, positions, speed and countdown are kept. Needed so old v0.1 colours/fonts didn't override the new design.

## 2026-11-06 — Fix: broken image in Settings
The capture-test `<img>` had `display:block`, which overrode the `hidden` attribute, so an empty broken image showed. Global `[hidden]{display:none!important}` in tokens.css; the image now sits in a figure that appears only after a capture.

## 2026-11-06 — Settings never sits under the prompter; whole-window opacity
Settings was opening in the middle of the screen, partly behind the always-on-top prompter. Now it opens in the right-hand column below the prompter, on the same "screen-saver" level one step higher, so the prompter can't cover it. Added `windowOpacity` (default 85%): CSS opacity on the whole card (text, colours and controls), so you can see your screen through it. `opacity` stays as a separate "background only" control. The card's CSS was used instead of `BrowserWindow.setOpacity`, because it composes reliably with the transparent window.

## 2026-11-06 — Paste and Upload as first-class, labeled actions
User couldn't paste. Self-test showed Ctrl+V inside the editor and on the prompter both worked, so the gaps were discoverability and missing paths: Electron has no right-click menu by default, and Paste/Open were small unlabeled icons on a hover bar. Now:
- The toolbar has labeled **Paste** (reads the clipboard through the main process and loads it straight away as the script) and **Upload** (file dialog) buttons.
- The editor bar has **Paste from clipboard** (inserts at the cursor) and **Upload file**.
- Right-click menu: Cut/Copy/Paste/Select all in the editor; elsewhere on the prompter, Paste script / Upload file / Edit.
- Drag a .txt/.md file onto the window to load it (`webUtils.getPathForFile`, so its scroll position is remembered).
- The app menu is set to `editMenu` so the edit shortcuts always work while the menu bar stays hidden.
- `--selftest=paste` presses a real Ctrl+V inside the editor and outside it, then restores the user's clipboard.

## 2026-11-06 — Round of polish requested by the user
- **Editor "random text":** the editor bar's hint (`Markdown headings · {colour}text{/} …`) was cut off and read as gibberish. It's replaced by a **Formatting help** button that opens a panel of examples; clicking one inserts it at the cursor. The bar only shows a message when there's something to say (e.g. empty clipboard).
- **Font sizes:** size presets (Tiny 20 → Giant 110 px) plus a slider from 12–140 px. Each heading level has its own size (% of the body text).
- **Edge padding:** `edgePadding` (default 32 px) is always kept clear left/right: content width = min(column %, 100% − 2×padding).
- **Colours:** every colour setting shows a preset palette (text / background / highlight / accent sets in the design's spirit), with a **Custom** picker last.
- **Home position:** "Position under your webcam" = Top left / Top centre / Top right, or **Save current spot as home** (exact bounds; ignored if that spot is no longer on a connected screen). The window opens at home every launch; "Move back home" returns it.
- **Settings placement:** opens on top of the prompter (centred on it, same top edge), on a higher always-on-top level, with a normal title bar so it can be dragged anywhere. This replaces the "right-hand column" placement.
- **Meetings:** `setContentProtection` (WDA_EXCLUDEFROMCAPTURE) applies to every capture API, so it covers Zoom, Meet (browser getDisplayMedia), Teams, Webex, Slack, Discord, OBS, Loom, Game Bar and PrintScreen. Verified two paths: desktopCapturer (WGC/DXGI, the same path as Chrome/Meet, Teams, OBS) and GDI `CopyFromScreen`. Both show the desktop, not the prompter. Not each app individually.

## 2026-11-06 — Settings becomes a two-pane window with a live preview
- **Text size:** the preset buttons were removed (user preferred the slider). The slider runs 12–140 px.
- **Fonts:** the old `<input list>` datalist only ever showed fonts matching the current value, so it looked like there was one font. It's replaced by a searchable list: the bundled fonts (DM Sans, Geist), then every font installed on the PC via `queryLocalFonts()` (192 on this machine), each name drawn in its own font. If Windows denies the list, it falls back to common Windows fonts and shows a "Show all fonts" button (a click can unlock the permission).
- **Layout:** the Settings window is about 90% of the screen, centred. The left column is the scrolling settings; the right pane is a **live preview**: the real prompter page in an iframe (`index.html?preview`) at the prompter's real pixel size, scaled to fit, looping the current script, over a sample desktop so the see-through settings are visible. Using the real page means the preview can't drift from the app. The iframe uses `window.parent.api`.
- **Gotcha:** the preview iframe needs the same `color-scheme` as the Settings page, otherwise Chromium paints an opaque white backdrop behind it (white corners).

## 2026-11-07 — Bug: picking a reading-marker style turned Settings black
**Cause:** the segmented controls (marker style, webcam position) hide a radio `<input>` with `position:absolute`, but the label wasn't positioned. So the input's containing block was the page, at its static position far down the scrolling column. Clicking focused it, and Chromium scrolled the *page* (not the settings column) by about 1,146 px, moving the whole layout off-screen, which looked black. **Fix:** `.seg label { position: relative }`, the input `inset:0`, and `.layout { position: fixed; inset: 0 }` so the page can never scroll.

## 2026-11-07 — Font is a dropdown
The user wanted a dropdown, not a list. It's now a `<select>` with "Built in" / "On this PC" groups, each option drawn in its own font. Headings now follow the chosen font too (Geist is kept only with the default DM Sans, as the design's pairing), because the walk showed that changing the font left the headings unchanged.

## 2026-11-07 — `--selftest=walk`: every setting, clicked like a user, screenshotted
35 steps, one or more for every control (opacity, font, size, spacing, width, padding, colour presets and custom, heading size/colour/background, all 5 marker styles, colour, height, speed, countdown, voice on/off with the meter, margin, silence, head on/off, the 3 webcam positions, save/move home, hidden check, reset). Clicks are real mouse events (`sendInputEvent`), so focus and scroll behave as they do for a person. Each step records the page scroll, prompter bounds and the resulting setting, and saves a screenshot to `%TEMP%\tp-walk`. The user's settings and window are restored in a `finally` block. The walk also found unstyled markdown **tables** running off the edge (now fixed-layout, smaller, hairline rules) and huge single words overflowing (`overflow-wrap: break-word`).

## 2026-11-07 — Arrows is the default marker; themed tooltips
- The default `marker.style` is now `arrows` (user preference). Glow is still available.
- The native `title` tooltips (white Windows boxes) are replaced by `renderer/tooltip.js`, loaded in both windows. It moves every `title` (including ones added later, via a MutationObserver) into `data-tip` and, for icon-only controls, into `aria-label`, then shows a graphite pill with a hairline border and a small arrow, above the element (below if there's no room), after 450 ms on hover or straight away on keyboard focus.

## 2026-11-07 — App name shortlist (awaiting the user's pick)
Checked on 2026-11-07: .com via the Verisign RDAP API and .app via Google Registry RDAP (404 = unregistered), web search for apps/products/trademarks, GitHub repo names and npm. 31 names were checked; most were taken (Lenscue, Ghostcue, Eyeline, Glancer, Cuelens, Sightcue…).
| Name | .com | .app | Conflicts found |
|---|---|---|---|
| Lenslit | free | free | none; a similar-sounding iOS photo app, "LensLight Visual Effects" |
| Hushcue | taken | free | none |
| Unseencue | free | free | none |
| Veilcue | free | free | a 0-star GitHub repo "VeilCue" (Windows subtitle tool, created 2026-11) |
| Duskcue | free | free | a 0-star GitHub repo "Duskcue" (media streaming) |
| Gazecue | taken | free | academic term "GazeCues", "gaze cueing" |
| Undercam | taken | free | none notable |
The USPTO database wasn't queried directly; check https://tmsearch.uspto.gov before committing to a name.

## 2026-11-07 — Name: Unseencue
The user picked **Unseencue** from the shortlist (unseencue.com and unseencue.app were unregistered on 2026-11-07; no app, trademark, GitHub repo or npm package found). It says the product's promise: your cue is unseen by viewers. Where it appears:
- The wordmark (eye-off icon + "Unseencue", Geist 600, muted) sits at the left end of the floating control bar, so it only shows on hover or while paused and never covers the script. The name hides under 700 px width (icon only), and the time-remaining readout hides under 900 px so the bar always fits.
- The window titles ("Unseencue", "Unseencue · Settings"), the Settings eyebrow, `productName`/`appId`, and the exe (`release/Unseencue 0.2.0.exe`).
- **Data folder moved** from `%APPDATA%\teleprompter` to `%APPDATA%\Unseencue` (Electron derives it from the product name). `migrateOldSettings()` copies the old settings.json on first run, so the user's script, look and home spot carry over.
