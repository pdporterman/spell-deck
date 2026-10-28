// Class Abilities: features for every class level the character has (plus the chosen subclass).
import * as S from '../store.js';
import { D, ckey } from '../data.js';
import { el, modal } from '../ui.js';
import { gcard, classFeatCard, cfeats, isSubPH, ordLvl, rail, col, section, collapseTools } from '../cards.js';
import { openClassEditor } from '../pickers.js';
import { expSlots } from '../rules.js';
import { sgn } from '../ui.js';

export const title = 'Class Abilities';

function openLevels(ch, k, redraw) {
  const ck = ckey(k), lv = ch.classes[ck] || 0, hid = new Set(ch.lvf[ck] || []), boxes = [];
  const apply = () => { const h = boxes.filter(b => !b.checked).map(b => +b.value); if (h.length) ch.lvf[ck] = h; else delete ch.lvf[ck]; S.save(); redraw(); };
  const grid = el('div', { class: 'lvgrid' });
  for (let i = 1; i <= lv; i++) { const cb = el('input', { type: 'checkbox', value: i, checked: !hid.has(i), on: { change: apply } }); boxes.push(cb); grid.append(el('label', { class: 'lvc' }, cb, String(i))); }
  const all = v => { boxes.forEach(b => { b.checked = v; }); apply(); };
  modal({ title: k.name + ': levels to show', noFocus: true, actions: [{ label: 'Done', kind: 'primary' }],
    body: el('div', { class: 'form' }, el('p', { class: 'muted small', text: "Untick the levels whose cards you don't need on screen. Levels you gain later show up automatically." }),
      el('div', { class: 'toolbar' }, el('button', { class: 'btn small', text: 'Select all', on: { click: () => all(true) } }), el('button', { class: 'btn small', text: 'Clear', on: { click: () => all(false) } })), grid) });
}

const SKILLS = S.STATS.flatMap(a => a[2]);
// "Expertise" / "Scholar" features: pick from the skills you are proficient in
function expertiseBox(ch, id, n, redraw) {
  const picks = ch.picks[id] = ch.picks[id] || [];
  const others = new Set(Object.entries(ch.picks).filter(([k]) => k !== id && (k.startsWith('cf:') || k.startsWith('sf:'))).flatMap(([, v]) => v));
  const prof = SKILLS.filter(x => (ch.pf[x] || 0) >= 1);
  const wrap = el('div', { class: 'choice' });
  for (let i = 0; i < n; i++) {
    const opts = prof.filter(x => !others.has(x) && (!picks.includes(x) || picks[i] === x));
    wrap.append(el('label', null, 'Expertise skill' + (n > 1 ? ' ' + (i + 1) : ''), el('select', { 'aria-label': 'Expertise skill', on: { change: e => { picks[i] = e.target.value || null; S.save(); redraw(); } } },
      el('option', { value: '', text: prof.length ? 'Choose…' : 'Mark proficiencies on the Character Sheet first' }), opts.map(x => el('option', { value: x, text: x, selected: picks[i] === x })))));
  }
  return wrap;
}
// Metamagic, Eldritch Invocations, Maneuvers, Fighting Styles...: pick from the 5etools list, only the chosen ones show as cards
function optionBox(ch, owner, ownerName, prog, lv, clsLv, redraw) {
  const n = prog.counts[lv - 1] || 0;
  if (!n) return null;
  const id = 'of:' + owner + ':' + prog.name, picks = ch.picks[id] = ch.picks[id] || [];
  const pool = D.opts.filter(o => o.types.some(t => prog.types.includes(t)));
  const byName = nm => pool.find(o => o.name === nm);
  const done = picks.slice(0, n).filter(Boolean).length;
  const wrap = el('div', { class: 'optbox' }, el('h4', { class: 'hi', text: prog.name + ' · ' + done + ' of ' + n + ' chosen' }));
  const sels = el('div', { class: 'choice' }), cards = [];
  for (let i = 0; i < n; i++) {
    const taken = new Set(picks.slice(0, n).filter((x, j) => x && j !== i && !(byName(x) || {}).rep));
    sels.append(el('label', null, prog.name.replace(/s$/, '') + ' ' + (i + 1), el('select', { 'aria-label': prog.name + ' ' + (i + 1), on: { change: e => { picks[i] = e.target.value || null; S.save(); redraw(); } } },
      el('option', { value: '', text: pool.length ? 'Choose…' : 'Loading… (open the app online once)' }),
      pool.map(o => { const lock = o.lvl > clsLv, dup = taken.has(o.name); return el('option', { value: o.name, selected: picks[i] === o.name, disabled: (lock || dup) && picks[i] !== o.name, text: o.name + (lock ? ' (level ' + o.lvl + ')' : '') + (o.source !== 'XPHB' && o.source !== 'PHB' ? ' · ' + o.source : '') }); }))));
    const o = byName(picks[i]);
    if (o) cards.push(gcard({ t: o.name, meta: prog.name + (o.pre ? ' · Requires ' + o.pre : ''), body: o.text, foot: o.source, mid: id + ':' + o.name, ch }));
  }
  wrap.append(sels, cards.length ? col(cards) : '');
  return wrap;
}
const openTables = new Set();
function classTable(k, lv) {
  const cols = (k.tbl && k.tbl.cols) || [];
  const names = Array.from({ length: 20 }, (_, i) => cfeats(k).filter(f => f.level === i + 1).map(f => f.name).join(', ') || '—');
  const head = ['Level', 'Prof.', 'Features'].concat(cols.map(c => c.l));
  const rows = Array.from({ length: 20 }, (_, i) => el('tr', { class: i + 1 === lv ? 'me' : '' }, el('td', { text: String(i + 1) }), el('td', { text: sgn(2 + Math.floor(i / 4)) }), el('td', { class: 'f', text: names[i] }), cols.map(c => el('td', { text: c.v[i] == null ? '—' : String(c.v[i]) }))));
  return el('div', { class: 'tbl-wrap' }, el('table', { class: 'tbl' }, el('thead', null, el('tr', null, head.map(h => el('th', { text: h })))), el('tbody', null, rows)));
}

export function mount(root, { ch, redraw }) {
  const list = D.classes.filter(k => (ch.classes[ckey(k)] || 0) > 0);
  if (!list.length) { root.append(el('div', { class: 'empty' }, el('p', { text: 'No classes yet.' }), el('p', { class: 'small', text: 'Use Edit (top right) to add class levels.' }))); return; }
  const rev = S.get().settings.newestFirst;
  root.append(el('p', { class: 'who' }, 'Total level: ', el('b', { text: String(S.total(ch)) }), ' / 20'), collapseTools(root, ch));
  list.forEach(k => {
    const ck = ckey(k), lv = ch.classes[ck], sv = ch.subs[ck], s = sv && k.subs.find(x => x.short + '|' + x.source === sv);
    const hid = new Set((ch.lvf[ck] || []).filter(x => x <= lv));
    const base = cfeats(k).filter(f => f.level <= lv && !hid.has(f.level)).map(f => ({ ...f, own: 0 }));
    const subf = s ? s.features.filter(f => f.level <= lv && !hid.has(f.level)).map(f => ({ ...f, own: 1 })) : [];
    const cards = ordLvl(base.concat(subf), rev).map(f => {
      const mid = f.own ? 'sf:' + ck + '|' + s.short + '|' + s.source + ':' + f.level + ':' + f.name : 'cf:' + ck + ':' + f.level + ':' + f.name;
      const card = f.own ? classFeatCard(f, s.name, 1, k.name, mid, ch) : classFeatCard(f, k.name, 0, k.name, mid, ch);
      const n = expSlots(f.name);
      if (n) card.querySelector('.body').before(expertiseBox(ch, mid, n, redraw));
      return card;
    });
    const lvb = el('button', { class: 'lvb', text: hid.size ? 'Levels · ' + (lv - hid.size) + ' of ' + lv : 'Levels', on: { click: () => openLevels(ch, k, redraw) } });
    const inner = el('div');
    const tbl = classTable(k, lv); tbl.hidden = !openTables.has(ck);
    const tb = el('button', { class: 'lvb', text: 'Table', 'aria-expanded': String(!tbl.hidden), on: { click: () => { tbl.hidden = !tbl.hidden; tbl.hidden ? openTables.delete(ck) : openTables.add(ck); tb.setAttribute('aria-expanded', String(!tbl.hidden)); } } });
    inner.append(tbl);
    for (const pr of k.opt || []) { const b = optionBox(ch, ck, k.name, pr, lv, lv, redraw); if (b) inner.append(b); }
    if (s) for (const pr of s.opt || []) { const b = optionBox(ch, ck + '|' + s.short, s.name, pr, lv, lv, redraw); if (b) inner.append(b); }
    const pick = k.features.find(f => isSubPH(f) && !/feature$/i.test(f.name));
    if (!s && k.subs.length && pick && lv >= pick.level) inner.append(el('p', { class: 'who', text: 'Level ' + pick.level + ': choose a ' + k.name + ' subclass with Edit (top right).' }));
    inner.append(cards.length ? (list.length === 1 ? col(cards) : rail(cards)) : el('div', { class: 'empty', text: hid.size ? 'No cards for the levels you selected. Use Levels to show more.' : 'No features at this level.' }));
    root.append(section(ch, 'sec:cl:' + ck, k.name + ' ' + lv + (s ? ' · ' + s.name : ''), inner, el('span', { style: 'display:flex;gap:.4rem' }, tb, lvb)));
  });
}
export const edit = ({ ch, redraw }) => openClassEditor(ch, redraw);
