// New / edit character popup: name, classes + levels, species, and which pages the character uses (and their order).
import * as S from './store.js';
import * as nav from './nav.js';
import { D } from './data.js';
import { el, clear, modal, confirmBox, clickPrimary } from './ui.js';
import { classEditor } from './pickers.js';

export function openCharForm(id) {
  const orig = id ? S.get().chars[id] : null;
  const c = orig ? JSON.parse(JSON.stringify(orig)) : S.newChar('');
  const all = Object.keys(S.CHAR_PAGES);
  let order = c.pages.concat(all.filter(p => !c.pages.includes(p)));
  const on = new Set(c.pages);

  const name = el('input', { type: 'text', value: c.name, maxLength: 40, placeholder: 'Character name', autocomplete: 'off', 'aria-label': 'Name' });
  name.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); clickPrimary(); } });
  const species = el('select', { 'aria-label': 'Species' }, el('option', { value: '', text: 'None' }), D.species.map(p => el('option', { value: p.key, text: p.name, selected: p.key === c.species })));
  species.addEventListener('change', () => { c.species = species.value; });

  const pagesBox = el('div');
  const drawPages = () => {
    clear(pagesBox);
    order.forEach((p, i) => pagesBox.append(el('div', { class: 'pickrow' },
      el('label', { class: 'check n' }, el('input', { type: 'checkbox', checked: on.has(p), on: { change: e => { e.target.checked ? on.add(p) : on.delete(p); } } }), S.CHAR_PAGES[p]),
      el('button', { class: 'btn small icon', text: '▲', 'aria-label': 'Move up', disabled: i === 0, on: { click: () => { [order[i - 1], order[i]] = [order[i], order[i - 1]]; drawPages(); } } }),
      el('button', { class: 'btn small icon', text: '▼', 'aria-label': 'Move down', disabled: i === order.length - 1, on: { click: () => { [order[i + 1], order[i]] = [order[i], order[i + 1]]; drawPages(); } } }))));
  };
  drawPages();

  const body = el('div', { class: 'form' },
    el('label', null, 'Name', name),
    el('div', null, el('b', { text: 'Class' }), classEditor(c)),
    el('label', null, 'Species (optional)', species),
    el('div', null, el('b', { text: 'Pages' }), el('p', { class: 'muted small', text: 'Tick the pages this character uses and put them in the order you like. You can change this later with Edit.' }), pagesBox));

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
