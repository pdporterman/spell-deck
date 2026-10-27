import * as S from '../store.js';
import * as nav from '../nav.js';
import * as D from '../data.js';
import { el, toast, confirmBox } from '../ui.js';
import { applySettings } from '../theme.js';

export const VER = 22;
export const title = 'Settings';
const PX_MIN = 12, PX_MAX = 28;

function download(name, text) {
  const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name });
  document.body.append(a); a.click(); a.remove();
}
const today = () => new Date().toISOString().slice(0, 10);
const pickFile = onText => el('input', { type: 'file', accept: 'application/json,.json', hidden: true, on: { change: async e => { const f = e.target.files[0]; e.target.value = ''; if (f) onText(await f.text()); } } });

export function mount(root, { status }) {
  const set = S.get().settings;
  const row = (t, d, c) => el('div', { class: 'set-row' }, el('div', null, el('b', { text: t }), d ? el('p', { class: 'muted small', text: d }) : null), c);
  const sw = (key, label) => el('input', { type: 'checkbox', role: 'switch', checked: set[key], 'aria-label': label, on: { change: e => { set[key] = e.target.checked; S.save(); applySettings(); } } });

  // text size: - [slider] + in px
  const out = el('output', { text: set.px + ' px' });
  const slider = el('input', { type: 'range', min: PX_MIN, max: PX_MAX, step: 1, value: set.px, 'aria-label': 'Text size' });
  const setPx = v => { set.px = Math.max(PX_MIN, Math.min(PX_MAX, v)); slider.value = set.px; out.textContent = set.px + ' px'; S.save(); applySettings(); };
  slider.addEventListener('input', () => setPx(+slider.value));
  const size = el('div', { class: 'size-ctl' }, el('button', { class: 'btn small icon', text: '-', 'aria-label': 'Smaller text', on: { click: () => setPx(set.px - 1) } }), slider, el('button', { class: 'btn small icon', text: '+', 'aria-label': 'Larger text', on: { click: () => setPx(set.px + 1) } }), out);

  const st = el('p', { class: 'muted small', role: 'status', text: D.counts() });
  const chars = Object.values(S.get().chars);
  const importer = pickFile(text => {
    try { const c = S.importChar(text); toast('Imported ' + c.name); nav.go(c.pages[0], c.id); } catch (e) { toast('That file is not a character export'); }
  });
  const restorer = pickFile(async text => {
    try { JSON.parse(text); if (await confirmBox('Replace everything on this device with this backup?', 'Replace')) { S.importAll(text); applySettings(); nav.go('settings'); toast('Backup restored'); } } catch (e) { toast('That file is not a valid backup'); }
  });

  root.append(el('h2', { text: 'Settings' }),
    el('section', { class: 'panel' },
      row('Night mode', null, sw('night', 'Night mode')),
      row('Text size', 'In pixels. Cards scale with it.', size),
      row('Group feats by category', 'Origin, General… on the Features & Traits page.', sw('groupFeats', 'Group feats')),
      row('Resources as counters', 'Resources page shows a number you add to or subtract from, instead of the check-box table.', sw('resAsCounter', 'Resources as counters')),
      row('Newest class abilities first', 'Class Abilities shows your highest levels first.', sw('newestFirst', 'Newest first'))),
    el('section', { class: 'panel' }, el('h3', { text: 'Characters' }),
      el('p', { class: 'muted small', text: 'Export one character to a file to share or move it, or import one. Everything else stays on this device.' }),
      chars.length ? el('div', { class: 'toolbar' }, chars.map(c => el('button', { class: 'btn small', text: 'Export ' + c.name, on: { click: () => download(c.name.replace(/\W+/g, '-') + '-' + today() + '.json', S.exportChar(c)) } }))) : null,
      el('div', { class: 'toolbar' }, el('label', { class: 'btn', text: 'Import a character' }, importer)),
      el('div', { class: 'toolbar' }, el('button', { class: 'btn', text: 'Back up everything', on: { click: () => download('spelldeck-backup-' + today() + '.json', S.exportAll()) } }), el('label', { class: 'btn', text: 'Restore a backup' }, restorer))),
    el('section', { class: 'panel' }, el('h3', { text: '5etools data' }), st,
      el('div', { class: 'toolbar' }, el('button', { class: 'btn', text: 'Update now', on: { click: () => { st.textContent = 'Updating…'; D.init(true, nav.rerender, t => { st.textContent = t; }); } } }))),
    el('p', { class: 'muted small', text: 'App version ' + VER }));
}
