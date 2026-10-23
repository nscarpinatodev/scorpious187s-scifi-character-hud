# To do

Work that is known, wanted and not done yet. Ordered roughly by when it should happen.

## Editing from the projection

Hit points are typed now — an amount with Heal and Damage, the value itself editable, and
right-click for maximum and temporary. The same treatment is wanted for everything else that
changes during play. Anything that changes at level-up or character creation stays on the
system's own sheet, which the book button opens.

- [ ] **Conditions** — add from a picker, and raise or lower valued ones, on both systems.
- [ ] **Spell slots (5e)** — spend and regain from the Spells tab.
- [ ] **Currency** — editable in the Inventory tab.
- [ ] **Experience and level** — typed, like hit points.
- [ ] **Item names, quantities and notes** — quantity and equipped are there; the rest is not.
- [ ] **Biography** — currently read-only text; make it editable in place.
- [ ] **Right-click elsewhere** — the same editor pattern for any value with more behind it
      than one number (temporary hit points, shields, hero points).

## Next

- [ ] **Remaining tab bodies** — PF2e crafting and spellcasting, 5e bastion and special traits.
- [ ] **Translatable strings** — every label in `projection/panels.mjs` and the adapters is
      written in English in the markup. Move them to `lang/en.json`; `tools/check.mjs` will
      then hold them to it.
- [ ] **Bundled fonts** — the devices' typefaces come from Google Fonts at load, so an offline
      table gets fallbacks. All six are OFL; ship them in `fonts/` with the licence.
- [ ] **The readout** — currently name, type, traits and description. The mock-up also showed
      per-kind detail (skill breakdowns, tier lists for Paragon/Renegade).

## Sidebar panels, one at a time

`styles/interface.css` maps the device palette onto Foundry's own colour properties inside the
interface regions, which carries the sidebar as a whole. Each panel still needs its own pass —
the palette gets the colours right, not the shape.

- [ ] **Chat** — message frames, whispers, rolls and dice results, the roll-mode picker and the
      chat input. Roll results are the panel players look at most; they should read like the
      device's own readout.
- [ ] **Combat tracker** — initiative rows, the active combatant, token images, HP bars and the
      round controls.
- [ ] **Actors, Items, Journal, Tables, Cards, Playlists directories** — folder rows, entry rows,
      the search box and the create buttons.
- [ ] **Compendium** — pack rows and the pack browser.
- [ ] **Settings tab** — the module and game settings lists.
- [ ] **Sidebar tab strip** — the icons themselves, not just their active state.
- [ ] **Popped-out sidebar tabs** — they render outside the interface regions, so the palette
      scoping does not reach them. Decide whether they should be themed too.

## After that

- [ ] **Hide everything** — a rebindable key that clears the HUD off small monitors, with an
      obvious way back.
- [ ] **Compact layout** — the projection's panels rearranged below a width threshold.
- [ ] **Per-character device** — a character can carry its own device choice in an actor
      flag, overriding the player's.
- [ ] **Scene controls and scene bar shapes** — currently only recoloured; the mock-up's cut
      corners and station look are not applied.
