/** Module-wide constants. */

export const MOD = 'scorpious187s-scifi-character-hud';

/**
 * The devices. A device decides three things: the colors the interface takes, whether
 * anything is drawn at the foot of the screen, and how the projection opens and closes.
 *
 *  - `art`      the id of the art layer drawn at the bottom of the interface, if any.
 *               The omni-tool's arm and the TRON deck carry the macro bar. The wrist unit
 *               and the EVA console draw their housing around the projection instead.
 *  - `sequence` which power sequence plays.
 *  - `switch`   where the power control lives: on the device's own band, or on the macro bar.
 *  - `projects` false for a device whose sheet is a thing in its own right, the Journal's
 *               book: no beam reaches it from the device, and it takes the free room rather
 *               than matching the plate's width.
 */
export const DEVICES = {
	omni: { id: 'omni', label: 'SFH.Device.Omni', hint: 'SFH.Device.OmniHint', art: 'arm', sequence: 'rise', switch: 'band' },
	wrist: { id: 'wrist', label: 'SFH.Device.Wrist', hint: 'SFH.Device.WristHint', art: null, sequence: 'fold', switch: 'bar' },
	gdi: { id: 'gdi', label: 'SFH.Device.Gdi', hint: 'SFH.Device.GdiHint', art: null, sequence: 'crt', switch: 'bar' },
	nod: { id: 'nod', label: 'SFH.Device.Nod', hint: 'SFH.Device.NodHint', art: null, sequence: 'crt', switch: 'bar' },
	tron: { id: 'tron', label: 'SFH.Device.Tron', hint: 'SFH.Device.TronHint', art: 'disc', sequence: 'rez', switch: 'band' },
	vambrace: { id: 'vambrace', label: 'SFH.Device.Vambrace', hint: 'SFH.Device.VambraceHint', art: 'bracer', sequence: 'sigil', switch: 'band' },
	journal: { id: 'journal', label: 'SFH.Device.Journal', hint: 'SFH.Device.JournalHint', art: 'strap', sequence: 'book', switch: 'band', projects: false },
};

export const DEFAULT_DEVICE = 'omni';

/** Client and world settings keys. */
export const S = {
	device: 'device',             // client — which device this user wears
	sequences: 'sequences',       // client — play the power sequences
	deckSize: 'deckSize',         // client — macro bar key size on the device, px
	grid: 'grid',                 // client — the etched grid: 'panels' | 'full' | 'off'
	controlIcons: 'controlIcons', // client — sci-fi icons on the scene controls
	chatCards: 'chatCards',       // client — chat cards in the device's colors, not on parchment
	calendaria: 'calendaria',     // client — Calendaria in the device's colors, over the 3DS:ATLAS theme
	carousel: 'carousel',         // client — the turn order as a row of portraits across the top
	carouselScale: 'carouselScale', // client — how large the carousel is, %
	carouselLayout: 'carouselLayout', // client — the current turn on the left, or centered
	sceneBar: 'sceneBar',           // client — the scene bar in place of Foundry's scene list
	sceneBarStyle: 'sceneBarStyle', // client — a bar of scenes, or just the button that opens them
	sceneBarCollapsed: 'sceneBarCollapsed', // client, hidden — whether it is collapsed now
	sceneBarStartCollapsed: 'sceneBarStartCollapsed', // client — collapsed each time Foundry loads
	sceneBarCombat: 'sceneBarCombat', // client — collapsed while an encounter runs
	sceneBarHover: 'sceneBarHover', // client — collapsed, it opens under the pointer
	projScale: 'projScale',       // client — wrist and EVA projection size, % of the free space
	headingColor: 'headingColor', // client — the player's own color for the interface's headings
	fontDisplay: 'fontDisplay',   // client — the player's own font for headings and names
	fontBody: 'fontBody',         // client — the player's own font for text
	fontMono: 'fontMono',         // client — the player's own font for numbers and readouts
	googleFonts: 'googleFonts',   // client — fetch a typed font from Google Fonts when it is not installed
	worldDevice: 'worldDevice',   // world  — the device a user gets before they pick one
};

/** Keybinding actions. */
export const KEYS = {
	hide: 'hide',                 // clear the HUD off the screen, and bring it back
};

/** Timings for the power sequences, in ms. Keep in step with styles/device.css. */
export const SEQ = { on: 940, off: 780 };

/**
 * The sequences that run longer: the Journal rises, swings open and is written in, and the
 * Vambrace's sigil turns open before its panels are drawn, which takes longer than light
 * coming on. Keep in step with design/1-head.html.
 */
export const SEQ_LONG = { book: { on: 3900, off: 1350 }, sigil: { on: 1500, off: 950 } };

/** How long a device's sequence runs, in ms. */
export function seqMs(kind, deviceId) {
	return SEQ_LONG[DEVICES[deviceId]?.sequence]?.[kind] ?? SEQ[kind];
}

/** Element ids this module owns. */
export const EL = {
	device: 'sfh-device',      // the art layer at the foot of the interface
	deck: 'sfh-deck',          // where the macro bar sits when it rides on a device
	power: 'sfh-power',        // the power key added to the macro bar
	restore: 'sfh-restore',    // the key that brings a hidden HUD back
	projection: 'sfh-projection',
	beam: 'sfh-beam',           // the cone of light from the emitter to the projection
	carousel: 'sfh-carousel',   // the turn order across the top of the screen
	scenes: 'sfh-scenes',       // the scene bar, in place of Foundry's scene list
};

/** The Mass Effect conversion, whose data the Dossier panel reads. */
export const ME_MODULE = 'mass-effect-sf2e-conversion';
