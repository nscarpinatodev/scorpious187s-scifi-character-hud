import { MOD, S, DEVICES, DEFAULT_DEVICE } from './constants.mjs';

/**
 * Settings.
 *
 * The device is a per-user choice: two players at the same table can wear different
 * hardware. The world setting only decides what a user gets before they have chosen.
 */
export function registerSettings(onDeviceChange, onControlIconsChange, onFontChange, onHeadingColorChange, onCarouselChange) {
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

	// The omni-tool's and TRON's projections always match their plates, so this sizes only the others.
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

	game.settings.register(MOD, S.chatCards, {
		name: 'SFH.Settings.ChatCards',
		hint: 'SFH.Settings.ChatCardsHint',
		scope: 'client',
		config: true,
		type: Boolean,
		default: true,
		onChange: (v) => { document.body.dataset.sfhChat = v ? 'on' : 'off'; },
	});

	game.settings.register(MOD, S.carousel, {
		name: 'SFH.Settings.Carousel',
		hint: 'SFH.Settings.CarouselHint',
		scope: 'client',
		config: true,
		type: Boolean,
		default: false,
		onChange: () => onCarouselChange?.(),
	});

	game.settings.register(MOD, S.carouselLayout, {
		name: 'SFH.Settings.CarouselLayout',
		hint: 'SFH.Settings.CarouselLayoutHint',
		scope: 'client',
		config: true,
		type: String,
		choices: { left: 'SFH.Settings.CarouselLayoutLeft', center: 'SFH.Settings.CarouselLayoutCenter' },
		default: 'left',
		onChange: () => onCarouselChange?.(),
	});

	game.settings.register(MOD, S.carouselScale, {
		name: 'SFH.Settings.CarouselScale',
		hint: 'SFH.Settings.CarouselScaleHint',
		scope: 'client',
		config: true,
		type: Number,
		range: { min: 50, max: 200, step: 10 },
		default: 100,
		onChange: () => onCarouselChange?.(),
	});

	// empty keeps the device's main color, whichever device that is
	game.settings.register(MOD, S.headingColor, {
		name: 'SFH.Settings.HeadingColor',
		hint: 'SFH.Settings.HeadingColorHint',
		scope: 'client',
		config: true,
		type: new foundry.data.fields.ColorField({ nullable: true, initial: null }),
		onChange: () => onHeadingColorChange?.(),
	});

	// Typed rather than picked, so a font installed only on this computer can be used.
	const fonts = [
		[S.fontDisplay, 'SFH.Settings.FontDisplay', 'SFH.Settings.FontDisplayHint'],
		[S.fontBody, 'SFH.Settings.FontBody', 'SFH.Settings.FontBodyHint'],
		[S.fontMono, 'SFH.Settings.FontMono', 'SFH.Settings.FontMonoHint'],
	];
	for (const [key, name, hint] of fonts) {
		game.settings.register(MOD, key, {
			name,
			hint,
			scope: 'client',
			config: true,
			type: String,
			default: '',
			onChange: () => onFontChange?.(key),
		});
	}

	game.settings.register(MOD, S.googleFonts, {
		name: 'SFH.Settings.GoogleFonts',
		hint: 'SFH.Settings.GoogleFontsHint',
		scope: 'client',
		config: true,
		type: Boolean,
		default: true,
		onChange: () => onFontChange?.(),
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
