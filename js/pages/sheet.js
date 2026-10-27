// Character Sheet: hit points and the six ability cards (modifier, saving throw, skills).
import * as S from '../store.js';
import { STATS } from '../store.js';
import { el, clear, modal, amountBox, sgn } from '../ui.js';
import { gcard, collapseTools } from '../cards.js';
import { D } from '../data.js';
import { pbOf, hasJoat, bardLevel, BTO, btoName, calc, castAbil, ABK } from '../rules.js';
const ABN = Object.fromEntries(STATS.map(a => [a[0], a[1]]));

export const title = 'Character Sheet';

function hpBlock(ch, redraw) {
  const h = ch.hp;
  const box = el('div', { class: 'ctr' });
  const draw = () => {
    clear(box);
    const pct = h.max > 0 ? Math.max(0, Math.min(100, h.cur / h.max * 100)) : 0;
    const bar = el('div', { class: 'hp-bar', 'data-level': h.cur <= 0 ? 'down' : pct <= 25 ? 'low' : pct <= 60 ? 'mid' : 'ok' }, el('i', { style: 'width:' + pct + '%' }));
    box.append(el('div', { class: 'ctr-head' }, el('b', { text: 'Hit points' }), h.temp ? el('span', { class: 'muted', text: '+' + h.temp + ' temp' }) : null),
      el('div', { class: 'cn' }, String(h.cur), el('small', { text: h.max ? ' / ' + h.max : '' })), bar);
    if (!h.max) box.append(el('p', { class: 'muted small', text: 'Set your maximum HP with Edit (top right).' }));
    box.append(amountBox(d => {
      if (d < 0) { let dmg = -d; const t = Math.min(h.temp, dmg); h.temp -= t; dmg -= t; h.cur = Math.max(0, h.cur - dmg); }
      else h.cur = h.max ? Math.min(h.max, h.cur + d) : h.cur + d;
      S.save(); draw();
    }, ['Damage', 'Heal']));
    box.append(el('div', { class: 'ctr-head', style: 'margin-top:.7rem' }, el('b', { text: 'Temporary HP' }), el('span', { class: 'cn', style: 'font-size:1.4rem;margin:0', text: String(h.temp) })));
    box.append(amountBox(d => { h.temp = Math.max(0, h.temp + d); S.save(); draw(); }, ['Remove temp HP', 'Add temp HP']));
  };
  draw();
  return box;
}

function combatPanel(ch, c) {
  const cb = ch.cb, hit = cb.hit || 0, row = (l, v, small) => `<div class="srow"><span>${l}${small ? ` <small>${small}</small>` : ''}</span><b>${v}</b></div>`;
  const p = D.species.find(x => x.key === ch.species), ab = castAbil(ch);
  let h = row('Armor Class', cb.ac || '—') + row('Initiative', sgn(c.mod.dex + (cb.init || 0))) + row('Speed', p && p.speed ? p.speed : '—') + row('Passive Perception', 10 + c.skill('wis', 'Perception').v);
  h += row('Weapon attack', sgn(c.pb + c.mod.str + hit) + ' melee · ' + sgn(c.pb + c.mod.dex + hit) + ' ranged', 'proficient');
  if (ab) h += row('Spell save DC', 8 + c.pb + c.mod[ab] + (cb.dc || 0), ABN[ab]) + row('Spell attack', sgn(c.pb + c.mod[ab] + (cb.spatk || 0)), ABN[ab]);
  return el('div', { class: 'ctr' }, el('div', { class: 'ctr-head' }, el('b', { text: 'Combat' })), el('div', { html: h }));
}

export function mount(root, { ch, redraw }) {
  const c = calc(ch), lv = S.total(ch), jb = hasJoat(ch) ? Math.floor(c.pb / 2) : 0;
  root.append(el('p', { class: 'who' }, 'Proficiency bonus ', el('b', { text: sgn(c.pb) }), ' · ' + (lv ? 'character level ' + lv : 'no class levels yet, using level 1'), jb ? ' · Jack of All Trades ' + sgn(jb) : ''));
  root.append(el('div', { class: 'ctr-grid' }, hpBlock(ch, redraw), combatPanel(ch, c)));
  const cards = STATS.map(([k, n, sk]) => {
    const line = (label, tags, v) => `<div class="srow"><span>${label}${tags.length ? ` <small>${tags.join(', ')}</small>` : ''}</span><b>${sgn(v)}</b></div>`;
    const sv = c.save(k);
    let body = line('Saving throw', sv.tags, sv.v);
    for (const x of sk) { const r = c.skill(k, x); body += line(x, r.tags, r.v); }
    const add = c.score[k] - ch.sc[k];
    return gcard({ mid: 'st:' + k, ch, cls: 'st', t: n + ' ' + sgn(c.mod[k]), meta: 'Score ' + c.score[k] + (add ? ' (' + ch.sc[k] + ' base +' + add + ' from feats/species)' : ''), body });
  });
  root.append(collapseTools(root, ch), el('div', { class: 'stat-grid' }, cards));
}

// ---- edit popup: HP, scores, proficiencies, bonuses ----
export function edit({ ch, redraw }) {
  const num = (v, min, max, def) => { let n = Math.round(parseFloat(v)); if (!(n >= min)) n = def; return Math.min(max, n); };
  const body = el('div', { class: 'form' });
  const draw = () => {
    clear(body);
    const maxHp = el('input', { type: 'number', inputMode: 'numeric', min: 0, value: ch.hp.max || '', placeholder: 'Max HP' });
    const curHp = el('input', { type: 'number', inputMode: 'numeric', min: 0, value: ch.hp.cur, placeholder: 'Current HP' });
    maxHp.addEventListener('change', () => { const was = ch.hp.max; ch.hp.max = num(maxHp.value, 0, 9999, 0); if (!was || ch.hp.cur === was) ch.hp.cur = ch.hp.max; curHp.value = ch.hp.cur; S.save(); });
    curHp.addEventListener('change', () => { ch.hp.cur = num(curHp.value, 0, 9999, 0); S.save(); });
    body.append(el('h3', { class: 'hi', text: 'Hit points' }), el('div', { class: 'row2' }, el('label', null, 'Max', maxHp), el('label', null, 'Current', curHp)));
    const nin = (key, ph) => { const i = el('input', { type: 'number', inputMode: 'numeric', value: ch.cb[key] || '', placeholder: ph || '0' }); i.addEventListener('change', () => { const v = parseInt(i.value, 10); if (v) ch.cb[key] = v; else delete ch.cb[key]; S.save(); }); return i; };
    const castSel = el('select', { 'aria-label': 'Spellcasting ability', on: { change: e => { if (e.target.value) ch.cb.cast = e.target.value; else delete ch.cb.cast; S.save(); } } }, el('option', { value: '', text: 'Automatic (from class)' }), STATS.map(([k, n]) => el('option', { value: k, text: n, selected: ch.cb.cast === k })));
    body.append(el('h3', { class: 'hi', text: 'Combat' }), el('div', { class: 'row2' }, el('label', null, 'Armor Class', nin('ac', '10')), el('label', null, 'Initiative bonus', nin('init'))),
      el('div', { class: 'row2' }, el('label', null, 'Bonus to hit (all attacks)', nin('hit')), el('label', null, 'Spell attack bonus', nin('spatk'))), el('div', { class: 'row2' }, el('label', null, 'Spell save DC bonus', nin('dc')), el('label', null, 'Spellcasting ability', castSel)));
    body.append(el('h3', { class: 'hi', text: 'Base ability scores' }), el('p', { class: 'muted small', text: 'Feat and species bonuses are added automatically.' }), el('div', { class: 'row2', style: 'flex-wrap:wrap' }, STATS.map(([k, n]) => {
      const i = el('input', { type: 'number', inputMode: 'numeric', min: 1, max: 30, value: ch.sc[k] });
      i.addEventListener('change', () => { ch.sc[k] = num(i.value, 1, 30, 10); i.value = ch.sc[k]; S.save(); });
      return el('label', { style: 'flex:1 1 30%' }, n, i);
    })));
    body.append(el('h3', { class: 'hi', text: 'Proficiencies' }));
    for (const [k, n, sk] of STATS) {
      body.append(el('div', { class: 'pickrow' }, el('label', { class: 'check n' }, el('input', { type: 'checkbox', checked: !!ch.pf['save:' + k], on: { change: e => { e.target.checked ? ch.pf['save:' + k] = 1 : delete ch.pf['save:' + k]; S.save(); } } }), n + ' saving throw')));
      for (const x of sk) {
        const sel = el('select', { 'aria-label': x, on: { change: e => { +e.target.value ? ch.pf[x] = +e.target.value : delete ch.pf[x]; S.save(); } } },
          el('option', { value: 0, text: 'None' }), el('option', { value: 1, text: 'Proficient', selected: ch.pf[x] === 1 }), el('option', { value: 2, text: 'Expertise', selected: ch.pf[x] === 2 }));
        body.append(el('div', { class: 'pickrow' }, el('span', { class: 'n', text: x }), sel));
      }
    }
    body.append(el('h3', { class: 'hi', text: 'Bonuses' }));
    const auto = bardLevel(ch) >= 2;
    body.append(el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: auto || !!ch.bon.joat, disabled: auto, on: { change: e => { ch.bon.joat = e.target.checked ? 1 : 0; S.save(); } } }), 'Jack of All Trades' + (auto ? ' (automatic: Bard level 2+)' : ''), ));
    body.append(el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: !!ch.bon.ra, on: { change: e => { ch.bon.ra = e.target.checked ? 1 : 0; S.save(); } } }), 'Remarkable Athlete'));
    ch.bon.list.forEach(b => body.append(el('div', { class: 'pickrow' }, el('span', { class: 'n' }, b.name + ' ', el('small', { class: 'muted', text: sgn(b.amt) + ' · ' + btoName(b.to) })),
      el('button', { class: 'btn small danger', text: 'Remove', on: { click: () => { ch.bon.list = ch.bon.list.filter(x => x.id !== b.id); S.save(); draw(); } } }))));
    const bn = el('input', { type: 'text', placeholder: 'Name (e.g. Bless)' }), ba = el('input', { type: 'number', inputMode: 'numeric', placeholder: '+1', style: 'width:5rem' });
    const bt = el('select', null, BTO.map(([v, l]) => el('option', { value: v, text: l })));
    body.append(el('div', { class: 'form', style: 'margin-top:.5rem' }, bn, el('div', { class: 'row2' }, ba, bt), el('button', { class: 'btn', text: '+ Add custom bonus', on: { click: () => {
      const a = parseInt(ba.value, 10); if (!a) { ba.focus(); return; }
      ch.bon.list.push({ id: S.uid(), name: bn.value.trim() || 'Bonus', amt: a, to: bt.value }); S.save(); draw();
    } } })));
  };
  draw();
  modal({ title: 'Edit character sheet', wide: true, body, actions: [{ label: 'Done', kind: 'primary' }], noFocus: true, onClose: redraw });
}
