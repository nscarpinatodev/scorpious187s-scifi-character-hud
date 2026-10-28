import { esc, sgn, lbl, rollBtn, actBtn, nameBtn, COST_GLYPH } from '../projection/helpers.mjs';

/**
 * D&D 5e (system 5.x–6.x).
 *
 * Same contract as the PF2e adapter: read the numbers, and hand every press back to the
 * system — `rollSkill`, `rollSavingThrow`, `rollHitDie`, `item.use()`.
 */

export const SYSTEMS = ['dnd5e'];

export const TABS = [
	{ id: 'details', label: 'Details' },
	{ id: 'inventory', label: 'Inventory' },
	{ id: 'features', label: 'Features' },
	{ id: 'spells', label: 'Spells' },
	{ id: 'effects', label: 'Effects' },
	{ id: 'biography', label: 'Biography' },
];

/* -------------------------------------------- */
/*  Reading                                      */
/* -------------------------------------------- */

export function read(actor) {
	const sys = actor.system ?? {};
	const hp = sys.attributes?.hp ?? {};
	const classes = Object.values(actor.classes ?? {}).map((c) => `${c.name} ${c.system?.levels ?? ''}`.trim());

	return {
		system: 'dnd5e',
		id: actor.id,
		name: actor.name,
		sub: [sys.details?.race ?? actor.race?.name, sys.details?.background ?? actor.background?.name, classes.join(' / ')]
			.filter(Boolean).join(' · '),
		level: sys.details?.level ?? 1,
		xp: { value: sys.details?.xp?.value ?? 0, max: sys.details?.xp?.max ?? 300 },
		hp: { value: hp.value ?? 0, max: hp.max ?? 0, temp: hp.temp ?? 0 },
		ac: sys.attributes?.ac?.value ?? 10,
		speed: sys.attributes?.movement?.walk ?? 30,
		defenses: defenses(actor),
		vitals: {
			kind: 'dnd5e',
			hd: { value: sys.attributes?.hd?.value ?? 0, max: sys.attributes?.hd?.max ?? sys.details?.level ?? 0 },
			death: { success: sys.attributes?.death?.success ?? 0, failure: sys.attributes?.death?.failure ?? 0 },
			inspiration: !!sys.attributes?.inspiration,
			exhaustion: sys.attributes?.exhaustion ?? 0,
		},
		// a status effect is a condition, and is listed once, as one
		effects: actor.effects.filter((e) => !e.disabled && !e.statuses?.size).map((e) => ({
			id: e.id,
			name: e.name,
			duration: e.duration?.label ?? '',
		})),
		conditions: actor.effects.filter((e) => e.statuses?.size).map((e) => ({
			id: e.id,
			name: e.name,
			value: null,
			slug: [...(e.statuses ?? [])][0] ?? e.name,
		})),
		conditionChoices: conditionChoices(actor),
		tabs: TABS,
	};
}

/**
 * What the "+ Add condition" picker offers: the list 5e's own sheet shows, without its
 * pseudo-conditions, without exhaustion (the vitals panel counts it), and without anything
 * already on.
 */
function conditionChoices(actor) {
	return Object.entries(CONFIG.DND5E?.conditionTypes ?? {})
		.filter(([id, c]) => !c.pseudo && id !== 'exhaustion' && !actor.statuses?.has(id))
		.map(([id, c]) => ({ id, label: game.i18n.localize(c.name) }))
		.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));
}

function defenses(actor) {
	const sys = actor.system ?? {};
	return [
		{ label: 'AC', value: sys.attributes?.ac?.value ?? 10, lead: true },
		{ label: 'Initiative', value: sgn(sys.attributes?.init?.total ?? 0), act: 'initiative', k: '' },
		{ label: 'Speed', value: `${sys.attributes?.movement?.walk ?? 30} ft` },
		{ label: 'Prof', value: sgn(sys.attributes?.prof ?? 2) },
		{ label: 'Passive', value: sys.skills?.prc?.passive ?? 10 },
		{ label: 'Spell DC', value: sys.attributes?.spelldc ?? 10 },
	];
}

/* -------------------------------------------- */
/*  Tab bodies                                   */
/* -------------------------------------------- */

export function tabBody(actor, tab) {
	switch (tab) {
		case 'details': return details(actor);
		case 'inventory': return inventory(actor);
		case 'features': return features(actor);
		case 'spells': return spells(actor);
		case 'effects': return effects(actor);
		case 'biography': return biography(actor);
		default: return '<p class="dimc">Nothing here.</p>';
	}
}

function details(actor) {
	const sys = actor.system ?? {};
	const abilities = Object.entries(sys.abilities ?? {}).map(([key, a]) => `<div class="cell" style="padding:8px 4px;gap:4px">
		${lbl(key)}
		<button type="button" class="b roll" style="font-size:22px;min-height:36px" data-act="ability" data-k="${key}">${sgn(a.mod ?? 0)}</button>
		<span class="mono dimc" style="font-size:13px">${a.value ?? 10}</span>
		<button type="button" class="b sm" data-act="save" data-k="${key}">${a.proficient ? '●' : '○'} save ${sgn(a.save?.value ?? a.save ?? 0)}</button>
	</div>`).join('');
	const skills = Object.entries(sys.skills ?? {}).map(([key, s]) => `<div class="li flat" style="min-height:32px">
		<span style="width:14px;color:${s.value >= 2 ? 'var(--hot)' : s.value ? 'var(--acc)' : 'var(--line)'}">${s.value >= 2 ? '◆' : s.value ? '●' : '○'}</span>
		<span class="grow">${nameBtn(CONFIG.DND5E?.skills?.[key]?.label ?? key, `skill:${key}`)}</span>
		<span class="mono dimc" style="width:30px">${String(s.ability ?? '').toUpperCase()}</span>
		${rollBtn(sgn(s.total ?? 0), 'skill', key)}</div>`).join('');
	return `<div class="grid6">${abilities}</div>
		<div class="sec">Skills</div><div class="grid2" style="gap:0 12px">${skills}</div>`;
}

function inventory(actor) {
	const weapons = (actor.itemTypes?.weapon ?? []).map((item) => `<div class="li">
		<span class="grow">${nameBtn(item.name, `item:${item.id}`)}</span>
		${actBtn('Use', 'use', item.id, { cls: 'sm ghost on' })}</div>`).join('');
	const groups = [['Equipment', 'equipment'], ['Consumables', 'consumable'], ['Tools', 'tool'], ['Loot', 'loot'], ['Containers', 'container']];
	const rows = groups.map(([label, type]) => {
		const items = actor.itemTypes?.[type] ?? [];
		if (!items.length) return '';
		return `<div class="sec">${label}</div>` + items.map((item) => `<div class="li flat">
			<span class="grow">${nameBtn(item.name, `item:${item.id}`)}</span>
			<span class="row" style="gap:3px">
				${actBtn('−', 'qty', `${item.id}:-1`, { cls: 'sm' })}
				<span class="mono" style="width:26px;text-align:center">${item.system?.quantity ?? 1}</span>
				${actBtn('+', 'qty', `${item.id}:1`, { cls: 'sm' })}
			</span>
			<span class="mono dimc" style="width:44px;text-align:right">${item.system?.weight?.value ?? 0} lb</span>
			${actBtn(item.system?.equipped ? 'Equipped' : 'Equip', 'equip', item.id, { cls: `sm ${item.system?.equipped ? 'on' : ''}` })}</div>`).join('');
	}).join('');
	const currency = Object.entries(actor.system?.currency ?? {}).map(([k, v]) => `<div class="kv" style="align-items:center">${lbl(k)}<b class="mono">${v}</b></div>`).join('');
	return `<div class="grid3" style="grid-template-columns:repeat(5,minmax(0,1fr))">${currency}</div>
		<div class="sec">Attacks</div>${weapons || '<p class="dimc">None.</p>'}${rows}`;
}

function features(actor) {
	const feats = actor.itemTypes?.feat ?? [];
	if (!feats.length) return '<p class="dimc">No features.</p>';
	return `<div class="sec">Features</div>` + feats.map((item) => {
		const uses = item.system?.uses;
		return `<div class="li">
			<span class="cost">${COST_GLYPH[item.system?.activation?.type === 'bonus' ? 'B' : item.system?.activation?.type === 'reaction' ? 'R' : 'A'] ?? ''}</span>
			<span class="grow">${nameBtn(item.name, `item:${item.id}`)}</span>
			${uses?.max ? `<span class="mono dimc">${uses.value ?? 0}/${uses.max}</span>` : ''}
			${actBtn('Use', 'use', item.id, { cls: 'sm ghost' })}</div>`;
	}).join('');
}

function spells(actor) {
	const bySlot = new Map();
	for (const spell of actor.itemTypes?.spell ?? []) {
		const level = spell.system?.level ?? 0;
		if (!bySlot.has(level)) bySlot.set(level, []);
		bySlot.get(level).push(spell);
	}
	if (!bySlot.size) return '<p class="dimc">No spells.</p>';
	const slots = Object.entries(actor.system?.spells ?? {})
		.filter(([, s]) => s?.max)
		.map(([key, s]) => `<div class="kv">${lbl(key.replace('spell', 'Level '))}<b class="mono">${s.value}/${s.max}</b></div>`)
		.join('');
	const lists = [...bySlot.entries()].sort((a, b) => a[0] - b[0]).map(([level, items]) =>
		`<div class="sec">${level ? `Level ${level}` : 'Cantrips'}</div>` + items.map((spell) => `<div class="li">
			<span class="grow">${nameBtn(spell.name, `item:${spell.id}`)}</span>
			${actBtn('Cast', 'use', spell.id, { cls: 'sm ghost' })}</div>`).join('')).join('');
	return `<div class="row" style="gap:10px;flex-wrap:wrap">${slots}</div>${lists}`;
}

function effects(actor) {
	const rows = actor.effects.map((e) => `<div class="li">
		<span class="grow">${nameBtn(e.name, `effect:${e.id}`)}</span>
		<span class="mono dimc">${esc(e.duration?.label ?? '')}</span>
		${actBtn(e.disabled ? 'Enable' : 'Disable', 'toggleEffect', e.id, { cls: `sm ${e.disabled ? '' : 'on'}` })}
		${actBtn('Remove', 'deleteEffect', e.id, { cls: 'sm' })}</div>`).join('');
	return `<div class="sec">Effects</div>${rows || '<p class="dimc">None.</p>'}`;
}

function biography(actor) {
	const bio = actor.system?.details?.biography ?? {};
	const strip = (html) => String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
	return `<label class="lbl">Appearance</label><div class="ta" style="min-height:64px;white-space:pre-wrap">${esc(actor.system?.details?.appearance ?? '')}</div>
		<label class="lbl">Backstory</label><div class="ta" style="min-height:120px;white-space:pre-wrap">${esc(strip(bio.value))}</div>`;
}

/* -------------------------------------------- */
/*  Acting                                       */
/* -------------------------------------------- */

export async function act(actor, action, key, event) {
	const [a, b] = String(key ?? '').split(':');
	switch (action) {
		case 'skill': return actor.rollSkill?.({ skill: key, event });
		case 'ability': return actor.rollAbilityCheck?.({ ability: key, event });
		case 'save': return actor.rollSavingThrow?.({ ability: key, event });
		case 'initiative': return actor.rollInitiativeDialog?.({ event }) ?? actor.rollInitiative?.({ createCombatants: true });
		case 'use': return actor.items.get(key)?.use?.({}, { event });
		case 'hd': return actor.rollHitDie?.();
		case 'death': return actor.rollDeathSave?.({ event });
		case 'insp': return actor.update({ 'system.attributes.inspiration': !actor.system.attributes.inspiration });
		case 'rest': return key === 'short' ? actor.shortRest?.() : actor.longRest?.();
		case 'equip': return toggleEquip(actor, key);
		case 'qty': return changeQuantity(actor, a, Number(b));
		case 'toggleEffect': return toggleEffect(actor, key);
		case 'deleteEffect': return actor.effects.get(key)?.delete();
		case 'addCondition': return actor.toggleStatusEffect?.(key, { active: true });
		case 'heal': return applyDamage(actor, -Math.abs(Number(key)));
		case 'damage': return applyDamage(actor, Math.abs(Number(key)));
		case 'setHp': return setHp(actor, Number(key));
		case 'setMax': return actor.update({ 'system.attributes.hp.max': Math.max(1, Number(key)) });
		case 'setTemp': return actor.update({ 'system.attributes.hp.temp': Math.max(0, Number(key)) });
		case 'stat': return actor.update({ [`system.attributes.${a}`]: Math.max(0, Number(b)) });
		default: return null;
	}
}

async function toggleEquip(actor, id) {
	const item = actor.items.get(id);
	if (!item) return;
	return item.update({ 'system.equipped': !item.system.equipped });
}

async function changeQuantity(actor, id, delta) {
	const item = actor.items.get(id);
	if (!item) return;
	return item.update({ 'system.quantity': Math.max(0, (item.system.quantity ?? 1) + delta) });
}

async function toggleEffect(actor, id) {
	const effect = actor.effects.get(id);
	if (!effect) return;
	return effect.update({ disabled: !effect.disabled });
}

async function setHp(actor, value) {
	const hp = actor.system.attributes.hp;
	return actor.update({ 'system.attributes.hp.value': Math.max(0, Math.min(hp.max ?? value, value)) });
}

/**
 * 5e's own damage application: it spends temporary hit points, applies resistance and
 * immunity, and a negative amount heals. If it is not there, write the number instead.
 */
async function applyDamage(actor, amount) {
	if (typeof actor.applyDamage === 'function') {
		try {
			return await actor.applyDamage(amount);
		} catch (err) {
			console.warn('sfh | applyDamage refused, writing hit points directly', err);
		}
	}
	return setHp(actor, (actor.system.attributes.hp.value ?? 0) - amount);
}
