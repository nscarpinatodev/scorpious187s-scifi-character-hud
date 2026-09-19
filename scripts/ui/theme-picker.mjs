import { MOD, FLAG_THEME } from '../constants.mjs';
import { THEMES } from '../themes.mjs';

/**
 * Per-character theme picker, opened from the HUD's palette button.
 *
 * The choice is a flag on the actor, so each player's own character can use a different
 * device and the world default is never touched.
 */
export async function openThemePicker(actor, current) {
	if (!actor?.isOwner) return ui.notifications.warn(game.i18n.localize('SFH.NotOwner'));

	const cards = Object.values(THEMES).map((theme) => `
		<label class="sfh-theme-card ${theme.id === current ? 'is-active' : ''}">
			<input type="radio" name="sfh-theme" value="${theme.id}" ${theme.id === current ? 'checked' : ''}>
			<span class="sfh-swatch" data-hud-theme="${theme.id}"></span>
			<strong>${game.i18n.localize(theme.label)}</strong>
			<small>${game.i18n.localize(theme.hint)}</small>
		</label>`).join('');

	const content = `
		<div class="sfh-theme-picker">
			<p>${game.i18n.localize('SFH.ThemePicker.Hint')}</p>
			<div class="sfh-theme-cards">
				<label class="sfh-theme-card ${!current || !actor.getFlag(MOD, FLAG_THEME) ? 'is-active' : ''}">
					<input type="radio" name="sfh-theme" value="" ${actor.getFlag(MOD, FLAG_THEME) ? '' : 'checked'}>
					<span class="sfh-swatch sfh-swatch-default"></span>
					<strong>${game.i18n.localize('SFH.ThemePicker.WorldDefault')}</strong>
					<small>${game.i18n.localize('SFH.ThemePicker.WorldDefaultHint')}</small>
				</label>
				${cards}
			</div>
		</div>`;

	const choice = await foundry.applications.api.DialogV2.prompt({
		window: { title: game.i18n.format('SFH.ThemePicker.Title', { name: actor.name }) },
		classes: ['sfh-dialog'],
		content,
		ok: {
			label: game.i18n.localize('SFH.ThemePicker.Apply'),
			callback: (_event, button) => button.form.elements['sfh-theme'].value,
		},
		rejectClose: false,
	});
	if (choice === null || choice === undefined) return;

	if (choice) await actor.setFlag(MOD, FLAG_THEME, choice);
	else await actor.unsetFlag(MOD, FLAG_THEME);
	actor.sheet?.render(false);
}
