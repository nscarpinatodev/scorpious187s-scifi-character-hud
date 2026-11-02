import { esc, sgn, lbl, rollBtn, actBtn, nameBtn, ro, COST_GLYPH } from '../projection/helpers.mjs';
import { MOD } from '../constants.mjs';

/**
 * D&D 5e (system 5.x–6.x).
 *
 * Same contract as the PF2e adapter: read the numbers, and hand every press back to the
 * system — `rollSkill`, `rollSavingThrow`, `rollHitDie`, `item.use()`. Where the system's sheet
 * works something out, such as how spells are grouped by what they cast from, this follows it.
 */

export const SYSTEMS = ['dnd5e'];

export const TABS = [
	{ id: 'details', label: 'Details' },
	{ id: 'actions', label: 'Actions' },
	{ id: 'inventory', label: 'Inventory' },
	{ id: 'spells', label: 'Spells' },
	{ id: 'features', label: 'Features' },
	{ id: 'effects', label: 'Effects' },
	{ id: 'biography', label: 'Biography' },
];

const loc = (key) => game.i18n.localize(key);

/** An item's activities: what it can do when used. */
const activitiesOf = (item) => [...(item.system?.activities ?? [])];

/** How long using it takes: its first activity's, which is what the sheet files it under. */
const activationOf = (item) => activitiesOf(item)[0]?.activation?.type ?? item.system?.activation?.type ?? '';

const glyphFor = (type) => COST_GLYPH[{ action: 'A', bonus: 'B', reaction: 'R' }[type]] ?? '';

/* -------------------------------------------- */
/*  Reading                                      */
/* -------------------------------------------- */

export function read(actor) {
	const sys = actor.system ?? {};
	const hp = sys.attributes?.hp ?? {};
	const classes = Object.values(actor.classes ?? {}).map((c) => `${c.name} ${c.system?.levels ?? ''}`.trim());
	// each is an item once the character has one, and the old free text before that
	const named = (value) => (typeof value === 'string' ? value : value?.name);

	return {
		system: 'dnd5e',
		id: actor.id,
		name: actor.name,
		sub: [named(sys.details?.race), named(sys.details?.background), classes.join(' / ')].filter(Boolean).join(' · '),
		level: sys.details?.level ?? 1,
		xp: { value: sys.details?.xp?.value ?? 0, max: sys.details?.xp?.max ?? 300 },
		hp: { value: hp.value ?? 0, max: hp.effectiveMax ?? hp.max ?? 0, temp: hp.temp ?? 0 },
		ac: sys.attributes?.ac?.value ?? 10,
		speed: sys.attributes?.movement?.walk ?? 30,
		defenses: defenses(actor),
		vitals: {
			kind: 'dnd5e',
			hd: { value: sys.attributes?.hd?.value ?? 0, max: sys.attributes?.hd?.max ?? sys.details?.level ?? 0 },
			death: { success: sys.attributes?.death?.success ?? 0, failure: sys.attributes?.death?.failure ?? 0 },
			inspiration: !!sys.attributes?.inspiration,
			exhaustion: { value: sys.attributes?.exhaustion ?? 0, max: CONFIG.DND5E?.conditionTypes?.exhaustion?.levels ?? 6 },
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
		{ label: 'Spell DC', value: sys.attributes?.spell?.dc ?? sys.attributes?.spelldc ?? 10 },
	];
}

/* -------------------------------------------- */
/*  Tab bodies                                   */
/* -------------------------------------------- */

export function tabBody(actor, tab) {
	switch (tab) {
		case 'details': return details(actor);
		case 'actions': return actions(actor);
		case 'inventory': return inventory(actor);
		case 'features': return features(actor);
		case 'spells': return spells(actor);
		case 'effects': return effects(actor);
		case 'biography': return biography(actor);
		default: return '<p class="dimc">Nothing here.</p>';
	}
}

/** The sheet's proficiency levels, as the same picker as PF2e's training ranks. */
const PROFICIENCY = [[0, 'U', '–'], [0.5, 'T', '½'], [1, 'E', 'P'], [2, 'L', 'E']];

function proficiencyPicker(path, value, label) {
	const current = PROFICIENCY.find(([v]) => v === value) ?? PROFICIENCY[0];
	const name = (v) => loc(CONFIG.DND5E?.proficiencyLevels?.[v] ?? '');
	const options = PROFICIENCY.map(([v, , mark]) => `<option value="${v}" title="${esc(name(v))}"${v === current[0] ? ' selected' : ''}>${mark}</option>`).join('');
	return `<select class="rk rk-sel ${current[1]}" data-pick="rank" data-k="${esc(path)}" aria-label="${esc(`${label} proficiency`)}"
		data-tooltip="${esc(`${name(current[0])}: change proficiency`)}">${options}</select>`;
}

/** A trait's label, in the system's words. */
const traitLabel = (key, trait) => globalThis.dnd5e?.documents?.Trait?.keyLabel?.(key, { trait }) ?? key;

/** What the sheet lists under its traits: senses, languages, and what the character shrugs off. */
function traitRows(actor) {
	const sys = actor.system ?? {};
	const senses = sys.attributes?.senses ?? {};
	const ranges = senses.ranges ?? senses;
	const seen = Object.entries(CONFIG.DND5E?.senses ?? {}).filter(([k]) => ranges[k]).map(([k, s]) => `${loc(s.label ?? s)} ${ranges[k]} ${senses.units ?? 'ft'}`);
	const custom = (text) => String(text ?? '').split(';').map((s) => s.trim()).filter(Boolean);
	const listed = (trait, data) => [...(data?.value ?? [])].map((k) => traitLabel(k, trait)).concat(custom(data?.custom));
	const rows = [
		['Senses', [...seen, ...custom(senses.special)]],
		['Languages', listed('languages', sys.traits?.languages)],
		['Resistances', listed('dr', sys.traits?.dr)],
		['Immunities', listed('di', sys.traits?.di)],
		['Vulnerabilities', listed('dv', sys.traits?.dv)],
		['Condition Immunities', listed('ci', sys.traits?.ci)],
	].filter(([, values]) => values.length);
	return rows.map(([label, values]) => `<div class="kv">${lbl(label)}<b>${esc(values.join(', '))}</b></div>`).join('');
}

function details(actor) {
	const sys = actor.system ?? {};
	const abilities = Object.entries(sys.abilities ?? {}).map(([key, a]) => `<div class="cell" style="padding:8px 4px;gap:4px">
		${lbl(key)}
		<button type="button" class="b roll" style="font-size:22px;min-height:36px" data-act="ability" data-k="${key}">${sgn(a.mod ?? 0)}</button>
		<span class="mono dimc" style="font-size:13px">${a.value ?? 10}</span>
		<button type="button" class="b sm" data-act="save" data-k="${key}">${a.proficient ? '●' : '○'} save ${sgn(a.save?.value ?? a.save ?? 0)}</button>
	</div>`).join('');
	const byLabel = (a, b) => a.label.localeCompare(b.label, game.i18n.lang);
	const rows = (group, labelOf, act) => Object.entries(sys[group] ?? {})
		.map(([key, s]) => ({ key, s, label: labelOf(key) }))
		.sort(byLabel)
		.map(({ key, s, label }) => `<div class="li flat" style="min-height:32px">
			${proficiencyPicker(`${group}.${key}`, s.value ?? 0, label)}
			<span class="grow">${nameBtn(label, `skill:${label}`)}</span>
			<span class="mono dimc" style="width:30px">${esc(String(s.ability ?? '').toUpperCase())}</span>
			${rollBtn(sgn(s.total ?? 0), act, key)}</div>`).join('');
	const skills = rows('skills', (key) => loc(CONFIG.DND5E?.skills?.[key]?.label ?? key), 'skill');
	const tools = rows('tools', (key) => traitLabel(key, 'tool'), 'tool');
	const concentration = sys.attributes?.concentration?.save;
	const traits = traitRows(actor);
	return `<div class="grid6">${abilities}</div>
		<div class="row sp">${lbl('Skills')}<span class="dimc" style="font-size:12px">– none · ½ half · P proficient · E expertise</span></div>
		<div class="grid2" style="gap:0 12px">${skills}</div>
		${tools ? `<div class="sec">Tools</div><div class="grid2" style="gap:0 12px">${tools}</div>` : ''}
		${concentration != null ? `<div class="li flat"><span class="grow">${lbl(loc('DND5E.Concentration'))}</span>${rollBtn(sgn(concentration), 'concentration', '')}</div>` : ''}
		${traits ? `<div class="sec">Traits</div><div class="grid2">${traits}</div>` : ''}`;
}

/**
 * Out of uses, if everything it can do spends them. 5e lets an activity that spends nothing go
 * ahead whatever the count, so an item with one of those stays usable.
 */
function isSpent(item) {
	const uses = item.system?.uses;
	if (!uses?.max || (uses.value ?? 0) > 0) return false;
	const activities = activitiesOf(item);
	return activities.length > 0 && activities.every((a) => [...(a.consumption?.targets ?? [])].some((t) => t.type === 'itemUses'));
}

/** Use, or what stands in for it: a recharge roll while it is on cooldown, crossed out with no uses left. */
function useButton(item, text = 'Use') {
	if (item.isOnCooldown) return actBtn('Recharge', 'recharge', item.id, { cls: 'sm ghost', title: 'Roll to recharge' });
	if (isSpent(item)) return actBtn(text, 'use', item.id, { cls: 'sm ghost spent', title: 'No uses left', disabled: true });
	return actBtn(text, 'use', item.id, { cls: 'sm ghost' });
}

/** One row of an even grid: what it costs, its name and Use. The rest is in the readout. */
const actionRow = (item, extra = '', text = 'Use') => `<div class="li sfh-action" ${ro(`item:${item.id}`)}>
	<span class="cost">${glyphFor(activationOf(item))}</span>
	<span class="grow">${nameBtn(item.name, `item:${item.id}`)}</span>
	${extra}${useButton(item, text)}</div>`;

/** A feature with something to use, as the sheet's Active group has it. */
const isActive = (item) => activitiesOf(item).length > 0 && !item.system?.properties?.has?.('trait');

/** A weapon's attack, with its to-hit and its damage on the buttons. */
function attackRow(item) {
	const attack = item.system?.activities?.getByType?.('attack')?.[0];
	const toHit = parseInt(item.labels?.modifier);
	const facts = [item.labels?.range, attack?.labels?.damage ?? item.labels?.damage].filter(Boolean).join(' · ');
	const buttons = attack
		? `${actBtn(Number.isNaN(toHit) ? 'Attack' : sgn(toHit), 'attack', item.id, { cls: 'roll', title: 'Attack' })}${actBtn('Damage', 'weaponDamage', item.id, { cls: 'sm ghost' })}`
		: useButton(item);
	return `<div class="li" style="flex-wrap:wrap;gap:8px 10px" ${ro(`item:${item.id}`)}>
		<div class="grow" style="min-width:150px;display:flex;flex-direction:column;gap:2px">
			${nameBtn(item.name, `item:${item.id}`)}
			${facts ? `<span class="sub">${esc(facts)}</span>` : ''}
		</div>${buttons}</div>`;
}

/** A favorite, on the same even row as everything else. What it can do depends on what it is. */
function favoriteRow(actor, { type, id }) {
	const row = (key, glyph, name, button) => `<div class="li sfh-action" ${key ? ro(key) : ''}>
		<span class="cost">${glyph}</span><span class="grow">${key ? nameBtn(name, key) : `<b>${esc(name)}</b>`}</span>${button}</div>`;
	if (type === 'skill' || type === 'tool') {
		const entry = actor.system?.[`${type}s`]?.[id];
		if (!entry) return '';
		const label = type === 'skill' ? loc(CONFIG.DND5E?.skills?.[id]?.label ?? id) : traitLabel(id, 'tool');
		return row(`skill:${label}`, '', label, rollBtn(sgn(entry.total ?? 0), type, id));
	}
	if (type === 'slots') {
		const label = CONFIG.DND5E?.spellLevels?.[actor.system?.spells?.[id]?.level] ?? id;
		const pips = slotPipButtons(actor, id, loc(label));
		return pips ? row('', '', `${loc(label)} slots`, pips) : '';
	}
	const doc = fromUuidSync(id, { relative: actor, strict: false });
	if (!doc) return '';
	if (type === 'item') {
		if (actor.hiddenItems?.has?.(doc.id)) return '';
		return actionRow(doc, '', doc.type === 'spell' ? 'Cast' : 'Use');
	}
	if (type === 'activity') {
		const item = doc.item;
		const key = item ? `item:${item.id}` : '';
		return row(key, glyphFor(doc.activation?.type), doc.name || item?.name || '', actBtn('Use', 'useActivity', id, { cls: 'sm ghost' }));
	}
	if (type === 'effect') {
		return row(`effect:${doc.id}`, '', doc.name, actBtn(doc.disabled ? 'Enable' : 'Disable', 'toggleEffect', doc.uuid, { cls: `sm ${doc.disabled ? '' : 'on'}` }));
	}
	return '';
}

/** The sheet's Favorites, in its order. Marking and unmarking is from the readout, or on the sheet. */
function favorites(actor) {
	const rows = [...(actor.system?.favorites ?? [])]
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((favorite) => favoriteRow(actor, favorite))
		.join('');
	return rows ? `<div class="sec">${esc(loc('DND5E.Favorites'))}</div><div class="grid2 sfh-actions">${rows}</div>` : '';
}

function actions(actor) {
	const allWeapons = actor.itemTypes?.weapon ?? [];
	const ready = allWeapons.filter((w) => w.system?.equipped || w.system?.type?.value === 'natural');
	const attacks = (ready.length ? ready : allWeapons).map(attackRow).join('');
	const features = (actor.itemTypes?.feat ?? []).filter(isActive);
	const groups = [['Actions', (t) => t === 'action'], ['Bonus Actions', (t) => t === 'bonus'], ['Reactions', (t) => t === 'reaction'], ['Other', (t) => !['action', 'bonus', 'reaction'].includes(t)]];
	const lists = groups.map(([label, matches]) => {
		const items = features.filter((f) => matches(activationOf(f)));
		return items.length ? `<div class="sec">${label}</div><div class="grid2 sfh-actions">${items.map((f) => actionRow(f)).join('')}</div>` : '';
	}).join('');
	return `${favorites(actor)}<div class="sec">Attacks</div>${attacks || '<p class="dimc">No weapons.</p>'}${lists}`;
}

/** The sheet's groups, in its order. Anything that is not one of these goes in with Equipment. */
const INVENTORY = [['Weapons', 'weapon'], ['Equipment', 'equipment'], ['Consumables', 'consumable'], ['Tools', 'tool'], ['Loot', 'loot']];
const PHYSICAL = ['weapon', 'equipment', 'consumable', 'tool', 'loot', 'container'];

function itemRow(actor, item, others, depth = 0) {
	const sys = item.system ?? {};
	const equip = 'equipped' in sys
		? actBtn(sys.equipped ? 'Equipped' : 'Equip', 'equip', item.id, { cls: `sm ${sys.equipped ? 'on' : ''}` })
		: '';
	const attune = sys.attunement && sys.identified !== false
		? `<button type="button" class="b sm invest ${sys.attuned ? 'on' : ''}" data-act="attune" data-k="${esc(item.id)}" aria-pressed="${!!sys.attuned}"
			aria-label="${esc(`Attune ${item.name}`)}" data-tooltip="${esc(loc(sys.attuned ? 'DND5E.AttunementAttuned' : 'DND5E.Attunement'))}"><i class="fa-solid fa-sun" inert></i></button>`
		: '';
	const use = activitiesOf(item).length ? useButton(item) : '';
	const row = `<div class="li flat sfh-nest" style="--depth:${depth}" ${ro(`item:${item.id}`)}>
		<span class="grow">${nameBtn(item.name, `item:${item.id}`)}</span>
		<span class="row" style="gap:3px">
			${actBtn('−', 'qty', `${item.id}:-1`, { cls: 'sm' })}
			<span class="mono" style="width:26px;text-align:center">${sys.quantity ?? 1}</span>
			${actBtn('+', 'qty', `${item.id}:1`, { cls: 'sm' })}
		</span>
		<span class="mono dimc" style="width:44px;text-align:right">${sys.weight?.value ?? 0} lb</span>
		${use}${attune}${equip}${givePicker(item, others)}</div>`;
	if (item.type !== 'container') return row;
	const inside = actor.items.filter((i) => i.system?.container === item.id);
	return row + inside.map((i) => itemRow(actor, i, others, depth + 1)).join('');
}

/** Who an item could go to: the other characters, as far as this user can see them. */
function tradePartners(actor) {
	const reachable = (a) => game.user.isGM || a.hasPlayerOwner || a.visible;
	return (game.actors?.filter((a) => a.type === 'character' && a.id !== actor.id && reachable(a)) ?? [])
		.sort((a, b) => a.name.localeCompare(b.name));
}

function givePicker(item, others) {
	const choices = others.map((a) => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('');
	const tip = others.length ? 'Give this to another character' : 'There is no other character in this world to give this to';
	return `<select class="sel give" data-pick="give" data-k="${esc(item.id)}"${others.length ? '' : ' disabled'} aria-label="${esc(`Give ${item.name} to another character`)}"
		data-tooltip="${tip}" title="${others.length ? '' : tip}"><option value="">Give…</option>${choices}</select>`;
}

function inventory(actor) {
	const sys = actor.system ?? {};
	const others = tradePartners(actor);
	// what is in a container is listed under it
	const loose = (item) => !item.system?.container || !actor.items.has?.(item.system.container);
	const section = (label, items) => (items.length ? `<div class="sec">${esc(label)}</div>${items.map((i) => itemRow(actor, i, others)).join('')}` : '');
	const rows = INVENTORY.map(([label, type]) => section(label, (actor.itemTypes?.[type] ?? []).filter(loose))).join('')
		+ section('Containers', (actor.itemTypes?.container ?? []).filter(loose));

	const search = `<div class="row sfh-browse">
		<input class="sfh-in grow" type="search" data-browse="1" placeholder="Quick search: type to find equipment" aria-label="Quick search for equipment">
		${actBtn('Browse', 'browseEquipment', '', { cls: 'sm ghost', title: 'Open the Compendium Browser' })}</div>
		<div class="sfh-results" aria-live="polite"></div>`;
	const editable = actor.isOwner ? '' : ' disabled';
	const coins = Object.keys(CONFIG.DND5E?.currencies ?? sys.currency ?? {}).map((k) => `<label class="sfh-bio">${lbl(k)}
		<input class="sfh-in mono" type="number" inputmode="numeric" min="0" value="${sys.currency?.[k] ?? 0}" data-field="currency.${esc(k)}"${editable} aria-label="${esc(k)}"></label>`).join('');
	const carried = sys.attributes?.encumbrance;
	const attunement = sys.attributes?.attunement;
	const load = [
		carried?.max != null ? `${lbl(loc('DND5E.Encumbrance'))}<span class="mono${carried.value > carried.max ? ' hot' : ''}">${Math.round((carried.value ?? 0) * 100) / 100} / ${carried.max} ${esc(carried.units ?? 'lb')}</span>` : '',
		attunement?.max != null ? `${lbl(loc('DND5E.Attunement'))}<span class="mono"${(attunement.value ?? 0) > attunement.max ? ' style="color:var(--bad)"' : ''}>${attunement.value ?? 0} / ${attunement.max}</span>` : '',
	].filter(Boolean).map((part) => `<div class="row sp">${part}</div>`).join('');
	return `${search}<div class="sfh-coins">${coins}</div>${load}${rows}`;
}

/** The sheet's sections: a section for each class, then species, background and the rest. */
function features(actor) {
	const sections = new Map();
	const addTo = (key, label) => sections.get(key) ?? sections.set(key, { label, items: [] }).get(key);
	const classes = Object.values(actor.classes ?? {}).sort((a, b) => (b.system?.levels ?? 0) - (a.system?.levels ?? 0));
	for (const cls of classes) addTo(cls.identifier ?? cls.id, `${cls.name} Features`);
	addTo('species', 'Species Features');
	addTo('background', 'Background Features');
	addTo('other', 'Other Features');
	for (const item of [...(actor.itemTypes?.feat ?? []), ...(actor.itemTypes?.subclass ?? [])]) {
		const flags = item.flags?.dnd5e ?? {};
		const origin = actor.items.get(String(flags.advancementRoot ?? flags.advancementOrigin ?? '').split('.')[0]);
		let key = 'other';
		if (origin?.type === 'race') key = 'species';
		else if (origin?.type === 'background') key = 'background';
		else if (origin?.type === 'class') key = origin.identifier ?? origin.id;
		else if (origin?.type === 'subclass') key = origin.class?.identifier ?? 'other';
		else if (item.type === 'subclass') key = actor.classes?.[item.system?.classIdentifier]?.identifier ?? 'other';
		sections.get(key).items.push(item);
	}
	const heads = classes.map((cls) => {
		const sub = (actor.itemTypes?.subclass ?? []).find((s) => s.system?.classIdentifier === cls.identifier);
		return `<div class="li sfh-feat" ${ro(`item:${cls.id}`)}><span class="mono dimc sfh-slot">${cls.system?.levels ?? ''}</span><span class="grow">${nameBtn(cls.name, `item:${cls.id}`)}${sub ? `<span class="sub">${esc(sub.name)}</span>` : ''}</span></div>`;
	}).join('');
	const body = [...sections.values()].filter((s) => s.items.length).map((s) => `<div class="sec">${esc(s.label)}</div>${s.items.map((item) => `<div class="li sfh-feat" ${ro(`item:${item.id}`)}>
		<span class="cost sfh-slot">${isActive(item) ? glyphFor(activationOf(item)) : ''}</span>
		<span class="grow">${nameBtn(item.name, `item:${item.id}`)}</span>
		${isActive(item) ? useButton(item) : ''}</div>`).join('')}`).join('');
	return `${heads ? `<div class="sec">Classes</div>${heads}` : ''}${body}` || '<p class="dimc">No features.</p>';
}

/** Whether the Spells tab is showing only what can be cast today. */
let preparedOnly = false;

/** Which spell level the Spells tab is showing, if not all of them. */
let spellLevel = null;

const levelName = (level) => {
	const name = CONFIG.DND5E?.spellLevels?.[level];
	return name ? loc(name) : level ? `Level ${level}` : 'Cantrips';
};

/** The spellbook's sections, worked out as the sheet's are: by what a spell casts from, not just its level. */
function spellbook(actor) {
	const book = new Map();
	const types = CONFIG.DND5E?.spellcasting ?? {};
	const register = (key, level, config) => {
		if (book.has(key)) return book.get(key);
		const shownLevel = config?.slots ? level : 1;
		const usesSlots = !!config?.slots && level !== 0;
		const section = {
			key,
			level,
			label: config?.getLabel?.({ level: shownLevel }) ?? 'Spellbook',
			order: level === 0 ? 0 : (config?.order ?? 1000) + (level ?? 0) / 100,
			usesSlots,
			items: [],
		};
		book.set(key, section);
		return section;
	};
	for (const config of Object.values(types)) {
		const levels = config.getAvailableLevels?.(actor) ?? [];
		if (!levels.length) continue;
		if (config.cantrips) register('spell0', 0, types.spell);
		for (const level of levels) register(config.getSpellSlotKey(level), level, config);
	}
	for (const spell of [...(actor.itemTypes?.spell ?? [])].sort((a, b) => (a.system?.level ?? 0) - (b.system?.level ?? 0))) {
		const method = spell.system?.method in types ? spell.system.method : 'innate';
		const config = types[method];
		// a pact spell of any level comes from the one kind of slot
		const SingleLevel = globalThis.dnd5e?.dataModels?.spellcasting?.SingleLevelSpellcasting;
		const level = SingleLevel && config instanceof SingleLevel && spell.system?.level !== 0 ? null : (spell.system?.level ?? 0);
		const cached = spell.flags?.dnd5e?.cachedFor;
		if (cached && !spell.system?.linkedActivity?.displayInSpellbook) continue;
		const key = cached ? 'item' : config?.getSpellSlotKey?.(level) ?? method;
		register(key, level, cached ? null : config).items.push(spell);
	}
	return [...book.values()].sort((a, b) => a.order - b.order);
}

/** A kind of slot, one segment each. Clicking one spends or regains up to it, as the sheet's pips do. */
function slotPipButtons(actor, key, label) {
	const slots = foundry.utils.getProperty(actor.system?.spells ?? {}, key);
	if (!slots) return '';
	const max = slots.override ?? slots.max ?? 0;
	const value = slots.value ?? 0;
	const count = Math.max(max, value);
	if (!count) return '';
	const pips = Array.from({ length: count }, (_, i) => `<button type="button" class="seg ${i < value ? 'on' : ''}" data-act="slot" data-k="${esc(key)}:${i + 1}" aria-label="${esc(`${label} slot ${i + 1}`)}"></button>`).join('');
	return `<span class="segs sfh-pips" role="group" aria-label="${esc(`${label} slots: ${value} of ${max}`)}" data-tooltip="${esc(`${value} / ${max}`)}">${pips}</span>`;
}

/** A section's slots, and a Restore when some are spent. */
function slotPips(actor, section) {
	if (!section.usesSlots) return '';
	const pips = slotPipButtons(actor, section.key, section.label);
	if (!pips) return '';
	const slots = foundry.utils.getProperty(actor.system?.spells ?? {}, section.key);
	const spent = (slots.value ?? 0) < (slots.override ?? slots.max ?? 0);
	return `${pips}${spent ? actBtn('Restore', 'restoreSlots', section.key, { cls: 'sm ghost', title: 'Regain every slot of this level' }) : ''}`;
}

function prepareToggle(spell) {
	const config = CONFIG.DND5E?.spellcasting?.[spell.system?.method];
	if (!config?.prepares || spell.system?.linkedActivity) return '';
	const states = CONFIG.DND5E?.spellPreparationStates ?? {};
	const always = spell.system.prepared === states.always?.value;
	const prepared = !!spell.system.prepared;
	const state = states[always ? 'always' : prepared ? 'prepared' : 'unprepared'];
	return `<button type="button" class="b sm invest ${prepared ? 'on' : ''}" data-act="prepare" data-k="${esc(spell.id)}" aria-pressed="${prepared}"${always ? ' disabled' : ''}
		aria-label="${esc(`${loc(state?.label ?? 'DND5E.Prepared')}: ${spell.name}`)}" data-tooltip="${esc(loc(state?.label ?? 'DND5E.Prepared'))}"><i class="fa-${prepared ? 'solid' : 'regular'} fa-${always ? 'certificate' : 'sun'}" inert></i></button>`;
}

/** Could this be cast without preparing it first? */
function castable(spell) {
	const config = CONFIG.DND5E?.spellcasting?.[spell.system?.method];
	return !config?.prepares || !!spell.system?.prepared || (spell.system?.level ?? 0) === 0;
}

function spells(actor) {
	const sections = spellbook(actor);
	if (!sections.some((s) => s.items.length)) return '<p class="dimc">No spells.</p>';
	const casters = Object.values(actor.spellcastingClasses ?? {}).map((cls) => {
		const sc = cls.spellcasting ?? {};
		const prep = sc.preparation?.max ? `<span class="mono dimc">${lbl(loc('DND5E.Prepared'))} ${sc.preparation.value ?? 0} / ${sc.preparation.max}</span>` : '';
		return `<div class="row sp sfh-caster"><b>${esc(cls.name)}</b><span class="row" style="gap:10px"><span class="mono dimc">${esc(String(sc.ability ?? '').toUpperCase())}</span>
			<span class="mono">${esc(sgn(sc.attack ?? 0))} hit</span><span class="mono">DC ${esc(sc.save ?? '')}</span>${prep}</span></div>`;
	}).join('');
	const anyPrepares = sections.some((s) => s.items.some((spell) => !castable(spell)));
	const filter = anyPrepares || preparedOnly
		? `<div class="row sp">${lbl('Spells')}${actBtn(preparedOnly ? 'Showing prepared' : 'Show prepared only', 'spellFilter', '', { cls: `sm ghost ${preparedOnly ? 'on' : ''}` })}</div>`
		: '';
	const shown = (section) => (preparedOnly ? section.items.filter(castable) : section.items);
	const levels = [...new Set(sections.flatMap(shown).map((spell) => spell.system?.level ?? 0))].sort((a, b) => a - b);
	// a level that has gone, by unpreparing its last spell or changing character, lets go of the choice
	if (!levels.includes(spellLevel)) spellLevel = null;
	const levelButton = (key, text, tip, on) => actBtn(text, 'spellLevel', key, { cls: `sm ghost ${on ? 'on' : ''}`, title: tip });
	const picker = levels.length > 1
		? `<div class="sfh-levels" role="group" aria-label="Spell level">${levelButton('all', 'All', 'Every level', spellLevel === null)}${
			levels.map((level) => levelButton(level, level ? String(level) : 'C', levelName(level), spellLevel === level)).join('')}</div>`
		: '';
	const grid = (spells) => `<div class="grid2 sfh-actions">${spells.map((spell) => actionRow(spell, prepareToggle(spell), 'Cast')).join('')}</div>`;
	const lists = sections.map((section) => {
		const items = shown(section).filter((spell) => spellLevel === null || (spell.system?.level ?? 0) === spellLevel);
		// a level's slots still show with no spell prepared at it, unless another level was asked for
		const pips = spellLevel === null || section.level === spellLevel || items.length ? slotPips(actor, section) : '';
		if (!items.length && !pips) return '';
		// what casts from one kind of slot, or none, can still be of several levels
		const within = [...new Set(items.map((spell) => spell.system?.level ?? 0))].sort((a, b) => a - b);
		const body = within.length > 1
			? within.map((level) => `<div class="sfh-level-sub">${esc(levelName(level))}</div>${grid(items.filter((spell) => (spell.system?.level ?? 0) === level))}`).join('')
			: items.length ? grid(items) : '';
		return `<div class="sec sfh-slots">${esc(section.label)}${pips}</div>${body}`;
	}).join('');
	return `${casters}${filter}${picker}${lists}`;
}

/** The sheet's categories, from everything that applies, including what items grant. */
function effects(actor) {
	const all = [...(actor.allApplicableEffects?.() ?? actor.effects)];
	const sorted = { Temporary: [], Passive: [], Inactive: [], Unavailable: [] };
	for (const e of all) {
		if (e.isSuppressed) sorted.Unavailable.push(e);
		else if (e.disabled) sorted.Inactive.push(e);
		else if (e.isTemporary) sorted.Temporary.push(e);
		else sorted.Passive.push(e);
	}
	const row = (e) => {
		// what an item grants is that item's to delete, on its own sheet
		const own = e.parent === actor || e.parent?.id === actor.id;
		return `<div class="li" ${ro(`effect:${e.id}`)}>
			<span class="grow">${nameBtn(e.name, `effect:${e.id}`)}${!own && e.parent?.name ? `<span class="sub">${esc(e.parent.name)}</span>` : ''}</span>
			<span class="mono dimc">${esc(e.duration?.label ?? '')}</span>
			${e.isSuppressed ? '' : actBtn(e.disabled ? 'Enable' : 'Disable', 'toggleEffect', e.uuid ?? e.id, { cls: `sm ${e.disabled ? '' : 'on'}` })}
			${own ? actBtn('Remove', 'deleteEffect', e.id, { cls: 'sm' }) : ''}</div>`;
	};
	const body = Object.entries(sorted).filter(([, list]) => list.length).map(([label, list]) => `<div class="sec">${label}</div>${list.map(row).join('')}`).join('');
	return body || '<p class="dimc">None.</p>';
}

/** Where each of the Biography tab's fields is kept. */
const CHARACTERISTICS = ['alignment', 'eyes', 'height', 'faith', 'hair', 'weight', 'gender', 'skin', 'age'];
const TEXTBOXES = [['ideal', 'DND5E.Ideals'], ['bond', 'DND5E.Bonds'], ['flaw', 'DND5E.Flaws'], ['trait', 'DND5E.PersonalityTraits'], ['appearance', 'DND5E.Appearance']];
const FIELDS = {
	biography: 'system.details.biography.value',
	...Object.fromEntries([...CHARACTERISTICS, ...TEXTBOXES.map(([field]) => field)].map((field) => [field, `system.details.${field}`])),
};

/** The sheet's Biography tab: its owner edits it, with Foundry's own rich text editor for the long one. */
async function biography(actor) {
	const details = actor.system?.details ?? {};
	const owner = !!actor.isOwner;
	const off = owner ? '' : ' disabled';
	const label = (field) => {
		const key = actor.system?.schema?.fields?.details?.fields?.[field]?.label;
		return key ? loc(key) : field[0].toUpperCase() + field.slice(1);
	};
	const traits = CHARACTERISTICS.map((field) => `<label class="sfh-bio">${lbl(label(field))}
		<input class="sfh-in" type="text" value="${esc(details[field] ?? '')}" data-field="${field}"${off}></label>`).join('');
	const boxes = TEXTBOXES.map(([field, key]) => `<label class="sfh-bio">${lbl(loc(key))}
		<textarea class="ta" rows="3" data-field="${field}"${off}>${esc(details[field] ?? '')}</textarea></label>`).join('');
	const raw = details.biography?.value ?? '';
	const shown = await foundry.applications.ux.TextEditor.implementation.enrichHTML(raw, { secrets: owner, relativeTo: actor, rollData: actor.getRollData?.() });
	const story = owner
		? `<prose-mirror class="sfh-rich ro-text content-sized" name="${FIELDS.biography}" data-field="biography" data-document-uuid="${esc(actor.uuid ?? '')}" value="${esc(raw)}" toggled>${shown}</prose-mirror>`
		: `<div class="sfh-rich ro-text">${shown}</div>`;
	return `<div class="sec">Characteristics</div><div class="grid3">${traits}</div>
		<div class="sec">Personality</div><div class="sfh-bio-grid">${boxes}</div>
		<div class="sec">${esc(loc('DND5E.Biography'))}</div><div class="sfh-bio">${story}</div>`;
}

/** A field marked `data-field`, typed or saved from its editor. Coins are whole and never below zero. */
export function setField(actor, field, value) {
	const [group, name] = field.split('.');
	if (group === 'currency') {
		if (!(name in (actor.system?.currency ?? {}))) return null;
		return actor.update({ [`system.currency.${name}`]: Math.max(0, Math.floor(Number(value)) || 0) });
	}
	return FIELDS[field] ? actor.update({ [FIELDS[field]]: value }) : null;
}

/* -------------------------------------------- */
/*  The readout                                  */
/* -------------------------------------------- */

/** A description as the sheet shows it. An item not yet identified has only what its unidentified text says. */
export async function describe(doc) {
	const sys = doc.system;
	if (!sys) return null;
	const raw = sys.identified === false && !game.user.isGM ? sys.unidentified?.description : sys.description?.value;
	return foundry.applications.ux.TextEditor.implementation.enrichHTML(raw ?? '', {
		secrets: doc.isOwner,
		relativeTo: doc,
		rollData: doc.getRollData?.(),
	});
}

/** What the readout lists about an item: the sheet's columns, which do not fit on an even row. */
export function readoutMeta(doc) {
	const labels = doc.labels ?? {};
	const uses = doc.system?.uses;
	const meta = [];
	if (uses?.max) {
		const period = CONFIG.DND5E?.limitedUsePeriods?.[uses.recovery?.[0]?.period]?.label;
		meta.push(['Uses', `${uses.value ?? 0} / ${uses.max}${period ? ` · ${loc(period)}` : ''}`]);
	}
	const rows = [
		['Level', labels.level], ['School', labels.school], ['Time', labels.activation], ['Range', labels.range], ['Target', labels.target],
		['Duration', labels.duration], ['Components', labels.components?.vsm], ['To hit', labels.modifier], ['Damage', labels.damage], ['Save', labels.save],
	];
	for (const [label, value] of rows) if (value) meta.push([label, String(value)]);
	return meta;
}

/** Its properties, as the readout's chips: concentration, ritual, finesse and so on. */
export function readoutTraits(doc) {
	return [...(doc.system?.properties ?? [])].map((key) => {
		const label = CONFIG.DND5E?.itemProperties?.[key]?.label;
		return label ? loc(label) : key;
	});
}

/** Mark it as a favorite, or take it off, from what is being read. Only what is on this character can be. */
export function readoutActions(doc, actor) {
	if (!actor.system?.hasFavorite) return '';
	const type = doc.documentName === 'ActiveEffect' ? 'effect' : 'item';
	if (type === 'item' && doc.parent !== actor) return '';
	const id = foundry.utils.buildRelativeUuid(doc, actor);
	const on = actor.system.hasFavorite(id);
	const label = loc(on ? 'DND5E.FavoriteRemove' : 'DND5E.Favorite');
	return `<button type="button" class="b sm ghost sfh-fav ${on ? 'on' : ''}" data-act="favorite" data-k="${esc(type)}|${esc(id)}" aria-pressed="${on}"><i class="fa-solid fa-bookmark" inert></i> ${esc(label)}</button>`;
}

/* -------------------------------------------- */
/*  The latest roll                              */
/* -------------------------------------------- */

const ROLL_TYPES = ['attack', 'damage', 'healing', 'check', 'save', 'hitDie', 'hitPoints', 'generic'];

/**
 * A chat message, as the latest-roll strip shows it, or null if it is not a roll this user may
 * see. 5e keeps a roll's kind in the message's type. The dice say a critical or a fumble for
 * themselves; whether it beat a target stays on the card, which knows what may be shown.
 */
export function readRoll(message) {
	const roll = message.rolls?.[0];
	if (!roll || !message.isContentVisible || !message.visible || !ROLL_TYPES.includes(message.type)) return null;
	const actor = message.getAssociatedActor?.() ?? game.actors.get(message.speaker?.actor);
	if (!actor) return null;
	const attack = message.type === 'attack';
	const outcome = !attack && message.type !== 'check' && message.type !== 'save' ? null
		: roll.isCritical ? { label: 'Critical', tone: 'good' }
			: roll.isFumble ? { label: 'Fumble', tone: 'bad' } : null;
	const holder = document.createElement('div');
	holder.innerHTML = message.flavor ?? '';
	const item = message.getAssociatedItem?.();
	return {
		actorId: actor.id,
		messageId: message.id,
		name: item?.name ?? holder.textContent.replace(/\s+/g, ' ').trim() ?? 'Roll',
		formula: roll.formula ?? '',
		total: roll.total,
		outcome,
		dc: null,
		// only an attack can be followed up from here
		damage: attack && !!message.getAssociatedActivity?.()?.rollDamage,
	};
}

/** Damage from an attack, as the card's own Damage button rolls it: same ability, ammunition and mode. */
function latestDamage(messageId, kind, event) {
	const message = game.messages.get(messageId);
	const activity = message?.getAssociatedActivity?.();
	if (!activity?.rollDamage) return null;
	const { ability, ammunitionItem: ammunition, mode: attackMode } = message.system ?? {};
	const isCritical = kind === 'critical';
	const dialog = isCritical ? { options: { defaultButton: 'critical' } } : {};
	return activity.rollDamage({ event, ability, ammunition, attackMode, isCritical }, dialog);
}

/* -------------------------------------------- */
/*  Finding and moving items                     */
/* -------------------------------------------- */

const QUICK_LIMIT = 12;

/** The Compendium Browser's own index of what an inventory can hold, read once. */
let catalog = null;

function physicalIndex() {
	catalog ??= dnd5e.applications.CompendiumBrowser.fetch(CONFIG.Item.documentClass, {
		types: new Set(PHYSICAL),
		indexFields: new Set(['system.price', 'system.rarity']),
		sort: true,
	}).catch((err) => {
		catalog = null;
		throw err;
	});
	return catalog;
}

/** The Inventory tab's quick search, over the packs the browser is set to use. */
export async function searchItems(text) {
	const words = text.toLowerCase().split(/\s+/).filter(Boolean);
	const found = (await physicalIndex()).filter((entry) => {
		const name = entry.name.toLowerCase();
		return words.every((word) => name.includes(word));
	});
	if (!found.length) return '<p class="dimc">Nothing found.</p>';
	const rows = found.slice(0, QUICK_LIMIT).map((entry) => {
		const price = entry.system?.price;
		return `<div class="li flat qs">
			<img src="${esc(entry.img)}" alt="">
			<span class="grow"><button type="button" class="nm" data-act="viewItem" data-k="${esc(entry.uuid)}" data-tooltip="Open this item's sheet">${esc(entry.name)}</button></span>
			<span class="mono dimc qs-price">${price?.value ? esc(`${price.value} ${price.denomination ?? 'gp'}`) : ''}</span>
			${actBtn('Add', 'addItem', entry.uuid, { cls: 'sm ghost', title: 'Add to inventory, free' })}
			${actBtn('Buy', 'buyItem', entry.uuid, { cls: 'sm ghost', title: 'Pay its price and add to inventory' })}</div>`;
	}).join('');
	const more = found.length > QUICK_LIMIT
		? `<p class="dimc qs-more">${found.length - QUICK_LIMIT} more. Keep typing to narrow it down, or Browse for all of them.</p>` : '';
	return rows + more;
}

/** Onto a stack of the same thing if there is one, else as the sheet adds what is dropped on it. */
async function addToActor(actor, item) {
	const source = item._stats?.compendiumSource ?? item.uuid;
	const stack = actor.items.find((i) => i.type === item.type && i.type !== 'container' && i.name === item.name && (i._stats?.compendiumSource === source));
	if (stack) return stack.update({ 'system.quantity': (stack.system.quantity ?? 1) + (item.system?.quantity ?? 1) });
	const created = await CONFIG.Item.documentClass.createWithContents([item]);
	return actor.createEmbeddedDocuments('Item', created, { keepId: true });
}

async function addItem(actor, uuid) {
	const item = await fromUuid(uuid);
	if (!item || !PHYSICAL.includes(item.type)) return;
	await addToActor(actor, item);
	ui.notifications.info(`${item.name} added to ${actor.name}.`);
}

/** Pay first: the system's own reckoning, which makes change and says when there is not enough. */
async function buyItem(actor, uuid) {
	const item = await fromUuid(uuid);
	if (!item || !PHYSICAL.includes(item.type)) return;
	const { value = 0, denomination = 'gp' } = item.system?.price ?? {};
	try {
		await dnd5e.applications.CurrencyManager.deductActorCurrency(actor, value, denomination, { recursive: false, priority: 'low' });
	} catch (err) {
		return ui.notifications.warn(err.message);
	}
	await addToActor(actor, item);
	ui.notifications.info(`${actor.name} bought ${item.name} for ${value} ${denomination}.`);
}

/** Move a whole stack, with what is inside it. This has to run where both characters can be changed. */
async function moveItem(item, target) {
	const created = await CONFIG.Item.documentClass.createWithContents([item]);
	await target.createEmbeddedDocuments('Item', created, { keepId: true });
	return item.delete({ deleteContents: true });
}

/**
 * Give an item to another character. A player cannot change someone else's character, and 5e has
 * no way round that as the 2e systems do, so the GM's client makes the move for them.
 */
async function giveItem(actor, itemId, targetId) {
	const item = actor.items.get(itemId);
	const target = game.actors.get(targetId);
	if (!item || !target) return;
	if (target.isOwner) {
		await moveItem(item, target);
		return ui.notifications.info(`${item.name} given to ${target.name}.`);
	}
	if (!game.users.activeGM) return ui.notifications.warn('A GM has to be online to give an item to a character you do not own.');
	game.socket.emit(`module.${MOD}`, { type: 'give', userId: game.user.id, actorId: actor.id, itemId, targetId });
	ui.notifications.info(`${item.name} sent to ${target.name}.`);
}

/** The GM's side of that, for the one active GM, and only for what the asker owns. */
export async function onGiveRequest({ userId, actorId, itemId, targetId }) {
	if (game.users.activeGM !== game.user) return;
	const user = game.users.get(userId);
	const actor = game.actors.get(actorId);
	const target = game.actors.get(targetId);
	const item = actor?.items.get(itemId);
	if (!user || !item || target?.type !== 'character' || !actor.testUserPermission(user, 'OWNER')) return;
	return moveItem(item, target);
}

function browseEquipment() {
	return new dnd5e.applications.CompendiumBrowser({ filters: { locked: { types: new Set(PHYSICAL) } } }).render({ force: true });
}

/* -------------------------------------------- */
/*  Acting                                       */
/* -------------------------------------------- */

export async function act(actor, action, key, event) {
	const [a, b] = String(key ?? '').split(':');
	switch (action) {
		case 'skill': return actor.rollSkill?.({ skill: key, event });
		case 'tool': return actor.rollToolCheck?.({ tool: key, event });
		case 'ability': return actor.rollAbilityCheck?.({ ability: key, event });
		case 'save': return actor.rollSavingThrow?.({ ability: key, event });
		case 'concentration': return actor.rollConcentration?.({ event, legacy: false });
		case 'initiative': return actor.rollInitiativeDialog?.({ event }) ?? actor.rollInitiative?.({ createCombatants: true });
		case 'use': return actor.items.get(key)?.use?.({ event });
		case 'attack': return actor.items.get(key)?.system?.activities?.getByType?.('attack')?.[0]?.use?.({ event });
		case 'weaponDamage': return actor.items.get(key)?.system?.activities?.getByType?.('attack')?.[0]?.rollDamage?.({ event });
		case 'recharge': return actor.items.get(key)?.system?.uses?.rollRecharge?.({ apply: true, event });
		case 'latestDamage': return latestDamage(a, b, event);
		case 'hd': return actor.rollHitDie?.();
		case 'deathRoll': return actor.rollDeathSave?.({ event, legacy: false });
		case 'deathMark': return setDeathSave(actor, a, Number(b));
		case 'insp': return actor.update({ 'system.attributes.inspiration': !actor.system.attributes.inspiration });
		case 'exhaustion': return actor.update({ 'system.attributes.exhaustion': Math.max(0, Number(key)) });
		case 'rest': return key === 'short' ? actor.shortRest?.() : actor.longRest?.();
		case 'equip': return actor.items.get(key)?.update({ 'system.equipped': !actor.items.get(key).system.equipped });
		case 'attune': return actor.items.get(key)?.update({ 'system.attuned': !actor.items.get(key).system.attuned });
		case 'prepare': return togglePrepared(actor, key);
		case 'slot': return setSlots(actor, a, Number(b));
		case 'restoreSlots': return restoreSlots(actor, key);
		case 'spellFilter':
			preparedOnly = !preparedOnly;
			return 'redraw';
		case 'spellLevel':
			spellLevel = key === 'all' ? null : Number(key);
			return 'redraw';
		case 'useActivity': return fromUuidSync(key, { relative: actor, strict: false })?.use?.({ event });
		case 'favorite': return toggleFavorite(actor, key);
		case 'qty': return changeQuantity(actor, a, Number(b));
		case 'setRank': return setProficiency(actor, a, Number(b));
		case 'addItem': return addItem(actor, key);
		case 'buyItem': return buyItem(actor, key);
		case 'viewItem': return (await fromUuid(key))?.sheet?.render(true);
		case 'browseEquipment': return browseEquipment();
		case 'giveItem': return giveItem(actor, a, b);
		case 'toggleEffect': return toggleEffect(key);
		case 'deleteEffect': return actor.effects.get(key)?.delete();
		case 'addCondition': return actor.toggleStatusEffect?.(key, { active: true });
		case 'heal': return applyDamage(actor, -Math.abs(Number(key)));
		case 'damage': return applyDamage(actor, Math.abs(Number(key)));
		case 'setHp': return setHp(actor, Number(key));
		case 'setMax': return actor.update({ 'system.attributes.hp.max': Math.max(1, Number(key)) });
		case 'setTemp': return actor.update({ 'system.attributes.hp.temp': Math.max(0, Number(key)) });
		default: return null;
	}
}

function toggleFavorite(actor, key) {
	const [type, id] = key.split('|');
	return actor.system.hasFavorite(id) ? actor.system.removeFavorite(id) : actor.system.addFavorite({ type, id });
}

/** As the sheet's pips do: clicking the last one lit takes it back off. */
function setDeathSave(actor, kind, n) {
	if (!['success', 'failure'].includes(kind)) return null;
	const now = actor.system.attributes.death?.[kind] ?? 0;
	return actor.update({ [`system.attributes.death.${kind}`]: now === n ? n - 1 : n });
}

function setSlots(actor, key, n) {
	const slots = foundry.utils.getProperty(actor.system?.spells ?? {}, key);
	if (!slots) return null;
	return actor.update({ [`system.spells.${key}.value`]: slots.value === n ? n - 1 : n });
}

function restoreSlots(actor, key) {
	const slots = foundry.utils.getProperty(actor.system?.spells ?? {}, key);
	if (!slots) return null;
	return actor.update({ [`system.spells.${key}.value`]: slots.override ?? slots.max ?? 0 });
}

/** Prepared or not. A spell that is always prepared stays that way. */
function togglePrepared(actor, id) {
	const spell = actor.items.get(id);
	if (!spell || spell.system?.prepared === CONFIG.DND5E?.spellPreparationStates?.always?.value) return null;
	return spell.update({ 'system.prepared': spell.system.prepared ? 0 : 1 });
}

function setProficiency(actor, path, value) {
	const [group, key] = path.split('.');
	if (!['skills', 'tools'].includes(group) || !PROFICIENCY.some(([v]) => v === value)) return null;
	return actor.update({ [`system.${group}.${key}.value`]: value });
}

async function changeQuantity(actor, id, delta) {
	const item = actor.items.get(id);
	if (!item) return;
	return item.update({ 'system.quantity': Math.max(0, (item.system.quantity ?? 1) + delta) });
}

/** An effect may be on an item rather than the character, so it is found by where it really is. */
async function toggleEffect(uuid) {
	const effect = await fromUuid(uuid);
	if (!effect) return;
	return effect.update({ disabled: !effect.disabled });
}

async function setHp(actor, value) {
	const hp = actor.system.attributes.hp;
	const max = hp.effectiveMax ?? hp.max;
	return actor.update({ 'system.attributes.hp.value': Math.max(0, Math.min(max ?? value, value)) });
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
