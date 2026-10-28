# Scorpious187's Sci-Fi Character HUD

Turns the Foundry VTT interface into the device your character is wearing — a **Mass Effect
omni-tool**, a **synthwave wrist computer**, or a **Command & Conquer EVA console** — on
Foundry v13–v14.

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

The devices' fonts (Michroma, Rajdhani, Share Tech Mono, Chakra Petch, VT323, Oxanium,
Audiowide) ship with the module under the SIL Open Font License, so the HUD looks the same
at a table with no internet connection.

## Using it

Enable the module and the device appears at the foot of the screen. Raise the projection
with the device's switch:

- **Omni-tool** — click the glowing emitter band on the forearm.
- **Wrist computer and EVA** — the power key at the left end of the macro bar.

The projection shows your assigned character (set it in the player list). If you own exactly
one character and have none assigned, it shows that one.

## What you get

- **Four devices.** Omni-tool, wrist computer, EVA (GDI) and EVA (Nod). The GM sets the
  world default; each player can pick their own in the module settings.
- **The macro bar on the device.** It is Foundry's own `#hotbar`, moved and resized — drag,
  drop, paging and keybinds all work as they always do.
- **The projection.** Identity, vitals, defenses, effects and a tabbed main panel, laid out
  to each device's design:
  - **Hit points** are typed: an amount with Heal and Damage, the value itself editable, and
    right-click for maximum and temporary hit points. Damage goes through the system's own
    damage application where it has one.
  - **Rolls** — skills, saves, perception, initiative, strikes and damage — are the
    system's own.
  - **Conditions** are added from the effects panel's picker — the system's own list — and
    removed from their chips. PF2e's valued conditions are raised and lowered on the chip.
  - **Spells** are cast from the Spells tab through the system, which spends the slot, focus
    point or use. PF2e's prepared, spontaneous, focus and innate entries all show as the
    system's own sheet lays them out.
  - **The book button** opens the system's own sheet, for anything that changes at level-up.
- **A readout panel** describing whatever you point at, and pinning it when you click.
- **A Mass Effect dossier**, when the
  [Mass Effect conversion](https://github.com/nscarpinatodev/mass-effect-sf2e-conversion) or
  the shield automation module is active: shields and the Paragon/Renegade tracks. It reads
  those modules' data and never edits it.
- **The whole interface in the device's colours** — sidebar, chat, scene bar, controls and
  player list. Sheets and dialogs keep their own look. The scene controls also take sci-fi
  icons; each control still does exactly what it did.
- **Your own fonts.** Each player can set a heading, text and number font of their own:
  one installed on their computer (Myriad Pro, say), one the GM has added under
  *Additional Fonts* in Foundry's Core settings, or any Google Fonts family, fetched when
  it is not installed. The omni-tool's own headings are Michroma, wide squared capitals
  in the manner of Mass Effect's.
- **Power sequences.** The omni-tool's panels rise out of the band, the wrist computer's
  case swings up from its base, and the EVA's picture opens out of a scan line.

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
| Macro key size | client | Size of the macro bar keys. The omni-tool's arm follows it, and its projection follows the arm. |
| Wrist computer and EVA projection size | client | How much of the free space those projections take (55% by default). The omni-tool's is not affected. |
| Etched grid | client | The hex etching on the omni-tool projection. |
| Sci-fi control icons | client | Sci-fi icons on the scene controls (astronaut, radar, datapad…). Off keeps Foundry's own. |
| Heading font, Text font, Number font | client | Your own font in place of the device's. Type its name; the settings window suggests the fonts it finds. Empty keeps the device's. |
| Fetch fonts from Google Fonts | client | Fetch a font named above from Google Fonts when it is not installed or in Foundry. Off keeps the table offline. |

## For macro writers

```js
const hud = game.modules.get('scorpious187s-scifi-character-hud').api;
hud.toggle();          // raise or lower the projection
hud.setPower(true);    // raise it
hud.hide();            // hide the HUD; hud.hide(false) brings it back
hud.debug();           // log what is mounted and where
```

## Licence

MIT. The fonts in `fonts/` are under the SIL Open Font License; each one's licence is
beside it.
