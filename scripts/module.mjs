import { MOD, S } from './constants.mjs';
import { registerSettings, setting, refreshOpenHuds } from './settings.mjs';
import { findBaseSheet, makePf2eHudSheet } from './adapters/pf2e-family.mjs';
import { findBase5eSheet, makeDnd5eHudSheet } from './adapters/dnd5e.mjs';
import { isHidden, setHidden, hideKeyLabel, themeFor } from './shell.mjs';
import { openThemePicker } from './ui/theme-picker.mjs';

/** Each supported system, with how to find its sheet class and how to subclass it. */
const ADAPTERS = {
	pf2e: { find: findBaseSheet, make: makePf2eHudSheet },
	sf2e: { find: findBaseSheet, make: makePf2eHudSheet },
	dnd5e: { find: findBase5eSheet, make: makeDnd5eHudSheet },
};

Hooks.once('init', () => {
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
Hooks.once('setup', () => {
	const adapter = ADAPTERS[game.system.id];
	if (!adapter) {
		console.log(`${MOD} | ${game.system.id} is not supported; the HUD stays out of the sheet picker.`);
		return;
	}

	const Base = adapter.find();
	if (!Base) {
		const seen = Object.entries(CONFIG.Actor.sheetClasses?.character ?? {})
			.map(([id, e]) => `${id} → ${e.cls?.name}`);
		console.error(`${MOD} | could not find ${game.system.id}'s character sheet class; not registering. Sheets seen:`, seen);
		return;
	}

	// One more choice in Foundry's sheet picker. Never a default: nobody is switched
	// over without choosing it.
	foundry.applications.apps.DocumentSheetConfig.registerSheet(
		Actor, MOD, adapter.make(Base),
		{ types: ['character'], label: 'SFH.SheetLabel', makeDefault: false },
	);
	console.log(`${MOD} | registered the HUD sheet for ${game.system.id}, over ${Base.name}.`);
});

Hooks.once('ready', () => {
	const mod = game.modules.get(MOD);
	if (mod) {
		mod.api = {
			hide: (value = true) => setHidden(value),
			toggleHidden: () => setHidden(!isHidden()),
			themeFor,
			openThemePicker,
			refresh: refreshOpenHuds,
			/** Console diagnostics: `game.modules.get('scorpious187s-scifi-character-hud').api.debug()` */
			debug: () => {
				const sheets = Object.entries(CONFIG.Actor.sheetClasses?.character ?? {})
					.map(([id, e]) => ({ id, cls: e.cls?.name, default: !!e.default }));
				const ours = sheets.find((s) => s.id.startsWith(`${MOD}.`));
				console.log(`${MOD} | system=${game.system.id} registered=${!!ours}`, { sheets, hudSheetsOpen: document.querySelectorAll('.sfh-app').length });
				return { registered: !!ours, sheets };
			},
		};
	}

	// A sheet-config change swaps the sheet class, so drop our per-app state with it.
	Hooks.on('closeDocumentSheetConfig', () => refreshOpenHuds());

	if (setting(S.scale) !== 1) document.documentElement.style.setProperty('--sfh-scale', String(setting(S.scale)));
});
