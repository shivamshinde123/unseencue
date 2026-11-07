# File / Folder Structure

```
main.js                  Electron main: windows, settings file, IPC, capture test, app:// protocol
preload.js               window.api bridge (contextIsolation on, no node in renderer)
renderer/
  tokens.css             design tokens, fonts, shared pill/slider styles
  tooltip.js             themed tooltips (both windows)
  index.html, prompter.css, prompter.js   prompter window (scroll engine, editor, resize, controls, gates)
  settings.html, settings.css, settings.js   settings window
  markdown.js            script text -> HTML (+ colour shorthand)
  voice.js               mic voice-activity gate
  head.js                MediaPipe look-away gate
  sample-script.txt      used by self-test
models/face_landmarker.task   MediaPipe model (npm run fetch-model)
scripts/fetch-model.mjs
test/markdown.test.mjs, test/voice.test.mjs   npm test
release/                 packaged portable exe, `Unseencue <version>.exe` (npm run dist)
docs/                    these docs
```
