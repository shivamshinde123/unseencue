// Electron main process: windows, settings file, script loading, capture test.
const { app, BrowserWindow, ipcMain, dialog, screen, protocol, net, desktopCapturer, session, nativeTheme, clipboard, Menu, systemPreferences, shell } = require('electron');
const IS_MAC = process.platform === 'darwin';
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

// --selftest[=editor|settings]: render, probe mic + face model, save screenshots to %TEMP%, exit.
const SELFTEST_ARG = process.argv.find((a) => a.startsWith('--selftest'));
const SELFTEST = !!SELFTEST_ARG;
const SELFTEST_VIEW = SELFTEST_ARG?.split('=')[1] || 'script';
const STYLE_VERSION = 3; // bump when the default look changes, so old saved styles get replaced

// Serve app files over app://bundle/... so fetch() works for the MediaPipe wasm, model and fonts.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

const DEFAULTS = {
  styleVersion: STYLE_VERSION,
  fontFamily: 'DM Sans',
  fontSize: 36,
  lineHeight: 1.45,
  textColor: '#ededed',
  bgColor: '#0a0a0a',
  windowOpacity: 0.85, // whole window (text, colours, controls): see what's behind it
  opacity: 0.92, // background only, on top of windowOpacity
  columnWidth: 88, // % of window width
  edgePadding: 32, // px kept clear on the left and right, even at 100% column width
  headingBgOpacity: 0.12,
  headings: {
    h1: { color: '#ffffff', bg: '#d4d4d4', size: 130 }, // size = % of the body text size
    h2: { color: '#ffffff', bg: '', size: 110 },
    h3: { color: '#c2c2c2', bg: '', size: 70 },
  },
  marker: { style: 'arrows', color: '#6b62f2', position: 32 }, // position = % from top
  speed: 40, // px per second
  countdown: 3,
  voice: { enabled: false, marginDb: 16, silenceMs: 800 },
  head: { enabled: false, deviceId: '', sensitivity: 0.12 },
  // Where the webcam is. 'home' = exact spot saved with "Save this spot as home"; it wins over the anchor.
  window: { anchor: 'top-center', home: null },
  source: 'file', // 'file' | 'draft'
  lastFile: '',
  draft: '', // pasted / typed script
  positions: {}, // script key -> scroll fraction
};
// Kept when the style is reset (they're content, not look).
const KEEP = ['lastFile', 'positions', 'draft', 'source', 'speed', 'countdown', 'window'];

const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');
let settings = structuredClone(DEFAULTS);

function deepMerge(base, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') deepMerge(base[k], v);
    else base[k] = v;
  }
  return base;
}

function keepOnly(s) {
  return Object.fromEntries(KEEP.filter((k) => k in s).map((k) => [k, s[k]]));
}

function loadSettings() {
  let saved = {};
  try {
    saved = JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
  } catch {
    /* first run or unreadable file */
  }
  if (saved.styleVersion !== STYLE_VERSION) saved = keepOnly(saved);
  settings = deepMerge(structuredClone(DEFAULTS), saved);
  settings.styleVersion = STYLE_VERSION;
}

function saveSettings() {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  // Write to a temp file then rename, so a crash mid-write can't corrupt settings.
  const tmp = settingsPath() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(settings, null, 2));
  fs.renameSync(tmp, settingsPath());
}

let prompter = null;
let settingsWin = null;
const MIN = { width: 420, height: 160 }; // narrower than 420 the control bar can't fit every button

function onSomeScreen(b) {
  return screen.getAllDisplays().some(({ workArea: w }) =>
    b.x + 40 < w.x + w.width && b.x + b.width - 40 > w.x && b.y >= w.y - 10 && b.y + 40 < w.y + w.height);
}

// The prompter's home: right under the webcam. Uses the saved spot if there is one (and it's still on a
// connected screen), otherwise the chosen webcam position on the main screen.
function homeBounds() {
  const home = settings.window?.home;
  if (home && onSomeScreen(home)) return home;
  const { workArea: wa } = screen.getPrimaryDisplay();
  const width = Math.round(wa.width * 0.42);
  const height = Math.round(wa.height * 0.3);
  const anchor = settings.window?.anchor || 'top-center';
  const x = anchor === 'top-left' ? wa.x + 16
    : anchor === 'top-right' ? wa.x + wa.width - width - 16
    : wa.x + Math.round((wa.width - width) / 2);
  return { x, y: wa.y + 8, width, height };
}

const ICON = path.join(__dirname, 'renderer', 'icon.png');

function hiddenWindow(opts) {
  const win = new BrowserWindow({
    icon: ICON, // taskbar / Alt-Tab icon (the exe and shortcuts get build/icon.ico at packaging time)
    ...opts,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  // Uses WDA_EXCLUDEFROMCAPTURE on Windows 10 2004+: visible to you, invisible to OBS/Zoom/Teams/etc.
  win.setContentProtection(true);
  win.webContents.on('console-message', (_e, level, message) => {
    if (level >= 2 || SELFTEST) console.log(`[renderer] ${message}`);
  });
  // Electron has no right-click menu by default, so right-click → Paste didn't exist.
  win.webContents.on('context-menu', (_e, params) => {
    const items = params.isEditable
      ? [
          { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
          { role: 'cut', enabled: params.editFlags.canCut },
          { role: 'copy', enabled: params.editFlags.canCopy },
          { role: 'paste', enabled: params.editFlags.canPaste },
          { type: 'separator' }, { role: 'selectAll' },
        ]
      : win === prompter
        ? [
            { label: 'Paste script from clipboard', click: () => win.webContents.send('menu', 'paste') },
            { label: 'Upload script file…', click: () => win.webContents.send('menu', 'upload') },
            { label: 'Type / edit script', click: () => win.webContents.send('menu', 'edit') },
          ]
        : params.selectionText ? [{ role: 'copy' }] : [];
    if (items.length) Menu.buildFromTemplate(items).popup({ window: win });
  });
  return win;
}

function createPrompter() {
  prompter = hiddenWindow({
    ...homeBounds(),
    frame: false,
    transparent: true, // lets the card have rounded corners
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false, // resizing is done by our own edge/corner handles (transparent windows can't use native ones)
    alwaysOnTop: true,
    title: 'Unseencue',
  });
  prompter.setAlwaysOnTop(true, 'screen-saver');
  if (IS_MAC) prompter.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  prompter.loadURL('app://bundle/renderer/index.html' + (SELFTEST ? `?selftest=${SELFTEST_VIEW}` : ''));
  prompter.on('closed', () => {
    prompter = null;
    settingsWin?.close();
  });
}

// Settings is a large window (settings list on the left, live preview on the right), a little smaller than the
// screen, centred over the prompter's screen. It stays above the prompter and can be dragged by its title bar.
function settingsBounds() {
  const p = prompter?.getBounds();
  const { workArea: wa } = p ? screen.getDisplayMatching(p) : screen.getPrimaryDisplay();
  const width = Math.round(Math.min(1440, wa.width * 0.9));
  const height = Math.round(Math.min(940, wa.height * 0.9));
  return { x: wa.x + Math.round((wa.width - width) / 2), y: wa.y + Math.round((wa.height - height) / 2), width, height };
}

function openSettings() {
  if (settingsWin) {
    settingsWin.moveTop();
    return settingsWin.focus();
  }
  settingsWin = hiddenWindow({
    ...settingsBounds(),
    minWidth: 900,
    minHeight: 560,
    movable: true,
    title: 'Unseencue · Settings',
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
  });
  // Same "screen-saver" level as the prompter, one step higher, so the prompter can never cover it.
  settingsWin.setAlwaysOnTop(true, 'screen-saver', 1);
  settingsWin.loadURL('app://bundle/renderer/settings.html');
  settingsWin.on('closed', () => (settingsWin = null));
}

function broadcast() {
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send('settings', settings);
}

function fileScript(file) {
  return { key: file, name: path.basename(file), text: fs.readFileSync(file, 'utf8'), kind: 'file' };
}
function draftScript() {
  return { key: 'draft', name: 'Pasted script', text: settings.draft, kind: 'draft' };
}

// What a screen recorder sees where the prompter sits. Recorders use the same capture APIs,
// so if this comes back without the script, recordings won't show it either.
async function captureTest() {
  try {
    return await captureTestInner();
  } catch (e) {
    console.log('[capture] unavailable: ' + e.message);
    return null; // e.g. macOS hasn't granted Screen Recording yet
  }
}
async function captureTestInner() {
  if (!prompter) return null;
  const b = prompter.getBounds();
  const display = screen.getDisplayMatching(b);
  const scale = display.scaleFactor;
  const size = { width: Math.round(display.bounds.width * scale), height: Math.round(display.bounds.height * scale) };
  const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: size });
  const src = sources.find((s) => s.display_id === String(display.id)) || sources[0];
  if (!src || src.thumbnail.isEmpty()) return null;
  return src.thumbnail
    .crop({
      x: Math.round((b.x - display.bounds.x) * scale),
      y: Math.round((b.y - display.bounds.y) * scale),
      width: Math.round(b.width * scale),
      height: Math.round(b.height * scale),
    })
    .toDataURL();
}

// ---------- IPC ----------
ipcMain.handle('settings:get', () => settings);
ipcMain.handle('settings:set', (_e, patch) => {
  deepMerge(settings, patch);
  saveSettings();
  broadcast();
  return settings;
});
ipcMain.handle('settings:reset', () => {
  settings = deepMerge(structuredClone(DEFAULTS), keepOnly(settings));
  saveSettings();
  broadcast();
  return settings;
});

ipcMain.handle('script:open', async () => {
  const r = await dialog.showOpenDialog(prompter, {
    title: 'Choose your script',
    filters: [{ name: 'Script', extensions: ['txt', 'md'] }, { name: 'All files', extensions: ['*'] }],
    properties: ['openFile'],
  });
  if (r.canceled || !r.filePaths[0]) return null;
  settings.lastFile = r.filePaths[0];
  settings.source = 'file';
  saveSettings();
  return fileScript(r.filePaths[0]);
});
ipcMain.handle('script:last', () => {
  if (settings.source === 'draft' && settings.draft) return draftScript();
  try {
    return settings.lastFile ? fileScript(settings.lastFile) : null;
  } catch {
    return null; // file moved or deleted
  }
});
ipcMain.handle('script:draft', (_e, text) => {
  // Pasted / typed text lives in the app. Opened files are never overwritten.
  if (settings.draft !== text) delete settings.positions.draft;
  settings.draft = text;
  settings.source = 'draft';
  saveSettings();
  return draftScript();
});
ipcMain.handle('script:sample', () => fileScript(path.join(__dirname, 'renderer', 'sample-script.txt')));
ipcMain.handle('position:save', (_e, key, fraction) => {
  settings.positions[key] = fraction;
  saveSettings();
});

ipcMain.handle('window:settings', () => openSettings());
ipcMain.handle('window:close', () => app.quit());
ipcMain.handle('window:reset', () => prompter?.setBounds(homeBounds()));
ipcMain.handle('window:set-home', () => {
  if (!prompter) return null;
  settings.window.home = prompter.getBounds();
  saveSettings();
  broadcast();
  return settings.window.home;
});
ipcMain.handle('window:bounds', () => prompter?.getBounds());
ipcMain.on('window:set-bounds', (_e, b) => {
  if (!prompter) return;
  prompter.setBounds({
    x: Math.round(b.x),
    y: Math.round(b.y),
    width: Math.round(Math.max(MIN.width, b.width)),
    height: Math.round(Math.max(MIN.height, b.height)),
  });
});

// Live mic level from the prompter, shown as a meter in the settings window.
ipcMain.on('voice:level', (_e, db, talking, trigger) => settingsWin?.webContents.send('voice:level', db, talking, trigger));

ipcMain.handle('capture:test', () => captureTest());

// Clipboard read for the Paste buttons (works even if keyboard shortcuts or focus get in the way).
ipcMain.handle('clipboard:read', () => clipboard.readText());
ipcMain.handle('platform', () => process.platform);
// macOS: microphone/camera need the user's OK (System Settings › Privacy & Security). Windows/Linux: nothing to ask.
ipcMain.handle('media:ask', async (_e, kind) => {
  if (!IS_MAC || SELFTEST) return true; // CI Macs have no one to click "Allow"
  const status = systemPreferences.getMediaAccessStatus(kind);
  if (status === 'granted') return true;
  if (status === 'denied' || status === 'restricted') return false;
  return systemPreferences.askForMediaAccess(kind);
});
ipcMain.handle('open:privacy', (_e, kind) => {
  const pane = { microphone: 'Privacy_Microphone', camera: 'Privacy_Camera', screen: 'Privacy_ScreenCapture' }[kind];
  if (IS_MAC && pane) shell.openExternal(`x-apple.systempreferences:com.apple.preference.security?${pane}`);
  else if (kind === 'microphone') shell.openExternal('ms-settings:privacy-microphone');
  else if (kind === 'camera') shell.openExternal('ms-settings:privacy-webcam');
});
ipcMain.handle('script:load-path', (_e, file) => {
  // A .txt/.md file dropped onto the window.
  settings.lastFile = file;
  settings.source = 'file';
  saveSettings();
  return fileScript(file);
});

// Self-test only: press a real Ctrl+V in the focused editor, then put the user's clipboard back.
ipcMain.handle('selftest:press-paste', async (_e, text) => {
  const before = clipboard.readText();
  clipboard.writeText(text);
  prompter.focus();
  prompter.webContents.focus();
  if (IS_MAC) {
    prompter.webContents.paste(); // exactly what Edit › Paste / ⌘V does
  } else {
    prompter.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'V', modifiers: ['control'] });
    prompter.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'V', modifiers: ['control'] });
  }
  await new Promise((r) => setTimeout(r, 400));
  clipboard.writeText(before);
});
// ---------- --selftest=walk: click through every setting like a user, screenshot each one ----------
// Uses real mouse clicks (sendInputEvent) so focus/scroll behaviour matches a person using the app.
// The user's settings and window position are restored afterwards.
const WALK = [
  ['01-window-opacity-40', ['range', '#windowOpacity', 0.4]],
  ['02-background-opacity-30', ['range', '#opacity', 0.3]],
  ['03-font-georgia', ['select', '#font-select', 'Georgia']],
  ['04-text-size-64', ['range', '#fontSize', 64]],
  ['05-line-spacing-2', ['range', '#lineHeight', 2]],
  ['06-column-width-100', ['range', '#columnWidth', 100]],
  ['07-edge-padding-120', ['range', '#edgePadding', 120]],
  ['08-text-colour-gold', ['click', '.swatches:has(input[data-key="textColor"]) .swatch[data-tip="Gold"]']],
  ['09-text-colour-custom', ['color', 'input[data-key="textColor"]', '#ff66cc']],
  ['10-background-navy', ['click', '.swatches:has(input[data-key="bgColor"]) .swatch[data-tip="Navy"]']],
  ['11-h1-size-200', ['range', '#h1size', 200]],
  ['12-h1-colour-rose', ['click', '.swatches:has(input[data-key="headings.h1.color"]) .swatch[data-tip="Rose"]']],
  ['13-h1-background-off', ['click', 'input[data-bg="h1"]']],
  ['14-h2-background-violet', ['click', 'input[data-bg="h2"]'], ['wait', 300], ['click', '.swatches[data-bg-row="h2"] .swatch[data-tip="Violet"]']],
  ['15-h3-size-colour', ['range', '#h3size', 150], ['click', '.swatches:has(input[data-key="headings.h3.color"]) .swatch[data-tip="Sky"]']],
  ['16-heading-bg-strength-60', ['range', '#hbg', 0.6]],
  ['17-marker-line', ['click', 'input[name="marker.style"][value="line"] + span']],
  ['18-marker-arrows', ['click', 'input[name="marker.style"][value="arrows"] + span']],
  ['19-marker-band', ['click', 'input[name="marker.style"][value="band"] + span']],
  ['20-marker-none', ['click', 'input[name="marker.style"][value="none"] + span']],
  ['21-marker-glow-mint', ['click', 'input[name="marker.style"][value="glow"] + span'], ['click', '.swatches:has(input[data-key="marker.color"]) .swatch[data-tip="Mint"]']],
  ['22-marker-height-70', ['range', '#mpos', 70]],
  ['23-speed-150', ['range', '#speed', 150]],
  ['24-countdown-5', ['range', '#countdown', 5], ['prompter', "document.getElementById('play').click()"], ['wait', 1300], ['shootPrompter'], ['prompter', "document.getElementById('play').click()"]],
  ['25-voice-on', ['click', 'input[data-key="voice.enabled"]'], ['wait', 2500]],
  ['26-voice-margin-silence', ['range', '#vth', 25], ['range', '#vsil', 2000], ['wait', 800]],
  ['27-voice-off', ['click', 'input[data-key="voice.enabled"]']],
  ['28-head-on', ['click', 'input[data-key="head.enabled"]'], ['wait', 5000], ['shootPrompter']],
  ['29-head-off', ['click', 'input[data-key="head.enabled"]']],
  ['30-anchor-top-left', ['click', 'input[name="window.anchor"][value="top-left"] + span'], ['wait', 600]],
  ['31-anchor-top-right', ['click', 'input[name="window.anchor"][value="top-right"] + span'], ['wait', 600]],
  ['32-save-home', ['click', '#set-home']],
  ['33-move-back-home', ['click', '#reset-window'], ['wait', 400]],
  ['34-hidden-check', ['click', '#test'], ['wait', 2500]],
  ['35-reset-look', ['js', 'void (window.confirm = () => true)'], ['click', '#reset'], ['wait', 600]],
];

async function walkSettings() {
  const out = path.join(app.getPath('temp'), 'tp-walk');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const snapshot = structuredClone(settings);
  const boundsBefore = prompter.getBounds();
  const sw = settingsWin.webContents;
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const run = (js) => sw.executeJavaScript(js);
  const shot = async (wc, file, width) => {
    const img = await wc.capturePage();
    fs.writeFileSync(path.join(out, file), (width ? img.resize({ width }) : img).toPNG());
  };
  // Scroll the settings column (never the page) so the control is on screen, then report its centre.
  const reveal = (sel) => run(`(() => {
    const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return null;
    const panel = document.querySelector('.panel');
    const r0 = el.getBoundingClientRect(), pr = panel.getBoundingClientRect();
    if (r0.top < pr.top + 80 || r0.bottom > pr.bottom - 80) panel.scrollTop += r0.top - pr.top - 220;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  })()`);
  const log = [];
  await pause(1500);
  try {
  for (const [name, ...actions] of WALK) {
    const entry = { name, ok: true };
    for (const [kind, a, b] of actions) {
      if (kind === 'wait') await pause(a);
      else if (kind === 'js') await run(a);
      else if (kind === 'prompter') await prompter.webContents.executeJavaScript(a);
      else if (kind === 'shootPrompter') await shot(prompter.webContents, `${name}-prompter.png`);
      else {
        const pt = await reveal(a);
        if (!pt) { entry.ok = false; entry.missing = a; continue; }
        if (kind === 'click') {
          settingsWin.focus();
          for (const type of ['mouseDown', 'mouseUp']) sw.sendInputEvent({ type, x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
        } else {
          const ev = kind === 'select' ? 'change' : 'input';
          await run(`(() => { const el = document.querySelector(${JSON.stringify(a)}); el.value = ${JSON.stringify(b)};
            el.dispatchEvent(new Event('${ev}', { bubbles: true })); })()`);
        }
      }
    }
    await pause(700);
    // The page scrolling itself (instead of the settings column) is what turned the window black.
    entry.page = await run(`({ pageScroll: document.scrollingElement.scrollTop, layoutTop: Math.round(document.querySelector('.layout').getBoundingClientRect().top) })`);
    if (entry.page.pageScroll !== 0 || entry.page.layoutTop !== 0) entry.ok = false;
    entry.prompterBounds = prompter.getBounds();
    entry.now = structuredClone({ font: settings.fontFamily, size: settings.fontSize, marker: settings.marker, anchor: settings.window.anchor, home: !!settings.window.home, voice: settings.voice, head: settings.head.enabled });
    await shot(sw, `${name}.png`, 1100);
    log.push(entry);
    fs.writeFileSync(path.join(out, 'walk-log.json'), JSON.stringify(log, null, 2));
  }
  } finally {
    // Always put the user's own settings and window back, even if a step throws.
    settings = snapshot;
    saveSettings();
    broadcast();
    prompter.setBounds(boundsBefore);
  }
  console.log('[walk] steps:', log.length, 'failed:', JSON.stringify(log.filter((e) => !e.ok).map((e) => e.name)), 'output:', out);
}

// Self-test: is a protected window really left out of screen capture on this OS?
// Two solid red windows, one with content protection and one without; capture the screen and look for red in each.
// control visible + protected invisible = hidden works; both invisible = capture not permitted (inconclusive).
async function protectionProbe() {
  const { workArea: wa } = screen.getPrimaryDisplay();
  const make = (x, protect) => {
    const w = new BrowserWindow({ x, y: wa.y + wa.height - 260, width: 200, height: 140, frame: false, show: true, backgroundColor: '#ff0000', alwaysOnTop: true, focusable: false, skipTaskbar: true });
    w.setAlwaysOnTop(true, 'screen-saver', 2);
    if (protect) w.setContentProtection(true);
    w.loadURL('data:text/html,<body style="margin:0;background:%23ff0000"></body>');
    return w;
  };
  const prot = make(wa.x + 40, true);
  const ctrl = make(wa.x + 300, false);
  await new Promise((r) => setTimeout(r, 1500));
  const result = { os: `${process.platform} ${process.getSystemVersion()}` };
  try {
    const d = screen.getPrimaryDisplay();
    const size = { width: Math.round(d.bounds.width * d.scaleFactor), height: Math.round(d.bounds.height * d.scaleFactor) };
    const src = (await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: size })).find((s) => s.display_id === String(d.id)) || null;
    const redShare = (win) => {
      if (!src || src.thumbnail.isEmpty()) return null;
      const b = win.getBounds();
      const img = src.thumbnail.crop({ x: Math.round((b.x - d.bounds.x + 20) * d.scaleFactor), y: Math.round((b.y - d.bounds.y + 20) * d.scaleFactor), width: Math.round(160 * d.scaleFactor), height: Math.round(100 * d.scaleFactor) });
      const px = img.toBitmap(); // BGRA
      let red = 0;
      for (let i = 0; i < px.length; i += 4) if (px[i + 2] > 200 && px[i + 1] < 70 && px[i] < 70) red++;
      return Math.round((100 * red) / (px.length / 4));
    };
    result.protectedRedPct = redShare(prot);
    result.controlRedPct = redShare(ctrl);
    result.verdict =
      result.controlRedPct == null || result.controlRedPct < 50 ? 'inconclusive (capture not permitted or blocked)'
        : result.protectedRedPct < 5 ? 'HIDDEN from capture' : 'VISIBLE in capture';
    if (src) fs.writeFileSync(path.join(app.getPath('temp'), 'tp-probe-capture.png'), src.thumbnail.resize({ width: 1200 }).toPNG());
  } catch (e) {
    result.verdict = 'inconclusive: ' + e.message;
  }
  prot.destroy();
  ctrl.destroy();
  return result;
}

ipcMain.handle('selftest:done', async (_e, report) => {
  if (SELFTEST_VIEW === 'script') report.captureProbe = await protectionProbe();
  if (SELFTEST_VIEW === 'walk' && settingsWin) await walkSettings();
  const shot = await captureTest();
  console.log('[selftest] renderer report:', JSON.stringify(report));
  console.log('[selftest] bounds:', JSON.stringify({ prompter: prompter?.getBounds(), settings: settingsWin?.getBounds(), workArea: screen.getPrimaryDisplay().workArea }));
  if (shot) {
    // Recorder's view vs. what you see, for a manual side-by-side check.
    const out = app.getPath('temp');
    fs.writeFileSync(path.join(out, 'tp-recorder-view.png'), Buffer.from(shot.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(out, `tp-your-view-${SELFTEST_VIEW}.png`), (await prompter.webContents.capturePage()).toPNG());
    if (settingsWin) {
      fs.writeFileSync(path.join(out, 'tp-settings-view.png'), (await settingsWin.webContents.capturePage()).toPNG());
      await settingsWin.webContents.executeJavaScript("document.querySelector('.panel').scrollTop = 900");
      await new Promise((r) => setTimeout(r, 300));
      fs.writeFileSync(path.join(out, 'tp-settings-view-mid.png'), (await settingsWin.webContents.capturePage()).toPNG());
      await settingsWin.webContents.executeJavaScript("document.querySelector('.panel').scrollTop = 1e6");
      await new Promise((r) => setTimeout(r, 300));
      fs.writeFileSync(path.join(out, 'tp-settings-view-bottom.png'), (await settingsWin.webContents.capturePage()).toPNG());
    }
    console.log('[selftest] images saved in', out);
  }
  if (!process.argv.includes('--keep-open')) app.exit(report.ok ? 0 : 1);
});

// The app was renamed from "Teleprompter" to "Unseencue", which moves its data folder.
// Carry the old settings (script, positions, look, home spot) over once.
function migrateOldSettings() {
  const old = path.join(app.getPath('appData'), 'teleprompter', 'settings.json');
  if (!fs.existsSync(settingsPath()) && fs.existsSync(old) && path.resolve(old) !== path.resolve(settingsPath())) {
    fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
    fs.copyFileSync(old, settingsPath());
  }
}

// Same ID as the installer's Start-menu shortcut, so Windows groups the taskbar button with it and shows our icon.
if (process.platform === 'win32') app.setAppUserModelId('local.unseencue');

function buildMenu() {
  if (!IS_MAC) {
    // Keeps Ctrl+X/C/V/A/Z working in every window (the menu bar itself stays hidden).
    return Menu.buildFromTemplate([{ role: 'editMenu' }]);
  }
  // macOS always shows a menu bar: give it the usual app menu, with Settings on ⌘,
  return Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Settings…', accelerator: 'Cmd+,', click: () => openSettings() },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'Window',
      submenu: [
        { label: 'Move Back Home', accelerator: 'Cmd+0', click: () => prompter?.setBounds(homeBounds()) },
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
  ]);
}

app.whenReady().then(() => {
  migrateOldSettings();
  nativeTheme.themeSource = 'dark';
  Menu.setApplicationMenu(buildMenu());
  if (IS_MAC) app.setAboutPanelOptions({ applicationName: 'Unseencue', copyright: 'MIT License © 2026 Shivam Shinde', website: 'https://shivamshinde123.github.io/unseencue/' });
  const allowed = new Set(['media', 'local-fonts', 'clipboard-read', 'clipboard-sanitized-write']);
  const fromApp = (url) => typeof url === 'string' && url.startsWith('app://bundle/');
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb, details) => cb(allowed.has(perm) && fromApp(details.requestingUrl || wc.getURL())));
  session.defaultSession.setPermissionCheckHandler((wc, perm, origin) => allowed.has(perm) && fromApp((origin || wc?.getURL() || '') + '/'));

  protocol.handle('app', (req) => {
    const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '');
    const file = path.normalize(path.join(__dirname, rel));
    if (!file.startsWith(__dirname)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  loadSettings();
  createPrompter();
  // --shot: open normally (your real settings), save what the window looks like after 4 s, then quit. For debugging layout.
  if (process.argv.includes('--shot')) {
    setTimeout(async () => {
      await prompter.webContents.executeJavaScript("document.body.classList.add('show-bar')");
      await new Promise((r) => setTimeout(r, 400));
      fs.writeFileSync(path.join(app.getPath('temp'), 'tp-first-open.png'), (await prompter.webContents.capturePage()).toPNG());
      console.log('[shot] bounds', JSON.stringify(prompter.getBounds()));
      // --shot-widths=360,480,...: also check the control bar at other window widths
      const arg = process.argv.find((x) => x.startsWith('--shot-widths='));
      for (const w of arg ? arg.split('=')[1].split(',').map(Number) : []) {
        prompter.setBounds({ ...prompter.getBounds(), width: w });
        await new Promise((r) => setTimeout(r, 500));
        const fit = await prompter.webContents.executeJavaScript(
          "(() => { const b = document.getElementById('bar').getBoundingClientRect(), c = document.getElementById('card').getBoundingClientRect(), x = document.getElementById('close').getBoundingClientRect(); return { steps: [...document.body.classList].filter((k) => k.startsWith('bar-c')).length, barInside: b.left >= c.left && b.right <= c.right, closeVisible: x.width > 0 && x.right <= c.right - 8 }; })()");
        console.log('[shot] width', w, JSON.stringify(fit));
        fs.writeFileSync(path.join(app.getPath('temp'), `tp-bar-${w}.png`), (await prompter.webContents.capturePage()).toPNG());
      }
      app.exit(0);
    }, 4000);
  }
});

app.on('window-all-closed', () => app.quit());
