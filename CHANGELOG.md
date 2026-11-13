# Changelog

## Unreleased

- **D&D 5e 6.1.** The module was gone over against the system's 6.1.0 release, and nothing in
  it was broken by it. Four things the release added or moved are now followed in the
  projection:
  - A resistance, immunity or vulnerability to falling damage, which 6.1 adds, is named as
    the system names it; it was listed by its bare key.
  - An item's weight is shown in its own unit. 6.1 converts weights to kilograms in a world
    set to metric, and the Inventory tab called every weight pounds.
  - Inside an antimagic region, which 6.1 adds, the Spells tab says so and lists no spells,
    as the system's sheet does.
  - The walking speed is read from where the system has kept it since 6.0, and shown in the
    character's own unit, not always in feet. The old place still answers until 7.0.

## 1.7.0 — 2026-11-12

- **D&D 5e: items named in the color of their rarity.** An uncommon item's name is green, a rare
  one's blue, a very rare one's purple, a legendary one's orange and an artifact's tan, as D&D
  Beyond colors them. It is so on the D&D 5e character, NPC and vehicle sheets, in their lists and
  among a character's favorites, and wherever the projection names an item: the Inventory tab, a
  weapon among the attacks, a favorite, and what the quick search finds. Common things, and
  things with no rarity, keep the ordinary ink. D&D Beyond's own green and orange are used as
  they are on a dark sheet or panel; its other colors are lightened there, and all five are
  darkened on a light sheet, the Journal, the Grove and the Crystal core, only as far as it
  takes for each to be read. An item that has not been identified is not colored, since its
  color would say what it is. The projection's readout also says an item's rarity in words. A
  new setting, on by default, switches it off.
- **D&D 5e: unprepared spells are grayed.** On a character's sheet and in the projection, on the
  Spells tab and among the favorites, a spell that has to be prepared and is not is grayed. It
  can still be read, prepared and cast. Cantrips, spells that are always prepared, and spells
  that need no preparing (pact magic, innate spells, spells cast from an item) are not grayed.
  An NPC's spells are left as they were. A new setting, on by default, switches it off.
- **D&D 5e: a vitals panel that holds what is in it.** On the Vambrace and its looks, the
  Crystal core, the omni-tool, the Armored gauntlet and the Comm unit, the six death saves and
  the six levels of exhaustion were wider than their cells and the last of them were cut off,
  and on several of those the panel was a few pixels too tall and scrolled. A track of six now
  closes up to fit its cell. And every panel of cells is now measured once it is drawn: a label
  too wide for its cell, as "Inspiration" is in a wider font than the device's own, is set a
  little smaller, and a panel too tall for its place is drawn a little smaller as a whole,
  so nothing is cut off whatever font a player has chosen.
- **Temporary hit points under the bar.** The Temp box has moved from beside the Hit Points
  label to under the bar, over Heal and Damage, on every device and in every system. The
  block is set a little tighter so the panel is no taller for it.

## 1.6.1 — 2026-11-12

- **D&D 5e sheet tabs: the header and the tabs could not be clicked.** With the tab row on and the
  sheet in the system's dark theme, nothing in a character's header answered a click: not the
  name, the rest buttons, Inspiration, nor the tabs in the row themselves. In that theme the
  system lays the character's banner over the top of the sheet as a layer of its own, and it was
  being drawn on top of them and took the clicks. The row is now moved to its place after the header instead of being
  reordered there, which is what had put the banner in front. Sheets in the light theme, and any sheet
  with the setting off, were not affected.

## 1.6.0 — 2026-11-11

- **D&D 5e sheet tabs as a labeled row:** a new setting, off by default, lays the tabs of the
  system's character, NPC and vehicle sheets in a row across the sheet, each with its name beside
  its icon, instead of the icons hung down its side. It is the layout Carolingian UI offers, for
  tables that don't run it. The tabs are still the system's own, in its colors, and the rest of
  the sheet is left alone; only the character's ability scores move, to sit just under the row.
  A row too long for a narrow sheet scrolls with the mouse wheel or the arrow at its end. Where
  Carolingian UI's own option is on, the HUD leaves the tabs to it.
- **Journal size:** a new setting sets how large the Journal's book opens, as a share of the room
  it could take. It is 100% by default, as before; lower it to keep more of the map in view. The
  Grove look follows it too.
- **Labels that fit:** a label too long for its box no longer ends in "…". "Death Saves" was cut
  to "Death…" on every device. A label now goes onto a second line, and the Roll button beside
  Death Saves or Dying moves under it when the two don't fit side by side. Single words that were
  cut short by a few letters on the Vambrace, its looks and the EVA now fit: Perception,
  Inspiration, Exhaustion, Flat-footed and Nonlethal.
- **The Journal on paper, readable:** a run-through of the Journal's default light interface for
  text that could not be read.
  - Foundry fades the scene controls, the sidebar's tabs, the player list, the scene list and the
    chat beside a closed sidebar until they are pointed at. Faded over a dark map, the page went
    to a muddy gray and its ink with it. On the Journal, the Grove and the Crystal they now stop
    fading while they can still be read. The Journal in the dark and every dark device fade as
    before.
  - In the turn order, a token with no art of its own was Foundry's white figure on cream, and its
    condition marks were white too. The figure has ink behind it and the marks are inked.
  - In the token HUD's list of conditions, the ones a token lacks were a pale smudge. They are
    drawn stronger, and the ones it has are ringed.
  - In the book, Paragon and Renegade were bright blue and red on the page; they are inked darker.
    A spent spell is struck out instead of fading to gray. Field prompts, the source line in a
    page's heading, the numbers on the macro keys and the dim label ink are all darker, on the
    Grove as well.
- **The Crystal core, readable:** its bright cyan was used for lettering as well as for light, and
  on pale glass bright cyan cannot be read: headings, labels, small buttons, the sidebar's
  headings and the names in chat were all about half as dark as they needed to be. The Crystal now
  has two cyans. A deep one letters, in the projection and across the interface, and the bright
  one is kept for what is lit: bars, filled pips, the glow, the edge of the glass and the tab's
  name over the map. Its violet, red, green and dim label inks are darker too. As on the Journal,
  a spent spell is struck out instead of fading, and Paragon and Renegade are inked dark.
- **Token HUD on light interfaces:** with the Journal on paper, the Grove and the Crystal, the
  token HUD's icons were white on cream and couldn't be read. They are now inked in the
  interface's own text color, and a lit control keeps a light icon. The Journal in the dark is
  unchanged.

## 1.5.0 — 2026-11-08

- D&D 3.5e: the HUD works with the "Dungeons & Dragons 3.5 SRD" system (D35E 3.0 and later,
  verified on 3.1.0 with Foundry 13). The projection has eight tabs:
  - **Character:** abilities with their checks, the three saves, base attack, melee, ranged,
    grapple and initiative rolls, and size, speeds, senses, languages and resistances.
  - **Attacks:** every attack and full attack, with its damage and critical range.
  - **Skills:** one column, with ranks and totals; class skills and trained-only skills marked.
  - **Spells:** by spellbook and level, with caster level and DC. A prepared caster prepares
    copies with − and +; a spontaneous caster spends slots from segments.
  - **Feats, Inventory, Effects and Biography:** buffs are switched on and off from the Effects
    tab and their chips.

  Hit points go below zero, to −10, with Disabled and Dying shown, and nonlethal damage and
  negative levels sit beside them. Every roll goes through the system's own, with its dialogs.
  The latest-roll strip reads the system's cards, and the cards take the device's colors.
- PF2e HUD: its shortcut slots no longer cover the projection. With its panel on the left, the
  HUD is drawn over it.
- The Journal: a long character name is fitted to the page instead of running off it, and the
  Journal's text is a little smaller, so more fits on a line.

## 1.4.0 — 2026-11-06

- Fallout 2d20: the HUD can be enabled in a Fallout world. The interface, chat, carousel and scene
  bar work as in any system, and the carousel reads a Fallout character's health. There is no
  projection: with Scorpious187's Pip-Boy active, the device's switch brings up the Pip-Boy
  instead, for the player's own character, or for the GM the selected token's (a character or a
  robot), and follows the GM's selection as the projection does. Closing the Pip-Boy turns the
  device off, and switching the device off puts the Pip-Boy away, even one that is still opening,
  or whose opening failed part way.
- Fallout 2d20: the Pip-Boy Lonestar Edition, a look of its own over the omni-tool: the Pip-Boy's
  olive forearm unit, with its amber POWER lamp, lit while the device is on, as the switch, and the
  interface in the Pip-Boy's phosphor green. Everyone wears it in a Fallout world, where the device
  settings are hidden, and it is offered in no other system.
- Fallout 2d20: the system's AP tracker rides on the device, Overseer AP to the left of the macro
  bar and Party AP to the right, in the device's colors, and the device widens to carry them. It
  had been left loose in the page, where it pushed the sidebar in from the edge of the screen.
- Fallout 2d20: chat cards are drawn on the device's panels without the system's paper underneath,
  which had left them light text on a light page. A roll's successes, complications and damage
  are cells edged in green, red and yellow, in the device's letters, and the card's title is
  sized for the chat log.
- The carousel turns smoothly. A card that has not changed is no longer drawn again, so its
  portrait does not reload. A redraw part way through a turn no longer starts the slide over. The
  card going around from one end of the row to the other leaves off its edge and comes in at the
  other, instead of crossing the whole row. The round marker slides with the cards, and a card
  whose turn starts or ends grows or shrinks as it moves.
- Private messages say so in the chat: a private GM roll, a blind roll, a self roll, or a whisper
  and between whom, in a label on the card and in a tint of its own. The projection's Latest strip
  marks a private roll too.
- PF2e and SF2e: SF2e's Solar Shield shows its name, not the key the system keeps it under. Raise
  raises it, and lowers it again; its hit points are shown rather than typed, since the system
  works them out afresh. A held shield's hit points are typed into the shield, as the sheet saves
  them.
- PF2e and SF2e: the choice on a toggle that is always on, such as Stellar Attunement's Graviton or
  Photon, can be changed. A toggle's choice changes as on the sheet, leaving the toggle on or off.
- PF2e and SF2e: a creature with no land speed (allowed since PF2e 8.7.0) shows the speed it does
  have, instead of 25 feet.

## 1.3.0 — 2026-11-05

- PF2e and SF2e: a skill in the readout shows its modifier, training, attribute and the sheet's
  breakdown of every bonus in it, a button for each of the system's actions that use it (Balance,
  Tumble Through, Grapple and the rest, one for each way of doing those with several), which takes
  the action through the system, and those actions' rules text.
- D&D 5e: skills, tools and an item's activities can be marked as favorites from the readout, as
  on the sheet, as items and effects already could.
- A blank item of any kind the system has, from a New item picker beside the Inventory tab's quick
  search: made, named as Foundry names a new one, and opened on its sheet to fill in.
- Delete in a thing's right-click editor, behind Foundry's own are-you-sure.

## 1.2.0 — 2026-11-05

- Default device and My device are chosen in two menus: a category, science fiction or fantasy
  (or, for My device, the world's default), then a device or look from that category alone,
  instead of all eighteen in one list. Everyone's current choice stays as it is.
- The Holoprojector's bright band no longer gives a panel a scroll bar as it runs past the bottom.
- Clicking a scene in the sidebar's Scenes tab views it, instead of opening its configuration;
  Shift+click opens the configuration. A setting puts Foundry's way back.
- A scene's preview lists who is on it in a section of its own, a name each, however many there
  are; the scene's lighting, vision and sound sit one to a line above it; and a long button, such
  as Hide from players, keeps its words inside it.
- Everyone's volume, for the GM: a button under the Playlists tab's volume sliders asks each
  connected player's Foundry for their music, environment and interface volume, and lists them,
  with whether they have muted Foundry or their browser is holding sound back until they click.
- The Playlists tab's Volume Controls and Currently Playing headers can be read on the Journal's,
  the Grove's and the Crystal core's pages.
- The right-click editors (experience and level, hit points, hero points, an item's name and
  quantity) open over the panels, just under what was right-clicked, instead of inside its panel,
  where most devices cut them off and hid their Close button.
- The projection offers to take a drop only for an item, or a folder of items. An actor dragged
  across the HUD on its way to the map, a scene, a journal, a macro, an effect on its own and the
  rest pass over it.
- Lettering on rows painted dark by someone else is white: PF2e's and SF2e's party rows in the
  Actors tab, and folders a GM has colored, which on the Journal's, the Grove's and the Crystal
  core's pages were dark on dark. The party row's buttons are icons in the same white.

## 1.1.2 — 2026-11-05

- The scene bar names a scene by its navigation name when it has one, for the GM as well as the
  players, and by its own name when it does not. The GM can still search by either, and a scene's
  preview shows its own name under the navigation name.

## 1.1.1 — 2026-11-05

- Verified with Pathfinder Second Edition 8.7.0 and Starfinder Second Edition 1.7.0.

## 1.1.0 — 2026-11-05

- The GM's projection follows the token selected on the canvas, a character's or an NPC's, and
  stays on it until another is selected. A player's is only ever their own character.
- NPCs on the projection, as their own sheets have them. PF2e and SF2e: their rarity and traits
  under their name, the NPC sheet's tabs with its public and private notes, only the skills they
  have, and no experience, hero points or rest. D&D 5e: creature type and challenge rating, hit
  dice from the hit point formula, and legendary actions and resistance as tracks.

## 1.0.2 — 2026-11-05

- PF2e HUD's party portraits keep their width. Its persistent panel takes its width from the
  macro bar along its foot; with the bar on the device, the panel now keeps the bar's place
  empty instead of closing up, so the portraits no longer narrow.

## 1.0.1 — 2026-11-05

- The macro bar stays on the device when another module moves it. PF2e HUD puts the bar back at
  the foot of the screen whenever its persistent HUD closes, even with that HUD switched off, and
  the device now takes it straight back.

## 1.0.0 — 2026-11-05

The first release. The Foundry interface becomes the device your character wears, and its switch
raises the character sheet as a projection over the canvas. Every roll and button is still the
game system's own.

### Highlights

- **Seven devices:** the omni-tool, wrist computer, EVA (GDI and Nod) and TRON for science
  fiction; the Adventurer's Journal and the Runic Vambrace for fantasy.
- **Eleven looks** over them, from a flickering hologram and an old green terminal to a stone
  Runeforge and a Journal bound in green leather.
- **The projection:** vitals, defenses, effects, a readout and tabbed pages, with hit points,
  experience, conditions, spells, inventory and the biography changed in place.
- **PF2e, SF2e and D&D 5e,** each through the system's own calls.
- **The whole interface in the device's colors:** sidebar, chat, a scene bar with previews,
  controls, the player list, and an optional carousel turn order.
- **A Mass Effect dossier** with the conversion's shields and Paragon/Renegade.

### Everything in 1.0.0

Rebuilt as a UI theme. The HUD is no longer a character sheet; the interface itself is the
device, and the character sheet is a projection it raises over the canvas.

- The device at the foot of the screen, with Foundry's own macro bar mounted on it: the
  omni-tool's forearm and emitter band, or a docked bar with a power key for the others.
- The projection: identity, vitals, defenses, effects, readout and a tabbed main panel,
  built to the approved mock-up for each device and scaled to the room the interface leaves.
- PF2e, SF2e and D&D 5e, through adapters that hand every button to the system's own API.
- Hit points typed in place, with Heal, Damage, and right-click for maximum and temporary.
- A condition picker in the effects panel, from the system's own list, and − / + on PF2e's
  valued conditions.
- A Spells tab for PF2e and SF2e, built from the system's own spellcasting sheet data, that
  casts through the system.
- A hide key (Alt+H) that clears the HUD off the screen without closing anything, with a
  restore key on the macro bar.
- The interface — sidebar, chat, scene bar, controls, player list, token HUD, menus and
  tooltips — in the device's colors, with chat cards on the device's panels instead of parchment
  and a setting to keep the parchment.
- The omni-tool's beam between the band and the projection.
- Sci-fi icons on the scene controls, from the Font Awesome Pro set Foundry ships, with a
  setting to keep Foundry's own.
- The Mass Effect dossier: shields and Paragon/Renegade, read from the conversion and shield
  modules.
- An optional carousel combat tracker: the turn order as portraits across the top of the screen,
  in each device's style, at a size you set, with the current turn on the left or centered.
- PF2e and SF2e: a strip over the main panel shows the character's latest roll, with Damage and
  Critical for an attack.
- The combat tracker in each device's own style, popped out or in the sidebar: the current turn
  stands out, initiative reads like the device's numbers, and defeated names can be read.
- The readout keeps what it shows when the pointer moves away or the page changes, so a long
  description can be scrolled, and no longer cuts descriptions short. Clicking a name now just shows
  it: pinning is gone, since nothing showed a pin was set. PF2e and SF2e: strikes show their weapon's
  description, and the reload window opens beside the HUD's Reload button.
- The readout draws descriptions as the sheet does: links and checks work, paragraphs stay apart,
  and GM secrets stay hidden from players, who used to see them there. Long text wraps instead of
  widening the panel.
- PF2e and SF2e: the whole Biography tab, editable by the character's owner: appearance, backstory,
  personality with edicts and anathema, and campaign notes, with Foundry's own rich text editor and
  the sheet's control over who may read each section.
- The Runic Vambrace, the second fantasy device and the omni-tool's counterpart, for every
  system: an engraved steel bracer whose runes kindle outward from its gem, a sigil that turns
  open behind the board, panels drawn out of the light in dark glass edged in blue and violet,
  rune crystals for pips and tracks, rune-stone tabs, and hex-ward portraits in the carousel.
  Cinzel and Alegreya ship with the module for it.
- The rich-text editor's toolbar stays on one row: on a narrow page its buttons are smaller,
  and shrink further until they fit.
- The Journal is kept in a satchel at the foot of the screen, its flap buckled down by two straps
  through brass clasps; the left clasp opens it. The straps pull free, the flap turns over and
  falls away behind the bag, and the book slides up out of it and swings open. Closing, the book
  goes back in and the flap comes over and is buckled shut after it. With the flap open, a rolled
  map, loose pages, a sealed letter, a quill and a corked vial stand up out of the bag beside the
  book; they are packed out of sight again before the flap closes.
- The Journal's writing fades in as the Marauder's Map's does: touched at the spine, ink blooms
  out across both pages, soaking up through the paper unevenly and settling sharp.
- A projection switched off and straight back on no longer has its sequence cut short, or is
  put away once it is back up.
- Seven looks for science fiction, picked like a device: the Holoprojector, a disc emitter
  whose sheet is a flickering blue hologram that wavers into being; the Armored gauntlet, hammered
  steel with a red display; the Comm unit, a teal and orange wrist slab with a hexagonal emitter;
  the Datapad, amber on a battered handheld; the Crystal core, a white band set with a crystal and
  frosted glass panels; the Retro terminal, an old green terminal in a chunky steel monitor case of
  its own on the wrist computer's layout, its choices lit up inverted, its scanlines on the screen
  alone, coming on from a bright line and typing its panels out; and the Cyberdeck, neon magenta and cyan, glitching open. A look can now open its own way.
  The Holoprojector closes its own way too: the hologram flickers out before its light goes.
- Heal and Damage keep their words inside their buttons on every device and look.
- Changing the Default device while your own My device is set now says that yours still wins, as it
  always did; the settings' hints say so too.
- The Journal's interface in the dark, a setting: with the Journal or the Grove, the sidebar,
  chat, player list, controls, scene bar and turn order are dark leather with pale ink instead
  of paper, while the journal itself stays paper.
- Four looks, picked like a device: the Reliquary, a bracer of white gold with a rose window of
  stained glass, gold-edged panels with jewel colors pooled in them and golden bolts; the
  Runeforge, a bracer of stone banded in brass with an ember stone, stone panels and runes like
  coals; Witchfire, a bracer of bone with a green witch-fire, panels framed in bone and green
  bolts; and the Grove, the Journal bound in green leather, its satchel tooled with leaves and
  leaves pressed in its pages. Each works as the device it dresses, in every system.
- PF2e and SF2e: the Actions tab shows what is done in an encounter, in exploration or in
  downtime, one at a time, as the sheet does; the strikes and the held shield are an encounter's.
- The Mass Effect dossier: the shields read from the conversion as it keeps them, as temporary hit
  points over the Kinetic Shield's maximum, raised by a shield capacitor; −5 lowers them alone,
  without the barrier, armor or hit points, and the recharge adds their regeneration up to full.
  The credits and the omni-gel the character carries are there too.
- A scene's preview, in the scene bar or its drawer, opens right under the scene, beneath the
  pointer, so the pointer goes straight down onto its buttons; it closes the moment the pointer
  leaves the scene, or the preview.
- An item dragged from another character's inventory onto the projection is taken again. Such
  a drag allows only a move, and the projection answered it as a copy, so the browser dropped
  nothing; in PF2e and SF2e the item now moves, as it does onto the sheet.
- Renamed "Scorpious187's HUD UI for 5e and PF2e/SF2e". The module's id is unchanged, so an
  existing install updates in place.
- Experience is typed in both systems, like hit points, and the level too in PF2e and SF2e.
  Right-click experience, hero points or an item for an editor: an item's name and quantity.
  The fields are wide enough for every digit, up to the experience the next level needs, and
  sit clear of the edges of the identity strip and the level's box.
- The character's items and effects can be dragged out of the projection by their names: into a
  container, onto another sheet or onto the macro bar, as from the system's sheet.
- Immunities, weaknesses, resistances and vulnerabilities in the defenses panel, in both
  systems; in PF2e each strike's damage formula is on its Damage and Critical buttons.
- The Journal's and the Vambrace's interface: the sidebar, chat, player list and controls as
  paper, with the turn order as heraldic shields, or as dark glass edged in blue and violet.
- Every font ships as Latin woff2: the fonts folder is 1.3 MB, down from 4.8 MB.
- The stylesheets are no longer loaded twice: Foundry imports them, and the module only adds
  one that is missing.
- The fantasy devices' own words ("Field notes", "Wards & Hexes" and the rest) are in the
  language file.
- The Vambrace's side panels open together, each set off by an arcane bolt: once the main body
  is drawn, the sigil's ring flares and forked lightning leaps from it to the middle of every
  other panel, which is drawn out of the light from where it strikes.
- The Vambrace's gem sits lower in the bracer, so none of it is cut off by the edge of the
  screen, and a clicked switch no longer keeps a focus box around it.
- The Adventurer's Journal, the first fantasy device, for 5e, PF2e and SF2e alike. The sheet
  is a leather journal opened across the table: the main body on the left page, everything
  else kept as notes on the right, the readout on a card taped into the page, and index tabs
  standing out of the left page's edge. It comes out of a satchel at the foot of the screen and
  swings open on its spine. The macro bar is a row of paper tags on the satchel, and the
  interface around it is ink on paper. IM Fell English,
  EB Garamond and Caveat ship with the module for it.
- Drops onto the projection: an item, spell, effect, condition or folder dragged from the
  sidebar, a compendium or another sheet lands on the character as on its own sheet, and a
  container under the drop takes it inside.
- PF2e and SF2e inventory in the sheet's sections and order, with what is in a container
  listed inside it, its capacity, and the sheet's box icon to open or close it.
- Calendaria in the device's colors and fonts: its HUD, calendars and windows follow the
  device, over the theme chosen in 3DS:ATLAS, which comes back when the setting is off.
- A Scene bar style setting: the bar of scenes, or just the Scenes button that opens the drawer.
- The carousel steps down below Calendaria's HUD when that is stuck at the top center, and
  follows it when it moves.
- A scene bar in place of Foundry's scene list: the scenes in navigation across the top left in
  the device's style, a drawer of every scene by folder with a search, and a preview of each with
  View, Activate, Preload, Pull all, Initial view, Configure and showing it in the bar. Click to
  view, double-click to activate, drag to reorder, a back button, a level picker, and Foundry's
  own right-click menu. It ends short of Calendaria's HUD, and can collapse, open on hover, and get
  out of the way during combat.
- D&D 5e: pointing at a skill or tool shows its rules text and its numbers in the readout. Attacks
  list their damage properly, instead of "[object Object]".
- D&D 5e: Favorites at the head of the Actions tab, marked from the readout; a picker for spell
  level and level headers that stand out; chat cards in the device's colors.
- D&D 5e, rebuilt on system 6: Details with proficiency pickers, tools and traits; an Actions tab
  of attacks and even rows of features; Inventory with equip, attune, containers, editable coins,
  quick search with Add and Buy, and giving items to another character; Spells by what they cast
  from, with slot pips, Restore, preparing and a prepared-only filter; Features by class, species
  and background; every effect, including what items grant; the whole Biography tab, editable; the
  latest-roll strip with Damage and Critical; and the readout's details and chips. Giving an item
  to someone else's character goes through the GM's client, so a GM has to be online.
- PF2e and SF2e: the Feats tab follows the sheet: the system's own groups and slots, with class
  features, open slots, and granted feats under what granted them.
- PF2e and SF2e: actions are all one size in their grid, with just their cost, name and Use button.
  Their traits and how many uses are left are in the readout, from anywhere on the row. At zero uses
  the Use button is crossed out, dimmed and disabled.
- PF2e and SF2e: fixed attacks firing the wrong weapon when an unready one was listed above
  them, speed always reading 25, Use skipping limited uses, and feats with an action cost
  missing from the Actions tab.
- PF2e and SF2e: weapon controls (draw, stow, grip, reload, ammunition, auto-fire), the held
  shield with Raise a Shield, the recovery check, Use on consumables, and focus points.
- PF2e and SF2e: add and remove money from the Inventory tab, and give or trade items to other
  players' characters.
- PF2e and SF2e: the Inventory tab carries and equips as the system's sheet does, so armor can
  be worn as armor, with the gem for investing.
- PF2e and SF2e: restore cast spells, slots and innate uses from the Spells tab, open Spell
  Preparation from a prepared entry, change skill training from the Skills tab, and on the
  Inventory tab quick search for equipment and add or buy it directly, or open the Compendium
  Browser.
- The sidebar's headings scale to fit its width, whatever the font, and take the device's main
  color or one chosen in the settings.
- The sidebar's directories and Compendium in each device's dress: folders edged in the device's
  color with its plus badge lit, rows lit from the edge on hover, and pack names in its heading
  face. On a page (the Journal, the Grove, the Crystal core) Foundry's white placeholder art gets
  an ink tile, a folder the GM colored keeps light lettering, and pack names stay light on their
  banners. Tabs popped out of the sidebar, chat included, are themed as the sidebar is.
- PF2e and SF2e, what the sheet had that the projection did not: the roll options feats and
  effects let a character switch (a rage, a stance's benefit) on the Actions tab, or the Spells
  tab for spellcasting's, with their choices; an effect's counter raised and lowered on its chip;
  Stamina and Resolve with the Stamina variant, and special resources such as mythic points,
  typed beside hit points; initiative rolled with the statistic chosen on the Character tab, and
  the Initiative box showing it; size and languages by their names, with every speed, the senses
  and the reach; and a loaded magazine's rounds typed in place.
- The HUD clears off the canvas while a spell's area or a weapon's burst is being placed, and
  comes back when it is done.
- A fifth device, TRON: an identity disc on a deck of light lines at the foot of the screen,
  cyan light lines on black with orange as the accent, Orbitron headings, and panels that rez
  in and derez.
- Hero points, dying and 5e death saves as segmented tracks. Dying above zero puts its box
  on alert, and doomed shows as locked segments where dying's maximum has been lowered.
- The Mass Effect dossier is only as tall as what it shows; the effects panel gets the rest.
- Boxes in the panels keep their full height instead of being cut off (the hit points box
  lost its bar, and on the EVA its buttons), and labels like Perception fit.
- The devices' fonts ship with the module, so an offline table looks the same. The
  omni-tool's headings are Michroma.
- Your own heading, text and number fonts: installed on your computer, added in Foundry's
  Additional Fonts, or fetched from Google Fonts.
- Settings: world and personal device, power sequences, macro key size, wrist computer and EVA projection size,
  etched grid, your own fonts, Google Fonts.

## 0.1.0 — not released

Superseded by 1.0.0 before release. First build: PF2e and SF2e character sheets.

- Sci-Fi HUD registered as a character sheet option (never a default).
- Four devices: Mass Effect omni-tool, wrist computer, EVA (GDI), EVA (Nod), with a world
  default and a per-character override.
- Power sequences: rise (omni-tool), CRT (EVA) and base-hinge fold (wrist computer).
- Readout panel: hover to preview an item, click to pin it.
- Mass Effect Dossier: shields, biotic barrier, armor frame, Paragon/Renegade, omni-gel;
  reads the conversion module's data and opens its tracker.
- Small screens: hide keybinding (Alt+H), three device-art levels, and a compact layout with a
  tab rail and a side-panel drawer.
- Settings for device art, scanlines, readout, sequences, close sequence, UI scale and the
  compact width.
