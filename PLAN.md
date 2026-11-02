# Scorpious187's Sci-Fi Character HUD — Plan

A Foundry VTT v13–v14 module that dresses the **interface** as the device the character is
wearing: the Mass Effect **omni-tool**, a synthwave **wrist computer**, the Command & Conquer
**EVA** console, and a **TRON** identity disc. It supports PF2e, SF2e and D&D 5e.

TRON came after the mock-up was signed off, so its demo page does not show it. Its styles
still live in the mock-up's stylesheet, because `projection.css` is generated from there.

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
- **The projection only sends intent.** Its markup is ours (see below), but every control
  carries a `data-act` that the adapter turns into the system's own call. Nothing in the
  projection computes a roll, a modifier or a damage total.

## Architecture

```
design/                 the approved mock-up, kept as the design source of truth
scripts/
  module.mjs            entry: settings, lifecycle, stylesheet self-heal, api + debug()
  constants.mjs         module id, device table, setting keys, sequence timings, element ids
  settings.mjs          per-user device choice, key size, sequences, etched grid
  device/
    art.mjs             the arm and the TRON deck, in the mock-up's own coordinates
    chrome.mjs          mounts the device, moves the macro bar onto it, power + sequences
  projection/
    projection.mjs      the layer: board, fit, render, the delegated listener
    layout.mjs          where each panel sits, per device, in board coordinates
    panels.mjs          identity, vitals, defenses, effects, dossier, readout, tab ring
    ornaments.mjs       each device's housing and the EVA's own readouts
    dossier.mjs         reads the conversion module's Paragon/Renegade and shields
    helpers.mjs         the mock-up's markup helpers
  interface/
    controls.mjs        sci-fi icons for the scene controls, through getSceneControlButtons
    headings.mjs        the sidebar's headings: scaled to fit, and their colour
    placement.mjs       clears the HUD while something is being placed on the canvas
    fonts.mjs           a player's own fonts: applied as custom properties, fetched from
                        Google Fonts when missing, suggested in the settings window
  adapters/
    index.mjs           picks the adapter for the running system
    pf2e-family.mjs     SF2e and PF2e: what the panels show, what each button does
    dnd5e.mjs           D&D 5e: the same, through its own API
fonts/                  the devices' typefaces (OFL), each with its licence
styles/
  fonts.css             @font-face for everything in fonts/
  device.css            device palettes, the arm, the macro bar skin, device sequences
  interface.css         the device palette mapped onto Foundry's own interface colours
  projection.css        GENERATED from design/1-head.html by tools/port-css.py
  projection-frame.css  where the board sits on screen
tools/
  check.mjs             pre-flight: manifest files, i18n keys both ways, CSS braces, palettes
  port-css.py           regenerates projection.css from the mock-up
  harness-device.html   Foundry's game-view regions and real hotbar markup, no Foundry
  harness-device.mjs    stubs game/Hooks/ui and a character, runs the real module code
  preview-device.mjs    screenshots every device and prints its geometry
  preview-projection.mjs  raises the projection on each device and asserts what it drew
  test-placement.mjs    runs a placement through the real watcher on each device
  test-sheet-controls.mjs  presses the spell, skill and inventory controls and checks the calls
  test-headings.mjs     checks the sidebar's headings fit, in each device and a wide font
```

## Why the projection is ours

The panels, the tab ring and the tab bodies are the mock-up's markup, not the system's
sheet. That was tried — the system's sheet docked into a frame — and it simply looked like
the system's sheet in a box, because it was. What makes the design the design is the layout.

Mechanics are still the system's: every control carries a `data-act`, one delegated listener
hands it to the adapter, and the adapter calls `skill.roll()`, `save.roll()`,
`strike.variants[n].roll()`, `item.use()` and so on. The projection shows numbers and sends
intent; it never rolls anything itself.

### Why a harness

Foundry can only be driven by hand. The harness reproduces the parts of the game view the
module touches — `#interface > #ui-middle > #ui-bottom`, the hotbar markup from
`templates/ui/hotbar.hbs`, and Foundry's own `foundry2.css` — so the real module code can be
rendered and measured headlessly before it is ever loaded in a world. Geometry is asserted in
numbers (is the bar 74% of the plate? is it clear of the band?), not eyeballed.

The panels in it use Foundry's own markup from its templates and take their colours only from
Foundry's stylesheet and the module's. They once painted themselves from the palette, which showed
a themed interface here while real Foundry drew none of it: never colour anything in the harness.

## Devices

| | art at the foot | switch | sequence |
|---|---|---|---|
| Omni-tool | forearm plate + emitter band | the band itself | panels rise out of the band, beam widens with them |
| Wrist computer | none | power key on the bar | the case hinges down from its base |
| EVA (GDI / Nod) | none | power key on the bar | a pulse draws across the centre, the picture opens out of it |
| TRON | deck of light lines + identity disc | the disc itself | a ribbon of light sweeps up as the panels rez in, in hard steps; they derez into a line |

The wrist unit and the EVA draw their housing around the **projection**, not at the foot of the
screen, which is why only the omni-tool and TRON have art in `device/art.mjs`. A plate is
whatever carries `#sfh-arm` and a switch is whatever carries `#sfh-band`, so the fit and the beam
work from those two ids. TRON shares the omni-tool's layout and tab arc.

## Status

**Done — the device chrome.** All four devices mount into `#ui-bottom`; the real macro bar is
moved onto the omni-tool's arm and sized to it, or docked with a power key for the others; the
band and the power key raise and lower the projection; per-user settings.

**Done — the interface palette.** The device's colours are mapped onto Foundry's own colour
properties inside the interface regions, and each panel takes the device's edge, glow and active
state, so the sidebar, chat, scene bar, controls, player list, token HUD, menus and tooltips
follow the device. Foundry's theme sets many of its properties on the elements that use them
(`.ui-control`, inputs, buttons, sidebar tabs, each chat message) rather than higher up, so
`interface.css` sets them on those same elements: a value only inherited from the region never
reaches them. Chat cards leave parchment for the device's panels, with a setting to go back.

**Done — the projection, to the mock-up.** The board is drawn at the size the design was made
at and scaled into whatever room the interface leaves. Identity, vitals, defenses, effects, the
Mass Effect dossier and the readout are all there, with the tab ring and tab bodies fed by the
adapters. Verified headlessly on all four devices.

**Done — the beam.** The omni-tool's cone of light is drawn from the band's edges to the
main panel's bottom corners, measured from both, so it bridges the interface and the layer
over the canvas.

**Sizing.** The omni-tool's main panel comes out exactly as wide as the arm's plate, so the
two read as one machine, and the projection stands on the plate. The other devices take a
share of the free room set by the "Wrist computer and EVA projection size" setting, 55% by
default, so the projection sits above the device instead of swallowing the map; the setting
says in its name and hint that the omni-tool is not affected. The projection is centred on
the device it comes out of, and
keeps clear only of the panels actually beside it — Foundry's region boxes are mostly
empty, and #ui-left's scene-navigation column stretches to the middle of the screen.

**Asynchronous tab bodies.** An adapter's `tabBody` may return a promise of markup, for data
the system only gives asynchronously (PF2e's spellcasting sheet data). The projection keeps
the tab's last content until it resolves, and only the newest render may fill it.

**Done — hiding.** A rebindable key clears the art, the projection and the beam off the
screen without switching anything off; the macro bar stays with a restore key on it.

**Windows only the sheet can open.** The system does not expose its Spell Preparation window or
its currency dialog to modules, only to buttons on the character sheet, so the adapter presses
those buttons: on the open sheet, or on one drawn out of sight for the moment it takes. If a button
cannot be found the sheet is left showing, so there is still a way to it.

**Done — clearing the canvas.** On Foundry 14 every system places areas through
`canvas.regions.placeRegion` or `placeRegions`, from the projection, a sheet or a chat card, so
those two are wrapped: the HUD clears until the promise settles, and arguments, results and errors
pass through untouched. Foundry 13 places templates on their own layer, so there the layer's
activate and deactivate hooks do the same. It is kept apart from the hide key: no notice, no
restore key, and a HUD the player hid stays hidden.

**Done — fonts.** The devices' typefaces ship in `fonts/`, so nothing is fetched to draw
them. Each device has a body, display and mono face (`--sfh-face`, `--sfh-display`,
`--sfh-mono`); the omni-tool's display face is Michroma, in the mock-up too. A player can
type their own font for each role: one installed on their computer, one from Foundry's
Additional Fonts, or a Google Fonts family fetched when it is missing. The game's own
fonts (BioMass, Tigensu) and Myriad Pro cannot ship under the module's licence, which is
why the player brings them.

**Next.** Translatable strings in the panels and adapters, the chat panel, the rest of
editing from the projection (spell slots, currency), and the mock-up's remaining details.
See TODO.md.
