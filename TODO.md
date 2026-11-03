# To do

Work that is known, wanted and not done yet. Ordered roughly by when it should happen.

## Start here: getting 0.2.0 ready

Everything below "Start here" is built, deployed and passing its tests in the harness. What is
left before the module is ready is mostly looking at it in Foundry, in that order:

1. **Try both fantasy devices in Foundry, in a 5e world and a PF2e world.** Neither has been
   seen outside the test harness. For each, with sequences on: open and close it; switch tabs;
   type in the Biography (the editor's toolbar should stay on one row); roll something, so the
   chat card and the latest-roll strip show; and look at Calendaria's HUD and the carousel. The
   Journal needs a full relaunch after deploying, for its fonts.
2. **Decide the module's name.** It is still "Sci-Fi Character HUD" in `module.json` and the
   README, which now describe two fantasy devices as well. Renaming the id would break the
   install for anyone who has it; the title can change freely.
3. **Fonts as woff2.** The Journal's and the Vambrace's fonts ship as TTFs, 3.9 MB in `fonts/`
   in all. Cutting them to Latin woff2 like the rest needs `pip install fonttools brotli`, then
   `pyftsubset` per file; the size of the module download is the only thing it changes.
4. **Stylesheets loaded twice** (Loose ends, below): the one known cost at load time.
5. **Release.** Bump nothing until 1–4 are done: `module.json` is at 0.2.0 with its manifest
   and download URLs pointing at the GitHub release, and CHANGELOG.md's 0.2.0 section is the
   release notes. The repo has no remote yet.

Everything after this section is wanted, not needed for the release.

## Editing from the projection

Hit points are typed now — an amount with Heal and Damage, the value itself editable, and
right-click for maximum and temporary. The same treatment is wanted for everything else that
changes during play. Anything that changes at level-up or character creation stays on the
system's own sheet, which the book button opens.

- [x] **Spell slots (5e)** — spend and regain from the Spells tab.
- [x] **Dropping onto the projection** — items, spells, effects, conditions and folders land
      as they would on the system's sheet, and into a container dropped on, in every system.
- [ ] **Dragging out of the projection** — its rows cannot be picked up, so an item already
      carried cannot be dragged into a container, onto another sheet or onto the macro bar.
- [ ] **Experience and level** — typed, like hit points.
- [ ] **Item names, quantities and notes** — quantity and equipped are there; the rest is not.
- [x] **Biography** — the whole tab, editable in place, in every system.
- [ ] **Right-click elsewhere** — the same editor pattern for any value with more behind it
      than one number (temporary hit points, shields, hero points).

## Next

- [ ] **Remaining tab bodies** — PF2e crafting, 5e bastion and special traits.
- [ ] **PF2e and SF2e, from the review against the sheet** — immunities, weaknesses and
      resistances; toggles for roll options, and counters on effects; special resources, stamina
      and resolve; real names for size and languages, senses, other speeds and reach; the
      initiative box following the statistic actually rolled; typing a loaded magazine's count.
- [ ] **What the mock-up has that the build does not** — the Actions tab's encounter /
      exploration / downtime filter; the damage formula on each strike's Damage button
      ("Damage 3d8+6"); the dossier's shield controls (−5, regen), credits and omni-gel.
- [ ] **Translatable strings** — every label in `projection/panels.mjs` and the adapters is
      written in English in the markup. Move them to `lang/en.json`; `tools/check.mjs` will
      then hold them to it.
- [ ] **The readout** — currently name, type, traits and description. The mock-up also showed
      per-kind detail (skill breakdowns, tier lists for Paragon/Renegade).

## Fantasy devices

The approved look is `design/fantasy-mockup.html`. Both work in 5e, PF2e and SF2e.

- [x] **Adventurer's Journal** — the open book, its strap, its sequence and its paper palette.
- [x] **Runic Vambrace** — the bracer, its runes and gem, the sigil sequence, dark glass panels
      and rune-stone tabs.
- [ ] **The fantasy fonts as woff2** — see Start here, 3.
- [ ] **Each device's own words** — the fantasy devices' "Field notes", "Lore", "Conditions",
      "Wards & Hexes", "Last roll" and "Last casting" are in `WORDS` in `panels.mjs`; they belong
      in `lang/en.json` with the rest (and see Translatable strings, above).
- [ ] **More fantasy looks** — the variations proposed with the first two: a Reliquary
      (stained glass, for clerics), a Grove (living wood), a Runeforge (stone and brass) and
      Witchfire (bone and green flame). Each is a palette and art on one of the two built so far.

## Sidebar panels, one at a time

`styles/interface.css` gives the interface the device's colors, edges and glow. Each panel still
needs its own pass — that gets the colors right, not the shape.

- [ ] **Chat** — message frames, whispers, dice totals, 5e's cards and the chat input are in the
      device's colors. Left: the roll-mode picker and the controls around the input, and a
      shape pass so roll results read like the device's own readout.
- [ ] **Actors, Items, Journal, Tables, Cards, Playlists directories** — folder rows, entry rows,
      the search box and the create buttons.
- [ ] **Compendium** — pack rows and the pack browser.
- [ ] **Settings tab** — the module and game settings lists.
- [ ] **Sidebar tab strip** — the icons themselves, not just their active state.
- [ ] **Popped-out sidebar tabs** — they render outside the interface regions, so the palette
      scoping does not reach them. Decide whether they should be themed too.

## After that

- [ ] **Compact layout** — the projection's panels rearranged below a width threshold.
- [ ] **Per-character device** — a character can carry its own device choice in an actor
      flag, overriding the player's.
- [ ] **Scene controls and the Token HUD** — recolored, and the controls have sci-fi icons; the
      mock-up's cut corners and station look are not applied. (The scene list is now the
      module's own scene bar.)

## Loose ends

- [ ] **Stylesheets loaded twice** — `ensureStyles` loads the stylesheets Foundry's own
      `@import`s already bring in.
- [ ] **PF2e skill descriptions** — 5e skills and tools show their rules text in the readout;
      PF2e and SF2e skills show only their name.
- [ ] **The rest of 5e's Favorites** — items, spells and features can be favorited; the sheet
      also favorites skills, tools and activities.
- [ ] **Creating and deleting items** — the projection adds items from the quick search but has
      no blank create, and no delete.
- [ ] **Calendaria's dome** — the sky above its HUD is drawn by Calendaria in its own colors and
      is not in the device's.
