import { MOD, S, EL, SEQ, KEYS } from './constants.mjs';
import { registerSettings, currentDevice } from './settings.mjs';
import { DeviceChrome } from './device/chrome.mjs';
import { Projection } from './projection/projection.mjs';
import { restyleControls, redrawControls } from './interface/controls.mjs';

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
const STYLES = [
	'styles/device.css',
	'styles/interface.css',
	'styles/projection.css',
	'styles/projection-frame.css',
];

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

/**
 * The mock-up's typefaces. Without them every device falls back to Arial Narrow and the
 * system monospace, which is most of what makes the devices look like themselves. Linked
 * at init so they are loading before anything is drawn in them.
 */
const FONTS = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700'
	+ '&family=Share+Tech+Mono&family=Audiowide&family=Chakra+Petch:wght@400;500;600;700'
	+ '&family=VT323&family=Oxanium:wght@400;500;600;700;800&display=swap';

function ensureFonts() {
	if (document.querySelector(`link[href="${FONTS}"]`)) return;
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = FONTS;
	document.head.append(link);
}

/* -------------------------------------------- */
/*  Lifecycle                                    */
/* -------------------------------------------- */

Hooks.once('init', () => {
	ensureFonts();
	registerSettings(() => {
		DeviceChrome.refresh();
		Projection.syncDevice();
	}, redrawControls);

	// rebindable in Configure Controls
	game.keybindings.register(MOD, KEYS.hide, {
		name: 'SFH.Keybind.Hide',
		hint: 'SFH.Keybind.HideHint',
		editable: [{ key: 'KeyH', modifiers: ['Alt'] }],
		onDown: () => {
			DeviceChrome.toggleHidden();
			return true;
		},
	});
});

Hooks.once('ready', () => {
	ensureStyles();
	if (!DeviceChrome.mount()) {
		console.warn(`${MOD} | the interface has no #ui-bottom or #hotbar to mount on; the device is not shown`);
	}

	game.modules.get(MOD).api = {
		chrome: DeviceChrome,
		projection: Projection,
		setPower: (on) => DeviceChrome.setPower(on),
		toggle: () => DeviceChrome.toggle(),
		hide: (on = true) => DeviceChrome.setHidden(on),
		toggleHidden: () => DeviceChrome.toggleHidden(),
		refresh: () => DeviceChrome.refresh(),
		unmount: () => { Projection.close(); DeviceChrome.unmount(); },
		debug,
	};
});

/* -------------------------------------------- */
/*  The projection                               */
/* -------------------------------------------- */

/**
 * The switch only changes the power state and says so. Raising and lowering the projection
 * happens here, so the sequence starts once there is something on screen to animate.
 */
Hooks.on('sfhPower', async (on, { sequence } = {}) => {
	if (on) {
		const raised = await Projection.open();
		if (!raised) return DeviceChrome.setPower(false, { silent: true });
		if (sequence) {
			DeviceChrome.playSequence('on');
			Projection.playSequence('on');
		}
		return;
	}
	if (!sequence) return Projection.close();
	DeviceChrome.playSequence('off');
	Projection.playSequence('off');
	setTimeout(() => Projection.close(), SEQ.off);
});

/* The projection shows live data, so it follows the actor. */
for (const hook of ['updateActor', 'createItem', 'updateItem', 'deleteItem', 'createActiveEffect', 'updateActiveEffect', 'deleteActiveEffect']) {
	Hooks.on(hook, (doc) => Projection.refreshFor(doc));
}

/* The scene controls take the devices' icons each time Foundry prepares them. */
Hooks.on('getSceneControlButtons', restyleControls);

/* The free area changes whenever Foundry's own furniture does. */
for (const hook of ['collapseSidebar', 'renderSidebar', 'renderSceneNavigation', 'renderSceneControls', 'renderHotbar']) {
	Hooks.on(hook, () => Projection.scheduleFit());
}
addEventListener('resize', () => Projection.scheduleFit());

/* A hidden projection measures as nothing, so it is fitted again when it comes back. */
Hooks.on('sfhHidden', (hidden) => {
	if (!hidden) Projection.scheduleFit();
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
		hidden: DeviceChrome.hidden,
		projectionOpen: Projection.isOpen,
		character: Projection.actor()?.name ?? null,
		deckSize: game.settings.get(MOD, S.deckSize),
		projScale: game.settings.get(MOD, S.projScale),
		fit: Projection.lastFit ?? null,
		styles: STYLES.map((p) => !!document.querySelector(`link[href^="modules/${MOD}/${p}"]`)),
	};
	console.log(`${MOD} |`, info);
	return info;
}
