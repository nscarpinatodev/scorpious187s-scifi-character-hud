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
 *  - `base`     makes the device a look: another device dressed in its own palette and art.
 *               Everything but the colors and the art is the base device's — its layout, its
 *               board and its words — so the code asks for the base (currentDevice) and the
 *               look's own styles key off `data-sfh-look` (styles/looks.css). A look can open
 *               its own way: its animations are in styles/looks.css, and a `sequence` of its own
 *               names how long they run (SEQ_LONG).
 *  - `system`   a look made for one game system: worn by everyone in a world of that system,
 *               where nothing else can be chosen, and not offered in any other.
 */
export const DEVICES = {
	omni: { id: 'omni', genre: 'scifi', label: 'SFH.Device.Omni', hint: 'SFH.Device.OmniHint', art: 'arm', sequence: 'rise', switch: 'band' },
	wrist: { id: 'wrist', genre: 'scifi', label: 'SFH.Device.Wrist', hint: 'SFH.Device.WristHint', art: null, sequence: 'fold', switch: 'bar' },
	gdi: { id: 'gdi', genre: 'scifi', label: 'SFH.Device.Gdi', hint: 'SFH.Device.GdiHint', art: null, sequence: 'crt', switch: 'bar' },
	nod: { id: 'nod', genre: 'scifi', label: 'SFH.Device.Nod', hint: 'SFH.Device.NodHint', art: null, sequence: 'crt', switch: 'bar' },
	tron: { id: 'tron', genre: 'scifi', label: 'SFH.Device.Tron', hint: 'SFH.Device.TronHint', art: 'disc', sequence: 'rez', switch: 'band' },
	vambrace: { id: 'vambrace', genre: 'fantasy', label: 'SFH.Device.Vambrace', hint: 'SFH.Device.VambraceHint', art: 'bracer', sequence: 'sigil', switch: 'band' },
	journal: { id: 'journal', genre: 'fantasy', label: 'SFH.Device.Journal', hint: 'SFH.Device.JournalHint', art: 'satchel', sequence: 'book', switch: 'band', projects: false },
	// looks over the Vambrace and the Journal
	reliquary: { id: 'reliquary', genre: 'fantasy', label: 'SFH.Device.Reliquary', hint: 'SFH.Device.ReliquaryHint', base: 'vambrace', art: 'reliquary', sequence: 'sigil', switch: 'band' },
	runeforge: { id: 'runeforge', genre: 'fantasy', label: 'SFH.Device.Runeforge', hint: 'SFH.Device.RuneforgeHint', base: 'vambrace', art: 'runeforge', sequence: 'sigil', switch: 'band' },
	witchfire: { id: 'witchfire', genre: 'fantasy', label: 'SFH.Device.Witchfire', hint: 'SFH.Device.WitchfireHint', base: 'vambrace', art: 'witchfire', sequence: 'sigil', switch: 'band' },
	grove: { id: 'grove', genre: 'fantasy', label: 'SFH.Device.Grove', hint: 'SFH.Device.GroveHint', base: 'journal', art: 'grove', sequence: 'book', switch: 'band', projects: false },
	// looks for science fiction, each over the device it is closest to
	holoprojector: { id: 'holoprojector', genre: 'scifi', label: 'SFH.Device.Holoprojector', hint: 'SFH.Device.HoloprojectorHint', base: 'omni', art: 'holoprojector', sequence: 'flicker', switch: 'band' },
	datapad: { id: 'datapad', genre: 'scifi', label: 'SFH.Device.Datapad', hint: 'SFH.Device.DatapadHint', base: 'wrist', art: null, sequence: 'fold', switch: 'bar' },
	gauntlet: { id: 'gauntlet', genre: 'scifi', label: 'SFH.Device.Gauntlet', hint: 'SFH.Device.GauntletHint', base: 'omni', art: 'gauntlet', sequence: 'rise', switch: 'band' },
	comm: { id: 'comm', genre: 'scifi', label: 'SFH.Device.Comm', hint: 'SFH.Device.CommHint', base: 'omni', art: 'comm', sequence: 'rise', switch: 'band' },
	crystal: { id: 'crystal', genre: 'scifi', label: 'SFH.Device.Crystal', hint: 'SFH.Device.CrystalHint', base: 'vambrace', art: 'crystal', sequence: 'sigil', switch: 'band' },
	retro: { id: 'retro', genre: 'scifi', label: 'SFH.Device.Retro', hint: 'SFH.Device.RetroHint', base: 'wrist', art: null, sequence: 'type', switch: 'bar' },
	cyberdeck: { id: 'cyberdeck', genre: 'scifi', label: 'SFH.Device.Cyberdeck', hint: 'SFH.Device.CyberdeckHint', base: 'tron', art: 'cyberdeck', sequence: 'glitch', switch: 'band' },
	// Fallout 2d20 only, and always there: the Pip-Boy's forearm unit, whose switch brings up the Pip-Boy
	lonestar: { id: 'lonestar', genre: 'scifi', label: 'SFH.Device.Lonestar', hint: 'SFH.Device.LonestarHint', base: 'omni', art: 'lonestar', sequence: 'rise', switch: 'band', system: 'fallout' },
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
	journalDark: 'journalDark',   // client — the Journal's interface in dark leather, not paper
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
	sceneClick: 'sceneClick',       // client — a click in the Scenes tab: 'view' the scene | 'configure' it
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
 * The sequences that run longer: the Journal comes out of its satchel, swings open and its
 * writing fades in, and the Vambrace's sigil turns open before its panels are drawn, which takes
 * longer than light coming on. Closing, the Journal goes back in and the satchel is buckled shut
 * after it. Keep in step with design/1-head.html and styles/device.css.
 */
export const SEQ_LONG = {
	book: { on: 6000, off: 2700 }, sigil: { on: 1500, off: 950 },
	// the sci-fi looks' own openings (styles/looks.css): a hologram flickering in, a terminal
	// typing its panels out, and a deck glitching open, each longer than the light coming on
	flicker: { on: 1450, off: 780 }, type: { on: 2250, off: 780 }, glitch: { on: 1200, off: 780 },
};

/** How long a device's or a look's sequence runs, in ms. */
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
