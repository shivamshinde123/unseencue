# Environment / Config

No environment variables or secrets.

- Settings: `%APPDATA%\Unseencue\settings.json`, copied once from the old `%APPDATA%\teleprompter` folder (delete to reset; or Settings → Reset look to defaults). `styleVersion` mismatch resets the look but keeps script, positions, speed, countdown and home position.
- CLI flag `--selftest[=script|editor|settings|paste|table|walk]`: renders the sample script, loads the face model, probes the mic, exits 0 = OK. Screenshots go to `%TEMP%` (`tp-recorder-view.png`, `tp-your-view-<view>.png`, `tp-settings-view*.png`).
  - `paste`: presses a real Ctrl+V inside and outside the editor (the clipboard is restored).
  - `walk`: clicks through every setting with real mouse events and saves a screenshot per step plus `walk-log.json` to `%TEMP%\tp-walk`. Your settings and window position are restored afterwards.
- `--keep-open` (with `--selftest`): doesn't quit after the test, e.g. for an external capture check.
- Requires Windows 10 2004+ for capture exclusion.
- Windows Settings → Privacy → Microphone / Camera → "Let desktop apps access" must be on for voice/head follow.
