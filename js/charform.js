// New / edit character popup: name, classes + levels, species, and which pages the character uses (and their order).
import * as S from './store.js';
import * as nav from './nav.js';
import { D } from './data.js';
import { el, clear, modal, confirmBox, clickPrimary, sortable } from './ui.js';
import { speciesList } from './lists.js';
import { classEditor } from './pickers.js';

export function openCharForm(id) {
  const orig = id ? S.get().chars[id] : null;
  const c = orig ? JSON.parse(JSON.stringify(orig)) : S.newChar('');
  const all = Object.keys(S.CHAR_PAGES);
  let order = c.pages.concat(S.DEFAULT_PAGES.filter(p => all.includes(p) && !c.pages.includes(p)));
  const on = new Set(c.pages);

  const name = el('input', { type: 'text', value: c.name, maxLength: 40, placeholder: 'Character name', autocomplete: 'off', 'aria-label': 'Name' });
  name.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); clickPrimary(); } });
  // species: opens a searchable list (like the spell picker) where you can read each one before ticking it
  const spLabel = el('span', { class: 'n' });
  const showSp = () => { const p = D.species.find(x => x.key === c.species); spLabel.textContent = p ? p.name + ' (' + p.source + ')' : 'None'; };
  showSp();
  const pickSpecies = () => {
    let list;
    const sel = { get: () => c.species, set: k => { c.species = k; showSp(); list.draw(); } };
    list = speciesList(sel);
    modal({ title: 'Choose species', wide: true, noFocus: true, body: list.root, actions: [{ label: 'Done', kind: 'primary' }] });
  };
  const species = el('div', { class: 'pickrow' }, spLabel, el('button', { class: 'btn small', text: 'Choose…', type: 'button', on: { click: pickSpecies } }));

  const pagesBox = el('div');
  const drawPages = () => {
    clear(pagesBox);
    order.forEach(p => pagesBox.append(el('div', { class: 'pickrow', 'data-id': p },
      el('span', { class: 'grip', 'aria-label': 'Drag to reorder ' + S.CHAR_PAGES[p], role: 'img', text: '☰' }),
      el('label', { class: 'check n' }, el('input', { type: 'checkbox', checked: on.has(p), on: { change: e => { e.target.checked ? on.add(p) : on.delete(p); } } }), S.CHAR_PAGES[p]))));
  };
  sortable(pagesBox, ids => { order = ids; });
  drawPages();

  const body = el('div', { class: 'form' },
    el('label', null, 'Name', name),
    el('div', null, el('b', { text: 'Class' }), classEditor(c)),
    el('div', null, el('b', { text: 'Species (optional)' }), species),
    el('div', null, el('b', { text: 'Pages' }), el('p', { class: 'muted small', text: 'Tick the pages this character uses and drag ☰ to put them in the order you like. You can change this later with Edit.' }), pagesBox));

  const save = close => {
    const pages = order.filter(p => on.has(p));
    if (!pages.length) { pagesBox.scrollIntoView(); return false; }
    c.name = name.value.trim() || 'New Character'; c.pages = pages;
    if (orig) { Object.assign(orig, c, { id: orig.id }); S.fixChar(orig); S.save(); nav.rerender(); }
    else { S.addChar(c); nav.go(c.pages[0], c.id); }
  };
  const actions = [{ label: 'Cancel' }, { label: orig ? 'Save' : 'Create', kind: 'primary', onClick: save }];
  if (orig) actions.unshift({ label: 'Delete', kind: 'danger', keepOpen: true, onClick: async close => {
    close();
    if (await confirmBox('Delete ' + orig.name + ' and everything saved for them?')) { S.deleteChar(orig.id); nav.go('ref-spells', null); }
  } });
  modal({ title: orig ? 'Edit character' : 'New character', body, actions, noFocus: !!orig });
}
