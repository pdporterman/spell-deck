// Tiny router shared by the pages (kept separate from main.js to avoid import cycles).
import * as S from './store.js';

let renderFn = () => {};
export const registerRender = fn => { renderFn = fn; };
export const rerender = () => renderFn();

// view: a character page id ('sheet', 'class', …), 'ref-spells' etc., or 'settings'.
// charId: a character id, or null for reference; omit to keep the current one.
export function go(view, charId) {
  const st = S.get();
  if (charId !== undefined) st.cur = charId;
  st.last = { view };
  const c = S.cur();
  if (c && !view.startsWith('ref-') && view !== 'settings') c.page = view;
  S.save();
  renderFn();
  window.scrollTo(0, 0);
}
export const hooks = {};
