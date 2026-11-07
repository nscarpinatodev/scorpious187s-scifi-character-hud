/*
 * Harness glue.
 *
 * Stubs just enough of Foundry — settings, i18n, hooks, notifications — for the module's
 * own code to run unmodified, and supplies a character shaped like a real PF2e/SF2e actor
 * so the adapter and the projection can be rendered and measured without Foundry.
 */
const MODULE_WORDS = await (await fetch(new URL('../lang/en.json', import.meta.url))).json();
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
			// the conversion keeps the Kinetic Shield's points as temporary hit points
			hp: { value: 71, max: 84, temp: 22 },
			ac: { value: 25 },
			speed: { value: 25 },
			reach: { base: 5 },
			dying: { value: 0, max: 4 },
			wounded: { value: 0 },
			doomed: { value: 0 },
		},
		details: { level: { value: 6 }, xp: { value: 640, max: 1000 }, languages: { value: ['common', 'thessian'] }, biography: {} },
		traits: { size: { value: 'med' } },
		// as the system keeps them: speeds under movement, senses under perception, the initiative's statistic
		movement: { speeds: { land: { value: 25 }, swim: { value: 15 } } },
		perception: { senses: [{ type: 'low-light-vision', label: 'Low-Light Vision' }] },
		initiative: { statistic: 'perception', totalModifier: 11 },
		resources: {},
	},
	// the roll options a feat lets the character switch, by domain then option, as the system keeps them
	synthetics: {
		toggles: {
			all: {
				'biotic-momentum': { label: 'Biotic Momentum', domain: 'all', option: 'biotic-momentum', itemId: 'a1', placement: 'actions', checked: false, enabled: true, alwaysActive: false, suboptions: [] },
			},
		},
		resources: {},
	},
	async toggleRollOption(domain, option, itemId, checked, suboption) {
		const t = actor.synthetics.toggles[domain]?.[option];
		if (!t) return null;
		t.checked = checked;
		for (const o of t.suboptions ?? []) o.selected = o.value === suboption;
		actor.lastToggle = { domain, option, itemId, checked, suboption };
		return checked;
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
	conditions: [
		{ id: 'c1', name: 'Quickened', value: null, slug: 'quickened' },
		{ id: 'c2', name: 'Frightened', value: 2, slug: 'frightened' },
		{ id: 'c3', name: 'Off-Guard', value: null, slug: 'off-guard', isLocked: true },
	],
	effects: [],
	itemTypes: {
		effect: [
			{ id: 'e1', name: 'Biotic Barrier', system: { duration: { value: 1, unit: 'minute' } } },
			// an effect with a counter, raised and lowered by its own increase() and decrease()
			{
				id: 'e2', name: 'Overcharge', type: 'effect', system: { duration: { unit: 'unlimited' }, badge: { type: 'counter', value: 2, min: 1, max: 3 } },
				async increase() { this.system.badge.value = Math.min(this.system.badge.max, this.system.badge.value + 1); },
				async decrease() { this.system.badge.value -= 1; },
			},
		],
		action: [
			{ id: 'a1', name: 'Biotic Charge', system: { actionType: { value: 'action' }, actions: { value: 2 }, traits: { value: ['biotic', 'manipulate'] } } },
			{ id: 'a2', name: 'Nova', system: { actionType: { value: 'action' }, actions: { value: 1 }, traits: { value: ['biotic'] } } },
			{ id: 'a3', name: 'Shockwave', system: { actionType: { value: 'action' }, actions: { value: 2 }, traits: { value: ['biotic', 'manipulate'] } } },
			{ id: 'a4', name: 'Adrenaline Rush', system: { actionType: { value: 'action' }, actions: { value: 1 }, traits: { value: [] } } },
			{ id: 'a5', name: 'Take Cover', system: { actionType: { value: 'action' }, actions: { value: 1 }, traits: { value: ['basic'] } } },
			{ id: 'a6', name: 'Aid', system: { actionType: { value: 'reaction' }, traits: { value: ['basic'] } } },
			{ id: 'a7', name: 'Search', system: { actionType: { value: 'passive' }, traits: { value: ['concentrate', 'exploration'] } } },
			{ id: 'a8', name: 'Earn Income', system: { actionType: { value: 'passive' }, traits: { value: ['downtime'] } } },
		],
		// the conversion's Kinetic Shield, and a capacitor invested to raise it
		equipment: [
			{ id: 'k1', name: 'Kinetic Shield', type: 'equipment', flags: { 'mass-effect-sf2e-conversion': { shieldMax: 30, shieldRegen: 10 } }, system: { traits: { value: [] } } },
			{ id: 'k2', name: 'Shield Capacitor I', type: 'equipment', flags: { 'mass-effect-sf2e-conversion': { shieldHpBonus: 10 } }, system: { traits: { value: ['invested'] }, equipped: { invested: true } } },
		],
		feat: [
			{ id: 'f1', name: 'Combat Training', system: { category: 'class', level: { value: 1 }, traits: { value: [] } } },
			{ id: 'f2', name: 'Tenacious Survivor', system: { category: 'ancestry', level: { value: 1 }, traits: { value: ['human'] } } },
			{ id: 'f3', name: 'Battle-Hardened', system: { category: 'ancestry', level: { value: 5 }, traits: { value: ['human'] } } },
		],
	},
	items: {
		get: (id) => actor.itemTypes.effect.find((e) => e.id === id) ?? null,
		find: () => null,
		filter: () => [],
	},
	getFlag: (scope, key) => ({ paragon: 62, renegade: 18 }[key] ?? null),
	// an update as Foundry makes one: the changes written in by path, and the last one kept to look at
	async update(changes, options = {}) {
		for (const [path, value] of Object.entries(changes)) {
			const keys = path.split('.');
			const last = keys.pop();
			keys.reduce((at, k) => (at[k] ??= {}), actor)[last] = value;
		}
		actor.lastUpdate = { changes, options };
		return actor;
	},
};

// the strikes the adapter reads off system.actions
actor.system.actions = [
	{ label: 'M-23 Eviscerator', totalModifier: 11, traits: [{ label: 'scatter 5' }, { label: 'tech' }], variants: [{ label: '+11' }, { label: '+6' }, { label: '+1' }], damage: () => {}, critical: () => {} },
	{ label: 'M-11 Suppressor', totalModifier: 11, traits: [{ label: 'tech' }], variants: [{ label: '+11' }, { label: '+6' }, { label: '+1' }], damage: () => {}, critical: () => {} },
	{ label: 'Fist', totalModifier: 13, traits: [{ label: 'agile' }, { label: 'nonlethal' }], variants: [{ label: '+13' }, { label: '+9' }, { label: '+5' }], damage: () => {}, critical: () => {} },
];

// inventory is a collection with extras hanging off it, as PF2e's is
actor.inventory = [
	{ id: 'i1', name: 'M-23 Eviscerator', type: 'weapon', quantity: 1, isEquipped: true, isInvested: null, system: { bulk: { value: 2 }, usage: { type: 'held', hands: 2 }, equipped: { carryType: 'held', handsHeld: 2 } } },
	{ id: 'i2', name: 'M-11 Suppressor', type: 'weapon', quantity: 1, isEquipped: false, isInvested: null, system: { bulk: { value: 1 }, usage: { type: 'held', hands: 1 }, equipped: { carryType: 'worn' } } },
	{ id: 'i3', name: 'Colossus Armor', type: 'armor', quantity: 1, isEquipped: true, isInvested: null, system: { bulk: { value: 2 }, usage: { type: 'worn', where: 'armor' }, equipped: { carryType: 'worn', inSlot: true } } },
	{ id: 'i6', name: 'Onyx Armor', type: 'armor', quantity: 1, isEquipped: false, isInvested: null, system: { bulk: { value: 2 }, usage: { type: 'worn', where: 'armor' }, equipped: { carryType: 'worn', inSlot: false } } },
	{ id: 'i7', name: 'Amp Implant', type: 'equipment', quantity: 1, isEquipped: true, isInvested: true, system: { bulk: { value: 0 }, usage: { type: 'implanted' }, equipped: { carryType: 'implanted' } } },
	{ id: 'i8', name: 'Kinetic Bracer', type: 'equipment', quantity: 1, isEquipped: false, isInvested: false, system: { bulk: { value: 'L' }, usage: { type: 'worn', where: 'bracers' }, equipped: { carryType: 'dropped' } } },
	{ id: 'i4', name: 'Medi-Gel', type: 'consumable', quantity: 4, isEquipped: false, isInvested: null, system: { bulk: { value: 'L' }, usage: { type: 'held', hands: 1 }, equipped: { carryType: 'worn' } } },
	{ id: 'i5', name: 'Omni-Gel', type: 'consumable', quantity: 6, isEquipped: false, isInvested: null, system: { bulk: { value: 0 }, usage: { type: 'carried' }, equipped: { carryType: 'worn' } } },
];
actor.inventory.invested = { value: 1, max: 10 };
actor.inventory.bulk = { value: '4.6', encumberedAt: 7, max: 12 };
actor.inventory.coins = { toString: () => '4,820 cr' };

// spellcasting: collections of spells, each with an entry whose sheet data is what PF2e's
// own getSheetData returns — groups of slots, already worked out
const spell = (id, name, time, rank) => ({ id, name, rank, system: { time: { value: time }, traits: { value: ['concentrate'] }, description: { value: '' } } });
const collection = (id, spells, sheet) => Object.assign([...spells], {
	get: (sid) => spells.find((s) => s.id === sid) ?? null,
	entry: { id, cast: () => {}, getSheetData: async () => ({ id, ...sheet }) },
});
const warp = spell('s1', 'Warp', '2', 1);
const lift = spell('s2', 'Lift', '2', 2);
const stasis = spell('s3', 'Stasis', 'reaction', 1);
const barrier = spell('s4', 'Biotic Barrier', '1', 3);
const collections = [
	collection('sc3', [lift, warp], {
		name: 'Prepared Spells', sort: 3, tradition: 'arcane', isPrepared: true,
		statistic: { check: { mod: 14 }, dc: { value: 24 } },
		groups: [{ id: 1, label: '1st Rank', active: [{ spell: warp, expended: true }, { spell: lift }] }],
	}),
	collection('sc4', [warp], {
		name: 'Innate Spells', sort: 4, tradition: 'occult', isInnate: true,
		statistic: { dc: { value: 24 } },
		groups: [{ id: 1, label: '1st Rank', active: [{ spell: warp, uses: { value: 0, max: 1 } }] }],
	}),
	collection('sc1', [warp, lift, stasis], {
		name: 'Biotic Spells', sort: 1, tradition: 'occult', isPrepared: false,
		statistic: { check: { mod: 14 }, dc: { value: 24 } },
		groups: [
			{ id: 'cantrips', label: 'Cantrips', active: [{ spell: stasis, castRank: 3 }] },
			{ id: 1, label: '1st Rank', uses: { value: 2, max: 3 }, active: [{ spell: warp }] },
			{ id: 2, label: '2nd Rank', uses: { value: 0, max: 2 }, active: [{ spell: lift, expended: true }, { spell: warp, castRank: 2, signature: true, virtual: true, expended: true }] },
		],
	}),
	collection('sc2', [barrier], {
		name: 'Vanguard Focus', sort: 2, tradition: 'occult', isPrepared: false, isFocusPool: true,
		statistic: { check: { mod: 14 }, dc: { value: 24 } },
		groups: [{ id: 3, label: 'Focus Spells', uses: { value: 1, max: 2 }, active: [{ spell: barrier }] }],
	}),
];
actor.spellcasting = Object.assign([...collections.map((c) => c.entry)], {
	collections: Object.assign([...collections], { get: (id) => collections.find((c) => c.entry.id === id) ?? null }),
	get: (id) => collections.find((c) => c.entry.id === id)?.entry ?? null,
});

// the system's words for the carry menu, from its lang/en.json
const PF2E_WORDS = {
	'PF2E.BiographyAppearance': 'Appearance', 'PF2E.BiographyBackStory': 'Backstory', 'PF2E.BiographyBirthPlace': 'Birth Place',
	'PF2E.BiographyPersonalityHeader': 'Personality', 'PF2E.BiographyAttitude': 'Attitude', 'PF2E.BiographyBeliefs': 'Beliefs',
	'PF2E.BiographyEdicts': 'Edicts', 'PF2E.BiographyAnathema': 'Anathema', 'PF2E.BiographyLikes': 'Likes', 'PF2E.BiographyDislikes': 'Dislikes',
	'PF2E.BiographyCatchphrases': 'Catchphrases', 'PF2E.BiographyCampaignNotesHeader': 'Campaign', 'PF2E.BiographyCampaignNotes': 'Notes',
	'PF2E.BiographyAllies': 'Allies', 'PF2E.BiographyEnemies': 'Enemies', 'PF2E.BiographyOrganizations': 'Organizations',
	'PF2E.Height': 'Height', 'PF2E.Weight': 'Weight', 'PF2E.EmptySlot': 'Empty Slot',
	'PF2E.Actor.Character.FeatSlot.AncestryHeader': 'Ancestry Feats', 'PF2E.Actor.Character.FeatSlot.ClassHeader': 'Class Feats', 'PF2E.Actor.Character.FeatSlot.SkillHeader': 'Skill Feats',
	'PF2E.Actor.Character.FeatSlot.GeneralHeader': 'General Feats', 'PF2E.Actor.Character.FeatSlot.ClassFeaturesHeader': 'Class Features', 'PF2E.Actor.Character.FeatSlot.AncestryFeaturesHeader': 'Ancestry Features',
	'PF2E.Actor.Character.FeatSlot.BonusHeader': 'Bonus Feats',
	'PF2E.CarryType.attached': 'Attached', 'PF2E.CarryType.held1': 'Held 1H', 'PF2E.CarryType.held2': 'Held 2H',
	'PF2E.CarryType.implanted': 'Implanted', 'PF2E.CarryType.worn': 'Worn', 'PF2E.CarryType.stowed': 'Stowed',
	'PF2E.CarryType.dropped': 'Dropped', 'PF2E.Item.Physical.Usage.WornSlot.armor': 'Armor',
	'PF2E.Item.Physical.Usage.WornSlot.bracers': 'Bracers',
	'PF2E.Actor.Inventory.Section.WeaponsAndShields': 'Weapons & Shields', 'TYPES.Item.armor': 'Armor', 'TYPES.Item.equipment': 'Equipment',
	'PF2E.Item.Consumable.Plural': 'Consumables', 'TYPES.Item.ammo': 'Ammunition', 'TYPES.Item.treasure': 'Treasure',
	'PF2E.Item.Container.Plural': 'Containers', 'PF2E.OpenItemTitle': 'Toggle Container Contents', 'PF2E.CapacityBarLabel': 'Capacity',
	'COMBAT.Begin': 'Start Combat', 'COMBAT.NotStarted': 'Not Started', 'COMBAT.TurnEnd': 'End Turn',
	'PF2E.ActorSizeMedium': 'Medium', 'PF2E.ActorSizeSmall': 'Small', 'PF2E.ActorSizeLarge': 'Large', 'PF2E.ActorSizeTiny': 'Tiny',
	'PF2E.Actor.Creature.Language.common': 'Common', 'PF2E.PerceptionLabel': 'Perception',
	'PF2E.Actor.Speed.Type.Land': 'Land', 'PF2E.Actor.Speed.Type.Swim': 'Swim', 'PF2E.Actor.Speed.Type.Climb': 'Climb',
	'PF2E.Actor.Speed.Type.Fly': 'Fly', 'PF2E.Actor.Speed.Type.Burrow': 'Burrow',
	'PF2E.StaminaPointsHeader': 'Stamina', 'PF2E.Actor.Resource.Resolve': 'Resolve',
	'COMBAT.TurnNext': 'Next Turn', 'COMBAT.TurnPrev': 'Previous Turn', 'COMBAT.InitiativeRoll': 'Roll Initiative',
};

// another player's character, for an item to go to
const crewmate = { id: 'vex', name: 'Vex Kaori', type: 'character', hasPlayerOwner: true };

// the one piece of Foundry's data layer the settings ask for
globalThis.foundry = {
	data: { fields: { ColorField: class {} } },
	// the enricher only draws links and rolls, which nothing here needs
	applications: { ux: { TextEditor: { implementation: { enrichHTML: async (html) => html ?? '' } } } },
};

globalThis.game = {
	ready: true,
	system: { id: 'pf2e' },
	get user() { return { character: actor }; },
	get actors() {
		const all = [actor, crewmate];
		return Object.assign(all, { get: (id) => all.find((a) => a.id === id) ?? null });
	},
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
	// the module's own words, as Foundry would load them from lang/en.json
	i18n: {
		localize: (k) => PF2E_WORDS[k] ?? MODULE_WORDS[k] ?? k,
		format: (k, data) => (k === 'PF2E.Item.Physical.Usage.WornParenthetical' ? `Worn (${data.where})`
			: k === 'COMBAT.Round' ? `Round ${data.round}`
				: MODULE_WORDS[k] ? MODULE_WORDS[k].replace(/\{(\w+)\}/g, (_, n) => data?.[n] ?? '') : `${k} ${JSON.stringify(data)}`),
	},
	modules: { get: () => ({ version: 'harness', active: true }) },
	// the hide key, as Configure Controls would hold it
	keybindings: { get: () => [{ key: 'KeyH', modifiers: ['Alt'] }] },
};
// a slice of PF2e's condition list, in its own shape: slug to label key
globalThis.CONFIG = {
	PF2E: {
		actorSizes: { tiny: 'PF2E.ActorSizeTiny', sm: 'PF2E.ActorSizeSmall', med: 'PF2E.ActorSizeMedium', lg: 'PF2E.ActorSizeLarge' },
		languages: { common: 'PF2E.Actor.Creature.Language.common', thessian: 'Thessian' },
		conditionTypes: {
			blinded: 'Blinded', clumsy: 'Clumsy', dazzled: 'Dazzled', doomed: 'Doomed', dying: 'Dying',
			frightened: 'Frightened', grabbed: 'Grabbed', 'off-guard': 'Off-Guard', prone: 'Prone',
			quickened: 'Quickened', sickened: 'Sickened', slowed: 'Slowed', stunned: 'Stunned',
			wounded: 'Wounded', 'persistent-damage': 'Persistent Damage',
		},
	},
};
globalThis.ui = { notifications: { info: (m) => console.info('notify:', m), warn: (m) => console.warn('notify:', m), error: (m) => console.error('notify:', m) } };
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
const { seqMs } = await import('../scripts/constants.mjs');
const { PipBoy } = await import('../scripts/interface/pipboy.mjs');

// what module.mjs does in Foundry: the switch says what it wants, the projection obeys
Hooks.on('sfhPower', async (on, { sequence } = {}) => {
	if (PipBoy.power(on, { sequence })) return;
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
	setTimeout(() => DeviceChrome.power || Projection.close(), seqMs('off', store.device)); // as module.mjs does (the setting is the choice)
});

Hooks.on('sfhHidden', (hidden) => {
	if (!hidden) Projection.scheduleFit();
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

Hooks.on('closeApplicationV2', (app) => PipBoy.closed(app));
const { holdApTracker } = await import('../scripts/interface/ap-tracker.mjs');
Hooks.on('renderAPTrackerV2', () => { if (holdApTracker()) DeviceChrome.fit(); });

globalThis.SFH = { DeviceChrome, Projection, PipBoy, store, actor };

// ?mockup adds the sequence mock-ups (tools/mockup-sequences.mjs) and their picker
if (new URLSearchParams(location.search).has('mockup')) await import('./mockup-sequences.mjs');
