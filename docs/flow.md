# Code Flow

1. `app.whenReady` → register `app://bundle/` file handler → load settings.json → create prompter window (top-centre under webcam, always on top, `setContentProtection(true)`).
2. Prompter boot → `getSettings` → apply CSS variables → load last script → start voice/head gates if enabled.
3. Play → head re-calibrates → countdown → `tick()` each frame: `pos += speed*dt` only if playing && !counting && talking && looking.
4. Any settings change (settings window or toolbar) → `settings:set` → main merges + saves → broadcasts `settings` to every window → prompter re-applies and starts/stops gates.
5. Position saved every 3 s while playing, on pause, wheel, close → `positions[path]`.
6. `--selftest`: loads sample script, loads face model, main captures screen + window, writes PNGs to %TEMP%, exits 0/1.
