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
		speed: sys.attributes?.speed?.value ?? 25,
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
	out.push({ label: 'Speed', value: `${sys.attributes?.speed?.value ?? 25} ft` });
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
	const strikes = (actor.system?.actions ?? []).filter((s) => s.ready !== false).map(strikeRow).join('');
	const byCost = (item) => {
		const type = item.system?.actionType?.value;
		const n = item.system?.actions?.value;
		return type === 'reaction' ? 'R' : type === 'free' ? 'F' : String(n ?? 1);
	};
	const row = (item) => `<div class="li">
		<span class="cost">${COST_GLYPH[byCost(item)] ?? ''}</span>
		<span class="grow">${nameBtn(item.name, `item:${item.id}`)}</span>
		${(item.system?.traits?.value ?? []).slice(0, 2).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}
		${actBtn('Use', 'use', item.id, { cls: 'sm ghost' })}</div>`;
	const acts = (actor.itemTypes?.action ?? []).map(row).join('');
	return `<div class="sec">Strikes</div>${strikes || '<p class="dimc">No strikes.</p>'}
		<div class="sec">Actions</div><div class="grid2">${acts || '<p class="dimc">None.</p>'}</div>`;
}

function strikeRow(strike, index) {
	const map = strike.variants?.map((v, i) => rollBtn(v.label ?? sgn(strike.totalModifier ?? 0), 'strike', `${index}:${i}`, i ? '' : 'on')).join('') ?? '';
	return `<div class="li" style="flex-wrap:wrap;gap:8px 10px;padding:8px 10px">
		<div class="grow" style="min-width:150px;display:flex;flex-direction:column;gap:2px">
			${nameBtn(strike.label ?? strike.slug ?? 'Strike', `strike:${index}`)}
			<span class="sub">${esc((strike.traits ?? []).map((t) => t.label ?? t).slice(0, 3).join(' · '))}</span>
		</div>
		<div class="row" style="gap:4px">${map}</div>
		<div class="row" style="gap:4px">
			${actBtn('Damage', 'strikeDamage', String(index), { cls: 'sm ghost' })}
			${actBtn('Critical', 'critical', String(index), { cls: 'sm ghost' })}
		</div></div>`;
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
	const rows = [...groups].map(([name, items]) => `<div class="sec">${esc(name)}</div>` + items.map((item) => `<div class="li flat">
		<span class="grow">${nameBtn(item.name, `item:${item.id}`)}</span>
		<span class="row" style="gap:3px">
			${actBtn('−', 'qty', `${item.id}:-1`, { cls: 'sm' })}
			<span class="mono" style="width:26px;text-align:center">${item.quantity ?? 1}</span>
			${actBtn('+', 'qty', `${item.id}:1`, { cls: 'sm' })}
		</span>
		<span class="mono dimc" style="width:34px;text-align:right">${item.system?.bulk?.value ?? '—'}</span>
		${investToggle(item)}${carryPicker(actor, item)}</div>`).join('')).join('');
	// a quick search that adds from its results, and the system's own Compendium Browser for more
	const search = `<div class="row sfh-browse">
		<input class="sfh-in grow" type="search" data-browse="1" placeholder="Quick search: type to find equipment" aria-label="Quick search for equipment">
		${actBtn('Browse', 'browseEquipment', '', { cls: 'sm ghost', title: 'Open the Compendium Browser' })}</div>
		<div class="sfh-results" aria-live="polite"></div>`;
	return `${search}${head}${investedRow}<div class="row sp">${lbl('Currency')}<span class="big" style="font-size:20px">${esc(actor.inventory?.coins?.toString?.() ?? '')}</span></div>${rows}`;
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
	return entries.sort((a, b) => a.sort - b.sort).map(spellEntry).join('');
}

const SPELL_COST = { 1: '1', 2: '2', 3: '3', reaction: 'R', free: 'F' };

function spellEntry(entry) {
	const stat = entry.statistic ?? {};
	const tradition = entry.tradition ? game.i18n.localize(CONFIG.PF2E?.magicTraditions?.[entry.tradition] ?? entry.tradition) : '';
	const kv = (k, v) => `<div class="kv">${lbl(k)}<b class="mono">${v}</b></div>`;
	const head = `<div class="sec">${esc(entry.name)}</div>
		<div class="row" style="gap:10px;flex-wrap:wrap">
			${tradition ? `<div class="kv">${lbl('Tradition')}<b>${esc(tradition)}</b></div>` : ''}
			${stat.check ? `<div class="kv">${lbl('Spell attack')}${rollBtn(sgn(stat.check.mod ?? 0), 'spellAttack', entry.id)}</div>` : ''}
			${stat.dc ? kv('Save DC', stat.dc.value ?? '—') : ''}
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

function feats(actor) {
	const groups = [['Class', 'class'], ['Ancestry', 'ancestry'], ['General', 'general'], ['Skill', 'skill'], ['Bonus', 'bonus']];
	return groups.map(([label, category]) => {
		const items = (actor.itemTypes?.feat ?? []).filter((f) => (f.system?.category ?? f.system?.featType?.value) === category);
		if (!items.length) return '';
		return `<div class="sec">${label}</div>` + items.map((f) => `<div class="li">
			<span class="mono dimc" style="width:22px">${f.system?.level?.value ?? ''}</span>
			<span class="grow">${nameBtn(f.name, `item:${f.id}`)}</span>
			${(f.system?.traits?.value ?? []).slice(0, 2).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>`).join('');
	}).join('') || '<p class="dimc">No feats.</p>';
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

function biography(actor) {
	const bio = actor.system?.details?.biography ?? {};
	const field = (key, label) => `<label class="lbl">${esc(label)}</label>
		<div class="ta" style="min-height:64px;white-space:pre-wrap">${esc(stripHtml(bio[key] ?? ''))}</div>`;
	return field('appearance', 'Appearance') + field('backstory', 'Backstory');
}

const stripHtml = (html) => String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/* -------------------------------------------- */
/*  Acting                                       */
/* -------------------------------------------- */

/**
 * Every button in the projection ends up here, and every branch hands straight back to
 * the system. `event` is passed through so shift/ctrl keep their usual meaning.
 */
export async function act(actor, action, key, event) {
	const [a, b] = String(key ?? '').split(':');
	switch (action) {
		case 'skill': return actor.skills?.[key]?.roll({ event });
		case 'save': return actor.saves?.[key]?.roll({ event });
		case 'perception': return (actor.perception ?? actor.system?.attributes?.perception)?.roll({ event });
		case 'initiative': return actor.initiative?.roll({ event }) ?? actor.rollInitiative?.({ createCombatants: true });
		case 'ability': return actor.abilities?.[key] ? rollAbility(actor, key) : null;
		case 'strike': return actor.system?.actions?.[Number(a)]?.variants?.[Number(b)]?.roll({ event });
		case 'strikeDamage': return actor.system?.actions?.[Number(a)]?.damage?.({ event });
		case 'critical': return actor.system?.actions?.[Number(a)]?.critical?.({ event });
		case 'use': return actor.items.get(key)?.toMessage?.(event);
		case 'cast': return castSpell(actor, key);
		case 'restoreSlot': return restoreSlot(actor, key);
		case 'restoreSlots': return restoreSlots(actor, a, b);
		case 'restoreUses': return restoreUses(actor, key);
		case 'prepareSpells': return openSpellPreparation(actor, key);
		case 'setRank': return setSkillRank(actor, a, Number(b));
		case 'browseEquipment': return browseEquipment(key);
		case 'addItem': return addItem(actor, key);
		case 'buyItem': return buyItem(actor, key);
		case 'viewItem': return (await fromUuid(key))?.sheet?.render(true);
		case 'spellAttack': return actor.spellcasting?.get(key)?.statistic?.check?.roll({ event });
		case 'setCarry': return setCarry(actor, a, b);
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

/**
 * The system's Spell Preparation window. It is not exposed to modules, only to a button on
 * the character sheet, so that button is what gets pressed: on the open sheet if there is one,
 * or on a sheet drawn out of sight for the moment it takes. If the button cannot be found,
 * the sheet is left showing, so the player still has a way to it.
 */
async function openSpellPreparation(actor, entryId) {
	const entry = actor.items.get(entryId);
	if (!entry) return;
	const open = foundry.applications.instances?.get(`spell-preparation-${entry.uuid}`);
	if (open) return open.bringToFront();

	const sheet = actor.sheet;
	const wasOpen = sheet.rendered;
	const veil = wasOpen ? null : document.createElement('style');
	if (veil) {
		veil.textContent = `#${CSS.escape(sheet.id)} { visibility: hidden !important; }`;
		document.head.append(veil);
		sheet.render(true);
	}
	const selector = `[data-item-id="${CSS.escape(entryId)}"] [data-action="open-spell-preparation"]`;
	let button = null;
	for (let tries = 0; tries < 200 && !button; tries++) {
		button = document.getElementById(sheet.id)?.querySelector(selector) ?? null;
		if (!button) await new Promise((resolve) => setTimeout(resolve, 25));
	}
	try {
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
 * anything else the system applies are honoured. Only if that is unavailable does it fall
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
