import { MOD, S, DEVICES } from '../constants.mjs';

/**
 * The Default device and My device settings, as two menus: a category (science fiction or
 * fantasy, and for My device, following the world's default) and then a look from that category
 * only. Eighteen devices and looks in one list mixed an omni-tool with a satchel.
 *
 * Only the settings window changes. The setting still holds the one device or look chosen, so
 * nobody's choice moves, and the category is worked out from it: the look menu is Foundry's own,
 * with the other category's options taken out, and changing the category puts its first look in.
 */

/** The categories, in the order they are offered, and what each is called. */
const CATEGORIES = { scifi: 'SFH.Settings.CategorySciFi', fantasy: 'SFH.Settings.CategoryFantasy' };
const WORLD = 'world';

const categoryOf = (value) => (value ? DEVICES[value]?.genre ?? 'scifi' : WORLD);

export function splitDevicePicker(app, html) {
	const root = html instanceof HTMLElement ? html : html?.[0];
	for (const key of [S.worldDevice, S.device]) {
		const select = root?.querySelector(`select[name="${MOD}.${key}"]`);
		if (!select || select.dataset.sfhSplit) continue;
		select.dataset.sfhSplit = '1';
		// everything Foundry offered, kept to put back whichever category is chosen
		const all = [...select.options].map((o) => ({ value: o.value, label: o.textContent }));
		const follows = all.some((o) => o.value === '');

		const category = document.createElement('select');
		category.className = 'sfh-category';
		category.setAttribute('aria-label', game.i18n.localize('SFH.Settings.Category'));
		const offered = [...(follows ? [[WORLD, 'SFH.Settings.DeviceWorld']] : []), ...Object.entries(CATEGORIES)];
		category.innerHTML = offered.map(([value, label]) => `<option value="${value}">${game.i18n.localize(label)}</option>`).join('');
		category.value = categoryOf(select.value);

		const fill = (chosen, keep) => {
			const looks = all.filter((o) => (chosen === WORLD ? o.value === '' : o.value && categoryOf(o.value) === chosen));
			select.replaceChildren(...looks.map((o) => new Option(o.label, o.value)));
			select.value = looks.some((o) => o.value === keep) ? keep : looks[0]?.value ?? '';
			// following the world's default leaves nothing to choose but the category
			select.hidden = chosen === WORLD;
		};
		fill(category.value, select.value);
		category.addEventListener('change', () => {
			fill(category.value, null);
			select.dispatchEvent(new Event('change', { bubbles: true }));
		});
		select.before(category);
	}
}
