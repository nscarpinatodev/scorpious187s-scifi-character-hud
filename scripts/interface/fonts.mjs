import { MOD, S } from '../constants.mjs';

/**
 * A player's own fonts, in place of the device's.
 *
 * Each setting holds a font family name, typed as it appears in the player's font list:
 * "Myriad Pro", or "Myriad Pro, Arial" for a fallback. Any of three sources will do:
 *
 *  - a font installed on the player's own computer;
 *  - one the GM has added under Additional Fonts in Foundry's Core settings, which every
 *    player gets;
 *  - any Google Fonts family, fetched when it is neither of those — unless the player has
 *    turned that off.
 *
 * Empty keeps the device's own. The family goes onto <body> as a custom property, and a data
 * attribute says it is set; device.css and projection-frame.css put it in place of the
 * device's face. The devices' own faces ship with the module (styles/fonts.css), so nothing
 * is fetched unless a player names a font they do not have.
 */

/** What each setting dresses: the property it fills and the attribute that switches it on. */
export const FONT_ROLES = {
	[S.fontDisplay]: { prop: '--sfh-font-display', attr: 'sfhFontDisplay' },
	[S.fontBody]: { prop: '--sfh-font-body', attr: 'sfhFontBody' },
	[S.fontMono]: { prop: '--sfh-font-mono', attr: 'sfhFontMono' },
};

/**
 * Names a player might have installed for the Mass Effect look. Only the ones actually on
 * this computer are suggested.
 */
const CANDIDATES = ['Myriad Pro', 'Myriad', 'BioMass', 'Tigensu', 'Eurostile', 'Eurostile Extended',
	'Microgramma', 'Mass Effect', 'Mass Effect Game'];

/** The faces the module ships (styles/fonts.css). */
const BUNDLED = ['Michroma', 'Rajdhani', 'Share Tech Mono', 'Chakra Petch', 'Audiowide', 'VT323', 'Oxanium'];

const GOOGLE = 'https://fonts.googleapis.com/css2';

/** `Myriad Pro, Arial` → ['Myriad Pro', 'Arial'], with anything that could end the declaration dropped. */
const families = (value) => String(value ?? '')
	.split(',')
	.map((name) => name.replace(/["'`;{}()\\<>]/g, '').trim())
	.filter(Boolean);

/** `Myriad Pro, Arial` → `"Myriad Pro", "Arial"`. */
export const fontStack = (value) => families(value).map((name) => `"${name}"`).join(', ');

/** Families already asked of Google, so each is fetched once. */
const fetched = new Map();

/** The last applyFonts(), which a report waits for: a font still on its way is not missing. */
let loading = Promise.resolve();

/**
 * Whether the browser can draw a family. A font Foundry or this module loaded is in
 * document.fonts; one installed on the computer is not, so it is measured instead: a
 * family that is missing falls through to the generic face and measures exactly as it does.
 */
export function fontInstalled(family) {
	if (!family) return false;
	for (const face of document.fonts) {
		if (face.family.replace(/["']/g, '') === family) return true;
	}
	const ctx = document.createElement('canvas').getContext('2d');
	const sample = 'mmmmmmmmmmlli1WQ@#';
	return ['monospace', 'serif', 'sans-serif'].some((generic) => {
		ctx.font = `72px ${generic}`;
		const fallback = ctx.measureText(sample).width;
		ctx.font = `72px "${family}", ${generic}`;
		return ctx.measureText(sample).width !== fallback;
	});
}

/** Link a stylesheet, settling with the link once it loads, or null if it cannot be had. */
const linkSheet = (href) => new Promise((resolve) => {
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = href;
	link.dataset.sfhFont = '';
	link.onload = () => resolve(link);
	link.onerror = () => {
		link.remove();
		resolve(null);
	};
	document.head.append(link);
});

/**
 * Fetch a family from Google Fonts. It is asked first for the weights the devices use; Google
 * refuses the whole request when a family lacks one of them, so it is then asked for just
 * its regular, and the browser makes the bold.
 */
function fromGoogle(family) {
	if (!fetched.has(family)) fetched.set(family, (async () => {
		const name = encodeURIComponent(family).replace(/%20/g, '+');
		for (const query of [`${name}:wght@400;500;600;700`, name]) {
			if (!(await linkSheet(`${GOOGLE}?family=${query}&display=swap`))) continue;
			await document.fonts.load(`16px "${family}"`).catch(() => {});
			return true;
		}
		return false;
	})());
	return fetched.get(family);
}

/**
 * Put each setting's font on <body>, or take it off, then fetch from Google Fonts whatever
 * is named and not here. The stand-in shows until it arrives.
 */
export function applyFonts() {
	const { style, dataset } = document.body;
	const wanted = [];
	for (const [key, { prop, attr }] of Object.entries(FONT_ROLES)) {
		const value = game.settings.get(MOD, key);
		const stack = fontStack(value);
		if (stack) {
			style.setProperty(prop, stack);
			dataset[attr] = '';
			wanted.push(...families(value));
		} else {
			style.removeProperty(prop);
			delete dataset[attr];
		}
	}
	const google = game.settings.get(MOD, S.googleFonts);
	loading = google ? Promise.all(wanted.filter((f) => !fontInstalled(f)).map(fromGoogle)) : Promise.resolve();
	return loading;
}

/** Say so when a setting names a font that could not be had. */
export async function reportMissingFonts({ keys = Object.keys(FONT_ROLES), notify = false } = {}) {
	await loading;
	const google = game.settings.get(MOD, S.googleFonts);
	for (const key of keys) {
		const family = families(game.settings.get(MOD, key))[0];
		if (!family || fontInstalled(family)) continue;
		const message = game.i18n.format(google ? 'SFH.Fonts.MissingGoogle' : 'SFH.Fonts.Missing', { font: family });
		console.warn(`${MOD} | ${message}`);
		if (notify) ui.notifications?.warn(message);
	}
}

/** A font setting changed — or the Google Fonts one, with no key: show it, and warn if a font is not there. */
export async function onFontChange(key) {
	await applyFonts();
	await reportMissingFonts({ keys: key ? [key] : undefined, notify: true });
}

/**
 * The `renderSettingsConfig` hook. The font settings are plain text, so any font can be typed
 * in; a suggestion list offers any of the Mass Effect candidates this computer has, the fonts
 * Foundry has loaded, and the module's own.
 */
export function suggestFonts(app, html) {
	const root = html instanceof HTMLElement ? html : html?.[0];
	const inputs = Object.keys(FONT_ROLES)
		.map((key) => root?.querySelector(`input[name="${MOD}.${key}"]`))
		.filter(Boolean);
	if (!inputs.length) return;

	const loaded = foundry.applications?.settings?.menus?.FontConfig?.getAvailableFonts?.() ?? [];
	const names = [...new Set([...CANDIDATES.filter(fontInstalled), ...loaded, ...BUNDLED])];
	const list = document.createElement('datalist');
	list.id = `${MOD}-fonts`;
	list.innerHTML = names.map((name) => `<option value="${name.replace(/"/g, '&quot;')}"></option>`).join('');
	root.querySelector(`#${list.id}`)?.remove();
	inputs[0].after(list);
	for (const input of inputs) {
		input.setAttribute('list', list.id);
		input.placeholder = game.i18n.localize('SFH.Fonts.Placeholder');
	}
}
