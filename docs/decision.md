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

## 2026-11-07 — Positioning: made for creating, not cheating
The author's motivation: a job application asked them to walk through their AI-agent workflow, so they wanted to record it, and needed a script to stay on track without it showing in the recording. The product is positioned for **recording videos and presenting**. A clear **Responsible use** statement says it is not for interviews, coding assessments, exams, certifications, or anywhere notes aren't allowed, and that the author doesn't endorse that. It appears in the README (its own section, plus the FAQ), on the website (its own section, plus the FAQ) and in the app (Settings → Hidden card). Marketing copy leads with "stays out of your recordings" rather than "hidden in meetings". The bundled sample script is now an AI-agent workflow walkthrough, and the README/site screenshots use it.

## 2026-11-07 — Published
- Code: https://github.com/shivamshinde123/unseencue (public; free GitHub Pages needs a public repo).
- Exe: GitHub Release **v0.2.0**, asset named `Unseencue.exe`, so `…/releases/latest/download/Unseencue.exe` always points at the newest release. The website and README link there. Binaries stay out of git (`release/` is gitignored).
- Website: `site/` is deployed to https://shivamshinde123.github.io/unseencue/ by `.github/workflows/pages.yml` (Pages build type "workflow") on every push that touches `site/`.
- To ship a new version: bump `version` in package.json → `npm run dist` → `gh release create vX.Y.Z "<exe copied as Unseencue.exe>" --latest`.
- License: MIT (LICENSE added 2026-11-07).

## 2026-11-07 — Product video (video/)
A ~2-minute 16:9 promo built with **Remotion** (the default for video work) in `video/`. It has 10 scenes joined by fades: hook → problem → the author's story (the job application asking for an AI-agent workflow walkthrough) → reveal → hidden from capture → paste/type/upload → voice & head follow → customise → responsible use → CTA.
- **Voice:** Microsoft neural "Andrew" via `edge-tts` (`video/scripts/voiceover.py`), one MP3 per scene plus word timings in `src/voiceover.json`. The name is spoken as "Unseen Cue" for a clear pronunciation; captions merge it back to "Unseencue".
- **Captions:** word-by-word highlight from those timings. Lines break at the script's punctuation, max 8 words, and never on a single dangling word.
- **Music:** an original ambient pad synthesized locally (`scripts/music.py`, numpy), so there's no licensing. Music base volume 0.6, ducking to 42% under each voice line; final mix normalised to about -14 LUFS (YouTube level) with ffmpeg loudnorm.
- **Visuals:** the teleprompter is rebuilt as React components, so it animates sharply. Voice follow in the video is driven by the real narration timings. Design tokens match the app and site.
- **Review:** `node scripts/stills.mjs <dir> <frames…>` renders review frames in one bundle pass. Frames from every scene were checked; the fixes from that review were code overflow, caption line breaks, highlight placement, the band-marker colour format and layout balance.

## 2026-11-07 — v0.3.0: real installer, app icon, livelier video
- **Start menu:** the portable exe never installs, so it can't add a Start menu entry. v0.3.0 builds an **NSIS installer** (`Unseencue-Setup.exe`): per-user (no admin), one-click, with Start menu and desktop shortcuts, launch on finish, and an uninstaller listed in Settings › Apps (publisher "Shivam Shinde"). The portable exe is still built for people who don't want to install. The website and README point to the installer first.
- **Icon:** the exe used to carry Electron's logo because exe resource editing was off (`signAndEditExecutable:false`). The new original icon (`build/icon.svg`, a webcam above a teleprompter card with the reading line and violet marker arrows, on the dusk horizon) is rendered by `npm run icon` (sharp + png-to-ico) into `build/icon.ico` (16–256), `renderer/icon.png` (window/taskbar) and the website icons.
- **The winCodeSign symlink error** (it blocked exe editing) was fixed by pre-extracting the toolkit into `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0` while skipping its two macOS `.dylib` symlinks, which Windows never uses. On a fresh machine, repeat that step (or enable Windows Developer Mode).
- `app.setAppUserModelId('local.unseencue')` matches the shortcut's AppUserModelID, so the taskbar button groups with the Start menu entry and uses the icon.
- **Verified:** the setup, portable and installed exes all extract the new icon; a silent install creates both shortcuts and the Apps entry (Unseencue 0.3.0); the installed app passes `--selftest=script`; `renderer/icon.png` is inside app.asar.
- **Video:** the user found the "Andrew" voice and the ambient bed too serious. The voice is now **Brian** ("approachable, casual"), at +7% rate and +2 Hz pitch, with a looser script ("Okay, real talk…", "Say hi to Unseencue!", "Pretty neat, right?"). The music is a new upbeat 112 BPM synthesized track (C–G–Am–F, swung hats, claps, bouncy bass, off-beat plucks, marimba hook, intro/breakdown/outro). It was rebalanced after a band-energy check showed 95% of its energy below 500 Hz; it's now roughly a third each lows / mids / upper-mids. `wordAt()` now prefers exact case-sensitive word matches, so "You" no longer matches "your". The Reveal and CTA scenes show the app icon.

## 2026-11-07 — v0.4.0: macOS app (built and tested on GitHub's Macs)
The user has no Mac. Electron runs the same code on macOS, so no Xcode or Swift port is needed; GitHub Actions' **macos-15 (Apple Silicon)** and **macos-15-intel** runners build and test it (`.github/workflows/mac.yml`). GitHub Codespaces is Linux-only, so it can't do this.
- **Mac-specific code:**
  - A real app menu (About, Settings… ⌘,, Hide/Quit, Edit, Window › Move Back Home ⌘0).
  - `setVisibleOnAllWorkspaces(..., visibleOnFullScreen)` so the prompter stays over full-screen apps and on every Space.
  - `systemPreferences.askForMediaAccess` before mic/camera use, with `NSMicrophoneUsageDescription` / `NSCameraUsageDescription` in Info.plist.
  - Mac wording in Settings (cameras can be shared on Mac; the capture caveat; Screen Recording permission for the check).
  - `setAppUserModelId` is Windows-only.
  - The capture test never throws (it returns null when macOS denies capture).
- **Signing:** free and unsigned, by the user's choice. electron-builder 25 skips `identity: "-"`, so `mac.identity: null` plus an `afterPack` hook (`scripts/adhoc-sign.cjs`) runs `codesign --force --deep --sign -`. Without any valid signature, Apple Silicon refuses to launch the app. Users bypass Gatekeeper once with right-click → Open.
- **DMGs:** one per architecture rather than universal, to keep downloads around 100 MB instead of about 200 MB. The workflow uploads stable names, `Unseencue-mac-arm64.dmg` / `Unseencue-mac-x64.dmg`, so `releases/latest/download/...` links keep working.
- **Testing on CI Macs:** the full self-test suite (script, editor, settings, paste, table, 35-step walk) runs on both runners, and screenshots and logs are kept as artifacts. Mac paste is tested with `webContents.paste()`, because synthetic ⌘V skips the menu that implements it. The self-test mic probe is time-boxed and `media:ask` auto-allows in self-test mode, since nobody is there to click Allow.
- **Capture probe (new, both OSes):** two red windows, one protected and one not, then a real screen capture; it reports the red share in each region. Windows 10.0.26300: protected 0%, control 100% → hidden. **macOS 15.8.2 Apple Silicon (with Screen Recording granted via the runner's TCC.db): protected 0%, control 100% → hidden.** macOS 15.7 Intel: inconclusive (the TCC grant didn't take, so the capture was blocked). The public copy stays cautious because of reports that ScreenCaptureKit-based recorders on macOS 15.4+ may still capture protected windows.
- **Video:** the CTA now says "for Windows and Mac", and the button reads "Download for Windows & Mac".

## 2026-11-07 — Hero shows the video, not a screenshot
The hero's monitor-mockup screenshot looked like the video's first frame, so the page opened with the same image twice. The hero now holds the video player itself (`#video`, so the README's `#video` links still work). The separate "See it in two minutes" section and the mockup CSS were removed.

## 2026-11-07 — Control bar fits itself (✕ was cut off)
**Bug:** on the user's screen the prompter opens 649 px wide, and the bar's fixed width breakpoints (900/700/520 px) didn't shrink it enough, so ✕ overflowed past the rounded right edge. **Fix:** `fitBar()` measures the bar against the window (on load, after fonts load, and on resize) and applies compact steps one at a time until it fits:
1. hide time left
2. hide the "Unseencue" label
3. shorter speed slider
4. hide the logo
5. drop the separators
6. hide restart and the speed number
7. Paste/Upload icon-only (last, because the user wanted those labels)

The minimum window width is now 420 px; at 360 px even the most compact bar can't hold every control. A `--shot [--shot-widths=…]` debug flag opens the app with the real settings and records, at each width, whether the bar is inside the window and ✕ is visible. Verified at 420, 520, 649, 806 and 1000 px (dev build and the installed build).
