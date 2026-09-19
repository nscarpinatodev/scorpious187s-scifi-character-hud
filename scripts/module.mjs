import { MOD, S } from './constants.mjs';
import { registerSettings, setting, refreshOpenHuds } from './settings.mjs';
import { findBaseSheet, makePf2eHudSheet } from './adapters/pf2e-family.mjs';
import { isHidden, setHidden, hideKeyLabel, themeFor } from './shell.mjs';
import { openThemePicker } from './ui/theme-picker.mjs';

/** Systems this release can skin. D&D 5e lands in the next phase. */
const SUPPORTED = ['pf2e', 'sf2e'];

Hooks.once('init', () => {
	registerSettings();

	game.keybindings.register(MOD, 'hideHud', {
		name: 'SFH.Keybind.Hide',
		hint: 'SFH.Keybind.HideHint',
		editable: [{ key: 'KeyH', modifiers: ['Alt'] }],
		onDown: () => {
			setHidden(!isHidden());
			if (isHidden()) ui.notifications.info(game.i18n.format('SFH.HiddenHint', { key: hideKeyLabel() }));
			return true;
		},
		restricted: false,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});

	if (!SUPPORTED.includes(game.system.id)) {
		console.log(`${MOD} | ${game.system.id} is not supported yet; the HUD stays out of the sheet picker.`);
		return;
	}

	const Base = findBaseSheet();
	if (!Base) {
		console.error(`${MOD} | could not find the system's character sheet class; not registering.`);
		return;
	}

	// One more choice in Foundry's sheet picker. Never a default: nobody is switched
	// over without choosing it.
	foundry.applications.apps.DocumentSheetConfig.registerSheet(
		Actor, MOD, makePf2eHudSheet(Base),
		{ types: ['character'], label: 'SFH.SheetLabel', makeDefault: false },
	);
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
		};
	}

	// A sheet-config change swaps the sheet class, so drop our per-app state with it.
	Hooks.on('closeDocumentSheetConfig', () => refreshOpenHuds());

	if (setting(S.scale) !== 1) document.documentElement.style.setProperty('--sfh-scale', String(setting(S.scale)));
});
