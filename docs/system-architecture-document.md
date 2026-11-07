# System Architecture

```
Electron main process
 ├─ creates prompter window: frameless, alwaysOnTop, setContentProtection(true), placed top-centre
 ├─ file open dialog → reads .txt → sends text to renderer
 └─ settings load/save (JSON in %APPDATA%)

Renderer (prompter window)
 ├─ markdown → HTML (marked + colour pre-processor)
 ├─ scroll engine: requestAnimationFrame, speed × gates
 │    gates = manual pause AND voice gate AND head gate AND countdown done
 ├─ voice gate: mic → AnalyserNode → RMS > threshold → open; closes after N ms silence
 ├─ head gate: camera → MediaPipe Face Landmarker → head pose → open/close or speed modifier
 └─ control bar + settings panel
```

All processing is local. No network calls, no audio/video saved.

## Constraint: webcam sharing
Windows normally lets one app hold the webcam. If the recorder owns it, head tracking reads the OBS Virtual Camera (OBS → Start Virtual Camera) or a second camera. Mic sharing is fine.
