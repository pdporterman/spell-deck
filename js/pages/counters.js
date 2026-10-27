// Counters: anything you track by hand (gold, rage, ki…). One amount box; it clears after each use.
import * as S from '../store.js';
import { el, modal, confirmBox, amountBox } from '../ui.js';

export const title = 'Counters';

export function mount(root, { ch, redraw }) {
  if (!ch.cts.length) { root.append(el('div', { class: 'empty' }, el('p', { text: 'No counters yet.' }), el('p', { class: 'small', text: 'Use Edit (top right) to add one for HP, gold, rage uses and so on.' }))); return; }
  root.append(el('div', { class: 'ctr-grid' }, ch.cts.map(t => {
    const val = el('div', { class: 'cn' });
    const show = () => { val.textContent = String(t.v); if (t.max != null) val.append(el('small', { text: ' / ' + t.max })); };
    show();
    return el('div', { class: 'ctr' },
      el('div', { class: 'ctr-head' }, el('b', { text: t.name }), el('button', { class: 'btn small', text: 'Edit', on: { click: () => openCounter(ch, t.id, redraw) } })),
      val, amountBox(d => { t.v = Math.max(0, t.v + d); if (t.max != null) t.v = Math.min(t.max, t.v); S.save(); show(); }));
  })));
}

export const edit = ({ ch, redraw }) => openCounter(ch, null, redraw);

export function openCounter(ch, id, redraw) {
  const t = id ? ch.cts.find(x => x.id === id) : null;
  const name = el('input', { type: 'text', value: t ? t.name : '', placeholder: 'HP, Gold, Rage…', autocomplete: 'off' });
  const val = el('input', { type: 'number', inputMode: 'numeric', min: 0, value: t ? t.v : '', placeholder: t ? '' : 'Starts at max, or 0' });
  const max = el('input', { type: 'number', inputMode: 'numeric', min: 1, value: t && t.max != null ? t.max : '' });
  const body = el('div', { class: 'form' }, el('label', null, 'Name', name), el('label', null, 'Current value', val), el('label', null, 'Max (optional; leave empty for no max, like gold)', max));
  const save = () => {
    const mv = parseInt(max.value, 10), mx = mv >= 1 ? mv : null, vv = parseInt(val.value, 10);
    let c = t;
    if (!c) { c = { id: S.uid(), name: '', v: 0, max: null }; ch.cts.push(c); c.v = vv >= 0 ? vv : (mx != null ? mx : 0); } else if (vv >= 0) c.v = vv;
    c.name = name.value.trim() || 'Counter'; c.max = mx; if (mx != null && c.v > mx) c.v = mx;
    S.save(); redraw();
  };
  const actions = [{ label: 'Cancel' }, { label: t ? 'Save' : 'Add', kind: 'primary', onClick: save }];
  if (t) actions.unshift({ label: 'Delete', kind: 'danger', keepOpen: true, onClick: async close => {
    close();
    if (await confirmBox('Delete the counter “' + t.name + '”?')) { ch.cts = ch.cts.filter(x => x.id !== t.id); S.save(); redraw(); }
  } });
  modal({ title: t ? 'Edit counter' : 'New counter', body, actions });
}
