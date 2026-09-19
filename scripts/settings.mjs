import { MOD, S, SIZES } from './constants.mjs';
import { themeChoices, DEFAULT_THEME } from './themes.mjs';

/** Everything the player or GM can change. Client settings are per-player by design. */
export function registerSettings() {
	const reRender = () => refreshOpenHuds();

	game.settings.register(MOD, S.defaultTheme, {
		name: 'SFH.Settings.DefaultTheme', hint: 'SFH.Settings.DefaultThemeHint',
		scope: 'world', config: true, type: String, default: DEFAULT_THEME,
		choices: themeChoices(), onChange: reRender,
	});

	game.settings.register(MOD, S.meExtras, {
		name: 'SFH.Settings.MeExtras', hint: 'SFH.Settings.MeExtrasHint',
		scope: 'world', config: true, type: String, default: 'auto',
		choices: { auto: 'SFH.Settings.MeExtrasAuto', off: 'SFH.Settings.MeExtrasOff' }, onChange: reRender,
	});

	game.settings.register(MOD, S.chrome, {
		name: 'SFH.Settings.Chrome', hint: 'SFH.Settings.ChromeHint',
		scope: 'client', config: true, type: String, default: 'full',
		choices: {
			full: 'SFH.Settings.ChromeFull',
			bare: 'SFH.Settings.ChromeBare',
			clean: 'SFH.Settings.ChromeClean',
		},
		onChange: reRender,
	});

	game.settings.register(MOD, S.scanlines, {
		name: 'SFH.Settings.Scanlines', scope: 'client', config: true, type: Boolean, default: true, onChange: reRender,
	});

	game.settings.register(MOD, S.readout, {
		name: 'SFH.Settings.Readout', hint: 'SFH.Settings.ReadoutHint',
		scope: 'client', config: true, type: Boolean, default: true, onChange: reRender,
	});

	game.settings.register(MOD, S.sequences, {
		name: 'SFH.Settings.Sequences', hint: 'SFH.Settings.SequencesHint',
		scope: 'client', config: true, type: Boolean, default: true,
	});

	game.settings.register(MOD, S.closeSequence, {
		name: 'SFH.Settings.CloseSequence', hint: 'SFH.Settings.CloseSequenceHint',
		scope: 'client', config: true, type: Boolean, default: false,
	});

	game.settings.register(MOD, S.scale, {
		name: 'SFH.Settings.Scale', hint: 'SFH.Settings.ScaleHint',
		scope: 'client', config: true, type: Number, default: 1,
		range: { min: 0.7, max: 1.3, step: 0.05 }, onChange: reRender,
	});

	game.settings.register(MOD, S.compactAt, {
		name: 'SFH.Settings.CompactAt', hint: 'SFH.Settings.CompactAtHint',
		scope: 'client', config: true, type: Number, default: SIZES.compact,
		range: { min: 820, max: 1400, step: 20 }, onChange: reRender,
	});
}

export const setting = (key) => game.settings.get(MOD, key);

/** Re-render every open HUD sheet, e.g. after a setting changes. */
export function refreshOpenHuds() {
	for (const app of Object.values(ui.windows ?? {})) {
		if (app?.constructor?.SFH_HUD) app.render(false);
	}
	for (const app of foundry.applications?.instances?.values?.() ?? []) {
		if (app?.constructor?.SFH_HUD) app.render(false);
	}
}
