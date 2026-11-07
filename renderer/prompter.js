import { marked } from '../node_modules/marked/lib/marked.esm.js';
import { renderScript } from './markdown.js';
import { startVoice } from './voice.js';
import { startHead, loadLandmarker, CameraBusyError } from './head.js';

const $ = (id) => document.getElementById(id);
const content = $('content');
const params = new URLSearchParams(location.search);
const SELFTEST = params.has('selftest');
// ?preview = the live preview inside the Settings window (an iframe): same look, no controls, loops the script.
const PREVIEW = params.has('preview');
const api = window.api ?? window.parent.api;
if (PREVIEW) document.body.classList.add('preview');

let S = await api.getSettings();
let script = null;        // { key, name, text, kind }
let pos = 0;              // scroll offset in px
let playing = false;      // user pressed play
let counting = false;     // countdown running
let talking = true;       // voice gate (true when voice follow off)
let looking = true;       // head gate (true when head follow off)
let voice = null, head = null;
let voiceBusy = false, headBusy = false; // guards against double-starting while permission prompts are open

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(f, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};
const icon = (btn, name) => btn.querySelector('use').setAttribute('href', '#i-' + name);

// ---------- settings -> look ----------
function applySettings() {
  const r = document.documentElement.style;
  r.setProperty('--font', `'${S.fontFamily}'`);
  // Headings use Geist with the default font (the design's pairing); any other font applies to headings too.
  r.setProperty('--font-h', S.fontFamily === 'DM Sans' ? 'var(--font-head)' : `'${S.fontFamily}', var(--font-head)`);
  r.setProperty('--size', S.fontSize + 'px');
  r.setProperty('--line', S.lineHeight);
  r.setProperty('--fg', S.textColor);
  r.setProperty('--bg-rgb', hexToRgb(S.bgColor));
  r.setProperty('--bg-a', S.opacity);
  r.setProperty('--win-a', S.windowOpacity);
  r.setProperty('--col', S.columnWidth + '%');
  r.setProperty('--pad', S.edgePadding + 'px');
  r.setProperty('--marker-rgb', hexToRgb(S.marker.color));
  r.setProperty('--marker-pos', S.marker.position + '%');
  r.setProperty('--h-bg-a', S.headingBgOpacity);
  for (const h of ['h1', 'h2', 'h3']) {
    r.setProperty(`--${h}`, S.headings[h].color);
    r.setProperty(`--${h}-bg`, S.headings[h].bg || 'transparent');
    r.setProperty(`--${h}-size`, S.headings[h].size / 100);
  }
  document.body.dataset.marker = S.marker.style;
  $('speed').value = S.speed;
  $('speed-val').textContent = S.speed;
  $('voice').classList.toggle('on', S.voice.enabled);
  $('head').classList.toggle('on', S.head.enabled);
  layout();
}

function markerY() { return innerHeight * (S.marker.position / 100); }
function endPos() {
  const last = content.lastElementChild;
  return last ? Math.max(0, last.offsetTop + last.offsetHeight - markerY()) : 0;
}
function layout() {
  // Centre of the first line sits on the marker.
  content.style.paddingTop = Math.max(0, markerY() - (S.fontSize * S.lineHeight) / 2) + 'px';
  pos = Math.min(pos, endPos());
  draw();
}
function draw() {
  content.style.transform = `translateY(${-pos}px)`;
  if (!script) return ($('eta').textContent = '');
  const end = endPos();
  const pct = end ? Math.round((pos / end) * 100) : 0;
  const secs = Math.max(0, Math.round((end - pos) / S.speed));
  $('eta').textContent = `${pct}% · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

// ---------- script ----------
function loadScript(s) {
  script = s;
  content.innerHTML = renderScript(s.text, marked);
  layout();
  const saved = S.positions[s.key];
  pos = saved ? saved * endPos() : 0;
  draw();
  setPlaying(false);
  if (saved > 0.01 && saved < 0.99) flash('Resumed where you left off', 2500);
}

// ---------- paste / type editor ----------
function openEditor(text = script?.text ?? '') {
  setPlaying(false);
  $('editor').hidden = false;
  document.body.classList.add('editing');
  $('ed-cancel').hidden = !script;
  const ta = $('editor-text');
  ta.value = text;
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
  document.body.classList.add('show-bar');
}
function closeEditor() {
  $('editor').hidden = true;
  document.body.classList.remove('editing');
  updateStatus();
}
$('ed-done').onclick = async () => {
  const text = $('editor-text').value;
  if (!text.trim()) return $('editor-text').focus();
  if (text !== script?.text || script?.kind !== 'draft') loadScript(await api.saveDraft(text));
  closeEditor();
};
$('ed-cancel').onclick = closeEditor;
$('ed-open').onclick = () => uploadFile();
$('ed-paste').onclick = async () => {
  // Inserts at the cursor, like Ctrl+V.
  const text = await api.readClipboard();
  if (!text) return flashEditorHint('Your clipboard has no text. Copy your script first.');
  const ta = $('editor-text');
  ta.focus();
  ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
};
let edMsgTimer = null;
function flashEditorHint(msg) {
  $('ed-msg').textContent = msg;
  clearTimeout(edMsgTimer);
  edMsgTimer = setTimeout(() => ($('ed-msg').textContent = ''), 4000);
}

// Formatting help: a panel of examples; clicking one inserts it at the cursor.
$('ed-tips').onclick = () => {
  const open = $('tips').hidden;
  $('tips').hidden = !open;
  $('ed-tips').setAttribute('aria-expanded', String(open));
};
for (const tip of document.querySelectorAll('.tip')) {
  tip.onclick = () => {
    const ta = $('editor-text');
    ta.focus();
    ta.setRangeText(tip.dataset.snip, ta.selectionStart, ta.selectionEnd, 'end');
  };
}

// ---------- the two ways in: paste and upload ----------
async function pasteClipboard() {
  const text = await api.readClipboard();
  if (!text.trim()) { openEditor(''); return flashEditorHint('Your clipboard has no text. Copy your script, then press Ctrl+V here.'); }
  loadScript(await api.saveDraft(text));
  closeEditor();
  flash('Pasted from clipboard · ✎ to edit', 2500);
}
async function uploadFile() {
  const s = await api.openScript();
  if (s) { loadScript(s); closeEditor(); flash('Loaded ' + s.name, 2000); }
}
if (!PREVIEW) api.onMenu((cmd) => (cmd === 'paste' ? pasteClipboard() : cmd === 'upload' ? uploadFile() : openEditor()));

// Drag a .txt / .md file onto the window.
let dragDepth = 0;
addEventListener('dragenter', (e) => { if (e.dataTransfer?.types.includes('Files')) { dragDepth++; $('drop').hidden = false; } });
addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('drop').hidden = true; } });
addEventListener('dragover', (e) => e.preventDefault());
addEventListener('drop', async (e) => {
  e.preventDefault();
  if (PREVIEW) return;
  dragDepth = 0;
  $('drop').hidden = true;
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  const path = api.pathForFile(file);
  if (path) loadScript(await api.loadPath(path));
  else loadScript(await api.saveDraft(await file.text()));
  closeEditor();
  flash('Loaded ' + file.name, 2000);
});
$('editor-text').addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && script) closeEditor();
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('ed-done').click();
});
// Ctrl+V anywhere in the window (outside the editor) opens the editor with the pasted text.
addEventListener('paste', (e) => {
  if (PREVIEW || !$('editor').hidden) return;
  const text = e.clipboardData?.getData('text/plain');
  if (text) { e.preventDefault(); openEditor(text); }
});

// ---------- status ----------
let flashTimer = null;
function flash(msg, ms) {
  $('status').textContent = msg;
  $('status').hidden = false;
  clearTimeout(flashTimer);
  if (ms) flashTimer = setTimeout(updateStatus, ms);
}
function updateStatus() {
  const msg = !script || counting ? ''
    : !playing ? (pos >= endPos() && pos > 0 ? 'End of script' : 'Paused')
    : !talking ? 'Listening — start talking'
    : !looking ? 'Look at the screen to continue' : '';
  $('status').textContent = msg;
  $('status').hidden = !msg;
  document.body.classList.toggle('show-bar', !script || !playing || !$('editor').hidden);
}

// ---------- play / countdown ----------
let countTimer = null;
function setPlaying(p) {
  playing = p;
  icon($('play'), p ? 'pause' : 'play');
  if (!p) { clearInterval(countTimer); counting = false; $('countdown').hidden = true; savePos(); }
  updateStatus();
}
function start() {
  if (!script) return openEditor('');
  if (pos >= endPos()) pos = 0;
  head?.calibrate(); // you're looking at the screen during the countdown
  let n = S.countdown;
  if (n <= 0) return setPlaying(true);
  counting = true;
  setPlaying(true);
  counting = true;
  const cd = $('countdown');
  const num = cd.querySelector('span');
  cd.hidden = false;
  num.textContent = n;
  countTimer = setInterval(() => {
    n -= 1;
    if (n > 0) { num.textContent = n; num.style.animation = 'none'; num.offsetHeight; num.style.animation = ''; return; }
    clearInterval(countTimer);
    cd.hidden = true;
    counting = false;
    updateStatus();
  }, 1000);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (playing && !counting && talking && looking && script) {
    pos += S.speed * dt;
    const end = endPos();
    if (pos >= end) {
      if (PREVIEW) pos = 0; // the preview just loops
      else { pos = end; setPlaying(false); }
    }
    draw();
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

function savePos() {
  if (!script || PREVIEW) return;
  const end = endPos();
  api.savePosition(script.key, end ? pos / end : 0);
}
setInterval(() => { if (playing) savePos(); }, 3000);

// ---------- voice / head ----------
async function syncVoice() {
  if (S.voice.enabled && !voice && !voiceBusy) {
    voiceBusy = true;
    try {
      talking = false;
      if (!(await api.askMedia('microphone'))) throw Object.assign(new Error('Microphone permission denied'), { name: 'NotAllowedError' });
      voice = await startVoice(S.voice,
        (t) => { talking = t; $('voice').classList.toggle('hearing', t); updateStatus(); },
        (db, t, trig) => api.sendLevel(db, t, trig));
      $('voice').classList.remove('err');
    } catch (e) {
      voice = null; talking = true;
      $('voice').classList.add('err');
      flash(e.name === 'NotAllowedError'
        ? (api.platform === 'darwin'
          ? 'Microphone blocked. Allow Unseencue in System Settings › Privacy & Security › Microphone.'
          : 'Microphone blocked. Allow desktop apps in Windows Settings › Privacy › Microphone.')
        : 'Microphone unavailable: ' + e.message, 7000);
    } finally { voiceBusy = false; }
  } else if (!S.voice.enabled && voice) {
    voice.stop(); voice = null; talking = true;
    $('voice').classList.remove('hearing');
  } else voice?.update(S.voice);
  updateStatus();
}

async function syncHead() {
  if (S.head.enabled && !head && !headBusy) {
    headBusy = true;
    try {
      flash('Starting head follow — look at the screen');
      if (!(await api.askMedia('camera'))) throw new Error(api.platform === 'darwin' ? 'allow Unseencue in System Settings › Privacy & Security › Camera' : 'camera permission denied');
      head = await startHead($('cam'), S.head, (l) => { looking = l; updateStatus(); });
      $('head').classList.remove('err');
      flash('Head follow on', 1500);
    } catch (e) {
      head = null; looking = true;
      $('head').classList.add('err');
      flash(e instanceof CameraBusyError
        ? 'Camera in use by your recorder. In Settings, pick OBS Virtual Camera or another camera.'
        : 'Head follow unavailable: ' + e.message, 7000);
    } finally { headBusy = false; }
  } else if (!S.head.enabled && head) {
    head.stop(); head = null; looking = true;
  } else head?.update(S.head);
  updateStatus();
}

// ---------- controls ----------
$('edit').onclick = () => openEditor();
$('paste').onclick = pasteClipboard;
$('open').onclick = uploadFile;
$('play').onclick = () => (playing ? setPlaying(false) : start());
$('restart').onclick = () => { setPlaying(false); pos = 0; draw(); savePos(); };
$('speed').oninput = (e) => { S.speed = +e.target.value; $('speed-val').textContent = S.speed; draw(); };
$('speed').onchange = () => api.setSettings({ speed: S.speed });
$('voice').onclick = () => api.setSettings({ voice: { enabled: !S.voice.enabled } });
$('head').onclick = () => api.setSettings({ head: { enabled: !S.head.enabled } });
$('settings').onclick = () => api.openSettings();
$('close').onclick = () => { savePos(); api.close(); };

// Mouse wheel nudges the script (handy while paused).
$('viewport').addEventListener('wheel', (e) => { pos = Math.max(0, Math.min(endPos(), pos + e.deltaY * 0.5)); draw(); savePos(); }, { passive: true });
addEventListener('resize', () => { layout(); fitBar(); });

// Keep every control (including ✕) inside the window: try the full bar, then compact it a step at a time.
const BAR_STEPS = ['bar-c1', 'bar-c2', 'bar-c3', 'bar-c4', 'bar-c5', 'bar-c6', 'bar-c7'];
function fitBar() {
  const bar = $('bar');
  const room = $('card').clientWidth - 28;
  document.body.classList.remove(...BAR_STEPS);
  for (const step of BAR_STEPS) {
    if (bar.scrollWidth <= room) break;
    document.body.classList.add(step);
  }
}

// ---------- resize from any edge or corner ----------
for (const h of document.querySelectorAll('.rz')) {
  h.addEventListener('pointerdown', async (e) => {
    e.preventDefault();
    h.setPointerCapture(e.pointerId);
    const dir = h.dataset.dir;
    const sx = e.screenX, sy = e.screenY;
    const b = await api.getBounds();
    let frame = 0;
    const move = (ev) => {
      const dx = ev.screenX - sx, dy = ev.screenY - sy;
      const n = { ...b };
      if (dir.includes('e')) n.width = b.width + dx;
      if (dir.includes('s')) n.height = b.height + dy;
      if (dir.includes('w')) { n.width = Math.max(420, b.width - dx); n.x = b.x + b.width - n.width; }
      if (dir.includes('n')) { n.height = Math.max(160, b.height - dy); n.y = b.y + b.height - n.height; }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => api.setBounds(n));
    };
    const up = () => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); };
    h.addEventListener('pointermove', move);
    h.addEventListener('pointerup', up);
  });
}

api.onSettings(async (s) => {
  const prevDevice = S.head.deviceId;
  const scriptChanged = s.source !== S.source || s.lastFile !== S.lastFile || s.draft !== S.draft;
  S = s;
  applySettings();
  if (PREVIEW) { if (scriptChanged) await previewScript(); return; }
  if (head && s.head.deviceId !== prevDevice) { head.stop(); head = null; }
  await syncVoice();
  await syncHead();
});

// ---------- boot ----------
async function previewScript() {
  const s = (await api.lastScript()) || (await api.sampleScript());
  const keep = pos;
  loadScript(s);
  pos = Math.min(keep, endPos());
  playing = true; // scroll continuously so speed, marker and spacing changes are visible
  updateStatus();
}

applySettings();
fitBar();
document.fonts?.ready.then(fitBar); // label widths change once the fonts load
if (PREVIEW) {
  await previewScript();
} else if (SELFTEST) {
  const report = { ok: false };
  try {
    loadScript(await api.sampleScript());
    report.headings = content.querySelectorAll('h1,h2,h3').length;
    report.colourTags = content.querySelectorAll('.tag').length;
    report.endPos = Math.round(endPos());
    await loadLandmarker();
    report.landmarker = 'loaded';
    try {
      // Mic probe: proves the stream is live (not silent) and shows the room's noise floor.
      // (time-boxed: a CI Mac with no microphone permission may never answer)
      const v = await Promise.race([startVoice({ ...S.voice }, () => {}), new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { name: 'Timeout' })), 6000))]);
      await new Promise((r) => setTimeout(r, 1500));
      report.mic = { context: v.state, peakDb: Math.round(v.peakDb), marginDb: S.voice.marginDb, floorDb: Math.round(v.floorDb) };
      v.stop();
    } catch (e) { report.mic = 'unavailable: ' + e.name; }
    const view = params.get('selftest');
    if (view === 'paste') {
      openEditor('');
      await api.selftestPressPaste('# Pasted heading\nPasted line');
      report.ctrlV = $('editor-text').value;
      // Ctrl+V on the prompter itself (editor closed) should open the editor with the text.
      script = script || { key: 'x', text: '' };
      closeEditor();
      await api.selftestPressPaste('# Pasted outside the editor');
      report.ctrlVOutside = !$('editor').hidden && $('editor-text').value;
    }
    if (view === 'table') { const t = content.querySelector('table'); pos = Math.max(0, t.offsetTop - markerY() - 80); draw(); report.table = t.offsetWidth <= content.clientWidth; }
    else if (view === 'editor') { openEditor(script.text); const ta = $('editor-text'); ta.setSelectionRange(0, 0); ta.scrollTop = 0; }
    else if (view === 'plan') { const h = content.querySelectorAll('h2')[0]; pos = Math.max(0, h.offsetTop - 22); draw(); }
    else if (view === 'hero') { const h = content.querySelector('h1'); pos = Math.max(0, h.offsetTop - 22); draw(); }
    else if (!['table', 'hero', 'plan'].includes(view)) { pos = endPos() * 0.12; draw(); }
    document.body.classList.add('show-bar');
    if (view === 'tooltip') report.tooltip = window.__showTip?.('#paste');
    if (view === 'settings' || view === 'walk') await api.openSettings();
    await new Promise((r) => setTimeout(r, 1200));
    report.ok = report.headings > 0 && report.colourTags > 0 && report.endPos > 0;
  } catch (e) {
    report.error = String(e?.stack || e);
  }
  await api.selftestDone(report);
} else {
  const s = await api.lastScript();
  if (s) loadScript(s);
  else openEditor('');
  await syncVoice();
  await syncHead();
}
