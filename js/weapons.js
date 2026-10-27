// Attacks: add / edit weapons for the Character Sheet.
import * as S from './store.js';
import { D } from './data.js';
import { el, modal } from './ui.js';
import { WPROP } from './process.js';

const uid = () => Math.random().toString(36).slice(2, 9);
export const propText = w => (w.props || []).map(p => WPROP[p] || p).filter((x, i, a) => a.indexOf(x) === i).join(', ');

export function openWeaponForm(ch, w, done) {
  const isNew = !w, cur = w ? { ...w } : { id: uid(), prof: 1, mag: 0 };
  const opts = D.weapons || [];
  const pick = el('select', { 'aria-label': 'Weapon' }, el('option', { value: '', text: 'Custom weapon…' }), opts.map(x => el('option', { value: x.key, text: x.name + (x.cat ? ' (' + x.cat + ')' : ''), selected: cur.key === x.key })));
  const name = el('input', { type: 'text', value: cur.name || '', placeholder: 'Name', maxLength: 40, 'aria-label': 'Weapon name' });
  const dmg = el('input', { type: 'text', value: cur.dmg || '', placeholder: '1d8', maxLength: 12, 'aria-label': 'Damage dice' });
  const dt = el('input', { type: 'text', value: cur.dt || '', placeholder: 'slashing', maxLength: 20, 'aria-label': 'Damage type' });
  const fin = el('input', { type: 'checkbox', checked: (cur.props || []).includes('F') }), rng = el('input', { type: 'checkbox', checked: !!cur.rng });
  const mag = el('input', { type: 'number', inputMode: 'numeric', min: 0, max: 5, value: cur.mag || 0, 'aria-label': 'Magic bonus' });
  const dice = el('input', { type: 'text', value: cur.dice || '', placeholder: 'e.g. 1d6 fire', maxLength: 30, 'aria-label': 'Extra damage' });
  const prof = el('input', { type: 'checkbox', checked: cur.prof !== 0 });
  const abil = el('select', { 'aria-label': 'Ability' }, el('option', { value: '', text: 'Automatic (finesse uses the higher of Str/Dex)' }), el('option', { value: 'str', text: 'Strength', selected: cur.abil === 'str' }), el('option', { value: 'dex', text: 'Dexterity', selected: cur.abil === 'dex' }));
  const info = el('p', { class: 'muted small' });
  const custom = el('div', { class: 'form' }, el('label', null, 'Name', name), el('div', { class: 'row2' }, el('label', null, 'Damage dice', dmg), el('label', null, 'Damage type', dt)),
    el('label', { class: 'check' }, fin, 'Finesse'), el('label', { class: 'check' }, rng, 'Ranged'));
  const sync = () => {
    const base = opts.find(x => x.key === pick.value);
    custom.hidden = !!base;
    info.textContent = base ? [base.dmg + ' ' + base.dt, propText(base), base.range && 'range ' + base.range, base.mastery.length && 'Mastery: ' + base.mastery.join(', ')].filter(Boolean).join(' · ') : '';
  };
  pick.addEventListener('change', sync); sync();
  const body = el('div', { class: 'form' }, el('label', null, 'Weapon', pick), info, custom,
    el('div', { class: 'row2' }, el('label', null, 'Magical bonus (+N)', mag), el('label', null, 'Extra damage dice', dice)),
    el('label', null, 'Attack ability', abil), el('label', { class: 'check' }, prof, 'Proficient (adds proficiency bonus)'));
  const save = () => {
    const base = opts.find(x => x.key === pick.value);
    const o = base ? { key: base.key, name: base.name, dmg: base.dmg, dmg2: base.dmg2, dt: base.dt, props: base.props, rng: base.rng, range: base.range, mastery: base.mastery }
      : { key: '', name: name.value.trim() || 'Custom weapon', dmg: dmg.value.trim() || '1d6', dmg2: '', dt: dt.value.trim(), props: fin.checked ? ['F'] : [], rng: rng.checked, range: '', mastery: [] };
    Object.assign(cur, o, { mag: Math.max(0, Math.min(5, parseInt(mag.value, 10) || 0)), dice: dice.value.trim(), prof: prof.checked ? 1 : 0, abil: abil.value });
    if (!abil.value) delete cur.abil;
    ch.weapons = ch.weapons || [];
    const i = ch.weapons.findIndex(x => x.id === cur.id);
    if (i >= 0) ch.weapons[i] = cur; else ch.weapons.push(cur);
    S.save(); done && done();
  };
  const actions = [{ label: 'Cancel' }];
  if (!isNew) actions.unshift({ label: 'Remove', kind: 'danger', onClick: () => { ch.weapons = ch.weapons.filter(x => x.id !== cur.id); S.save(); done && done(); } });
  actions.push({ label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: save });
  modal({ title: isNew ? 'Add weapon' : 'Edit weapon', body, actions, noFocus: true });
}
