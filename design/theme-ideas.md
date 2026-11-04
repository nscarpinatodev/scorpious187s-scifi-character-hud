# Theme ideas: more sci-fi devices

Research for the devices after 0.2.0. Every device works in every supported system (D&D 5e,
PF2e, SF2e), so what matters is which games people run on those systems, and which look fits a
character sheet projected from something the character wears.

## What people play on these systems

- **Star Wars 5e (SW5e).** An unofficial fan conversion. It has been a separate Foundry system
  (`sw5e`), and its developers have since said the standalone system was too hard to keep up and
  that it now runs as a module on top of the dnd5e system. If that holds, this module's 5e
  adapter would already read SW5e characters. Which route is current needs checking against the
  SW5e GitHub and Discord before relying on it.
- **Esper Genesis.** A commercial science-fantasy setting for 5e from Skydawn Game Studios, sold
  as Foundry modules on the dnd5e system (Core Manual, Master Technician's Guide, Threats
  Database). It already works with this module's 5e adapter.
- **Other 5e science fiction:** Dark Matter, Carbon 2025, Voidrunner's Codex, Exodus, Traveller
  5E, Neon Odyssey. Their Foundry support was not checked.
- **Spelljammer and Wildjammer.** Space fantasy on 5e, closer to the fantasy devices than the
  sci-fi ones; the Journal and the Vambrace suit it already.
- **Starfinder 2e.** The official SF2e system, built on the PF2e codebase. It is supported now.

## Proposed devices

Each keeps the module's idea: the foot of the screen is the device, and its switch raises the
sheet over the table.

1. **Holoprojector** (for Star Wars games): a palm-sized disc emitter at the foot of the screen.
   The sheet is a flickering blue hologram, scanlines and all, with interference when it opens
   and closes. The closest fit of all to what the module already does, and the device art is
   small (a disc, like TRON's).
2. **Datapad** (also Star Wars, for the scoundrel's side): a battered handheld with an amber or
   green segmented readout, chunky buttons and scuffed plating. Low-tech next to the
   holoprojector.
3. **Armored gauntlet** (Star Wars, bounty hunters; proposed as the "Beskar vambrace"): hammered
   steel with a small inset display and red status lights. Mostly a palette and new art on a
   device already built.
4. **Comm unit** (Starfinder): a Pact Worlds wrist unit in teal and orange, hexagonal panels and
   a holographic emitter. A natural default for SF2e games, which today get the omni-tool.
5. **Crystal core** (Esper Genesis and clean science fantasy; proposed as the "Esper core"):
   crystalline white and cyan, soft light, panels like cut glass.
6. **Retro terminal** (horror in space: Voidrunner's Codex, Dark Matter): a green-on-black CRT
   with a blinking cursor and boot text, the sheet typed out line by line as it opens.
7. **Cyberdeck** (Neon Odyssey, Carbon 2025): neon magenta and cyan, glitching on open and close;
   different enough from the synthwave wrist computer to stand on its own.

## Built, as looks

All seven are built, as looks picked like a device (`DEVICES` in `scripts/constants.mjs`; their
styles in `styles/looks.css`, their art in `scripts/device/art.mjs`). Each dresses the built device
it is closest to, keeping that device's layout and words; three of them open their own way.

| Look | Over | What it is |
| --- | --- | --- |
| Holoprojector | omni-tool | A disc emitter on a low pedestal; translucent blue panels with heavy scanlines, an interference band rolling down them and an idle flicker. Opens its own way: the panels flicker and jitter into being. |
| Datapad | wrist computer | The wrist unit's case worn to grey plastic around a dark olive screen; amber VT323 on an LCD grid, chunky keys. |
| Armored gauntlet | omni-tool | A hammered steel gauntlet with rivets, plate seams, two red lights and a small red display for the switch; gunmetal panels with silver edges and red readings. |
| Comm unit | omni-tool | A slate wrist slab with teal light strips, orange signals and a hexagonal emitter; cut-cornered panels and hexagonal tabs over a teal hex grid. |
| Crystal core | Runic Vambrace | A white ceramic band with a cut crystal for the switch; frosted white glass panels in navy and cyan, the sigil's rings in white without its runes, and cyan bolts. |
| Retro terminal | EVA (GDI) | Green phosphor in an old beige monitor: VT323 throughout, glowing text, a dark vignette, a blinking cursor after each heading. Opens its own way: every panel typed out top to bottom. |
| Cyberdeck | TRON | A neon slab with rows of little keys and a glitched logo for the switch; magenta and cyan. Opens its own way: every panel glitches in, in torn slices. |

What they borrow is also what they keep: the Crystal core says "Wards & Hexes" and "Lore" (the
Vambrace's words), and the Retro terminal is the EVA's console, with its link dish and unit card.

## Names

Decided: a device or a look is named for what it is, never for the game it suits. Trademarked
names (Star Wars, Mandalorian, Starfinder, Esper Genesis) belong in descriptions at most, never in
names or art. So the Beskar vambrace was built as the **Armored gauntlet**, and the Esper core as
the **Crystal core**. The omni-tool, TRON and EVA are still named for the works they come from;
whether to rename those is open.

## Sources

- [SW5e for Foundry VTT (GitHub)](https://github.com/JavaShipped/sw5e)
- [SW5e module development post (Answer Overflow)](https://www.answeroverflow.com/m/1425330276250423427)
- [SW5e creator stepping away from project (EN World)](https://www.enworld.org/threads/sw5e-creator-stepping-away-from-project.692862/)
- [Esper Genesis on Foundry VTT](https://foundryvtt.com/packages/esper-genesis)
- [Esper Genesis Master Technician's Guide on Foundry VTT](https://foundryvtt.com/packages/eg-master-technicians-guide)
- [Is D&D-powered sci-fi having a moment? (EN World)](https://www.enworld.org/posts/9887399/)
- [Wildjammer gets a Foundry module (GeekNative)](https://www.geeknative.com/133823/5e-spelljammer-wildjammer-gets-100-page-supplement-and-foundryvtt-module)
- [Starfinder 2e on Foundry VTT](https://foundryvtt.com/packages/sf2e)
- [Starfinder 2e on Foundry VTT, Paizo's blog](https://cdn.paizo.com/blog/the-end-is-nigh)
