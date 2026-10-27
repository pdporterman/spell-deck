// Reference pages (no character): searchable lists of spells, feats, species and classes.
import { fitPad } from '../ui.js';
import { spellList, featList, speciesList, classList } from '../lists.js';

export const titles = { 'ref-spells': 'Spells', 'ref-feats': 'Feats', 'ref-species': 'Species', 'ref-class': 'Class' };
const makers = { 'ref-spells': spellList, 'ref-feats': featList, 'ref-species': speciesList, 'ref-class': classList };

export function mount(root, view) {
  const make = makers[view];
  const fit = () => fitPad(root);
  const list = view === 'ref-spells' || view === 'ref-feats' || view === 'ref-species' ? make(null, fit) : make(fit);
  root.append(list.root);
  const on = () => fit();
  addEventListener('resize', on);
  return () => removeEventListener('resize', on);
}
