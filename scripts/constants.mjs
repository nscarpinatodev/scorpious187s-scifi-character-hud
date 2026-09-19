/** Module-wide constants. */

export const MOD = 'scorpious187s-scifi-character-hud';

/** Client and world settings keys. */
export const S = {
	defaultTheme: 'defaultTheme',   // world  — theme used when an actor has no override
	meExtras: 'meExtras',           // world  — 'auto' | 'off'
	chrome: 'chrome',               // client — 'full' | 'bare' | 'clean'
	scanlines: 'scanlines',         // client — boolean
	scale: 'scale',                 // client — 0.7 – 1.3
	sequences: 'sequences',         // client — play power sequences
	closeSequence: 'closeSequence', // client — play the shutdown before the window closes
	compactAt: 'compactAt',         // client — px width below which the compact layout kicks in
	readout: 'readout',             // client — show the readout panel
};

/** Per-actor flag holding that character's own theme choice. */
export const FLAG_THEME = 'theme';

/** Timings for the power sequences, in ms. Keep in step with styles/themes.css. */
export const SEQ = { on: 940, off: 780 };

/** Layout breakpoints (px of sheet width). `wide` is anything above compact. */
export const SIZES = { compact: 1040, mini: 760 };

/** The Mass Effect conversion, whose data the Dossier panel reads. */
export const ME_MODULE = 'mass-effect-sf2e-conversion';
