// Notes: free-form notes to yourself. Everything saves as you type.
import * as S from '../store.js';
import { el, confirmBox } from '../ui.js';

export const title = 'Notes';

const grow = t => { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight, 90) + 'px'; };

export function mount(root, { ch, redraw }) {
  if (!ch.notes.length) { root.append(el('div', { class: 'empty' }, el('p', { text: 'No notes yet.' }), el('p', { class: 'small', text: 'Use Edit (top right) to add a note.' }))); return; }
  const list = el('div', { class: 'notes' });
  for (const n of ch.notes) {
    const head = el('input', { type: 'text', class: 'note-title', value: n.title, placeholder: 'Title', 'aria-label': 'Note title', autocomplete: 'off', on: { input: e => { n.title = e.target.value; S.save(); } } });
    const text = el('textarea', { class: 'note-text', 'aria-label': 'Note text', placeholder: 'Write here…', on: { input: e => { n.text = e.target.value; S.save(); grow(e.target); } } });
    text.value = n.text;
    const del = el('button', { class: 'btn small danger', text: 'Delete', 'aria-label': 'Delete note', on: { click: async () => {
      if (!n.title && !n.text || await confirmBox('Delete the note “' + (n.title || 'Untitled') + '”?')) { ch.notes = ch.notes.filter(x => x.id !== n.id); S.save(); redraw(); }
    } } });
    list.append(el('section', { class: 'note' }, el('div', { class: 'note-head' }, head, del), text));
    setTimeout(() => grow(text), 0);
  }
  root.append(list);
}

export const edit = ({ ch, redraw }) => {
  ch.notes.unshift({ id: S.uid(), title: '', text: '' });
  S.save(); redraw();
  setTimeout(() => { const i = document.querySelector('.note-title'); if (i) i.focus(); }, 50);
};
