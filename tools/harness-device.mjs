/*
 * Harness glue.
 *
 * Stubs just enough of Foundry — settings, i18n, hooks, notifications — for the module's
 * own code to run unmodified, and supplies a character shaped like a real PF2e/SF2e actor
 * so the adapter and the projection can be rendered and measured without Foundry.
 */
const store = { device: 'omni', worldDevice: 'omni', sequences: true, deckSize: 40, grid: 'panels' };
const onChange = {};
const hooks = {};

const skill = (label, mod, rank) => ({ label, mod, rank, roll: () => console.log('roll', label) });

/** A stand-in Starfinder 2e character: the shapes the adapter reads, and nothing else. */
const actor = {
	id: 'asha',
	name: 'Asha Rourke',
	type: 'character',
	isOwner: true,
	hasPlayerOwner: true,
	system: {
		attributes: {
			hp: { value: 71, max: 84, temp: 0 },
			ac: { value: 25 },
			speed: { value: 25 },
			dying: { value: 0, max: 4 },
			wounded: { value: 0 },
			doomed: { value: 0 },
		},
		details: { level: { value: 6 }, xp: { value: 640, max: 1000 }, languages: { value: ['Common', 'Thessian'] }, biography: {} },
		traits: { size: { value: 'Medium' } },
	},
	heroPoints: { value: 2, max: 3 },
	classDC: { value: 22 },
	saves: {
		fortitude: { mod: 13, rank: 3, roll: () => {} },
		reflex: { mod: 18, rank: 4, roll: () => {} },
		will: { mod: 11, rank: 2, roll: () => {} },
	},
	perception: { mod: 11, rank: 2, roll: () => {} },
	abilities: { str: { mod: 2 }, dex: { mod: 4 }, con: { mod: 3 }, int: { mod: 1 }, wis: { mod: 1 }, cha: { mod: 5 } },
	skills: {
		acrobatics: skill('Acrobatics', 14, 3),
		athletics: skill('Athletics', 10, 2),
		computers: skill('Computers', 9, 2),
		diplomacy: skill('Diplomacy', 13, 3),
		intimidation: skill('Intimidation', 13, 3),
		medicine: skill('Medicine', 7, 1),
		occultism: skill('Occultism', 9, 2),
		piloting: skill('Piloting', 12, 2),
		stealth: skill('Stealth', 12, 2),
		survival: skill('Survival', 7, 1),
	},
	ancestry: { name: 'Human' },
	heritage: { name: 'Alliance Biotic' },
	class: { name: 'Vanguard' },
	background: { name: 'Biotic Prodigy' },
	conditions: [{ id: 'c1', name: 'Quickened', value: null, slug: 'quickened' }],
	effects: [],
	itemTypes: {
		effect: [{ id: 'e1', name: 'Biotic Barrier', system: { duration: { value: 1, unit: 'minute' } } }],
		action: [
			{ id: 'a1', name: 'Biotic Charge', system: { actionType: { value: 'action' }, actions: { value: 2 }, traits: { value: ['biotic', 'manipulate'] } } },
			{ id: 'a2', name: 'Nova', system: { actionType: { value: 'action' }, actions: { value: 1 }, traits: { value: ['biotic'] } } },
			{ id: 'a3', name: 'Shockwave', system: { actionType: { value: 'action' }, actions: { value: 2 }, traits: { value: ['biotic', 'manipulate'] } } },
			{ id: 'a4', name: 'Adrenaline Rush', system: { actionType: { value: 'action' }, actions: { value: 1 }, traits: { value: [] } } },
			{ id: 'a5', name: 'Take Cover', system: { actionType: { value: 'action' }, actions: { value: 1 }, traits: { value: ['basic'] } } },
			{ id: 'a6', name: 'Aid', system: { actionType: { value: 'reaction' }, traits: { value: ['basic'] } } },
		],
		feat: [
			{ id: 'f1', name: 'Combat Training', system: { category: 'class', level: { value: 1 }, traits: { value: [] } } },
			{ id: 'f2', name: 'Tenacious Survivor', system: { category: 'ancestry', level: { value: 1 }, traits: { value: ['human'] } } },
			{ id: 'f3', name: 'Battle-Hardened', system: { category: 'ancestry', level: { value: 5 }, traits: { value: ['human'] } } },
		],
	},
	items: {
		get: () => null,
		find: () => null,
		filter: () => [],
	},
	getFlag: (scope, key) => ({ paragon: 62, renegade: 18 }[key] ?? null),
};

// the strikes the adapter reads off system.actions
actor.system.actions = [
	{ label: 'M-23 Eviscerator', totalModifier: 11, traits: [{ label: 'scatter 5' }, { label: 'tech' }], variants: [{ label: '+11' }, { label: '+6' }, { label: '+1' }], damage: () => {}, critical: () => {} },
	{ label: 'M-11 Suppressor', totalModifier: 11, traits: [{ label: 'tech' }], variants: [{ label: '+11' }, { label: '+6' }, { label: '+1' }], damage: () => {}, critical: () => {} },
	{ label: 'Fist', totalModifier: 13, traits: [{ label: 'agile' }, { label: 'nonlethal' }], variants: [{ label: '+13' }, { label: '+9' }, { label: '+5' }], damage: () => {}, critical: () => {} },
];

// inventory is a collection with extras hanging off it, as PF2e's is
actor.inventory = [
	{ id: 'i1', name: 'M-23 Eviscerator', type: 'weapon', quantity: 1, isEquipped: true, system: { bulk: { value: 2 } } },
	{ id: 'i2', name: 'M-11 Suppressor', type: 'weapon', quantity: 1, isEquipped: false, system: { bulk: { value: 1 } } },
	{ id: 'i3', name: 'Colossus Armor', type: 'armor', quantity: 1, isEquipped: true, system: { bulk: { value: 2 } } },
	{ id: 'i4', name: 'Medi-Gel', type: 'consumable', quantity: 4, isEquipped: false, system: { bulk: { value: 'L' } } },
	{ id: 'i5', name: 'Omni-Gel', type: 'consumable', quantity: 6, isEquipped: false, system: { bulk: { value: 0 } } },
];
actor.inventory.bulk = { value: '4.6', encumberedAt: 7, max: 12 };
actor.inventory.coins = { toString: () => '4,820 cr' };

globalThis.game = {
	ready: true,
	system: { id: 'pf2e' },
	get user() { return { character: actor }; },
	get actors() { return Object.assign([actor], { get: (id) => (id === actor.id ? actor : null) }); },
	settings: {
		register(mod, key, cfg) {
			if (cfg.onChange) onChange[key] = cfg.onChange;
			if (!(key in store)) store[key] = cfg.default;
		},
		get: (mod, key) => store[key],
		set: (mod, key, value) => {
			store[key] = value;
			onChange[key]?.(value);
		},
		sheet: { render: () => {} },
	},
	i18n: {
		localize: (k) => k,
		format: (k, data) => `${k} ${JSON.stringify(data)}`,
	},
	modules: { get: () => ({ version: 'harness', active: true }) },
};
globalThis.ui = { notifications: { warn: (m) => console.warn('notify:', m), error: (m) => console.error('notify:', m) } };
globalThis.Hooks = {
	on(name, fn) { (hooks[name] ??= []).push(fn); },
	once(name, fn) { this.on(name, fn); },
	callAll(name, ...args) {
		(globalThis.__hooks ??= []).push([name, ...args]);
		for (const fn of hooks[name] ?? []) fn(...args);
	},
};

const { DeviceChrome } = await import('../scripts/device/chrome.mjs');
const { registerSettings } = await import('../scripts/settings.mjs');
const { Projection } = await import('../scripts/projection/projection.mjs');
const { SEQ } = await import('../scripts/constants.mjs');

// what module.mjs does in Foundry: the switch says what it wants, the projection obeys
Hooks.on('sfhPower', async (on, { sequence } = {}) => {
	if (on) {
		const raised = await Projection.open();
		if (!raised) return DeviceChrome.setPower(false, { silent: true });
		if (sequence) {
			DeviceChrome.playSequence('on');
			Projection.playSequence('on');
		}
		return;
	}
	if (!sequence) return Projection.close();
	DeviceChrome.playSequence('off');
	Projection.playSequence('off');
	setTimeout(() => Projection.close(), SEQ.off);
});

registerSettings(() => {
	DeviceChrome.refresh();
	Projection.syncDevice();
});
DeviceChrome.mount();

// the ten macro slots Foundry would have rendered
document.getElementById('action-bar').innerHTML = Array.from({ length: 10 }, (_, i) =>
	`<li class="slot ${i % 3 ? 'full' : ''}" role="button" data-action="execute" data-slot="${i + 1}">
		<span class="key">${i === 9 ? 0 : i + 1}</span>
	</li>`).join('');
DeviceChrome.fit();   // Foundry renders the bar before we mount; the harness does not

document.getElementById('rigDevice').addEventListener('change', (e) => game.settings.set(null, 'device', e.target.value));
document.getElementById('rigSize').addEventListener('input', (e) => game.settings.set(null, 'deckSize', Number(e.target.value)));
document.getElementById('rigPower').addEventListener('click', () => DeviceChrome.toggle());
addEventListener('resize', () => Projection.scheduleFit());

globalThis.SFH = { DeviceChrome, Projection, store, actor };
