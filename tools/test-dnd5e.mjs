/*
 * Run the real 5e adapter and projection against a stand-in character in the shapes read from
 * system 6's source, and check what each tab shows, what its controls call, and that it fits on
 * every device. Screenshots for looking at are written to a folder if one is given.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// puppeteer and sharp live in the sibling conversion repo; this tool is dev-only
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');
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

	/* ---- the system, as far as the adapter touches it ---- */
	class SlotCasting {
		slots = true; prepares = false; cantrips = false; order = 10;
		constructor(key, extra = {}) { Object.assign(this, { key }, extra); }
		getAvailableLevels(actor) { return Object.keys(actor.system.spells).filter((k) => /^spell[1-9]/.test(k) && (actor.system.spells[k].max || actor.system.spells[k].value)).map((k) => Number(k.slice(5))); }
		getSpellSlotKey(level) { return `spell${level}`; }
		getLabel({ level }) { return level ? `Level ${level}` : 'Cantrips'; }
	}
	class SingleLevelSpellcasting extends SlotCasting {
		getAvailableLevels(actor) { return actor.system.spells.pact?.max ? [actor.system.spells.pact.level] : []; }
		getSpellSlotKey() { return 'pact'; }
		getLabel() { return 'Pact Magic'; }
	}
	const innate = new (class { key = 'innate'; slots = false; order = 500; getLabel() { return 'Innate'; } getSpellSlotKey() { return 'innate'; } })();
	globalThis.dnd5e = {
		dataModels: { spellcasting: { SingleLevelSpellcasting } },
		documents: { Trait: { keyLabel: (key) => key[0].toUpperCase() + key.slice(1), getBaseItemUUID: (id) => id } },
		applications: {
			CompendiumBrowser: Object.assign(class { constructor(o) { record('browser')(o); } render() { calls.push(['browser.render']); } }, {
				fetch: async (cls, options) => { calls.push(['fetch', [...options.types]]); return [
					{ name: 'Rope, Hempen', img: 'x.png', uuid: 'Compendium.items.rope', system: { price: { value: 1, denomination: 'gp' } } },
					{ name: 'Rope of Climbing', img: 'x.png', uuid: 'Compendium.items.climb', system: { rarity: 'uncommon', price: { value: 2000, denomination: 'gp' } } },
					...Array.from({ length: 20 }, (_, i) => ({ name: `Torch ${i}`, img: 'x.png', uuid: `Compendium.items.t${i}`, system: {} })),
				]; },
			}),
			CurrencyManager: { deductActorCurrency(actor, value, denom) { if (value > actor.system.currency[denom]) throw new Error('Not enough'); calls.push(['deduct', value, denom]); } },
		},
	};
	globalThis.fromUuidSync = (id) => {
		if (id.startsWith('.Item.')) return items.get(id.slice(6)) ?? null;
		if (id.startsWith('.Activity.')) return { id, name: 'Moon Form', activation: { type: 'bonus' }, item: items.get('wshape'), use: record('activity.use') };
		if (id.startsWith('.ActiveEffect.')) return ownEffects.find((e) => e.id === id.slice(14)) ?? null;
		return null;
	};
	globalThis.CONFIG = { ...(globalThis.CONFIG ?? {}), Item: { documentClass: { createWithContents: async (items) => items.map((i) => ({ name: i.name, copied: true })) } }, DND5E: {
		skills: { acr: { label: 'Acrobatics', reference: 'Compendium.rules.acr' }, ath: { label: 'Athletics' } },
		abilities: { dex: { label: 'Dexterity' }, str: { label: 'Strength' } },
		tools: { herb: { ability: 'int', id: 'Compendium.items.herbkit' } },
		senses: { darkvision: { label: 'Darkvision' }, truesight: { label: 'Truesight' } },
		proficiencyLevels: { 0: 'Not Proficient', 0.5: 'Half', 1: 'Proficient', 2: 'Expertise' },
		currencies: { pp: {}, gp: {}, ep: {}, sp: {}, cp: {} },
		conditionTypes: { blinded: { name: 'Blinded' }, exhaustion: { name: 'Exhaustion', levels: 6 }, bleeding: { name: 'Bleeding', pseudo: true } },
		limitedUsePeriods: { lr: { label: 'Long Rest' }, recharge: { label: 'Recharge' } },
		itemRarity: { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', veryRare: 'Very Rare', legendary: 'Legendary', artifact: 'Artifact' },
		spellLevels: { 0: 'Cantrip', 1: '1st Level', 2: '2nd Level', 3: '3rd Level' },
		itemProperties: { concentration: { label: 'Concentration' }, fin: { label: 'Finesse' } },
		spellPreparationStates: { unprepared: { value: 0, label: 'Unprepared' }, prepared: { value: 1, label: 'Prepared' }, always: { value: 2, label: 'Always Prepared' } },
		spellcasting: { spell: new SlotCasting('spell', { prepares: true, cantrips: true }), pact: new SingleLevelSpellcasting('pact', { order: 20 }), innate },
	} };
	foundry.utils = { ...(foundry.utils ?? {}), getProperty: (o, p) => p.split('.').reduce((a, k) => a?.[k], o), buildRelativeUuid: (doc) => (doc.documentName === 'ActiveEffect' ? `.ActiveEffect.${doc.id}` : `.Item.${doc.id}`) };
	const notices = [];
	globalThis.ui.notifications = { info: (m) => notices.push(['info', m]), warn: (m) => notices.push(['warn', m]), error: (m) => notices.push(['error', m]) };

	/* ---- a character in those shapes ---- */
	const activities = (...list) => Object.assign(list, { getByType: (t) => list.filter((a) => a.type === t) });
	const attackActivity = { type: 'attack', activation: { type: 'action' }, consumption: { targets: [] }, labels: { damage: [{ formula: '1d8 + 3', label: '1d8 + 3 Slashing', base: true }], damages: [{ formula: '1d8 + 3', label: '1d8 + 3 Slashing', base: true }] }, use: record('attack.use'), rollDamage: record('attack.rollDamage') };
	const spends = (type) => ({ type: 'utility', activation: { type }, consumption: { targets: [{ type: 'itemUses' }] } });
	const free = (type) => ({ type: 'utility', activation: { type }, consumption: { targets: [] } });
	const items = new Map();
	const item = (id, name, type, system = {}, extra = {}) => {
		const made = { id, name, type, uuid: `Actor.a.Item.${id}`, isOwner: true, system: { ...system }, flags: {}, labels: {}, _stats: {},
			update: async (d) => { calls.push(['item.update', id, d]); }, delete: async (o) => { calls.push(['item.delete', id, o]); }, use: record(`use:${id}`), getRollData: () => ({}), ...extra };
		items.set(id, made);
		return made;
	};
	item('cls', 'Druid', 'class', { levels: 7 }, { identifier: 'druid' });
	item('sub', 'Circle of the Moon', 'subclass', { classIdentifier: 'druid' }, { flags: { dnd5e: { advancementRoot: 'cls.x' } } });
	item('sp', 'Elf', 'race');
	item('bg', 'Sage', 'background');
	item('wshape', 'Wild Shape', 'feat', { uses: { value: 2, max: 3, recovery: [{ period: 'lr' }] }, activities: activities(spends('bonus')), properties: new Set() }, { flags: { dnd5e: { advancementOrigin: 'cls.y' } } });
	item('tired', 'Spent Power', 'feat', { uses: { value: 0, max: 2, recovery: [] }, activities: activities(spends('action')), properties: new Set() }, { flags: { dnd5e: { advancementOrigin: 'cls.y' } } });
	item('mixed', 'Mixed Power', 'feat', { uses: { value: 0, max: 2, recovery: [] }, activities: activities(spends('action'), free('action')), properties: new Set() });
	item('breath', 'Breath Weapon', 'feat', { uses: { value: 0, max: 1, recovery: [{ period: 'recharge' }], rollRecharge: record('rollRecharge') }, activities: activities(spends('action')), properties: new Set() }, { isOnCooldown: true, flags: { dnd5e: { advancementOrigin: 'sp.y' } } });
	item('react', 'A Very Long Reaction Feature Name That Would Certainly Not Fit On Two Lines Of Its Column', 'feat', { activities: activities(free('reaction')), properties: new Set() }, { flags: { dnd5e: { advancementOrigin: 'bg.y' } } });
	item('passive', 'Darkvision Lore', 'feat', { activities: activities(), properties: new Set() });
	item('sword', 'Longsword', 'weapon', { rarity: 'rare', equipped: true, type: { value: 'martialM' }, quantity: 1, weight: { value: 3 }, activities: activities(attackActivity), properties: new Set(['fin']), attunement: '' }, { labels: { modifier: '+7', range: '5 ft', damages: [{ formula: '1d8 + 3', label: '1d8 + 3 Slashing', base: true }, { formula: '1d6', label: '1d6 Fire' }] } });
	item('bow', 'Stowed Bow', 'weapon', { rarity: 'veryRare', equipped: false, type: { value: 'martialR' }, quantity: 1, weight: { value: 2 }, activities: activities(attackActivity), properties: new Set() });
	item('ring', 'Ring of Warmth', 'equipment', { rarity: 'uncommon', equipped: false, attunement: 'required', attuned: false, quantity: 1, weight: { value: 0 }, activities: activities(), properties: new Set() });
	item('potion', 'Potion of Healing', 'consumable', { rarity: 'common', quantity: 2, weight: { value: 0.5 }, uses: { value: 0, max: 1, recovery: [] }, activities: activities(spends('action')), properties: new Set() });
	item('pack', 'Backpack', 'container', { rarity: 'legendary', equipped: true, quantity: 1, weight: { value: 5 }, activities: activities(), properties: new Set() });
	item('inpack', 'Rations', 'consumable', { rarity: 'artifact', container: 'pack', quantity: 5, weight: { value: 2 }, activities: activities(), properties: new Set() });
	item('mystery', 'Unidentified Wand', 'equipment', { rarity: 'artifact', identified: false, unidentified: { description: '<p>A plain stick.</p>' }, description: { value: '<p>Wand of Secrets.</p>' }, quantity: 1, weight: { value: 1 }, activities: activities(), properties: new Set() });
	const spell = (id, name, level, method, prepared, extra = {}) => item(id, name, 'spell', { level, method, prepared, activities: activities(free('action')), properties: new Set(extra.props ?? []), description: { value: `<p>About ${name}. @UUID[x]{Link}</p>` } }, { labels: { level: `${level}th`, school: 'Evocation', components: { vsm: 'V, S' } } });
	spell('cantrip', 'Shillelagh', 0, 'spell', 0);
	spell('s1a', 'Cure Wounds', 1, 'spell', 1, { props: ['concentration'] });
	spell('s1b', 'Unprepared Spell', 1, 'spell', 0);
	spell('s1c', 'Always Spell', 1, 'spell', 2);
	spell('p1', 'Pact Blast', 3, 'pact', 0);
	spell('in1', 'Innate Trick', 2, 'innate', 0);
	spell('in2', 'Innate Marvel', 1, 'innate', 0);

	const list = [...items.values()];
	const itemTypes = {};
	for (const i of list) (itemTypes[i.type] ??= []).push(i);
	const auraOnItem = { id: 'aura', name: 'Ring Aura', uuid: 'Actor.a.Item.ring.ActiveEffect.aura', parent: items.get('ring'), disabled: false, isTemporary: false, isSuppressed: false, statuses: new Set(), duration: {} };
	const own = (id, name, extra = {}) => ({ id, name, uuid: `Actor.a.ActiveEffect.${id}`, disabled: false, isTemporary: false, isSuppressed: false, statuses: new Set(), duration: { label: '' }, delete: record(`effect.delete:${id}`), ...extra });
	const ownEffects = [own('bless', 'Bless', { isTemporary: true, duration: { label: '1 minute' } }), own('off', 'Switched Off', { disabled: true }), own('blind', 'Blinded', { statuses: new Set(['blinded']) })];
	const actor = {
		id: 'a', name: 'Aralin', type: 'character', uuid: 'Actor.a', isOwner: true, hasPlayerOwner: true,
		classes: { druid: items.get('cls') },
		spellcastingClasses: { druid: Object.assign(items.get('cls'), { spellcasting: { ability: 'wis', attack: 7, save: 15, preparation: { value: 5, max: 9 } } }) },
		statuses: new Set(['blinded']),
		itemTypes,
		items: Object.assign(list, { get: (id) => items.get(id), has: (id) => items.has(id) }),
		effects: Object.assign([...ownEffects], { get: (id) => ownEffects.find((e) => e.id === id) }),
		allApplicableEffects: () => [...ownEffects, auraOnItem],
		getRollData: () => ({}),
		update: async (d) => { calls.push(['actor.update', d]); },
		createEmbeddedDocuments: async (...a) => { calls.push(['create', ...a]); },
		rollSkill: record('rollSkill'), rollToolCheck: record('rollToolCheck'), rollAbilityCheck: record('rollAbilityCheck'), rollSavingThrow: record('rollSavingThrow'), rollConcentration: record('rollConcentration'),
		rollDeathSave: record('rollDeathSave'), rollHitDie: record('rollHitDie'), rollInitiativeDialog: record('rollInitiativeDialog'), toggleStatusEffect: record('toggleStatusEffect'), shortRest: record('shortRest'), longRest: record('longRest'),
		testUserPermission: (user) => user.id === 'owner',
		system: {
			details: { level: 7, xp: { value: 100, max: 200 }, race: items.get('sp'), background: items.get('bg'), alignment: 'Neutral Good', ideal: 'Balance', bond: 'The grove', flaw: 'Stubborn', trait: 'Calm', appearance: 'Tall', biography: { value: '<p>Raised in the grove. @UUID[Actor.x]{Link}</p>' } },
			attributes: { hp: { value: 40, max: 50, effectiveMax: 45, temp: 3 }, ac: { value: 16 }, movement: { walk: 35 }, init: { total: 2 }, prof: 3, spell: { dc: 15 }, hd: { value: 5, max: 7 }, death: { success: 1, failure: 2 }, inspiration: false, exhaustion: 2, concentration: { save: 6 }, encumbrance: { value: 42.5, max: 150, units: 'lb' }, attunement: { value: 1, max: 3 }, senses: { ranges: { darkvision: 60 }, units: 'ft', special: 'Keen smell' } },
			abilities: { str: { mod: 1, value: 12, proficient: 0, save: { value: 1 } }, wis: { mod: 4, value: 18, proficient: 1, save: { value: 7 } } },
			skills: { ath: { value: 0, ability: 'str', total: 1, passive: 11 }, acr: { value: 1, ability: 'dex', total: 5, passive: 15 }, prc: { value: 2, ability: 'wis', total: 10, passive: 20 } },
			tools: { herb: { value: 1, ability: 'int', total: 6 } },
			traits: { languages: { value: new Set(['druidic', 'common']), custom: '' }, dr: { value: new Set(['fire']), custom: '' }, di: { value: new Set() }, dv: { value: new Set() }, ci: { value: new Set() } },
			currency: { pp: 1, gp: 25, ep: 0, sp: 3, cp: 0 },
			favorites: [{ type: 'item', id: '.Item.s1a', sort: 300 }, { type: 'item', id: '.Item.wshape', sort: 100 }, { type: 'skill', id: 'acr', sort: 200 }, { type: 'slots', id: 'spell1', sort: 400 }, { type: 'activity', id: '.Activity.moon', sort: 500 }, { type: 'effect', id: '.ActiveEffect.bless', sort: 600 }, { type: 'item', id: '.Item.gone', sort: 700 }],
			hasFavorite: (id) => actor.system.favorites.some((f) => f.id === id),
			addFavorite: (f) => { calls.push(['addFavorite', f]); },
			removeFavorite: (id) => { calls.push(['removeFavorite', id]); },
			spells: { spell1: { value: 2, max: 4 }, spell2: { value: 0, max: 0 }, pact: { value: 1, max: 2, level: 3 } },
		},
	};
	for (const i of list) i.parent = actor;
	const friend = { id: 'f', name: 'Friend', type: 'character', isOwner: true, hasPlayerOwner: true, createEmbeddedDocuments: async (...a) => { calls.push(['friend.create', ...a]); } };
	const stranger = { id: 's', name: 'Stranger', type: 'character', isOwner: false, hasPlayerOwner: true, createEmbeddedDocuments: async (...a) => { calls.push(['stranger.create', ...a]); } };
	const all = Object.assign([actor, friend, stranger], { get: (id) => [actor, friend, stranger].find((a) => a.id === id) ?? null });
	Object.defineProperty(game, 'actors', { configurable: true, get: () => all });
	const you = { id: 'owner', isGM: false, character: actor };
	Object.defineProperty(game, 'user', { configurable: true, get: () => you });
	game.system.id = 'dnd5e';
	globalThis.fromUuid = async (uuid) => { calls.push(['fromUuid', uuid]); if (uuid === 'Compendium.rules.acr') return { text: { content: '<p>Stay on your feet. @UUID[x]{Link}</p>' } }; if (uuid === 'Compendium.items.herbkit') return { system: { description: { value: '<p>Clippers and pouches.</p>' } } }; return uuid.includes('rope') ? { name: 'Rope, Hempen', type: 'loot', uuid, _stats: { compendiumSource: uuid }, system: { price: { value: 1, denomination: 'gp' }, quantity: 1 } } : uuid.includes('climb') ? { name: 'Rope of Climbing', type: 'loot', uuid, _stats: {}, system: { price: { value: 2000, denomination: 'gp' } } } : { update: async (d) => calls.push(['doc.update', uuid, d]), sheet: { render: () => calls.push(['sheet', uuid]) } }; };
	game.i18n.format = (k) => k;
	game.socket = { emit: (...a) => calls.push(['emit', ...a]), on() {} };
	game.users = { activeGM: { id: 'gm' }, get: (id) => ({ id }) };
	game.messages = { get: (id) => messages[id] };
	const messages = {};

	/* ---- open it ---- */
	const stage = () => document.querySelector('#sfh-projection .sfh-stage');
	const body = () => stage().querySelector('.proj-b');
	const tab = async (id) => { stage().querySelector(`[data-act="tab"][data-k="${id}"]`).click(); await wait(80); };
	const press = async (selector) => { const el = stage().querySelector(selector); if (!el) return false; el.click(); await wait(30); return true; };
	const change = async (selector, value) => { const el = stage().querySelector(selector); el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); await wait(40); };
	const row = (text) => [...body().querySelectorAll('.li')].find((l) => l.textContent.includes(text));
	hud.setPower(true, { silent: true });
	await wait(100);
	await Projection.open(actor);
	await wait(150);
	check('it opens on the 5e tabs', ['details', 'actions', 'inventory', 'spells', 'features', 'effects', 'biography'].every((t) => stage().querySelector(`[data-act="tab"][data-k="${t}"]`)));

	/* ---- identity and vitals ---- */
	const identity = stage().querySelector('[data-slot="identity"]').textContent;
	check('species and background show as names, not objects', /Elf/.test(identity) && /Sage/.test(identity) && !/object Object/.test(identity), identity.slice(0, 100));
	check('hit points use the effective maximum', /\/ 45/.test(stage().querySelector('[data-slot="vitals"]').textContent));
	const restButtons = [...stage().querySelectorAll('[data-act="rest"]')];
	check('the Rest buttons are both there', restButtons.length === 2);
	check('the spell DC shows', /15/.test(stage().querySelector('[data-slot="defenses"]').textContent));
	await press('[data-act="deathMark"][data-k="success:2"]');
	check('a death save segment marks it', last()[1]?.['system.attributes.death.success'] === 2, last());
	await press('[data-act="deathMark"][data-k="failure:2"]');
	check('clicking the last one lit takes it off', last()[1]?.['system.attributes.death.failure'] === 1, last());
	await press('[data-act="deathRoll"]');
	check('Roll rolls a death save', last()[0] === 'rollDeathSave' && last()[1].legacy === false, last());
	await press('[data-act="exhaustion"][data-k="3"]');
	check('exhaustion is a track', last()[1]?.['system.attributes.exhaustion'] === 3, last());
	check('with six levels', stage().querySelectorAll('[data-act="exhaustion"]').length === 6);
	await press('[data-act="insp"]');
	check('inspiration toggles', last()[1]?.['system.attributes.inspiration'] === true, last());
	await press('[data-act="hd"]');
	check('hit dice roll', last()[0] === 'rollHitDie');
	await press('[data-act="initiative"]');
	check('initiative rolls', last()[0] === 'rollInitiativeDialog' && !!last()[1].event, last()[0]);
	check('the condition picker leaves out pseudo-conditions, exhaustion and what is on', [...stage().querySelectorAll('[data-pick="condition"] option')].filter((o) => o.value).length === 0);

	/* ---- details ---- */
	await tab('details');
	const skillNames = [...body().querySelectorAll('.li.flat .nm')].map((n) => n.textContent);
	check('skills are in name order', skillNames.indexOf('Acrobatics') < skillNames.indexOf('Athletics'), skillNames);
	await change('[data-pick="rank"][data-k="skills.ath"]', '2');
	check('proficiency changes through the actor', last()[1]?.['system.skills.ath.value'] === 2, last());
	await change('[data-pick="rank"][data-k="tools.herb"]', '0.5');
	check('half proficiency works, on tools too', last()[1]?.['system.tools.herb.value'] === 0.5, last());
	await press('[data-act="skill"][data-k="acr"]');
	check('a skill rolls with its key', last()[0] === 'rollSkill' && last()[1].skill === 'acr', last()[0]);
	await press('[data-act="tool"][data-k="herb"]');
	check('a tool rolls with its key', last()[0] === 'rollToolCheck' && last()[1].tool === 'herb', last()[0]);
	await press('[data-act="save"][data-k="wis"]');
	check('a save rolls', last()[0] === 'rollSavingThrow' && last()[1].ability === 'wis');
	await press('[data-act="concentration"]');
	check('concentration rolls', last()[0] === 'rollConcentration');
	check('traits show', /Darkvision 60 ft/.test(body().textContent) && /Keen smell/.test(body().textContent) && /Druidic/.test(body().textContent) && /Fire/.test(body().textContent), body().textContent.slice(-200));

	/* ---- actions ---- */
	await tab('actions');
	check('an equipped weapon shows its to-hit', /\+7/.test(row('Longsword')?.textContent ?? ''));
	check('and its damage, in words', /5 ft · 1d8 \+ 3 Slashing \+ 1d6 Fire/.test(row('Longsword').textContent), row('Longsword').textContent.replace(/\s+/g, ' '));
	check('a stowed one does not show', !row('Stowed Bow'));
	await press('[data-act="attack"][data-k="sword"]');
	check('attacking uses the attack activity', last()[0] === 'attack.use' && !!last()[1].event, last()[0]);
	await press('[data-act="weaponDamage"][data-k="sword"]');
	check('damage rolls from it', last()[0] === 'attack.rollDamage');
	const heads = [...body().querySelectorAll('.sec')].map((s) => s.textContent.trim());
	check('features are filed by what they cost', ['Attacks', 'Actions', 'Bonus Actions', 'Reactions'].every((h) => heads.includes(h)), heads);
	check('passive ones are left out', !row('Darkvision Lore'));
	const useOf = (id) => body().querySelector(`[data-act="use"][data-k="${id}"]`);
	await press('[data-act="use"][data-k="wshape"]');
	check('Use passes the event as the system expects', last()[0] === 'use:wshape' && !!last()[1].event, last()[0]);
	check('out of uses, Use is crossed out, dimmed and disabled', useOf('tired').disabled && getComputedStyle(useOf('tired')).textDecorationLine.includes('line-through') && parseFloat(getComputedStyle(useOf('tired')).opacity) < 0.6);
	check('with something free to do, it stays usable', !useOf('mixed').disabled);
	check('on cooldown, it offers the recharge', !useOf('breath') && !!body().querySelector('[data-act="recharge"][data-k="breath"]'));
	await press('[data-act="recharge"][data-k="breath"]');
	check('and rolls it', last()[0] === 'rollRecharge' && last()[1].apply === true);
	check('rows show no counts or traits', !/\d\s*\/\s*\d/.test(row('Wild Shape').textContent) && !row('Wild Shape').querySelector('.chip'));

	/* ---- favorites ---- */
	{
		const heads0 = [...body().querySelectorAll('.sec')].map((s) => s.textContent.trim());
		check('favorites come first on the Actions tab', heads0[0] === 'DND5E.Favorites' || heads0[0] === 'Favorites', heads0);
		const favGrid = body().querySelector('.sec + .sfh-actions');
		const favRows = [...favGrid.children].map((r) => r.textContent.replace(/\s+/g, ' ').trim());
		check('in the sheet\'s order, and one that is gone is skipped', /Wild Shape/.test(favRows[0]) && /Acrobatics/.test(favRows[1]) && /Cure Wounds/.test(favRows[2]) && favRows.length === 6, favRows);
		check('a spell says Cast', !!favGrid.querySelector('[data-act="use"][data-k="s1a"]') && /Cast/.test(favRows[2]), favRows[2]);
		favGrid.querySelector('[data-act="skill"][data-k="acr"]').click();
		await wait(30);
		check('a favorite skill rolls', last()[0] === 'rollSkill' && last()[1].skill === 'acr');
		favGrid.querySelector('[data-act="slot"][data-k="spell1:3"]').click();
		await wait(30);
		check('favorite slots can be spent', last()[1]?.['system.spells.spell1.value'] === 3, last());
		favGrid.querySelector('[data-act="useActivity"]').click();
		await wait(30);
		check('a favorite activity uses that activity', last()[0] === 'activity.use', last()[0]);
		favGrid.querySelector('[data-act="toggleEffect"]').click();
		await wait(30);
		check('a favorite effect toggles', last()[0] === 'doc.update', last()[0]);

		const inReadout = () => stage().querySelector('#sfh-readout [data-act="favorite"]');
		row('Longsword').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		await wait(200);
		check('the readout offers to mark one', !!inReadout() && inReadout().getAttribute('aria-pressed') === 'false');
		inReadout().click();
		await wait(30);
		check('and marks it through the actor', last()[0] === 'addFavorite' && last()[1].type === 'item' && last()[1].id === '.Item.sword', last());
		favGrid.querySelector('[data-k="item:wshape"]')?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		await wait(200);
		check('one already marked offers to take it off', inReadout()?.getAttribute('aria-pressed') === 'true');
		inReadout().click();
		await wait(30);
		check('and takes it off', last()[0] === 'removeFavorite' && last()[1] === '.Item.wshape', last());
	}

	/* ---- features ---- */
	await tab('features');
	const featHeads = [...body().querySelectorAll('.sec')].map((s) => s.textContent.trim());
	check('features are filed by where they came from', ['Classes', 'Druid Features', 'Species Features', 'Background Features', 'Other Features'].every((h) => featHeads.includes(h)), featHeads);
	const under = (name) => { let at = null; for (const el of body().children) { if (el.classList.contains('sec')) at = el.textContent.trim(); else if (el.textContent.includes(name)) return at; } return null; };
	check('a class feature under its class', under('Wild Shape') === 'Druid Features', under('Wild Shape'));
	check('a species one under species', under('Breath Weapon') === 'Species Features');
	check('the class shows its level and subclass', /Druid/.test(body().querySelector('.sfh-feat').textContent) && /Circle of the Moon/.test(body().querySelector('.sfh-feat').textContent));
	check('a passive feature has no Use', !row('Darkvision Lore').querySelector('[data-act="use"]'));

	/* ---- inventory ---- */
	await tab('inventory');
	check('the groups are the sheet\'s', ['Weapons', 'Equipment', 'Consumables', 'Containers'].every((h) => [...body().querySelectorAll('.sec')].some((s) => s.textContent.trim() === h)));
	const nested = row('Rations');
	check('what is in a container sits under it', parseFloat(nested.style.getPropertyValue('--depth')) === 1 && row('Backpack').compareDocumentPosition(nested) === Node.DOCUMENT_POSITION_FOLLOWING);
	check('and only there', [...body().querySelectorAll('.li')].filter((l) => l.textContent.includes('Rations')).length === 1);
	{
		// a name is in the color of its rarity, as D&D Beyond colors them: green, blue, purple, orange and tan
		const name = (text) => row(text).querySelector('.nm');
		const ink = (text) => getComputedStyle(name(text)).color;
		const plain = ink('Potion of Healing');
		const colors = [['Ring of Warmth', 'uncommon'], ['Longsword', 'rare'], ['Stowed Bow', 'veryrare'], ['Backpack', 'legendary'], ['Rations', 'artifact']].map(([text, rarity]) => [text, rarity, ink(text)]);
		check('an item of each rarity is named in the color of that rarity', colors.every(([text, rarity, color]) => name(text).classList.contains(`rar-${rarity}`) && color !== plain), colors);
		check('each in a color of its own', new Set(colors.map((c) => c[2])).size === 5, colors.map((c) => c[2]));
		const hue = (color) => { const [r, g, b] = color.match(/\d+/g).map(Number); return g > r && g > b ? 'green' : b > r && b > g && r < g ? 'blue' : b > g && r > g ? 'purple' : r > g && g > b && r - b > 150 ? 'orange' : r > g && g > b ? 'tan' : 'red'; };
		check('green, blue, purple, orange and tan, in that order', colors.map((c) => hue(c[2])).join() === 'green,blue,purple,orange,tan', colors.map((c) => [c[2], hue(c[2])]));
		check('the green and the orange are D&D Beyond\u2019s own on a dark panel', colors[0][2] === 'rgb(31, 194, 25)' && colors[3][2] === 'rgb(254, 162, 39)', [colors[0][2], colors[3][2]]);
		check('a common thing is in the ordinary ink', !name('Potion of Healing').classList.contains('rar'));
		check('and so is a thing not yet identified, whatever it is', !name('Unidentified Wand').classList.contains('rar') && ink('Unidentified Wand') === plain, ink('Unidentified Wand'));
	}
	{
		// 5e's sheet looks for a container under the drop as `.container[data-item-id]`, and makes a
		// dropped spell a scroll when its own tab is the inventory
		const seen = [];
		actor.sheet = {
			rendered: false,
			tabGroups: { primary: 'details' },
			_onDragOver() {},
			async _onDrop(event) { seen.push({ into: event.target.closest('.container[data-item-id]')?.dataset.itemId ?? null, tab: this.tabGroups.primary }); },
		};
		const drag = (type, target) => {
			// the drag begins on the page, as Foundry's do, writing what it carries
			const begun = new DataTransfer();
			begun.setData('text/plain', JSON.stringify({ type: 'Item', uuid: 'Compendium.items.rope' }));
			document.body.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: begun }));
			const dataTransfer = new DataTransfer();
			dataTransfer.setData('text/plain', JSON.stringify({ type: 'Item', uuid: 'Compendium.items.rope' }));
			const event = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer });
			target.dispatchEvent(event);
			return event;
		};
		const into = row('Backpack').querySelector('.grow');
		drag('dragover', into);
		check('a container under the drag lights up', row('Backpack').classList.contains('sfh-drop-target'));
		drag('drop', into);
		await wait(30);
		check('a drop on a container goes into it, as on the sheet', seen.at(-1)?.into === 'pack', seen.at(-1));
		check('and the sheet is on its inventory while it decides', seen.at(-1)?.tab === 'inventory' && actor.sheet.tabGroups.primary === 'details', [seen.at(-1), actor.sheet.tabGroups.primary]);
		drag('drop', row('Rations').querySelector('.grow'));
		await wait(30);
		check('elsewhere, it goes in loose', seen.at(-1)?.into === null, seen.at(-1));
		check('nothing stays lit', !document.querySelector('.sfh-drop-target'));
	}
	check('encumbrance and attunement show', /42\.5 \/ 150 lb/.test(body().textContent) && /1 \/ 3/.test(body().textContent));
	await press('[data-act="qty"][data-k="potion:1"]');
	check('quantity changes', last()[1] === 'potion' && last()[2]['system.quantity'] === 3, last());
	await press('[data-act="equip"][data-k="ring"]');
	check('equip toggles', last()[2]?.['system.equipped'] === true, last());
	await press('[data-act="attune"][data-k="ring"]');
	check('attune toggles', last()[2]?.['system.attuned'] === true, last());
	check('a spent potion is crossed out here too', body().querySelector('[data-act="use"][data-k="potion"]').disabled);
	await change('input[data-field="currency.gp"]', '30');
	check('coins are typed in', last()[1]?.['system.currency.gp'] === 30, last());
	await change('input[data-field="currency.sp"]', '-5.5');
	check('never below zero', last()[1]?.['system.currency.sp'] === 0, last());

	const search = body().querySelector('[data-browse]');
	search.value = 'rope';
	search.dispatchEvent(new Event('input', { bubbles: true }));
	await wait(320);
	const results = () => [...body().querySelectorAll('.sfh-results .qs')];
	check('quick search finds things', results().length === 2, results().length);
	check('what it finds is named in the color of its rarity too', results().find((r) => /Climbing/.test(r.textContent))?.querySelector('.nm').classList.contains('rar-uncommon') && !results().find((r) => /Hempen/.test(r.textContent))?.querySelector('.nm').classList.contains('rar'));
	check('from physical items', calls.find((c) => c[0] === 'fetch')?.[1].includes('loot'));
	search.value = 'torch';
	search.dispatchEvent(new Event('input', { bubbles: true }));
	await wait(320);
	check('a long list says there is more', results().length === 12 && /8 more/.test(body().querySelector('.sfh-results').textContent));
	check('and reads the index only once', calls.filter((c) => c[0] === 'fetch').length === 1);
	search.value = 'rope';
	search.dispatchEvent(new Event('input', { bubbles: true }));
	await wait(320);
	await press('[data-act="addItem"][data-k="Compendium.items.rope"]');
	await wait(40);
	check('Add adds it', last()[0] === 'create' && last()[1] === 'Item' && last()[2][0].copied, last());
	await press('[data-act="buyItem"][data-k="Compendium.items.rope"]');
	await wait(40);
	check('Buy pays first', calls.some((c) => c[0] === 'deduct' && c[1] === 1) && last()[0] === 'create', last());
	notices.length = 0;
	const before = calls.length;
	await press('[data-act="buyItem"][data-k="Compendium.items.climb"]');
	await wait(40);
	check('without the money it says so and adds nothing', notices.some(([k, m]) => k === 'warn' && /Not enough/.test(m)) && !calls.slice(before).some((c) => c[0] === 'create'), notices);
	await press('[data-act="browseEquipment"]');
	check('Browse opens the Compendium Browser', last()[0] === 'browser.render');

	await change('[data-pick="give"][data-k="potion"]', 'f');
	await wait(40);
	check('giving to a character you own moves it', calls.some((c) => c[0] === 'friend.create') && calls.some((c) => c[0] === 'item.delete' && c[1] === 'potion'), calls.slice(-3));
	await tab('actions'); await tab('inventory');
	await change('[data-pick="give"][data-k="ring"]', 's');
	await wait(40);
	check('to someone else\'s, it asks the GM', last()[0] === 'emit' && last()[1] === 'module.scorpious187s-scifi-character-hud' && last()[2].targetId === 's', last());
	game.users.activeGM = null;
	notices.length = 0;
	await tab('actions'); await tab('inventory');
	await change('[data-pick="give"][data-k="ring"]', 's');
	await wait(40);
	check('with no GM online it says so', notices.some(([k]) => k === 'warn'), notices);
	game.users.activeGM = { id: 'gm' };

	const { onGiveRequest, readRoll } = await import('../scripts/adapters/dnd5e.mjs');
	calls.length = 0;
	await onGiveRequest({ userId: 'owner', actorId: 'a', itemId: 'ring', targetId: 's' });
	check('only the active GM acts on the request', !calls.some((c) => c[0] === 'stranger.create'));
	game.users.activeGM = you;
	await onGiveRequest({ userId: 'thief', actorId: 'a', itemId: 'ring', targetId: 's' });
	check('and only for what the asker owns', !calls.some((c) => c[0] === 'stranger.create'));
	await onGiveRequest({ userId: 'owner', actorId: 'a', itemId: 'ring', targetId: 's' });
	check('then it moves it', calls.some((c) => c[0] === 'stranger.create') && calls.some((c) => c[0] === 'item.delete' && c[1] === 'ring'), calls);
	game.users.activeGM = { id: 'gm' };

	/* ---- spells ---- */
	await tab('spells');
	const spellHeads = [...body().querySelectorAll('.sec')].map((s) => s.firstChild.textContent.trim());
	check('sections are by what spells cast from', ['Cantrips', 'Level 1', 'Pact Magic', 'Innate'].every((h) => spellHeads.includes(h)), spellHeads);
	const band = body().querySelector('.sec.sfh-slots');
	check('a level is a band that stands out', getComputedStyle(band).backgroundColor !== 'rgba(0, 0, 0, 0)' && parseFloat(getComputedStyle(band).fontSize) >= 13, getComputedStyle(band).fontSize);
	const subs = [...body().querySelectorAll('.sfh-level-sub')].map((s) => s.textContent);
	check('a section of several levels splits by level too', subs.join() === '1st Level,2nd Level', subs);
	const levelButtons = () => [...body().querySelectorAll('[data-act="spellLevel"]')];
	check('there is a picker for each level, and All', levelButtons().map((b) => b.textContent.trim()).join() === 'All,C,1,2,3', levelButtons().map((b) => b.textContent));
	await press('[data-act="spellLevel"][data-k="1"]');
	await wait(60);
	check('picking a level shows only that level', !!row('Cure Wounds') && !!row('Innate Marvel') && !row('Shillelagh') && !row('Pact Blast') && !row('Innate Trick'));
	check('and marks which is picked', body().querySelector('[data-act="spellLevel"][data-k="1"]').classList.contains('on'));
	check('its slots are still there', !!body().querySelector('[data-act="slot"][data-k^="spell1:"]'));
	await press('[data-act="spellLevel"][data-k="0"]');
	await wait(60);
	check('C is the cantrips', !!row('Shillelagh') && !row('Cure Wounds'));
	await press('[data-act="spellLevel"][data-k="all"]');
	await wait(60);
	check('All brings everything back', !!row('Shillelagh') && !!row('Pact Blast'));
	check('cantrips come first', spellHeads[0] === 'Cantrips', spellHeads);
	const inSection = (name) => { let at = null; for (const el of body().children) { if (el.classList.contains('sec')) at = el.firstChild.textContent.trim(); else if (el.textContent.includes(name)) return at; } return null; };
	check('a pact spell is under Pact Magic whatever its level', inSection('Pact Blast') === 'Pact Magic', inSection('Pact Blast'));
	check('the caster\'s numbers show', /\+7 hit/.test(body().textContent) && /DC 15/.test(body().textContent) && /5 \/ 9/.test(body().textContent));
	const slotBtns = () => [...body().querySelectorAll('[data-act="slot"][data-k^="spell1:"]')];
	check('a level has a segment per slot', slotBtns().length === 4 && slotBtns().filter((b) => b.classList.contains('on')).length === 2);
	await press('[data-act="slot"][data-k="spell1:3"]');
	check('a slot segment sets the count', last()[1]?.['system.spells.spell1.value'] === 3, last());
	await press('[data-act="slot"][data-k="spell1:2"]');
	check('the last one lit spends it', last()[1]?.['system.spells.spell1.value'] === 1, last());
	await press('[data-act="restoreSlots"][data-k="spell1"]');
	check('Restore refills them', last()[1]?.['system.spells.spell1.value'] === 4, last());
	await press('[data-act="prepare"][data-k="s1b"]');
	check('preparing goes through the item', last()[2]?.['system.prepared'] === 1, last());
	await press('[data-act="prepare"][data-k="s1a"]');
	check('and unpreparing', last()[2]?.['system.prepared'] === 0, last());
	check('an always-prepared spell cannot be changed', body().querySelector('[data-act="prepare"][data-k="s1c"]').disabled);
	check('a pact spell has no prepare toggle', !body().querySelector('[data-act="prepare"][data-k="p1"]'));
	{
		const gray = (text) => row(text).classList.contains('unprepared');
		const inkOf = (text) => getComputedStyle(row(text).querySelector('.nm')).color;
		check('a spell that is not prepared is grayed', gray('Unprepared Spell') && inkOf('Unprepared Spell') !== inkOf('Cure Wounds'), [inkOf('Unprepared Spell'), inkOf('Cure Wounds')]);
		check('its Cast is grayed with it, and its prepare toggle is still there to press', getComputedStyle(row('Unprepared Spell').querySelector('[data-act="use"]')).color === inkOf('Unprepared Spell')
			&& row('Unprepared Spell').querySelector('[data-act="prepare"]')?.disabled === false, getComputedStyle(row('Unprepared Spell').querySelector('[data-act="use"]')).color);
		check('it can still be cast and read', !row('Unprepared Spell').querySelector('[data-act="use"]').disabled && !!row('Unprepared Spell').querySelector('.nm[data-act="read"]'));
		const clear = ['Cure Wounds', 'Always Spell', 'Shillelagh', 'Pact Blast', 'Innate Trick'];
		check('what is prepared, always prepared, a cantrip, or needs no preparing is not', clear.every((text) => !gray(text)), clear.filter(gray));
	}
	await press('[data-act="use"][data-k="s1a"]');
	check('Cast casts', last()[0] === 'use:s1a');
	await press('[data-act="spellFilter"]');
	await wait(60);
	check('the prepared filter hides what is not prepared', !row('Unprepared Spell') && !!row('Cure Wounds') && !!row('Always Spell') && !!row('Shillelagh') && !!row('Pact Blast'));
	await press('[data-act="spellFilter"]');
	await wait(60);
	check('and comes off again', !!row('Unprepared Spell'));

	/* ---- effects ---- */
	await tab('effects');
	const effectHeads = [...body().querySelectorAll('.sec')].map((s) => s.textContent.trim());
	check('effects are in the sheet\'s categories', ['Temporary', 'Passive', 'Inactive'].every((h) => effectHeads.includes(h)), effectHeads);
	check('what an item grants shows, with its source', /Ring Aura/.test(body().textContent) && /Ring of Warmth/.test(row('Ring Aura').textContent));
	check('and can be toggled but not removed from here', !!row('Ring Aura').querySelector('[data-act="toggleEffect"]') && !row('Ring Aura').querySelector('[data-act="deleteEffect"]'));
	await press(`[data-act="toggleEffect"][data-k="${auraOnItem.uuid}"]`);
	await wait(30);
	check('it toggles where it really is', last()[0] === 'doc.update' && last()[1] === auraOnItem.uuid && last()[2].disabled === true, last());
	await press('[data-act="deleteEffect"][data-k="bless"]');
	check('an effect of the character\'s own can be removed', last()[0] === 'effect.delete:bless');

	/* ---- the readout ---- */
	foundry.applications.ux.TextEditor.implementation.enrichHTML = async (html) => (html ?? '').replace(/@UUID\[([^\]]+)\]\{([^}]+)\}/g, '<a class="content-link" data-uuid="$1">$2</a>');
	await tab('actions');
	const over = (el) => el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
	const readout = () => stage().querySelector('#sfh-readout');
	over(row('Wild Shape'));
	await wait(200);
	check('the readout lists uses with how they come back', /Uses/.test(readout().textContent) && /2 \/ 3 · Long Rest/.test(readout().textContent), readout().textContent);
	over(row('Longsword'));
	await wait(200);
	check('the readout gives damage in words', /1d8 \+ 3 Slashing \+ 1d6 Fire/.test(readout().textContent), readout().textContent.replace(/\s+/g, ' '));
	check('no label ever prints as an object', !/\[object/.test(readout().textContent));
	await tab('details');
	over(row('Acrobatics').querySelector('.mono'));
	await wait(200);
	check('anywhere on a skill\'s row shows it', /Acrobatics/.test(readout().querySelector('h3')?.textContent ?? ''), readout().textContent.replace(/\s+/g, ' ').slice(0, 120));
	check('with its rules text', /Stay on your feet/.test(readout().textContent) && !!readout().querySelector('a.content-link'), readout().textContent.replace(/\s+/g, ' ').slice(0, 160));
	check('and its numbers', /Dexterity/.test(readout().textContent) && /\+5/.test(readout().textContent) && /15/.test(readout().textContent) && /Proficient/.test(readout().textContent), readout().textContent.replace(/\s+/g, ' ').slice(0, 160));
	over(row('Herb'));
	await wait(200);
	check('a tool shows its base item\'s text', /Herb/.test(readout().querySelector('h3').textContent) && /Clippers and pouches/.test(readout().textContent) && /Tool/.test(readout().textContent), readout().textContent.replace(/\s+/g, ' ').slice(0, 160));
	over(row('Athletics'));
	await wait(200);
	check('a skill with no reference still shows its numbers', /Athletics/.test(readout().querySelector('h3').textContent) && /Strength/.test(readout().textContent));
	const fetched = () => calls.filter((c) => c[0] === 'fromUuid' && c[1] === 'Compendium.rules.acr').length;
	const firstFetch = fetched();
	over(row('Acrobatics'));
	await wait(200);
	check('the rules text is read once', fetched() === firstFetch && /Stay on your feet/.test(readout().textContent), [firstFetch, fetched()]);

	/* ---- a skill, a tool or an activity can be a favorite, as on the sheet ---- */
	const fav = () => readout().querySelectorAll('[data-act="favorite"]');
	check('a favorite skill says so in the readout', fav().length === 1 && fav()[0].dataset.k === 'skill|acr' && fav()[0].getAttribute('aria-pressed') === 'true', [...fav()].map((b) => b.dataset.k));
	fav()[0].click();
	await wait(60);
	check('and comes off from there', JSON.stringify(last()) === JSON.stringify(['removeFavorite', 'acr']), last());
	over(row('Herb'));
	await wait(200);
	check('a tool can be marked', fav()[0]?.dataset.k === 'tool|herb' && fav()[0].getAttribute('aria-pressed') === 'false');
	fav()[0].click();
	await wait(60);
	check('and is, as the sheet marks one', JSON.stringify(last()) === JSON.stringify(['addFavorite', { type: 'tool', id: 'herb' }]), last());
	await tab('features');
	const mixed = actor.items.get('mixed');
	mixed.system.activities.forEach((a, i) => Object.assign(a, { id: `a${i}`, name: ['Strike', 'Feint'][i], relativeUUID: `.Item.mixed.Activity.a${i}` }));
	over(row('Mixed Power'));
	await wait(200);
	const marks = [...fav()].map((b) => [b.dataset.k, b.textContent.trim()]);
	check('an item that does more than one thing offers each of them too', marks.length === 3 && marks[1][0] === 'activity|.Item.mixed.Activity.a0' && marks[1][1] === 'Strike' && marks[2][1] === 'Feint', marks);
	fav()[2].click();
	await wait(60);
	check('and marks one alone', JSON.stringify(last()) === JSON.stringify(['addFavorite', { type: 'activity', id: '.Item.mixed.Activity.a1' }]), last());
	over(row('Wild Shape'));
	await wait(200);
	check('an item that does one thing offers only itself', fav().length === 1 && fav()[0].dataset.k.startsWith('item|'));
	await tab('actions');
	const favSkill = [...body().querySelectorAll('.sfh-action')].find((r) => /Acrobatics/.test(r.textContent));
	over(favSkill);
	await wait(200);
	check('a favorite skill shows the same', /Stay on your feet/.test(readout().textContent));
	await tab('spells');
	over(row('Cure Wounds'));
	await wait(200);
	check('a spell\'s details are in the readout', /Evocation/.test(readout().textContent) && /V, S/.test(readout().textContent));
	check('with its properties as chips', [...readout().querySelectorAll('.chip')].some((c) => /Concentration/.test(c.textContent)));
	check('and a live link, not a tag', !!readout().querySelector('a.content-link') && !/@UUID/.test(readout().textContent));
	await tab('inventory');
	over(row('Unidentified Wand'));
	await wait(200);
	check('an unidentified item keeps its secret', /plain stick/.test(readout().textContent) && !/Wand of Secrets/.test(readout().textContent), readout().textContent);
	check('its rarity among them', !/Artifact/.test(readout().textContent), readout().textContent);
	over(row('Ring of Warmth'));
	await wait(200);
	check('the readout says what rarity a thing is, in words', /Rarity/.test(readout().textContent) && /Uncommon/.test(readout().textContent), readout().textContent);

	/* ---- the latest roll ---- */
	const rollDamage = record('latest.rollDamage');
	const message = (id, type, roll, extra = {}) => (messages[id] = { id, type, rolls: roll ? [{ formula: '1d20 + 7', total: 19, ...roll }] : [], isContentVisible: true, visible: true, speaker: { actor: 'a' }, flavor: '<span>Attack Roll</span>', system: { ability: 'str', mode: 'oneHanded' }, getAssociatedActor: () => actor, getAssociatedItem: () => items.get('sword'), getAssociatedActivity: () => ({ rollDamage }), ...extra });
	const strip = () => stage().querySelector('[data-slot="latest"]');
	Projection.noteRoll(message('m1', 'attack', {}));
	await wait(60);
	check('an attack takes the strip', !!strip() && /Longsword/.test(strip().textContent) && /19/.test(strip().textContent));
	check('with Damage and Critical', !!strip().querySelector('[data-k="m1:damage"]') && !!strip().querySelector('[data-k="m1:critical"]'));
	strip().querySelector('[data-k="m1:damage"]').click();
	await wait(30);
	check('Damage carries the attack\'s ability and mode', last()[0] === 'latest.rollDamage' && last()[1].ability === 'str' && last()[1].attackMode === 'oneHanded' && last()[1].isCritical === false, last()[1]);
	strip().querySelector('[data-k="m1:critical"]').click();
	await wait(30);
	check('Critical rolls a critical', last()[1].isCritical === true && last()[2].options.defaultButton === 'critical', last()[2]);
	Projection.noteRoll(message('m2', 'attack', { isCritical: true }));
	await wait(60);
	check('natural 20s say so', /Critical/.test(strip().querySelector('.l-o')?.textContent ?? ''), strip().textContent);
	Projection.noteRoll(message('m3', 'check', {}, { getAssociatedItem: () => null, flavor: 'Acrobatics Check' }));
	await wait(60);
	check('a check has no follow-up', /Acrobatics Check/.test(strip().textContent) && !strip().querySelector('[data-act="latestDamage"]'), strip().textContent);
	check('a usage card is not a roll', readRoll(message('m4', 'usage', {})) === null);
	check('a message with no dice is not a roll', readRoll(message('m5', 'attack', null)) === null);
	check('nor one this user cannot see', readRoll(message('m6', 'attack', {}, { isContentVisible: false })) === null);

	/* ---- biography ---- */
	await tab('biography');
	await wait(60);
	const field = (f) => body().querySelector(`[data-field="${f}"]`);
	check('characteristics show', field('alignment')?.value === 'Neutral Good');
	check('the five text boxes are there', ['ideal', 'bond', 'flaw', 'trait', 'appearance'].every((f) => field(f)?.tagName === 'TEXTAREA'), field('ideal')?.tagName);
	check('the story has the editor', field('biography')?.tagName === 'PROSE-MIRROR' && !!field('biography').querySelector('a.content-link'));
	await change('[data-field="alignment"]', 'Chaotic Good');
	check('a characteristic saves', last()[1]?.['system.details.alignment'] === 'Chaotic Good', last());
	await change('[data-field="ideal"]', 'Freedom');
	check('a text box saves', last()[1]?.['system.details.ideal'] === 'Freedom', last());
	const typing = field('flaw');
	typing.focus();
	typing.value = 'half typed';
	Projection.render();
	await wait(60);
	check('a redraw waits for a text box too', field('flaw') === typing && typing.value === 'half typed');
	typing.blur();
	await wait(60);
	check('then happens once they stop', field('flaw') !== typing);

	/* ---- every tab fits on every device ---- */
	for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal', 'vambrace']) {
		game.settings.set(null, 'device', device);
		await wait(250);
		for (const t of ['details', 'actions', 'inventory', 'spells', 'features', 'effects', 'biography']) {
			await tab(t);
			await wait(40);
			check(`${device} ${t}: nothing prints as an object`, !/\[object|undefined/.test(body().textContent), body().textContent.match(/.{0,30}(\[object|undefined).{0,20}/)?.[0]);
			const box = body().getBoundingClientRect();
			const spilled = [...body().querySelectorAll('.li, .sec, .sfh-in, .ta, .sfh-rich, .b, .sel')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.left < box.left - 1 || r.right > box.right + 1); });
			check(`${device} ${t}: nothing runs off the side`, !spilled.length && body().scrollWidth <= body().clientWidth + 1, spilled.slice(0, 4).map((e) => `${e.className}:${e.textContent.trim().slice(0, 20)}`));
		}
		const rests = [...stage().querySelectorAll('[data-act="rest"]')];
		check(`${device}: the Rest labels fit their buttons`, rests.length === 2 && rests.every((b) => b.scrollWidth <= b.clientWidth + 1 && b.scrollHeight <= b.clientHeight + 1 && getComputedStyle(b).whiteSpace === 'nowrap'), rests.map((b) => [b.scrollWidth, b.clientWidth, b.scrollHeight, b.clientHeight]));
		const identity2 = stage().querySelector('[data-slot="identity"]');
		const idBox = identity2.getBoundingClientRect();
		check(`${device}: and stay inside their panel`, rests.every((b) => { const r = b.getBoundingClientRect(); return r.left >= idBox.left - 1 && r.right <= idBox.right + 1 && r.bottom <= idBox.bottom + 1; }), rests.map((b) => [b.getBoundingClientRect().right, idBox.right]));
		for (const t of ['actions', 'spells']) {
			await tab(t);
			const grids = [...body().querySelectorAll('.sfh-actions')];
			const heights = grids.flatMap((g) => [...g.children].map((r) => r.getBoundingClientRect().height));
			const within = grids.every((g) => { const hs = [...g.children].map((r) => r.getBoundingClientRect().height); return Math.max(...hs) - Math.min(...hs) < 0.5; });
			check(`${device} ${t}: rows in a grid are all one height`, heights.length > 0 && within, heights.slice(0, 8));
		}
	}

	/* ---- 5e's chat cards, with its real stylesheet and its real markup ---- */
	{
		const sheet = document.createElement('link');
		sheet.rel = 'stylesheet';
		sheet.href = 'file:///C:/Users/djsco/AppData/Local/FoundryVTT/Data/systems/dnd5e/dnd5e.css';
		document.head.append(sheet);
		await new Promise((r) => { sheet.onload = r; sheet.onerror = r; setTimeout(r, 2000); });
		document.body.dataset.sfhChat = 'on';
		const log = document.createElement('ol');
		log.className = 'chat-log plain';
		log.style.cssText = 'position:fixed;left:20px;top:20px;width:320px;z-index:99999;list-style:none;margin:0;padding:0';
		const card = (extra) => `<li class="chat-message message flexcol dnd5e2 ${extra}" data-message-id="m">
			<header class="message-header flexrow"><h4 class="message-sender">Aralin</h4><span class="message-metadata"><time class="message-timestamp">Now</time></span></header>
			<div class="message-content"><div class="chat-card">
				<section class="card-header description collapsible"><div class="item-icon"><img class="gold-icon" src="" alt=""></div>
					<div class="name-stacked"><span class="title">Longsword</span><span class="subtitle">Martial Melee</span></div></section>
				<section class="card-description collapsible"><div class="collapsible-content"><div class="wrapper"><p>A fine blade. <strong>Bold.</strong></p></div></div></section>
				<div class="card-buttons"><button type="button" data-action="rollAttack"><i class="dnd5e-icon"></i><span>Attack</span></button><button type="button" data-action="rollDamage"><span>Damage</span></button></div>
				<ul class="pills"><li class="pill">Action</li><li class="pill">5 ft</li></ul>
			</div>
			<div class="dice-roll"><div class="dice-result"><div class="dice-formula">1d20 + 7</div><h4 class="dice-total critical">27</h4></div></div></div></li>`;
		log.innerHTML = card('') + card('compact');
		document.body.append(log);
		await wait(120);
		const luminance = (css) => {
			const m = css.match(/[\d.]+/g)?.map(Number);
			// a faint tint over the panel is not a light background
			if (!m || (m.length > 3 && m[3] < 0.2)) return null;
			// color-mix() hands back color(srgb …), on a 0–1 scale
			if (css.startsWith('color(')) for (let i = 0; i < 3; i++) m[i] *= 255;
			return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255;
		};
		for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal', 'vambrace']) {
			game.settings.set(null, 'device', device);
			await wait(250);
			for (const message of log.children) {
				const name = `${device} ${message.classList.contains('compact') ? 'compact' : 'standard'} card`;
				// the Journal is ink on paper: there the card is light and its writing dark, the other way around
				const paper = device === 'journal';
				// an item's icon is an image in a frame; the frame behind it is not where anything is read
				const wrong = [message, ...message.querySelectorAll(':not(img)')].filter((e) => { const l = luminance(getComputedStyle(e).backgroundColor); return l !== null && (paper ? l < 0.5 : l > 0.5); });
				check(`${name}: nothing is on a ${paper ? 'dark' : 'light'} background`, !wrong.length, wrong.slice(0, 4).map((e) => `${e.tagName}.${e.className}:${getComputedStyle(e).backgroundColor}`));
				check(`${name}: no parchment texture`, !/texture|parchment/i.test(getComputedStyle(message).backgroundImage), getComputedStyle(message).backgroundImage.slice(0, 80));
				const dark = [...message.querySelectorAll('p, .title, .subtitle, button span, .pill, .dice-formula')].filter((e) => { const l = luminance(getComputedStyle(e).color); return l !== null && (paper ? l > 0.55 : l < 0.3); });
				check(`${name}: its text can be read`, !dark.length, dark.slice(0, 4).map((e) => `${e.className || e.tagName}:${getComputedStyle(e).color}`));
				const probe = document.createElement('i');
				probe.style.color = 'var(--sfh-heading)';
				message.append(probe);
				check(`${name}: its title is in the heading color`, getComputedStyle(message.querySelector('.title')).color === getComputedStyle(probe).color, getComputedStyle(message.querySelector('.title')).color);
				probe.remove();
				const total = message.querySelector('.dice-total');
				const formula = message.querySelector('.dice-formula');
				check(`${name}: a critical stands out from an ordinary roll`, getComputedStyle(total).color !== getComputedStyle(formula).color && getComputedStyle(total).backgroundColor !== getComputedStyle(formula).backgroundColor, [getComputedStyle(total).color, getComputedStyle(formula).color]);
				const button = message.querySelector('.card-buttons button');
				check(`${name}: its buttons have an edge`, parseFloat(getComputedStyle(button).borderTopWidth) >= 1, getComputedStyle(button).borderTopWidth);
			}
		}
		if (globalThis.keepChatShot) window.chatLog = log; else log.remove();
		sheet.remove();
		await wait(60);
		game.settings.set(null, 'device', 'omni');
		await wait(200);
	}

	/* ---- someone else looking ---- */
	actor.isOwner = false;
	game.settings.set(null, 'device', 'omni');
	await wait(200);
	await tab('biography');
	await wait(60);
	check('without ownership the text fields are locked', [...body().querySelectorAll('[data-field]')].every((e) => e.disabled) && !body().querySelector('prose-mirror'));
	await tab('inventory');
	check('and so are the coins', body().querySelector('[data-field="currency.gp"]').disabled);
	actor.isOwner = true;

	/* ---- what D&D 5e 6.1 added or moved, that the projection follows ---- */
	{
		const sys61 = actor.system;
		const kept = { movement: sys61.attributes.movement, weight: items.get('sword').system.weight };
		// a special kind of damage trait (falling), speeds under movement.speeds, and weights in the world's unit
		CONFIG.DND5E.damageResistanceTypes = { falling: { label: 'Falling Damage' } };
		CONFIG.DND5E.weightUnits = { lb: { abbreviation: 'lb' }, kg: { abbreviation: 'kg' } };
		sys61.traits.dr.value.add('falling');
		sys61.attributes.movement = { speeds: { walk: 9 }, units: 'm' };
		items.get('sword').system.weight = { value: 1.3607771, units: 'kg' };
		Projection.render();
		await wait(200);
		const stageText = () => stage().textContent.replace(/\s+/g, ' ');
		check('6.1: a resistance to falling is named as the system names it, not by its key', /Falling Damage/.test(stageText()) && !/\bfalling\b/.test(stageText()), stageText().match(/.{20}alling.{20}/)?.[0]);
		check('6.1: the walking speed is read from where the system keeps it now, in its own unit', /Speed\s*9 m/.test(stageText()), stageText().match(/Speed.{0,14}/)?.[0]);
		await tab('inventory');
		check('6.1: an item weighed in kilograms says so, to two places', /1\.36 kg/.test(row('Longsword').textContent) && !/lb/.test(row('Longsword').textContent), row('Longsword').textContent.replace(/\s+/g, ' '));
		check('6.1: one weighed in pounds still says pounds', /0\.5 lb/.test(row('Potion of Healing').textContent));
		// inside an antimagic region the system's sheet lists no spells
		actor.statuses.add('antimagic');
		await tab('actions'); await tab('spells');
		check('6.1: under antimagic the Spells tab says so and lists no spell', /Antimagic/.test(body().textContent) && !row('Cure Wounds'), body().textContent.slice(0, 80));
		actor.statuses.delete('antimagic');
		await tab('actions'); await tab('spells');
		check('6.1: and out of it they are back', !!row('Cure Wounds') && !/Antimagic/.test(body().textContent));
		sys61.traits.dr.value.delete('falling');
		sys61.attributes.movement = kept.movement;
		items.get('sword').system.weight = kept.weight;
		delete CONFIG.DND5E.damageResistanceTypes;
		delete CONFIG.DND5E.weightUnits;
		Projection.render();
		await wait(150);
		check('6.0 and earlier: a speed kept in the old place is still read', /Speed\s*35 ft/.test(stageText()), stageText().match(/Speed.{0,14}/)?.[0]);
	}

	/* ---- the vitals panel holds what 5e puts in it, in any font ---- */
	{
		const vitalsOf = () => document.querySelector('#sfh-projection [data-slot="vitals"]');
		// what is cut off, hangs out of its cell, or has to be scrolled to
		const amiss = () => {
			const panel = vitalsOf();
			const cells = panel.querySelector('.cells.scroll');
			const found = [];
			if (cells.scrollHeight > cells.clientHeight + 1) found.push(`scrolls: ${cells.scrollHeight} in ${cells.clientHeight}`);
			for (const cell of panel.querySelectorAll('.cell')) {
				const box = cell.getBoundingClientRect();
				for (const el of cell.querySelectorAll('.seg, .lbl, .b, .v')) {
					const r = el.getBoundingClientRect();
					if (r.left < box.left - 1.5 || r.right > box.right + 1.5) found.push(`${String(el.className).trim()} hangs out of "${cell.textContent.trim().slice(0, 14)}"`);
				}
			}
			for (const label of panel.querySelectorAll('.cell .lbl')) if (label.scrollWidth > label.clientWidth + 1) found.push(`cut: ${label.textContent}`);
			return found;
		};
		const wear = async (device) => { game.settings.set(null, 'device', device); await wait(350); };
		for (const device of ['vambrace', 'reliquary', 'omni', 'gauntlet', 'comm', 'crystal', 'journal', 'tron']) {
			await wear(device);
			check(`${device}: the vitals panel holds hit points, hit dice, inspiration, death saves and exhaustion, none cut off or scrolled away`, amiss().length === 0, amiss());
		}
		await wear('vambrace');
		check('vambrace: a panel that fits is left as the stylesheet has it', !vitalsOf().querySelector('.cells').style.zoom && ![...vitalsOf().querySelectorAll('.lbl')].some((l) => l.style.fontSize));
		check('vambrace: all six death saves and all six levels of exhaustion are inside their cells', vitalsOf().querySelectorAll('.cell.trk .seg').length === 12);
		for (const device of ['vambrace', 'omni', 'journal', 'wrist', 'gdi']) {
			await wear(device);
			const [barBox, tempBox, healBox] = ['.hp-b', '[data-commit="temp"]', '[data-act="heal"]'].map((sel) => vitalsOf().querySelector(sel).getBoundingClientRect());
			check(`${device}: the temporary hit points are under the bar`, tempBox.top >= barBox.bottom - 0.5 && !vitalsOf().querySelector('.hp-h [data-commit="temp"]'), [Math.round(barBox.bottom), Math.round(tempBox.top)]);
			if (!['wrist'].includes(device)) check(`${device}: and over Heal and Damage`, tempBox.bottom <= healBox.top + 0.5, [Math.round(tempBox.bottom), Math.round(healBox.top)]);
		}
		await wear('vambrace');
		// a player's own font can be a good deal wider than the device's
		const wide = document.head.appendChild(document.createElement('style'));
		wide.textContent = '#sfh-projection .sfh-stage[data-device] .foldwrap .lbl { letter-spacing: .2em; font-size: 12.5px; font-variant: small-caps; }';
		for (const device of ['omni', 'vambrace']) {
			await wear(device);
			const shrunk = [...vitalsOf().querySelectorAll('.lbl')].filter((l) => l.style.fontSize).map((l) => l.textContent);
			check(`${device}, in a wider font: a word too long for its cell is set smaller, and the panel still holds everything`, amiss().length === 0 && shrunk.includes('Inspiration'), [amiss(), shrunk, vitalsOf().querySelector('.cells').style.zoom]);
		}
		check('and a panel a line too tall is drawn a little smaller, not cut off at the foot', Number(vitalsOf().querySelector('.cells').style.zoom) >= 0.8 && Number(vitalsOf().querySelector('.cells').style.zoom) < 1, vitalsOf().querySelector('.cells').style.zoom);
		wide.remove();
		await wear('omni');
	}

	/* ---- rarity on a page: inked dark enough to read ---- */
	{
		const lum = (c) => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
		const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
		for (const [device, ground] of [['journal', 'rgb(236, 223, 192)'], ['grove', 'rgb(233, 228, 198)'], ['crystal', 'rgb(195, 227, 240)']]) {
			game.settings.set(null, 'device', device);
			await wait(300);
			await tab('inventory');
			const inks = ['Ring of Warmth', 'Longsword', 'Stowed Bow', 'Backpack', 'Rations'].map((text) => getComputedStyle(row(text).querySelector('.nm')).color);
			check(`${device}: the five rarities are inked to read on its page, each its own`, inks.every((c) => contrast(c, ground) >= 4.5) && new Set(inks).size === 5, inks.map((c) => [c, +contrast(c, ground).toFixed(2)]));
			await tab('spells');
			const gray = getComputedStyle(row('Unprepared Spell').querySelector('.nm')).color;
			check(`${device}: an unprepared spell is grayed in ink that still reads`, row('Unprepared Spell').classList.contains('unprepared') && contrast(gray, ground) >= 4.5 && gray !== getComputedStyle(row('Cure Wounds').querySelector('.nm')).color, [gray, +contrast(gray, ground).toFixed(2)]);
		}
		game.settings.set(null, 'device', 'omni');
		await wait(300);
	}

	/* ---- an NPC, as a GM brings one up by selecting its token ---- */
	const sys = actor.system;
	const kept = { type: actor.type, details: sys.details, hd: sys.attributes.hd, inspiration: sys.attributes.inspiration };
	actor.type = 'npc';
	sys.details = { ...sys.details, cr: 0.5, type: { label: 'Humanoid (Goblinoid)' }, xp: { value: 100 } };
	sys.attributes.hd = { max: 4, spent: 1 };
	delete sys.attributes.inspiration;
	sys.resources = { legact: { max: 3, spent: 1 }, legres: { max: 2, spent: 0 } };
	game.settings.set(null, 'device', 'omni');
	await wait(250);
	const q = (sel) => document.querySelector(`#sfh-projection ${sel}`);
	const vitals = () => q('[data-slot="vitals"]');
	await tab('spells');
	check('an NPC: its spells are left as they are, prepared or not', !!row('Unprepared Spell') && !body().querySelector('.li.unprepared'), body().querySelectorAll('.li.unprepared').length);
	check('an NPC: its creature type under its name', /Humanoid \(Goblinoid\)/.test(q('.st')?.textContent ?? ''), q('.st')?.textContent);
	check('its challenge rating where a level would be, as 5e writes it', /CR/.test(q('.lvl')?.textContent ?? '') && /1\/2/.test(q('.lvl')?.textContent ?? ''), q('.lvl')?.textContent.replace(/\s+/g, ' '));
	check('no experience to earn', !q('[data-commit="xp"]'));
	check('no inspiration', !vitals().querySelector('[data-act="insp"]'));
	check('hit dice from its hit point formula, less those spent', /3\/4/.test(vitals().querySelector('[data-act="hd"]')?.textContent ?? ''), vitals().querySelector('[data-act="hd"]')?.textContent);
	const legact = () => [...vitals().querySelectorAll('[data-act="legact"]')];
	check('legendary actions as a track of what is left', legact().length === 3 && legact().filter((s) => s.classList.contains('on')).length === 2);
	check('and legendary resistance', vitals().querySelectorAll('[data-act="legres"]').length === 2);
	legact()[2].click();
	await wait(60);
	check('a segment sets what is left by what is spent', JSON.stringify(last()) === JSON.stringify(['actor.update', { 'system.resources.legact.spent': 0 }]), last());
	check('death saves still there', !!vitals().querySelector('[data-act="deathMark"]'));
	actor.type = kept.type;
	sys.details = kept.details;
	sys.attributes.hd = kept.hd;
	sys.attributes.inspiration = kept.inspiration;
	delete sys.resources;
	return out;
});

if (shotsTo) {
	const shots = [];
	for (const [device, t] of [['omni', 'details'], ['omni', 'actions'], ['omni', 'inventory'], ['tron', 'spells'], ['tron', 'features'], ['tron', 'effects'], ['tron', 'biography']]) {
		const clip = await page.evaluate(async (d, id) => {
			game.settings.set(null, 'device', d);
			await new Promise((r) => setTimeout(r, 350));
			document.querySelector(`#sfh-projection [data-act="tab"][data-k="${id}"]`).click();
			await new Promise((r) => setTimeout(r, 150));
			document.querySelector('#sfh-projection .proj-b').scrollTop = 0;
			const main = document.querySelector('#sfh-projection [data-slot="projection"]').getBoundingClientRect();
			return { x: main.left - 2, y: main.top - 2, width: main.width + 4, height: main.height + 4 };
		}, device, t);
		shots.push(await page.screenshot({ clip }));
	}
	const metas = await Promise.all(shots.map((b) => sharp(b).metadata()));
	const w = Math.max(...metas.map((m) => m.width));
	const h = Math.max(...metas.map((m) => m.height));
	const comps = shots.map((b, i) => ({ input: b, left: (i % 2) * (w + 8), top: Math.floor(i / 2) * (h + 8) }));
	await sharp({ create: { width: 2 * w + 8, height: Math.ceil(shots.length / 2) * (h + 8), channels: 3, background: '#222' } }).composite(comps).png().toFile(`${shotsTo}/dnd5e-tabs.png`);
	// the fantasy devices, whole: the Journal on three of its pages, the Vambrace on two
	for (const [dev, t] of [['journal', 'actions'], ['journal', 'spells'], ['journal', 'inventory'], ['vambrace', 'actions'], ['vambrace', 'spells']]) {
		await page.evaluate(async (d, id) => {
			game.settings.set(null, 'device', d);
			await new Promise((r) => setTimeout(r, 350));
			document.querySelector(`#sfh-projection [data-act="tab"][data-k="${id}"]`).click();
			await new Promise((r) => setTimeout(r, 200));
		}, dev, t);
		await page.screenshot({ path: `${shotsTo}/dnd5e-${dev}-${t}.png` });
	}
}
await browser.close();

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
