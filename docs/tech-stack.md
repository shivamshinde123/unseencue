# Tech Stack

| Concern | Choice | Why |
|---|---|---|
| App shell | Electron | Native window flags (always-on-top, frameless, transparent, `setContentProtection`) |
| UI | Plain HTML/CSS/JS + design tokens (renderer/tokens.css) | Fonts, colours, marker styles are just CSS; no framework needed |
| Fonts | `@fontsource/dm-sans`, `@fontsource/geist` | Bundled, so the look works offline |
| Markdown | `marked` | Small, well known; colour syntax handled by a tiny pre-processor |
| Voice activity | Web Audio `AnalyserNode` with an adaptive noise floor | Built in, offline; works on any mic without tuning |
| Head tracking | `@mediapipe/tasks-vision` Face Landmarker | Runs locally on CPU, gives head pitch/yaw |
| Settings | JSON file `%APPDATA%\teleprompter\settings.json` (atomic write) | No dependency needed |
| Packaging | `electron-builder` (portable .exe) | One file, no installer needed |

Previous prototype: Python 3.12 + tkinter + PyInstaller (see decision.md).
