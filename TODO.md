# To do

Work that is known, wanted and not done yet. Ordered roughly by when it should happen.

## Start here: getting 0.2.0 ready

The module is now "Scorpious187's HUD UI for 5e and PF2e/SF2e" (the title; its id is unchanged,
so existing installs keep working). Its fonts are all Latin woff2, and its stylesheets load once.
What is left, in order:

1. **Look at the newest work in Foundry, in a 5e world and a PF2e world.** Relaunch first (a
   stylesheet was added). Seen in Foundry and good: the four looks, the Journal's interface in
   the dark, and the scene bar's preview under the pointer. Seen, and fixed from what was seen:
   the Journal's satchel and what else is in it, the experience and level fields, the identity
   strip, and dropping an item from another character's sheet (PF2e). Not seen yet:
   - **The satchel's clutter since the fix** — up only once the flap has gone.
   - **The seven sci-fi looks** — their art, colors and interface, and the Holoprojector's,
     Retro terminal's and Cyberdeck's own openings.
   - **The Actions tab's three kinds and the dossier's shields, credits and omni-gel.**
   - **The rest from the last batch** — the Vambrace's arcane bolts; right-clicking experience,
     hero points and an item; dragging an item into a container and onto the macro bar; PF2e's
     resistances and the damage formulas on the strikes; and the carousel in each fantasy device.
   - **The satchel's flap** turns up above the art's frame: check nothing in Foundry's interface
     cuts it off.
2. **Release.** `module.json` is at 0.2.0 with its manifest and download URLs pointing at the
   GitHub release, and CHANGELOG.md's 0.2.0 section is the release notes. The repo has no remote
   yet.

Everything after this section is wanted, not needed for the release.

## Editing from the projection

Hit points are typed now — an amount with Heal and Damage, the value itself editable, and
right-click for maximum and temporary. The same treatment is wanted for everything else that
changes during play. Anything that changes at level-up or character creation stays on the
system's own sheet, which the book button opens.

- [x] **Spell slots (5e)** — spend and regain from the Spells tab.
- [x] **Dropping onto the projection** — items, spells, effects, conditions and folders land
      as they would on the system's sheet, and into a container dropped on, in every system. An
      item from another character's inventory moves in PF2e and SF2e; in 5e it is copied unless
      Shift is held, as on 5e's own sheet.
- [x] **Dragging out of the projection** — an item's or effect's name can be picked up, with the
      drag data the system's sheet gives: into a container, onto another sheet or the macro bar.
- [x] **Experience and level** — experience typed in both systems; the level too in PF2e and
      SF2e (5e's comes from class levels, which stay on the sheet).
- [ ] **Item names, quantities and notes** — names and quantities from an item's right-click
      editor; notes (the item's description) are not editable from the projection yet.
- [x] **Biography** — the whole tab, editable in place, in every system.
- [ ] **Right-click elsewhere** — hit points (with maximum and temporary), experience (with the
      level) and hero points have their editor. Left: shields, and 5e's inspiration and hit dice.

## Next

- [ ] **Remaining tab bodies** — PF2e crafting, 5e bastion and special traits.
- [ ] **PF2e and SF2e, from the review against the sheet** — toggles for roll options, and
      counters on effects; special resources, stamina and resolve; real names for size and
      languages, senses, other speeds and reach; the initiative box following the statistic
      actually rolled; typing a loaded magazine's count. (Immunities, weaknesses and resistances
      are done, in the defenses panel, and 5e's too.)
- [x] **What the mock-up has that the build does not** — the Actions tab's encounter /
      exploration / downtime filter (PF2e and SF2e); the dossier's shield controls (−5, and the
      recharge), credits and omni-gel; each strike's damage formula on its Damage and Critical
      buttons. Not seen in Foundry yet.
- [ ] **Translatable strings** — every label in `projection/panels.mjs` and the adapters is
      written in English in the markup. Move them to `lang/en.json`; `tools/check.mjs` will
      then hold them to it.
- [ ] **The readout** — currently name, type, traits and description. The mock-up also showed
      per-kind detail (skill breakdowns, tier lists for Paragon/Renegade).

## Fantasy devices

Both work in 5e, PF2e and SF2e. `design/fantasy-mockup.html` was the first, static design, drawn
before either was built; the live mock-ups are now in the harness (`?mockup`), on the real
projection, and new work is tried there.

- [x] **Adventurer's Journal** — the open book, its satchel, its sequence and its paper palette.
- [x] **Runic Vambrace** — the bracer, its runes and gem, the sigil sequence with its arcane
      bolts, dark glass panels and rune-stone tabs.
- [x] **The fantasy fonts as woff2**, and **each device's own words** in `lang/en.json`.
- [x] **Their interface** — the sidebar, chat, player list, controls and carousel as paper (the
      Journal) and dark glass (the Vambrace), as the static mock-up drew them.
- [x] **The Journal's satchel and fade-in ink** — the book comes out of a satchel whose straps
      pull free and whose flap turns away, and its writing fades in from the spine like the
      Marauder's Map's. Built from the mock-ups, which have left the harness.
- [x] **More fantasy looks** — the Reliquary, Runeforge and Witchfire over the Vambrace and the
      Grove over the Journal, each picked like a device. A look is a device with a `base`: it
      keeps its base's layout, board, sequence and words, and brings its own palette and marks
      (`styles/looks.css`) and its own art, drawn from the base's with its own metal or leather,
      stone and glyphs (`scripts/device/art.mjs`). The Vambrace's bolts take the look's colors.
      Seen in Foundry and good.
- [x] **The Journal's interface in the dark** — a setting: the sidebar, chat, player list,
      controls, scene bar and turn order in dark leather with pale ink, the Grove's in dark green;
      the book stays paper. Seen in Foundry and good.
- [x] **Odds and ends in the satchel** — a map, pages, a sealed letter, a quill and a vial, packed
      out of sight while the flap is shut and up beside the book once it has gone.
- [ ] **The looks' own words** — a look keeps its device's panel names, so the Reliquary's
      effects are "Wards & Hexes" like the Vambrace's. A cleric's might want their own (and see
      Sci-fi devices).

## Sci-fi devices

`design/theme-ideas.md` has the research, the seven proposals and the naming decision: a device or
a look is named for what it is, never for the game it suits.

- [x] **The seven, built as looks** — the Holoprojector, Armored gauntlet and Comm unit over the
      omni-tool, the Datapad and the Retro terminal over the wrist computer, the Crystal core over
      the Vambrace and the Cyberdeck over TRON. The Holoprojector, Retro terminal
      and Cyberdeck open their own way: a look can now carry its own opening (its animations in
      `styles/looks.css`, its length a `sequence` of its own in `SEQ_LONG`). Not seen in Foundry
      yet.
- [ ] **The omni-tool, TRON and EVA's names** — still named for the works they come from; decide
      whether to rename them, as the new looks are named for what they are.
- [ ] **Their own words** — like the fantasy looks, a sci-fi look keeps its device's panel names
      (the Crystal core says "Wards & Hexes").

## Sidebar panels, one at a time

`styles/interface.css` gives the interface the device's colors, edges and glow. Each panel still
needs its own pass — that gets the colors right, not the shape.

- [ ] **Chat** — message frames, whispers, dice totals, 5e's cards and the chat input are in the
      device's colors, and the fantasy devices have their own (paper cards; dark glass edged in
      light). Left: the roll-mode picker and the controls around the input, and a shape pass so
      roll results read like the device's own readout on the sci-fi devices.
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

- [ ] **PF2e skill descriptions** — 5e skills and tools show their rules text in the readout;
      PF2e and SF2e skills show only their name.
- [ ] **The rest of 5e's Favorites** — items, spells and features can be favorited; the sheet
      also favorites skills, tools and activities.
- [ ] **Creating and deleting items** — the projection adds items from the quick search but has
      no blank create, and no delete.
- [ ] **Calendaria's dome** — the sky above its HUD is drawn by Calendaria in its own colors and
      is not in the device's.
