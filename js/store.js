// Persistent app state (localStorage). Characters, settings and filter choices live here.
const KEY = 'spelldeck.v2';

export const CHAR_PAGES = {
  sheet: 'Character Sheet', counters: 'Counters', traits: 'Features & Traits', class: 'Class Abilities', spells: 'Spells', resources: 'Resources',
};
export const DEFAULT_PAGES = ['spells', 'class', 'traits', 'sheet', 'resources', 'counters'];
export const DEFAULT_ON = ['spells', 'class', 'traits'];   // pages a new character starts with
export const REF_PAGES = { 'ref-spells': 'Spells', 'ref-feats': 'Feats', 'ref-species': 'Species', 'ref-class': 'Class' };
export const STATS = [
  ['str', 'Strength', ['Athletics']], ['dex', 'Dexterity', ['Acrobatics', 'Sleight of Hand', 'Stealth']], ['con', 'Constitution', []],
  ['int', 'Intelligence', ['Arcana', 'History', 'Investigation', 'Nature', 'Religion']],
  ['wis', 'Wisdom', ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival']],
  ['cha', 'Charisma', ['Deception', 'Intimidation', 'Performance', 'Persuasion']],
];

const defaults = () => ({
  settings: { night: false, px: 16, groupFeats: false, newestFirst: false, resAsCounter: false },
  chars: {}, cur: null, last: { view: 'ref-spells' }, menuOpen: 'ref',
  filters: { sf: null, ff: null },
});

export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

// Fill in anything a saved character is missing so every page can rely on it.
export function fixChar(c) {
  c.name = c.name || 'New Character';
  c.pages = Array.isArray(c.pages) && c.pages.length ? c.pages.filter(p => CHAR_PAGES[p]) : DEFAULT_ON.slice();
  if (!c.pages.length) c.pages = DEFAULT_ON.slice();
  c.deck = c.deck || []; c.feats = c.feats || []; c.species = c.species || '';
  c.classes = c.classes || {}; c.subs = c.subs || {}; c.min = c.min || []; c.lvf = c.lvf || {};
  c.pf = c.pf || {}; c.bon = c.bon || {}; c.bon.joat = c.bon.joat ? 1 : 0; c.bon.ra = c.bon.ra ? 1 : 0; c.bon.list = c.bon.list || [];
  c.cts = c.cts || []; c.sc = c.sc || {};
  c.fc = c.fc || {}; c.weapons = c.weapons || []; c.picks = c.picks || {}; c.cb = c.cb || {}; c.res = c.res || {}; c.res.used = c.res.used || {};
  if (!c.hasRes) { c.hasRes = 1; if (!c.pages.includes('resources')) { const i = c.pages.indexOf('counters'); c.pages.splice(i < 0 ? c.pages.length : i, 0, 'resources'); } }
  for (const a of STATS) if (!(c.sc[a[0]] >= 1)) c.sc[a[0]] = 10;
  c.hp = c.hp || {}; c.hp.max = c.hp.max > 0 ? c.hp.max : 0; c.hp.cur = c.hp.cur >= 0 ? c.hp.cur : c.hp.max; c.hp.temp = c.hp.temp > 0 ? c.hp.temp : 0;
  if (!c.pages.includes(c.page)) c.page = c.pages[0];
  return c;
}
export const newChar = name => fixChar({ id: uid(), name, hasRes: 1 });

function migrate() {
  const g = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  let old = null;
  try { old = JSON.parse(g('chars') || 'null'); } catch (e) { /* ignore */ }
  if (!old || typeof old !== 'object') return null;
  const s = defaults();
  const fs = parseFloat(g('fs'));
  s.settings.px = fs >= .8 && fs <= 1.8 ? Math.round(16 * fs) : 16;
  s.settings.night = g('theme') === 'dark';
  s.settings.groupFeats = g('fgrp') === '1';
  s.settings.newestFirst = g('rev') === '1';
  try { s.filters.sf = JSON.parse(g('sf') || 'null'); s.filters.ff = JSON.parse(g('ff') || 'null'); } catch (e) { /* ignore */ }
  for (const [id, o] of Object.entries(old)) {
    const pages = [];
    if (o.useSt) pages.push('sheet');
    pages.push('class', 'traits', 'spells');
    if (o.useCt) pages.push('counters');
    const c = fixChar({ ...o, id, pages, hp: undefined });
    s.chars[id] = c;
  }
  const cur = g('cur');
  s.cur = s.chars[cur] ? cur : null;
  s.menuOpen = s.cur ? s.cur : 'ref';
  s.last = { view: s.cur ? 'class' : 'ref-spells' };
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw), d = defaults();
      const st = { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) }, filters: { ...d.filters, ...(s.filters || {}) } };
      Object.values(st.chars).forEach(fixChar);
      return st;
    }
  } catch (e) { /* storage blocked or corrupt: start fresh */ }
  try { const m = migrate(); if (m) return m; } catch (e) { /* ignore */ }
  return defaults();
}

let state = load();
export const get = () => state;
export function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
export const cur = () => (state.cur && state.chars[state.cur]) || null;
export const total = c => Object.values(c.classes).reduce((a, b) => a + b, 0);

export function addChar(c) { state.chars[c.id] = c; state.cur = c.id; state.menuOpen = c.id; save(); return c; }
export function deleteChar(id) {
  delete state.chars[id];
  if (state.cur === id) { state.cur = null; state.menuOpen = 'ref'; state.last = { view: 'ref-spells' }; }
  save();
}

// ---- export / import one character ----
export const exportChar = c => JSON.stringify({ app: 'spelldeck', v: 2, char: c }, null, 1);
export function importChar(text) {
  const o = JSON.parse(text);
  const raw = o && o.app === 'spelldeck' && o.char ? o.char : null;
  if (!raw || typeof raw !== 'object') throw new Error('not a character file');
  const c = fixChar({ ...raw, id: uid() });
  return addChar(c);
}
// whole-app backup
export const exportAll = () => JSON.stringify({ app: 'spelldeck', v: 2, all: state }, null, 1);
export function importAll(text) {
  const o = JSON.parse(text);
  if (!o || o.app !== 'spelldeck' || !o.all) throw new Error('not a backup file');
  const d = defaults();
  state = { ...d, ...o.all, settings: { ...d.settings, ...(o.all.settings || {}) }, filters: { ...d.filters, ...(o.all.filters || {}) } };
  Object.values(state.chars).forEach(fixChar);
  save();
}
