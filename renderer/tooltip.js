// Themed tooltips in place of the plain white Windows ones.
// Any element with a title gets it moved to data-tip (so the native tooltip never shows) and
// aria-label (so screen readers still read it). Works for elements added later too.

const tip = document.createElement('div');
tip.className = 'tooltip';
tip.setAttribute('role', 'tooltip');
tip.hidden = true;
document.body.append(tip);

function adopt(el) {
  const t = el.getAttribute('title');
  if (!t) return;
  el.dataset.tip = t;
  if (!el.hasAttribute('aria-label') && !el.textContent.trim()) el.setAttribute('aria-label', t);
  el.removeAttribute('title');
}
document.querySelectorAll('[title]').forEach(adopt);
new MutationObserver((muts) => {
  for (const m of muts) {
    if (m.type === 'attributes') adopt(m.target);
    else for (const n of m.addedNodes) if (n.nodeType === 1) { adopt(n); n.querySelectorAll?.('[title]').forEach(adopt); }
  }
}).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['title'] });

let current = null;
let timer = null;

function place(el) {
  const r = el.getBoundingClientRect();
  tip.style.left = '0px';
  tip.style.top = '0px';
  const w = tip.offsetWidth, h = tip.offsetHeight;
  const gap = 8;
  let top = r.top - h - gap; // above by default
  let below = false;
  if (top < 6) { top = r.bottom + gap; below = true; }
  const left = Math.min(Math.max(r.left + r.width / 2 - w / 2, 6), innerWidth - w - 6);
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
  tip.dataset.side = below ? 'below' : 'above';
  tip.style.setProperty('--arrow-x', r.left + r.width / 2 - left + 'px');
}

function show(el) {
  current = el;
  tip.textContent = el.dataset.tip;
  tip.hidden = false;
  tip.classList.remove('in');
  place(el);
  requestAnimationFrame(() => tip.classList.add('in'));
}
function hide() {
  clearTimeout(timer);
  current = null;
  tip.classList.remove('in');
  tip.hidden = true;
}

document.addEventListener('pointerover', (e) => {
  const el = e.target.closest?.('[data-tip]');
  if (el === current) return;
  hide();
  if (el) timer = setTimeout(() => show(el), 450);
});
document.addEventListener('pointerdown', hide);
document.addEventListener('focusin', (e) => {
  const el = e.target.closest?.('[data-tip]');
  if (el && el.matches(':focus-visible')) show(el);
});
document.addEventListener('focusout', hide);
addEventListener('blur', hide);
document.addEventListener('scroll', hide, true);

// for the self-test
window.__showTip = (selector) => { const el = document.querySelector(selector); if (el) show(el); return !!el; };
