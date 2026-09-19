import { MOD } from './constants.mjs';

/**
 * The readout: a details panel fed by whatever the pointer or keyboard focus is on.
 *
 * It is display-only. It reads items straight off the actor and never writes anything,
 * so it cannot affect how the sheet behaves. Hovering previews; clicking pins, so a
 * description stays put while you read it.
 */

const EMPTY = 'SFH.Readout.Empty';

export function mountReadout(app, panel, grid) {
	panel.classList.add('sfh-slot', 'sfh-readout', 'sfh-own');
	panel.dataset.slot = 'readout';
	panel.innerHTML = `
		<header class="sfh-panel-head">
			<span class="sfh-label">${game.i18n.localize('SFH.Readout.Title')}</span>
			<button type="button" class="sfh-btn sfh-unpin" data-tooltip="${game.i18n.localize('SFH.Readout.Unpin')}" aria-label="${game.i18n.localize('SFH.Readout.Unpin')}" hidden>
				<i class="fa-solid fa-thumbtack"></i>
			</button>
		</header>
		<div class="sfh-readout-body" aria-live="polite"><p class="sfh-dim">${game.i18n.localize(EMPTY)}</p></div>`;

	const body = panel.querySelector('.sfh-readout-body');
	const unpin = panel.querySelector('.sfh-unpin');
	const state = { pinned: null, token: 0 };

	const clear = () => {
		body.innerHTML = `<p class="sfh-dim">${game.i18n.localize(EMPTY)}</p>`;
	};

	const show = async (uuidOrItem) => {
		const token = ++state.token;
		const html = await describe(app.actor, uuidOrItem);
		if (token !== state.token) return;      // a newer hover won
		body.innerHTML = html ?? '';
		body.scrollTop = 0;
	};

	const resolve = (event) => {
		const row = event.target.closest('[data-item-id], [data-item-uuid]');
		if (!row || !grid.contains(row) || panel.contains(row)) return null;
		const { itemId, itemUuid } = row.dataset;
		return itemUuid ? fromUuidSync(itemUuid) : app.actor.items.get(itemId);
	};

	grid.addEventListener('pointerover', (event) => {
		const item = resolve(event);
		if (item) show(item);
	});
	grid.addEventListener('focusin', (event) => {
		const item = resolve(event);
		if (item) show(item);
	});
	grid.addEventListener('pointerleave', () => {
		if (state.pinned) show(state.pinned);
		else clear();
	});
	grid.addEventListener('click', (event) => {
		const item = resolve(event);
		if (!item) return;
		state.pinned = item;
		unpin.hidden = false;
		show(item);
	});
	unpin.addEventListener('click', () => {
		state.pinned = null;
		unpin.hidden = true;
		clear();
	});
}

/** Build the readout's contents for one item. */
async function describe(actor, item) {
	if (!item) return null;
	const sys = item.system ?? {};
	const traits = sys.traits?.value ?? [];
	const bits = [];

	const add = (label, value) => {
		if (value !== undefined && value !== null && value !== '') bits.push([label, value]);
	};
	add(game.i18n.localize('SFH.Readout.Type'), item.type ? game.i18n.localize(`TYPES.Item.${item.type}`) : null);
	if (sys.level?.value !== undefined) add(game.i18n.localize('SFH.Readout.Level'), sys.level.value);
	if (sys.quantity !== undefined) add(game.i18n.localize('SFH.Readout.Quantity'), sys.quantity);
	if (sys.damage?.dice) add(game.i18n.localize('SFH.Readout.Damage'), `${sys.damage.dice}${sys.damage.die} ${sys.damage.damageType ?? ''}`.trim());
	if (sys.range) add(game.i18n.localize('SFH.Readout.Range'), typeof sys.range === 'object' ? sys.range.value : sys.range);
	if (sys.frequency?.max) add(game.i18n.localize('SFH.Readout.Uses'), `${sys.frequency.value ?? 0} / ${sys.frequency.max}`);

	const raw = sys.description?.value ?? sys.description ?? '';
	const description = await enrich(raw, actor);

	return `
		<h4 class="sfh-readout-title">${foundry.utils.escapeHTML(item.name)}</h4>
		${traits.length ? `<div class="sfh-chips">${traits.map((t) => `<span class="sfh-chip">${foundry.utils.escapeHTML(String(t))}</span>`).join('')}</div>` : ''}
		${bits.length ? `<dl class="sfh-meta">${bits.map(([k, v]) => `<dt>${k}</dt><dd>${foundry.utils.escapeHTML(String(v))}</dd>`).join('')}</dl>` : ''}
		<div class="sfh-readout-text">${description}</div>`;
}

/** Enrich item text so inline rolls, links and UUIDs render as they do on the sheet. */
async function enrich(html, actor) {
	if (!html) return '';
	const editor = foundry.applications?.ux?.TextEditor?.implementation ?? globalThis.TextEditor;
	try {
		return await editor.enrichHTML(html, { rollData: actor?.getRollData?.() ?? {}, relativeTo: actor });
	} catch (err) {
		console.warn(`${MOD} | readout enrich failed`, err);
		return html;
	}
}
