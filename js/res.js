// Resources: spell slots, class resources (from each class's table) and uses of species / feat traits.
import { D, ckey } from './data.js';
import { abMod, plain, ABK, slotInfo, pbOf, calc } from './rules.js';

const FROM_TABLE = {   // class table column label -> resource
  Rages: { name: 'Rage', rest: 'long' }, 'Second Wind': { name: 'Second Wind', rest: 'long', legacyShort: 1 },
  'Wild Shape': { name: 'Wild Shape', rest: 'long', legacyShort: 1 }, 'Channel Divinity': { name: 'Channel Divinity', rest: 'long', legacyShort: 1 },
  'Focus Points': { name: 'Focus Points', rest: 'short' }, 'Ki Points': { name: 'Ki Points', rest: 'short' },
  'Sorcery Points': { name: 'Sorcery Points', rest: 'long' }, 'Favored Enemy': { name: 'Favored Enemy', rest: 'long' },
  'Sneak Attack': null,
};
const num = v => { const n = parseInt(String(v), 10); return Number.isNaN(n) ? 0 : n; };

function classResources(ch, mods) {
  const out = [];
  for (const k of D.classes) {
    const ck = ckey(k), lv = ch.classes[ck] || 0;
    if (!lv) continue;
    const modern = k.source === 'XPHB';
    const add = (name, max, rest, note) => { if (max > 0) out.push({ id: 'cr:' + ck + ':' + name, name, max, rest, src: k.name, note: note || '' }); };
    for (const c of (k.tbl && k.tbl.cols) || []) {
      const d = FROM_TABLE[c.l];
      if (!d) continue;
      add(d.name, num(c.v[lv - 1]), d.legacyShort && !modern ? 'short' : d.rest);
    }
    const n = k.name;
    if (n === 'Bard') add('Bardic Inspiration', Math.max(1, mods.cha), lv >= 5 ? 'short' : 'long', 'Uses equal to your Charisma modifier (minimum 1).');
    if (n === 'Wizard') add('Arcane Recovery', 1, 'long');
    if (n === 'Paladin') add('Lay on Hands', 5 * lv, 'long', 'A pool of healing points: 5 × paladin level.');
    if (n === 'Fighter') { add('Action Surge', lv >= 17 ? 2 : lv >= 2 ? 1 : 0, 'short'); add('Indomitable', lv >= 17 ? 3 : lv >= 13 ? 2 : lv >= 9 ? 1 : 0, 'long'); }
    if (n === 'Sorcerer' && modern) add('Innate Sorcery', 2, 'long');
    if (n === 'Cleric' && lv >= 10) add('Divine Intervention', 1, 'long');
    if (n === 'Warlock' && modern && lv >= 2) add('Magical Cunning', 1, 'long');
    if (n === 'Artificer' && lv >= 7) add('Flash of Genius', Math.max(1, mods.int), 'long');
    if (n === 'Rogue' && lv >= 20) add('Stroke of Luck', 1, 'short');
  }
  return out;
}

// "use it a number of times equal to your Proficiency Bonus" / "once per long rest" in a trait's text
function textUses(text, pb) {
  const t = plain(text);
  const rest = /Short Rest/i.test(t) ? 'short' : 'long';
  if (/number of times equal to your Proficiency Bonus/i.test(t)) return { max: pb, rest };
  if (/(can'?t|cannot)[^.]*again[^.]*(Long|Short)[^.]*Rest/i.test(t) || /once (per|before)[^.]*(Long|Short)[^.]*Rest/i.test(t)
    || /regain (the ability|all expended uses)[^.]*(Long|Short)[^.]*Rest/i.test(t)) return { max: 1, rest };
  return null;
}
function traitResources(ch, pb) {
  const out = [], p = D.species.find(x => x.key === ch.species);
  if (p) for (const t of p.traits) {
    let name = t.name, text = t.text, note = '';
    if (t.choice) {
      const pick = ch.picks['pc:' + p.key + ':' + t.name], o = t.choice.opts.find(x => x.name === pick);
      if (!o) continue;
      name = o.name.replace(/\s*\(.*\)\s*$/, ''); text = t.text + ' ' + o.text; note = o.text;
    } else note = t.text;
    const u = textUses(text, pb);
    if (u) out.push({ id: 'tr:' + p.key + ':' + name, name, max: u.max, rest: u.rest, src: p.name, note });
  }
  for (const key of ch.feats) {
    const f = D.feats.find(x => x.key === key), u = f && textUses(f.text, pb);
    if (u) out.push({ id: 'ft:' + key, name: f.name, max: u.max, rest: u.rest, src: 'Feat', note: f.text });
  }
  return out;
}

export function resources(ch) {
  const c = calc(ch);
  return classResources(ch, c.mod).concat(traitResources(ch, c.pb));
}
export const used = (ch, id, max) => Math.max(0, Math.min(max, (ch.res.used[id]) || 0));

// spell slot ids: 'slot:1'..'slot:9', 'pact'
export function slotRows(ch) {
  const { slots, pact } = slotInfo(ch), rows = [];
  slots.forEach((n, i) => { if (n > 0) rows.push({ id: 'slot:' + (i + 1), name: ordinal(i + 1) + ' level', max: n }); });
  return { rows, pact: pact && pact.n ? { id: 'pact', name: 'Pact Magic (level ' + pact.lvl + ' slots)', max: pact.n } : null };
}
const ordinal = n => n + (['st', 'nd', 'rd'][n - 1] || 'th');

export function rest(ch, kind) {
  if (kind === 'long') { ch.res.used = {}; if (ch.hp.max) ch.hp.cur = ch.hp.max; ch.hp.temp = 0; return; }
  const keep = {};
  const short = new Set(resources(ch).filter(r => r.rest === 'short').map(r => r.id)); short.add('pact');
  for (const [k, v] of Object.entries(ch.res.used)) if (!short.has(k)) keep[k] = v;
  ch.res.used = keep;
}
