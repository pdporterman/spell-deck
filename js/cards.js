// Card builders. The look of every card lives in css/style.css (.card).
import { el, html } from './ui.js';
import * as S from './store.js';
import { esc, ordl } from './fmt.js';
import { ICON, COL } from './icons.js';
import { key } from './data.js';

const isMin = (ch, id) => !!ch && ch.min.includes(id);
function setMinId(ch, id, v) { const i = ch.min.indexOf(id); if (v && i < 0) ch.min.push(id); if (!v && i >= 0) ch.min.splice(i, 1); }

// o: {t, meta, dl, body (html), foot, cls, wm, cc, mid (minimize id), ch (character), btn: element}
export function gcard(o) {
  const mn = !!(o.mid && o.ch), mini = mn && isMin(o.ch, o.mid);
  const n = html(`<div class="card ${o.cls || ''}${mini ? ' mini' : ''}"${o.cc ? ` style="--cc:${o.cc}"` : ''}>${o.wm ? `<div class="wm">${o.wm}</div>` : ''}<div class="ch"${mn ? ` data-mn="${esc(o.mid)}" role="button" aria-expanded="${!mini}"` : ''}><h3>${esc(o.t)}</h3>${mn ? `<span class="mn" aria-hidden="true">${mini ? '▸' : '▾'}</span>` : ''}</div><div class="meta">${esc(o.meta || '')}</div>${o.dl && o.dl.length ? `<dl>${o.dl.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}<div class="body">${o.body || ''}</div><div class="ft"><span>${esc(o.foot || '')}</span></div></div>`);
  if (o.btn) n.querySelector('.ft').append(o.btn);
  if (o.extra) n.querySelector('.body').before(o.extra);
  if (mn) n.querySelector('.ch').addEventListener('click', () => setCardMin(n, o.ch, o.mid, !n.classList.contains('mini')));
  return n;
}
function setCardMin(n, ch, id, v) {
  n.classList.toggle('mini', v);
  const c = n.querySelector('.ch'); c.setAttribute('aria-expanded', String(!v)); c.querySelector('.mn').textContent = v ? '▸' : '▾';
  setMinId(ch, id, v); S.save();
}

// Collapsible heading + content, toggled in place (no redraw, so the page does not jump).
export function section(ch, id, label, content, extra) {
  const wrap = el('div');
  const car = el('span', { class: 'car' });
  const h = el('h3', { class: 'hi sec', role: 'button', 'data-sec': id }, car, label);
  const body = el('div', null, content);
  const set = v => { body.hidden = v; car.textContent = v ? '▸' : '▾'; h.setAttribute('aria-expanded', String(!v)); };
  set(isMin(ch, id));
  h.addEventListener('click', () => { const v = !body.hidden; set(v); setMinId(ch, id, v); S.save(); });
  h._set = set;
  wrap.append(el('div', { class: 'sech' }, h, extra), body);
  return wrap;
}
export function collapseTools(root, ch) {
  const all = v => {
    root.querySelectorAll('.card').forEach(n => { const c = n.querySelector('.ch[data-mn]'); if (c && n.classList.contains('mini') !== v) setCardMin(n, ch, c.dataset.mn, v); });
    root.querySelectorAll('[data-sec]').forEach(h => { if (h._set) { h._set(v); setMinId(ch, h.dataset.sec, v); } });
    S.save();
  };
  return el('div', { class: 'toolbar' }, el('button', { class: 'btn small', text: 'Collapse all', on: { click: () => all(true) } }), el('button', { class: 'btn small', text: 'Expand all', on: { click: () => all(false) } }));
}

export const rail = cards => el('div', { class: 'rail' }, cards);
export const col = cards => el('div', { class: 'col' }, cards);

// ---- builders ----
export function spellCard(s, ch, onRemove) {
  return gcard({
    mid: ch ? 's:' + key(s) : null, ch, wm: ICON[s.school], cc: COL[s.school], t: s.name,
    meta: `${ordl(s.level)} ${s.school.toLowerCase()}${s.ritual ? ' (ritual)' : ''}`,
    dl: [['Cast', s.time], ['Range', s.range], ['Comp.', s.comp], ['Dur.', s.dur]], body: s.text, foot: s.classes.join(', ') + ' · ' + s.source,
    btn: onRemove && el('button', { class: 'btn small', text: 'Remove', on: { click: onRemove } }),
  });
}
export function featCard(f, ch, onRemove) {
  return gcard({
    mid: ch ? 'f:' + f.key : null, ch, dl: f.asi ? [['Ability', f.asi]] : null, t: f.name,
    meta: [f.cat, f.pre && 'Prerequisite: ' + f.pre].filter(Boolean).join(' · '), body: f.text, foot: f.source,
    btn: onRemove && el('button', { class: 'btn small', text: 'Remove', on: { click: onRemove } }),
  });
}
export function speciesCards(p, ch) {
  return [gcard({ mid: ch ? 'p:' + p.key + ':basics' : null, ch, t: p.name, meta: 'Species', dl: [['Size', p.size], ['Speed', p.speed]].filter(x => x[1]), body: p.notes, foot: p.source })]
    .concat(p.traits.map(t => gcard({ mid: ch ? 'p:' + p.key + ':' + t.name : null, ch, t: t.name, meta: p.name, body: t.text, foot: p.source })));
}
export function classFeatCard(f, owner, sub, cn, mid, ch) {
  return gcard({ mid, ch, wm: ICON[cn || owner] || ICON._, cc: COL[cn || owner], t: f.name, meta: 'Level ' + f.level + ' · ' + owner, body: f.text, foot: owner, cls: sub ? 'sub' : '' });
}
export const isSubPH = f => /(^|\s)subclass( feature)?$/i.test(f.name);   // "You gain a subclass" placeholder features
export const cfeats = k => k.features.filter(f => !isSubPH(f));
export const byLvl = a => a.slice().sort((x, y) => x.level - y.level || x.name.localeCompare(y.name));
export const ordLvl = (a, r) => a.slice().sort((x, y) => (r ? y.level - x.level : x.level - y.level) || x.name.localeCompare(y.name));
