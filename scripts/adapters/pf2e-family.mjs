import { esc, sgn, lbl, bar, rollBtn, actBtn, nameBtn, ro, COST_GLYPH } from '../projection/helpers.mjs';

/**
 * Starfinder 2e and Pathfinder 2e.
 *
 * Reads the numbers the projection shows, and turns every button press back into the
 * system's own call — `skill.roll()`, `save.roll()`, `strike.variants[n].roll()` and so on.
 * Nothing is re-implemented: if the system changes how a roll works, this still calls it.
 */

const RANK = ['U', 'T', 'E', 'M', 'L'];

/** Systems this adapter serves. */
export const SYSTEMS = ['pf2e', 'sf2e'];

export const TABS = [
	{ id: 'character', label: 'Character' },
	{ id: 'actions', label: 'Actions' },
	{ id: 'inventory', label: 'Inventory' },
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
		})),
		tabs: TABS,
	};
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
			${actBtn('Damage', 'damage', String(index), { cls: 'sm ghost' })}
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
	const rows = [...groups].map(([name, items]) => `<div class="sec">${esc(name)}</div>` + items.map((item) => `<div class="li flat">
		<span class="grow">${nameBtn(item.name, `item:${item.id}`)}</span>
		<span class="row" style="gap:3px">
			${actBtn('−', 'qty', `${item.id}:-1`, { cls: 'sm' })}
			<span class="mono" style="width:26px;text-align:center">${item.quantity ?? 1}</span>
			${actBtn('+', 'qty', `${item.id}:1`, { cls: 'sm' })}
		</span>
		<span class="mono dimc" style="width:34px;text-align:right">${item.system?.bulk?.value ?? '—'}</span>
		${actBtn(item.isEquipped ? 'Equipped' : 'Equip', 'equip', item.id, { cls: `sm ${item.isEquipped ? 'on' : ''}` })}</div>`).join('')).join('');
	return `${head}<div class="row sp">${lbl('Currency')}<span class="big" style="font-size:20px">${esc(actor.inventory?.coins?.toString?.() ?? '')}</span></div>${rows}`;
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
		return `<div class="li flat">
			<span class="rk ${rank}">${rank}</span>
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
		case 'damage': return actor.system?.actions?.[Number(a)]?.damage?.({ event });
		case 'critical': return actor.system?.actions?.[Number(a)]?.critical?.({ event });
		case 'use': return actor.items.get(key)?.toMessage?.(event);
		case 'equip': return toggleEquip(actor, key);
		case 'qty': return changeQuantity(actor, a, Number(b));
		case 'delete': return actor.items.get(key)?.delete();
		case 'cond': return setCondition(actor, a, Number(b));
		case 'heal': return heal(actor, Number(key));
		case 'damage': return damage(actor, Number(key));
		case 'setHp': return setHp(actor, Number(key));
		case 'setMax': return actor.update({ 'system.attributes.hp.max': Math.max(1, Number(key)) });
		case 'setTemp': return actor.update({ 'system.attributes.hp.temp': Math.max(0, Number(key)) });
		case 'hero': return actor.update({ 'system.resources.heroPoints.value': Number(key) });
		case 'stat': return actor.update({ [`system.attributes.${a}.value`]: Math.max(0, Number(b)) });
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

async function toggleEquip(actor, id) {
	const item = actor.items.get(id);
	if (!item) return;
	const carry = item.system?.equipped?.carryType === 'worn' ? 'held' : 'worn';
	return item.update({ 'system.equipped.carryType': carry, 'system.equipped.handsHeld': carry === 'held' ? 1 : 0 });
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
