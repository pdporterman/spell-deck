// Features & Traits: the character's species traits and feats as cards.
import * as S from '../store.js';
import { D } from '../data.js';
import { el } from '../ui.js';
import { featCard, speciesCards, collapseTools, col, section, gcard } from '../cards.js';
import { abSlots, isAlt, altName } from '../rules.js';
import { ABN } from '../process.js';
import { openFeatPicker } from '../pickers.js';
import { inSel, getSel, pickLabel, filterButton, featOpts } from '../filters.js';

export const title = 'Features & Traits';

// dropdowns for "choose an ability score" slots (feats, older species)
function abilityPicks(ch, id, ab) {
  if (!ab || !ab.length) return null;
  const alt = isAlt(ab), wrap = el('div', { class: 'choice' });
  const draw = () => {
    wrap.textContent = '';
    const mode = alt ? +ch.picks[id + '~m'] || 0 : 0;
    if (alt) wrap.append(el('label', null, 'Choose how to use it', el('select', { 'aria-label': 'Ability score mode', on: { change: e => { ch.picks[id + '~m'] = +e.target.value; ch.picks[id] = []; S.save(); draw(); } } }, ab.map((o, i) => el('option', { value: i, text: altName(o), selected: i === mode })))));
    const { slots } = abSlots(ab, mode);
    const picks = ch.picks[id] = ch.picks[id] || [];
    slots.forEach((sl, i) => wrap.append(el('label', null, 'Ability score +' + sl.amt + (slots.length > 1 ? ' (' + (i + 1) + ')' : ''),
      el('select', { 'aria-label': 'Ability score choice', on: { change: e => { picks[i] = e.target.value || null; S.save(); } } },
        el('option', { value: '', text: 'Choose…' }), sl.from.map(k => el('option', { value: k, text: ABN[k] || k, selected: picks[i] === k }))))));
  };
  draw();
  return wrap.children.length ? wrap : null;
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
    if (!grp) root.append(section(ch, 'sec:feats', 'Feats (' + shown.length + ')', col(shown.map(x => withPicks(featCard(x, ch, rm(x)), ch, x, redraw)))));
    else {
      const by = {}; shown.forEach(x => (by[x.cat] = by[x.cat] || []).push(x));
      Object.keys(by).forEach(k => root.append(section(ch, 'sec:ft:' + k, k + ' (' + by[k].length + ')', col(by[k].map(x => withPicks(featCard(x, ch, rm(x)), ch, x, redraw))))));
    }
  } else root.append(el('p', { class: 'who', text: 'No feats yet. Use Edit (top right) to add some.' }));
}
function withPicks(card, ch, f, redraw) {
  const n = f.rep ? Math.max(1, ch.fc[f.key] || 1) : 1, box = el('div');
  if (f.rep) {
    const set = v => { ch.fc[f.key] = Math.max(1, Math.min(10, v)); S.save(); redraw(); };
    box.append(el('div', { class: 'choice' }, el('label', null, 'Times taken (repeatable)', el('span', { class: 'lv' },
      el('button', { class: 'btn small icon', text: '-', 'aria-label': 'Take ' + f.name + ' fewer times', disabled: n <= 1, on: { click: () => set(n - 1) } }), el('b', { text: String(n) }),
      el('button', { class: 'btn small icon', text: '+', 'aria-label': 'Take ' + f.name + ' again', on: { click: () => set(n + 1) } })))));
  }
  for (let i = 0; i < n; i++) { const pk = abilityPicks(ch, 'f:' + f.key + (i ? '#' + (i + 1) : ''), f.ab); if (pk) { if (n > 1) box.append(el('p', { class: 'small muted', text: 'Time ' + (i + 1) })); box.append(pk); } }
  if (box.children.length) card.querySelector('.body').before(box);
  return card;
}
export const edit = ({ ch, redraw }) => openFeatPicker(ch, redraw);
