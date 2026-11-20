// Inventory: a table of item, description and count. Everything saves as you type.
import * as S from '../store.js';
import { el, confirmBox } from '../ui.js';

export const title = 'Inventory';

const grow = t => { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight, 44) + 'px'; };

export function mount(root, { ch, redraw }) {
  if (!ch.inv.length) { root.append(el('div', { class: 'empty' }, el('p', { text: 'Nothing in your inventory yet.' }), el('p', { class: 'small', text: 'Use Edit (top right) to add an item.' }))); return; }
  const body = el('tbody');
  for (const it of ch.inv) {
    const name = el('input', { type: 'text', value: it.name, placeholder: 'Item', 'aria-label': 'Item name', autocomplete: 'off', on: { input: e => { it.name = e.target.value; S.save(); } } });
    const desc = el('textarea', { rows: 1, placeholder: 'Description', 'aria-label': 'Item description', on: { input: e => { it.desc = e.target.value; S.save(); grow(e.target); } } });
    desc.value = it.desc;
    const cnt = el('input', { type: 'number', inputMode: 'numeric', min: 0, value: it.n, 'aria-label': 'Count of ' + (it.name || 'item'), on: { change: e => { it.n = Math.max(0, parseInt(e.target.value, 10) || 0); e.target.value = it.n; S.save(); } } });
    const step = d => () => { it.n = Math.max(0, (parseInt(cnt.value, 10) || 0) + d); cnt.value = it.n; S.save(); };
    const del = el('button', { class: 'btn small icon x', text: '×', 'aria-label': 'Remove ' + (it.name || 'item'), on: { click: async () => {
      if (!it.name && !it.desc || await confirmBox('Remove “' + (it.name || 'this item') + '” from your inventory?')) { ch.inv = ch.inv.filter(x => x.id !== it.id); S.save(); redraw(); }
    } } });
    body.append(el('tr', null,
      el('td', { class: 'inv-name' }, name, del), el('td', null, desc),
      el('td', { class: 'inv-n' }, el('div', { class: 'inv-ctl' }, el('button', { class: 'btn small icon', text: '-', 'aria-label': 'One fewer', on: { click: step(-1) } }), cnt, el('button', { class: 'btn small icon', text: '+', 'aria-label': 'One more', on: { click: step(1) } })))));
    setTimeout(() => grow(desc), 0);
  }
  root.append(el('div', { class: 'inv-wrap' }, el('table', { class: 'inv' }, el('thead', null, el('tr', null, el('th', { text: 'Item' }), el('th', { text: 'Description' }), el('th', { text: 'Count' }))), body)));
};

export const edit = ({ ch, redraw }) => {
  ch.inv.push({ id: S.uid(), name: '', desc: '', n: 1 });
  S.save(); redraw();
  setTimeout(() => { const l = document.querySelectorAll('.inv-name input'); if (l.length) { const i = l[l.length - 1]; i.focus(); i.scrollIntoView({ block: 'center' }); } }, 50);
};
