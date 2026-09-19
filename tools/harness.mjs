/**
 * Harness stubs.
 *
 * Just enough of Foundry's globals for the real shell code to run in a plain browser, so
 * the layout, the compact view and the power sequences can be checked without a world.
 * Nothing here ships: it exists so `tools/preview.mjs` can screenshot the actual module.
 */

const SETTINGS = {
	defaultTheme: 'omni',
	meExtras: 'auto',
	chrome: 'full',
	scanlines: true,
	scale: 1,
	sequences: true,
	closeSequence: false,
	compactAt: 1040,
	readout: true,
};

const ITEMS = new Map([
	['w1', { id: 'w1', name: 'M-23 Eviscerator', type: 'weapon', system: { traits: { value: ['tech', 'scatter-5'] }, level: { value: 3 }, damage: { dice: 3, die: 'd8', damageType: 'piercing' }, range: 15, description: { value: '<p>Fires razor-edged ceramic frags that shred organic matter at close range.</p>' } } }],
	['w2', { id: 'w2', name: 'M-11 Suppressor', type: 'weapon', system: { traits: { value: ['tech'] }, level: { value: 5 }, damage: { dice: 2, die: 'd6', damageType: 'piercing' }, range: 50, description: { value: '<p>A lightweight combat pistol for operatives who need a quiet sidearm.</p>' } } }],
	['a1', { id: 'a1', name: 'Biotic Charge', type: 'feat', system: { traits: { value: ['biotic', 'manipulate', 'move'] }, description: { value: '<p>You surround yourself with a biotic field and launch forward, crashing into enemies with tremendous impact force.</p>' } } }],
	['a2', { id: 'a2', name: 'Nova', type: 'feat', system: { traits: { value: ['biotic', 'manipulate'] }, description: { value: '<p>You discharge your barrier in a devastating point-blank explosion.</p>' } } }],
	['a3', { id: 'a3', name: 'Shockwave', type: 'feat', system: { traits: { value: ['biotic', 'manipulate'] }, description: { value: '<p>You slam biotic energy into the ground, sending a rolling kinetic wave along the surface.</p>' } } }],
]);

const FLAGS = { world: { paragon: 62, renegade: 18 } };

const actor = {
	id: 'harness-actor',
	name: 'Asha Rourke',
	isOwner: true,
	system: { attributes: { hp: { value: 71, max: 84, temp: 18 } } },
	items: {
		get: (id) => ITEMS.get(id),
		find: (fn) => [...ITEMS.values()].find(fn),
		contents: [...ITEMS.values()],
		[Symbol.iterator]() { return ITEMS.values(); },
	},
	getFlag: (scope, key) => FLAGS[scope]?.[key],
	getRollData: () => ({}),
	sheet: { render() {} },
};

// Shield and barrier items, which the Dossier reads by flag.
const shieldItem = { name: 'Kinetic Shield', getFlag: (m, k) => (k === 'shieldMax' ? 30 : undefined) };
const barrierItem = { name: 'Biotic Barrier', getFlag: (m, k) => ({ barrierMax: 20, barrierCurrent: 12 }[k]) };
const extraItems = [shieldItem, barrierItem];
const baseFind = actor.items.find;
actor.items.find = (fn) => baseFind(fn) ?? extraItems.find(fn);

globalThis.game = {
	system: { id: 'sf2e' },
	user: { isGM: true },
	settings: {
		get: (_mod, key) => SETTINGS[key],
		set: async (_mod, key, value) => { SETTINGS[key] = value; rebuild(); },
	},
	i18n: {
		localize: (k) => STRINGS[k] ?? k,
		format: (k, data) => (STRINGS[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => data[n] ?? ''),
	},
	modules: { get: () => ({ active: true, api: null }) },
	keybindings: { get: () => [{ key: 'KeyH', modifiers: ['Alt'] }] },
	actors: { get: () => actor },
};

globalThis.Hooks = { on: () => 0, off: () => {}, once: () => 0, callAll: () => {} };
globalThis.ui = { notifications: { info: console.log, warn: console.warn, error: console.error } };
globalThis.foundry = {
	utils: { escapeHTML: (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) },
	applications: {
		apps: { DocumentSheetConfig: class { constructor() {} render() {} } },
		ux: { TextEditor: { implementation: { enrichHTML: async (html) => html } } },
		api: { DialogV2: { prompt: async () => null } },
	},
};
globalThis.fromUuidSync = () => null;

const STRINGS = await fetch('../lang/en.json').then((r) => r.json());

const { applyShell, playSequence } = await import('../scripts/shell.mjs');

const app = {
	actor,
	element: document.getElementById('app'),
	_sfhBooted: false,
};

function rebuild() {
	const form = document.getElementById('form');
	app._sfhBooted = harnessState.booted;
	applyShell(app, form);
}

const harnessState = { booted: false };
rebuild();

// Controls for the preview script to drive.
globalThis.harness = {
	set: async (key, value) => { SETTINGS[key] = value; rebuild(); },
	width: (px) => { document.getElementById('app').style.setProperty('--w', `${px}px`); },
	drawer: (open) => { document.getElementById('form').dataset.drawer = open ? 'open' : 'closed'; },
	sequence: (kind) => playSequence(document.getElementById('form'), kind),
	hover: (itemId) => {
		const row = document.querySelector(`[data-item-id="${itemId}"]`);
		row?.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
	},
};
