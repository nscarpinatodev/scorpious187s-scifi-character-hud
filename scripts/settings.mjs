import { MOD, S, DEVICES, DEFAULT_DEVICE } from './constants.mjs';

/**
 * Settings.
 *
 * The device is a per-user choice: two players at the same table can wear different
 * hardware. The world setting only decides what a user gets before they have chosen.
 */
export function registerSettings(onDeviceChange, onControlIconsChange) {
	const deviceChoices = Object.fromEntries(Object.values(DEVICES).map((d) => [d.id, d.label]));

	// Both device settings repaint immediately: a player following the world default has to
	// see the GM's change without reloading.
	game.settings.register(MOD, S.worldDevice, {
		name: 'SFH.Settings.WorldDevice',
		hint: 'SFH.Settings.WorldDeviceHint',
		scope: 'world',
		config: true,
		type: String,
		choices: deviceChoices,
		default: DEFAULT_DEVICE,
		onChange: () => onDeviceChange?.(),
	});

	game.settings.register(MOD, S.device, {
		name: 'SFH.Settings.Device',
		hint: 'SFH.Settings.DeviceHint',
		scope: 'client',
		config: true,
		type: String,
		choices: { '': 'SFH.Settings.DeviceWorld', ...deviceChoices },
		default: '',
		onChange: () => onDeviceChange?.(),
	});

	game.settings.register(MOD, S.sequences, {
		name: 'SFH.Settings.Sequences',
		hint: 'SFH.Settings.SequencesHint',
		scope: 'client',
		config: true,
		type: Boolean,
		default: true,
	});

	game.settings.register(MOD, S.deckSize, {
		name: 'SFH.Settings.DeckSize',
		hint: 'SFH.Settings.DeckSizeHint',
		scope: 'client',
		config: true,
		type: Number,
		range: { min: 28, max: 60, step: 2 },
		default: 40,
		onChange: () => onDeviceChange?.(),
	});

	game.settings.register(MOD, S.grid, {
		name: 'SFH.Settings.Grid',
		hint: 'SFH.Settings.GridHint',
		scope: 'client',
		config: true,
		type: String,
		choices: { panels: 'SFH.Settings.GridPanels', full: 'SFH.Settings.GridFull', off: 'SFH.Settings.GridOff' },
		default: 'panels',
		onChange: (v) => document.body.setAttribute('data-sfh-grid', v),
	});

	// The omni-tool's projection always matches its arm, so this sizes only the others.
	game.settings.register(MOD, S.projScale, {
		name: 'SFH.Settings.ProjScale',
		hint: 'SFH.Settings.ProjScaleHint',
		scope: 'client',
		config: true,
		type: Number,
		range: { min: 35, max: 100, step: 5 },
		default: 55,
		onChange: () => onDeviceChange?.(),
	});

	game.settings.register(MOD, S.controlIcons, {
		name: 'SFH.Settings.ControlIcons',
		hint: 'SFH.Settings.ControlIconsHint',
		scope: 'client',
		config: true,
		type: Boolean,
		default: true,
		onChange: () => onControlIconsChange?.(),
	});
}

/** The device this user wears, falling back to the world's choice. */
export function currentDevice() {
	const mine = game.settings.get(MOD, S.device);
	const id = mine || game.settings.get(MOD, S.worldDevice);
	return DEVICES[id] ? id : DEFAULT_DEVICE;
}

export function setting(key) {
	return game.settings.get(MOD, key);
}
