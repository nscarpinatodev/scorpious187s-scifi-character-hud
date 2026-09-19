/**
 * Harness for the standalone HUD sheet.
 *
 * Stubs just enough of Foundry — ApplicationV2, i18n, settings, a 5e-shaped actor — to
 * render the real sheet markup in a plain browser, so layout can be checked before it
 * reaches a world. Nothing here ships.
 */

const SETTINGS = { defaultTheme: 'omni', meExtras: 'off', chrome: 'full', scanlines: true, scale: 1, sequences: false, closeSequence: false, compactAt: 1040, readout: true };
const STRINGS = await fetch('../lang/en.json').then((r) => r.json());

const mkItem = (id, name, type, system) => ({ id, name, type, img: 'icons/svg/item-bag.svg', system });

const ITEMS = [
	mkItem('i1', 'Laser Pistol', 'weapon', { quantity: 1, weight: { value: 2 }, equipped: true, activities: new Set(['a']), description: { value: '<p>A sleek handheld emitter. Uses energy cells.</p>' } }),
	mkItem('i2', 'Mono-Rapier', 'weapon', { quantity: 1, weight: { value: 2 }, equipped: true, activities: new Set(['a']), description: { value: '<p>A rapier with a monomolecular edge.</p>' } }),
	mkItem('i3', 'Potion of Healing', 'consumable', { quantity: 2, weight: { value: 0.5 }, uses: { value: 2, max: 2 }, activities: new Set(['a']), description: { value: '<p>Restores 2d4+2 hit points.</p>' } }),
	mkItem('f1', 'Sneak Attack', 'feat', { description: { value: '<p>Once per turn, deal an extra 3d6 damage.</p>' } }),
	mkItem('f2', 'Cunning Action', 'feat', { description: { value: '<p>Bonus action: Dash, Disengage or Hide.</p>' } }),
	mkItem('s1', 'Mage Hand', 'spell', { level: 0, description: { value: '<p>A spectral hand appears.</p>' } }),
	mkItem('s2', 'Shield', 'spell', { level: 1, activities: new Set(['a']), description: { value: '<p>+5 AC until the start of your next turn.</p>' } }),
	mkItem('s3', 'Disguise Self', 'spell', { level: 1, description: { value: '<p>Change your appearance for 1 hour.</p>' } }),
];

const ability = (value, mod, save, proficient = false) => ({ value, mod, save: { value: save }, proficient });
const skill = (ability, total, value, passive) => ({ ability, total, value, passive });

const actor = {
	id: 'harness', name: 'Vex Kaori', img: 'icons/svg/mystery-man.svg',
	classes: { rogue: { name: 'Rogue', system: { levels: 5 } } },
	system: {
		details: { level: 5, race: 'Human', background: 'Criminal', xp: { value: 7600, max: 14000 }, biography: { value: '<p>Ran data for the Magenta Syndicate until a job went sideways.</p>' } },
		attributes: {
			hp: { value: 31, max: 38, temp: 0 }, hd: { value: 4, max: 5 },
			death: { success: 1, failure: 0 }, inspiration: true, exhaustion: 0,
			ac: { value: 16 }, init: { total: 7 }, prof: 3, spelldc: 13,
			movement: { walk: 30, units: 'ft' },
			encumbrance: { value: 34, max: 120, pct: 28 },
		},
		abilities: { str: ability(8, -1, -1), dex: ability(18, 4, 7, true), con: ability(14, 2, 2), int: ability(14, 2, 5, true), wis: ability(12, 1, 1), cha: ability(12, 1, 1) },
		skills: {
			acr: skill('dex', 7, 1), ani: skill('wis', 1, 0), arc: skill('int', 2, 0), ath: skill('str', -1, 0),
			dec: skill('cha', 4, 1), his: skill('int', 2, 0), ins: skill('wis', 1, 0), itm: skill('cha', 1, 0),
			inv: skill('int', 5, 1), med: skill('wis', 1, 0), nat: skill('int', 2, 0), prc: skill('wis', 4, 1, 14),
			prf: skill('cha', 1, 0), per: skill('cha', 1, 0), rel: skill('int', 2, 0), slt: skill('dex', 10, 2),
			ste: skill('dex', 10, 2), sur: skill('wis', 1, 0),
		},
		spells: { spell1: { value: 3, max: 4 }, spell2: { value: 0, max: 0 } },
		currency: { pp: 0, gp: 412, ep: 0, sp: 30, cp: 4 },
	},
	items: { contents: ITEMS, get: (id) => ITEMS.find((i) => i.id === id), filter: (fn) => ITEMS.filter(fn), find: (fn) => ITEMS.find(fn) },
	effects: { contents: [{ id: 'e1', name: 'Blessed', img: 'icons/svg/aura.svg', disabled: false, duration: { label: '1 minute' } }], get: () => null },
	getFlag: () => undefined,
	getRollData: () => ({}),
};

globalThis.CONFIG = {
	DND5E: {
		abilities: Object.fromEntries(['str', 'dex', 'con', 'int', 'wis', 'cha'].map((k) => [k, { abbreviation: k }])),
		skills: {
			acr: { label: 'Acrobatics' }, ani: { label: 'Animal Handling' }, arc: { label: 'Arcana' }, ath: { label: 'Athletics' },
			dec: { label: 'Deception' }, his: { label: 'History' }, ins: { label: 'Insight' }, itm: { label: 'Intimidation' },
			inv: { label: 'Investigation' }, med: { label: 'Medicine' }, nat: { label: 'Nature' }, prc: { label: 'Perception' },
			prf: { label: 'Performance' }, per: { label: 'Persuasion' }, rel: { label: 'Religion' }, slt: { label: 'Sleight of Hand' },
			ste: { label: 'Stealth' }, sur: { label: 'Survival' },
		},
	},
	Item: { typeLabels: {} },
	Actor: { sheetClasses: { character: {} } },
};

globalThis.game = {
	system: { id: 'dnd5e' },
	settings: { get: (_m, k) => SETTINGS[k], set: async (_m, k, v) => { SETTINGS[k] = v; await rebuild(); } },
	i18n: { localize: (k) => STRINGS[k] ?? k, format: (k, d) => (STRINGS[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => d[n] ?? '') },
	modules: { get: () => ({ active: false }) },
	keybindings: { get: () => [{ key: 'KeyH', modifiers: ['Alt'] }] },
};
globalThis.Hooks = { on: () => 0, off: () => {}, once: () => 0 };
globalThis.ui = { notifications: { info: console.log, warn: console.warn, error: console.error } };
globalThis.foundry = {
	utils: { escapeHTML: (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) },
	applications: {
		api: { DocumentSheetV2: class { constructor(options = {}) { this.options = options; this.document = options.document; } render() { return rebuild(); } } },
		apps: { DocumentSheetConfig: class {} },
		ux: { TextEditor: { implementation: { enrichHTML: async (html) => html } } },
		instances: new Map(),
	},
};

const { makeHudSheet } = await import('../scripts/hud-app.mjs');
const system = await import('../scripts/systems/dnd5e.mjs');

const Sheet = makeHudSheet(system);
const app = new Sheet({ document: actor });
app.element = document.getElementById('app');

async function rebuild() {
	const frame = await app._renderHTML();
	document.getElementById('content').replaceChildren(frame);
}
await rebuild();

globalThis.harness = {
	set: async (key, value) => { SETTINGS[key] = value; await rebuild(); },
	tab: async (id) => { app.tab = id; await rebuild(); },
	width: (px) => document.getElementById('app').style.setProperty('--w', `${px}px`),
	size: async (size) => {
		document.getElementById('app').style.setProperty('--w', size === 'wide' ? '1120px' : size === 'compact' ? '900px' : '700px');
		app._sfhSize = size;
		await rebuild();
	},
};
