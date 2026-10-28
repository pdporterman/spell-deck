// 5etools data: downloaded once, kept on this device (IndexedDB), refreshed in the background.
import { BASE, slim, procFeats, procSpecies, procClasses, procWeapons, procOpts } from './process.js';

export const D = { spells: [], feats: [], species: [], classes: [], weapons: [], opts: [] };
export const DV = 11;                       // bump to force a re-download on every device
const DB = 'spelldeck', STORE = 'kv';
const db = () => new Promise((res, rej) => { const q = indexedDB.open(DB, 1); q.onupgradeneeded = () => q.result.createObjectStore(STORE); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
async function idb(mode, fn) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction(STORE, mode), q = fn(t.objectStore(STORE)); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); }
const getK = k => idb('readonly', s => s.get(k));
const putK = (k, v) => idb('readwrite', s => s.put(v, k));

export const key = s => s.name + '|' + s.source;
export const ckey = k => k.name + '|' + k.source;
export const counts = () => D.spells.length + ' spells · ' + D.feats.length + ' feats · ' + D.species.length + ' species · ' + D.classes.length + ' classes';
export const isLoaded = () => D.spells.length > 0 || D.classes.length > 0;
export const meta = { when: 0 };

async function fetchAll(progress) {
  progress && progress('Downloading from 5etools…');
  const j = u => fetch(BASE + u).then(r => { if (!r.ok) throw Error(u); return r.json(); });
  const jobs = {
    spells: async () => {
      const idx = await j('spells/index.json'); let lookup = null;
      try { lookup = await j('generated/gendata-spell-source-lookup.json'); } catch (e) { /* optional */ }
      const files = await Promise.all(Object.values(idx).map(f => j('spells/' + f).catch(() => ({ spell: [] }))));
      const out = []; files.forEach(f => (f.spell || []).forEach(s => { if (!s.reprintedAs) out.push(slim(s, lookup)); })); return out;
    },
    feats: async () => procFeats(await j('feats.json')),
    species: async () => procSpecies(await j('races.json')),
    opts: async () => procOpts(await j('optionalfeatures.json')),
    weapons: async () => procWeapons(await j('items-base.json')),
    classes: async () => { const idx = await j('class/index.json'); return procClasses(await Promise.all(Object.values(idx).map(f => j('class/' + f)))); },
  };
  let bad = 0;
  await Promise.all(Object.entries(jobs).map(async ([k, f]) => { try { D[k] = await f(); await putK(k, D[k]); } catch (e) { bad++; console.error(k, e); } }));
  if (bad === 6) throw Error('download failed');
  if (!bad) { await putK('ver', DV); await putK('when', Date.now()); meta.when = Date.now(); }
  return bad;
}

// onChange() is called whenever the lists change; status(text) reports progress.
export async function init(force, onChange, status = () => {}) {
  let have = true;
  for (const k of Object.keys(D)) { const v = await getK(k).catch(() => null); if (v) D[k] = v; else have = false; }
  const when = (await getK('when').catch(() => 0)) || 0, ver = await getK('ver').catch(() => 0);
  meta.when = when;
  if (D.spells.length) { onChange(); status(counts() + ' (saved copy, ' + new Date(when).toLocaleDateString() + ')'); }
  if (force || !have || ver !== DV || Date.now() - when > 864e5) {
    if (!navigator.onLine) { if (!have) status('Offline and nothing saved yet. Open once while online.'); return; }
    try { const bad = await fetchAll(status); onChange(); status(counts() + (bad ? ' (some parts failed to update)' : ' — updated just now')); }
    catch (e) { status(have ? counts() + ' (saved copy; update failed)' : "Couldn't reach 5etools: " + e.message); }
  }
}

// ---- lookups ----
export const spellByKey = new Map();
export function indexData() { spellByKey.clear(); D.spells.forEach(s => spellByKey.set(key(s), s)); }
export const classKeyName = ck => (D.classes.find(k => ckey(k) === ck) || {}).name || ck.split('|')[0];
