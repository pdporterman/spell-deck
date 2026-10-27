// Searchable lists used by the Reference pages and by the add/remove popups.
import * as S from './store.js';
import { D, key, ckey } from './data.js';
import { el, clear } from './ui.js';
import { spellCard, featCard, speciesCards, classFeatCard, cfeats, byLvl, rail, col } from './cards.js';
import { filterButton, spellOpts, featOpts, inSel, getSel } from './filters.js';
import { lvlName } from './fmt.js';

// o: { items(q) -> [{k, n, s, head, check:{on,set}, extra, card()}], tools:[nodes], empty(), onDraw() }
export function makeList(o) {
  const q = el('input', { type: 'search', placeholder: 'Search…', 'aria-label': 'Search' });
  const rows = el('div'), openKeys = new Set();
  const draw = () => {
    clear(rows);
    const items = o.items(q.value.toLowerCase().trim());
    if (!items.length) rows.append(el('div', { class: 'empty', text: o.empty ? o.empty() : 'No matches.' }));
    let last;
    for (const it of items) {
      if (it.head !== undefined && it.head !== last) { last = it.head; rows.append(el('h3', { class: 'hi', text: it.head })); }
      const holder = el('div', { style: 'padding:8px 0' });
      const view = el('button', { class: 'v', text: openKeys.has(it.k) ? 'Hide' : 'View' });
      const show = v => { holder.hidden = !v; view.textContent = v ? 'Hide' : 'View'; if (v) { if (!holder.firstChild) holder.append(it.card()); openKeys.add(it.k); } else openKeys.delete(it.k); };
      holder.hidden = true; show(openKeys.has(it.k));
      view.addEventListener('click', () => show(holder.hidden));
      const cb = it.check ? el('input', { type: 'checkbox', checked: it.check.on, 'aria-label': 'Select ' + it.n, on: { change: e => it.check.set(e.target.checked) } }) : null;
      rows.append(el('div', { class: 'row' }, cb, el('span', { class: 'n' }, it.n + ' ', el('small', { text: it.s || '' })), it.extra, view), holder);
    }
    o.onDraw && o.onDraw();
  };
  q.addEventListener('input', draw);
  const root = el('div', null, el('div', { class: 'toolbar' }, q, o.tools), rows);
  draw();
  return { root, draw };
}

// ---- spells: sel = {has(k), set(k,bool)} or null (reference) ----
export function spellList(sel, onDraw) {
  const sort = el('select', { 'aria-label': 'Sort' }, el('option', { value: 'az', text: 'A–Z' }), el('option', { value: 'lvl', text: 'Level' }));
  let list;
  const fb = filterButton('sf', spellOpts, 'classes', () => list.draw());
  sort.addEventListener('change', () => list.draw());
  list = makeList({
    tools: [sort, fb], onDraw,
    empty: () => (D.spells.length ? 'No matches.' : 'Loading…'),
    items: q => {
      const lv = sort.value === 'lvl', f = getSel('sf');
      const a = D.spells.filter(s => inSel(f, s.classes) && s.name.toLowerCase().includes(q)).sort(lv ? (x, y) => x.level - y.level || x.name.localeCompare(y.name) : (x, y) => x.name.localeCompare(y.name));
      return a.map(s => ({ k: 's:' + key(s), n: s.name, s: `${s.level ? 'L' + s.level : 'Cantrip'} · ${s.school} · ${s.source}`, head: lv ? lvlName(s.level) : undefined,
        check: sel && { on: sel.has(key(s)), set: v => sel.set(key(s), v) }, card: () => spellCard(s, null) }));
    },
  });
  return list;
}
export function featList(sel, onDraw) {
  let list;
  const fb = filterButton('ff', featOpts, 'categories', () => list.draw());
  list = makeList({
    tools: [fb], onDraw, empty: () => (D.feats.length ? 'No matches.' : 'Loading…'),
    items: q => {
      const f = getSel('ff');
      return D.feats.filter(x => inSel(f, [x.cat]) && x.name.toLowerCase().includes(q)).sort((x, y) => x.name.localeCompare(y.name))
        .map(x => ({ k: 'f:' + x.key, n: x.name, s: x.cat + ' · ' + x.source, check: sel && { on: sel.has(x.key), set: v => sel.set(x.key, v) }, card: () => featCard(x, null) }));
    },
  });
  return list;
}
export function speciesList(onDraw) {
  return makeList({
    onDraw, empty: () => (D.species.length ? 'No matches.' : 'Loading…'),
    items: q => D.species.filter(p => p.name.toLowerCase().includes(q)).map(p => ({ k: 'p:' + p.key, n: p.name, s: p.source, card: () => col(speciesCards(p, null)) })),
  });
}
// classes: one list of classes; subclass rows live under each class
export function classList(onDraw) {
  return makeList({
    onDraw, empty: () => (D.classes.length ? 'No matches.' : 'Loading…'),
    items: q => D.classes.filter(k => k.name.toLowerCase().includes(q)).map(k => ({
      k: 'c:' + ckey(k), n: k.name, s: k.source,
      card: () => el('div', null, rail(byLvl(cfeats(k)).map(f => classFeatCard(f, k.name, 0, k.name, null, null))),
        k.subs.length ? el('h3', { class: 'hi', text: 'Subclasses' }) : null,
        k.subs.map(s => el('details', null, el('summary', { text: s.name + ' · ' + s.source }),
          s.features.length ? rail(byLvl(s.features).map(f => classFeatCard(f, s.name, 1, k.name, null, null))) : el('div', { class: 'empty', text: 'No features found.' })))),
    })),
  });
}
