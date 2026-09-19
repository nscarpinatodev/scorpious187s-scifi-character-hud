import { MOD, S } from './constants.mjs';
import { registerSettings, setting, refreshOpenHuds } from './settings.mjs';
import { findBaseSheet, makePf2eHudSheet } from './adapters/pf2e-family.mjs';
import { makeHudSheet } from './hud-app.mjs';
import * as dnd5eSystem from './systems/dnd5e.mjs';
import { isHidden, setHidden, hideKeyLabel, themeFor } from './shell.mjs';
import { openThemePicker } from './ui/theme-picker.mjs';

/*
 * Two kinds of support, for now.
 *
 * `standalone` is the HUD proper: our own sheet, our own markup, built from a system
 * adapter that reads the actor and calls the system's API for everything that rolls or
 * changes. `skin` is the older approach, which re-arranges the system's own sheet; PF2e
 * and SF2e still use it until they get their adapters.
 */
const SYSTEMS = {
	dnd5e: { kind: 'standalone', system: dnd5eSystem },
	pf2e: { kind: 'skin', find: findBaseSheet, make: makePf2eHudSheet },
	sf2e: { kind: 'skin', find: findBaseSheet, make: makePf2eHudSheet },
};

/*
 * Stylesheets, self-healed.
 *
 * Foundry reads module.json when the world launches, so a stylesheet added to the
 * manifest afterwards is not linked until the world is relaunched — the sheet then
 * renders as unstyled markup, which looks like a broken module rather than a stale
 * manifest. Checking and adding the link costs nothing and removes that failure mode.
 */
const STYLES = [
	'styles/hud-core.css',
	'styles/themes.css',
	'styles/hud-sheet.css',
	'styles/pf2e-overrides.css',
	'styles/dnd5e-overrides.css',
];

function ensureStyles() {
	for (const path of STYLES) {
		const href = `modules/${MOD}/${path}`;
		if (document.querySelector(`link[rel="stylesheet"][href^="${href}"]`)) continue;
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = href;
		document.head.append(link);
		console.warn(`${MOD} | ${path} was not linked by the manifest (relaunch the world to fix properly); added it now.`);
	}
}

Hooks.once('init', () => {
	ensureStyles();
	registerSettings();

	game.keybindings.register(MOD, 'hideHud', {
		name: 'SFH.Keybind.Hide',
		hint: 'SFH.Keybind.HideHint',
		editable: [{ key: 'KeyH', modifiers: ['Alt'] }],
		onDown: () => {
			// Nothing to hide is worth saying out loud: it is the difference between "the
			// key is broken" and "this sheet is not a HUD".
			if (!document.querySelector('.sfh-app')) {
				ui.notifications.warn(game.i18n.localize('SFH.NoHud'));
				return true;
			}
			setHidden(!isHidden());
			if (isHidden()) ui.notifications.info(game.i18n.format('SFH.HiddenHint', { key: hideKeyLabel() }));
			return true;
		},
		restricted: false,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});

});

/*
 * Registration happens on `setup`, not `init`.
 *
 * Every system registers its own sheets inside its `init` hook, and module scripts load
 * before the system's, so a module that registers on `init` looks for a sheet class that
 * does not exist yet. `setup` runs after every `init` callback has completed.
 */
export function registerHudSheet() {
	if (isRegistered()) return true;

	const entry = SYSTEMS[game.system.id];
	if (!entry) {
		console.log(`${MOD} | ${game.system.id} is not supported; the HUD stays out of the sheet picker.`);
		return false;
	}

	if (entry.kind === 'standalone') {
		const cls = makeHudSheet(entry.system);
		foundry.applications.apps.DocumentSheetConfig.registerSheet(
			Actor, MOD, cls,
			{ types: ['character'], label: game.i18n.localize('SFH.SheetLabel'), makeDefault: false },
		);
		if (!isRegistered()) {
			console.error(`${MOD} | the HUD sheet did not register for ${game.system.id}.`);
			return false;
		}
		cls.hookUp();
		console.log(`${MOD} | registered the standalone HUD sheet for ${game.system.id}.`);
		return true;
	}

	const seen = Object.entries(CONFIG.Actor.sheetClasses?.character ?? {})
		.map(([id, e]) => `${id} → ${e.cls?.name}`);
	const Base = entry.find();
	if (!Base) {
		// Expected during startup: Foundry's initializeSheets() empties
		// CONFIG.Actor.sheetClasses and only then applies the registrations queued during
		// init, and that happens after the setup hook. So the registry is genuinely empty
		// here, and `ready` is where the real attempt happens.
		if (!game.ready) console.log(`${MOD} | sheet registry not populated yet; deferring registration to ready.`);
		else console.error(`${MOD} | could not find ${game.system.id}'s character sheet class. Sheets seen:`, seen);
		return false;
	}

	// One more choice in Foundry's sheet picker. Never a default: nobody is switched
	// over without choosing it.
	try {
		foundry.applications.apps.DocumentSheetConfig.registerSheet(
			Actor, MOD, entry.make(Base),
			{ types: ['character'], label: game.i18n.localize('SFH.SheetLabel'), makeDefault: false },
		);
	} catch (err) {
		console.error(`${MOD} | registerSheet threw for ${game.system.id} over ${Base.name}:`, err);
		return false;
	}

	// Registering can fail quietly, so confirm the entry actually landed.
	if (!isRegistered()) {
		console.error(`${MOD} | registerSheet ran without error but no entry appeared. Sheets before:`, seen,
			'after:', Object.keys(CONFIG.Actor.sheetClasses?.character ?? {}));
		return false;
	}

	console.log(`${MOD} | registered the HUD sheet for ${game.system.id}, over ${Base.name}.`);
	return true;
}

function isRegistered() {
	return Object.keys(CONFIG.Actor.sheetClasses?.character ?? {}).some((id) => id.startsWith(`${MOD}.`));
}

/*
 * Registration happens on `setup`, not `init`.
 *
 * Every system registers its own sheets inside its `init` hook, and module scripts load
 * before the system's, so a module that registers on `init` looks for a sheet class that
 * does not exist yet. `setup` runs after every `init` callback has completed. `ready` is a
 * second chance for a system that registers later still.
 */
Hooks.once('setup', () => registerHudSheet());

Hooks.once('ready', () => {
	ensureStyles();
	registerHudSheet();

	const mod = game.modules.get(MOD);
	if (mod) {
		mod.api = {
			hide: (value = true) => setHidden(value),
			toggleHidden: () => setHidden(!isHidden()),
			themeFor,
			openThemePicker,
			refresh: refreshOpenHuds,
			register: registerHudSheet,
			/** Console diagnostics: `game.modules.get('scorpious187s-scifi-character-hud').api.debug()` */
			debug: () => {
				const sheets = Object.entries(CONFIG.Actor.sheetClasses?.character ?? {})
					.map(([id, e]) => ({ id, cls: e.cls?.name, default: !!e.default }));
				const ours = sheets.find((s) => s.id.startsWith(`${MOD}.`));
				const styles = STYLES.map((p) => ({
					file: p,
					linked: !!document.querySelector(`link[rel="stylesheet"][href^="modules/${MOD}/${p}"]`),
				}));
				const open = [...document.querySelectorAll('.sfh-app')].map((el) => el.className);
				console.log(`${MOD} | system=${game.system.id} registered=${!!ours}`, { sheets, styles, open });
				return { registered: !!ours, sheets, styles, open };
			},
		};
	}

	// A sheet-config change swaps the sheet class, so drop our per-app state with it.
	Hooks.on('closeDocumentSheetConfig', () => refreshOpenHuds());

	if (setting(S.scale) !== 1) document.documentElement.style.setProperty('--sfh-scale', String(setting(S.scale)));
});
