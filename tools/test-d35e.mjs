/*
 * Run the real 3.5e adapter and projection against a stand-in character in the shapes read from
 * the D35E system (3.1.0, on Foundry 13): a wizard with a prepared spellbook and a sorcerer's
 * spontaneous one, attacks the system made from weapons, skills with ranks, buffs and conditions.
 * Checks what each tab shows, that every press goes to the system's own call, how the latest-roll
 * strip reads the system's cards, and that every tab fits on every device. Screenshots for
 * looking at are written to a folder if one is given.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// puppeteer lives in the sibling conversion repo; this tool is dev-only
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const dir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');
const shotsTo = process.argv[2];

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1.25 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, Projection, store } = SFH;
	store.sequences = false;
	const calls = [];
	const record = (name) => (...args) => { calls.push([name, ...args]); return null; };
	const last = () => calls.at(-1);
	const lastNamed = (name) => [...calls].reverse().find((c) => c[0] === name);

	/* ---- the system, as far as the adapter touches it ---- */
	globalThis.CONFIG = { ...(globalThis.CONFIG ?? {}), D35E: {
		abilities: { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' },
		savingThrows: { fort: 'Fortitude', ref: 'Reflex', will: 'Will' },
		skills: { spl: 'Spellcraft', coc: 'Concentration', clm: 'Climb', kar: 'Knowledge (Arcana)', umd: 'Use Magic Device', lis: 'Listen' },
		conditions: { blind: 'Blind', shaken: 'Shaken', prone: 'Prone', dying: 'Dying' },
		actorSizes: { med: 'Medium' },
		alignments: { lg: 'Lawful Good', tn: 'True Neutral' },
		languages: { common: 'Common', draconic: 'Draconic' },
		featTypes: { feat: 'Feat', classFeat: 'Class Feature', racial: 'Racial Trait', spellSpecialization: 'Spell School/Domain', trait: 'Trait', misc: 'Miscellaneous' },
		spellSchools: { evo: 'Evocation', abj: 'Abjuration' },
		itemActionTypes: { mwak: 'Melee Weapon Attack', rwak: 'Ranged Weapon Attack', other: 'Other' },
		abilityActivationTypes: { standard: 'Standard Action', full: 'Full-round Action', free: 'Free Action', minute: 'Minute' },
		damageTypes: {}, conditionTypes: {},
	} };
	// what of Foundry's Roll the adapter uses to put a damage formula into words
	// as Foundry's safeEval does, with Math's functions in scope
	globalThis.Roll = { replaceFormulaData: (f, data) => f.replace(/@([a-zA-Z.]+)/g, (_, k) => String(k.split('.').reduce((o, p) => o?.[p], data) ?? 0)), safeEval: (expr) => Function('sandbox', `with (sandbox) { return ${expr}; }`)(Math) };	globalThis.foundry.utils = { ...(foundry.utils ?? {}), getProperty: (o, p) => p.split('.').reduce((a, k) => a?.[k], o) };
	const notices = [];
	globalThis.ui.notifications = { info: (m) => notices.push(['info', m]), warn: (m) => notices.push(['warn', m]), error: (m) => notices.push(['error', m]) };
	game.documentTypes = { Item: ['weapon', 'equipment', 'consumable', 'loot', 'class', 'spell', 'feat', 'buff', 'attack', 'race', 'full-attack', 'valuable'] };
	game.packs = new Map([['D35E.conditions', {
		getIndex: async () => [{ _id: 'c1', name: 'Shaken' }],
		getDocument: async () => ({ pages: { contents: [{ text: { content: '<p>A shaken character takes a −2 penalty on attack rolls.</p>' } }] } }),
	}]]);

	/* ---- Tanik, a fifth-level wizard, in those shapes ---- */
	const items = new Map();
	const item = (id, name, type, system = {}, extra = {}) => {
		const made = { id, name, type, uuid: `Actor.t.Item.${id}`, isOwner: true, system: { ...system }, flags: {}, labels: {},
			update: async (d) => { calls.push(['item.update', id, d]); }, delete: async () => { calls.push(['item.delete', id]); },
			use: record(`use:${id}`), getRollData: () => ({ cl: 5, sizeDifference: 0, critMult: 2 }), toObject: () => ({ _id: id, name, type, system }), ...extra };
		items.set(id, made);
		return made;
	};
	item('race', 'Human', 'race');
	item('wiz', 'Wizard', 'class', { levels: 5 });
	item('staff', 'Quarterstaff', 'weapon', { equipped: true, quantity: 1, weight: 4 });
	item('chain', 'Chainmail', 'equipment', { equipped: false, quantity: 1, weight: 40, activation: { type: 'minute' } }, { labels: { equipmentSubtype: 'Medium Armor', armor: '5 AC', activation: '4 Minute' } });
	item('bolts', 'Crossbow Bolt', 'loot', { quantity: 20, weight: 0.1 });
	item('potion', 'Potion of Cure Light Wounds', 'consumable', { quantity: 2, weight: 0.1, activation: { type: 'standard' }, uses: { value: 1, max: 1, per: 'single' } });
	item('a-staff', 'Quarterstaff', 'attack', { actionType: 'mwak', ability: { attack: 'str', critRange: '20', critMult: '2' }, damage: { parts: [['sizeRoll(1, 6, @sizeDifference, @critMult)', 'B', '']] } });
	item('a-xbow', 'Light Crossbow', 'attack', { actionType: 'rwak', ability: { attack: 'dex', critRange: '19', critMult: '2' }, range: { value: 80, units: 'ft' }, damage: { parts: [['sizeRoll(1, 8, @sizeDifference, @critMult)', 'P', '']] } });
	item('turn', 'Turn Undead', 'attack', { actionType: 'special', ability: { critRange: 20, critMult: 2 }, range: { value: 60, units: 'ft' }, damage: { parts: [] } });
	item('cc', 'Combat Casting', 'feat', { featType: 'feat', activation: { type: '' } });
	item('scribe', 'Scribe Scroll', 'feat', { featType: 'classFeat', activation: { type: '' } });
	item('rage', 'Arcane Surge', 'feat', { featType: 'classFeat', activation: { type: 'free' }, uses: { value: 0, max: 1, per: 'day' } }, { labels: { activation: 'Free Action' } });
	item('mage-armor', 'Mage Armor', 'buff', { active: true, level: 1, timeline: { enabled: true, total: 50, elapsed: 10 } });
	item('haste', 'Haste', 'buff', { active: false });
	const spell = (id, name, level, book, prep, extra = {}) => item(id, name, 'spell', { level, spellbook: book, school: 'evo', components: { verbal: true, somatic: true }, preparation: { mode: 'prepared', ...prep }, spellDuration: 'Instantaneous', save: 'None', sr: true, damage: { parts: extra.damage ?? [] } }, { labels: { activation: 'Standard Action', range: 'Range: Medium' } });
	spell('mm', 'Magic Missile', 1, 'primary', { preparedAmount: 2, maxAmount: 2 }, { damage: [['1d4+1', null, 'energy-force']] });
	spell('shield', 'Shield', 1, 'primary', { preparedAmount: 0, maxAmount: 1 });
	spell('sleep', 'Sleep', 1, 'primary', { preparedAmount: 0, maxAmount: 0 });
	spell('fireball', 'Fireball', 3, 'primary', { preparedAmount: 1, maxAmount: 1 }, { damage: [['(min(10, @cl))d6', 'Fire']] });
	spell('light', 'Light', 0, 'primary', { preparedAmount: 1, maxAmount: 1 });
	// the spell-like book: one spontaneous ability with slots of its own
	spell('daze', 'Daze', 0, 'secondary', { preparedAmount: 0, maxAmount: 0 });
	spell('blur', 'Blur', 2, 'secondary', { preparedAmount: 0, maxAmount: 0 });

	const list = [...items.values()];
	const skill = (ability, rank, mod, extra = {}) => ({ ability, rank, mod, value: 0, cs: false, rt: false, acp: false, visibility: 'default', ...extra });
	const actor = {
		id: 't', name: 'Tanik', type: 'character', uuid: 'Actor.t', isOwner: true, hasPlayerOwner: true,
		items: Object.assign(list, { get: (id) => items.get(id), has: (id) => items.has(id) }),
		effects: Object.assign([], { get: () => null }),
		getRollData: () => ({}),
		update: async (d) => { calls.push(['actor.update', d]); },
		testUserPermission: (user) => user.id === 'owner',
		rollAbility: record('rollAbility'), rollSavingThrow: record('rollSavingThrow'), rollSkill: record('rollSkill'), rollInitiative: record('rollInitiative'),
		rollBAB: record('rollBAB'), rollMelee: record('rollMelee'), rollRanged: record('rollRanged'), rollGrapple: record('rollGrapple'), promptRest: record('promptRest'),
		system: {
			abilities: { str: { total: 8, mod: -1 }, dex: { total: 14, mod: 2 }, con: { total: 14, mod: 2, damage: 2 }, int: { total: 17, mod: 3 }, wis: { total: 12, mod: 1 }, cha: { total: 10, mod: 0 } },
			attributes: {
				hp: { value: 18, max: 24, temp: 3, nonlethal: 4, min: -100 },
				ac: { normal: { total: 16 }, touch: { total: 12 }, flatFooted: { total: 14 } },
				savingThrows: { fort: { total: 3 }, ref: { total: 3 }, will: { total: 5 } },
				bab: { total: 2 }, init: { total: 2 }, sr: { total: 0 }, energyDrain: 1,
				speed: { land: { total: 30 }, fly: { total: 0 }, swim: { total: 15 } },
				senses: { darkvision: 60, lowLight: false, special: '' },
				acp: { total: 0 }, maxDex: { total: 999 }, arcaneSpellFailure: 0,
				encumbrance: { carriedWeight: 25.3, level: 0, levels: { light: 26, medium: 53, heavy: 80 } },
				conditions: { blind: false, shaken: true, prone: false, dying: false },
				spells: { spellbooks: {
					primary: { name: 'Primary', class: 'wizard', ability: 'int', spontaneous: false, cl: { total: 5 }, spells: { spell0: { value: 0, max: 4 }, spell1: { value: 0, max: 4 }, spell2: { value: 0, max: 3 }, spell3: { value: 0, max: 2 } } },
					secondary: { name: 'Secondary', class: 'sorcerer', ability: 'cha', spontaneous: true, cl: { total: 3 }, spells: { spell0: { value: 5, max: 6 }, spell1: { value: 0, max: 0 }, spell2: { value: 1, max: 3 } } },
					tertiary: { name: 'Tertiary', class: '', spells: {} },
					spelllike: { name: 'Spell-like', class: '_hd', spells: {} },
				} },
			},
			classes: { wizard: { name: 'Wizard' }, sorcerer: { name: 'Sorcerer' } },
			details: { level: { value: 5 }, xp: { value: 10500, max: 15000 }, alignment: 'tn', deity: 'Boccob', gender: '', age: '30', height: '', weight: '', biography: { value: '<p>A student of the arcane.</p>' } },
			skills: {
				spl: skill('int', 8, 13, { cs: true, rt: true }),
				coc: skill('con', 8, 10, { cs: true }),
				clm: skill('str', 0, -1, { acp: true }),
				umd: skill('cha', 0, 0, { rt: true }),
				lis: skill('wis', 0, 1),
				kar: skill('int', 8, 11, { cs: true, rt: true }),
				hidden: skill('dex', 0, 0, { visibility: 'hidden' }),
				aSkill: skill('str', 0, -1, { custom: true, name: 'A Skill', rt: true }),
				kae: skill('int', 2, 5, { cs: true, rt: true, name: 'Knowledge (Architecture and Engineering)', custom: true }),
			},
			traits: { size: 'med', languages: { value: ['common', 'draconic'], custom: 'Elven' }, dr: '', eres: '', di: { value: [] }, ci: { value: [] }, dv: { value: [] } },
			combinedDR: [], combinedResistances: [{ name: 'Fire', value: 5 }],
			currency: { pp: 1, gp: 40, sp: 5, cp: 0 },
		},
	};
	for (const i of list) i.parent = actor;
	const friend = { id: 'f', name: 'Ere', type: 'character', isOwner: true, hasPlayerOwner: true, createEmbeddedDocuments: async (...a) => { calls.push(['friend.create', ...a]); } };
	const all = Object.assign([actor, friend], { get: (id) => [actor, friend].find((a) => a.id === id) ?? null });
	Object.defineProperty(game, 'actors', { configurable: true, get: () => all });
	const you = { id: 'owner', isGM: false, character: actor };
	Object.defineProperty(game, 'user', { configurable: true, get: () => you });
	game.system.id = 'D35E';
	game.socket = { emit: (...a) => calls.push(['emit', ...a]), on() {} };
	game.users = { activeGM: { id: 'gm' }, get: (id) => ({ id }) };

	/* ---- the formula helper on its own ---- */
	const adapter = await import('../scripts/adapters/d35e.mjs');
	check('a sized weapon die reads as dice', adapter.formula('sizeRoll(1, 8, @sizeDifference, @critMult)', {}) === '1d8');
	check('caster level is filled in and worked out', adapter.formula('(min(10, @cl))d6', { cl: 5 }) === '5d6', adapter.formula('(min(10, @cl))d6', { cl: 5 }));
	check('a plain formula is left alone', adapter.formula('1d4+1', {}) === '1d4+1');
	check('a bracket with dice in it is too', adapter.formula('(1d6+2)*2', {}) === '(1d6+2)*2', adapter.formula('(1d6+2)*2', {}));

	/* ---- open it ---- */
	const stage = () => document.querySelector('#sfh-projection .sfh-stage');
	const body = () => stage().querySelector('.proj-b');
	const tab = async (id) => { stage().querySelector(`[data-act="tab"][data-k="${id}"]`).click(); await wait(80); };
	const press = async (selector, root = stage()) => { const el = root.querySelector(selector); if (!el) return false; el.click(); await wait(30); return true; };
	const change = async (selector, value) => { const el = stage().querySelector(selector); el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); await wait(40); };
	const row = (text) => [...body().querySelectorAll('.li')].find((l) => l.textContent.includes(text));
	hud.setPower(true, { silent: true });
	await wait(100);
	await Projection.open(actor);
	await wait(150);
	const TABS = ['character', 'attacks', 'skills', 'spells', 'feats', 'inventory', 'effects', 'biography'];
	check('it opens on the 3.5e tabs', TABS.every((t) => stage().querySelector(`[data-act="tab"][data-k="${t}"]`)));

	/* ---- identity, vitals, defenses, effects ---- */
	const identity = stage().querySelector('[data-slot="identity"]').textContent;
	check('race and class levels under the name', /Human/.test(identity) && /Wizard 5/.test(identity), identity.replace(/\s+/g, ' ').slice(0, 120));
	const vitals = stage().querySelector('[data-slot="vitals"]');
	check('hit points against the maximum', /\/ 24/.test(vitals.textContent));
	check('nonlethal damage is typed beside them', vitals.querySelector('[data-commit="resource"][data-k="nonlethal"]')?.value === '4');
	await change('[data-commit="resource"][data-k="nonlethal"]', '7');
	check('and saved', JSON.stringify(last()) === JSON.stringify(['actor.update', { 'system.attributes.hp.nonlethal': 7 }]), last());
	check('negative levels are counted', /Neg\. Levels/.test(vitals.textContent));
	await press('[data-act="stat"][data-k="negativeLevels:2"]');
	check('and raised', JSON.stringify(last()) === JSON.stringify(['actor.update', { 'system.attributes.energyDrain': 2 }]), last());
	check('no death saves: 3.5e has none', !vitals.querySelector('[data-act="deathMark"]'));
	check('above zero, no status is shown', !/Dying|Disabled/.test(vitals.textContent));
	const defenses = stage().querySelector('[data-slot="defenses"]').textContent.replace(/\s+/g, ' ');
	check('AC, touch and flat-footed', /AC\s*16/.test(defenses) && /Touch\s*12/.test(defenses) && /Flat-footed\s*14/.test(defenses), defenses);
	check('the three saves', /Fort\s*\+3/.test(defenses) && /Ref\s*\+3/.test(defenses) && /Will\s*\+5/.test(defenses), defenses);
	check('energy resistance among the defenses', /Fire 5/.test(defenses), defenses);
	await press('[data-slot="defenses"] [data-act="save"][data-k="will"]');
	check('a save rolls through the system', last()[0] === 'rollSavingThrow' && last()[1] === 'will' && !!last()[4]?.event, last().slice(0, 2));
	await press('[data-slot="defenses"] [data-act="initiative"]');
	check('initiative rolls', last()[0] === 'rollInitiative' && last()[1]?.createCombatants === true);
	const effects = stage().querySelector('[data-slot="effects"]');
	check('an active buff is a chip, with its time left', /Mage Armor/.test(effects.textContent) && /40 rd/.test(effects.textContent), effects.textContent.replace(/\s+/g, ' '));
	check('an inactive one is not', !/Haste/.test(effects.textContent));
	check('a condition is a chip', /Shaken/.test(effects.textContent));
	await press('[data-slot="effects"] [data-act="delete"][data-k="mage-armor"]');
	check('the × ends the buff, keeping it', JSON.stringify(last()) === JSON.stringify(['item.update', 'mage-armor', { 'system.active': false }]), last());
	await press('[data-slot="effects"] [data-act="cond"]');
	check('and lifts a condition', JSON.stringify(last()) === JSON.stringify(['actor.update', { 'system.attributes.conditions.shaken': false }]), last());
	const choices = [...stage().querySelectorAll('[data-pick="condition"] option')].map((o) => o.value).filter(Boolean);
	check('the picker offers what is not on', choices.includes('blind') && !choices.includes('shaken'), choices);
	await change('[data-pick="condition"]', 'prone');
	check('and puts one on', JSON.stringify(lastNamed('actor.update')) === JSON.stringify(['actor.update', { 'system.attributes.conditions.prone': true }]), lastNamed('actor.update'));
	await press('[data-act="rest"]');
	check('Rest opens the system\'s rest', last()[0] === 'promptRest');

	/* ---- hit points ---- */
	const hpBox = () => stage().querySelector('.sfh-hp [data-amount]');
	hpBox().value = '5';
	await press('.sfh-hp [data-act="damage"]');
	check('damage takes temporary hit points first', JSON.stringify(last()) === JSON.stringify(['actor.update', { 'system.attributes.hp.temp': 0, 'system.attributes.hp.value': 16 }]), last());
	hpBox().value = '3';
	await press('.sfh-hp [data-act="heal"]');
	check('healing heals nonlethal damage too', JSON.stringify(last()) === JSON.stringify(['actor.update', { 'system.attributes.hp.value': 21, 'system.attributes.hp.nonlethal': 1 }]), last());
	await change('[data-commit="hp"]', '-4');
	check('hit points can go below zero', JSON.stringify(last()) === JSON.stringify(['actor.update', { 'system.attributes.hp.value': -4 }]), last());

	/* ---- character ---- */
	await tab('character');
	check('six abilities with their modifiers', body().querySelectorAll('[data-act="ability"]').length === 6 && /\+3/.test(body().querySelector('[data-act="ability"][data-k="int"]').textContent));
	check('ability damage shows', /2 dmg/.test(body().textContent));
	await press('[data-act="ability"][data-k="int"]', body());
	check('an ability check rolls', last()[0] === 'rollAbility' && last()[1] === 'int' && !!last()[2]?.event);
	for (const act of ['bab', 'melee', 'ranged', 'grapple']) {
		await press(`[data-act="${act}"]`, body());
		check(`${act} rolls through the system`, last()[0] === `roll${{ bab: 'BAB', melee: 'Melee', ranged: 'Ranged', grapple: 'Grapple' }[act]}`, last()[0]);
	}
	check('grapple has no target of its own', lastNamed('rollGrapple')[1] === null);
	const traits = body().textContent.replace(/\s+/g, ' ');
	check('size, speeds, senses and languages', /Medium/.test(traits) && /30 ft, Swim 15 ft/.test(traits) && /Darkvision 60 ft/.test(traits) && /Common, Draconic, Elven/.test(traits), traits.slice(-300));
	check('alignment and deity', /True Neutral/.test(traits) && /Boccob/.test(traits));

	/* ---- attacks ---- */
	await tab('attacks');
	check('each attack, with its kind, damage and critical', /Melee Weapon Attack · 1d6 B · 20\/×2/.test(row('Quarterstaff')?.textContent ?? ''), row('Quarterstaff')?.textContent.replace(/\s+/g, ' '));
	check('a ranged one with its threat range and range', /19–20\/×2 · 80 ft/.test(row('Light Crossbow')?.textContent ?? ''), row('Light Crossbow')?.textContent.replace(/\s+/g, ' '));
	await press('[data-act="use"][data-k="a-xbow"]', body());
	check('an attack rolls through the item, with the click', last()[0] === 'use:a-xbow' && !!last()[1]?.ev, last()[0]);
	check('only a weapon attack shows a critical', !/×/.test(row('Turn Undead')?.textContent ?? '×') && /60 ft/.test(row('Turn Undead').textContent), row('Turn Undead')?.textContent.replace(/\s+/g, ' '));
	check('a feat with an action is a special ability', !!row('Arcane Surge') && !row('Combat Casting'));
	check('armor is not, though it takes time to put on', !row('Chainmail'));
	check('out of uses, it is crossed out', body().querySelector('[data-act="use"][data-k="rage"]')?.disabled);

	/* ---- skills ---- */
	await tab('skills');
	const names = [...body().querySelectorAll('.li.flat .nm')].map((n) => n.textContent);
	check('skills in name order, hidden ones left out', names.indexOf('Climb') < names.indexOf('Concentration') && !names.some((n) => /hidden/.test(n)), names);
	check('the system\'s custom-skill template is not a skill', !names.some((n) => /A Skill/.test(n)), names);
	const rows = [...body().querySelectorAll('.sfh-skills > .li')];
	check('one column: every skill row is as wide as the list', rows.length > 5 && rows.every((r) => Math.abs(r.getBoundingClientRect().width - rows[0].getBoundingClientRect().width) < 1 && Math.abs(r.getBoundingClientRect().left - rows[0].getBoundingClientRect().left) < 1));
	const longName = row('Architecture')?.querySelector('.nm');
	check('a long name fits on its row', longName && longName.scrollWidth <= longName.clientWidth + 1, longName && [longName.scrollWidth, longName.clientWidth]);
	check('ranks and total on each', /8/.test(row('Spellcraft').textContent) && /\+13/.test(row('Spellcraft').textContent));
	check('a class skill is marked', /●/.test(row('Spellcraft').textContent) && /○/.test(row('Listen').textContent));
	check('a trained-only skill without ranks cannot be rolled', body().querySelector('[data-act="skill"][data-k="umd"]').disabled);
	await press('[data-act="skill"][data-k="spl"]', body());
	check('a skill rolls with its key and the click', last()[0] === 'rollSkill' && last()[1] === 'spl' && !!last()[2]?.event);

	/* ---- spells ---- */
	await tab('spells');
	const text = () => body().textContent.replace(/\s+/g, ' ');
	check('each spellbook under its class, with caster level and DC', /Wizard INT CL 5 DC 13\+lvl Prepared/.test(text()) && /Sorcerer CHA CL 3 DC 10\+lvl Spontaneous/.test(text()), text().slice(0, 200));
	check('a prepared spell shows what is left of what is prepared', /2\/2/.test(row('Magic Missile').textContent) && /0\/1/.test(row('Shield').textContent));
	check('how many are prepared at a level, against its slots', /3 \/ 4 prepared/.test(text()), text());
	check('with nothing left, Cast is dimmed', row('Shield').querySelector('[data-act="use"]').classList.contains('spent') && !row('Magic Missile').querySelector('[data-act="use"]').classList.contains('spent'));
	await press('[data-act="prepare"][data-k="shield:1"]', body());
	check('+ prepares another copy, ready to cast', JSON.stringify(last()) === JSON.stringify(['item.update', 'shield', { 'system.preparation.maxAmount': 2, 'system.preparation.preparedAmount': 1 }]), last());
	await press('[data-act="prepare"][data-k="mm:-1"]', body());
	check('− takes one away', JSON.stringify(last()) === JSON.stringify(['item.update', 'mm', { 'system.preparation.maxAmount': 1, 'system.preparation.preparedAmount': 1 }]), last());
	check('a spell never prepared cannot go below none', body().querySelector('[data-act="prepare"][data-k="sleep:-1"]').disabled);
	const pips = body().querySelectorAll('[data-act="slot"][data-k^="secondary.2:"]');
	check('a spontaneous book has its slots as segments', pips.length === 3 && [...pips].filter((p) => p.classList.contains('on')).length === 1);
	await press('[data-act="slot"][data-k="secondary.2:3"]', body());
	check('a segment sets what is left', JSON.stringify(last()) === JSON.stringify(['actor.update', { 'system.attributes.spells.spellbooks.secondary.spells.spell2.value': 3 }]), last());
	check('a spontaneous spell has no prepared count', !row('Blur').querySelector('[data-act="prepare"]'));
	const spellRows = [...body().querySelectorAll('.sfh-actions > .li')];
	check('one spell to a row, the full width', spellRows.length > 4 && spellRows.every((r) => Math.abs(r.getBoundingClientRect().width - spellRows[0].getBoundingClientRect().width) < 1));
	check('every spell name fits on one line', spellRows.every((r) => { const n = r.querySelector('.nm'); return n.getClientRects().length === 1 && n.getBoundingClientRect().height < 30; }), spellRows.map((r) => r.querySelector('.nm').getBoundingClientRect().height));
	await press('[data-act="use"][data-k="fireball"]', body());
	check('Cast uses the spell through the system', last()[0] === 'use:fireball' && !!last()[1]?.ev);
	await press('[data-act="spellLevel"][data-k="3"]', body());
	check('a level picker narrows it to one level', !row('Magic Missile') && !!row('Fireball'));
	await press('[data-act="spellLevel"][data-k="all"]', body());
	await press('[data-act="spellFilter"]', body());
	check('and castable only leaves out what can\'t be cast now', !row('Shield') && !row('Sleep') && !!row('Magic Missile') && !!row('Blur'));
	await press('[data-act="spellFilter"]', body());

	/* ---- feats ---- */
	await tab('feats');
	const heads = [...body().querySelectorAll('.sec')].map((s) => s.textContent.trim());
	check('classes and race first, then feats by kind', heads[0] === 'Classes' && heads.includes('Feat') && heads.includes('Class Feature'), heads);
	check('a class with its levels', /5/.test(row('Wizard').textContent));

	/* ---- inventory ---- */
	await tab('inventory');
	check('items by kind', ['Weapons', 'Armor & Equipment', 'Consumables', 'Loot'].every((h) => [...body().querySelectorAll('.sec')].some((s) => s.textContent.trim() === h)));
	check('weight times quantity', /2 lb/.test(row('Crossbow Bolt').textContent), row('Crossbow Bolt').textContent.replace(/\s+/g, ' '));
	const kinds = [...body().querySelectorAll('[data-pick="create"] option')].map((o) => o.textContent).filter((t) => !/New/.test(t));
	check('new item kinds are named, though the system has no names for them', kinds.includes('Weapon') && kinds.includes('Equipment') && !kinds.some((t) => /TYPES/.test(t)), kinds);
	check('carried weight and load', /25\.3 lb · Light/.test(text()), text().slice(0, 200));
	await press('[data-act="equip"][data-k="chain"]', body());
	check('equip toggles', JSON.stringify(last()) === JSON.stringify(['item.update', 'chain', { 'system.equipped': true }]), last());
	check('loot has no Equip', !row('Crossbow Bolt').querySelector('[data-act="equip"]'));
	await press('[data-act="qty"][data-k="bolts:-1"]', body());
	check('quantity steps', JSON.stringify(last()) === JSON.stringify(['item.update', 'bolts', { 'system.quantity': 19 }]), last());
	await change('[data-field="currency.gp"]', '55');
	check('coins are typed', JSON.stringify(last()) === JSON.stringify(['actor.update', { 'system.currency.gp': 55 }]), last());
	await change('[data-pick="give"][data-k="potion"]', 'f');
	check('an item can be given to another character', calls.some((c) => c[0] === 'friend.create') && calls.some((c) => c[0] === 'item.delete' && c[1] === 'potion'));

	/* ---- effects ---- */
	await tab('effects');
	check('buffs active and not', /Active Buffs/.test(text()) && /Inactive Buffs/.test(text()) && !!row('Haste'));
	await press('[data-act="buff"][data-k="haste"]', body());
	check('a buff is turned on from its row', JSON.stringify(last()) === JSON.stringify(['item.update', 'haste', { 'system.active': true }]), last());

	/* ---- biography ---- */
	await tab('biography');
	await change('[data-field="deity"]', 'Wee Jas');
	check('a characteristic is saved', JSON.stringify(last()) === JSON.stringify(['actor.update', { 'system.details.deity': 'Wee Jas' }]), last());
	await change('[data-field="alignment"]', 'lg');
	check('alignment is picked from the system\'s list', JSON.stringify(last()) === JSON.stringify(['actor.update', { 'system.details.alignment': 'lg' }]), last());

	/* ---- the readout ---- */
	const entry = adapter.readoutEntry(actor, 'skill:spl');
	check('a skill in the readout', entry?.name === 'Spellcraft' && entry.meta.some(([k, v]) => k === 'Ranks' && v === '8') && entry.meta.some(([k]) => k === 'Trained only'), entry);
	const meta = Object.fromEntries(adapter.readoutMeta(items.get('fireball')));
	check('a spell in the readout: school, components, save, damage', meta.School === 'Evocation' && meta.Components === 'V, S' && meta['Spell Resistance'] === 'Yes' && meta.Damage === '5d6 Fire', meta);
	check('armor is not given an action', !adapter.readoutMeta(items.get('chain')).some(([k]) => k === 'Action'));
	const cond = adapter.readoutEntry(actor, 'item:cond.shaken');
	check('a condition in the readout', cond?.name === 'Shaken' && cond.kind === 'Condition');
	check('with its rules text from the system\'s journal', /−2 penalty/.test(await adapter.describeEntry(actor, 'item:cond.shaken')));

	/* ---- the latest roll, from the system's own cards ---- */
	const message = (template, content = '') => ({ id: `m${Math.random()}`, isContentVisible: true, visible: true, speaker: { actor: 't' }, content, flags: { D35E: { chatTemplateData: template } } });
	const attack = adapter.readRoll(message({ name: 'Longsword', attacks: [{ hasAttack: true, hasDamage: true, attack: { total: 27, isCrit: false, tooltip: '<div class="dice-formula">1d20 + 3 + 1 + 5</div>' }, damage: { total: 11 } }] }));
	check('an attack card: its to-hit and formula', attack?.total === 27 && attack.formula === '1d20 + 3 + 1 + 5' && attack.name === 'Longsword', attack);
	const threat = adapter.readRoll(message({ name: 'Longsword', attacks: [{ hasAttack: true, attack: { total: 30, isCrit: true } }, { hasAttack: true, attack: { total: 12 } }] }));
	check('a threat says so, and a full attack counts its attacks', threat?.outcome?.label === 'Threat' && /2 attacks/.test(threat.name), threat);
	const missile = adapter.readRoll(message({ name: 'Magic Missile', attacks: [{ hasAttack: false, hasDamage: true, attack: { total: -1337 }, damage: { total: 3, tooltip: '<div class="table-container"><table><tr><td><img src="force.svg" /> <b>Force </b></td><td><b>3</b>  (1d4 1)</td></tr></table></div>' } }] }));
	check('a spell with no attack: its damage, its formula with the plus put back, and its type', missile?.total === 3 && /damage/.test(missile.name) && missile.formula === '1d4 + 1 Force', missile);
	const save = adapter.readRoll(message({ name: 'Tanik', saveTypeName: 'Fortitude', roll: { formula: '1d20 + 2 + 4', terms: [{ faces: 20, results: [{ result: 20 }] }] }, total: 26 }, '<header><h3>Tanik - Fortitude</h3></header>'));
	check('a save card: named by its save, not whose it is', save?.name === 'Fortitude' && save.total === 26 && save.formula === '1d20 + 2 + 4', save);
	check('a natural 20 says so', save?.outcome?.label === 'Natural 20');
	const check2 = adapter.readRoll(message({ name: 'Tanik', roll: { formula: '1d20 + 4 + 3 - 7', terms: [{ faces: 20, results: [{ result: 9 }] }] }, total: 9 }, '<h3>Climb Check</h3>'));
	check('a skill card', check2?.name === 'Climb Check' && check2.total === 9 && !check2.outcome, check2);
	check('a spell\'s description card is not a roll', adapter.readRoll(message({ name: 'Magic Missile', isSpell: true })) === null);
	check('nor is a message from another system', adapter.readRoll({ ...message({}), flags: {} }) === null);

	/* ---- the system's chat cards take the device's colors ---- */
	{
		const log = document.createElement('ol');
		log.className = 'chat-log';
		log.innerHTML = `<li class="chat-message message"><div class="D35E chat-card item-card"><header class="card-header flexrow"><h3 class="item-name">Magic Missile</h3></header>
			<div class="card-buttons"><button class="everyone">Spell Resistance</button></div></div></li>`;
		document.body.append(log);
		const probe = (value) => { const i = document.createElement('i'); i.style.color = value; log.append(i); const c = getComputedStyle(i).color; i.remove(); return c; };
		for (const device of ['omni', 'journal']) {
			game.settings.set(null, 'device', device);
			// Foundry's buttons ease their shadow from one device's colors to the next
			await wait(900);
			check(`${device}: a 3.5e card's title is in the heading color`, getComputedStyle(log.querySelector('h3')).color === probe('var(--sfh-heading)'), getComputedStyle(log.querySelector('h3')).color);
			const fill = getComputedStyle(log.querySelector('button')).boxShadow;
			// red ink on the Journal's paper; the dark fill everywhere else, the Journal in the dark too
			const paper = device === 'journal' && document.body.dataset.sfhDark !== 'on';
			check(`${device}: its button is painted over, as the system's own colors can't be outranked`, /inset/.test(fill) && fill.includes(probe(paper ? 'var(--sfh-hot)' : 'var(--sfh-cell)')), [fill, document.body.dataset.sfhDark]);
		}
		log.remove();
		game.settings.set(null, 'device', 'omni');
		await wait(200);
	}

	/* ---- dying ---- */
	actor.system.attributes.hp.value = -3;
	game.settings.set(null, 'device', 'omni');
	await wait(250);
	check('below zero, dying shows', /Dying/.test(stage().querySelector('[data-slot="vitals"]').textContent));
	actor.system.attributes.hp.value = 18;

	/* ---- a long name on the Journal's page ---- */
	actor.name = 'Tanik the Wizard of the Western Tower';
	game.settings.set(null, 'device', 'journal');
	await wait(300);
	const who = stage().querySelector('.jn-who .nm');
	const lines = Math.round(who.getBoundingClientRect().height / parseFloat(getComputedStyle(who).lineHeight));
	check('the Journal fits a long name to its page: smaller, on two lines at most', who.scrollWidth <= who.clientWidth + 1 && parseFloat(getComputedStyle(who).fontSize) < 42 && lines <= 2, [who.scrollWidth, who.clientWidth, getComputedStyle(who).fontSize, lines]);
	const strip = stage().querySelector('[data-slot="identity"]');
	check('and the heading still fits its strip', strip.scrollHeight <= strip.clientHeight + 1, [strip.scrollHeight, strip.clientHeight]);
	actor.name = 'Tanik the Wizard';
	game.settings.set(null, 'device', 'omni');
	await wait(250);
	game.settings.set(null, 'device', 'journal');
	await wait(300);
	const mid = stage().querySelector('.jn-who .nm');
	check('a name like "Tanik the Wizard" fits on one line', mid.scrollWidth <= mid.clientWidth + 1 && Math.round(mid.getBoundingClientRect().height / parseFloat(getComputedStyle(mid).lineHeight)) === 1, [mid.scrollWidth, mid.clientWidth, getComputedStyle(mid).fontSize]);
	actor.name = 'Tanik';
	game.settings.set(null, 'device', 'omni');
	await wait(250);
	game.settings.set(null, 'device', 'journal');
	await wait(300);
	check('and keeps a short one at full size', getComputedStyle(stage().querySelector('.jn-who .nm')).fontSize === '42px', getComputedStyle(stage().querySelector('.jn-who .nm')).fontSize);

	/* ---- every tab fits on every device ---- */
	for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal', 'vambrace']) {
		game.settings.set(null, 'device', device);
		await wait(250);
		for (const t of TABS) {
			await tab(t);
			await wait(40);
			check(`${device} ${t}: nothing prints as an object`, !/\[object|undefined|NaN/.test(body().textContent), body().textContent.match(/.{0,30}(\[object|undefined|NaN).{0,20}/)?.[0]);
			const box = body().getBoundingClientRect();
			const spilled = [...body().querySelectorAll('.li, .sec, .sfh-in, .ta, .sfh-rich, .b, .sel')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.left < box.left - 1 || r.right > box.right + 1); });
			check(`${device} ${t}: nothing runs off the side`, !spilled.length && body().scrollWidth <= body().clientWidth + 1, spilled.slice(0, 4).map((e) => `${e.className}:${e.textContent.trim().slice(0, 20)}`));
		}
		for (const slot of ['vitals', 'defenses', 'effects']) {
			const el = stage().querySelector(`[data-slot="${slot}"]`);
			check(`${device} ${slot}: nothing prints as an object`, !/\[object|undefined|NaN/.test(el.textContent), el.textContent.match(/.{0,30}(\[object|undefined|NaN).{0,20}/)?.[0]);
		}
	}
	game.settings.set(null, 'device', 'omni');
	await wait(200);

	/* ---- someone else looking ---- */
	actor.isOwner = false;
	game.settings.set(null, 'device', 'omni');
	await wait(200);
	await tab('biography');
	check('without ownership the text fields are locked', [...body().querySelectorAll('[data-field]')].every((e) => e.disabled) && !body().querySelector('prose-mirror'));
	actor.isOwner = true;
	return out;
});

if (shotsTo) {
	for (const [device, t] of [['omni', 'character'], ['omni', 'attacks'], ['omni', 'skills'], ['omni', 'spells'], ['journal', 'spells'], ['vambrace', 'character']]) {
		await page.evaluate(async (d, id) => {
			game.settings.set(null, 'device', d);
			await new Promise((r) => setTimeout(r, 350));
			document.querySelector(`#sfh-projection [data-act="tab"][data-k="${id}"]`).click();
			await new Promise((r) => setTimeout(r, 200));
			document.querySelector('#sfh-projection .proj-b').scrollTop = 0;
		}, device, t);
		await page.screenshot({ path: `${shotsTo}/d35e-${device}-${t}.png` });
	}
}
await browser.close();

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
