// Stat math: modifiers, proficiency bonus, skill/save bonuses.
import { total, STATS } from './store.js';
import { D, ckey } from './data.js';

export const abMod = n => Math.floor((n - 10) / 2);
export const pbOf = c => 2 + Math.floor((Math.max(1, total(c)) - 1) / 4);
export const BTO = [['skills', 'All skills'], ['saves', 'All saving throws']].concat(STATS.map(a => [a[0], a[1] + ' checks and saving throw']));
export const btoName = v => (BTO.find(x => x[0] === v) || [0, v])[1];

// Bard level 2+ gives Jack of All Trades automatically.
export const bardLevel = c => Object.entries(c.classes).reduce((a, [k, v]) => a + (k.startsWith('Bard|') ? v : 0), 0);
export const hasJoat = c => !!c.bon.joat || bardLevel(c) >= 2;

// extra bonus for a skill or save on top of ability modifier and proficiency
export function extra(c, k, skill, l) {
  const pb = pbOf(c), tags = []; let n = 0;
  if (skill && l === 0) {
    const j = hasJoat(c) ? Math.floor(pb / 2) : 0, r = c.bon.ra && 'str dex con'.includes(k) ? Math.ceil(pb / 2) : 0;
    if (j || r) { n += Math.max(j, r); tags.push(r > j ? 'remarkable athlete' : 'jack of all trades'); }
  }
  c.bon.list.forEach(b => { if (b.to === k || (skill && b.to === 'skills') || (!skill && b.to === 'saves')) { n += b.amt; tags.push(b.name); } });
  return [n, tags];
}

// ================= Stage 2 =================
export const ABK = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const plain = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

// ---- ability score bonuses from feats and species ----
// ab: raw 5etools ability list -> fixed bonuses plus "choose" slots
// several "choose" entries with no fixed bonus are alternatives (e.g. Ability Score Improvement: +2 to one score OR +1 to two)
export const isAlt = ab => (ab || []).length > 1 && ab.every(o => o.choose && !ABK.some(k => o[k]));
export const altName = o => { const c = o.choose || {}; const w = c.weighted ? c.weighted.weights : null; const n = w ? w.length : (c.count || 1), a = w ? w[0] : (c.amount || 1); return n > 1 ? '+' + a + ' to ' + n + ' different scores' : '+' + a + ' to one score'; };
export function abSlots(ab, mode) {
  const fixed = {}, slots = [];
  const list = isAlt(ab) ? [ab[mode] || ab[0]] : ab || [];
  for (const o of list) {
    for (const k of ABK) if (o[k]) fixed[k] = (fixed[k] || 0) + o[k];
    const c = o.choose;
    if (!c) continue;
    if (c.weighted) c.weighted.weights.forEach(w => slots.push({ amt: w, from: c.weighted.from }));
    else if (c.from) { const n = c.count || 1, a = c.amount || 1; for (let i = 0; i < n; i++) slots.push({ amt: a, from: c.from }); }
  }
  return { fixed, slots };
}
export function abSources(ch) {
  const out = [];
  for (const key of ch.feats) {
    const f = D.feats.find(x => x.key === key);
    if (!f || !f.ab || !f.ab.length) continue;
    const n = f.rep ? Math.max(1, (ch.fc && ch.fc[key]) || 1) : 1;
    for (let i = 0; i < n; i++) { const id = 'f:' + key + (i ? '#' + (i + 1) : ''); out.push({ id, ab: f.ab, name: f.name, mode: +ch.picks[id + '~m'] || 0 }); }
  }
  const p = D.species.find(x => x.key === ch.species);
  if (p && p.ab && p.ab.length) out.push({ id: 'p:' + p.key, ab: p.ab, name: p.name });
  return out;
}
export function abBonus(ch) {
  const b = {};
  for (const s of abSources(ch)) {
    const { fixed, slots } = abSlots(s.ab, s.mode), picks = ch.picks[s.id] || [];
    for (const k in fixed) b[k] = (b[k] || 0) + fixed[k];
    slots.forEach((sl, i) => { const k = picks[i]; if (k && sl.from.includes(k)) b[k] = (b[k] || 0) + sl.amt; });
  }
  return b;
}
export function effScore(ch, k, bon) { const base = ch.sc[k], add = (bon || abBonus(ch))[k] || 0; return add ? Math.min(base + add, Math.max(20, base)) : base; }

// ---- expertise picked on the class page ----
export const expSlots = name => (/^expertise$/i.test(name) ? 2 : /^scholar$/i.test(name) ? 1 : 0);
function unlocked(ch, id) { const p = id.split(':'), lvl = +p[p.length - 2], ck = p[1].split('|').slice(0, 2).join('|'); return (ch.classes[ck] || 0) >= lvl; }
export function expertSet(ch) {
  const s = new Set();
  for (const [k, v] of Object.entries(ch.picks)) if ((k.startsWith('cf:') || k.startsWith('sf:')) && unlocked(ch, k)) v.forEach(x => x && s.add(x));
  return s;
}
export const profLevel = (ch, skill, ex) => Math.max(ch.pf[skill] || 0, (ex || expertSet(ch)).has(skill) ? 2 : 0);

// ---- spellcasting ----
export function casters(ch) {
  const out = [];
  for (const k of D.classes) {
    const ck = ckey(k), lv = ch.classes[ck] || 0;
    if (!lv) continue;
    let prog = k.prog, abil = k.abil;
    const sv = ch.subs[ck], s = sv && k.subs.find(x => x.short + '|' + x.source === sv);
    if (!prog && s && s.prog) { prog = s.prog; abil = s.abil; }
    if (prog) out.push({ k, ck, lv, prog, abil });
  }
  return out;
}
export function castAbil(ch) {
  if (ch.cb.cast) return ch.cb.cast;
  const cs = casters(ch).filter(c => c.abil).sort((a, b) => b.lv - a.lv);
  return cs.length ? cs[0].abil : '';
}
const FULL = [[2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]];
// slots[i] = number of spell slots of level i+1; pact = {n, lvl} for Warlock Pact Magic
export function slotInfo(ch) {
  const cs = casters(ch), sl = cs.filter(c => c.prog !== 'pact');
  let slots = [];
  if (sl.length === 1 && sl[0].k.tbl && sl[0].k.tbl.sp && sl[0].prog !== '1/3') slots = (sl[0].k.tbl.sp[sl[0].lv - 1] || []).slice();
  else if (sl.length) {
    let lvl = 0;
    for (const c of sl) lvl += c.prog === 'full' ? c.lv : c.prog === '1/2' ? Math.floor(c.lv / 2) : c.prog === 'artificer' ? Math.ceil(c.lv / 2) : c.prog === '1/3' ? Math.floor(c.lv / 3) : 0;
    if (lvl > 0) slots = FULL[Math.min(20, lvl) - 1].slice();
  }
  let pact = null;
  const pc = cs.find(c => c.prog === 'pact');
  if (pc && pc.k.tbl) {
    const a = pc.k.tbl.cols.find(c => c.l === 'Spell Slots'), b = pc.k.tbl.cols.find(c => c.l === 'Slot Level');
    if (a && b) pact = { n: parseInt(a.v[pc.lv - 1], 10) || 0, lvl: parseInt(b.v[pc.lv - 1], 10) || 0 };
  }
  return { slots, pact };
}

// ---- everything the sheet shows, computed in one place ----
export function calc(ch) {
  const pb = pbOf(ch), bon = abBonus(ch), ex = expertSet(ch), score = {}, mod = {};
  for (const k of ABK) { score[k] = effScore(ch, k, bon); mod[k] = abMod(score[k]); }
  const save = k => { const l = ch.pf['save:' + k] ? 1 : 0, [e, tags] = extra(ch, k, false, l); return { v: mod[k] + pb * l + e, tags: [l ? 'proficient' : '', ...tags].filter(Boolean) }; };
  const skill = (k, x) => { const l = profLevel(ch, x, ex), [e, tags] = extra(ch, k, true, l); return { v: mod[k] + pb * l + e, l, tags: [l === 2 ? 'expertise' : l === 1 ? 'proficient' : '', ...tags].filter(Boolean) }; };
  return { pb, bon, ex, score, mod, save, skill };
}

// ---- weapons: attack and damage for one entry of ch.weapons ----
export function weaponStats(ch, w, c) {
  const fin = (w.props || []).includes('F');
  const k = w.abil || (fin ? (c.mod.dex > c.mod.str ? 'dex' : 'str') : w.rng ? 'dex' : 'str');
  const m = c.mod[k], mag = +w.mag || 0, hit = (ch.cb && ch.cb.hit) || 0;
  const atk = m + (w.prof === 0 ? 0 : c.pb) + mag + hit, flat = m + mag;
  const f = n => (n ? (n > 0 ? '+' : '−') + Math.abs(n) : '');
  const dmg = (w.dmg || '') + f(flat) + (w.dice ? ' + ' + w.dice : '');
  return { k, atk, dmg, dmg2: w.dmg2 && (w.props || []).includes('V') ? w.dmg2 + f(flat) + (w.dice ? ' + ' + w.dice : '') : '' };
}
