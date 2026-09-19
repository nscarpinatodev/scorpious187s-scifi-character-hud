# Scorpious187's Sci-Fi Character HUD — Plan

A Foundry VTT v13–v14 module that re-presents the **player character sheet** as an in-fiction
device: the Mass Effect **omni-tool**, a **wrist computer** (Neon Odyssey-style 5e), and the
Command & Conquer **EVA** unit. It supports PF2e, SF2e and D&D 5e, and requires `scorpious187s-lib`.

## Ground rule: skin, don't fork

**Nothing about how the sheet works changes.** Every roll, drag-drop, rest, level-up, spell
slot, MAP strike and tab-management click is still the game system's own code. This is the
opposite of the Pip-Boy, which reimplements the Fallout sheet from scratch. That was viable for
one small system; it is not viable for three large ones that release every few weeks.

The approach is to **subclass each system's own character sheet** and change only:

- the page template that lays the sections out,
- the CSS,
- the window options.

Data prep (`getData` / `_prepareContext`), listeners and actions are inherited untouched.

### What each system gives us (checked against installed versions)

| | SF2e 1.5.1 / PF2e 8.5.1 | D&D 5e 6.0.3 |
|---|---|---|
| Base class | `CharacterSheetPF2e`, from `foundry.appv1.sheets.ActorSheet` (older style) | `CharacterActorSheet`, from `ApplicationV2` (newer style) |
| How content is built | One `sheet.hbs` pulling in 10 tab partials plus sidebar and header partials, via `resolvePath` | A static `PARTS` map (header, sidebar, 9 tab parts, ability scores, tabs) |
| How behaviour is attached | jQuery listeners bound by **CSS selector**; tabs keyed to `nav.sheet-navigation` → `.sheet-content` | `data-action` attributes, so **position-independent** |
| What we override | the `template` getter (our shell, which includes the system's partials); `defaultOptions` (classes, size, tab selectors) | `PARTS` (re-parent the same templates into our containers), `DEFAULT_OPTIONS`, `_onRender` for chrome |
| Layout constraint | Must keep the containers the listeners query: `nav.sheet-navigation`, `.sheet-content`, `aside .sidebar`, header elements, `.tab[data-tab]` | Almost none; parts can go anywhere |

We get the class at runtime from `CONFIG.Actor.sheetClasses.character` rather than importing it
(the system bundles are minified). Foundry fires render hooks for every class in the chain, so
modules that hook `renderCharacterSheetPF2e` or `renderCharacterActorSheet` (Toolbelt, Dorako UX,
Tidy integrations and so on) keep working.

## Architecture

```
scripts/
  module.mjs                  bootstrap via lib.registerModule, settings, sheet registration
  adapters/
    pf2e-family.mjs           makeHudSheet(CharacterSheetPF2e) for pf2e + sf2e (same code)
    dnd5e.mjs                 makeHudSheet(CharacterActorSheet)
  themes/
    registry.mjs              theme descriptors: id, label, systems, frame art, slot layout
templates/
  pf2e/shell.hbs              omni-tool/EVA/wrist shell that includes the system's partials
  dnd5e/…                     container templates only, since the parts are the system's own
styles/
  hud-core.css                projection surface, glow, scanlines, scaling, frame on/off
  themes/omni-tool.css        each theme is a set of CSS variables plus its own ornaments
  themes/eva.css
  themes/wrist.css
  system/pf2e-overrides.css   restyles system internals (strike rows, skill list, spells…)
  system/dnd5e-overrides.css
assets/frames/                generated device art, one per theme (optional layer)
```

- **One sheet per system, with the theme as a setting.** "Sci-Fi HUD" appears once in Sheet
  Configuration, and the theme is chosen by:
  1. a world default (GM), then
  2. a per-actor override stored in an actor flag, so a player picks their own device.
- **Frame art on/off** is a client setting, so each user chooses. With the frame on, the device
  image is the backdrop and the projection is positioned over its emitter. With it off, the
  panels float on their own.
- **Slots.** The shell exposes named regions (`projection`, `vitals`, `defenses`, `nav`,
  `readout`, `identity`). Each theme's CSS places those regions around its own screen shape
  using grid areas, so omni-tool, EVA and wrist can lay out differently from the same markup.
- **Scaling** uses one `--hud-scale` variable with a minimum window size, the same approach as
  the Pip-Boy's `--pip-ui-scale`.
- **Escape hatch.** A gear in the HUD chrome opens Sheet Configuration, because the frame hides
  the window header, as in the Pip-Boy.

### Omni-tool first layout (strawman)

```
            ┌──────────── identity: name · ancestry · class · level ────────────┐
  vitals    │                                                                   │  defenses
  HP / temp │          PROJECTION — the active system tab                       │  AC · Fort
  hero pts  │          (actions, inventory, spells, feats, proficiencies…)      │  Ref · Will
  conditions│                                                                   │  Perception
            └───────────────────────────────────────────────────────────────────┘
                 nav ring: tab glyphs arcing along the emitter edge
   ══════════ forearm / omni-tool device (frame art, optional) ══════════
```

## Power sequences

Every theme has an activation and a deactivation sequence. They are pure CSS keyframes on the
slot elements, staggered by a `--d` (activation) or `--dr` (deactivation) delay set per slot, so
nothing about the sheet's markup or behaviour depends on them.

| Theme | Activation | Deactivation |
|---|---|---|
| Omni-tool | Panels elevate out of the emitter band: rise, unsquash vertically and unblur, while a light sweep runs up the projection and the emitter flares. ~940 ms. | Panels drop and squash back into the band, closest-to-the-arm last. ~780 ms. |
| EVA | Screens rise out of the bezel behind a CRT line flash that opens from a hairline to full height. ~940 ms. | Screens sink and clip away; the line collapses back to a hairline. ~780 ms. |
| Wrist computer | The whole case swings up on a hinge at its base (`rotateX(86deg)` → `0`, origin at the case's bottom edge), and the screens wake as it arrives. ~940 ms. | The screens go dark, then the case folds down from that same base hinge — the top falls away from the viewer until it is gone. ~780 ms. |

Rules:

- **Order:** the projection leads, then identity, vitals, defenses, effects, extras, readout, and
  the nav buttons last. Deactivation runs in reverse.
- **Powered down** shows only the housing: a dormant omni-tool band, a dark EVA console, a closed
  wrist unit — plus a standby panel that reactivates it. Screen-only ornaments (the projection
  beam, EVA's link, radar, credits and power bar) are hidden while it is down.
- **Triggers:** opening the sheet plays activation; closing plays deactivation before the window
  closes; switching theme replays activation.
- **`prefers-reduced-motion`** skips every sequence and renders the HUD in its resting state.
- Sequences never gate interaction: the sheet is fully usable from the first frame, because the
  system's own markup is already in the DOM.

## Fitting small monitors

The HUD is wide by nature, so it must be able to get out of the way and to shed weight. Three
client-side controls, each a per-player setting:

1. **Hide keybinding.** Registered through `game.keybindings.register` (default unbound or `H`),
   so every player rebinds it in Configure Controls. It hides every open HUD sheet instantly and
   restores it in place — the sheet is not closed, so scroll position, active tab and any open
   dialog survive. No power sequence plays; hiding is meant to be immediate.
2. **Chrome modes**, replacing the earlier frame on/off toggle:
   - `full` — device art and backdrop (the default).
   - `bare` — backdrop only; no forearm, console bezel or case.
   - `clean` — neither. The panels float on a transparent window, which also drops the
     application window's own background. This is the mode for a 1080p laptop.
   EVA keeps its functional readouts (voice link, radar, credits, power bar) in every mode;
   only decorative chrome goes.
3. **UI scale.** One `--hud-scale` variable on the shell, as the Pip-Boy does, with a sensible
   minimum window size. The prototype's Window control demonstrates the same scaling.

## Main risk: the system CSS

PF2e/SF2e sheet styling is dense and scoped to `.sheet.character`. We **keep** the system's
classes so the internals still lay out correctly, then retheme on top. In practice that means:

- colour and border overrides on the system's own variables where they exist, otherwise
  targeted selectors;
- no `display` or `grid` changes inside tab content unless unavoidable, because layout
  overrides are what break on system updates.

A **compatibility guard** checks the system version against a tested range. Outside that range
it shows a one-time warning, and the user can fall back to the standard sheet with one click.

## Phases

0. **Scaffold.**
   - Repo, `module.json` with `scorpious187s-lib` as a requirement and the three systems as
     optional relationships.
   - Copy `build.ps1`, `deploy.ps1` and the release workflow from the Pip-Boy.
1. **SF2e, unthemed.**
   - Subclass, shell template with the regions, register the sheet.
   - Goal: the standard sheet rearranged into slots, with **every item on the test checklist
     passing**. No theming until this holds.
2. **Omni-tool theme, frame off.** Orange holo palette, glow, hex/scanline overlays, restyled
   system internals.
3. **Omni-tool frame art.** Generate the device (forearm and emitter), position the projection,
   add the frame toggle.
4. **PF2e.** It should be nearly free; verify with the checklist and fix CSS drift.
5. **D&D 5e adapter.** Re-parent `PARTS`, run the checklist, then apply the omni-tool theme to
   prove the themes are system-agnostic.
6. **EVA theme**, then the **wrist computer theme.**
7. Docs, screenshots, release.

### "Nothing changed" test checklist (run per system)

- **Rolls:** strikes (MAP 1/2/3, damage and crit), skill check, save, perception, initiative.
- **Spells:** cast a spell, spend and restore a slot, focus points, spell prep or signature
  toggle.
- **Items:** drag an item in from a compendium, equip/invest/carry, drop onto another actor,
  create a container, quantity edits.
- **Status:** conditions (add, increment, remove), hero points or inspiration, HP and temp HP
  edits, dying and wounded.
- **Upkeep:** rest for the night or short/long rest, level-up flow, class/ancestry drop.
- **Sheet management:** manage tabs, the limited view (non-owner), player-owned versus GM-opened.
- **Modules:** third-party sheet-injecting modules still render.
- Closing and reopening keeps the scroll position and the active tab.

## Decisions (2026-09-18)

1. **Wrist computer:** a generic synthwave space-opera device, open to all systems (not tied to
   Neon Odyssey content).
2. **EVA:** two themes, GDI (green/gold) and Nod (red/bone).
3. **Mass Effect extras:** yes. When the conversion module is active, the HUD shows an `extras`
   slot (the Dossier) with shields, paragon/renegade, credits and omni-gel.
   - **Paragon/renegade data** already exists in the conversion module's
     `scripts/paragon-renegade.js`: `flags.world.paragon` and `flags.world.renegade`, 0–100.
     Tier perks at 20/40/60/80/100 are real effect and action items on the actor.
   - The HUD reads the flags and calls `globalThis.MassEffectPR`. It never writes perks itself.
   - **To do:** the conversion module should expose `adjust(actor, track, delta)` and
     `useTier(actor, track, tier)` on its API so the Dossier buttons can call the tracker's
     engine directly.
4. **Readout panel:** keep it. It shows item, weapon, feat, skill and effect descriptions.
5. **Interactive prototype:** https://claude.ai/artifact/95dRhS7mtbBNMpbhbiFDPF
6. **NPC / vehicle sheets** are out of scope for now (player characters only).
7. **Static mock-ups:** https://claude.ai/artifact/DJPdg72PUWy89x686i4TEh
