# To do

Work that is known, wanted and not done yet. Ordered roughly by when it should happen.

## Start here: getting 0.2.0 ready

The module is now "Scorpious187's HUD UI for 5e and PF2e/SF2e" (the title; its id is unchanged,
so existing installs keep working). Its fonts are all Latin woff2, and its stylesheets load once.
What is left, in order:

1. **Look at the newest work in Foundry, in a 5e world and a PF2e world.** Relaunch (the fonts
   changed). With sequences on: the Journal coming out of its satchel and its writing fading in,
   and going back in; the Vambrace's arcane bolts; the Journal and the Vambrace in the sidebar,
   chat, player list and carousel (paper, and dark glass); typing experience and level;
   right-clicking experience, hero points and an item; dragging an item into a container and onto
   the macro bar; PF2e's resistances and the damage formulas on the strikes. The satchel's flap
   turns up above the art's frame: check nothing in Foundry's interface cuts it off.
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
      as they would on the system's sheet, and into a container dropped on, in every system.
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
- [ ] **What the mock-up has that the build does not** — the Actions tab's encounter /
      exploration / downtime filter; the dossier's shield controls (−5, regen), credits and
      omni-gel. (Each strike's damage formula is on its Damage and Critical buttons.)
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
- [ ] **More fantasy looks** — the Reliquary, Runeforge and Witchfire over the Vambrace and the
      Grove over the Journal are mocked up (`?mockup`, Fantasy look) as palettes over the built
      devices. Building one means its palette as a device, its own art (the mock-up recolors the
      existing art with filters) and its own corner marks and textures.

## Sci-fi devices

`design/theme-ideas.md` has the research and seven proposals: a Holoprojector, Datapad and
Beskar vambrace for Star Wars games (SW5e may already run on the dnd5e system), a Comm unit for
Starfinder, an Esper core for Esper Genesis, a Retro terminal for horror in space and a Cyberdeck.
Decide the naming question there before any of them ships.

- [ ] **Pick the first** — the Holoprojector is the closest to what the module already does.

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
