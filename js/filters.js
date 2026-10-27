// Multi-select filter popups (spell class lists, feat categories). null = everything selected.
import * as S from './store.js';
import { D } from './data.js';
import { el, modal } from './ui.js';

export const spellOpts = () => [...new Set(D.spells.flatMap(x => x.classes))].sort();
export const featOpts = () => [...new Set(D.feats.map(x => x.cat))].sort();
export const inSel = (sel, arr) => sel === null || arr.some(x => sel.includes(x));
export const pickLabel = (sel, word) => sel === null ? 'All ' + word : !sel.length ? 'No ' + word : sel.length <= 2 ? sel.join(', ') : sel.length + ' ' + word;
export const getSel = which => S.get().filters[which];

// Returns a button that opens the popup; onChange() is called after every change.
export function filterButton(which, opts, word, onChange) {
  const btn = el('button', { class: 'btn fbtn' });
  const label = () => { btn.textContent = pickLabel(getSel(which), word) + ' ▾'; };
  label();
  btn.addEventListener('click', () => {
    const sel = getSel(which), boxes = [];
    const apply = () => { const ch = boxes.filter(b => b.checked).map(b => b.value); S.get().filters[which] = ch.length === boxes.length ? null : ch; S.save(); label(); onChange(); };
    const list = el('div', { class: 'pklist' }, opts().map(o => {
      const cb = el('input', { type: 'checkbox', value: o, checked: sel === null || sel.includes(o), on: { change: apply } }); boxes.push(cb);
      return el('label', { class: 'check' }, cb, o);
    }));
    const setAll = v => { boxes.forEach(b => { b.checked = v; }); apply(); };
    modal({
      title: which === 'sf' ? 'Spell lists to show' : 'Feat categories to show', noFocus: true,
      body: el('div', { class: 'form' }, el('div', { class: 'toolbar' }, el('button', { class: 'btn small', text: 'Select all', on: { click: () => setAll(true) } }), el('button', { class: 'btn small', text: 'Clear', on: { click: () => setAll(false) } })), list),
      actions: [{ label: 'Done', kind: 'primary' }],
    });
  });
  btn._label = label;
  return btn;
}
