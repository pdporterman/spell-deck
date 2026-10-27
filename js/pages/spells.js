// Spells: the character's spell deck, one section per spell level.
import * as S from '../store.js';
import { D, key } from '../data.js';
import { el } from '../ui.js';
import { spellCard, rail, section, collapseTools } from '../cards.js';
import { openSpellPicker } from '../pickers.js';
import { inSel, getSel, pickLabel, filterButton, spellOpts } from '../filters.js';
import { lvlName } from '../fmt.js';
import { slotsSection } from '../slots.js';

export const title = 'Spells';

export function mount(root, { ch, redraw }) {
  const all = D.spells.filter(s => ch.deck.includes(key(s)));
  const slots = slotsSection(ch, redraw);
  if (slots) root.append(slots);
  if (!all.length) { root.append(el('div', { class: 'empty' }, el('p', { text: 'Your spell deck is empty.' }), el('p', { class: 'small', text: 'Use Edit (top right) to add spells.' }))); return; }
  const f = getSel('sf');
  const a = all.filter(s => inSel(f, s.classes)).sort((x, y) => x.level - y.level || x.name.localeCompare(y.name));
  root.append(collapseTools(root, ch), el('div', { class: 'toolbar' }, filterButton('sf', spellOpts, 'classes', redraw)));
  if (f !== null) root.append(el('p', { class: 'who' }, 'Showing ' + pickLabel(f, 'classes') + ': ' + a.length + ' of ' + all.length + ' spells ', el('button', { class: 'link', text: 'Show all', on: { click: () => { S.get().filters.sf = null; S.save(); redraw(); } } })));
  if (!a.length) { root.append(el('div', { class: 'empty', text: 'None of your deck spells are on the selected class lists.' })); return; }
  const by = {}; a.forEach(s => (by[s.level] = by[s.level] || []).push(s));
  Object.keys(by).forEach(l => root.append(section(ch, 'sec:lv:' + l, lvlName(+l) + ' (' + by[l].length + ')',
    rail(by[l].map(s => spellCard(s, ch, () => { ch.deck = ch.deck.filter(k => k !== key(s)); S.save(); redraw(); }))))));
}
export const edit = ({ ch, redraw }) => openSpellPicker(ch, redraw);
