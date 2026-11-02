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
  tooltips — in the device's colours, with chat cards on the device's panels instead of parchment
  and a setting to keep the parchment.
- The omni-tool's beam between the band and the projection.
- Sci-fi icons on the scene controls, from the Font Awesome Pro set Foundry ships, with a
  setting to keep Foundry's own.
- The Mass Effect dossier: shields and Paragon/Renegade, read from the conversion and shield
  modules.
- PF2e and SF2e: a strip over the main panel shows the character's latest roll, with Damage and
  Critical for an attack.
- The combat tracker in each device's own style, popped out or in the sidebar: the current turn
  stands out, initiative reads like the device's numbers, and defeated names can be read.
- The readout keeps what it shows when the pointer moves away, so a long description can be
  scrolled, and no longer cuts descriptions short. PF2e and SF2e: strikes show their weapon's
  description, and the reload window opens beside the HUD's Reload button.
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
  colour or one chosen in the settings.
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
- Mass Effect Dossier: shields, biotic barrier, armour frame, Paragon/Renegade, omni-gel;
  reads the conversion module's data and opens its tracker.
- Small screens: hide keybinding (Alt+H), three device-art levels, and a compact layout with a
  tab rail and a side-panel drawer.
- Settings for device art, scanlines, readout, sequences, close sequence, UI scale and the
  compact width.
