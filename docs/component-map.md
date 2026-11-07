# Component Map

| Component | File | Responsibility | Talks to |
|---|---|---|---|
| Main | main.js | Creates capture-hidden windows, owns settings.json, file dialog, capture test | All windows via IPC |
| Bridge | preload.js | Exposes `window.api` | Main |
| Prompter | renderer/prompter.js | Renders script, scrolls, countdown, marker, status, resume position | markdown, voice, head, Bridge |
| Markdown | renderer/markdown.js | `marked` + colour shorthand | — |
| Voice gate | renderer/voice.js | Mic RMS → talking / silent | Prompter |
| Head gate | renderer/head.js | Webcam → face landmarks → looking / away | Prompter |
| Settings UI | renderer/settings.js | Edits settings, lists fonts/cameras, runs capture test | Bridge |
