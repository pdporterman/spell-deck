import * as S from './store.js';
import * as nav from './nav.js';
import * as D from './data.js';
import { el, clear } from './ui.js';
import { applySettings } from './theme.js';
import { openCharForm } from './charform.js';
import * as sheet from './pages/sheet.js';
import * as counters from './pages/counters.js';
import * as traits from './pages/traits.js';
import * as classes from './pages/class.js';
import * as spells from './pages/spells.js';
import * as resources from './pages/resources.js';
import * as ref from './pages/ref.js';
import * as settings from './pages/settings.js';

const CHAR_MODS = { sheet, counters, traits, class: classes, spells, resources };
const $page = document.getElementById('page');
const $title = document.getElementById('title');
const $drawer = document.getElementById('drawer');
const $scrim = document.getElementById('scrim');
const $menuBtn = document.getElementById('menu-btn');
const $edit = document.getElementById('edit-slot');
const $bottom = document.getElementById('bottombar');
let cleanup = null;

function openDrawer(v) {
  $drawer.classList.toggle('open', v);
  $scrim.classList.toggle('open', v);
  $drawer.setAttribute('aria-hidden', String(!v));
  $menuBtn.setAttribute('aria-expanded', String(v));
}
$menuBtn.addEventListener('click', () => { buildMenu(); openDrawer(!$drawer.classList.contains('open')); });
$scrim.addEventListener('click', () => openDrawer(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape') openDrawer(false); });

// ---------- side menu ----------
function buildMenu() {
  const st = S.get(), view = st.last.view;
  clear($drawer);
  const open = id => st.menuOpen === id;
  const toggle = id => { st.menuOpen = open(id) ? null : id; S.save(); buildMenu(); };
  const item = (label, v, cid, active) => el('button', { class: 'menu-item' + (active ? ' active' : ''), text: label, on: { click: () => { nav.go(v, cid); openDrawer(false); } } });

  $drawer.append(el('div', { class: 'drawer-head' }, el('span', { class: 'brand', text: 'Spell Deck' }),
    el('button', { class: 'icon-btn', 'aria-label': 'Close menu', text: '✕', on: { click: () => openDrawer(false) } })));
  const scroll = el('nav', { class: 'drawer-scroll', 'aria-label': 'Main' });
  scroll.append(el('div', { class: 'menu-title' }, el('span', { text: 'Characters' }),
    el('button', { class: 'btn plus', text: '+', 'aria-label': 'New character', title: 'New character', on: { click: () => { openDrawer(false); openCharForm(); } } })));
  const chars = Object.values(st.chars);
  if (!chars.length) scroll.append(el('p', { class: 'muted small pad', text: 'No characters yet. Tap + to make one.' }));
  for (const c of chars) {
    const isOpen = open(c.id);
    scroll.append(el('div', { class: 'menu-group indent' },
      el('div', { class: 'menu-row' },
        el('button', { class: 'menu-item head', 'aria-expanded': String(isOpen), on: { click: () => toggle(c.id) } },
          el('span', { class: 'chev', text: isOpen ? '▾' : '▸' }), c.name, st.cur === c.id ? el('span', { class: 'dot', title: 'Active character' }) : null),
        isOpen ? el('button', { class: 'btn small', text: 'Edit', on: { click: () => { openDrawer(false); openCharForm(c.id); } } }) : null),
      isOpen ? el('div', { class: 'submenu' }, c.pages.map(p => item(S.CHAR_PAGES[p], p, c.id, view === p && st.cur === c.id))) : null));
  }
  scroll.append(el('div', { class: 'menu-group ref' },
    el('div', { class: 'menu-row' }, el('button', { class: 'menu-item head', 'aria-expanded': String(open('ref')), on: { click: () => toggle('ref') } }, el('span', { class: 'chev', text: open('ref') ? '▾' : '▸' }), 'Reference')),
    open('ref') ? el('div', { class: 'submenu' }, Object.entries(S.REF_PAGES).map(([v, l]) => item(l, v, null, view === v))) : null));
  $drawer.append(scroll, el('div', { class: 'drawer-foot' }, el('button', { class: 'gear' + (view === 'settings' ? ' active' : ''), 'aria-label': 'Settings', title: 'Settings', on: { click: () => { nav.go('settings'); openDrawer(false); } } }, '⚙ ', el('span', { text: 'Settings' }))));
}

// ---------- bottom banner: dots + name on the left, previous/next on the right ----------
function buildBottom(list, labels, current) {
  clear($bottom);
  if (list.length < 2) { $bottom.hidden = list.length === 0; if (list.length === 1) $bottom.append(el('div', { class: 'pinfo' }, el('span', { class: 'pname', text: labels[list[0]] }))); return; }
  $bottom.hidden = false;
  const i = list.indexOf(current);
  const go = v => nav.go(v);
  $bottom.append(
    el('div', { class: 'pinfo' },
      el('div', { class: 'dots', role: 'tablist' }, list.map(v => el('button', { class: 'dotb' + (v === current ? ' on' : ''), role: 'tab', 'aria-selected': String(v === current), 'aria-label': labels[v], on: { click: () => go(v) } }, el('i')))),
      el('span', { class: 'pname', text: labels[current] })),
    el('div', { class: 'pnav' },
      el('button', { class: 'btn', text: '‹', 'aria-label': 'Previous page', disabled: i <= 0, on: { click: () => go(list[i - 1]) } }),
      el('button', { class: 'btn', text: '›', 'aria-label': 'Next page', disabled: i >= list.length - 1, on: { click: () => go(list[i + 1]) } })));
}

// ---------- render ----------
function render() {
  const st = S.get();
  applySettings();
  if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
  let view = st.last.view, ch = S.cur();
  if (S.CHAR_PAGES[view]) {
    if (!ch) view = 'ref-spells';
    else if (!ch.pages.includes(view)) view = ch.pages.includes(ch.page) ? ch.page : ch.pages[0];
  } else if (!S.REF_PAGES[view] && view !== 'settings') view = 'ref-spells';
  st.last = { view };
  const y = window.scrollY;
  const wrap = el('div', { class: 'page' });
  clear($page); $page.append(wrap);
  clear($edit);

  const isChar = !!S.CHAR_PAGES[view];
  let mod;
  if (view === 'settings') { $title.textContent = 'Settings'; mod = settings; }
  else if (isChar) { $title.textContent = ch.name; mod = CHAR_MODS[view]; }
  else { $title.textContent = 'Reference'; }
  document.title = $title.textContent + ' — Spell Deck';

  const redraw = () => render();
  let ret;
  if (view === 'settings') ret = settings.mount(wrap, {});
  else if (isChar) {
    ret = mod.mount(wrap, { ch, redraw, view });
    if (mod.edit) $edit.append(el('button', { class: 'btn', text: 'Edit', 'aria-label': 'Edit ' + S.CHAR_PAGES[view], on: { click: () => mod.edit({ ch, redraw }) } }));
  } else ret = ref.mount(wrap, view);
  if (typeof ret === 'function') cleanup = ret;

  if (isChar) buildBottom(ch.pages, S.CHAR_PAGES, view);
  else if (view === 'settings') { clear($bottom); $bottom.hidden = true; }
  else buildBottom(Object.keys(S.REF_PAGES), S.REF_PAGES, view);
  wrap.style.paddingBottom = '';
  buildMenu();
  window.scrollTo(0, y);
}
nav.registerRender(render);
applySettings();
render();
D.init(false, () => { D.indexData(); render(); });

// no pinch/double-tap zoom while tapping quickly (touch-action in the stylesheet handles double-tap)
document.addEventListener('gesturestart', e => e.preventDefault());
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
