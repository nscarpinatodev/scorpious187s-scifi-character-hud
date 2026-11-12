import { MOD, S, DEVICES, DEFAULT_DEVICE } from './constants.mjs';
import { applySheetTabs } from './interface/sheet-tabs.mjs';

/**
 * Settings.
 *
 * The device is a per-user choice: two players at the same table can wear different
 * hardware. The world setting only decides what a user gets before they have chosen.
 */
export function registerSettings(onDeviceChange, onControlIconsChange, onFontChange, onHeadingColorChange, onCarouselChange, onScenesChange) {
	// a look made for one system is offered nowhere else; in a world of that system it is all there is
	const deviceChoices = Object.fromEntries(Object.values(DEVICES).filter(offered).map((d) => [d.id, d.label]));
	const choosable = !lockedDevice();

	// Both device settings repaint immediately: a player following the world default has to
	// see the GM's change without reloading.
	game.settings.register(MOD, S.worldDevice, {
		name: 'SFH.Settings.WorldDevice',
		hint: 'SFH.Settings.WorldDeviceHint',
		scope: 'world',
		config: choosable,
		type: String,
		choices: deviceChoices,
		default: DEFAULT_DEVICE,
		onChange: (world) => {
			onDeviceChange?.();
			// a device of your own wins over the world's, so changing the world's shows you nothing: say why
			const mine = game.settings.get(MOD, S.device);
			if (game.user.isGM && mine && mine !== world && DEVICES[mine]) {
				ui.notifications.info(game.i18n.format('SFH.Settings.DeviceOverridden', {
					mine: game.i18n.localize(DEVICES[mine].label),
					world: game.i18n.localize(DEVICES[world]?.label ?? world),
				}));
			}
		},
	});

	game.settings.register(MOD, S.device, {
		name: 'SFH.Settings.Device',
		hint: 'SFH.Settings.DeviceHint',
		scope: 'client',
		config: choosable,
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

	// The Journal's book is not tied to a plate either; it opens as large as the room allows, which
	// on a big screen is very large, so how much of that room it takes is the player's to choose.
	game.settings.register(MOD, S.journalScale, {
		name: 'SFH.Settings.JournalScale',
		hint: 'SFH.Settings.JournalScaleHint',
		scope: 'client',
		config: true,
		type: Number,
		range: { min: 40, max: 100, step: 5 },
		default: 100,
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

	game.settings.register(MOD, S.journalDark, {
		name: 'SFH.Settings.JournalDark',
		hint: 'SFH.Settings.JournalDarkHint',
		scope: 'client',
		config: true,
		type: Boolean,
		default: false,
		onChange: (v) => { document.body.dataset.sfhDark = v ? 'on' : 'off'; },
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

	game.settings.register(MOD, S.sheetTabs, {
		name: 'SFH.Settings.SheetTabs',
		hint: 'SFH.Settings.SheetTabsHint',
		scope: 'client',
		// the sheet it changes is D&D 5e's
		config: game.system?.id === 'dnd5e',
		type: Boolean,
		default: false,
		onChange: () => applySheetTabs(),
	});

	game.settings.register(MOD, S.calendaria, {
		name: 'SFH.Settings.Calendaria',
		hint: 'SFH.Settings.CalendariaHint',
		scope: 'client',
		// only worth offering where Calendaria is switched on
		config: !!game.modules.get('calendaria')?.active,
		type: Boolean,
		default: true,
		onChange: (v) => { document.body.dataset.sfhCalendaria = v ? 'on' : 'off'; },
	});

	game.settings.register(MOD, S.sceneBar, {
		name: 'SFH.Settings.SceneBar',
		hint: 'SFH.Settings.SceneBarHint',
		scope: 'client',
		config: true,
		type: Boolean,
		default: true,
		onChange: () => onScenesChange?.(),
	});

	game.settings.register(MOD, S.sceneBarStyle, {
		name: 'SFH.Settings.SceneBarStyle',
		hint: 'SFH.Settings.SceneBarStyleHint',
		scope: 'client',
		config: true,
		type: String,
		choices: { bar: 'SFH.Settings.SceneBarStyleBar', button: 'SFH.Settings.SceneBarStyleButton' },
		default: 'bar',
		onChange: () => onScenesChange?.(),
	});

	game.settings.register(MOD, S.sceneBarStartCollapsed, {
		name: 'SFH.Settings.SceneBarStartCollapsed',
		hint: 'SFH.Settings.SceneBarStartCollapsedHint',
		scope: 'client',
		config: true,
		type: Boolean,
		default: false,
	});

	game.settings.register(MOD, S.sceneBarCombat, {
		name: 'SFH.Settings.SceneBarCombat',
		hint: 'SFH.Settings.SceneBarCombatHint',
		scope: 'client',
		config: true,
		type: Boolean,
		default: false,
		onChange: () => onScenesChange?.(),
	});

	game.settings.register(MOD, S.sceneBarHover, {
		name: 'SFH.Settings.SceneBarHover',
		hint: 'SFH.Settings.SceneBarHoverHint',
		scope: 'client',
		config: true,
		type: Boolean,
		default: true,
	});

	// what a click on a scene in the sidebar's Scenes tab does; Shift+click does the other
	game.settings.register(MOD, S.sceneClick, {
		name: 'SFH.Settings.SceneClick',
		hint: 'SFH.Settings.SceneClickHint',
		scope: 'client',
		config: true,
		type: String,
		choices: { view: 'SFH.Settings.SceneClickView', configure: 'SFH.Settings.SceneClickConfigure' },
		default: 'view',
	});

	// whether it is collapsed now, kept between sessions
	game.settings.register(MOD, S.sceneBarCollapsed, {
		scope: 'client',
		config: false,
		type: Boolean,
		default: false,
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

/** Whether a device or look can be worn in this world: one made for a system only in that system. */
function offered(device) {
	return !device.system || device.system === game.system?.id;
}

/** The look made for this world's system, which everyone wears there, or null. */
export function lockedDevice() {
	return Object.values(DEVICES).find((d) => d.system && d.system === game.system?.id)?.id ?? null;
}

/** The device or look this user chose, falling back to the world's choice. */
function chosenDevice() {
	const locked = lockedDevice();
	if (locked) return locked;
	const mine = game.settings.get(MOD, S.device);
	const id = mine || game.settings.get(MOD, S.worldDevice);
	return DEVICES[id] && offered(DEVICES[id]) ? id : DEFAULT_DEVICE;
}

/**
 * The device this user wears: for a look, the device it dresses, which decides the layout, the
 * board and the sequence.
 */
export function currentDevice() {
	const id = chosenDevice();
	return DEVICES[id].base ?? id;
}

/** What this user chose: a look, or a device. Its sequence is the one that plays (seqMs). */
export function currentChoice() {
	return chosenDevice();
}

/** The look this user chose over their device, or null for the device as it is. */
export function currentLook() {
	const id = chosenDevice();
	return DEVICES[id].base ? id : null;
}

export function setting(key) {
	return game.settings.get(MOD, key);
}
