// Resources: class resources and uses of species / feat traits (spell slots live on the Spells page).
import * as S from '../store.js';
import { el } from '../ui.js';
import { resources } from '../res.js';
import { plain } from '../rules.js';
import { controlFor, openRest } from '../slots.js';

export const title = 'Resources';
const tag = r => (r.rest === 'short' ? 'Short or long rest' : 'Long rest');

export function mount(root, { ch }) {
  const res = resources(ch);
  if (!res.length) {
    root.append(el('div', { class: 'empty' }, el('p', { text: 'Nothing to track yet.' }), el('p', { class: 'small', text: 'Class resources appear when you add class levels. Species and feat uses appear once they are chosen. Spell slots are on the Spells page.' })));
    return;
  }
  root.append(el('div', { class: 'ctr-grid' }, res.map(r => el('div', { class: 'ctr' },
    el('div', { class: 'ctr-head' }, el('b', { text: r.name }), el('span', { class: 'muted small', text: tag(r) })),
    el('p', { class: 'muted small', style: 'margin:.1rem 0 .4rem', text: r.src }),
    controlFor(ch, r),
    r.note ? el('details', { style: 'margin-top:.5rem' }, el('summary', { class: 'small', text: 'Details' }), el('p', { class: 'small', text: plain(r.note) })) : null))));
}

export const edit = ({ ch, redraw }) => openRest(ch, redraw);
