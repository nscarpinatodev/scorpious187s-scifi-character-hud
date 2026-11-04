# Changelog

## 0.2.0 — unreleased

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
  goes back in and the flap comes over and is buckled shut after it.
- The Journal's writing fades in as the Marauder's Map's does: touched at the spine, ink blooms
  out across both pages, soaking up through the paper unevenly and settling sharp.
- A projection switched off and straight back on no longer has its sequence cut short, or is
  put away once it is back up.
- An item dragged from another character's inventory onto the projection is taken again. Such
  a drag allows only a move, and the projection answered it as a copy, so the browser dropped
  nothing; in PF2e and SF2e the item now moves, as it does onto the sheet.
- Renamed "Scorpious187's HUD UI for 5e and PF2e/SF2e". The module's id is unchanged, so an
  existing install updates in place.
- Experience is typed in both systems, like hit points, and the level too in PF2e and SF2e.
  Right-click experience, hero points or an item for an editor: an item's name and quantity.
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

Superseded by 0.2.0 before release. First build: PF2e and SF2e character sheets.

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
