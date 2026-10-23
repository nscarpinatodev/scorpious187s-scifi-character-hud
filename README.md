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

The devices use Google Fonts (Rajdhani, Share Tech Mono, Chakra Petch, VT323, Oxanium,
Audiowide). They are fetched when the world loads; a table with no internet connection
gets fallback fonts.

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
  - **Conditions and effects** can be removed from the projection; PF2e's valued conditions
    can be raised and lowered.
  - **The book button** opens the system's own sheet, for anything that changes at level-up.
- **A readout panel** describing whatever you point at, and pinning it when you click.
- **A Mass Effect dossier**, when the
  [Mass Effect conversion](https://github.com/nscarpinatodev/mass-effect-sf2e-conversion) or
  the shield automation module is active: shields and the Paragon/Renegade tracks. It reads
  those modules' data and never edits it.
- **The whole interface in the device's colours** — sidebar, chat, scene bar, controls and
  player list. Sheets and dialogs keep their own look.
- **Power sequences.** The omni-tool's panels rise out of the band, the wrist computer's
  case swings up from its base, and the EVA's picture opens out of a scan line.

### Tabs

| PF2e / SF2e | D&D 5e |
|---|---|
| Character, Actions, Inventory, Feats, Skills, Effects, Biography | Details, Inventory, Features, Spells, Effects, Biography |

## Settings

| Setting | Scope | What it does |
|---|---|---|
| Default device | world | The device players get before they choose one. |
| My device | client | The device you wear. |
| Power sequences | client | Play the rise/fold/scan animations. |
| Macro key size | client | Size of the macro bar keys. The omni-tool's arm follows it. |
| Projection size | client | How much of the free space the projection takes. |
| Etched grid | client | The hex etching on the omni-tool projection. |

## For macro writers

```js
const hud = game.modules.get('scorpious187s-scifi-character-hud').api;
hud.toggle();          // raise or lower the projection
hud.setPower(true);    // raise it
hud.debug();           // log what is mounted and where
```

## Licence

MIT.
