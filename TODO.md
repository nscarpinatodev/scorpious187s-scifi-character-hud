# To do

Work that is known, wanted and not done yet. Ordered roughly by when it should happen.

## Next

- [ ] **Remaining tab bodies** — PF2e crafting and spellcasting, 5e bastion and special traits.
- [ ] **Adding conditions** from the projection (the mock-up's "+ Add condition" picker).
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
- [ ] **Paragon/Renegade dossier** — read the conversion module's `flags.world.paragon` and
      `.renegade` rather than duplicating the tracker.
- [ ] **Per-character device** — a character can carry its own device choice (`FLAG_DEVICE`),
      overriding the player's.
- [ ] **Scene controls and scene bar shapes** — currently only recoloured; the mock-up's cut
      corners and station look are not applied.
