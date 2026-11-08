import { esc, sgn, lbl, rollBtn, actBtn, nameBtn, ro } from '../projection/helpers.mjs';
import { MOD } from '../constants.mjs';

/**
 * D&D 3.5e: the "Dungeons & Dragons 3.5 SRD" system (D35E 3.x, Foundry 13 and 14).
 *
 * Same contract as the other adapters: read the numbers, and hand every press back to the
 * system — `rollSkill`, `rollSavingThrow`, `rollAbility`, `rollBAB`, `item.use()` — with the
 * click passed along, so its dialogs open, or not, as they do from its own sheet.
 *
 * A character's spells are kept in up to four spellbooks (primary, secondary, tertiary and
 * spell-like abilities), each tied to a class. A prepared caster's spell carries how many times
 * it is prepared and how many of those are left; a spontaneous caster spends the spellbook's
 * slots. Attacks are items of their own, which the system makes from a weapon when it is equipped.
 */

export const SYSTEMS = ['D35E'];

export const TABS = [
	{ id: 'character', label: 'Character' },
	{ id: 'attacks', label: 'Attacks' },
	{ id: 'skills', label: 'Skills' },
	{ id: 'spells', label: 'Spells' },
	{ id: 'feats', label: 'Feats' },
	{ id: 'inventory', label: 'Inventory' },
	{ id: 'effects', label: 'Effects' },
	{ id: 'biography', label: 'Biography' },
];

const loc = (key) => game.i18n.localize(key);

/** A label from the system's configuration, localized, or the key itself. */
const cfg = (group, key) => {
	const value = CONFIG.D35E?.[group]?.[key];
	return value ? loc(value) : key;
};

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const SAVES = [['fort', 'Fort'], ['ref', 'Ref'], ['will', 'Will']];
const BOOKS = ['primary', 'secondary', 'tertiary', 'spelllike'];

/** What can be carried, in the order the sheet lists it. */
const INVENTORY = [['Weapons', 'weapon'], ['Armor & Equipment', 'equipment'], ['Consumables', 'consumable'], ['Loot', 'loot'], ['Valuables', 'valuable']];
const PHYSICAL = INVENTORY.map(([, type]) => type);

/** The total of a number the system keeps as an object with a total, or as a plain number. */
const total = (v) => (typeof v === 'object' && v !== null ? v.total ?? v.value ?? 0 : v ?? 0);

/**
 * A damage formula as people say it. The system sizes weapon dice with `sizeRoll(count, faces, …)`
 * and writes caster level and the like as roll data; those are filled in and what is left of plain
 * arithmetic worked out, so "sizeRoll(1, 8, @sizeDifference, @critMult)" reads "1d8" and
 * "(min(10, @cl))d6" reads "5d6" for a fifth-level caster.
 */
export function formula(text, rollData = {}) {
	if (!text) return '';
	let out = String(text).replace(/sizeRoll\(\s*(\d+)\s*,\s*(\d+)[^)]*\)/g, '$1d$2');
	try {
		out = Roll.replaceFormulaData(out, rollData, { missing: '0' });
	} catch {
		return out;
	}
	// work out any bracket of plain arithmetic, innermost first, with the functions Foundry's
	// formulas use; a bracket with dice in it is left as it is
	for (let i = 0; i < 5; i++) {
		const next = out.replace(/(?:\b(min|max|floor|ceil|round|abs)\s*)?\(([^()@]*)\)/g, (whole, fn, inner) => {
			if (/\dd\d/.test(inner) || (!fn && inner.includes(','))) return whole;
			try {
				const value = Roll.safeEval(fn ? `${fn}(${inner})` : inner);
				return Number.isFinite(value) ? String(value) : whole;
			} catch {
				return whole;
			}
		});
		if (next === out) break;
		out = next;
	}
	return out.replace(/\s+/g, ' ').trim();
}

/** A weapon's critical, as written in the rules: "20/×3", "19–20/×2". The system keeps the range as a number or a string. */
function critical(ability) {
	const range = Number(ability?.critRange);
	if (!range) return '';
	return `${range >= 20 ? '20' : `${range}–20`}/×${ability.critMult ?? 2}`;
}

/** An item type's name: the system's own, or the type itself when the system has none. */
function typeName(type) {
	const key = `TYPES.Item.${type}`;
	const name = loc(key);
	return name === key ? type.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) : name;
}

/** An item's damage, every part with its type: "1d8 S", "5d6 Fire". */
function damageText(item) {
	const data = item.getRollData?.() ?? {};
	return (item.system?.damage?.parts ?? [])
		.map(([f, type]) => [formula(f, data), type].filter(Boolean).join(' '))
		.filter(Boolean)
		.join(' + ');
}

/* -------------------------------------------- */
/*  Reading                                      */
/* -------------------------------------------- */

export function read(actor) {
	const sys = actor.system ?? {};
	const at = sys.attributes ?? {};
	const hp = at.hp ?? {};
	const race = actor.items.find((i) => i.type === 'race')?.name;
	const classes = actor.items.filter((i) => i.type === 'class').map((c) => `${c.name} ${c.system?.levels ?? ''}`.trim());
	const npc = actor.type === 'npc';
	return {
		system: 'D35E',
		id: actor.id,
		name: actor.name,
		npc,
		sub: [race, classes.join(' / ')].filter(Boolean).join(' · '),
		level: sys.details?.level?.value ?? 0,
		xp: npc ? null : { value: sys.details?.xp?.value ?? 0, max: sys.details?.xp?.max ?? 1000 },
		hp: { value: hp.value ?? 0, max: hp.max ?? 0, temp: hp.temp ?? 0 },
		ac: at.ac?.normal?.total ?? 10,
		speed: at.speed?.land?.total ?? 30,
		defenses: defenses(actor),
		iwr: iwr(actor),
		vitals: {
			kind: 'd35e',
			state: state(hp),
			nonlethal: { key: 'nonlethal', label: 'Nonlethal', value: hp.nonlethal ?? 0, max: Math.max(hp.max ?? 0, hp.nonlethal ?? 0) },
			negativeLevels: at.energyDrain ?? 0,
		},
		effects: buffs(actor).filter((b) => b.system?.active).map((b) => ({ id: b.id, name: b.name, duration: buffTime(b) })),
		conditions: activeConditions(actor).map(([slug, name]) => ({ id: `cond.${slug}`, name, value: null, slug })),
		conditionChoices: conditionChoices(actor),
		tabs: TABS,
	};
}

/** What being at or below zero hit points means in 3.5e: disabled at 0, dying below, dead at −10. */
function state(hp) {
	const value = hp.value ?? 0;
	if ((hp.max ?? 0) <= 0 || value > 0) return null;
	if (value === 0) return { label: 'Disabled', bad: false };
	if (value > -10) return { label: 'Dying', bad: true };
	return { label: 'Dead', bad: true };
}

function defenses(actor) {
	const at = actor.system?.attributes ?? {};
	const sr = total(at.sr);
	return [
		{ label: 'AC', value: at.ac?.normal?.total ?? 10, lead: true },
		{ label: 'Touch', value: at.ac?.touch?.total ?? 10 },
		{ label: 'Flat-footed', value: at.ac?.flatFooted?.total ?? 10 },
		...SAVES.map(([key, label]) => ({ label, value: sgn(at.savingThrows?.[key]?.total ?? 0), act: 'save', k: key })),
		{ label: 'Initiative', value: sgn(at.init?.total ?? 0), act: 'initiative', k: '' },
		{ label: 'Speed', value: `${at.speed?.land?.total ?? 30} ft` },
		...(sr ? [{ label: 'SR', value: sr }] : []),
	];
}

/** A trait the system keeps as a list of keys and a free-text addition. */
function traitList(trait, group) {
	if (!trait) return [];
	if (typeof trait === 'string') return trait.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
	return [
		...[...(trait.value ?? [])].map((k) => cfg(group, k)),
		...String(trait.custom ?? '').split(';').map((s) => s.trim()).filter(Boolean),
	];
}

/** Damage reduction and energy resistance, as the sheet writes them: "5/magic", "Fire 10". */
function reductions(actor) {
	const sys = actor.system ?? {};
	const dr = (sys.combinedDR ?? []).map((d) => [d.value, d.name ?? d.types ?? d.type].filter((x) => x != null && x !== '').join('/'));
	const er = (sys.combinedResistances ?? []).map((r) => [r.name ?? r.type, r.value].filter((x) => x != null && x !== '').join(' '));
	return {
		dr: dr.length ? dr : traitList(sys.traits?.dr),
		er: er.length ? er : traitList(sys.traits?.eres),
	};
}

function iwr(actor) {
	const traits = actor.system?.traits ?? {};
	const { dr, er } = reductions(actor);
	return [
		{ label: loc('SFH.Projection.Immunities'), items: [...traitList(traits.di, 'damageTypes'), ...traitList(traits.ci, 'conditionTypes')] },
		{ label: loc('SFH.Projection.Vulnerabilities'), items: traitList(traits.dv, 'damageTypes') },
		{ label: loc('SFH.Projection.Resistances'), items: [...er, ...dr.map((d) => `DR ${d}`)] },
	];
}

const buffs = (actor) => actor.items.filter((i) => i.type === 'buff');

/** How long a buff has left, from its timeline, in rounds. */
function buffTime(buff) {
	const t = buff.system?.timeline;
	if (!t?.enabled || !t.total) return '';
	const left = Math.max(0, (t.total ?? 0) - (t.elapsed ?? 0));
	return `${left} rd`;
}

/** The conditions the character is under, by the system's flags. */
function activeConditions(actor) {
	const flags = actor.system?.attributes?.conditions ?? {};
	return Object.entries(CONFIG.D35E?.conditions ?? {}).filter(([slug]) => flags[slug] === true).map(([slug, name]) => [slug, loc(name)]);
}

function conditionChoices(actor) {
	const flags = actor.system?.attributes?.conditions ?? {};
	return Object.entries(CONFIG.D35E?.conditions ?? {})
		.filter(([slug]) => flags[slug] !== true)
		.map(([id, name]) => ({ id, label: loc(name) }))
		.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));
}

/* -------------------------------------------- */
/*  Tab bodies                                   */
/* -------------------------------------------- */

export function tabBody(actor, tab) {
	switch (tab) {
		case 'character': return character(actor);
		case 'attacks': return attacks(actor);
		case 'skills': return skills(actor);
		case 'spells': return spells(actor);
		case 'feats': return feats(actor);
		case 'inventory': return inventory(actor);
		case 'effects': return effects(actor);
		case 'biography': return biography(actor);
		default: return '<p class="dimc">Nothing here.</p>';
	}
}

const kv = (label, value) => (value ? `<div class="kv">${lbl(label)}<b>${esc(value)}</b></div>` : '');

function character(actor) {
	const sys = actor.system ?? {};
	const at = sys.attributes ?? {};
	const abilities = ABILITIES.map((key) => {
		const a = sys.abilities?.[key] ?? {};
		const hurt = [a.damage ? `${a.damage} dmg` : '', a.drain ? `${a.drain} drain` : ''].filter(Boolean).join(' · ');
		return `<div class="cell" style="padding:8px 4px;gap:4px" ${ro(`def:${cfg('abilities', key)}`)}>
			${lbl(key)}
			<button type="button" class="b roll" style="font-size:22px;min-height:36px" data-act="ability" data-k="${key}"
				data-tooltip="${esc(`${cfg('abilities', key)} check`)}">${sgn(a.mod ?? 0)}</button>
			<span class="mono dimc" style="font-size:13px">${a.total ?? a.value ?? 10}</span>
			${hurt ? `<span class="mono" style="font-size:11px;color:var(--bad)">${esc(hurt)}</span>` : ''}
		</div>`;
	}).join('');
	const saves = SAVES.map(([key]) => `<div class="li flat"><span class="grow">${lbl(cfg('savingThrows', key))}</span>
		${rollBtn(sgn(at.savingThrows?.[key]?.total ?? 0), 'save', key)}</div>`).join('');
	const combat = [
		['Base Attack', sgn(at.bab?.total ?? 0), 'bab'],
		['Melee', null, 'melee'],
		['Ranged', null, 'ranged'],
		['Grapple', null, 'grapple'],
		['Initiative', sgn(at.init?.total ?? 0), 'initiative'],
	].map(([label, value, act]) => `<div class="li flat"><span class="grow">${lbl(label)}</span>
		${rollBtn(value ?? 'Roll', act, '')}</div>`).join('');

	const speed = at.speed ?? {};
	const speeds = ['land', 'climb', 'swim', 'burrow', 'fly'].filter((k) => total(speed[k]) > 0)
		.map((k) => `${k === 'land' ? '' : `${k[0].toUpperCase()}${k.slice(1)} `}${total(speed[k])} ft`).join(', ');
	const senses = at.senses ?? sys.traits?.senses ?? {};
	const seen = [
		senses.darkvision ? `Darkvision ${senses.darkvision} ft` : '',
		senses.lowLight ? 'Low-light vision' : '',
		senses.blindsight ? `Blindsight ${senses.blindsight} ft` : '',
		senses.tremorsense ? `Tremorsense ${senses.tremorsense} ft` : '',
		senses.truesight ? `True seeing ${senses.truesight} ft` : '',
		senses.special ?? '',
	].filter(Boolean).join(', ');
	const { dr, er } = reductions(actor);
	const alignment = sys.details?.alignment;
	const traits = [
		kv('Size', cfg('actorSizes', sys.traits?.size)),
		kv('Speed', speeds),
		kv('Senses', seen),
		kv('Languages', traitList(sys.traits?.languages, 'languages').join(', ')),
		kv('Alignment', CONFIG.D35E?.alignments?.[alignment] ? cfg('alignments', alignment) : alignment),
		kv('Deity', sys.details?.deity),
		kv('Damage Reduction', dr.join(', ')),
		kv('Energy Resistance', er.join(', ')),
		kv('Spell Resistance', total(at.sr) || ''),
		kv('Armor Check', at.acp?.total ? `−${Math.abs(at.acp.total)}` : ''),
		kv('Max Dex', at.maxDex?.total != null && at.maxDex.total < 99 ? sgn(at.maxDex.total) : ''),
		kv('Spell Failure', at.arcaneSpellFailure ? `${at.arcaneSpellFailure}%` : ''),
	].join('');
	return `<div class="grid6">${abilities}</div>
		<div class="grid2" style="gap:0 12px;margin-top:8px">
			<div><div class="sec">Saving Throws</div>${saves}</div>
			<div><div class="sec">Combat</div>${combat}</div>
		</div>
		${traits ? `<div class="sec">Traits</div><div class="grid2">${traits}</div>` : ''}`;
}

/** Its use: an action that costs nothing waits on nothing; one with uses left says how many. */
function useButton(item, text = 'Use') {
	const uses = item.system?.uses;
	if (uses?.max && (uses.value ?? 0) <= 0 && uses.per) return actBtn(text, 'use', item.id, { cls: 'sm ghost spent', title: 'No uses left', disabled: true });
	return actBtn(text, 'use', item.id, { cls: 'sm ghost' });
}

/** An attack and what it does, rolled through the system so its options and modifiers apply. */
function attackRow(item) {
	const sys = item.system ?? {};
	const range = sys.range?.value ? `${sys.range.value} ${sys.range.units ?? 'ft'}` : '';
	// only a weapon attack threatens a critical
	const weapon = ['mwak', 'rwak'].includes(sys.actionType);
	const facts = [
		cfg('itemActionTypes', sys.actionType),
		damageText(item),
		weapon ? critical(sys.ability) : '',
		range,
	].filter(Boolean).join(' · ');
	const label = item.type === 'full-attack' ? 'Full attack' : 'Attack';
	return `<div class="li" style="flex-wrap:wrap;gap:8px 10px" ${ro(`item:${item.id}`)}>
		<div class="grow" style="min-width:150px;display:flex;flex-direction:column;gap:2px">
			${nameBtn(item.name, `item:${item.id}`)}
			${facts ? `<span class="sub">${esc(facts)}</span>` : ''}
		</div>${actBtn(label, 'use', item.id, { cls: 'roll', title: 'Roll, as from the sheet' })}</div>`;
}

/** What has something to do: an activation that is not passive. */
const isActive = (item) => !!item.system?.activation?.type && item.system.activation.type !== 'passive';

const activationLabel = (item) => cfg('abilityActivationTypes', item.system?.activation?.type);

function attacks(actor) {
	const list = actor.items.filter((i) => i.type === 'attack' || i.type === 'full-attack')
		.sort((a, b) => (a.type === b.type ? 0 : a.type === 'full-attack' ? 1 : -1));
	const rows = list.map(attackRow).join('');
	const quick = ['bab', 'melee', 'ranged', 'grapple'].map((act) =>
		actBtn({ bab: 'Base Attack', melee: 'Melee', ranged: 'Ranged', grapple: 'Grapple' }[act], act, '', { cls: 'sm ghost' })).join('');
	// armor has an activation too, the time it takes to put on, so only feats count here
	const special = actor.items.filter((i) => i.type === 'feat' && isActive(i));
	const specials = special.length
		? `<div class="sec">Special Abilities</div><div class="grid2 sfh-actions">${special.map((item) => `<div class="li sfh-action" ${ro(`item:${item.id}`)}>
			<span class="grow">${nameBtn(item.name, `item:${item.id}`)}<span class="sub">${esc(activationLabel(item))}</span></span>${useButton(item)}</div>`).join('')}</div>`
		: '';
	return `<div class="row" style="gap:6px;flex-wrap:wrap">${quick}</div>
		<div class="sec">Attacks</div>${rows || '<p class="dimc">No attacks. Equip a weapon and the system makes its attack.</p>'}${specials}`;
}

/** A skill's name: the system's for a standard one, its own for a custom one. */
const skillName = (key, s) => (s?.custom || s?.name ? s.name || key : cfg('skills', key));

/** Every skill the character can use, and the subskills of Craft, Perform and Profession. */
function skillList(actor) {
	const out = [];
	for (const [key, s] of Object.entries(actor.system?.skills ?? {})) {
		// aSkill is the system's template for a custom skill, not one the character has
		if (s?.visibility === 'hidden' || key === 'aSkill') continue;
		const subs = Object.entries(s?.subSkills ?? {});
		if (subs.length) {
			for (const [sub, ss] of subs) out.push({ key: `${key}.subSkills.${sub}`, s: ss, name: `${skillName(key, s)} (${ss.name ?? sub})` });
		} else if (!(s?.custom && !s.name)) {
			out.push({ key, s, name: skillName(key, s) });
		}
	}
	return out.sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
}

function skills(actor) {
	const rows = skillList(actor).map(({ key, s, name }) => {
		// a skill that needs training can't be tried without ranks
		const barred = s.rt && !(s.rank > 0);
		const tip = [s.cs ? 'Class skill' : 'Cross-class skill', barred ? 'Trained only: no ranks' : '', s.acp ? 'Armor check penalty applies' : ''].filter(Boolean).join(' · ');
		return `<div class="li flat" style="min-height:32px${barred ? ';opacity:.5' : ''}" ${ro(`skill:${key}`)}>
			<span class="mono ${s.cs ? 'hot' : 'dimc'}" style="width:14px" data-tooltip="${esc(tip)}" aria-label="${esc(tip)}">${s.cs ? '●' : '○'}</span>
			<span class="grow">${nameBtn(`${name}${s.rt ? ' *' : ''}`, `skill:${key}`)}</span>
			<span class="mono dimc" style="width:30px">${esc(String(s.ability ?? '').toUpperCase())}</span>
			<span class="mono dimc" style="width:34px;text-align:right" data-tooltip="Ranks">${s.rank ?? 0}</span>
			${barred ? actBtn(sgn(s.mod ?? 0), 'skill', key, { cls: 'roll', disabled: true, title: 'Trained only' }) : rollBtn(sgn(s.mod ?? 0), 'skill', key)}</div>`;
	}).join('');
	// one column: 3.5e's skill names run long ("Knowledge (Architecture and Engineering)")
	return `<div class="row sp">${lbl('Skills')}<span class="dimc" style="font-size:12px">● class skill · * trained only · ranks, then total</span></div>
		<div class="sfh-skills">${rows}</div>`;
}

/* -------------------------------------------- */
/*  Spells                                       */
/* -------------------------------------------- */

/** Whether the Spells tab is showing only what can be cast now. */
let castableOnly = false;

/** Which spell level the Spells tab is showing, if not all of them. */
let spellLevel = null;

const levelName = (level) => (level ? `Level ${level}` : 'Level 0');

/** The spellbooks in use: tied to a class, or holding spells. */
function spellbooks(actor) {
	const books = actor.system?.attributes?.spells?.spellbooks ?? {};
	const spells = actor.items.filter((i) => i.type === 'spell');
	return BOOKS.map((key) => ({ key, book: books[key], spells: spells.filter((s) => (s.system?.spellbook ?? 'primary') === key) }))
		.filter(({ book, spells }) => book && (book.class && book.class !== '_hd' ? true : spells.length > 0));
}

/** What the slots of a level say: how many are left, of how many. */
const slotsAt = (book, level) => book?.spells?.[`spell${level}`] ?? null;

/** Could this be cast now? A prepared spell needs a copy left; a spontaneous one a slot of its level. */
function castable(spell, book) {
	if (book?.spontaneous) return (slotsAt(book, spell.system?.level ?? 0)?.value ?? 0) > 0;
	return (spell.system?.preparation?.preparedAmount ?? 0) > 0;
}

/** A spontaneous caster's slots of a level, one segment each, clicked as the sheet's are. */
function slotPips(bookKey, book, level) {
	const slots = slotsAt(book, level);
	const max = slots?.max ?? 0;
	if (!max) return '';
	const value = slots.value ?? 0;
	const count = Math.max(max, value);
	const pips = Array.from({ length: count }, (_, i) => `<button type="button" class="seg ${i < value ? 'on' : ''}" data-act="slot" data-k="${bookKey}.${level}:${i + 1}"
		aria-label="${esc(`${levelName(level)} slot ${i + 1}`)}"></button>`).join('');
	return `<span class="segs sfh-pips" role="group" aria-label="${esc(`${levelName(level)} slots: ${value} of ${max}`)}" data-tooltip="${esc(`${value} / ${max} left today`)}">${pips}</span>`;
}

/** A prepared spell: how many copies are left of how many prepared, and − / + to change what is prepared. */
function preparedCount(spell) {
	const prep = spell.system?.preparation ?? {};
	const left = prep.preparedAmount ?? 0;
	const max = prep.maxAmount ?? 0;
	return `<span class="row" style="gap:3px" data-tooltip="${esc(`${left} of ${max} prepared left`)}">
		${actBtn('−', 'prepare', `${spell.id}:-1`, { cls: 'sm', disabled: max <= 0 })}
		<span class="mono ${left ? '' : 'dimc'}" style="min-width:28px;text-align:center">${left}/${max}</span>
		${actBtn('+', 'prepare', `${spell.id}:1`, { cls: 'sm' })}</span>`;
}

/** One spell to a row: a name, what is prepared of it and Cast don't share a row with another spell's. */
function spellRow(spell, book) {
	const extra = book?.spontaneous ? '' : preparedCount(spell);
	const ok = castable(spell, book);
	return `<div class="li sfh-action" ${ro(`item:${spell.id}`)}>
		<span class="grow">${nameBtn(spell.name, `item:${spell.id}`)}</span>
		${extra}${actBtn('Cast', 'use', spell.id, { cls: `sm ghost${ok ? '' : ' spent'}`, title: ok ? '' : book?.spontaneous ? 'No slots of this level left' : 'None prepared left' })}</div>`;
}

function spells(actor) {
	const books = spellbooks(actor);
	if (!books.some((b) => b.spells.length)) return '<p class="dimc">No spells.</p>';
	const all = books.flatMap(({ book, spells }) => spells.filter((s) => !castableOnly || castable(s, book)));
	const levels = [...new Set(all.map((s) => s.system?.level ?? 0))].sort((a, b) => a - b);
	if (!levels.includes(spellLevel)) spellLevel = null;
	const levelButton = (key, text, tip, on) => actBtn(text, 'spellLevel', key, { cls: `sm ghost ${on ? 'on' : ''}`, title: tip });
	const picker = levels.length > 1
		? `<div class="sfh-levels" role="group" aria-label="Spell level">${levelButton('all', 'All', 'Every level', spellLevel === null)}${
			levels.map((level) => levelButton(level, String(level), levelName(level), spellLevel === level)).join('')}</div>`
		: '';
	const filter = `<div class="row sp">${lbl('Spells')}${actBtn(castableOnly ? 'Showing castable' : 'Show castable only', 'spellFilter', '', { cls: `sm ghost ${castableOnly ? 'on' : ''}` })}</div>`;

	const body = books.map(({ key, book, spells }) => {
		const cls = book.class && book.class !== '_hd' ? actor.system?.classes?.[book.class]?.name ?? book.name : book.name;
		const mod = actor.system?.abilities?.[book.ability]?.mod ?? 0;
		const head = `<div class="row sp sfh-caster"><b>${esc(cls || book.name || key)}</b><span class="row" style="gap:10px">
			<span class="mono dimc">${esc(String(book.ability ?? '').toUpperCase())}</span>
			<span class="mono">CL ${esc(book.cl?.total ?? 0)}</span>
			<span class="mono" data-tooltip="10 + spell level + ability modifier">DC ${10 + mod}+lvl</span>
			<span class="mono dimc">${book.spontaneous ? 'Spontaneous' : 'Prepared'}</span></span></div>`;
		const shown = spells.filter((s) => (!castableOnly || castable(s, book)) && (spellLevel === null || (s.system?.level ?? 0) === spellLevel));
		const bookLevels = [...new Set([...shown.map((s) => s.system?.level ?? 0),
			...(spellLevel === null ? Array.from({ length: 10 }, (_, l) => l).filter((l) => slotsAt(book, l)?.max && spells.some((s) => (s.system?.level ?? 0) === l)) : [])])].sort((a, b) => a - b);
		const sections = bookLevels.map((level) => {
			const here = shown.filter((s) => (s.system?.level ?? 0) === level).sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
			const slots = slotsAt(book, level);
			// a prepared caster fills slots; how many it has filled at this level, of how many
			const filled = spells.filter((s) => (s.system?.level ?? 0) === level).reduce((n, s) => n + (s.system?.preparation?.maxAmount ?? 0), 0);
			const side = book.spontaneous
				? slotPips(key, book, level)
				: slots?.max ? `<span class="mono ${filled > slots.max ? 'hot' : 'dimc'}" data-tooltip="Spells prepared at this level, of the slots for it">${filled} / ${slots.max} prepared</span>` : '';
			return `<div class="sec sfh-slots">${esc(levelName(level))}${side}</div>
				${here.length ? `<div class="grid1 sfh-actions">${here.map((s) => spellRow(s, book)).join('')}</div>` : ''}`;
		}).join('');
		return head + sections;
	}).join('');
	return `${filter}${picker}${body}`;
}

/* -------------------------------------------- */
/*  Feats, inventory, effects, biography         */
/* -------------------------------------------- */

const FEAT_GROUPS = ['feat', 'classFeat', 'racial', 'spellSpecialization', 'trait', 'misc'];

function feats(actor) {
	const all = actor.items.filter((i) => i.type === 'feat');
	const classes = actor.items.filter((i) => i.type === 'class').sort((a, b) => (b.system?.levels ?? 0) - (a.system?.levels ?? 0));
	const race = actor.items.find((i) => i.type === 'race');
	const heads = [...classes.map((c) => `<div class="li sfh-feat" ${ro(`item:${c.id}`)}><span class="mono dimc sfh-slot">${c.system?.levels ?? ''}</span>
		<span class="grow">${nameBtn(c.name, `item:${c.id}`)}</span></div>`),
	...(race ? [`<div class="li sfh-feat" ${ro(`item:${race.id}`)}><span class="mono dimc sfh-slot"></span><span class="grow">${nameBtn(race.name, `item:${race.id}`)}<span class="sub">Race</span></span></div>`] : [])].join('');
	const groups = FEAT_GROUPS.map((type) => {
		const list = all.filter((f) => (f.system?.featType ?? 'misc') === type || (type === 'misc' && !FEAT_GROUPS.includes(f.system?.featType)))
			.sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
		if (!list.length) return '';
		const rows = list.map((item) => `<div class="li sfh-feat" ${ro(`item:${item.id}`)}>
			<span class="grow">${nameBtn(item.name, `item:${item.id}`)}${isActive(item) ? `<span class="sub">${esc(activationLabel(item))}</span>` : ''}</span>
			${isActive(item) ? useButton(item) : ''}</div>`).join('');
		return `<div class="sec">${esc(cfg('featTypes', type))}</div>${rows}`;
	}).join('');
	return `${heads ? `<div class="sec">Classes</div>${heads}` : ''}${groups}` || '<p class="dimc">No feats.</p>';
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

/** What the Inventory tab can make blank, as the sheet's own create buttons do. */
export const CREATABLE = PHYSICAL;

function createPicker() {
	const known = game.documentTypes?.Item ?? [];
	const types = known.length ? CREATABLE.filter((t) => known.includes(t)) : CREATABLE;
	if (!types.length) return '';
	return `<select class="sel sfh-create" data-pick="create" aria-label="${esc(loc('SFH.Projection.NewItemHint'))}"
		data-tooltip="${esc(loc('SFH.Projection.NewItemHint'))}"><option value="">${esc(loc('SFH.Projection.NewItem'))}</option>${
		types.map((type) => `<option value="${type}">${esc(typeName(type))}</option>`).join('')}</select>`;
}

function itemRow(item, others) {
	const sys = item.system ?? {};
	const equip = 'equipped' in sys && item.type !== 'loot'
		? actBtn(sys.equipped ? 'Equipped' : 'Equip', 'equip', item.id, { cls: `sm ${sys.equipped ? 'on' : ''}` })
		: '';
	const use = item.type === 'consumable' ? useButton(item) : '';
	const weight = Number(sys.weight ?? 0);
	return `<div class="li flat" ${ro(`item:${item.id}`)}>
		<span class="grow">${nameBtn(item.name, `item:${item.id}`)}${item.labels?.equipmentSubtype ? `<span class="sub">${esc(item.labels.equipmentSubtype)}</span>` : ''}</span>
		<span class="row" style="gap:3px">
			${actBtn('−', 'qty', `${item.id}:-1`, { cls: 'sm' })}
			<span class="mono" style="width:26px;text-align:center">${sys.quantity ?? 1}</span>
			${actBtn('+', 'qty', `${item.id}:1`, { cls: 'sm' })}
		</span>
		<span class="mono dimc" style="width:52px;text-align:right">${Math.round(weight * (sys.quantity ?? 1) * 100) / 100} lb</span>
		${use}${equip}${givePicker(item, others)}</div>`;
}

const LOAD = ['Light', 'Medium', 'Heavy', 'Overloaded'];

function inventory(actor) {
	const sys = actor.system ?? {};
	const others = tradePartners(actor);
	const rows = INVENTORY.map(([label, type]) => {
		const items = actor.items.filter((i) => i.type === type).sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
		return items.length ? `<div class="sec">${esc(label)}</div>${items.map((i) => itemRow(i, others)).join('')}` : '';
	}).join('');
	const editable = actor.isOwner ? '' : ' disabled';
	const coins = ['pp', 'gp', 'sp', 'cp'].map((k) => `<label class="sfh-bio">${lbl(k)}
		<input class="sfh-in mono" type="number" inputmode="numeric" min="0" value="${sys.currency?.[k] ?? 0}" data-field="currency.${k}"${editable} aria-label="${k}"></label>`).join('');
	const enc = sys.attributes?.encumbrance ?? {};
	const lv = enc.levels ?? {};
	const load = enc.carriedWeight != null
		? `<div class="row sp">${lbl('Carried')}<span class="mono${(enc.level ?? 0) > 0 ? ' hot' : ''}" data-tooltip="${esc(`Light ${lv.light ?? '?'} · Medium ${lv.medium ?? '?'} · Heavy ${lv.heavy ?? '?'} lb`)}">${Math.round(enc.carriedWeight * 100) / 100} lb · ${LOAD[enc.level ?? 0] ?? ''}</span></div>`
		: '';
	return `<div class="row sfh-browse"><span class="grow"></span>${createPicker()}</div>
		<div class="sfh-coins">${coins}</div>${load}${rows || '<p class="dimc">Nothing carried.</p>'}`;
}

function effects(actor) {
	const all = buffs(actor).sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
	const row = (b) => `<div class="li" ${ro(`item:${b.id}`)}>
		<span class="grow">${nameBtn(b.name, `item:${b.id}`)}${b.system?.level ? `<span class="sub">Level ${esc(b.system.level)}</span>` : ''}</span>
		<span class="mono dimc">${esc(buffTime(b))}</span>
		${actBtn(b.system?.active ? 'Active' : 'Activate', 'buff', b.id, { cls: `sm ${b.system?.active ? 'on' : ''}` })}</div>`;
	const active = all.filter((b) => b.system?.active);
	const idle = all.filter((b) => !b.system?.active);
	const conditions = activeConditions(actor).map(([slug, name]) => `<div class="li" ${ro(`item:cond.${slug}`)}>
		<span class="grow">${nameBtn(name, `item:cond.${slug}`)}</span>${actBtn('Remove', 'cond', `${slug}:0`, { cls: 'sm' })}</div>`).join('');
	const body = [
		active.length ? `<div class="sec">Active Buffs</div>${active.map(row).join('')}` : '',
		conditions ? `<div class="sec">Conditions</div>${conditions}` : '',
		idle.length ? `<div class="sec">Inactive Buffs</div>${idle.map(row).join('')}` : '',
	].join('');
	return body || '<p class="dimc">No buffs or conditions.</p>';
}

/** Where each of the Biography tab's fields is kept. */
const CHARACTERISTICS = ['deity', 'gender', 'age', 'height', 'weight'];
const FIELDS = {
	biography: 'system.details.biography.value',
	alignment: 'system.details.alignment',
	...Object.fromEntries(CHARACTERISTICS.map((field) => [field, `system.details.${field}`])),
};

async function biography(actor) {
	const details = actor.system?.details ?? {};
	const owner = !!actor.isOwner;
	const off = owner ? '' : ' disabled';
	const name = (field) => field[0].toUpperCase() + field.slice(1);
	const alignments = Object.entries(CONFIG.D35E?.alignments ?? {});
	const alignment = alignments.length
		? `<label class="sfh-bio">${lbl('Alignment')}<select class="sel" data-field="alignment"${off}><option value=""></option>${
			alignments.map(([k, v]) => `<option value="${k}"${details.alignment === k ? ' selected' : ''}>${esc(loc(v))}</option>`).join('')}</select></label>`
		: '';
	const traits = CHARACTERISTICS.map((field) => `<label class="sfh-bio">${lbl(name(field))}
		<input class="sfh-in" type="text" value="${esc(details[field] ?? '')}" data-field="${field}"${off}></label>`).join('');
	const raw = details.biography?.value ?? '';
	const shown = await foundry.applications.ux.TextEditor.implementation.enrichHTML(raw, { secrets: owner, relativeTo: actor, rollData: actor.getRollData?.() });
	const story = owner
		? `<prose-mirror class="sfh-rich ro-text content-sized" name="${FIELDS.biography}" data-field="biography" data-document-uuid="${esc(actor.uuid ?? '')}" value="${esc(raw)}" toggled>${shown}</prose-mirror>`
		: `<div class="sfh-rich ro-text">${shown}</div>`;
	return `<div class="sec">Characteristics</div><div class="grid3">${alignment}${traits}</div>
		<div class="sec">Biography</div><div class="sfh-bio">${story}</div>`;
}

/** A field marked `data-field`, typed or saved from its editor. Coins are whole and never below zero. */
export function setField(actor, field, value) {
	const [group, name] = field.split('.');
	if (group === 'currency') {
		if (!['pp', 'gp', 'sp', 'cp'].includes(name)) return null;
		return actor.update({ [`system.currency.${name}`]: Math.max(0, Math.floor(Number(value)) || 0) });
	}
	return FIELDS[field] ? actor.update({ [FIELDS[field]]: value }) : null;
}

/* -------------------------------------------- */
/*  The readout                                  */
/* -------------------------------------------- */

/** What the readout lists about an item: the sheet's details, which do not fit on an even row. */
export function readoutMeta(doc) {
	const sys = doc.system ?? {};
	const labels = doc.labels ?? {};
	const meta = [];
	const add = (label, value) => { if (value != null && value !== '' && typeof value !== 'object') meta.push([label, String(value)]); };
	if (doc.type === 'spell') {
		add('Level', sys.level);
		add('School', cfg('spellSchools', sys.school));
		const c = sys.components ?? {};
		add('Components', [c.verbal && 'V', c.somatic && 'S', c.material && 'M', c.focus && 'F', c.divineFocus && 'DF', c.value].filter(Boolean).join(', '));
		add('Casting Time', labels.activation);
		add('Range', String(labels.range ?? '').replace(/^Range:\s*/, ''));
		add('Area', sys.spellArea);
		add('Effect', sys.spellEffect);
		add('Target', sys.target?.value);
		add('Duration', sys.spellDuration);
		add('Saving Throw', typeof sys.save === 'string' ? sys.save : sys.save?.description);
		add('Spell Resistance', sys.sr === true ? 'Yes' : sys.sr === false ? 'No' : sys.sr);
	} else {
		if (doc.type === 'feat') add('Type', cfg('featTypes', sys.featType));
		if (doc.type === 'attack' || doc.type === 'weapon') {
			add('Attack', cfg('itemActionTypes', sys.actionType));
			if (['mwak', 'rwak'].includes(sys.actionType)) add('Critical', critical(sys.ability));
		}
		if (['feat', 'consumable'].includes(doc.type) && isActive(doc)) add('Action', labels.activation);
		add('Armor', labels.armor);
		add('Kind', labels.equipmentSubtype);
		if (doc.type === 'buff') add('Remaining', buffTime(doc));
		const uses = sys.uses;
		if (uses?.max && uses.per) add('Uses', `${uses.value ?? 0} / ${uses.max}`);
	}
	add('Damage', damageText(doc));
	return meta;
}

/** A skill, or a condition the character is under: what the readout shows in place of a document. */
export function readoutEntry(actor, key) {
	if (key.startsWith('item:cond.')) {
		const slug = key.slice('item:cond.'.length);
		const name = CONFIG.D35E?.conditions?.[slug];
		return name ? { name: loc(name), kind: 'Condition', meta: [] } : null;
	}
	if (!key.startsWith('skill:')) return null;
	const id = key.slice('skill:'.length);
	const found = skillList(actor).find((s) => s.key === id);
	if (!found) return null;
	const { s, name } = found;
	return {
		name,
		kind: 'Skill',
		meta: [
			['Ability', cfg('abilities', s.ability)],
			['Ranks', String(s.rank ?? 0)],
			['Total', sgn(s.mod ?? 0)],
			['Class skill', s.cs ? 'Yes' : 'No'],
			s.rt ? ['Trained only', 'Yes'] : null,
			s.acp ? ['Armor check penalty', 'Applies'] : null,
		].filter(Boolean),
	};
}

/** The rules text of a condition, from the system's own journal of them, read once. */
const conditionText = new Map();

export async function describeEntry(actor, key) {
	if (!key.startsWith('item:cond.')) return '';
	const slug = key.slice('item:cond.'.length);
	if (conditionText.has(slug)) return conditionText.get(slug);
	const name = loc(CONFIG.D35E?.conditions?.[slug] ?? slug);
	const pack = game.packs?.get('D35E.conditions');
	let html = '';
	try {
		const entry = (await pack?.getIndex())?.find((e) => e.name.toLowerCase() === name.toLowerCase());
		const doc = entry ? await pack.getDocument(entry._id) : null;
		const page = doc?.pages?.contents?.[0];
		html = await foundry.applications.ux.TextEditor.implementation.enrichHTML(page?.text?.content ?? doc?.content ?? '', { secrets: false });
	} catch (err) {
		console.warn(`${MOD} | the condition "${name}" could not be read`, err);
	}
	conditionText.set(slug, html);
	return html;
}

/** A spell's subschool and descriptors, as the readout's chips. Nothing else has any. */
export function readoutTraits(doc) {
	if (doc.type !== 'spell') return [];
	const sys = doc.system ?? {};
	return [sys.subschool, ...String(sys.types ?? '').split(/[;,]/)].map((t) => String(t ?? '').trim()).filter(Boolean);
}

/* -------------------------------------------- */
/*  The latest roll                              */
/* -------------------------------------------- */

/** The formula a card's tooltip shows, when the card keeps one. */
const tooltipFormula = (html) => {
	if (!html) return '';
	const holder = document.createElement('div');
	holder.innerHTML = html;
	return holder.querySelector('.dice-formula')?.textContent?.trim() ?? '';
};

/**
 * A damage roll's formula, from its tooltip: a table with a row per damage type, each its type,
 * its total and the formula in brackets, written without its plus signs ("1d4 1"). They are put
 * back: "1d4 + 1 Force".
 */
const damageFormula = (html) => {
	if (!html) return '';
	const holder = document.createElement('div');
	holder.innerHTML = html;
	return [...holder.querySelectorAll('tr')].map((tr) => {
		const cells = [...tr.querySelectorAll('td')].map((td) => td.textContent.replace(/\s+/g, ' ').trim());
		const inner = cells.join(' ').match(/\(([^)]*)\)/)?.[1]?.trim() ?? '';
		const dice = inner.replace(/(\S)\s+(?=[\d(])/g, '$1 + ');
		return [dice, cells[0]].filter(Boolean).join(' ');
	}).filter(Boolean).join(' + ') || tooltipFormula(html);
};

/**
 * A chat message, as the latest-roll strip shows it, or null. The system writes its own cards and
 * keeps what was rolled in the message's flags rather than its rolls: an attack's to-hit and damage
 * per attack, a check's or save's roll and total.
 */
export function readRoll(message) {
	const d = message.flags?.D35E?.chatTemplateData;
	if (!d || !message.isContentVisible || !message.visible) return null;
	const actor = game.actors.get(message.speaker?.actor ?? d.actor?.id);
	if (!actor) return null;
	const base = { actorId: actor.id, messageId: message.id, dc: null, damage: false, outcome: null };

	const first = d.attacks?.[0];
	if (first) {
		const count = d.attacks.length;
		const name = `${d.name ?? 'Attack'}${count > 1 ? ` (${count} attacks)` : ''}`;
		if (first.hasAttack && first.attack?.total != null && first.attack.total !== -1337) {
			const outcome = first.attack.isCrit ? { label: 'Threat', tone: 'good' } : first.attack.isFumble ? { label: 'Fumble', tone: 'bad' } : null;
			return { ...base, name, formula: tooltipFormula(first.attack.tooltip), total: first.attack.total, outcome };
		}
		if (first.hasDamage && first.damage?.total != null) {
			return { ...base, name: `${d.name ?? 'Damage'} · damage`, formula: damageFormula(first.damage.tooltip), total: first.damage.total };
		}
		return null;
	}

	if (d.roll && (d.total != null || d.roll.total != null)) {
		const holder = document.createElement('div');
		holder.innerHTML = message.content ?? '';
		const heading = holder.querySelector('h3')?.textContent?.trim() ?? '';
		// a save's card is headed "Name - Fortitude"; the strip already says whose roll it is
		const name = heading.replace(new RegExp(`^${actor.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*-\\s*`), '') || d.saveTypeName || d.sklName || 'Roll';
		const die = d.roll.terms?.find?.((t) => t.faces === 20);
		const natural = die?.results?.[0]?.result;
		const outcome = natural === 20 ? { label: 'Natural 20', tone: 'good' } : natural === 1 ? { label: 'Natural 1', tone: 'bad' } : null;
		return { ...base, name, formula: d.roll.formula ?? '', total: d.total ?? d.roll.total, outcome };
	}
	return null;
}

/* -------------------------------------------- */
/*  Moving items                                 */
/* -------------------------------------------- */

async function moveItem(item, target) {
	const data = item.toObject();
	delete data._id;
	await target.createEmbeddedDocuments('Item', [data]);
	return item.delete();
}

/** Give an item to another character; the GM's client makes the move when the giver can't. */
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

/* -------------------------------------------- */
/*  Acting                                       */
/* -------------------------------------------- */

export async function act(actor, action, key, event) {
	const [a, b] = String(key ?? '').split(':');
	switch (action) {
		case 'ability': return actor.rollAbility?.(key, { event });
		case 'save': return actor.rollSavingThrow?.(key, null, null, { event });
		case 'skill': return actor.rollSkill?.(key, { event });
		case 'initiative': return actor.rollInitiative?.({ createCombatants: true, rerollInitiative: game.user.isGM });
		case 'bab': return actor.rollBAB?.({ event });
		case 'melee': return actor.rollMelee?.({ event });
		case 'ranged': return actor.rollRanged?.({ event });
		case 'grapple': return actor.rollGrapple?.(null, { event });
		case 'use': return actor.items.get(key)?.use?.({ ev: event });
		case 'rest': return actor.promptRest?.();
		case 'prepare': return prepare(actor, a, Number(b));
		case 'slot': return setSlots(actor, a, Number(b));
		case 'spellFilter':
			castableOnly = !castableOnly;
			return 'redraw';
		case 'spellLevel':
			spellLevel = key === 'all' ? null : Number(key);
			return 'redraw';
		case 'buff': {
			const buff = actor.items.get(key);
			return buff?.type === 'buff' ? buff.update({ 'system.active': !buff.system.active }) : null;
		}
		// the × on an effect's chip ends the buff; it stays on the Effects tab to start again
		case 'delete': {
			const item = actor.items.get(key);
			return item?.type === 'buff' ? item.update({ 'system.active': false }) : null;
		}
		case 'cond': return setCondition(actor, a, Number(b) > 0);
		case 'addCondition': return setCondition(actor, key, true);
		case 'stat':
			if (a === 'negativeLevels') return actor.update({ 'system.attributes.energyDrain': Math.max(0, Number(b) || 0) });
			return null;
		case 'setResource':
			if (a === 'nonlethal') return actor.update({ 'system.attributes.hp.nonlethal': Math.max(0, Math.round(Number(b)) || 0) });
			return null;
		case 'equip': {
			const item = actor.items.get(key);
			return item?.update({ 'system.equipped': !item.system.equipped });
		}
		case 'qty': return changeQuantity(actor, a, Number(b));
		case 'giveItem': return giveItem(actor, a, b);
		case 'heal': return heal(actor, Math.abs(Number(key)));
		case 'damage': return damage(actor, Math.abs(Number(key)));
		case 'setHp': return setHp(actor, Number(key));
		case 'setTemp': return actor.update({ 'system.attributes.hp.temp': Math.max(0, Number(key)) });
		case 'setXp': return actor.update({ 'system.details.xp.value': Math.max(0, Math.round(Number(key))) });
		// a character's maximum comes from its class levels and Constitution, on the sheet
		case 'setMax': return 'redraw';
		default: return null;
	}
}

/**
 * Prepare one more copy of a spell, or one fewer. The system keeps how many are prepared and how
 * many of those are left; both move together, so a copy prepared now can be cast now.
 */
function prepare(actor, id, delta) {
	const spell = actor.items.get(id);
	if (spell?.type !== 'spell' || !delta) return null;
	const prep = spell.system?.preparation ?? {};
	const max = Math.max(0, (prep.maxAmount ?? 0) + delta);
	const left = Math.max(0, Math.min(max, (prep.preparedAmount ?? 0) + delta));
	return spell.update({ 'system.preparation.maxAmount': max, 'system.preparation.preparedAmount': left });
}

/** A spontaneous caster's slots of a level: clicking a segment sets what is left, and the last lit one takes it back. */
function setSlots(actor, where, n) {
	const [book, level] = String(where).split('.');
	if (!BOOKS.includes(book)) return null;
	const slots = actor.system?.attributes?.spells?.spellbooks?.[book]?.spells?.[`spell${level}`];
	if (!slots) return null;
	return actor.update({ [`system.attributes.spells.spellbooks.${book}.spells.spell${level}.value`]: slots.value === n ? n - 1 : n });
}

function setCondition(actor, slug, on) {
	if (!(slug in (CONFIG.D35E?.conditions ?? {}))) return null;
	return actor.update({ [`system.attributes.conditions.${slug}`]: on });
}

async function changeQuantity(actor, id, delta) {
	const item = actor.items.get(id);
	if (!item) return;
	return item.update({ 'system.quantity': Math.max(0, (item.system.quantity ?? 1) + delta) });
}

/** In 3.5e a character lives to −9: hit points go below zero, down to −10. */
function setHp(actor, value) {
	const hp = actor.system.attributes.hp;
	return actor.update({ 'system.attributes.hp.value': Math.max(hp.min ?? -10, Math.min(hp.max ?? value, Math.round(value))) });
}

/** Temporary hit points go first, then the rest. */
function damage(actor, amount) {
	const hp = actor.system.attributes.hp;
	const fromTemp = Math.min(hp.temp ?? 0, amount);
	return actor.update({
		'system.attributes.hp.temp': (hp.temp ?? 0) - fromTemp,
		'system.attributes.hp.value': Math.max(hp.min ?? -10, (hp.value ?? 0) - (amount - fromTemp)),
	});
}

/** Healing heals as much nonlethal damage as it does lethal, as the rules have it. */
function heal(actor, amount) {
	const hp = actor.system.attributes.hp;
	return actor.update({
		'system.attributes.hp.value': Math.min(hp.max ?? 0, (hp.value ?? 0) + amount),
		'system.attributes.hp.nonlethal': Math.max(0, (hp.nonlethal ?? 0) - amount),
	});
}
