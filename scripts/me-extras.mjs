import { MOD, S, ME_MODULE } from './constants.mjs';
import { setting } from './settings.mjs';

/**
 * The Dossier: the Mass Effect conversion's own data, shown in the HUD.
 *
 * Everything here is read from that module and written back through its API. The HUD
 * owns none of this data and never edits a perk item itself — the conversion's tracker
 * stays the single source of truth.
 */

const meModule = () => game.modules.get(ME_MODULE);
const meApi = () => meModule()?.api ?? null;

/** Show the Dossier only when the conversion is installed, on, and not switched off. */
export function extrasEnabled(actor) {
	if (setting(S.meExtras) === 'off') return false;
	if (!meModule()?.active) return false;
	return !!actor;
}

export function mountExtras(app, panel) {
	panel.classList.add('sfh-slot', 'sfh-extras', 'sfh-own');
	panel.dataset.slot = 'extras';
	render(app, panel);

	// Follow the actor: the tracker and the shield system both write to the actor.
	const hookId = Hooks.on('updateActor', (doc) => {
		if (doc.id === app.actor.id && panel.isConnected) render(app, panel);
	});
	const itemHook = Hooks.on('updateItem', (item) => {
		if (item.parent?.id === app.actor.id && panel.isConnected) render(app, panel);
	});
	app._sfhExtraHooks = [['updateActor', hookId], ['updateItem', itemHook]];
}

/** Drop the hooks a closed sheet left behind. */
export function unmountExtras(app) {
	for (const [hook, id] of app._sfhExtraHooks ?? []) Hooks.off(hook, id);
	app._sfhExtraHooks = null;
}

function render(app, panel) {
	const actor = app.actor;
	const shield = readShield(actor);
	const tracks = readTracks(actor);
	const gel = actor.items.find((i) => i.name === 'Omni-Gel');

	panel.innerHTML = `
		<header class="sfh-panel-head">
			<span class="sfh-label">${game.i18n.localize('SFH.Extras.Title')}</span>
			<span class="sfh-chip sfh-chip-me">ME</span>
		</header>
		<div class="sfh-extras-body">
			${shield ? meter('SFH.Extras.Shields', shield.value, shield.max, 'shield') : ''}
			${(shield?.extra ?? []).map((b) => meter(b.label, b.value, b.max, b.kind, true)).join('')}
			${tracks ? tracks.map((t) => track(t)).join('') : ''}
			${gel ? row('SFH.Extras.OmniGel', gel.system?.quantity ?? 0) : ''}
			${tracks ? `<button type="button" class="sfh-btn sfh-wide" data-sfh-me="tracker">${game.i18n.localize('SFH.Extras.OpenTracker')}</button>` : ''}
		</div>`;

	panel.querySelector('[data-sfh-me="tracker"]')?.addEventListener('click', () => {
		const api = meApi();
		if (api?.openTracker) api.openTracker(actor);
		else if (globalThis.MassEffectPR?.open) globalThis.MassEffectPR.open(actor.id);
		else ui.notifications.warn(game.i18n.localize('SFH.Extras.NoTracker'));
	});
}

/* -------------------------------------------- */
/*  Reading the conversion's data                */
/* -------------------------------------------- */

/**
 * Kinetic shields are the actor's temporary Hit Points, capped by the shield effect's
 * `shieldMax` flag; biotic barriers and armour frames carry their own current/max flags.
 */
function readShield(actor) {
	const shieldItem = actor.items.find((i) => i.getFlag?.(ME_MODULE, 'shieldMax') != null);
	const extra = [];

	const barrier = actor.items.find((i) => i.getFlag?.(ME_MODULE, 'barrierMax') != null);
	if (barrier) {
		extra.push({
			label: 'SFH.Extras.Barrier', kind: 'barrier',
			value: barrier.getFlag(ME_MODULE, 'barrierCurrent') ?? 0,
			max: barrier.getFlag(ME_MODULE, 'barrierMax') ?? 0,
		});
	}
	const armor = actor.items.find((i) => i.getFlag?.(ME_MODULE, 'armorMax') != null);
	if (armor) {
		extra.push({
			label: 'SFH.Extras.ArmorFrame', kind: 'armor',
			value: armor.getFlag(ME_MODULE, 'armorCurrent') ?? 0,
			max: armor.getFlag(ME_MODULE, 'armorMax') ?? 0,
		});
	}

	if (!shieldItem && !extra.length) return null;
	return {
		value: actor.system?.attributes?.hp?.temp ?? 0,
		max: shieldItem?.getFlag(ME_MODULE, 'shieldMax') ?? 0,
		extra,
	};
}

/** Paragon and Renegade, as the conversion's tracker stores them. */
function readTracks(actor) {
	const paragon = Number(actor.getFlag('world', 'paragon')) || 0;
	const renegade = Number(actor.getFlag('world', 'renegade')) || 0;
	const has = actor.getFlag('world', 'paragon') != null || actor.getFlag('world', 'renegade') != null;
	if (!has && !meApi()?.paragonRenegade) return null;
	return [
		{ key: 'paragon', label: 'SFH.Extras.Paragon', value: paragon },
		{ key: 'renegade', label: 'SFH.Extras.Renegade', value: renegade },
	];
}

/* -------------------------------------------- */
/*  Markup                                       */
/* -------------------------------------------- */

function meter(label, value, max, kind, small = false) {
	const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
	return `
		<div class="sfh-meter ${small ? 'is-small' : ''}" data-kind="${kind}">
			<div class="sfh-meter-head">
				<span class="sfh-label">${game.i18n.localize(label)}</span>
				<span class="sfh-num">${value} / ${max}</span>
			</div>
			<div class="sfh-bar"><i style="width:${pct}%"></i></div>
		</div>`;
}

/** A morality track with its tier marks at 20/40/60/80. */
function track({ key, label, value }) {
	const ticks = [20, 40, 60, 80].map((t) => `<span class="sfh-tick" style="left:${t}%"></span>`).join('');
	return `
		<div class="sfh-meter sfh-track" data-track="${key}">
			<div class="sfh-meter-head">
				<span class="sfh-label">${game.i18n.localize(label)}</span>
				<span class="sfh-num">${value}</span>
			</div>
			<div class="sfh-bar"><i style="width:${value}%"></i>${ticks}</div>
		</div>`;
}

function row(label, value) {
	return `<div class="sfh-row"><span class="sfh-label">${game.i18n.localize(label)}</span><span class="sfh-num">${value}</span></div>`;
}
