const $ = (id) => document.getElementById(id);
let S = await window.api.getSettings();

const get = (obj, key) => key.split('.').reduce((o, k) => o?.[k], obj);
const patchFor = (key, value) => key.split('.').reduceRight((v, k) => ({ [k]: v }), value);
const set = (key, value) => window.api.setSettings(patchFor(key, value));

// ---------- preset colours (custom picker always comes last) ----------
const PALETTES = {
  text: [['White', '#ffffff'], ['Bone', '#ededed'], ['Ash', '#c2c2c2'], ['Gold', '#ffd166'], ['Sky', '#4cc9f0'],
    ['Mint', '#90be6d'], ['Coral', '#ff8c69'], ['Rose', '#ff4d6d'], ['Lavender', '#a29bfe']],
  bg: [['Void', '#0a0a0a'], ['Graphite', '#161616'], ['Black', '#000000'], ['Charcoal', '#2a2a2a'], ['Navy', '#0f172a'],
    ['Plum', '#1e1b2e'], ['Forest', '#0f1f17'], ['Paper', '#f5f5f0'], ['White', '#ffffff']],
  highlight: [['Frost', '#d4d4d4'], ['Violet', '#6b62f2'], ['Gold', '#ffd166'], ['Sky', '#4cc9f0'], ['Mint', '#90be6d'],
    ['Coral', '#ff8c69'], ['Rose', '#ff4d6d'], ['Slate', '#686868']],
  accent: [['Violet', '#6b62f2'], ['White', '#ffffff'], ['Sky', '#4cc9f0'], ['Mint', '#90be6d'], ['Gold', '#ffd166'],
    ['Coral', '#ff8c69'], ['Rose', '#ff4d6d']],
};

for (const row of document.querySelectorAll('.swatches[data-palette]')) {
  const picker = row.querySelector('input[type=color]');
  for (const [name, hex] of PALETTES[row.dataset.palette]) {
    const b = document.createElement('button');
    b.className = 'swatch';
    b.style.setProperty('--c', hex);
    b.title = name;
    b.setAttribute('aria-label', name);
    b.dataset.hex = hex;
    b.onclick = () => {
      picker.value = hex;
      picker.dispatchEvent(new Event('input', { bubbles: true }));
    };
    row.insertBefore(b, picker);
  }
  const wrap = document.createElement('label');
  wrap.className = 'custom';
  wrap.title = 'Custom colour';
  row.insertBefore(wrap, picker);
  wrap.append(picker, Object.assign(document.createElement('span'), { textContent: 'Custom' }));
}

function markSwatches() {
  for (const row of document.querySelectorAll('.swatches[data-palette]')) {
    const picker = row.querySelector('input[type=color]');
    const value = (get(S, picker.dataset.key) || '').toLowerCase();
    let preset = false;
    for (const b of row.querySelectorAll('.swatch')) {
      const on = !picker.disabled && b.dataset.hex === value;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
      preset ||= on;
    }
    row.querySelector('.custom').classList.toggle('on', !picker.disabled && !!value && !preset);
  }
}

// ---------- generic binding: every [data-key] control writes its setting ----------
function show(el) {
  const out = el.parentElement.querySelector('output') || (el.id && $(el.id + '-out'));
  if (!out) return;
  out.textContent = out.hasAttribute('data-pct') ? Math.round(el.value * 100) + '%' : el.value + (out.dataset.unit || (el.id === 'fontSize' ? ' px' : ''));
}

function fill() {
  for (const el of document.querySelectorAll('[data-key]')) {
    const v = get(S, el.dataset.key);
    if (el.type === 'checkbox') el.checked = !!v;
    else if (el.type === 'radio') el.checked = el.value === v;
    else if (el.type === 'color') el.value = v || '#000000';
    else el.value = v ?? '';
    show(el);
  }
  for (const cb of document.querySelectorAll('[data-bg]')) {
    const on = !!S.headings[cb.dataset.bg].bg;
    cb.checked = on;
    const row = document.querySelector(`[data-bg-row="${cb.dataset.bg}"]`);
    row.classList.toggle('off', !on);
    row.querySelector('input').disabled = !on;
  }
  for (const c of document.querySelectorAll('[data-preset-for] .chip')) {
    c.classList.toggle('on', +c.dataset.value === get(S, c.parentElement.dataset.presetFor));
  }
  markSwatches();
  $('home-state').textContent = S.window.home
    ? 'Home is your saved spot. Picking a webcam position above replaces it.'
    : 'No saved spot yet: it opens at the webcam position you picked.';
}

for (const el of document.querySelectorAll('[data-key]')) {
  el.addEventListener(el.type === 'checkbox' || el.type === 'radio' ? 'change' : 'input', async () => {
    show(el);
    const value = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value;
    if (el.dataset.key === 'window.anchor') {
      // Choosing where the webcam is moves the teleprompter there and drops the old saved spot.
      await window.api.setSettings({ window: { anchor: value, home: null } });
      return window.api.resetWindow();
    }
    set(el.dataset.key, value);
  });
}
for (const cb of document.querySelectorAll('[data-bg]')) {
  cb.addEventListener('change', () => {
    const picker = document.querySelector(`[data-bg-row="${cb.dataset.bg}"] input`);
    if (cb.checked && picker.value === '#000000') picker.value = '#d4d4d4';
    set(`headings.${cb.dataset.bg}.bg`, cb.checked ? picker.value : '');
  });
}
for (const c of document.querySelectorAll('[data-preset-for] .chip')) {
  c.onclick = () => set(c.parentElement.dataset.presetFor, +c.dataset.value);
}

// ---------- mic meter (level comes from the prompter window) ----------
const DB_MIN = -80, DB_MAX = -10;
const dbToPct = (db) => Math.max(0, Math.min(100, ((db - DB_MIN) / (DB_MAX - DB_MIN)) * 100));
let trigger = null;
function placeThreshold() {
  $('meter-th').hidden = trigger == null;
  if (trigger != null) $('meter-th').style.left = dbToPct(trigger) + '%';
}
let lastLevel = 0;
window.api.onLevel((db, talking, trig) => {
  lastLevel = performance.now();
  trigger = trig;
  placeThreshold();
  $('meter-fill').style.width = dbToPct(db) + '%';
  $('meter-db').textContent = Math.round(db) + ' dB';
  document.querySelector('.meter').classList.toggle('talking', talking);
  $('meter-state').textContent = talking ? 'Hearing you: scrolling' : 'Quiet: paused';
});
setInterval(() => {
  if (performance.now() - lastLevel > 1000) {
    $('meter-fill').style.width = '0';
    trigger = null;
    placeThreshold();
    $('meter-db').textContent = '';
    $('meter-state').textContent = S.voice.enabled ? 'Waiting for the microphone…' : 'Turn voice follow on to see your mic level';
  }
}, 500);

// ---------- fonts & cameras ----------
// Bundled fonts first, then everything installed on this PC. Each name is shown in its own font.
const BUNDLED = ['DM Sans', 'Geist'];
const COMMON = ['Segoe UI', 'Arial', 'Calibri', 'Cambria', 'Candara', 'Consolas', 'Constantia', 'Corbel', 'Georgia',
  'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Bahnschrift', 'Segoe Print', 'Comic Sans MS', 'Lucida Console', 'Palatino Linotype'];
let fonts = [];

async function listFonts(fromClick = false) {
  let installed = [];
  try {
    installed = [...new Set((await queryLocalFonts()).map((f) => f.family))].sort((a, b) => a.localeCompare(b));
  } catch (e) {
    console.log('[fonts] installed-font list unavailable: ' + e.name);
  }
  if (!installed.length) installed = COMMON.filter((f) => document.fonts.check(`16px "${f}"`));
  $('font-more-row').hidden = installed.length > COMMON.length || fromClick;
  fonts = [...BUNDLED.map((f) => ({ name: f, group: 'Built in' })),
    ...installed.filter((f) => !BUNDLED.includes(f)).map((f) => ({ name: f, group: 'On this PC' }))];
  console.log('[fonts] ' + fonts.length + ' fonts listed');
  renderFonts();
}

// A normal dropdown: "Built in" and "On this PC" groups, each option drawn in its own font.
function renderFonts() {
  const sel = $('font-select');
  const groups = {};
  for (const f of fonts) {
    groups[f.group] ||= Object.assign(document.createElement('optgroup'), { label: f.group });
    const o = new Option(f.name, f.name);
    o.style.fontFamily = `"${f.name}", var(--font-ui)`;
    groups[f.group].append(o);
  }
  if (!fonts.some((f) => f.name === S.fontFamily)) {
    // A font that isn't in the list (e.g. uninstalled since) still shows as selected.
    (groups['Built in'] ||= Object.assign(document.createElement('optgroup'), { label: 'Built in' })).append(new Option(S.fontFamily, S.fontFamily));
  }
  sel.replaceChildren(...Object.values(groups));
  sel.value = S.fontFamily;
  sel.style.fontFamily = `"${S.fontFamily}", var(--font-ui)`;
}
$('font-select').addEventListener('change', (e) => set('fontFamily', e.target.value));
$('font-more').onclick = () => listFonts(true); // a click lets Windows show its font-access prompt if it needs one

// ---------- live preview: the real prompter page, at the prompter's real size, scaled to fit ----------
async function fitPreview() {
  const b = (await window.api.getBounds()) || { width: 800, height: 300 };
  const frame = $('preview');
  frame.style.width = b.width + 'px';
  frame.style.height = b.height + 'px';
  const stage = $('stage');
  const scale = Math.min(1, (stage.clientWidth - 48) / b.width, (stage.clientHeight * 0.62) / b.height);
  $('frame-wrap').style.width = b.width * scale + 'px';
  $('frame-wrap').style.height = b.height * scale + 'px';
  frame.style.transform = `scale(${scale})`;
}
addEventListener('resize', fitPreview);
setInterval(fitPreview, 1500); // follows the prompter if you resize it

async function listCameras() {
  const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
  const sel = $('cam');
  sel.replaceChildren(new Option('Default camera', ''));
  devices.forEach((d, i) => sel.add(new Option(d.label || `Camera ${i + 1}`, d.deviceId)));
  sel.value = S.head.deviceId || '';
}

// ---------- position & privacy ----------
$('rescan').onclick = listCameras;
$('set-home').onclick = async () => {
  await window.api.setHome();
  $('home-state').textContent = 'Saved. The teleprompter will open exactly here next time.';
};
$('reset-window').onclick = () => window.api.resetWindow();
$('reset').onclick = async () => { if (confirm('Reset the look and behaviour to defaults? Your script, position and home spot are kept.')) { S = await window.api.resetSettings(); fill(); } };
$('test').onclick = async () => {
  $('shot-wait').hidden = false;
  $('shot-box').hidden = true;
  const url = await window.api.captureTest();
  $('shot-wait').hidden = true;
  if (!url) return;
  $('shot').src = url;
  $('shot-box').hidden = false;
  $('shot-msg').textContent = 'This is what Zoom, Meet, Teams or OBS would capture where your teleprompter sits. If you see your desktop or other windows here, and not your script, it is hidden.';
};

// macOS wording (the HTML is written for Windows)
if (window.api.platform === 'darwin') {
  $('cam-hint').textContent =
    'macOS lets several apps share the camera, so this usually just works. If not, pick another camera here (in OBS: Start Virtual Camera → "OBS Virtual Camera").';
  $('hidden-hint').textContent =
    'On macOS the teleprompter and this window ask to be left out of screen capture. Most recorders and screen shares respect this, but on macOS 15.4 and later some apps that use Apple’s newer capture system can still see it. Use the check below with the app you record with. The check needs Screen Recording permission (System Settings › Privacy & Security › Screen Recording).';
}

window.api.onSettings((s) => { S = s; fill(); renderFonts(); });
fill();
fitPreview();
listFonts();
listCameras();
