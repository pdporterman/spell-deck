// Popups that edit a character: spells, feats, class levels.
import * as S from './store.js';
import { D, key, ckey } from './data.js';
import { el, clear, modal } from './ui.js';
import { spellList, featList } from './lists.js';

const arraySel = (ch, field) => ({
  has: k => ch[field].includes(k),
  set: (k, v) => { const i = ch[field].indexOf(k); if (v && i < 0) ch[field].push(k); if (!v && i >= 0) ch[field].splice(i, 1); S.save(); },
});

export function openSpellPicker(ch, done) {
  const list = spellList(arraySel(ch, 'deck'));
  modal({ title: 'Spells for ' + ch.name, wide: true, noFocus: true, body: list.root, actions: [{ label: 'Done', kind: 'primary' }], onClose: done });
}
export function openFeatPicker(ch, done) {
  const list = featList(arraySel(ch, 'feats'));
  modal({ title: 'Feats for ' + ch.name, wide: true, noFocus: true, body: list.root, actions: [{ label: 'Done', kind: 'primary' }], onClose: done });
}

// Class levels + subclass for one character. onChange() after every edit.
export function classEditor(ch, onChange) {
  const root = el('div');
  const draw = () => {
    clear(root);
    const tot = S.total(ch);
    const have = D.classes.filter(k => (ch.classes[ckey(k)] || 0) > 0);
    root.append(el('p', { class: 'who' }, 'Total level: ', el('b', { text: String(tot) }), ' / 20'));
    for (const k of have) {
      const ck = ckey(k), lv = ch.classes[ck];
      const set = n => { n = Math.max(0, n); if (n === 0) { delete ch.classes[ck]; delete ch.subs[ck]; delete ch.lvf[ck]; } else ch.classes[ck] = n; S.save(); onChange && onChange(); draw(); };
      const sub = el('select', { 'aria-label': 'Subclass for ' + k.name, on: { change: e => { if (e.target.value) ch.subs[ck] = e.target.value; else delete ch.subs[ck]; S.save(); onChange && onChange(); } } },
        el('option', { value: '', text: k.subs.length ? 'No subclass yet' : 'No subclasses' }),
        k.subs.map(s => { const v = s.short + '|' + s.source; return el('option', { value: v, text: s.name + ' (' + s.source + ')', selected: ch.subs[ck] === v }); }));
      root.append(el('div', { class: 'pickrow', style: 'flex-wrap:wrap' },
        el('span', { class: 'n' }, el('b', { text: k.name }), ' ', el('small', { class: 'muted', text: k.source })),
        el('span', { class: 'lv' },
          el('button', { class: 'btn small icon', text: '-', 'aria-label': 'Remove a level of ' + k.name, on: { click: () => set(lv - 1) } }), el('b', { text: String(lv) }),
          el('button', { class: 'btn small icon', text: '+', 'aria-label': 'Add a level of ' + k.name, disabled: tot >= 20, on: { click: () => set(lv + 1) } })),
        k.subs.length && lv >= 3 ? el('div', { style: 'flex-basis:100%' }, sub) : null));
    }
    const add = el('select', { 'aria-label': 'Add a class' }, el('option', { value: '', text: have.length ? 'Add another class…' : 'Add a class…' }),
      D.classes.filter(k => !(ch.classes[ckey(k)] > 0)).map(k => el('option', { value: ckey(k), text: k.name + (k.source !== 'XPHB' ? ' (' + k.source + ')' : '') })));
    add.addEventListener('change', () => { if (!add.value || S.total(ch) >= 20) return; ch.classes[add.value] = 1; S.save(); onChange && onChange(); draw(); });
    root.append(el('div', { style: 'margin-top:.6rem' }, add));
    if (!D.classes.length) root.append(el('p', { class: 'muted small', text: "Class data hasn't downloaded yet." }));
  };
  draw();
  return root;
}
export function openClassEditor(ch, done) {
  modal({ title: 'Class levels', body: classEditor(ch), actions: [{ label: 'Done', kind: 'primary' }], onClose: done, noFocus: true });
}
