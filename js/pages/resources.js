// Resources: spell slots as a check-off table, class resources, and uses of species / feat traits.
import * as S from '../store.js';
import { el, clear, modal, amountBox, toast } from '../ui.js';
import { resources, slotRows, used, rest } from '../res.js';
import { plain } from '../rules.js';

export const title = 'Resources';

function counterRow(ch, r) {
  const val = el('span', { class: 'cn', style: 'font-size:1.5rem;margin:0' });
  const show = () => { const left = r.max - used(ch, r.id, r.max); val.textContent = left + ' / ' + r.max; };
  show();
  const bump = d => { ch.res.used[r.id] = used(ch, r.id, r.max) - d; if (ch.res.used[r.id] < 0) ch.res.used[r.id] = 0; S.save(); show(); };
  return el('div', { class: 'res-ctl' }, el('button', { class: 'btn small icon', text: '-', 'aria-label': 'Use one', on: { click: () => bump(-1) } }), val, el('button', { class: 'btn small icon', text: '+', 'aria-label': 'Regain one', on: { click: () => bump(1) } }));
}
function boxRow(ch, r) {
  const wrap = el('div', { class: 'boxes' });
  const draw = () => {
    clear(wrap);
    const u = used(ch, r.id, r.max);
    for (let i = 0; i < r.max; i++) wrap.append(el('input', { type: 'checkbox', checked: i < u, 'aria-label': r.name + ' ' + (i + 1), on: { change: () => { ch.res.used[r.id] = wrap.querySelectorAll('input:checked').length; S.save(); draw(); } } }));
  };
  draw();
  return wrap;
}
function poolRow(ch, r) {
  const left = el('div', { class: 'cn', style: 'font-size:1.6rem;margin:0' });
  const show = () => { left.textContent = ''; left.append(String(r.max - used(ch, r.id, r.max)), el('small', { text: ' / ' + r.max })); };
  show();
  return el('div', null, left, amountBox(d => { ch.res.used[r.id] = Math.max(0, Math.min(r.max, used(ch, r.id, r.max) - d)); S.save(); show(); }, ['Use', 'Regain']));
}
const tag = r => (r.rest === 'short' ? 'Short or long rest' : 'Long rest');

export function mount(root, { ch }) {
  const asCounter = S.get().settings.resAsCounter;
  const control = r => (asCounter ? counterRow(ch, r) : r.max <= 10 ? boxRow(ch, r) : poolRow(ch, r));
  const { rows, pact } = slotRows(ch);
  const res = resources(ch);
  if (!rows.length && !pact && !res.length) {
    root.append(el('div', { class: 'empty' }, el('p', { text: 'Nothing to track yet.' }), el('p', { class: 'small', text: 'Spell slots and class resources appear when you add class levels. Species and feat uses appear once they are chosen.' })));
    return;
  }
  if (rows.length || pact) {
    const panel = el('div', { class: 'ctr' }, el('div', { class: 'ctr-head' }, el('b', { text: 'Spell slots' }), el('span', { class: 'muted small', text: asCounter ? 'slots left' : 'tick a box when you use a slot' })));
    for (const r of rows.concat(pact ? [pact] : [])) panel.append(el('div', { class: 'res-row' }, el('span', { class: 'n', text: r.name }), control({ ...r, rest: r.id === 'pact' ? 'short' : 'long' })));
    root.append(panel);
  }
  if (res.length) {
    root.append(el('h3', { class: 'hi', text: 'Class, species and feat resources' }));
    root.append(el('div', { class: 'ctr-grid' }, res.map(r => el('div', { class: 'ctr' },
      el('div', { class: 'ctr-head' }, el('b', { text: r.name }), el('span', { class: 'muted small', text: tag(r) })),
      el('p', { class: 'muted small', style: 'margin:.1rem 0 .4rem', text: r.src }),
      control(r),
      r.note ? el('details', { style: 'margin-top:.5rem' }, el('summary', { class: 'small', text: 'Details' }), el('p', { class: 'small', text: plain(r.note) })) : null))));
  }
}

export function edit({ ch, redraw }) {
  const doRest = (kind, close) => { rest(ch, kind); S.save(); close(); toast(kind === 'long' ? 'Long rest taken: resources, HP and temp HP reset' : 'Short rest taken'); redraw(); };
  let m;
  const body = el('div', { class: 'form' },
    el('p', { class: 'muted small', text: 'Short rest resets resources marked short rest (Pact Magic slots, Focus Points…). Long rest resets everything, sets HP to max and clears temporary HP. Counters are not changed.' }),
    el('button', { class: 'btn', text: 'Take a short rest', on: { click: () => doRest('short', m.close) } }),
    el('button', { class: 'btn primary', text: 'Take a long rest (reset all)', on: { click: () => doRest('long', m.close) } }));
  m = modal({ title: 'Resting', body, actions: [{ label: 'Close' }], noFocus: true });
}
