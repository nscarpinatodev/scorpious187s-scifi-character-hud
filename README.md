# Scorpious187's Sci-Fi Character HUD

Turns the player character sheet into an in-fiction device — a **Mass Effect omni-tool**, a
**synthwave wrist computer**, or a **Command & Conquer EVA console** — on Foundry VTT v13–v14.

**Nothing about how the sheet works changes.** Every roll, drag, rest, spell slot and tab is
still the game system's own code. The module changes where things sit and what they look like,
and that is all.

---

## Installation

In Foundry: **Add-on Modules → Install Module**, and paste this manifest URL:

```
https://github.com/nscarpinatodev/scorpious187s-scifi-character-hud/releases/latest/download/module.json
```

### Requirements

- Foundry VTT **v13+** (verified on **v14**)
- **[Scorpious187's Module Library](https://github.com/nscarpinatodev/scorpious187s-lib)**
- One of: **PF2e** 7.0+, **SF2e** 1.0+. *(D&D 5e is next; it is declared in the manifest but not
  yet registered.)*

## Making it your character sheet

Open a character, click the **gear** in the sheet's window header, and choose **Sci-Fi HUD** in
**Sheet Configuration**. The choice is stored on that actor, so every player can decide for
their own character; the module never changes the world default.

Inside the HUD, the same gear sits in the chrome bar, along with a palette button for choosing
that character's device.

## What you get

- **Four devices.** Omni-tool, wrist computer, EVA (GDI) and EVA (Nod). The GM sets a world
  default; any character can override it.
- **Power sequences.** The omni-tool and EVA screens rise out of the device on open; the wrist
  computer's case swings up from its base. Closing reverses it (off by default, since it delays
  the window closing).
- **A readout panel** that shows the description of whatever you point at — weapon, item, feat
  or action — and pins it when you click.
- **A Mass Effect Dossier**, when the
  [Mass Effect conversion](https://github.com/nscarpinatodev/mass-effect-sf2e-conversion) is
  active: shields, biotic barrier, armour frame, Paragon and Renegade, and omni-gel. It reads
  that module's data and opens its tracker; it never edits those values itself.

## Small screens

Three things keep the HUD usable on a laptop:

- **A hide key** (default **Alt+H**, rebindable in *Configure Controls*). It hides every open
  HUD without closing it, so your tab, scroll position and any open dialog survive.
- **Device art** in three steps — device and background, background only, or **panels only**,
  which drops the artwork entirely. There is a button for it in the chrome bar.
- **A compact layout** that switches itself on when the sheet is narrow: the tabs become a rail
  and the side panels move into a drawer you open with the panels button. Nothing is removed —
  a narrow sheet still reaches every part of the character. The width it kicks in at is a
  setting.

## How it works, for the curious

The module subclasses the system's own character sheet. After the system has rendered and bound
its listeners, the HUD takes the elements the system drew — the same nodes, with those listeners
still on them — assigns them to layout slots, and adds its own panels beside them. It never
rewrites the system's markup, so a system update changes what is in the panels and never the
HUD's structure. If the layout ever throws, the sheet falls back to the standard one and tells
you.

## Licence

MIT.
