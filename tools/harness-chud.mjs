/** Harness for the combat HUD: stubs Foundry, renders the real bar over a fake canvas. */

const SETTINGS = { defaultTheme: 'omni', chrome: 'clean', scanlines: true, scale: 1, combatHud: true, meExtras: 'off' };
const STRINGS = await fetch('../lang/en.json').then((r) => r.json());

const mk = (id, name, type, activation, extra = {}) => ({
	id, name, type, img: `https://placehold.co/64x64/2a1c10/ff9a3c?text=${encodeURIComponent(name.slice(0, 2))}`,
	system: { activation: { type: activation }, description: { value: `<p>${name} does something useful.</p>` }, ...extra },
});

const ITEMS = [
	mk('w1', 'Laser Pistol', 'weapon', 'action', { quantity: 1, equipped: true }),
	mk('w2', 'Mono-Rapier', 'weapon', 'action', { quantity: 1, equipped: true }),
	mk('s1', 'Shocking Grasp', 'spell', 'action'),
	mk('s2', 'Shield', 'spell', 'reaction'),
	mk('f1', 'Cunning Action', 'feat', 'bonus'),
	mk('f2', 'Steady Aim', 'feat', 'bonus'),
	mk('f3', 'Uncanny Dodge', 'feat', 'reaction'),
	mk('c1', 'Potion of Healing', 'consumable', 'action', { quantity: 2, uses: { value: 2, max: 2 } }),
	mk('f4', 'Lucky', 'feat', 'special', { uses: { value: 3, max: 3 } }),
];

const skill = (total) => ({ total });
const ability = (save) => ({ save: { value: save } });

const actor = {
	id: 'harness', name: 'Vex Kaori', img: 'https://placehold.co/160x160/241a2e/ff9a3c?text=VK', isOwner: true,
	classes: { rogue: { name: 'Rogue', system: { levels: 5 } } },
	prototypeToken: { texture: { src: '' } },
	system: {
		details: { race: 'Human' },
		attributes: { hp: { value: 24, max: 38, temp: 4 }, ac: { value: 16 }, movement: { walk: 30, units: 'ft' } },
		abilities: { str: ability(-1), dex: ability(7), con: ability(2), int: ability(5), wis: ability(1), cha: ability(1) },
		skills: { acr: skill(7), ath: skill(-1), dec: skill(4), ins: skill(1), inv: skill(5), prc: skill(4), slt: skill(10), ste: skill(10) },
	},
	items: { contents: ITEMS, get: (id) => ITEMS.find((i) => i.id === id), filter: (fn) => ITEMS.filter(fn), find: (fn) => ITEMS.find(fn) },
	effects: { contents: [
		{ id: 'e1', name: 'Blessed', img: 'https://placehold.co/32x32/1b2a3a/7fd3ff?text=B', disabled: false },
		{ id: 'e2', name: 'Hasted', img: 'https://placehold.co/32x32/2a2210/ffd34f?text=H', disabled: false },
	] },
	getFlag: () => undefined,
	getRollData: () => ({}),
	sheet: { render: () => console.log('open sheet') },
};

globalThis.CONFIG = {
	DND5E: {
		abilities: { str: { label: 'Strength' }, dex: { label: 'Dexterity' }, con: { label: 'Constitution' }, int: { label: 'Intelligence' }, wis: { label: 'Wisdom' }, cha: { label: 'Charisma' } },
		skills: { acr: { label: 'Acrobatics' }, ath: { label: 'Athletics' }, dec: { label: 'Deception' }, ins: { label: 'Insight' }, inv: { label: 'Investigation' }, prc: { label: 'Perception' }, slt: { label: 'Sleight of Hand' }, ste: { label: 'Stealth' } },
	},
	Item: { typeLabels: {} },
	statusEffects: [],
};

globalThis.game = {
	system: { id: 'dnd5e' },
	ready: true,
	user: { character: actor, isGM: true },
	settings: { get: (_m, k) => SETTINGS[k], set: async (_m, k, v) => { SETTINGS[k] = v; render(); } },
	i18n: { localize: (k) => STRINGS[k] ?? k, format: (k, d) => (STRINGS[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => d[n] ?? '') },
	modules: { get: () => ({ active: false }) },
	keybindings: { get: () => [] },
};
globalThis.Hooks = { on: () => 0, off: () => {}, once: () => 0, callAll: () => {} };
globalThis.ui = { notifications: { info: console.log, warn: console.warn, error: console.error } };
globalThis.canvas = { tokens: { controlled: [] } };
globalThis.foundry = {
	utils: { escapeHTML: (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) },
	applications: { instances: new Map(), api: { DocumentSheetV2: class {} }, apps: { DocumentSheetConfig: class {} }, ux: { TextEditor: { implementation: { enrichHTML: async (h) => h } } } },
};

const system = await import('../scripts/systems/dnd5e.mjs');
const chud = await import('../scripts/combat-hud.mjs');
const { initCombatHud, show, render } = chud;

initCombatHud(system);
show(actor);

globalThis.harness = {
	set: async (k, v) => { SETTINGS[k] = v; render(); },
	drawer: (which) => {
		document.querySelector(`[data-chud="drawer"][data-drawer="${which}"]`)?.click();
	},
};
