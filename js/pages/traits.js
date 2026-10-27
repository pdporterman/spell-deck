// Features & Traits: the character's species traits and feats as cards.
import * as S from '../store.js';
import { D } from '../data.js';
import { el } from '../ui.js';
import { featCard, speciesCards, collapseTools, col, section, gcard } from '../cards.js';
import { abSlots } from '../rules.js';
import { ABN } from '../process.js';
import { openFeatPicker } from '../pickers.js';
import { inSel, getSel, pickLabel, filterButton, featOpts } from '../filters.js';

export const title = 'Features & Traits';

// dropdowns for "choose an ability score" slots (feats, older species)
function abilityPicks(ch, id, ab) {
  const { fixed, slots } = abSlots(ab);
  if (!slots.length) return null;
  const picks = ch.picks[id] = ch.picks[id] || [];
  return el('div', { class: 'choice' }, slots.map((sl, i) => el('label', null, 'Ability score +' + sl.amt + (slots.length > 1 ? ' (' + (i + 1) + ')' : ''),
    el('select', { 'aria-label': 'Ability score choice', on: { change: e => { picks[i] = e.target.value || null; S.save(); } } },
      el('option', { value: '', text: 'Choose…' }), sl.from.map(k => el('option', { value: k, text: ABN[k] || k, selected: picks[i] === k }))))));
}
// species traits with a "choose one" list: show only the picked option
function speciesCardsFor(ch, p) {
  const cards = [gcard({ mid: 'p:' + p.key + ':basics', ch, t: p.name, meta: 'Species', dl: [['Size', p.size], ['Speed', p.speed]].filter(x => x[1]), body: p.notes, foot: p.source, extra: abilityPicks(ch, 'p:' + p.key, p.ab) })];
  for (const t of p.traits) {
    if (!t.choice) { cards.push(gcard({ mid: 'p:' + p.key + ':' + t.name, ch, t: t.name, meta: p.name, body: t.text, foot: p.source })); continue; }
    const id = 'pc:' + p.key + ':' + t.name, body = el('div'), card = gcard({ mid: 'p:' + p.key + ':' + t.name, ch, t: t.name, meta: p.name, body: t.text, foot: p.source });
    const show = () => { const o = t.choice.opts.find(x => x.name === ch.picks[id]); body.innerHTML = o ? '<p><b>' + o.name.replace(/</g, '&lt;') + '</b></p>' + o.text : ''; };
    const sel = el('select', { 'aria-label': t.name + ' choice', on: { change: e => { ch.picks[id] = e.target.value || null; S.save(); show(); } } }, el('option', { value: '', text: 'Choose…' }), t.choice.opts.map(o => el('option', { value: o.name, text: o.name, selected: ch.picks[id] === o.name })));
    show();
    card.querySelector('.body').append(el('div', { class: 'choice' }, el('label', null, 'Your choice', sel)), body);
    cards.push(card);
  }
  return cards;
}

export function mount(root, { ch, redraw }) {
  const grp = S.get().settings.groupFeats;
  const p = D.species.find(x => x.key === ch.species);
  const all = D.feats.filter(f => ch.feats.includes(f.key));
  const f = getSel('ff');
  const shown = all.filter(x => inSel(f, [x.cat])).sort(grp ? (x, y) => x.cat.localeCompare(y.cat) || x.name.localeCompare(y.name) : (x, y) => x.name.localeCompare(y.name));
  if (!p && !all.length) {
    root.append(el('div', { class: 'empty' }, el('p', { text: 'No species or feats yet.' }), el('p', { class: 'small', text: 'Use Edit (top right) to add feats. Species is chosen in the character menu → Edit.' })));
    return;
  }
  const tools = el('div', { class: 'toolbar' });
  if (all.length) tools.append(filterButton('ff', featOpts, 'categories', redraw));
  root.append(collapseTools(root, ch), tools);
  if (p) root.append(section(ch, 'sec:species', p.name + ' (species)', col(speciesCardsFor(ch, p))));
  else root.append(el('p', { class: 'who', text: 'No species chosen. Pick one in the character menu → Edit.' }));
  if (all.length) {
    const rm = x => () => { ch.feats = ch.feats.filter(k => k !== x.key); S.save(); redraw(); };
    if (f !== null) root.append(el('p', { class: 'who' }, 'Showing ' + pickLabel(f, 'categories') + ': ' + shown.length + ' of ' + all.length + ' feats ', el('button', { class: 'link', text: 'Show all', on: { click: () => { S.get().filters.ff = null; S.save(); redraw(); } } })));
    if (!grp) root.append(section(ch, 'sec:feats', 'Feats (' + shown.length + ')', col(shown.map(x => withPicks(featCard(x, ch, rm(x)), ch, x)))));
    else {
      const by = {}; shown.forEach(x => (by[x.cat] = by[x.cat] || []).push(x));
      Object.keys(by).forEach(k => root.append(section(ch, 'sec:ft:' + k, k + ' (' + by[k].length + ')', col(by[k].map(x => withPicks(featCard(x, ch, rm(x)), ch, x))))));
    }
  } else root.append(el('p', { class: 'who', text: 'No feats yet. Use Edit (top right) to add some.' }));
}
function withPicks(card, ch, f) { const pk = abilityPicks(ch, 'f:' + f.key, f.ab); if (pk) card.querySelector('.body').before(pk); return card; }
export const edit = ({ ch, redraw }) => openFeatPicker(ch, redraw);
