import { MOD, S, EL, KEYS, seqMs } from './constants.mjs';
import { registerSettings, currentDevice, currentChoice } from './settings.mjs';
import { DeviceChrome } from './device/chrome.mjs';
import { Projection } from './projection/projection.mjs';
import { getAdapter } from './adapters/index.mjs';
import { restyleControls, redrawControls } from './interface/controls.mjs';
import { applyFonts, onFontChange, reportMissingFonts, suggestFonts } from './interface/fonts.mjs';
import { watchPlacement } from './interface/placement.mjs';
import { Carousel } from './interface/carousel.mjs';
import { SceneBar } from './interface/scenes.mjs';
import { viewScenesOnClick } from './interface/scene-directory.mjs';
import { addVolumeCheck, onVolumeMessage } from './interface/volumes.mjs';
import { splitDevicePicker } from './interface/device-picker.mjs';
import { markMessage } from './interface/chat-modes.mjs';
import { PipBoy } from './interface/pipboy.mjs';
import { holdApTracker, adoptApTracker } from './interface/ap-tracker.mjs';
import { refreshObstacles } from './interface/obstacles.mjs';
import { applyHeadingColor, scheduleFitHeadings, watchHeadings } from './interface/headings.mjs';
import { applySheetTabs, dressSheet } from './interface/sheet-tabs.mjs';
import { applySheetMarks, markSheet } from './interface/sheet-marks.mjs';

/**
 * Scorpious187's HUD UI for 5e and PF2e/SF2e.
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
 * manifest afterward is never linked until the world is restarted. Link ours ourselves
 * if they are missing — it costs nothing when they are already there.
 */
const STYLES = [
	'styles/fonts.css',
	'styles/device.css',
	'styles/interface.css',
	'styles/carousel.css',
	'styles/scenes.css',
	'styles/projection.css',
	'styles/projection-frame.css',
	'styles/looks.css', 'styles/sheet-tabs.css', 'styles/sheet-marks.css',
];

/**
 * Whether a stylesheet is already on the page: linked, or, as Foundry 13 and 14 bring in a
 * module's styles, pulled in by an `@import` in one of its own sheets.
 */
function hasStyle(href) {
	if (document.querySelector(`link[href*="${href}"]`)) return true;
	for (const sheet of document.styleSheets) {
		let rules;
		try { rules = sheet.cssRules; } catch { continue; }   // another origin's sheet cannot be read
		for (const rule of rules) {
			if (rule instanceof CSSImportRule && rule.href?.includes(href)) return true;
		}
	}
	return false;
}

function ensureStyles() {
	for (const path of STYLES) {
		const href = `modules/${MOD}/${path}`;
		if (hasStyle(href)) continue;
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = `${href}?v=${game.modules.get(MOD)?.version ?? '0'}`;
		// what was measured before it arrived is out: the carousel may already be on the screen
		link.addEventListener('load', () => Carousel.schedule());
		document.head.append(link);
	}
}

/* -------------------------------------------- */
/*  Lifecycle                                    */
/* -------------------------------------------- */

Hooks.once('init', () => {
	registerSettings(() => {
		DeviceChrome.refresh();
		Projection.syncDevice();
		// the display face comes with the device
		scheduleFitHeadings();
	}, redrawControls, onFontChange, applyHeadingColor, () => Carousel.schedule(), () => {
		SceneBar.noteCombat();
		SceneBar.schedule();
	});
	applyFonts();
	applyHeadingColor();
	watchPlacement();
	viewScenesOnClick();

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
	applySheetTabs();
	applySheetMarks();
	game.socket?.on(`module.${MOD}`, (data) => {
		if (data?.type === 'give') getAdapter()?.onGiveRequest?.(data);
		else onVolumeMessage(data);
	});
	// by now Foundry has loaded the fonts added in its own settings, so they can be told apart
	reportMissingFonts();
	watchHeadings();
	Carousel.schedule();
	SceneBar.ready();
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
		unmount: () => { Projection.close(); DeviceChrome.unmount(); Carousel.remove(); },
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
	// Fallout 2d20: the switch brings up the Pip-Boy in place of a projection
	if (PipBoy.power(on, { sequence })) return;
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
	// switched back on before it was put away: it stays up
	setTimeout(() => DeviceChrome.power || Projection.close(), seqMs('off', currentChoice()));
});

/*
 * The GM's projection follows the token selected on the canvas. Selecting a token lets go of the
 * last one first, so the change is taken once the canvas has settled.
 */
let following = null;
Hooks.on('controlToken', () => {
	if (!game.user.isGM) return;
	clearTimeout(following);
	following = setTimeout(() => (PipBoy.handles() ? PipBoy.follow() : Projection.follow()), 0);
});

/* Fallout 2d20's AP tracker, wherever the system draws it, rides on the device beside the macro bar. */
Hooks.once('setup', () => adoptApTracker());
Hooks.on('renderAPTrackerV2', () => {
	if (holdApTracker()) DeviceChrome.fit();
});

/* The Pip-Boy closed from its own window: the device goes off with it. */
Hooks.on('closeApplicationV2', (app) => PipBoy.closed(app));

/* The projection shows live data, so it follows the actor. */
for (const hook of ['updateActor', 'createItem', 'updateItem', 'deleteItem', 'createActiveEffect', 'updateActiveEffect', 'deleteActiveEffect']) {
	Hooks.on(hook, (doc) => Projection.refreshFor(doc));
}

/*
 * The carousel follows the encounter, the tracker, and whatever changes a combatant's card: the
 * effects on it are items in some systems and effects in others.
 */
for (const hook of ['createCombat', 'updateCombat', 'deleteCombat', 'createCombatant', 'updateCombatant', 'deleteCombatant',
	'renderCombatTracker', 'canvasReady', 'updateActor', 'updateToken', 'createActiveEffect', 'updateActiveEffect', 'deleteActiveEffect',
	'createItem', 'updateItem', 'deleteItem', 'collapseSidebar', 'renderSidebar', 'renderSceneNavigation', 'targetToken']) {
	Hooks.on(hook, () => Carousel.schedule());
}
addEventListener('resize', () => Carousel.schedule());

/*
 * The scene bar follows the scenes, their folders, who is looking at what, and anything that
 * can sit at the top of the screen beside it, such as Calendaria's HUD.
 */
for (const hook of ['createScene', 'updateScene', 'deleteScene', 'createFolder', 'updateFolder', 'deleteFolder',
	'updateUser', 'userConnected', 'updatePlaylistSound', 'collapseSidebar', 'renderSidebar', 'renderApplicationV2', 'closeApplicationV2']) {
	Hooks.on(hook, () => SceneBar.schedule());
}
Hooks.on('canvasReady', () => SceneBar.noteView());
// an application opening or closing may be Calendaria's HUD, which the bar and the carousel keep clear of
for (const hook of ['renderApplicationV2', 'closeApplicationV2']) Hooks.on(hook, () => refreshObstacles());
for (const hook of ['createCombat', 'updateCombat', 'deleteCombat', 'canvasReady']) {
	Hooks.on(hook, () => SceneBar.noteCombat());
}
addEventListener('resize', () => SceneBar.schedule());

/* The carousel shares the top of the screen with it, and keeps clear. */
Hooks.on('sfhScenes', () => Carousel.schedule());

/* A token hovered on the map lights its card, as it does its row in the tracker. */
Hooks.on('hoverToken', (token, hovered) => {
	const id = token.combatant?.id;
	if (id) Carousel.element?.querySelector(`[data-combatant-id="${CSS.escape(id)}"]`)?.classList.toggle('hover', hovered);
});

/* It takes room at the top of the screen, which the projection fits around. */
Hooks.on('sfhCarousel', () => Projection.scheduleFit());

/* The strip over the main panel follows the chat log. */
Hooks.on('createChatMessage', (message) => Projection.noteRoll(message));
Hooks.on('deleteChatMessage', (message) => Projection.forgetRoll(message));

/* A private message says so: a private GM roll, a blind roll, a self roll, or a whisper and between whom. */
Hooks.on('renderChatMessageHTML', (message, html) => markMessage(message, html));

/* The scene controls take the devices' icons each time Foundry prepares them. */
Hooks.on('getSceneControlButtons', restyleControls);

/* Foundry can draw the sidebar afresh, which leaves the watcher on the old element. */
Hooks.on('renderSidebar', () => watchHeadings());

/* The GM can see everyone's volume from the Playlists tab, popped out or not. */
Hooks.on('renderPlaylistDirectory', (app, html) => addVolumeCheck(html));

/* The font settings are typed; the settings window suggests the fonts there are. */
Hooks.on('renderSettingsConfig', suggestFonts);

/* The devices and looks are chosen by category first, then look. */
Hooks.on('renderSettingsConfig', splitDevicePicker);

// D&D 5e's sheet tabs as a labeled row: the system redraws them with each sheet, and each part of one
Hooks.on('renderActorSheetV2', (app) => dressSheet(app.element));

// D&D 5e's sheets marked as the projection is: an item's rarity in its name's color, a character's
// unprepared spells grayed. The sheet's rows are the system's, redrawn with it.
Hooks.on('renderActorSheetV2', (app) => markSheet(app));
Hooks.on('sfhMarks', () => Projection.render());

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
		suspended: DeviceChrome.suspended,
		projectionOpen: Projection.isOpen,
		character: Projection.actor()?.name ?? null,
		deckSize: game.settings.get(MOD, S.deckSize),
		projScale: game.settings.get(MOD, S.projScale),
		journalScale: game.settings.get(MOD, S.journalScale),
		fit: Projection.lastFit ?? null,
		styles: STYLES.map((p) => !!document.querySelector(`link[href^="modules/${MOD}/${p}"]`)),
	};
	console.log(`${MOD} |`, info);
	return info;
}
