# Spell Deck

A home-screen web app for D&D 5e players: build characters, keep a sheet, class features, feats and species, a spell deck
and counters. Data comes from 5etools and is kept on the device, so it works offline after the first load.

## Files

```
index.html            app shell (top banner, bottom banner, menu)
manifest.webmanifest  home-screen install info
sw.js                 service worker (offline cache). Change VERSION when you upload new files.
css/style.css         look and feel (day + night mode, cards)
js/main.js            entry point: side menu, banners, page router
js/store.js           saved state (characters, settings, filters) + migration from older versions
js/nav.js             tiny router     js/ui.js   element/popup helpers     js/theme.js   night mode + text size
js/data.js            5etools download + on-device storage (IndexedDB)    js/process.js  turns 5etools files into app lists
js/res.js             resources (spell slots, class/species/feat uses, rests)
js/fmt.js             text cleanup    js/icons.js  card symbols           js/rules.js    stat math (modifiers, bonuses)
js/cards.js           the cards       js/lists.js  searchable lists       js/filters.js  multi-select filters
js/pickers.js         spell / feat / class popups       js/charform.js    new + edit character popup
js/pages/             one file per page: sheet, counters, traits, class, spells, resources, ref (Reference), settings
icons/                app icons
```

## Pages

Each character picks which pages it uses (and their order) when created or edited:
Character Sheet, Class Abilities, Features & Traits, Spells, Resources, Counters. The dots at the bottom jump between them;
the arrows move to the next/previous page. The Edit button (top right) changes whatever page you are on.

## Host it on GitHub Pages

Put every file in this folder at the root of the repository (keep the folders), then Settings → Pages → `main` branch.
After uploading new files, change `VERSION` in `sw.js` and check Settings → "App version" in the app.
