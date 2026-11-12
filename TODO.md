# To do

Work that is known, wanted and not done yet. Ordered roughly by when it should happen.

## Start here

1.0.0 was released on 2026-11-05 from
[nscarpinatodev/scorpious187s-scifi-character-hud](https://github.com/nscarpinatodev/scorpious187s-scifi-character-hud),
verified against Foundry 14, PF2e 8.6.1, SF2e 1.6.1 and D&D 5e 6.0.6, and the same day 1.0.1
and 1.0.2 (sharing the screen with PF2e HUD) and 1.1.0 (the GM's projection follows the selected
token, NPCs included). It needs Scorpious187's Module Library, the family's shared base, whose
update board carries the HUD (`scorpious187s-scifi-character-hud-update.json` in
scorpious187-updates). Verified since against PF2e 8.7.0 and SF2e 1.7.0, both out on 2026-11-05.
Then 1.1.1 and 1.1.2, 1.2.0 (devices by category, scenes viewed on a click, everyone's volume) and
1.3.0 (PF2e skill readouts, 5e favorites for skills, tools and activities, and making and deleting
items), all on 2026-11-05. Then 1.4.0 on 2026-11-06: Fallout 2d20 with Scorpious187's Pip-Boy (the
Lonestar armband, the system's AP tracker on it, its chat cards readable), the carousel's
turning, labels on private messages, and the PF2e/SF2e fixes from the 2026-11-05 session. Then
1.5.0 on 2026-11-08: D&D 3.5e (D35E 3.1.0, checked live on a Foundry 13 server), the HUD drawn over
PF2e HUD's shortcut slots, and the Journal fitting a long name to its page. Its release build is
the first on the Node 24 actions, and passed with no Node.js 20 warning. Then 1.6.0 on
2026-11-11: D&D 5e sheet tabs as a labeled row, the Journal's size, labels that fit, and the
Journal on paper and the Crystal core gone over for text that could not be read. The sheet tabs
and the readability fixes went out tested on the harnesses but not seen in Foundry (items 1 and
2 below). Then 1.6.1 on 2026-11-12: with the tab row on, a character's header and the row itself
could not be clicked in the system's dark theme. Then 1.7.0 the same day: D&D 5e items named in
the color of their rarity and unprepared spells grayed, on the system's sheets and in the
projection, a vitals panel that fits what is in it, and temporary hit points under the bar.

Everything built so far has been seen in Foundry and is good: the looks, fantasy and sci-fi, with
their own openings; the Journal's satchel, its clutter and flap, and its interface in the dark;
the Vambrace's arcane bolts; the sidebar's panels; the scene bar's preview; the Actions tab's
three kinds; the dossier's shields, credits and omni-gel; right-clicking, dragging and dropping;
PF2e's resistances and damage formulas; the carousel in each fantasy device; what the sheet had
that the projection did not (toggles, effect counters, Stamina, Resolve and special resources,
initiative, the Character tab's names, speeds, senses and reach, and magazines); PF2e HUD side by
side; and the GM following the selected token, NPCs included.

**Releasing the next version:** give it a `## x.y.z — date` section at the top of CHANGELOG.md
(its opening is what the update board's card shows, about 1,600 characters of it), set the same
version in `module.json`, commit on master, move main, push both, then tag `vx.y.z` and push the
tag. `.github/workflows/release.yml` stamps `module.json` from the tag, builds `module.zip` and
publishes both; the updates repo's hourly sync picks the release up for the board.
`./build.ps1` builds the same zip locally to look at first.

1. **D&D 5e rarity colors, grayed unprepared spells, and the vitals panel** (1.7.0).
   - Rarity and graying are on the projection (`scripts/adapters/dnd5e.mjs`: `rarityOf`,
     `unprepared`; colors in `design/1-head.html` `.rar-*` and, for the Crystal core,
     `styles/looks.css`) and on the D&D 5e sheets (`scripts/interface/sheet-marks.mjs` marks each
     row on render; `styles/sheet-marks.css`). The first build was on the projection alone, which
     was not what "PC sheets" meant. Tested in `tools/test-dnd5e.mjs` and
     `tools/test-sheet-marks.mjs` (stand-in sheets, both themes, colors read against the pixels
     behind them).
   - The vitals panel: `scripts/projection/fit.mjs` shrinks a label too wide for its cell and
     draws a panel of cells too tall for its slot a little smaller; a track of six closes up in
     a half-width cell.
   - [ ] See all of it in Foundry, on a real character's and NPC's sheet in both themes.
   - [x] **The colors are D&D Beyond's**, read on 2026-11-12 from the item names on
         dndbeyond.com/magic-items: #1fc219 uncommon, #4990e2 rare, #9810e0 very rare, #fea227
         legendary, #be8972 artifact. A common item's name there is its ordinary text (#242528),
         and one whose rarity varies is too.
   - [ ] On a light sheet or page, legendary and artifact both darken to browns (#7a4e13 and
         #705143) and are hard to tell apart; the readout says the rarity in words.
   - [ ] The sheet marks do not stand down for SC - Item Rarity Colors or Tidy 5e Sheets, which
         color items themselves; the setting is there to switch ours off.
   - [ ] The Retro terminal and the Datapad are one-color screens, and rarity is now the one
         other color on them. If that spoils them, leave those two looks in their own ink.
   - [ ] An unprepared spell is grayed in each device's own dim ink, which on the Runeforge
         and the Datapad is a little under 4.5:1 (4.1 and 4.0), as all their labels are.
   - [ ] The contrast scan run across every look for this found text under 3:1 that is not
         from this work: Datapad 12 pieces, Reliquary 3, Witchfire 2, Armored gauntlet 1.
         Only the Journal, the Grove and the Crystal core have been gone over.

2. **D&D 5e sheet tabs as a labeled row** (1.6.0, fixed in 1.6.1). 1.6.0 went out with the
   header and the row unclickable on a character in the dark theme, where the system's banner
   is a layer over the top of the sheet: the stand-ins were only ever in the light theme, and
   nothing checked that a click landed. `tools/test-sheet-tabs.mjs` now clicks every control
   in the header and every tab on all three sheets, in both themes.
   `scripts/interface/sheet-tabs.mjs` and
   `styles/sheet-tabs.css`, tested in `tools/test-sheet-tabs.mjs` on stand-ins for the system's
   sheets (`tools/harness-sheet5e.html`: the system's parts and classes under its real
   stylesheet, with filler inside them). Not yet seen in Foundry:
   - [ ] the character sheet, on Details (the ability scores under the row) and the other tabs,
         in the light and dark themes;
   - [ ] an NPC and a vehicle, whose insides the stand-ins only sketch;
   - [ ] dragging a sheet to the right edge of the screen, now that no tabs hang past it;
   - [ ] beside Carolingian UI, with its own sheet tabs on and off.

3. **The Journal on paper** (1.6.0). `tools/scan-contrast.mjs` measures every piece of text
   against the pixels behind it on the two harnesses, and the Journal, the Grove and the Crystal
   core now have nothing under 3:1; `tools/test-light-hud.mjs` holds the fixes.
   - [ ] See the fixes in Foundry: the faded controls, tabs, players and scene list over a dark
         map and a light one; the turn order; the token HUD's conditions; the book.
   - [ ] What the scan cannot reach: hover and focus states, a system's own chat cards, tooltips,
         menus, the scene bar and the carousel.
   - [ ] The Journal's red on tinted rows is 3.8 to 4.4:1 in seven places: readable, under 4.5.
   - [ ] **The Crystal core** had 115 pieces under 3:1 and now has none under 4.5:1: it letters
         in a deep cyan (`--hot`, `--sfh-hot`: `#005d7e`) and keeps the bright one (`--lit`) for
         what is lit. See it in Foundry, and judge whether the deep cyan still looks like the
         Crystal; `#00708f` is the lightest that still passes on plain glass.

4. **From the 2026-11-05 session.** Fixed but not yet seen in Foundry: the carousel's turning,
   the labels on private messages, the Solar Shield's name and Raise, Stellar Attunement's
   choice, and the speed of a creature with no land speed. Checked against PF2e 8.7.0 and SF2e
   1.7.0's code and changelog.
   - [ ] **Special attacks** — "a number of the buttons for certain special attacks don't seem
         to work". Which ones is not known yet: area fire and automatic fire, a weapon's extra
         actions and the Solarian's toggles all go through the system's own calls as the sheet's
         do. Find out which buttons, on which character.

5. **D&D 3.5e.** `scripts/adapters/d35e.mjs`, tested in `tools/test-d35e.mjs` and live on the
   Foundry 13 server's `35-testing` world with five level-5 characters (fighter, ranger, wizard,
   sorcerer, cleric). Seen live and good: every tab, the GM's view, skill, attack and spell rolls
   and the latest-roll strip, the system's chat cards in the device's colors.
   - [ ] **A player's view and NPCs** have only been run in the harness, not seen live.
   - [ ] **Psionics:** the system's psionic skills (Autohypnosis and the like) are listed for
         everyone, as the system keeps them; powers and power points have no place on the
         Spells tab yet.
   - [ ] **Attack totals** are not shown: the system works them out at roll time from many
         situational options. Showing an estimate would need checking against its rolls.

6. **Fallout 2d20.** The HUD runs in a Fallout world, and with Scorpious187's Pip-Boy its switch
   brings up the Pip-Boy in place of a projection (`scripts/interface/pipboy.mjs`). Seen in
   Foundry and good: the handoff, the Lonestar armband, the AP tracker on it, and the roll cards.
   - [x] **The Lonestar armband** — a look of its own (`lonestar`, `system: 'fallout'`), always
         worn in a Fallout world and not offered anywhere else, drawn from the Pip-Boy module's
         Lonestar Edition casing.
   - [x] **AP on the armband** — the system's own AP tracker (`fallout.APTrackerV2`) rides on the
         deck (`scripts/interface/ap-tracker.mjs`), Overseer AP left of the bar and Party AP right.
         Left loose in the page, it had pushed the sidebar in.
   - [ ] **The Fallout system's other cards and windows** under the HUD's theming: the roll card
         is checked; item, condition, salvage and d6 damage cards each have a template of their own.

Everything after this section is wanted, not urgent.

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
- [x] **PF2e and SF2e, from the review against the sheet** — toggles for roll options, and
      counters on effects; special resources, stamina and resolve; real names for size and
      languages, senses, other speeds and reach; the initiative box following the statistic
      actually rolled; typing a loaded magazine's count. Immunities, weaknesses and resistances
      were done before, in the defenses panel, and 5e's too. Seen in Foundry and good.
- [x] **What the mock-up has that the build does not** — the Actions tab's encounter /
      exploration / downtime filter (PF2e and SF2e); the dossier's shield controls (−5, and the
      recharge), credits and omni-gel; each strike's damage formula on its Damage and Critical
      buttons. Seen in Foundry and good.
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

## Sci-fi devices

`design/theme-ideas.md` has the research, the seven proposals and the naming decision: a device or
a look is named for what it is, never for the game it suits.

- [x] **The seven, built as looks** — the Holoprojector, Armored gauntlet and Comm unit over the
      omni-tool, the Datapad and the Retro terminal over the wrist computer, the Crystal core over
      the Vambrace and the Cyberdeck over TRON. The Holoprojector, Retro terminal
      and Cyberdeck open their own way: a look can now carry its own opening (its animations in
      `styles/looks.css`, its length a `sequence` of its own in `SEQ_LONG`). Seen in Foundry
      and good.
- [x] **The omni-tool, TRON and EVA's names** — decided: they keep their names.

## Sidebar panels

`styles/interface.css` gives the interface the device's colors, edges and glow, and each panel
has had its own pass. `tools/harness-sidebar.html` is Foundry 14's sidebar, every tab, in its own
markup and stylesheet, and `tools/test-sidebar.mjs` checks it under every device and look. Seen
in Foundry and good. Nothing is left here.

- [x] **Chat** — message frames, whispers, dice totals, 5e's cards and the chat input are in the
      device's colors, and the fantasy devices have their own (paper cards; dark glass edged in
      light). Roll totals are in the device's number face with its glow, critical and fumble
      set apart; the message modes and the export and clear buttons are in the palette, the mode
      in use lit (inked in on a page). Seen in Foundry and good.
- [x] **Actors, Items, Journal, Tables, Cards, Playlists directories** — folder rows edged in the
      device's color with the plus badge lit, a GM's folder color kept with light lettering, entry
      rows lit from the edge, an ink tile behind Foundry's white placeholder art on a page, and
      the search box and its controls.
- [x] **Compendium** — pack rows: names stay light on their banners, in the device's heading
      face, and lit on hover. The pack browser is a window, not the sidebar, and keeps Foundry's.
- [x] **Settings tab** — its headings fit and take the device's color, and its buttons, dividers
      and build info are in the palette. Nothing more was needed.
- [x] **Sidebar tab strip** — checked under every device and look; the palette was enough.
- [x] **Popped-out sidebar tabs** — themed: the same panel and palette, framed on every side
      under a header in the device's colors.

## After that

- [ ] **Compact layout** — the projection's panels rearranged below a width threshold.
- [ ] **Per-character device** — a character can carry its own device choice in an actor
      flag, overriding the player's.
- [ ] **Scene controls and the Token HUD** — recolored, and the controls have sci-fi icons; the
      mock-up's cut corners and station look are not applied. (The scene list is now the
      module's own scene bar.)

## Loose ends

- [x] **PF2e skill descriptions** — PF2e ships no skill rules text, so the readout shows the
      skill's numbers and breakdown, its actions to take, and their rules text.
- [x] **The rest of 5e's Favorites** — skills, tools and activities too, from the readout.
- [x] **Creating and deleting items** — a New item picker on the Inventory tab, and Delete in the
      right-click editor.
- [ ] **Calendaria's dome** — the sky above its HUD is drawn by Calendaria in its own colors and
      is not in the device's.
