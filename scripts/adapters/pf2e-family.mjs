import { esc, sgn, lbl, bar, rollBtn, actBtn, nameBtn, ro, COST_GLYPH } from '../projection/helpers.mjs';
import { ME_MODULE } from '../constants.mjs';

/**
 * Starfinder 2e and Pathfinder 2e.
 *
 * Reads the numbers the projection shows, and turns every button press back into the
 * system's own call — `skill.roll()`, `save.roll()`, `strike.variants[n].roll()` and so on.
 * Nothing is re-implemented: if the system changes how a roll works, this still calls it.
 */

const RANK = ['U', 'T', 'E', 'M', 'L'];
const RANK_NAME = ['Untrained', 'Trained', 'Expert', 'Master', 'Legendary'];

/** Systems this adapter serves. */
export const SYSTEMS = ['pf2e', 'sf2e'];

export const TABS = [
	{ id: 'character', label: 'Character' },
	{ id: 'actions', label: 'Actions' },
	{ id: 'inventory', label: 'Inventory' },
	{ id: 'spellcasting', label: 'Spells' },
	{ id: 'feats', label: 'Feats' },
	{ id: 'skills', label: 'Skills' },
	{ id: 'effects', label: 'Effects' },
	{ id: 'biography', label: 'Biography' },
];

/* -------------------------------------------- */
/*  Reading                                      */
/* -------------------------------------------- */

export function read(actor) {
	const sys = actor.system ?? {};
	const hp = sys.attributes?.hp ?? {};
	const level = sys.details?.level?.value ?? 1;
	const heritage = actor.heritage?.name ?? actor.ancestry?.name ?? '';
	const cls = actor.class?.name ?? '';
	const background = actor.background?.name ?? '';

	return {
		system: 'pf2e',
		id: actor.id,
		name: actor.name,
		sub: [heritage, background, cls].filter(Boolean).join(' · '),
		level,
		xp: { value: sys.details?.xp?.value ?? 0, max: sys.details?.xp?.max ?? 1000 },
		hp: { value: hp.value ?? 0, max: hp.max ?? 0, temp: hp.temp ?? 0 },
		ac: sys.attributes?.ac?.value ?? 10,
		speed: landSpeed(actor),
		defenses: defenses(actor),
		vitals: {
			kind: 'pf2e',
			hero: { value: actor.heroPoints?.value ?? 0, max: actor.heroPoints?.max ?? 3 },
			dying: { value: sys.attributes?.dying?.value ?? 0, max: sys.attributes?.dying?.max ?? 4 },
			wounded: sys.attributes?.wounded?.value ?? 0,
			doomed: sys.attributes?.doomed?.value ?? 0,
		},
		effects: (actor.itemTypes?.effect ?? []).map((e) => ({
			id: e.id,
			name: e.name,
			duration: durationLabel(e),
		})),
		conditions: [...(actor.conditions ?? [])].map((c) => ({
			id: c.id,
			name: c.name,
			value: c.value ?? null,
			slug: c.slug,
			// granted by something else, so only that something can take it away
			locked: !!c.isLocked,
		})),
		conditionChoices: conditionChoices(actor),
		tabs: TABS,
	};
}

/** The vitals panel owns these; the picker leaves them to it. */
const VITAL_CONDITIONS = ['dying', 'wounded', 'doomed'];

/**
 * What the "+ Add condition" picker offers: the system's own list (SF2e keeps it under
 * CONFIG.PF2E too), less anything already on. A valued condition that is on is raised from
 * its chip instead. Persistent damage stays, since a character can carry several.
 */
function conditionChoices(actor) {
	const on = new Set([...(actor.conditions ?? [])].map((c) => c.slug));
	return Object.entries(CONFIG.PF2E?.conditionTypes ?? {})
		.filter(([slug]) => !VITAL_CONDITIONS.includes(slug) && (!on.has(slug) || slug === 'persistent-damage'))
		.map(([slug, label]) => ({ id: slug, label: game.i18n.localize(label) }))
		.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));
}

/** The system keeps speed under movement, and deletes the old attribute as it prepares an actor. */
const landSpeed = (actor) => actor.system?.movement?.speeds?.land?.value ?? actor.system?.attributes?.speed?.value ?? 25;

function defenses(actor) {
	const sys = actor.system ?? {};
	const out = [{ label: 'AC', value: sys.attributes?.ac?.value ?? 10, lead: true }];
	const dc = actor.classDC?.value ?? sys.attributes?.classDC?.value;
	if (dc) out.push({ label: 'Class DC', value: dc });
	for (const [key, label] of [['fortitude', 'Fort'], ['reflex', 'Ref'], ['will', 'Will']]) {
		const save = actor.saves?.[key];
		if (save) out.push({ label, value: sgn(save.mod ?? 0), act: 'save', k: key });
	}
	const perception = actor.perception ?? sys.attributes?.perception;
	if (perception) out.push({ label: 'Perception', value: sgn(perception.mod ?? perception.value ?? 0), act: 'perception', k: '' });
	out.push({ label: 'Speed', value: `${landSpeed(actor)} ft` });
	if (perception) out.push({ label: 'Initiative', value: sgn(perception.mod ?? 0), act: 'initiative', k: '' });
	return out;
}

function durationLabel(effect) {
	const d = effect.system?.duration;
	if (!d) return '';
	if (d.unit === 'unlimited' || d.unit === 'encounter') return d.unit;
	return `${d.value ?? ''} ${d.unit ?? ''}`.trim();
}

/* -------------------------------------------- */
/*  Tab bodies                                   */
/* -------------------------------------------- */

export function tabBody(actor, tab) {
	switch (tab) {
		case 'character': return character(actor);
		case 'actions': return actions(actor);
		case 'inventory': return inventory(actor);
		case 'spellcasting': return spellcasting(actor);
		case 'feats': return feats(actor);
		case 'skills': return skills(actor);
		case 'effects': return effects(actor);
		case 'biography': return biography(actor);
		default: return '<p class="dimc">Nothing here.</p>';
	}
}

function character(actor) {
	const sys = actor.system ?? {};
	const kv = (k, v) => `<div class="kv">${lbl(k)}<b>${esc(v)}</b></div>`;
	const attrs = Object.entries(actor.abilities ?? {})
		.map(([key, a]) => `<button type="button" class="cell" data-act="ability" data-k="${key}">${lbl(key)}<span class="v">${sgn(a.mod ?? 0)}</span></button>`)
		.join('');
	const ident = [
		['Ancestry', actor.ancestry?.name ?? '—'],
		['Heritage', actor.heritage?.name ?? '—'],
		['Class', actor.class?.name ?? '—'],
		['Background', actor.background?.name ?? '—'],
		['Size', sys.traits?.size?.value ?? '—'],
		['Languages', (sys.details?.languages?.value ?? []).join(', ') || '—'],
	];
	return `<div class="grid3">${ident.map(([k, v]) => kv(k, v)).join('')}</div>
		<div class="sec">Attribute Modifiers</div><div class="grid6">${attrs}</div>`;
}

function actions(actor) {
	// every button says which strike by its place in this list, so hidden ones keep their place
	const strikes = (actor.system?.actions ?? []).map((s, index) => (s.visible === false ? '' : strikeRow(s, index))).join('');
	const byCost = (item) => {
		const type = item.system?.actionType?.value;
		const n = item.system?.actions?.value;
		return type === 'reaction' ? 'R' : type === 'free' ? 'F' : String(n ?? 1);
	};
	// every row the same size: what else there is to know about it is in the readout, from anywhere on the row
	const row = (item) => {
		// the system fills in a missing value with the maximum
		const uses = item.system?.frequency;
		const spent = uses?.max && (uses.value ?? uses.max) <= 0;
		return `<div class="li sfh-action" ${ro(`item:${item.id}`)}>
		<span class="cost">${COST_GLYPH[byCost(item)] ?? ''}</span>
		<span class="grow">${nameBtn(item.name, `item:${item.id}`)}</span>
		${actBtn('Use', 'use', item.id, spent ? { cls: 'sm ghost spent', title: 'No uses left', disabled: true } : { cls: 'sm ghost' })}</div>`;
	};
	// as on the sheet: action items, and feats that cost an action
	const usable = [...(actor.itemTypes?.action ?? []), ...(actor.itemTypes?.feat ?? []).filter((f) => f.actionCost)]
		.filter((item) => !item.suppressed);
	const acts = usable.map(row).join('');
	return `${shieldRow(actor)}<div class="sec">Strikes</div>${strikes || '<p class="dimc">No strikes.</p>'}
		<div class="sec">Actions</div><div class="grid2 sfh-actions">${acts || '<p class="dimc">None.</p>'}</div>`;
}

/** The held shield, with the sheet's hit points and its Raise a Shield. Nothing without one. */
function shieldRow(actor) {
	const shield = actor.system?.attributes?.shield;
	if (!shield?.itemId) return '';
	const state = shield.destroyed ? 'Destroyed' : shield.broken ? 'Broken' : '';
	const stats = [shield.ac ? `AC ${sgn(shield.ac)}` : '', shield.hardness ? `Hardness ${shield.hardness}` : ''].filter(Boolean).join(' · ');
	return `<div class="sec">Shield</div><div class="li sfh-shield">
		<span class="grow"><b>${esc(shield.name)}</b> <span class="sub">${esc(stats)}</span></span>
		${state ? `<span class="chip">${state}</span>` : ''}
		<span class="row" style="gap:4px"><input class="sfh-in mono" type="number" inputmode="numeric" min="0" value="${shield.hp?.value ?? 0}"
			data-commit="shieldHp" aria-label="Shield hit points"><span class="mono dimc">/ ${shield.hp?.max ?? 0}</span></span>
		${actBtn(shield.raised ? 'Raised' : 'Raise', 'raiseShield', '', { cls: `sm ghost ${shield.raised ? 'on' : ''}`, title: 'Raise a Shield' })}</div>`;
}

/** An attack's buttons: on a strike itself, or on one of its other usages when `alt` says which. */
function attackButtons(usage, index, alt = '') {
	if (usage.quantity === 0) return '<span class="sub">None left</span>';
	const key = alt === '' ? String(index) : `${index}:${alt}`;
	const variants = usage.variants?.map((v, i) => rollBtn(v.label ?? sgn(usage.totalModifier ?? 0), 'strike', `${index}:${i}:${alt}`, i ? '' : 'on')).join('') ?? '';
	const damage = usage.item?.dealsDamage === false ? '' : `<div class="row" style="gap:4px">
		${actBtn('Damage', 'strikeDamage', key, { cls: 'sm ghost' })}
		${actBtn('Critical', 'critical', key, { cls: 'sm ghost' })}</div>`;
	return `<div class="row" style="gap:4px">${variants}</div>${damage}`;
}

/** What the sheet marks a strike's other usages with. */
function altLabel(usage) {
	if (usage.type === 'auto-fire') return 'Auto-fire';
	if (usage.item?.isThrown) return 'Thrown';
	return usage.item?.isRanged ? 'Ranged' : 'Melee';
}

/** Ammunition, as the sheet shows it: what is loaded and reloading if the weapon loads, or a choice if not. */
function ammoRow(strike, index) {
	const ammo = strike.ammunition;
	if (!ammo) return '';
	if (!ammo.requiresReload) {
		const choices = (ammo.compatible ?? []).map((a) => `<option value="${esc(a.id)}"${a.id === ammo.selected?.id ? ' selected' : ''}>${esc(a.label)}</option>`).join('');
		return `<div class="row sfh-ammo">${lbl('Ammo')}<select class="sel" data-pick="ammo" data-k="${index}" data-allow-empty="1" aria-label="Ammunition">
			<option value="">No ammunition</option>${choices}</select></div>`;
	}
	const loaded = (ammo.loaded ?? []).map((a) => {
		const selected = a.id === ammo.selected?.id;
		const choose = selected || ammo.loaded.length < 2
			? `<span class="${selected ? 'hot' : ''}">${esc(a.name)}</span>`
			: actBtn(a.name, 'selectAmmo', `${index}:${a.id}`, { cls: 'sm ghost', title: 'Fire this next' });
		return `<span class="row" style="gap:4px">${choose}<span class="mono dimc">${a.quantity} / ${a.max}</span>
			${actBtn('Unload', 'unload', `${index}:${a.id}`, { cls: 'sm ghost' })}</span>`;
	}).join('');
	const reload = ammo.remaining ? actBtn('Reload', 'reload', String(index), { cls: 'sm ghost', title: ammo.capacity > 1 ? `${ammo.remaining} empty` : 'Empty' }) : '';
	return `<div class="row sfh-ammo">${lbl('Ammo')}${loaded}${reload}</div>`;
}

/** The sheet's Draw, Stow, Change Grip and so on. One with options is a choice. */
function auxRow(strike, index) {
	const buttons = (strike.auxiliaryActions ?? []).map((aux, n) => {
		if (!aux.options?.length) return actBtn(aux.label, 'aux', `${index}:${n}`, { cls: 'sm ghost' });
		const choices = aux.options.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('');
		return `<select class="sel sfh-aux" data-pick="aux" data-k="${index}:${n}" aria-label="${esc(aux.label)}"><option value="">${esc(aux.label)}…</option>${choices}</select>`;
	}).join('');
	return buttons ? `<div class="row" style="gap:4px;flex-wrap:wrap">${buttons}</div>` : '';
}

function strikeRow(strike, index) {
	const ready = strike.ready !== false;
	const attack = ready && strike.canAttack !== false ? attackButtons(strike, index) : '';
	const alts = ready ? (strike.altUsages ?? []).map((usage, alt) => `<div class="row" style="gap:6px;flex-wrap:wrap;width:100%">
		${lbl(altLabel(usage))}${attackButtons(usage, index, alt)}</div>`).join('') : '';
	const hands = strike.handsAvailable !== false;
	return `<div class="li" style="flex-wrap:wrap;gap:8px 10px;padding:8px 10px">
		<div class="grow" style="min-width:150px;display:flex;flex-direction:column;gap:2px">
			${nameBtn(strike.label ?? strike.slug ?? 'Strike', `strike:${index}`)}
			<span class="sub">${esc((strike.traits ?? []).map((t) => t.label ?? t).slice(0, 3).join(' · '))}${!ready && !hands ? ' · Hands occupied' : ''}</span>
		</div>
		${attack}${alts}
		${ready ? ammoRow(strike, index) : ''}
		${hands ? auxRow(strike, index) : ''}</div>`;
}

function inventory(actor) {
	const groups = new Map();
	for (const item of actor.inventory ?? actor.items.filter((i) => i.isOfType?.('physical'))) {
		const type = item.type === 'treasure' ? 'Treasure' : item.type === 'consumable' ? 'Consumables'
			: item.type === 'weapon' ? 'Weapons' : item.type === 'armor' ? 'Armor' : 'Equipment';
		if (!groups.has(type)) groups.set(type, []);
		groups.get(type).push(item);
	}
	const bulk = actor.inventory?.bulk;
	const head = bulk
		? `<div class="row sp">${lbl('Bulk')}<span class="mono">${bulk.value?.toString?.() ?? ''} · encumbered at ${bulk.encumberedAt ?? '—'} · max ${bulk.max ?? '—'}</span></div>`
		: '';
	const invested = actor.inventory?.invested;
	const investedRow = invested
		? `<div class="row sp">${lbl('Invested')}<span class="mono"${invested.value > invested.max ? ' style="color:var(--bad)"' : ''}>${invested.value} / ${invested.max}</span></div>`
		: '';
	const others = tradePartners(actor);
	const rows = [...groups].map(([name, items]) => `<div class="sec">${esc(name)}</div>` + items.map((item) => `<div class="li flat">
		<span class="grow">${nameBtn(item.name, `item:${item.id}`)}</span>
		<span class="row" style="gap:3px">
			${actBtn('−', 'qty', `${item.id}:-1`, { cls: 'sm' })}
			<span class="mono" style="width:26px;text-align:center">${item.quantity ?? 1}</span>
			${actBtn('+', 'qty', `${item.id}:1`, { cls: 'sm' })}
		</span>
		<span class="mono dimc" style="width:34px;text-align:right">${item.system?.bulk?.value ?? '—'}</span>
		${useButton(item)}${investToggle(item)}${carryPicker(actor, item)}${givePicker(item, others)}</div>`).join('')).join('');
	// a quick search that adds from its results, and the system's own Compendium Browser for more
	const search = `<div class="row sfh-browse">
		<input class="sfh-in grow" type="search" data-browse="1" placeholder="Quick search: type to find equipment" aria-label="Quick search for equipment">
		${actBtn('Browse', 'browseEquipment', '', { cls: 'sm ghost', title: 'Open the Compendium Browser' })}</div>
		<div class="sfh-results" aria-live="polite"></div>`;
	// the sheet's + and −: the system's own dialog, in whichever denominations it uses
	const money = `<div class="row sp">${lbl('Currency')}<span class="row" style="gap:6px">
		<span class="big" style="font-size:20px">${esc(actor.inventory?.coins?.toString?.() ?? '')}</span>
		${actBtn('+', 'addCoins', '', { cls: 'sm', title: 'Add money' })}
		${actBtn('−', 'removeCoins', '', { cls: 'sm', title: 'Remove money' })}</span></div>`;
	return `${search}${head}${investedRow}${money}${rows}`;
}

/** What each choice in the carry picker asks of the system. */
const CARRY = {
	attached: { carryType: 'attached' },
	'held-1': { carryType: 'held', handsHeld: 1 },
	'held-2': { carryType: 'held', handsHeld: 2 },
	implanted: { carryType: 'implanted' },
	'worn-slot': { carryType: 'worn', inSlot: true },
	worn: { carryType: 'worn' },
	stowed: { carryType: 'stowed' },
	dropped: { carryType: 'dropped' },
};

/** Which of those an item is at now. */
function carryState(item) {
	const { carryType, handsHeld, inSlot } = item.system?.equipped ?? {};
	if (carryType === 'held') return handsHeld === 2 ? 'held-2' : 'held-1';
	if (carryType === 'worn') return inSlot && item.system?.usage?.where ? 'worn-slot' : 'worn';
	return carryType ?? 'worn';
}

/**
 * The carry menu on the system's sheet (actors/partials/carry-type.hbs): the same choices in
 * the same order, under the same conditions, in the system's own words. "Worn (Armor)" is the
 * one that actually puts armor on: plain Worn only carries it.
 */
function carryPicker(actor, item) {
	const usage = item.system?.usage ?? {};
	const state = carryState(item);
	const carry = (key) => game.i18n.localize(`PF2E.CarryType.${key}`);
	const stowing = actor.itemTypes?.backpack?.some((b) => b.system?.stowing && !b.isInContainer);
	const options = [
		item.isAttachable && ['attached', carry('attached')],
		['held-1', carry('held1')],
		['held-2', carry('held2')],
		usage.type === 'implanted' && ['implanted', carry('implanted')],
		usage.type === 'worn' && usage.where && ['worn-slot', game.i18n.format('PF2E.Item.Physical.Usage.WornParenthetical', {
			where: game.i18n.localize(`PF2E.Item.Physical.Usage.WornSlot.${usage.where}`),
		})],
		['worn', carry('worn')],
		// the sheet offers this only with a container to stow in; one already stowed still shows it
		(stowing || state === 'stowed') && ['stowed', carry('stowed')],
		['dropped', carry('dropped')],
	].filter(Boolean);
	const choices = options.map(([value, label]) => `<option value="${value}"${value === state ? ' selected' : ''}>${esc(label)}</option>`).join('');
	return `<select class="sel carry ${item.isEquipped ? 'on' : ''}" data-pick="carry" data-k="${esc(item.id)}"
		aria-label="${esc(`How ${item.name} is carried`)}" data-tooltip="${esc(game.i18n.localize('PF2E.Actor.Inventory.CarryType.OpenMenu'))}">${choices}</select>`;
}

/** Using a consumable, as the button in the sheet's item summary does. Ammunition is fired, not used. */
function useButton(item) {
	if (item.type !== 'consumable' || item.isAmmo || item.isIdentified === false) return '';
	const left = item.system?.uses?.value ?? item.uses?.value;
	return left > 0 ? actBtn('Use', 'consume', item.id, { cls: 'sm ghost' }) : '<span class="mono dimc" style="font-size:12px">None</span>';
}

/**
 * Who an item can go to: the other characters and the party's stash. A GM can reach them all. A
 * player gets the other players' characters and whatever else they are allowed to see, which
 * leaves out the GM's own spares.
 */
function tradePartners(actor) {
	const reachable = (a) => game.user.isGM || a.hasPlayerOwner || a.visible;
	return (game.actors?.filter((a) => ['character', 'party'].includes(a.type) && a.id !== actor.id && reachable(a)) ?? [])
		.sort((a, b) => a.name.localeCompare(b.name));
}

/** Dragging an item onto another character, as a list of them. It stays visible with nobody to give to, and says why. */
function givePicker(item, others) {
	const choices = others.map((a) => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('');
	const tip = others.length ? 'Give or trade this to another character' : 'There is no other character in this world to give this to';
	return `<select class="sel give" data-pick="give" data-k="${esc(item.id)}"${others.length ? '' : ' disabled'} aria-label="${esc(`Give ${item.name} to another character`)}"
		data-tooltip="${tip}" title="${others.length ? '' : tip}"><option value="">Give…</option>${choices}</select>`;
}

/** The sheet's gem, on anything that can be invested. The rest keep the column lined up. */
function investToggle(item) {
	const investable = !item.isStowed && item.isIdentified !== false && item.isInvested != null;
	if (!investable) return '<span class="invest-gap"></span>';
	return `<button type="button" class="b sm invest ${item.isInvested ? 'on' : ''}" data-act="invest" data-k="${esc(item.id)}"
		aria-pressed="${!!item.isInvested}" aria-label="${esc(`Invest ${item.name}`)}"
		data-tooltip="${esc(game.i18n.localize('PF2E.ui.equipmentInvested'))}"><i class="fa-solid fa-gem"></i></button>`;
}

/**
 * Spells, as the system's own sheet lays them out: each spellcasting entry's sheet data,
 * which already knows prepared slots, signature spells, focus points and innate uses. That
 * data is only available asynchronously, so this tab body is a promise; the projection
 * fills it in when it resolves.
 */
async function spellcasting(actor) {
	const collections = Array.from(actor.spellcasting?.collections ?? []);
	if (!collections.length) {
		const me = game.modules.get(ME_MODULE)?.active;
		return `<div class="empty"><div class="lbl" style="margin-bottom:6px">No spellcasting entries</div>${me
			? 'Mass Effect biotic and tech powers are feats with actions, so they appear in the Actions and Feats tabs.'
			: 'This character has no spellcasting.'}<div style="margin-top:12px">${actBtn('Open the system sheet', 'sheet', '', { cls: 'sm ghost' })}</div></div>`;
	}
	const entries = await Promise.all(collections.map((c) => c.entry.getSheetData({ spells: c })));
	return entries.sort((a, b) => a.sort - b.sort).map((entry) => spellEntry(entry, actor)).join('');
}

const SPELL_COST = { 1: '1', 2: '2', 3: '3', reaction: 'R', free: 'F' };

/** The focus pool is the character's, shared by every focus entry; the sheet sets it on each. */
function focusPool(actor) {
	const pool = actor.system?.resources?.focus;
	if (!pool?.max) return '';
	const value = pool.value ?? 0;
	return `<div class="kv">${lbl('Focus Points')}<span class="row" style="gap:4px">
		${actBtn('−', 'focus', String(value - 1), { cls: 'sm', title: 'Spend a focus point' })}
		<b class="mono">${value} / ${pool.max}</b>
		${actBtn('+', 'focus', String(value + 1), { cls: 'sm', title: 'Regain a focus point' })}</span></div>`;
}

function spellEntry(entry, actor) {
	const stat = entry.statistic ?? {};
	const tradition = entry.tradition ? game.i18n.localize(CONFIG.PF2E?.magicTraditions?.[entry.tradition] ?? entry.tradition) : '';
	const kv = (k, v) => `<div class="kv">${lbl(k)}<b class="mono">${v}</b></div>`;
	const head = `<div class="sec">${esc(entry.name)}</div>
		<div class="row" style="gap:10px;flex-wrap:wrap">
			${tradition ? `<div class="kv">${lbl('Tradition')}<b>${esc(tradition)}</b></div>` : ''}
			${stat.check ? `<div class="kv">${lbl('Spell attack')}${rollBtn(sgn(stat.check.mod ?? 0), 'spellAttack', entry.id)}</div>` : ''}
			${stat.dc ? kv('Save DC', stat.dc.value ?? '—') : ''}
			${entry.isFocusPool ? focusPool(actor) : ''}
			${entry.isPrepared ? `<span class="grow"></span>${actBtn('Spell Preparation', 'prepareSpells', entry.id, { cls: 'sm ghost' })}` : ''}
		</div>`;

	const groups = (entry.groups ?? []).map((group) => {
		const spent = group.uses?.max && group.uses.value != null && group.uses.value < group.uses.max;
		// focus points are a pool of the character's, refilled by Refocus, not a rank's slots
		const restore = spent && !entry.isFocusPool
			? actBtn('Restore', 'restoreSlots', `${entry.id}:${group.id}`, { cls: 'sm ghost', title: 'Restore every slot of this rank' })
			: '';
		const uses = group.uses?.max && group.uses.value != null
			? `<span class="row" style="gap:6px"><span class="mono dimc" style="font-size:12px">${group.uses.value} / ${group.uses.max}</span>${restore}</span>` : '';
		// a prepared entry casts from a particular slot, so the slot's index is kept
		const rows = (group.active ?? []).map((slot, index) => slot && spellRow(entry, slot, entry.isPrepared ? index : '', group.id)).join('');
		if (!rows) return '';
		return `<div class="row sp" style="margin-top:6px">${lbl(game.i18n.localize(group.label ?? ''))}${uses}</div>${rows}`;
	}).join('');

	return head + (groups || '<p class="dimc">No spells.</p>');
}

function spellRow(entry, slot, slotId, groupId) {
	const spell = slot.spell;
	const rank = slot.castRank ?? spell.rank;
	const cost = SPELL_COST[spell.system?.time?.value];
	const uses = slot.uses?.max ? `<span class="mono dimc">${slot.uses.value ?? 0}/${slot.uses.max}</span>` : '';
	// an innate spell keeps its own uses
	const refill = slot.uses?.max && (slot.uses.value ?? 0) < slot.uses.max
		? actBtn('Restore', 'restoreUses', spell.id, { cls: 'sm ghost', title: 'Restore this spell\'s uses' })
		: '';
	// a prepared slot once cast can be restored; other expended rows wait on their rank's slots
	const preparedSlot = entry.isPrepared && slotId !== '';
	const cast = !slot.expended
		? actBtn('Cast', 'cast', `${entry.id}:${spell.id}:${rank}:${slotId}`, { cls: 'sm ghost' })
		: preparedSlot
			? actBtn('Restore', 'restoreSlot', `${entry.id}:${groupId}:${slotId}`, { cls: 'sm ghost', title: 'Restore this spell' })
			: '<span class="mono dimc" style="font-size:12px">Expended</span>';
	return `<div class="li${slot.expended ? ' spent' : ''}">
		<span class="cost">${cost ? COST_GLYPH[cost] : ''}</span>
		<span class="grow">${nameBtn(spell.name, `item:${spell.id}`)}</span>
		${slot.signature ? '<span class="chip">Signature</span>' : ''}${uses}${refill}${cast}</div>`;
}

/**
 * The sheet's Feats tab, from the same place: the system's own groups and slots, which know where
 * a feat was taken, what it grants, and which slots are still open. A feat's category does not say:
 * a skill feat can sit in a general slot, and a granted feat belongs under what granted it.
 */
function feats(actor) {
	const row = (slot, depth = 0) => {
		const label = `<span class="mono dimc sfh-slot">${esc(slot.label ?? '')}</span>`;
		if (!slot.feat) {
			return `<div class="li sfh-feat empty" style="--depth:${depth}">${label}<span class="grow">${esc(game.i18n.localize(slot.placeholder ?? 'PF2E.EmptySlot'))}</span></div>`;
		}
		const key = `item:${slot.feat.id}`;
		return `<div class="li sfh-feat" ${ro(key)} style="--depth:${depth}">${label}<span class="grow">${nameBtn(slot.feat.name, key)}</span></div>
			${(slot.children ?? []).map((child) => row(child, depth + 1)).join('')}`;
	};
	// a character always has these; anything else lists what it has
	const groups = actor.feats
		? [...actor.feats, actor.feats.bonus]
		: [{ label: 'PF2E.Item.Feat.Plural', feats: [...(actor.itemTypes?.feat ?? [])].sort((a, b) => (a.system?.level?.value ?? 0) - (b.system?.level?.value ?? 0)).map((feat) => ({ feat, label: feat.system?.level?.value })) }];
	return groups.filter((group) => group?.feats?.length)
		.map((group) => `<div class="sec">${esc(game.i18n.localize(group.label))}</div>${group.feats.map((slot) => row(slot)).join('')}`)
		.join('') || '<p class="dimc">No feats.</p>';
}

function skills(actor) {
	const rows = Object.entries(actor.skills ?? {}).map(([key, s]) => {
		const rank = RANK[s.rank ?? 0] ?? 'U';
		// as on the system's sheet, a lore can only be changed through its own item
		const data = actor.system?.skills?.[key];
		const locked = data?.lore && !data.itemId;
		const options = RANK.map((letter, value) => `<option value="${value}" title="${RANK_NAME[value]}"${letter === rank ? ' selected' : ''}>${letter}</option>`).join('');
		return `<div class="li flat">
			<select class="rk rk-sel ${rank}" data-pick="rank" data-k="${esc(key)}"${locked ? ' disabled' : ''}
				aria-label="${esc(`${s.label ?? key} training`)}" data-tooltip="${esc(`${RANK_NAME[RANK.indexOf(rank)]}: change training`)}">${options}</select>
			<span class="grow">${nameBtn(s.label ?? key, `skill:${key}`)}</span>
			${rollBtn(sgn(s.mod ?? 0), 'skill', key)}</div>`;
	}).join('');
	return `<div class="row sp">${lbl('Skills')}<span class="dimc" style="font-size:12px">U untrained · T trained · E expert · M master · L legendary</span></div>
		<div class="grid2">${rows}</div>`;
}

function effects(actor) {
	const eff = (actor.itemTypes?.effect ?? []).map((e) => `<div class="li">
		<span class="grow">${nameBtn(e.name, `item:${e.id}`)}</span>
		<span class="mono dimc">${esc(durationLabel(e))}</span>
		${actBtn('Remove', 'delete', e.id, { cls: 'sm' })}</div>`).join('') || '<p class="dimc">None.</p>';
	const cond = [...(actor.conditions ?? [])].map((c) => `<div class="li">
		<span class="grow">${nameBtn(c.name, `item:${c.id}`)}</span>
		${c.value != null ? `${actBtn('−', 'cond', `${c.slug}:-1`, { cls: 'sm' })}<span class="mono">${c.value}</span>${actBtn('+', 'cond', `${c.slug}:1`, { cls: 'sm' })}` : ''}
		${actBtn('Remove', 'cond', `${c.slug}:0`, { cls: 'sm' })}</div>`).join('') || '<p class="dimc">None.</p>';
	return `<div class="sec">Effects</div>${eff}<div class="sec">Conditions</div>${cond}`;
}

/** Where each of the Biography tab's fields is kept. */
const BIO_FIELDS = {
	height: 'system.details.height.value',
	weight: 'system.details.weight.value',
	...Object.fromEntries(['appearance', 'backstory', 'birthPlace', 'attitude', 'beliefs', 'likes', 'dislikes', 'catchphrases', 'campaignNotes', 'allies', 'enemies', 'organizations']
		.map((field) => [field, `system.details.biography.${field}`])),
};
const BIO_LISTS = ['edicts', 'anathema'];
const BIO_SECTIONS = ['appearance', 'backstory', 'personality', 'campaign'];

/**
 * The sheet's Biography tab: the same fields, in the same order, under the same rules. Its owner
 * edits it, and decides which sections anyone else who can see the character may read. The long
 * fields use Foundry's own rich text editor, as the sheet does, so this tab body is a promise.
 */
async function biography(actor) {
	const details = actor.system?.details ?? {};
	const bio = details.biography;
	if (!bio) return '<p class="dimc">No biography.</p>';
	const owner = !!actor.isOwner;
	const loc = (key) => game.i18n.localize(key);
	const icon = (act, k, glyph, tip, extra = '') => `<button type="button" class="b sm ghost ic ${extra}" data-act="${act}" data-k="${esc(k)}" aria-label="${esc(tip)}" data-tooltip="${esc(tip)}"><i class="fa-solid ${glyph}" inert></i></button>`;
	const rollData = actor.getRollData?.();

	const head = (section, label) => `<div class="sec">${esc(loc(label))}${
		owner ? icon('bioVisibility', section, bio.visibility?.[section] ? 'fa-eye' : 'fa-eye-slash', loc('PF2E.Actor.Character.Biography.ToggleVisibility'), 'sfh-eye') : ''}</div>`;
	const text = (field, label, value, wide = false) => `<label class="sfh-bio ${wide ? 'sfh-bio-wide' : ''}">${lbl(loc(label))}
		<input class="sfh-in" type="text" value="${esc(value ?? '')}" data-field="${field}"${owner ? '' : ' disabled'}></label>`;
	const rich = async (field, label = null) => {
		const shown = await foundry.applications.ux.TextEditor.implementation.enrichHTML(bio[field] ?? '', { rollData, secrets: owner });
		const body = owner
			? `<prose-mirror class="sfh-rich ro-text content-sized" name="${BIO_FIELDS[field]}" data-field="${field}" data-document-uuid="${esc(actor.uuid ?? '')}" value="${esc(bio[field] ?? '')}" toggled>${shown}</prose-mirror>`
			: `<div class="sfh-rich ro-text">${shown}</div>`;
		return `<div class="sfh-bio">${label ? lbl(loc(label)) : ''}${body}</div>`;
	};
	const list = (field, label, tips) => `<div class="sfh-bio" data-list="${field}">
		<div class="sfh-bio-head">${lbl(loc(label))}${owner ? icon('bioAdd', field, 'fa-plus', loc(`${tips}.Add`)) : ''}</div>
		${(bio[field] ?? []).map((line, index) => `<div class="sfh-bio-line"><input class="sfh-in" type="text" value="${esc(line)}" data-field="${field}.${index}"${owner ? '' : ' disabled'} aria-label="${esc(loc(label))}">
			${owner ? icon('bioDelete', `${field}:${index}`, 'fa-trash', loc(`${tips}.Delete`)) : ''}</div>`).join('')}</div>`;
	const shows = (section) => owner || bio.visibility?.[section];

	const parts = [];
	if (shows('appearance')) {
		parts.push(`${head('appearance', 'PF2E.BiographyAppearance')}${await rich('appearance')}
			<div class="sfh-bio-grid">${text('height', 'PF2E.Height', details.height?.value)}${text('weight', 'PF2E.Weight', details.weight?.value)}</div>`);
	}
	if (shows('backstory')) {
		parts.push(`${head('backstory', 'PF2E.BiographyBackStory')}${await rich('backstory')}
			<div class="sfh-bio-grid">${text('birthPlace', 'PF2E.BiographyBirthPlace', bio.birthPlace, true)}</div>`);
	}
	if (shows('personality')) {
		parts.push(`${head('personality', 'PF2E.BiographyPersonalityHeader')}<div class="sfh-bio-grid">
			${text('attitude', 'PF2E.BiographyAttitude', bio.attitude)}${text('beliefs', 'PF2E.BiographyBeliefs', bio.beliefs)}
			${list('edicts', 'PF2E.BiographyEdicts', 'PF2E.Actor.Character.Biography.Edicts')}${list('anathema', 'PF2E.BiographyAnathema', 'PF2E.Actor.Character.Biography.Anathema')}
			${text('likes', 'PF2E.BiographyLikes', bio.likes)}${text('dislikes', 'PF2E.BiographyDislikes', bio.dislikes)}
			${text('catchphrases', 'PF2E.BiographyCatchphrases', bio.catchphrases, true)}</div>`);
	}
	if (shows('campaign')) {
		parts.push(`${head('campaign', 'PF2E.BiographyCampaignNotesHeader')}${await rich('campaignNotes', 'PF2E.BiographyCampaignNotes')}
			${await rich('allies', 'PF2E.BiographyAllies')}${await rich('enemies', 'PF2E.BiographyEnemies')}${await rich('organizations', 'PF2E.BiographyOrganizations')}`);
	}
	return parts.join('') || '<p class="dimc">Nothing here has been shared.</p>';
}

/** A field of the Biography tab, typed or saved from its editor. A line of a list is `edicts.2`. */
export function setField(actor, field, value) {
	const [name, index] = field.split('.');
	if (BIO_LISTS.includes(name)) {
		const lines = [...actor._source.system.details.biography[name]];
		lines[Number(index)] = String(value).trim();
		return actor.update({ [`system.details.biography.${name}`]: lines });
	}
	return BIO_FIELDS[name] ? actor.update({ [BIO_FIELDS[name]]: value }) : null;
}

/** The sheet's buttons on that tab: who may read a section, and adding and removing list lines. */
function bioVisibility(actor, section) {
	if (!BIO_SECTIONS.includes(section)) return null;
	return actor.update({ [`system.details.biography.visibility.${section}`]: !actor.system.details.biography.visibility?.[section] });
}

function bioAdd(actor, name) {
	if (!BIO_LISTS.includes(name)) return null;
	return actor.update({ [`system.details.biography.${name}`]: [...actor._source.system.details.biography[name], ''] });
}

function bioDelete(actor, name, index) {
	if (!BIO_LISTS.includes(name) || !/^\d+$/.test(index)) return null;
	const lines = [...actor._source.system.details.biography[name]];
	lines.splice(Number(index), 1);
	return actor.update({ [`system.details.biography.${name}`]: lines });
}

/* -------------------------------------------- */
/*  Acting                                       */
/* -------------------------------------------- */

/**
 * Every button in the projection ends up here, and every branch hands straight back to
 * the system. `event` is passed through so shift/ctrl keep their usual meaning.
 */
export async function act(actor, action, key, event) {
	const [a, b, c] = String(key ?? '').split(':');
	switch (action) {
		case 'skill': return actor.skills?.[key]?.roll({ event });
		case 'save': return actor.saves?.[key]?.roll({ event });
		case 'perception': return (actor.perception ?? actor.system?.attributes?.perception)?.roll({ event });
		case 'initiative': return actor.initiative?.roll({ event }) ?? actor.rollInitiative?.({ createCombatants: true });
		case 'ability': return actor.abilities?.[key] ? rollAbility(actor, key) : null;
		case 'strike': return attackFrom(actor, a, c)?.variants?.[Number(b)]?.roll({ event });
		case 'strikeDamage': return attackFrom(actor, a, b)?.damage?.({ event });
		case 'critical': return attackFrom(actor, a, b)?.critical?.({ event });
		case 'aux': return actor.system?.actions?.[Number(a)]?.auxiliaryActions?.at(Number(b))?.execute({ selection: c || null });
		case 'unload': return strikeItem(actor, a)?.subitems?.get(b)?.detach({ skipConfirm: event?.shiftKey });
		case 'linkAmmo': return strikeItem(actor, a)?.update({ system: { selectedAmmoId: actor.items.get(b)?.id ?? null } });
		// these two windows and orderings are the system's own, and only its sheet can reach them
		case 'reload': return pressSheetButton(actor, `[data-strike][data-action-index="${Number(a)}"] [data-action="reload"]`, event?.target?.closest?.('[data-act]'));
		case 'selectAmmo': return pressSheetButton(actor, `[data-strike][data-action-index="${Number(a)}"] [data-item-id="${CSS.escape(b)}"] [data-action="select-ammo"]`);
		case 'raiseShield': return game.pf2e?.actions?.raiseAShield?.({ actors: [actor], event });
		case 'setShieldHp': return actor.update({ 'system.attributes.shield.hp.value': Math.max(0, Number(key)) });
		case 'recovery': return actor.rollRecovery?.(event);
		case 'focus': return actor.updateResource?.('focus', Number(key));
		case 'consume': return consumeItem(actor, key);
		case 'bioVisibility': return bioVisibility(actor, key);
		case 'bioAdd': return bioAdd(actor, key);
		case 'bioDelete': return bioDelete(actor, a, b);
		// the system's own route: it counts down limited uses and offers the action's effect
		case 'use': return game.pf2e?.rollItemMacro ? game.pf2e.rollItemMacro(actor.items.get(key)?.uuid, event) : actor.items.get(key)?.toMessage?.(event);
		case 'cast': return castSpell(actor, key);
		case 'restoreSlot': return restoreSlot(actor, key);
		case 'restoreSlots': return restoreSlots(actor, a, b);
		case 'restoreUses': return restoreUses(actor, key);
		case 'prepareSpells': return openSpellPreparation(actor, key);
		case 'setRank': return setSkillRank(actor, a, Number(b));
		case 'browseEquipment': return browseEquipment(key);
		case 'latestDamage': return latestDamage(a, b, event);
		case 'addItem': return addItem(actor, key);
		case 'buyItem': return buyItem(actor, key);
		case 'viewItem': return (await fromUuid(key))?.sheet?.render(true);
		case 'spellAttack': return actor.spellcasting?.get(key)?.statistic?.check?.roll({ event });
		case 'setCarry': return setCarry(actor, a, b);
		case 'giveItem': return giveItem(actor, a, b, event);
		case 'addCoins': return pressSheetButton(actor, '[data-action="add-coins"]');
		case 'removeCoins': return pressSheetButton(actor, '[data-action="remove-coins"]');
		case 'invest': return actor.toggleInvested?.(key);
		case 'qty': return changeQuantity(actor, a, Number(b));
		case 'delete': return actor.items.get(key)?.delete();
		case 'cond': return setCondition(actor, a, Number(b));
		// persistent damage opens the system's own dialog for the damage type and formula
		case 'addCondition': return actor.increaseCondition?.(key);
		case 'heal': return heal(actor, Number(key));
		case 'damage': return damage(actor, Number(key));
		case 'setHp': return setHp(actor, Number(key));
		case 'setMax': return actor.update({ 'system.attributes.hp.max': Math.max(1, Number(key)) });
		case 'setTemp': return actor.update({ 'system.attributes.hp.temp': Math.max(0, Number(key)) });
		case 'hero': return actor.update({ 'system.resources.heroPoints.value': Number(key) });
		// dying, wounded and doomed are conditions; the attributes are derived from them
		case 'dying': return setConditionValue(actor, 'dying', Number(key));
		case 'stat': return setConditionValue(actor, a, Number(b));
		case 'rest': return game.pf2e?.actions?.restForTheNight?.({ actors: [actor] }) ?? ui.notifications.info('Rest is handled by the system.');
		default: return null;
	}
}

/** A strike by its place in the system's list, or one of its other usages. */
function attackFrom(actor, index, alt) {
	const strike = actor.system?.actions?.[Number(index)];
	return alt === undefined || alt === '' ? strike : strike?.altUsages?.[Number(alt)];
}

const strikeItem = (actor, index) => actor.system?.actions?.[Number(index)]?.item;

async function consumeItem(actor, id) {
	const item = actor.inventory?.get?.(id) ?? actor.items.get(id);
	return item?.type === 'consumable' ? item.consume() : null;
}

async function rollAbility(actor, key) {
	// The system has no bare ability check — skills carry the attribute — so this is a
	// plain d20 plus the modifier, posted the way any other roll is.
	const mod = actor.abilities?.[key]?.mod ?? 0;
	const roll = await new Roll(`1d20 + ${mod}`).evaluate();
	return roll.toMessage({ flavor: `${key.toUpperCase()} check`, speaker: ChatMessage.getSpeaker({ actor }) });
}

/**
 * Casting, as the system's sheet does it: a spell held in an item (a wand, a scroll) spends
 * that item, and anything else is cast through its entry, which spends the slot, focus point
 * or use and refuses if there is none left.
 */
async function castSpell(actor, key) {
	const [entryId, spellId, rank, slotId] = String(key).split(':');
	const collection = actor.spellcasting?.collections?.get(entryId);
	const spell = collection?.get(spellId);
	const castRank = Number(rank);
	if (!spell || !Number.isInteger(castRank) || castRank < 1 || castRank > 10) return;
	return spell.parentItem?.consume() ?? collection.entry.cast(spell, {
		rank: castRank,
		slotId: slotId === '' ? undefined : Number(slotId),
	});
}

/** Restore one prepared slot: the sheet's Restore Spell. */
async function restoreSlot(actor, key) {
	const [entryId, groupId, slotId] = String(key).split(':');
	const group = groupId === 'cantrips' ? groupId : Number(groupId);
	return actor.spellcasting?.collections?.get(entryId)?.setSlotExpendedState(group, Number(slotId), false);
}

/** Refill a rank of slots on a spontaneous or flexible entry: the sheet's reset arrow. */
async function restoreSlots(actor, entryId, groupId) {
	const entry = actor.items.get(entryId);
	const rank = Number(groupId) || 0;
	const slot = entry?.system?.slots?.[`slot${rank}`];
	if (!slot) return;
	return entry.update({ [`system.slots.slot${rank}.value`]: slot.max });
}

/** Refill an innate spell's own uses: the same arrow, on the spell. */
async function restoreUses(actor, spellId) {
	const spell = actor.items.get(spellId);
	const max = spell?.system?.location?.uses?.max;
	if (!max) return;
	return spell.update({ 'system.location.uses.value': max });
}

/** The system's Spell Preparation window, or the one already open for this entry. */
async function openSpellPreparation(actor, entryId) {
	const entry = actor.items.get(entryId);
	if (!entry) return;
	const open = foundry.applications.instances?.get(`spell-preparation-${entry.uuid}`);
	if (open) return open.bringToFront();
	return pressSheetButton(actor, `[data-item-id="${CSS.escape(entryId)}"] [data-action="open-spell-preparation"]`);
}

/**
 * Some of the system's windows are not exposed to modules, only to a button on the character
 * sheet, so that button is what gets pressed: on the open sheet if there is one, or on a sheet
 * drawn out of sight for the moment it takes. If the button cannot be found, the sheet is left
 * showing, so the player still has a way to it.
 *
 * A window placed beside its button finds that button by its data-anchor-id. Give it to `anchor`,
 * the control the player actually pressed, and the window opens there: the sheet's button is out
 * of sight or gone, and the projection comes first in the document, so it is found first.
 */
async function pressSheetButton(actor, selector, anchor = null) {
	const sheet = actor.sheet;
	const wasOpen = sheet.rendered;
	const veil = wasOpen ? null : document.createElement('style');
	if (veil) {
		veil.textContent = `#${CSS.escape(sheet.id)} { visibility: hidden !important; }`;
		document.head.append(veil);
		sheet.render(true);
	}
	let button = null;
	for (let tries = 0; tries < 200 && !button; tries++) {
		button = document.getElementById(sheet.id)?.querySelector(selector) ?? null;
		if (!button) await new Promise((resolve) => setTimeout(resolve, 25));
	}
	try {
		if (anchor && button?.dataset.anchorId) anchor.dataset.anchorId = button.dataset.anchorId;
		if (button) button.click();
		else if (wasOpen) sheet.bringToFront?.();
		if (button && !wasOpen) await sheet.close();
	} finally {
		veil?.remove();
	}
}

/**
 * Change a skill's training, as the dropdowns on the sheet's Proficiencies tab do: a lore
 * keeps it on its own item, and every other skill on the actor.
 */
async function setSkillRank(actor, key, rank) {
	if (!Number.isInteger(rank) || rank < 0 || rank > 4) return;
	const data = actor.system?.skills?.[key];
	if (!data) return;
	if (data.itemId) return actor.items.get(data.itemId)?.update({ 'system.proficient.value': rank });
	return actor.update({ [`system.skills.${key}.rank`]: rank });
}

/**
 * A chat message, as the latest-roll strip shows it, or null if it is not a roll this user may
 * see. The DC and the outcome are shown only as the world lets players see them on the card.
 * @returns {{actorId: string, messageId: string, name: string, formula: string, total: number,
 *   outcome: ?{label: string, tone: string}, dc: ?number, damage: boolean}|null}
 */
export function readRoll(message) {
	const roll = message.rolls?.[0];
	if (!roll || !message.isContentVisible || !message.visible) return null;
	const actor = message.actor;
	if (!actor) return null;
	const context = message.flags?.[game.system.id]?.context ?? null;
	const strike = message._strike ?? null;
	const check = !!message.isCheckRoll;
	const metagame = game.pf2e?.settings?.metagame ?? {};

	let outcome = null;
	if (check && context?.outcome && (game.user.isGM || metagame.results)) {
		const scope = context.dc?.scope ?? 'Check';
		const label = game.i18n.localize(`PF2E.Check.Result.Degree.${scope}.${context.outcome}`);
		outcome = { label, tone: /success/i.test(context.outcome) ? 'good' : 'bad' };
	}
	const dc = check && (game.user.isGM || metagame.dcs) ? context?.dc?.value ?? null : null;
	return {
		actorId: actor.id,
		messageId: message.id,
		name: strike?.label ?? rollName(message),
		formula: roll.formula ?? '',
		total: roll.total,
		outcome,
		dc,
		// only an attack's own check can be followed up from here
		damage: check && !!strike,
	};
}

/** What a roll was for: its card's heading, or the first words of its flavor. */
function rollName(message) {
	const holder = document.createElement('div');
	holder.innerHTML = message.flavor ?? '';
	const heading = holder.querySelector('h4, h3, .action, strong') ?? holder;
	return heading.textContent.replace(/\s+/g, ' ').trim() || 'Roll';
}

/**
 * Roll damage from a message, with what its card's own Damage and Critical buttons pass: the
 * check's context, multiple attack penalty and target are what make it the same attack.
 */
async function latestDamage(messageId, kind, event) {
	const message = game.messages.get(messageId);
	const strike = message?._strike;
	if (!strike) return;
	const context = message.isCheckRoll ? message.flags?.[game.system.id]?.context ?? null : null;
	const mapIncreases = [0, 1, 2].includes(context?.mapIncreases) ? context.mapIncreases : null;
	return strike[kind === 'critical' ? 'critical' : 'damage']?.({
		event,
		altUsage: context?.altUsage ?? null,
		mapIncreases,
		checkContext: context,
		target: message.target?.token?.object ?? null,
	});
}

/** How many results the quick search shows before it says to narrow it down. */
const QUICK_LIMIT = 12;

/**
 * The Inventory tab's quick search: the Compendium Browser's own index and search engine, so it
 * covers the packs the browser is set to and matches as the browser does.
 * @returns {Promise<string>} The results, as markup.
 */
export async function searchItems(text) {
	const tab = game.pf2e?.compendiumBrowser?.tabs?.equipment;
	if (!tab) return '';
	await tab.init();
	const query = foundry.applications.ux.SearchFilter.cleanQuery(text);
	const found = tab.searchEngine.search(query);
	if (!found.length) return '<p class="dimc">Nothing found.</p>';
	const rows = found.slice(0, QUICK_LIMIT).map((entry) => `<div class="li flat qs">
		<img src="${esc(entry.img)}" alt="">
		<span class="grow"><button type="button" class="nm" data-act="viewItem" data-k="${esc(entry.uuid)}" data-tooltip="Open this item's sheet">${esc(entry.name)}</button></span>
		<span class="mono dimc">Lv ${esc(entry.level ?? 0)}</span>
		<span class="mono dimc qs-price">${esc(entry.price?.toString?.() ?? '')}</span>
		${actBtn('Add', 'addItem', entry.uuid, { cls: 'sm ghost', title: 'Add to inventory, free' })}
		${actBtn('Buy', 'buyItem', entry.uuid, { cls: 'sm ghost', title: 'Pay its price and add to inventory' })}</div>`).join('');
	const more = found.length > QUICK_LIMIT
		? `<p class="dimc qs-more">${found.length - QUICK_LIMIT} more. Keep typing to narrow it down, or Browse for all of them.</p>` : '';
	return rows + more;
}

/** An item from a compendium, sized for the actor as the browser's Take does. */
function sizedFor(item, actor) {
	if (item.isOfType('treasure', 'kit')) return item.clone();
	// a small creature uses medium gear
	const natural = actor.system?.traits?.naturalSize ?? actor.size;
	const size = natural === 'sm' ? 'med' : natural;
	if (size === 'med') return item.clone();
	const large = ['lg', 'huge', 'grg'].includes(size);
	return item.clone({ system: { size, price: { sizeSensitive: large && !item.isMagical ? false : undefined } } });
}

/** A compendium result, if it is something an inventory can hold. */
async function physicalItem(uuid) {
	const item = await fromUuid(uuid);
	return item?.isOfType('physical', 'kit') ? item : null;
}

/** Add an item to the inventory as the browser's Take button does: free, and onto a stack if there is one. */
async function addItem(actor, uuid) {
	const item = await physicalItem(uuid);
	if (!item) return;
	await actor.inventory.add(sizedFor(item, actor), { stack: true });
	ui.notifications.info(game.i18n.format('PF2E.CompendiumBrowser.AddedItemToCharacter', { item: item.name, character: actor.name }));
}

/** Buy an item as the browser's Buy button does: the system takes the coins, or says no. */
async function buyItem(actor, uuid) {
	const item = await physicalItem(uuid);
	if (!item) return;
	const words = { item: item.name, character: actor.name };
	if (!(await actor.inventory.removeCoins(item.price.value))) {
		return ui.notifications.warn(game.i18n.format('PF2E.CompendiumBrowser.FailedToBuyItemWithCharacter', words));
	}
	await actor.inventory.add(sizedFor(item, actor), { stack: true });
	ui.notifications.info(game.i18n.format('PF2E.CompendiumBrowser.BoughtItemWithCharacter', words));
}

/** The Compendium Browser's equipment tab, searching for what was typed, if anything. */
async function browseEquipment(text) {
	const tab = game.pf2e?.compendiumBrowser?.tabs?.equipment;
	if (!tab) return;
	const filter = await tab.getFilterData();
	if (filter.search) filter.search.text = String(text ?? '').trim();
	return tab.open({ filter });
}

/**
 * Hand an item to another character, through the same call as dragging it onto their sheet.
 * That one knows the rules: someone who can write to both characters gets a quantity prompt and
 * the item moves, and a player gets the system's trade request to the other player, who has to
 * be online to answer it.
 */
async function giveItem(actor, itemId, targetId, event) {
	const item = actor.items.get(itemId);
	const target = game.actors.get(targetId);
	if (!item || !target) return;
	return actor.sheet.moveItemBetweenActors(event, item, target);
}

/**
 * Carrying, through the system as its sheet's menu does: changeCarryType is what takes other
 * armor off when armor goes on, stows into a container and lowers a raised shield.
 */
async function setCarry(actor, id, choice) {
	const item = actor.items.get(id);
	const change = CARRY[choice];
	if (!item || !change || carryState(item) === choice) return;
	return actor.changeCarryType(item, { handsHeld: 0, inSlot: false, ...change });
}

async function changeQuantity(actor, id, delta) {
	const item = actor.items.get(id);
	if (!item) return;
	return item.update({ 'system.quantity': Math.max(0, (item.quantity ?? 1) + delta) });
}

async function setCondition(actor, slug, value) {
	if (!slug) return;
	if (value === 0) return actor.decreaseCondition?.(slug, { forceRemove: true });
	return value > 0 ? actor.increaseCondition?.(slug) : actor.decreaseCondition?.(slug);
}

/** Set a valued condition to an exact number, adding or removing it as needed. */
async function setConditionValue(actor, slug, value) {
	if (!slug || !Number.isFinite(value)) return;
	if (value <= 0) return actor.decreaseCondition?.(slug, { forceRemove: true });
	// the system changes a value through its condition manager, which keeps the rest in step
	const existing = actor.itemTypes?.condition?.find((c) => c.slug === slug && !c.isLocked);
	const manager = game.pf2e?.ConditionManager;
	if (existing && manager) return manager.updateConditionValue(existing.id, actor, value);
	if (existing) return existing.update({ 'system.value.value': value });
	// a new condition starts at the value asked for
	return actor.increaseCondition?.(slug, { value });
}

async function setHp(actor, value) {
	const hp = actor.system.attributes.hp;
	return actor.update({ 'system.attributes.hp.value': Math.max(0, Math.min(hp.max ?? value, value)) });
}

/** Healing is plain: nothing resists it. */
async function heal(actor, amount) {
	const hp = actor.system.attributes.hp;
	return setHp(actor, (hp.value ?? 0) + Math.abs(amount));
}

/**
 * Damage goes through the system where it can, so temporary hit points, resistances and
 * anything else the system applies are honored. Only if that is unavailable does it fall
 * back to writing the number itself.
 */
async function damage(actor, amount) {
	const value = Math.abs(amount);
	if (typeof actor.applyDamage === 'function') {
		try {
			return await actor.applyDamage({ damage: value, token: actor.getActiveTokens?.()[0]?.document });
		} catch (err) {
			console.warn('sfh | applyDamage refused, writing hit points directly', err);
		}
	}
	return setHp(actor, (actor.system.attributes.hp.value ?? 0) - value);
}

/** What the readout lists about an item: its limited uses, which the sheet shows as "1 / 2 per day". */
export function readoutMeta(item) {
	const uses = item.system?.frequency;
	if (!uses?.max) return [];
	const period = CONFIG.PF2E?.frequencies?.[uses.per];
	const per = period ? ` ${game.i18n.localize('PF2E.Frequency.per')} ${game.i18n.localize(period)}` : '';
	return [['Uses', `${uses.value ?? uses.max} / ${uses.max}${per}`]];
}

/** The system's own description of an item, with its alterations and addenda, as its sheet shows it. */
export async function describe(item) {
	if (!item.getDescription) return null;
	return (await item.getDescription({ secrets: item.isOwner })).value;
}
