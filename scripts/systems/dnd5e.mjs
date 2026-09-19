/**
 * D&D 5e system adapter.
 *
 * Two jobs, and only these two:
 *   read(actor)          → a plain view model the HUD renders
 *   act(actor, action)   → calls the system's own API for anything that rolls or changes
 *
 * The HUD never writes a roll formula or touches rules maths. Every button here ends in a
 * dnd5e call, so results, dialogs, active effects and chat cards are the system's.
 */

export const id = 'dnd5e';

export const TABS = [
	{ id: 'details', label: 'SFH.Tab.Details', icon: 'character' },
	{ id: 'inventory', label: 'SFH.Tab.Inventory', icon: 'inventory' },
	{ id: 'features', label: 'SFH.Tab.Features', icon: 'feats' },
	{ id: 'spells', label: 'SFH.Tab.Spells', icon: 'spells' },
	{ id: 'effects', label: 'SFH.Tab.Effects', icon: 'effects' },
	{ id: 'biography', label: 'SFH.Tab.Biography', icon: 'biography' },
];

const num = (v) => Number(v) || 0;
const pct = (v, m) => (m > 0 ? Math.max(0, Math.min(100, (v / m) * 100)) : 0);
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);

export function read(actor) {
	const sys = actor.system ?? {};
	const attrs = sys.attributes ?? {};
	const hp = attrs.hp ?? {};
	const hd = attrs.hd ?? {};
	const death = attrs.death ?? {};
	const cls = Object.values(actor.classes ?? {})
		.map((c) => `${c.name} ${c.system?.levels ?? ''}`.trim())
		.join(' / ');
	const species = actor.system?.details?.race || actor.items.find((i) => i.type === 'race')?.name || '';
	const background = actor.system?.details?.background || actor.items.find((i) => i.type === 'background')?.name || '';

	const abilities = Object.entries(sys.abilities ?? {}).map(([key, a]) => ({
		key,
		label: CONFIG.DND5E?.abilities?.[key]?.abbreviation?.toUpperCase() ?? key.toUpperCase(),
		score: num(a.value),
		mod: sgn(num(a.mod)),
		save: sgn(num(a.save?.value ?? a.save)),
		proficient: !!a.proficient,
	}));

	const skills = Object.entries(sys.skills ?? {}).map(([key, s]) => ({
		key,
		label: CONFIG.DND5E?.skills?.[key]?.label ?? key,
		ability: (s.ability ?? '').toUpperCase(),
		total: sgn(num(s.total)),
		rank: num(s.value),                       // 0 none, 0.5 half, 1 proficient, 2 expertise
	}));

	const items = actor.items.contents;
	const physical = items.filter((i) => ['weapon', 'equipment', 'consumable', 'tool', 'loot', 'container'].includes(i.type));

	return {
		name: actor.name,
		img: actor.img,
		subtitle: [species, background, cls].filter(Boolean).join(' · '),
		level: num(sys.details?.level),
		xp: { value: num(sys.details?.xp?.value), max: num(sys.details?.xp?.max), pct: pct(num(sys.details?.xp?.value), num(sys.details?.xp?.max)) },

		vitals: {
			hp: { value: num(hp.value), max: num(hp.max), temp: num(hp.temp), pct: pct(num(hp.value), num(hp.max)) },
			hitDice: { value: num(hd.value), max: num(hd.max) },
			death: { success: num(death.success), failure: num(death.failure) },
			inspiration: !!sys.attributes?.inspiration,
			exhaustion: num(sys.attributes?.exhaustion),
		},

		defenses: [
			{ key: 'ac', label: 'SFH.Stat.AC', value: attrs.ac?.value ?? 10, primary: true },
			{ key: 'init', label: 'SFH.Stat.Initiative', value: sgn(num(attrs.init?.total)), action: 'roll-init' },
			{ key: 'speed', label: 'SFH.Stat.Speed', value: `${attrs.movement?.walk ?? 0} ${attrs.movement?.units ?? 'ft'}` },
			{ key: 'prof', label: 'SFH.Stat.Proficiency', value: sgn(num(attrs.prof)) },
			{ key: 'passive', label: 'SFH.Stat.Passive', value: num(skills.find((s) => s.key === 'prc')?.passive ?? sys.skills?.prc?.passive) },
			{ key: 'spelldc', label: 'SFH.Stat.SpellDC', value: num(attrs.spelldc) },
		],

		abilities,
		skills,
		traits: traits(actor),
		conditions: conditions(actor),

		inventory: physical.map(itemRow),
		features: items.filter((i) => ['feat', 'race', 'background', 'class', 'subclass'].includes(i.type)).map(itemRow),
		spells: spellbook(actor),
		effects: actor.effects.contents.map((e) => ({
			id: e.id,
			name: e.name,
			img: e.img,
			disabled: e.disabled,
			duration: e.duration?.label ?? '',
		})),
		biography: sys.details?.biography?.value ?? '',
		currency: Object.entries(sys.currency ?? {}).map(([key, value]) => ({ key, value: num(value) })),
		encumbrance: {
			value: Math.round(num(attrs.encumbrance?.value)),
			max: Math.round(num(attrs.encumbrance?.max)),
			pct: num(attrs.encumbrance?.pct),
		},
	};
}

/* -------------------------------------------- */
/*  The combat HUD's view model                  */
/* -------------------------------------------- */

/** Which action-economy group an item belongs to, from its activities. */
function activationOf(item) {
	const activities = item.system?.activities;
	const first = activities?.contents?.[0] ?? (activities ? [...activities][0] : null);
	return first?.activation?.type ?? item.system?.activation?.type ?? null;
}

const GROUPS = [
	{ id: 'action', label: 'SFH.Hud.Action', types: ['action', 'attack'] },
	{ id: 'bonus', label: 'SFH.Hud.BonusAction', types: ['bonus'] },
	{ id: 'reaction', label: 'SFH.Hud.Reaction', types: ['reaction'] },
	{ id: 'free', label: 'SFH.Hud.Free', types: ['special', 'legendary', 'lair', 'crew'] },
];

export function hud(actor) {
	const sys = actor.system ?? {};
	const attrs = sys.attributes ?? {};
	const hp = attrs.hp ?? {};

	const usable = actor.items.filter((i) => activationOf(i));
	const groups = GROUPS.map((g) => ({
		id: g.id,
		label: g.label,
		items: usable.filter((i) => g.types.includes(activationOf(i))).map(itemRow),
	}));

	return {
		name: actor.name,
		img: actor.img,
		subtitle: [sys.details?.race, Object.values(actor.classes ?? {}).map((c) => `${c.name} ${c.system?.levels ?? ''}`.trim()).join(' / ')]
			.filter(Boolean).join(' · '),
		img2: actor.prototypeToken?.texture?.src,
		hp: { value: num(hp.value), max: num(hp.max), temp: num(hp.temp), pct: pct(num(hp.value), num(hp.max)) },
		ac: attrs.ac?.value ?? 10,
		speed: `${attrs.movement?.walk ?? 0} ${attrs.movement?.units ?? 'ft'}`,
		groups,
		effects: actor.effects.contents.filter((e) => !e.disabled).map((e) => ({ name: e.name, img: e.img })),
		skills: Object.entries(sys.skills ?? {}).map(([key, s]) => ({
			key, label: CONFIG.DND5E?.skills?.[key]?.label ?? key, total: sgn(num(s.total)),
		})).sort((a, b) => a.label.localeCompare(b.label)),
		saves: Object.entries(sys.abilities ?? {}).map(([key, a]) => ({
			key, label: CONFIG.DND5E?.abilities?.[key]?.label ?? key.toUpperCase(), total: sgn(num(a.save?.value ?? a.save)),
		})),
		inventory: actor.items
			.filter((i) => ['weapon', 'equipment', 'consumable', 'tool'].includes(i.type))
			.map(itemRow),
	};
}

/** The reference block beside the skills: senses, languages and proficiencies. */
function traits(actor) {
	const sys = actor.system ?? {};
	const list = (values, config) => [...(values ?? [])]
		.map((v) => config?.[v]?.label ?? config?.[v] ?? v)
		.filter(Boolean)
		.join(', ');
	const out = [
		['SFH.Traits.Senses', `${game.i18n.localize('SFH.Stat.Passive')} ${num(sys.skills?.prc?.passive)}`],
		['SFH.Traits.Languages', list(sys.traits?.languages?.value, CONFIG.DND5E?.languages)],
		['SFH.Traits.Tools', Object.keys(sys.tools ?? {}).map((t) => CONFIG.DND5E?.tools?.[t]?.label ?? t).join(', ')],
		['SFH.Traits.Armor', list(sys.traits?.armorProf?.value, CONFIG.DND5E?.armorProficiencies)],
		['SFH.Traits.Weapons', list(sys.traits?.weaponProf?.value, CONFIG.DND5E?.weaponProficiencies)],
	];
	return out.filter(([, value]) => value).map(([label, value]) => ({ label, value }));
}

/** Conditions the character has, and the ones that can be added. */
function conditions(actor) {
	const statuses = CONFIG.statusEffects ?? [];
	const active = [...(actor.statuses ?? [])];
	return {
		active: active.map((id) => {
			const status = statuses.find((s) => s.id === id);
			return { id, name: game.i18n.localize(status?.name ?? status?.label ?? id) };
		}),
		available: statuses
			.filter((s) => !active.includes(s.id))
			.map((s) => ({ id: s.id, name: game.i18n.localize(s.name ?? s.label ?? s.id) }))
			.sort((a, b) => a.name.localeCompare(b.name)),
	};
}

function itemRow(item) {
	const uses = item.system?.uses ?? {};
	return {
		id: item.id,
		name: item.name,
		img: item.img,
		type: item.type,
		quantity: num(item.system?.quantity ?? 1),
		weight: item.system?.weight?.value ?? item.system?.weight ?? 0,
		equipped: !!item.system?.equipped,
		usable: !!item.system?.activities?.size,
		uses: uses.max ? { value: num(uses.value ?? uses.spent !== undefined ? num(uses.max) - num(uses.spent) : 0), max: num(uses.max) } : null,
		subtitle: item.system?.type?.label ?? CONFIG.Item?.typeLabels?.[item.type] ?? item.type,
	};
}

function spellbook(actor) {
	const spells = actor.items.filter((i) => i.type === 'spell');
	const levels = new Map();
	for (const spell of spells) {
		const level = num(spell.system?.level);
		if (!levels.has(level)) levels.set(level, []);
		levels.get(level).push(itemRow(spell));
	}
	const slots = actor.system?.spells ?? {};
	return [...levels.entries()]
		.sort((a, b) => a[0] - b[0])
		.map(([level, list]) => {
			const key = level === 0 ? null : `spell${level}`;
			const slot = key ? slots[key] : null;
			return {
				level,
				label: level === 0 ? 'SFH.Spells.Cantrips' : null,
				slots: slot ? { value: num(slot.value), max: num(slot.max) } : null,
				spells: list.sort((a, b) => a.name.localeCompare(b.name)),
			};
		});
}

/* -------------------------------------------- */
/*  Actions — every one of these is a system call */
/* -------------------------------------------- */

export async function act(actor, action, data = {}) {
	const item = data.itemId ? actor.items.get(data.itemId) : null;
	switch (action) {
		case 'roll-ability': return actor.rollAbilityCheck({ ability: data.key });
		case 'roll-save': return actor.rollSavingThrow({ ability: data.key });
		case 'roll-skill': return actor.rollSkill({ skill: data.key });
		case 'roll-init': return actor.rollInitiativeDialog();
		case 'roll-death': return actor.rollDeathSave();
		case 'roll-hd': return actor.rollHitDie();
		case 'rest-short': return actor.shortRest();
		case 'rest-long': return actor.longRest();
		case 'use-item': return item?.use();
		case 'open-item': return item?.sheet?.render(true);
		case 'toggle-equip': return item?.update({ 'system.equipped': !item.system.equipped });
		case 'toggle-effect': {
			const effect = actor.effects.get(data.effectId);
			return effect?.update({ disabled: !effect.disabled });
		}
		case 'toggle-status': return actor.toggleStatusEffect(data.key);
		case 'toggle-inspiration':
			return actor.update({ 'system.attributes.inspiration': !actor.system.attributes.inspiration });
		case 'adjust-hp': {
			const hp = actor.system.attributes.hp;
			const value = Math.clamp(num(hp.value) + num(data.delta), 0, num(hp.max));
			return actor.update({ 'system.attributes.hp.value': value });
		}
		case 'set-hp': {
			const max = num(actor.system.attributes.hp.max);
			return actor.update({ 'system.attributes.hp.value': Math.clamp(num(data.value), 0, max) });
		}
		case 'set-temp':
			return actor.update({ 'system.attributes.hp.temp': Math.max(0, num(data.value)) });
		case 'adjust-temp': {
			const temp = num(actor.system.attributes.hp.temp) + num(data.delta);
			return actor.update({ 'system.attributes.hp.temp': Math.max(0, temp) });
		}
		case 'adjust-exhaustion': {
			const value = Math.clamp(num(actor.system.attributes.exhaustion) + num(data.delta), 0, 6);
			return actor.update({ 'system.attributes.exhaustion': value });
		}
		case 'spend-slot': {
			const key = `spell${data.level}`;
			const slot = actor.system.spells?.[key];
			if (!slot) return null;
			const value = Math.clamp(num(slot.value) + num(data.delta), 0, num(slot.max));
			return actor.update({ [`system.spells.${key}.value`]: value });
		}
		default:
			return null;
	}
}
