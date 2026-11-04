# Scorpious187's HUD UI for 5e and PF2e/SF2e

Turns the Foundry VTT interface into the device your character is wearing — a **Mass Effect
omni-tool**, a **synthwave wrist computer**, a **Command & Conquer EVA console**, or a **TRON
identity disc** — or, for fantasy games, an **Adventurer's Journal** opened across the table or a
**Runic Vambrace** whose runes weave the sheet in spell-light, on Foundry v13–v14.

The foot of the screen becomes the device, Foundry's macro bar rides on it, and the device's
switch raises a projected character sheet over the canvas.

**Nothing about how the game system works changes.** Every roll, rest, condition and item
use goes through the system's own code. The HUD shows the numbers and passes on what you
pressed; it never rolls anything itself.

---

## Installation

In Foundry: **Add-on Modules → Install Module**, and paste this manifest URL:

```
https://github.com/nscarpinatodev/scorpious187s-scifi-character-hud/releases/latest/download/module.json
```

### Requirements

- Foundry VTT **v13+** (verified on **v14**)
- **[Scorpious187's Module Library](https://github.com/nscarpinatodev/scorpious187s-lib)**
- One of: **PF2e** 7.0+, **SF2e** 1.0+, **D&D 5e** 5.0+

The devices' fonts (Michroma, Orbitron, Rajdhani, Share Tech Mono, Chakra Petch, VT323,
Oxanium, Audiowide; IM Fell English, EB Garamond and Caveat for the Journal; Cinzel and Alegreya
for the Vambrace) ship with the module under the SIL Open Font License, so the HUD looks the same
at a table with no internet connection.

## Using it

Enable the module and the device appears at the foot of the screen. Raise the projection
with the device's switch:

- **Omni-tool** — click the glowing emitter band on the forearm.
- **TRON** — click the identity disc on the deck.
- **Wrist computer and EVA** — the power key at the left end of the macro bar.

The projection shows your assigned character (set it in the player list). If you own exactly
one character and have none assigned, it shows that one.

## What you get

- **Seven devices, and eleven looks.** Omni-tool, wrist computer, EVA (GDI), EVA (Nod) and TRON,
  and for fantasy games the Adventurer's Journal and the Runic Vambrace. Over them, four fantasy
  looks (the Reliquary, Runeforge and Witchfire over the Vambrace, the Grove over the Journal)
  and seven for science fiction (the Holoprojector, Armored gauntlet, Comm unit, Datapad, Crystal
  core, Retro terminal and Cyberdeck). Every device and look works with every system. The GM sets
  the world default; each player can pick their own in the module settings.
- **The Adventurer's Journal.** The sheet is a leather journal kept in a satchel at the foot of
  the screen: the straps pull free, the flap turns back, a traveler's odds and ends come up out
  of the bag, and the book slides out, swings open on its spine and its writing fades in as you
  watch. The main body is
  on the left page, everything else kept as notes on the right, with index tabs cut into the
  pages and the interface around it in ink on paper.
- **The Runic Vambrace.** An engraved bracer whose runes kindle one after another; a sigil turns
  open behind the board and the panels are drawn out of the light in dark glass edged in blue.
- **Four looks.** The Reliquary (white gold and stained glass, for a cleric or a paladin), the
  Runeforge (stone and brass, runes like coals) and Witchfire (bone and a green witch-fire) dress
  the Vambrace; the Grove binds the Journal in green leather with leaves pressed in its pages.
  Each has its own art, colors and bolts, and otherwise works as the device it dresses.
- **Seven sci-fi looks.** The Holoprojector (a disc emitter and a flickering blue hologram), the
  Armored gauntlet (hammered steel and a red display) and the Comm unit (a teal and orange wrist
  slab) over the omni-tool; the Datapad (amber on a worn handheld) over the wrist computer; the
  Crystal core (white ceramic and frosted glass) over the Vambrace; the Retro terminal (green
  phosphor in a beige monitor, typing itself out) over the EVA; and the Cyberdeck (neon magenta
  and cyan, glitching open) over TRON.
- **The macro bar on the device.** It is Foundry's own `#hotbar`, moved and resized — drag,
  drop, paging and keybinds all work as they always do.
- **The projection.** Identity, vitals, defenses, effects and a tabbed main panel, laid out
  to each device's design:
  - **Hit points** are typed: an amount with Heal and Damage, the value itself editable, and
    right-click for maximum and temporary hit points. Damage goes through the system's own
    damage application where it has one.
  - **Rolls** — skills, saves, perception, initiative, strikes and damage — are the
    system's own.
  - **Weapons** (PF2e and SF2e) keep the sheet's controls on the Actions tab: drawing, stowing and
    changing grip, reloading, unloading and choosing ammunition, and other usages such as
    auto-fire. A held shield shows its hit points, with Raise a Shield.
  - **Abilities** (PF2e and SF2e): the Actions tab lists feats that cost an action as well as
    action items, and Use counts down limited uses as the sheet does.
  - **Dying** (PF2e and SF2e) offers the recovery check, consumables have a Use button, and focus
    points are set from the Spells tab.
  - **Conditions** are added from the effects panel's picker — the system's own list — and
    removed from their chips. PF2e's valued conditions are raised and lowered on the chip.
  - **Spells** are cast from the Spells tab through the system, which spends the slot, focus
    point or use. PF2e's prepared, spontaneous, focus and innate entries all show as the
    system's own sheet lays them out.
  - **Restoring spells** (PF2e and SF2e): Restore on a prepared spell once it is cast, on a rank
    of spontaneous slots, or on an innate spell's uses. They are the sheet's own controls. Spell
    Preparation on a prepared entry opens the system's window for it.
  - **Skill training** (PF2e and SF2e) changes from the letter beside each skill.
  - **Carrying and equipping** (PF2e and SF2e) use the same choices as the sheet's carry menu,
    on each item in the Inventory tab: held in one or two hands, Worn (Armor) to put armor on,
    worn, implanted, stowed or dropped, with the gem for investing what can be invested.
  - **Money** (PF2e and SF2e) has + and − beside the Currency line, which open the system's own
    dialog.
  - **Giving and trading** (PF2e and SF2e): each item's Give list hands it to another character
    or the party's stash, by the same route as dragging it onto their sheet. A GM moves it
    directly; a player sends the system's trade request, which the other player has to be online
    to answer.
  - **Quick search** (PF2e and SF2e) on the Inventory tab finds equipment as you type, using the
    Compendium Browser's own index. Add puts a result straight into the inventory, free, as the
    browser's Take button does; Buy pays its price first, as its Buy button does. Browse opens
    the browser itself on its equipment tab.
  - **The book button** opens the system's own sheet, for anything that changes at level-up.
- **The canvas when you need it.** While you place a spell's area or a weapon's burst on the
  map, the device and the projection clear out of the way, and come back on the same tab when
  you confirm or dismiss it. It works however the placement started: the projection, the
  system's own sheet or a chat card.
- **The latest roll** (PF2e and SF2e), in a strip over the main panel: what you rolled, the total,
  the outcome if the world shows it, and Damage and Critical for an attack. It stays out of the
  way until you roll, and never shows a roll you could not see in chat.
- **A readout panel** describing whatever you point at or click. It keeps showing the last thing
  you chose, even when you change page, so you can move onto it and scroll a long description.
- **A Mass Effect dossier**, when the
  [Mass Effect conversion](https://github.com/nscarpinatodev/mass-effect-sf2e-conversion) or
  the shield automation module is active: shields and the Paragon/Renegade tracks. It reads
  those modules' data and never edits it.
- **The whole interface in the device's colors** — sidebar, chat, scene bar, controls and
  player list. Sheets and dialogs keep their own look. The scene controls also take sci-fi
  icons; each control still does exactly what it did.
- **Headings that fit.** The sidebar's headings scale to fit its width in whatever face is
  showing, and take the device's main color or one you choose.
- **Your own fonts.** Each player can set a heading, text and number font of their own:
  one installed on their computer (Myriad Pro, say), one the GM has added under
  *Additional Fonts* in Foundry's Core settings, or any Google Fonts family, fetched when
  it is not installed. The omni-tool's own headings are Michroma, wide squared capitals
  in the manner of Mass Effect's.
- **The same HUD in D&D 5e**, through 5e's own calls: attacks and features to use, spell slots to
  spend and restore, preparing spells, equipping and attuning, typed coins, quick search with Add
  and Buy, an editable Biography and the latest-roll strip. Giving an item to a character you do not
  own goes through the GM's client, so a GM has to be online.
- **A scene bar** in place of Foundry's scene list: the scenes in navigation across the top left,
  a drawer of every scene by folder with a search, and a preview of each one with Preload,
  Activate, Pull all and the rest. It keeps clear of Calendaria's HUD at the top center.
- **A carousel combat tracker**, if you turn it on: the turn order as a row of portraits across
  the top of the screen, in your device's style, with the current turn on the left or centered, as
  you choose. Hover to light a token, click to pan to it, double-click for its sheet, right-click
  for the same menu as the sidebar tracker, and the wheel scrolls a long row. Everyone can target
  from a card, and the GM can also mark a combatant hidden or defeated, and has the sidebar
  tracker's encounter menu on the round bar. It shows only what the sidebar tracker would show you.
- **Power sequences.** The omni-tool's panels rise out of the band, the wrist computer's
  case swings up from its base, the EVA's picture opens out of a scan line, and TRON's panels
  rez in behind a ribbon of light.

### Tabs

| PF2e / SF2e | D&D 5e |
|---|---|
| Character, Actions, Inventory, Spells, Feats, Skills, Effects, Biography | Details, Inventory, Features, Spells, Effects, Biography |

## Small screens

**Alt+H** (rebindable in *Configure Controls*) hides the device and the projection without
switching anything off, and brings them back on the same tab and scroll position. The macro
bar stays, with an eye key on it that also brings the HUD back. Raising the projection
un-hides it too, so a hidden HUD is never a lost one.

## Settings

| Setting | Scope | What it does |
|---|---|---|
| Default device | world | The device players get before they choose one. |
| My device | client | The device you wear. |
| Power sequences | client | Play the rise/fold/scan animations. |
| Macro key size | client | Size of the macro bar keys. The omni-tool's arm and TRON's deck follow it, and their projections follow them. |
| Wrist computer and EVA projection size | client | How much of the free space those projections take (55% by default). The omni-tool's and TRON's are not affected. |
| Etched grid | client | The etching on the projection: hexes on the omni-tool, a square grid on TRON. |
| Sci-fi control icons | client | Sci-fi icons on the scene controls (astronaut, radar, datapad…). Off keeps Foundry's own. |
| The Journal's interface in the dark | client | With the Adventurer's Journal or the Grove, the sidebar, chat, player list, controls, scene bar and turn order in dark leather with pale ink instead of paper. The journal itself stays paper. Off by default. |
| Chat cards in the device's colors | client | Draws chat messages and rolls on the device's panels. Off keeps Foundry's parchment, if a system's or module's cards are hard to read this way. |
| Heading font, Text font, Number font | client | Your own font in place of the device's. Type its name; the settings window suggests the fonts it finds. Empty keeps the device's. |
| Carousel combat tracker | client | Also shows the turn order as portraits across the top of the screen. Off by default. |
| Carousel layout | client | The current turn on the left, or centered with who just went on its left. |
| Carousel size | client | How large the carousel is, from 50% to 200%. |
| Heading color | client | The color of the interface's headings. Empty keeps the main color of the device you are wearing. |
| Fetch fonts from Google Fonts | client | Fetch a font named above from Google Fonts when it is not installed or in Foundry. Off keeps the table offline. |

## For macro writers

```js
const hud = game.modules.get('scorpious187s-scifi-character-hud').api;
hud.toggle();          // raise or lower the projection
hud.setPower(true);    // raise it
hud.hide();            // hide the HUD; hud.hide(false) brings it back
hud.debug();           // log what is mounted and where
```

## License

MIT. The fonts in `fonts/` are under the SIL Open Font License; each one's license is
beside it.
