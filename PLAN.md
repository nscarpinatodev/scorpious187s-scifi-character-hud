# Scorpious187's Sci-Fi Character HUD — Plan

A Foundry VTT v13–v14 module that dresses the **interface** as the device the character is
wearing: the Mass Effect **omni-tool**, a synthwave **wrist computer**, and the Command &
Conquer **EVA** console. It supports PF2e, SF2e and D&D 5e.

The reference for every design decision is the approved interactive mock-up. When this
document and the mock-up disagree, the mock-up wins.

## What it is

Not a character sheet. A **UI theme**:

- the foot of the screen is the device — for the omni-tool, a forearm plate with the emitter
  band on it;
- Foundry's **own macro bar** rides on the device;
- the device's switch — the omni-tool's band, a power key on the bar for the others — raises
  a **projected character sheet** over the canvas;
- the rest of the interface (scene bar, controls, sidebar, player list) is recoloured to match,
  and never covered by the projection.

## Ground rule: skin, don't fork

Nothing about how the game system works changes. Every roll, drag-drop, rest, spell slot,
MAP strike and tab click is still the system's own code.

That rule is enforced structurally, not by discipline:

- **The macro bar is Foundry's `#hotbar`**, the same element with the same listeners and drop
  targets, moved onto the device and given a different `--hotbar-size`. Foundry inserts a
  frameless application's element on its *first* render only, so once moved it stays moved and
  later renders only rewrite its contents. That is why the power key lives *outside* `#hotbar`:
  its contents are replaced whenever a macro is dropped or the page turns.
- **The projection's tab body is the system's own sheet.** Our panels surround it; the big
  tabbed area is the real sheet element, relocated into the projection frame and restyled. A
  DOM move keeps every listener bound, so the system keeps working as it always did.

## Architecture

```
scripts/
  module.mjs            entry: settings, lifecycle, stylesheet self-heal, api + debug()
  constants.mjs         module id, device table, setting keys, sequence timings, element ids
  settings.mjs          per-user device choice, key size, sequences, etched grid
  device/
    art.mjs             the arm, in the mock-up's own coordinates
    chrome.mjs          mounts the device, moves the macro bar onto it, power + sequences
  projection/           (next) the projected sheet: frame, panels, the docked system sheet
  adapters/
    pf2e-family.mjs     SF2e and PF2e: the numbers our panels show
    dnd5e.mjs           D&D 5e: the same, from its own API
styles/
  device.css            device palettes, the arm, the macro bar skin, device sequences
  projection.css        (next) the projection frame, panels, and its half of the sequences
tools/
  harness-device.html   Foundry's game-view regions and real hotbar markup, no Foundry
  harness-device.mjs    stubs game.settings / i18n / Hooks, runs the real chrome.mjs
  preview-device.mjs    screenshots all four devices and prints their geometry
```

### Why a harness

Foundry can only be driven by hand. The harness reproduces the parts of the game view the
module touches — `#interface > #ui-middle > #ui-bottom`, the hotbar markup from
`templates/ui/hotbar.hbs`, and Foundry's own `foundry2.css` — so the real module code can be
rendered and measured headlessly before it is ever loaded in a world. Geometry is asserted in
numbers (is the bar 74% of the plate? is it clear of the band?), not eyeballed.

## Devices

| | art at the foot | switch | sequence |
|---|---|---|---|
| Omni-tool | forearm plate + emitter band | the band itself | panels rise out of the band, beam widens with them |
| Wrist computer | none | power key on the bar | the case hinges down from its base |
| EVA (GDI / Nod) | none | power key on the bar | a pulse draws across the centre, the picture opens out of it |

The wrist unit and the EVA draw their housing around the **projection**, not at the foot of the
screen, which is why only the omni-tool has art in `device/art.mjs`.

## Status

**Done — the device chrome (v0.2.0).** All four devices mount into `#ui-bottom`; the real macro
bar is moved onto the omni-tool's arm and sized to it, or docked with a power key for the others;
the band and the power key raise and lower the power state and play the sequence classes; per-user
settings for device, key size, sequences and the etched grid.

**Next — the projection.** The frame and panels from the mock-up (identity, vitals, defenses,
effects, Mass Effect dossier, readout), the system's own sheet docked into the tab body, the
three power sequences, and the rule that the projection is centred on the window but never
reaches under the sidebar, controls, scene bar or macro bar.

**After that.** Hide-everything key for small monitors; the Paragon/Renegade dossier reading the
conversion module's flags; compact layout.
