import { MOD, S, EL } from './constants.mjs';
import { registerSettings, currentDevice } from './settings.mjs';
import { DeviceChrome } from './device/chrome.mjs';

/**
 * Scorpious187's Sci-Fi Character HUD.
 *
 * A skin for the Foundry interface: the foot of the screen becomes the device the
 * character is wearing, the macro bar rides on it, and its switch raises a projected
 * character sheet over the canvas. Nothing about how the game system works changes.
 */

/* -------------------------------------------- */
/*  Stylesheets                                  */
/* -------------------------------------------- */

/**
 * Foundry reads module.json when the world launches, so a stylesheet added to the
 * manifest afterwards is never linked until the world is restarted. Link ours ourselves
 * if they are missing — it costs nothing when they are already there.
 */
const STYLES = ['styles/device.css'];

function ensureStyles() {
	for (const path of STYLES) {
		const href = `modules/${MOD}/${path}`;
		if (document.querySelector(`link[href^="${href}"]`)) continue;
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = `${href}?v=${game.modules.get(MOD)?.version ?? '0'}`;
		document.head.append(link);
	}
}

/* -------------------------------------------- */
/*  Lifecycle                                    */
/* -------------------------------------------- */

Hooks.once('init', () => {
	registerSettings(() => DeviceChrome.refresh());
});

Hooks.once('ready', () => {
	ensureStyles();
	if (!DeviceChrome.mount()) {
		console.warn(`${MOD} | the interface has no #ui-bottom or #hotbar to mount on; the device is not shown`);
	}

	game.modules.get(MOD).api = {
		chrome: DeviceChrome,
		setPower: (on) => DeviceChrome.setPower(on),
		toggle: () => DeviceChrome.toggle(),
		refresh: () => DeviceChrome.refresh(),
		unmount: () => DeviceChrome.unmount(),
		debug,
	};
});

/**
 * Foundry only inserts a frameless application's element on its first render, so the
 * moved hotbar stays moved. It can still be re-rendered from scratch by other modules,
 * though, so re-mount on every hotbar render: mount() is idempotent.
 */
Hooks.on('renderHotbar', () => {
	if (game.ready) DeviceChrome.mount();
});

/* -------------------------------------------- */
/*  Diagnostics                                  */
/* -------------------------------------------- */

function debug() {
	const hotbar = document.getElementById('hotbar');
	const info = {
		device: currentDevice(),
		mounted: !!document.getElementById(EL.device),
		hotbarParent: hotbar?.parentElement?.id ?? null,
		power: DeviceChrome.power,
		deckSize: game.settings.get(MOD, S.deckSize),
		styles: STYLES.map((p) => !!document.querySelector(`link[href^="modules/${MOD}/${p}"]`)),
	};
	console.log(`${MOD} |`, info);
	return info;
}
