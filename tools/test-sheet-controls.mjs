/*
 * Press the Spells, Skills and Inventory controls on the real projection and check each hands
 * the system what its own sheet would: the same method, with the same arguments. The system's
 * side is stood in for by recorders in the shapes read from its source.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// puppeteer lives in the sibling conversion repo; this tool is dev-only
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const dir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');

const browser = await puppeteer.launch({
	executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, Projection, actor } = SFH;
	const calls = [];
	const record = (name, value) => { calls.push([name, value]); return value; };
	const last = () => calls[calls.length - 1];

	// what the system's side looks like, from its source
	const items = {
		sc1: { id: 'sc1', uuid: 'Actor.asha.Item.sc1', system: { slots: { slot2: { value: 0, max: 2 } } }, update: async (d) => record('entry.update', d) },
		sc3: { id: 'sc3', uuid: 'Actor.asha.Item.sc3', update: async (d) => record('entry.update', d) },
		s1: { id: 's1', system: { location: { uses: { value: 0, max: 1 } } }, update: async (d) => record('spell.update', d) },
		lore1: { id: 'lore1', update: async (d) => record('lore.update', d) },
	};
	actor.items.get = (id) => items[id] ?? null;
	actor.update = async (d) => record('actor.update', d);
	actor.system.skills = {
		acrobatics: { rank: 3 }, athletics: { rank: 2 }, computers: { rank: 2 }, diplomacy: { rank: 3 }, intimidation: { rank: 3 },
		medicine: { rank: 1 }, occultism: { rank: 2 }, piloting: { rank: 2 }, stealth: { rank: 2 }, survival: { rank: 1 },
		// a lore item writes itself into system.skills with its itemId, and no lore flag yet
		warfare: { rank: 1, itemId: 'lore1' }, orphan: { rank: 0, lore: true },
	};
	actor.skills.warfare = { label: 'Warfare Lore', mod: 8, rank: 1, roll: () => {} };
	actor.skills.orphan = { label: 'Orphan Lore', mod: 0, rank: 0, roll: () => {} };
	actor.spellcasting.collections.get('sc3').setSlotExpendedState = async (...args) => record('setSlotExpendedState', args);

	const filter = { search: { text: 'stale' }, checkboxes: {} };
	game.pf2e = { compendiumBrowser: { tabs: { equipment: {
		getFilterData: async () => filter,
		open: async (options) => record('browser.open', options),
	} } } };

	// the character sheet, with the button the system binds its Spell Preparation to
	let prepared = 0;
	const sheet = {
		id: 'CharacterSheetPF2e-Actor-asha', rendered: false,
		render() {
			setTimeout(() => {
				const el = document.createElement('div');
				el.id = this.id;
				el.innerHTML = '<li data-item-id="sc3" data-container-id="sc3"><button data-action="open-spell-preparation"></button></li>';
				el.querySelector('button').addEventListener('click', () => { prepared += 1; });
				document.body.append(el);
				this.rendered = true;
				sheet.visibleWhileDrawn = getComputedStyle(el).visibility;
			}, 40);
			return this;
		},
		async close() { document.getElementById(this.id)?.remove(); this.rendered = false; },
	};
	actor.sheet = sheet;
	globalThis.foundry.applications = { instances: new Map() };

	hud.setPower(true, { silent: true });
	await wait(300);
	const stage = () => document.querySelector('#sfh-projection');
	const tab = async (id) => { stage().querySelector(`[data-act="tab"][data-k="${id}"]`).click(); await wait(120); };
	const press = async (selector) => {
		const el = stage().querySelector(selector);
		if (!el) return false;
		el.click();
		await wait(60);
		return true;
	};

	/* ---- strikes ---- */
	{
		const fired = [];
		const roll = (name) => ({ label: '+5', roll: async (o) => { fired.push(`${name} attack`); return o; } });
		const usage = (name, extra = {}) => ({ label: name, ready: true, handsAvailable: true, traits: [], variants: [roll(name)],
			damage: async () => fired.push(`${name} damage`), critical: async () => fired.push(`${name} critical`), ...extra });
		const auxCalls = [];
		const subitemCalls = [];
		const pistol = { id: 'pistol', update: async (d) => record('pistol.update', d), subitems: new Map([['mag1', { detach: async (o) => subitemCalls.push(['detach', 'mag1', o]) }]]) };
		const rifle = { id: 'rifle', update: async (d) => record('rifle.update', d), subitems: new Map() };
		actor.system.actions = [
			usage('Stowed Rifle', { ready: false, item: rifle, auxiliaryActions: [{ label: 'Draw', execute: async (o) => auxCalls.push(['draw', o]) }] }),
			usage('Secret Knife', { visible: false, item: rifle }),
			usage('Drawn Pistol', {
				item: pistol,
				altUsages: [usage('Burst', { type: 'auto-fire', item: { isRanged: true } })],
				ammunition: {
					requiresReload: true, capacity: 2, remaining: 1, selected: { id: 'mag1' },
					loaded: [{ id: 'mag1', name: 'Magazine', quantity: 8, max: 10 }, { id: 'mag2', name: 'Tracer', quantity: 3, max: 10 }],
				},
				auxiliaryActions: [{ label: 'Stow', execute: async (o) => auxCalls.push(['stow', o]) },
					{ label: 'Change Grip', options: [{ value: 'two', label: 'Two hands' }], execute: async (o) => auxCalls.push(['grip', o]) }],
			}),
			usage('Bow', { item: pistol, ammunition: { requiresReload: false, compatible: [{ id: 'arrows', label: 'Arrows (20)' }], selected: null } }),
			usage('Bound Hands', { ready: false, handsAvailable: false, item: rifle, auxiliaryActions: [{ label: 'Draw', execute: async () => {} }] }),
			usage('Thrown Rock', { quantity: 0, item: rifle }),
		];
		items.arrows = { id: 'arrows' };
		actor.itemTypes.action = [{ id: 'act1', uuid: 'Actor.asha.Item.act1', name: 'Biotic Charge', system: { actions: { value: 2 }, actionType: { value: 'action' }, traits: { value: [] } } }];
		actor.itemTypes.feat = [
			{ id: 'feat1', uuid: 'Actor.asha.Item.feat1', name: 'Nova Feat', actionCost: { type: 'action', value: 1 }, system: { actions: { value: 1 }, actionType: { value: 'action' }, traits: { value: [] } } },
			{ id: 'feat2', name: 'Passive Feat', actionCost: null, system: { traits: { value: [] } } },
			{ id: 'feat3', name: 'Suppressed Feat', actionCost: { type: 'free' }, suppressed: true, system: { traits: { value: [] } } },
		];
		await tab('actions');
		const row = (name) => [...stage().querySelectorAll('.li')].find((l) => l.querySelector('.nm')?.textContent === name);
		const within = (name, selector) => row(name)?.querySelector(selector);

		within('Drawn Pistol', '[data-act="strike"]').click();
		await wait(30);
		check('Attack fires the weapon it is on, with one stowed above it', fired.at(-1) === 'Drawn Pistol attack', fired);
		within('Drawn Pistol', '[data-act="strikeDamage"]').click();
		await wait(30);
		check('Damage does too', fired.at(-1) === 'Drawn Pistol damage', fired);
		within('Drawn Pistol', '[data-act="critical"]').click();
		await wait(30);
		check('and Critical', fired.at(-1) === 'Drawn Pistol critical', fired);
		check('a hidden strike is not shown', !row('Secret Knife'));
		// rows hold their content and stay clear of each other, on every device and every tab
		const layoutProblems = () => {
			const body = stage().querySelector('.proj-b');
			const rows = [...body.children].filter((el) => el.getBoundingClientRect().height > 0);
			const out = [];
			rows.forEach((el, i) => {
				const r = el.getBoundingClientRect();
				if (el.scrollHeight > el.clientHeight + 1) out.push(`${el.className} overflows: ${el.scrollHeight} > ${el.clientHeight}`);
				const next = rows[i + 1]?.getBoundingClientRect();
				if (next && next.top < r.bottom - 0.5) out.push(`${el.className} runs into the next row`);
			});
			return out;
		};
		for (const device of ['omni', 'wrist', 'gdi', 'tron']) {
			game.settings.set(null, 'device', device);
			await wait(150);
			await tab('actions');
			const found = layoutProblems();
			check(`${device}: strike rows hold their controls`, !found.length, found);
		}
		game.settings.set(null, 'device', 'omni');
		await wait(150);
		await tab('actions');

		check('a stowed weapon is listed, without attacks', row('Stowed Rifle') && !within('Stowed Rifle', '[data-act="strike"]'));
		within('Stowed Rifle', '[data-act="aux"]').click();
		await wait(30);
		check('Draw runs the system\'s action', auxCalls.at(-1)?.[0] === 'draw' && auxCalls.at(-1)[1].selection === null, auxCalls);
		check('with no hands free it says so and offers nothing', /Hands occupied/.test(row('Bound Hands').textContent) && !within('Bound Hands', '[data-act="aux"]'));
		check('none left, no attacks', /None left/.test(row('Thrown Rock').textContent) && !within('Thrown Rock', '[data-act="strike"]'));

		const altAttack = [...row('Drawn Pistol').querySelectorAll('[data-act="strike"]')].find((b) => b.dataset.k.split(':')[2] === '0');
		check('auto-fire is labelled', /Auto-fire/.test(row('Drawn Pistol').textContent));
		altAttack.click();
		await wait(30);
		check('auto-fire fires its own attack', fired.at(-1) === 'Burst attack', fired);
		[...row('Drawn Pistol').querySelectorAll('[data-act="strikeDamage"]')].find((b) => b.dataset.k.includes(':')).click();
		await wait(30);
		check('and its own damage', fired.at(-1) === 'Burst damage', fired);

		within('Drawn Pistol', 'select[data-pick="aux"]').value = 'two';
		within('Drawn Pistol', 'select[data-pick="aux"]').dispatchEvent(new Event('change', { bubbles: true }));
		await wait(60);
		check('a choice passes its selection', JSON.stringify(auxCalls.at(-1)) === JSON.stringify(['grip', { selection: 'two' }]), auxCalls);

		check('loaded ammunition shows its count', /Magazine/.test(row('Drawn Pistol').textContent) && /8 \/ 10/.test(row('Drawn Pistol').textContent));
		within('Drawn Pistol', '[data-act="unload"]').click();
		await wait(30);
		check('Unload detaches it', subitemCalls.at(-1)?.[0] === 'detach', subitemCalls);

		let reloads = 0;
		let selected = 0;
		const armSheet = () => {
			sheet.rendered = true;
			const el = document.createElement('div');
			el.id = sheet.id;
			el.innerHTML = `<li data-strike data-action-index="2"><a data-action="reload"></a><div class="loaded" data-item-id="mag2"><button data-action="select-ammo"></button></div></li>`;
			el.querySelector('[data-action="reload"]').addEventListener('click', () => { reloads += 1; });
			el.querySelector('[data-action="select-ammo"]').addEventListener('click', () => { selected += 1; });
			document.body.append(el);
			return el;
		};
		const sheetEl = armSheet();
		within('Drawn Pistol', '[data-act="reload"]').click();
		await wait(60);
		check('Reload presses the right strike\'s button on the sheet', reloads === 1, reloads);
		within('Drawn Pistol', '[data-act="selectAmmo"]').click();
		await wait(60);
		check('choosing loaded ammunition does too', selected === 1, selected);
		sheetEl.remove();
		sheet.rendered = false;

		const link = within('Bow', 'select[data-pick="ammo"]');
		link.value = 'arrows';
		link.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(60);
		check('a bow links ammunition', last()?.[1]?.system?.selectedAmmoId === 'arrows', last());
		const unlink = within('Bow', 'select[data-pick="ammo"]');
		unlink.value = '';
		unlink.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(60);
		check('and can clear it', last()?.[1]?.system?.selectedAmmoId === null, last());

		/* ---- abilities ---- */
		check('feats with an action cost are listed', row('Nova Feat'));
		check('passive and suppressed feats are not', !row('Passive Feat') && !row('Suppressed Feat'));
		const macro = [];
		game.pf2e.rollItemMacro = async (uuid, event) => macro.push([uuid, event?.type]);
		items.feat1 = actor.itemTypes.feat[0];
		within('Nova Feat', '[data-act="use"]').click();
		await wait(30);
		check('Use goes through the system\'s own route', JSON.stringify(macro.at(-1)) === JSON.stringify(['Actor.asha.Item.feat1', 'click']), macro);

		/* ---- shield ---- */
		check('no shield, no row', !stage().querySelector('.sfh-shield'));
		actor.system.attributes.shield = { itemId: 'sh', name: 'Riot Shield', ac: 2, hardness: 5, hp: { value: 15, max: 20 }, raised: false, broken: false, destroyed: false };
		const raised = [];
		game.pf2e.actions = { raiseAShield: async (o) => raised.push(o.actors[0].id) };
		Projection.render();
		await wait(100);
		const shieldRowEl = () => stage().querySelector('.sfh-shield');
		check('a held shield shows its numbers', /Riot Shield/.test(shieldRowEl().textContent) && /AC \+2/.test(shieldRowEl().textContent) && /Hardness 5/.test(shieldRowEl().textContent));
		await press('[data-act="raiseShield"]');
		check('Raise goes through the system\'s action', raised[0] === actor.id, raised);
		const hpBox = shieldRowEl().querySelector('[data-commit="shieldHp"]');
		hpBox.value = '9';
		hpBox.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(40);
		check('shield hit points are typed', last()?.[1]?.['system.attributes.shield.hp.value'] === 9, last());
		actor.system.attributes.shield.raised = true;
		Projection.render();
		await wait(100);
		check('a raised shield says so', shieldRowEl().querySelector('[data-act="raiseShield"]').textContent === 'Raised');
		delete actor.system.attributes.shield;

		/* ---- speed ---- */
		actor.system.movement = { speeds: { land: { value: 35 } } };
		delete actor.system.attributes.speed;
		Projection.render();
		await wait(100);
		check('speed comes from where the system keeps it', /35 ft/.test(stage().querySelector('[data-slot="defenses"]').textContent), stage().querySelector('[data-slot="defenses"]').textContent);

		/* ---- recovery ---- */
		const recoveries = [];
		actor.rollRecovery = async (e) => recoveries.push(e?.type);
		check('no recovery check when not dying', !stage().querySelector('[data-act="recovery"]'));
		actor.system.attributes.dying = { value: 1, max: 4 };
		Projection.render();
		await wait(100);
		await press('[data-act="recovery"]');
		check('dying offers the recovery check', recoveries[0] === 'click', recoveries);
		const dyingCell = stage().querySelector('[data-act="recovery"]').closest('.cell');
		check('the button fits its box', dyingCell.scrollWidth <= dyingCell.clientWidth + 1, [dyingCell.scrollWidth, dyingCell.clientWidth]);
		actor.system.attributes.dying = { value: 0, max: 4 };
	}

	/* ---- focus points ---- */
	actor.system.resources = { ...(actor.system.resources ?? {}), focus: { value: 1, max: 2 } };
	const focusCalls = [];
	actor.updateResource = async (slug, value) => focusCalls.push([slug, value]);

	/* ---- spells ---- */
	await tab('spellcasting');
	const focusButtons = [...stage().querySelectorAll('[data-act="focus"]')];
	check('a focus entry shows the pool', focusButtons.length === 2 && /1 \/ 2/.test(focusButtons[0].closest('.kv').textContent));
	focusButtons[0].click();
	await wait(30);
	check('spending a focus point goes through the system', JSON.stringify(focusCalls.at(-1)) === JSON.stringify(['focus', 0]), focusCalls);
	focusButtons[1].click();
	await wait(30);
	check('and regaining one', JSON.stringify(focusCalls.at(-1)) === JSON.stringify(['focus', 2]), focusCalls);
	check('a cast prepared spell offers Restore', await press('[data-act="restoreSlot"][data-k="sc3:1:0"]'));
	check('...and restores that slot', JSON.stringify(last()) === JSON.stringify(['setSlotExpendedState', [1, 0, false]]), last());
	check('an uncast prepared spell still offers Cast', stage().querySelector('[data-act="cast"][data-k^="sc3:s2"]'));
	check('Restore is not faded with its row', getComputedStyle(stage().querySelector('[data-act="restoreSlot"]')).opacity === '1');

	check('a rank with spent slots offers Restore', await press('[data-act="restoreSlots"][data-k="sc1:2"]'));
	check('...and refills that rank', last()?.[1]?.['system.slots.slot2.value'] === 2, last());
	check('a full rank does not', !stage().querySelector('[data-act="restoreSlots"][data-k="sc3:1"]'));
	check('a focus pool does not', !stage().querySelector('[data-act="restoreSlots"][data-k^="sc2"]'));

	check('a spent innate spell offers Restore', await press('[data-act="restoreUses"][data-k="s1"]'));
	check('...and refills its uses', last()?.[1]?.['system.location.uses.value'] === 1, last());

	check('only a prepared entry offers Spell Preparation',
		stage().querySelector('[data-act="prepareSpells"][data-k="sc3"]') && !stage().querySelector('[data-act="prepareSpells"][data-k="sc1"]'));
	await press('[data-act="prepareSpells"][data-k="sc3"]');
	await wait(200);
	check('Spell Preparation presses the sheet\'s button', prepared === 1, prepared);
	check('...with the sheet out of sight', sheet.visibleWhileDrawn === 'hidden', sheet.visibleWhileDrawn);
	check('...and puts the sheet away after', !sheet.rendered && !document.getElementById(sheet.id));
	check('...leaving no trace of the veil', ![...document.querySelectorAll('head style')].some((s) => s.textContent.includes(sheet.id)));

	sheet.rendered = true;
	const openEl = document.createElement('div');
	openEl.id = sheet.id;
	openEl.innerHTML = '<li data-item-id="sc3"><button data-action="open-spell-preparation"></button></li>';
	openEl.querySelector('button').addEventListener('click', () => { prepared += 1; });
	document.body.append(openEl);
	await press('[data-act="prepareSpells"][data-k="sc3"]');
	await wait(60);
	check('an open sheet is used and left open', prepared === 2 && sheet.rendered && document.getElementById(sheet.id), prepared);
	openEl.remove();
	sheet.rendered = false;

	const front = [];
	foundry.applications.instances.set('spell-preparation-Actor.asha.Item.sc3', { bringToFront: () => front.push(1) });
	await press('[data-act="prepareSpells"][data-k="sc3"]');
	check('an open window comes to the front instead', front.length === 1 && prepared === 2);
	foundry.applications.instances.clear();

	/* ---- skills ---- */
	await tab('skills');
	const rank = (k) => stage().querySelector(`select[data-pick="rank"][data-k="${k}"]`);
	const choose = async (k, value) => {
		const el = rank(k);
		el.value = String(value);
		el.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(80);
	};
	check('a skill shows its training', rank('acrobatics')?.selectedOptions[0].textContent === 'M', rank('acrobatics')?.value);
	check('every rank is on offer', [...rank('acrobatics').options].map((o) => o.textContent).join('') === 'UTEML');
	await choose('acrobatics', 4);
	check('choosing a rank updates the actor', last()?.[1]?.['system.skills.acrobatics.rank'] === 4, last());
	await choose('acrobatics', 0);
	check('zero is a rank too', last()?.[1]?.['system.skills.acrobatics.rank'] === 0, last());
	await choose('warfare', 2);
	check('a lore updates its own item', last()?.[0] === 'lore.update' && last()[1]['system.proficient.value'] === 2, last());
	check('a lore with no item cannot be changed', rank('orphan')?.disabled);
	const box = rank('acrobatics').getBoundingClientRect();
	check('the picker stays chip-sized', box.width < 40 && box.height < 40, [box.width, box.height]);

	/* ---- quick search ---- */
	{
		const engine = [
			{ name: 'Medi-Gel', uuid: 'Compendium.x.Item.med', img: 'icons/a.webp', level: 1, price: { toString: () => '5 cr' } },
			{ name: 'Medkit <b>', uuid: 'Compendium.x.Item.kit', img: 'icons/b.webp', level: 3, price: { toString: () => '40 cr' } },
		];
		let inits = 0;
		let queries = [];
		game.pf2e.compendiumBrowser.tabs.equipment.init = async () => { inits += 1; };
		game.pf2e.compendiumBrowser.tabs.equipment.searchEngine = {
			search: (q) => { queries.push(q); return q === 'many' ? Array.from({ length: 20 }, (_, i) => ({ ...engine[0], uuid: `u${i}` })) : q.startsWith('med') ? engine : []; },
		};
		foundry.applications.ux = { SearchFilter: { cleanQuery: (t) => t.trim().toLowerCase() } };
		const added = [];
		const sourceItem = (extra = {}) => ({ name: 'Medi-Gel', isMagical: false, isOfType: (...t) => t.includes('physical'), clone: (d) => ({ cloned: true, d }), ...extra });
		let source = sourceItem();
		globalThis.fromUuid = async (u) => { record('fromUuid', u); return u === 'Compendium.x.Item.kit' ? { ...source, sheet: { render: (f) => record('sheet.render', f) } } : source; };
		actor.inventory.add = async (item, options) => { added.push([item, options]); return item; };
		actor.size = 'med';
		const type = async (text) => {
			const box = stage().querySelector('[data-browse]');
			box.value = text;
			box.dispatchEvent(new Event('input', { bubbles: true }));
			await wait(280);
		};
		const results = () => stage().querySelector('.sfh-results');
		await tab('inventory');
		await type('m');
		check('one letter does not search', queries.length === 0 && results().children.length === 0);
		const rapid = stage().querySelector('[data-browse]');
		rapid.value = 'me';
		rapid.dispatchEvent(new Event('input', { bubbles: true }));
		await wait(40);
		await type('medi');
		check('typing waits for a pause', queries.join() === 'medi', queries);
		check('it searches the browser\'s index', inits === 1);
		check('results list what was found', results().querySelectorAll('.qs').length === 2);
		check('with level and price', /Lv 1/.test(results().textContent) && /5 cr/.test(results().textContent), results().textContent);
		check('names are escaped', !results().querySelector('b') && /Medkit <b>/.test(results().textContent));

		await press('[data-act="addItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('Add puts it in the inventory, stacking', added.length === 1 && added[0][0].cloned && added[0][1].stack === true, added[0]);
		check('a medium actor gets it as it is', added[0][0].d === undefined);

		actor.size = 'lg';
		await press('[data-act="addItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('a large actor gets it sized up, non-sensitive', added[1][0].d?.system?.size === 'lg' && added[1][0].d.system.price.sizeSensitive === false, added[1]);
		actor.size = 'sm';
		await press('[data-act="addItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('a small actor uses medium gear', added[2][0].d === undefined, added[2]);
		actor.size = 'med';

		source = sourceItem({ isOfType: (...t) => t.includes('spell') });
		const beforeWrong = added.length;
		await press('[data-act="addItem"][data-k="Compendium.x.Item.med"]');
		await press('[data-act="buyItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('something that is not an item is refused', added.length === beforeWrong);

		// buying: the system takes the coins or refuses, and only then does the item arrive
		const price = { gp: 5 };
		source = sourceItem({ price: { value: price } });
		const paid = [];
		const told = [];
		const notifications = ui.notifications;
		ui.notifications = { info: (m) => told.push(['info', m]), warn: (m) => told.push(['warn', m]), error: notifications.error };
		let canPay = true;
		actor.inventory.removeCoins = async (coins) => { paid.push(coins); return canPay; };
		const beforeBuy = added.length;
		check('each result can be bought', results().querySelectorAll('[data-act="buyItem"]').length === 2);
		await press('[data-act="addItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('Add still costs nothing', paid.length === 0 && added.length === beforeBuy + 1);
		await press('[data-act="buyItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('Buy pays the item\'s price', paid.length === 1 && paid[0] === price, paid);
		check('...and adds it, stacking', added.length === beforeBuy + 2 && added[added.length - 1][1].stack === true);
		check('...and says it was bought', told[told.length - 1]?.[1]?.startsWith('PF2E.CompendiumBrowser.BoughtItemWithCharacter'), told);
		canPay = false;
		await press('[data-act="buyItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('without the money nothing arrives', added.length === beforeBuy + 2 && paid.length === 2);
		check('...and it says so', told[told.length - 1]?.[0] === 'warn' && told[told.length - 1][1].startsWith('PF2E.CompendiumBrowser.FailedToBuyItemWithCharacter'), told);
		ui.notifications = notifications;
		source = sourceItem();

		stage().querySelector('[data-browse]').focus();
		Projection.render();
		await wait(60);
		check('a re-render keeps the search', stage().querySelector('[data-browse]').value === 'medi' && results().querySelectorAll('.qs').length === 2);
		check('and the focus', document.activeElement === stage().querySelector('[data-browse]'));

		await press('[data-act="viewItem"][data-k="Compendium.x.Item.kit"]');
		await wait(40);
		check('a result\'s name opens its sheet', last()?.[0] === 'sheet.render', last());

		await type('nothing here');
		check('no results says so', /Nothing found/.test(results().textContent));
		await type('many');
		check('results stop at a limit', results().querySelectorAll('.qs').length === 12 && /8 more/.test(results().textContent), results().textContent);

		// a slow first search must not overwrite a newer one
		const slow = game.pf2e.compendiumBrowser.tabs.equipment;
		let release;
		slow.init = () => new Promise((r) => { release = r; });
		await type('medi');
		slow.init = async () => {};
		await type('many');
		release();
		await wait(40);
		check('only the newest search shows', results().querySelectorAll('.qs').length === 12);

		stage().querySelector('[data-browse]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await wait(60);
		check('Escape clears it', stage().querySelector('[data-browse]').value === '' && results().children.length === 0);

		const failing = game.pf2e.compendiumBrowser.tabs.equipment;
		failing.init = async () => { throw new Error('no packs'); };
		const quiet = console.error;
		console.error = () => {};
		await type('medi');
		console.error = quiet;
		check('a failed search says so', /could not be run/.test(results().textContent));
		failing.init = async () => {};
		await type('');
	}

	/* ---- inventory ---- */
	for (const item of actor.inventory) items[item.id] = item;
	{
		const gel = actor.inventory.find((i) => i.id === 'i4');
		const used = [];
		gel.system.uses = { value: 2, max: 2 };
		gel.consume = async () => used.push('i4');
		const omni = actor.inventory.find((i) => i.id === 'i5');
		omni.system.uses = { value: 0, max: 1 };
		const ammo = actor.inventory.find((i) => i.id === 'i2');
		const box = { id: 'box', name: 'Ammo Box', type: 'consumable', isAmmo: true, quantity: 1, isEquipped: false, isInvested: null, system: { bulk: { value: 0 }, uses: { value: 5, max: 5 }, usage: { type: 'carried' }, equipped: { carryType: 'worn' } } };
		actor.inventory.push(box);
		items.box = box;
		await tab('inventory');
		const useOn = (id) => stage().querySelector(`[data-act="consume"][data-k="${id}"]`);
		check('a consumable can be used', useOn('i4'));
		useOn('i4').click();
		await wait(40);
		check('Use calls the system\'s consume', used[0] === 'i4', used);
		check('with no uses left it says so', !useOn('i5') && /None/.test([...stage().querySelectorAll('.li')].find((l) => l.textContent.includes('Omni-Gel')).textContent));
		check('ammunition has no Use, weapons neither', !useOn('box') && !useOn(ammo.id));
		actor.inventory.pop();
	}
	actor.changeCarryType = async (item, change) => record('changeCarryType', [item.id, change]);
	actor.toggleInvested = async (id) => record('toggleInvested', id);
	await tab('inventory');
	const carry = (id) => stage().querySelector(`select[data-pick="carry"][data-k="${id}"]`);
	const words = (id) => [...carry(id).options].map((o) => o.textContent).join('|');
	const carryTo = async (id, value) => {
		const el = carry(id);
		el.value = value;
		el.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(80);
	};
	check('armor offers Worn (Armor), as the sheet does', words('i3') === 'Held 1H|Held 2H|Worn (Armor)|Worn|Dropped', words('i3'));
	check('armor on shows as such', carry('i3').selectedOptions[0].textContent === 'Worn (Armor)' && carry('i3').classList.contains('on'));
	check('armor only carried shows as Worn', carry('i6').selectedOptions[0].textContent === 'Worn' && !carry('i6').classList.contains('on'));
	check('a weapon has no slot to wear', words('i2') === 'Held 1H|Held 2H|Worn|Dropped', words('i2'));
	check('a two-handed grip shows', carry('i1').value === 'held-2');
	check('an implant can be implanted', words('i7').includes('Implanted') && carry('i7').value === 'implanted', words('i7'));
	check('a worn item names its slot', words('i8').includes('Worn (Bracers)'), words('i8'));

	await carryTo('i6', 'worn-slot');
	check('Worn (Armor) goes through changeCarryType', JSON.stringify(last()) === JSON.stringify(['changeCarryType', ['i6', { handsHeld: 0, inSlot: true, carryType: 'worn' }]]), last());
	await carryTo('i2', 'held-1');
	check('Held 1H asks for one hand', last()[1][1].carryType === 'held' && last()[1][1].handsHeld === 1 && last()[1][1].inSlot === false, last());
	await carryTo('i2', 'dropped');
	check('Dropped goes through too', last()[1][1].carryType === 'dropped', last());
	const callsBefore = calls.length;
	await carryTo('i3', 'worn-slot');
	check('choosing what it already is does nothing', calls.length === callsBefore);

	check('no Stowed without a container', !words('i2').includes('Stowed'));
	actor.itemTypes.backpack = [{ system: { stowing: true }, isInContainer: false }];
	Projection.render();
	await wait(100);
	check('Stowed with one', words('i2').includes('Stowed'), words('i2'));
	await carryTo('i2', 'stowed');
	check('Stowed asks the system', last()[1][1].carryType === 'stowed', last());
	actor.itemTypes.backpack = [];

	check('only investable items have the gem',
		stage().querySelector('[data-act="invest"][data-k="i8"]') && !stage().querySelector('[data-act="invest"][data-k="i1"]'));
	check('an invested item shows it', stage().querySelector('[data-act="invest"][data-k="i7"]').getAttribute('aria-pressed') === 'true');
	await press('[data-act="invest"][data-k="i8"]');
	check('the gem asks the system', JSON.stringify(last()) === JSON.stringify(['toggleInvested', 'i8']), last());
	check('the old toggle is gone', !stage().querySelector('[data-act="equip"]'));

	/* ---- giving ---- */
	const give = (id) => stage().querySelector(`select[data-pick="give"][data-k="${id}"]`);
	const npc = { id: 'npc', name: 'Harbour Guard', type: 'npc', hasPlayerOwner: false };
	const ghost = { id: 'ghost', name: 'GM Spare', type: 'character', hasPlayerOwner: false };
	const vex = game.actors.get('vex');
	const stash = { id: 'party', name: 'The Party', type: 'party', hasPlayerOwner: false, visible: true };
	const hiddenStash = { id: 'party2', name: 'Secret Party', type: 'party', hasPlayerOwner: false };
	const roster = [actor, vex, npc, ghost, stash, hiddenStash, { id: 'zed', name: 'Aria', type: 'character', hasPlayerOwner: true }];
	const names = (id) => [...give(id).options].map((o) => o.textContent).join();
	Object.defineProperty(game, 'actors', { configurable: true, value: Object.assign(roster, { get: (id) => roster.find((a) => a.id === id) ?? null }) });
	Projection.render();
	await wait(100);
	check('every item can be given', actor.inventory.every((i) => give(i.id)));
	check('a player sees other players and what they can see, sorted', names('i2') === 'Give…,Aria,The Party,Vex Kaori', names('i2'));
	const realUser = Object.getOwnPropertyDescriptor(game, 'user');
	Object.defineProperty(game, 'user', { configurable: true, get: () => ({ character: actor, isGM: true }) });
	Projection.render();
	await wait(100);
	check('a GM sees every other character and stash', names('i2') === 'Give…,Aria,GM Spare,Secret Party,The Party,Vex Kaori', names('i2'));
	const unowned = roster.map((a) => (a === actor ? a : { ...a, hasPlayerOwner: false }));
	Object.defineProperty(game, 'actors', { configurable: true, value: Object.assign(unowned, { get: (id) => unowned.find((a) => a.id === id) ?? null }) });
	Projection.render();
	await wait(100);
	check('a GM alone in a world still has the list', names('i2').includes('Vex Kaori') && !give('i2').disabled, names('i2'));
	Object.defineProperty(game, 'actors', { configurable: true, value: Object.assign(roster, { get: (id) => roster.find((a) => a.id === id) ?? null }) });
	Object.defineProperty(game, 'user', realUser);
	Projection.render();
	await wait(100);
	sheet.moveItemBetweenActors = async (event, item, target) => record('moveItemBetweenActors', [event.type, item.id, target.id]);
	const giveTo = async (id, value) => {
		const el = give(id);
		el.value = value;
		el.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(80);
	};
	const beforeGive = calls.length;
	await giveTo('i2', '');
	check('Give… itself does nothing', calls.length === beforeGive);
	await giveTo('i2', 'vex');
	check('giving is the same call as dragging onto their sheet', JSON.stringify(last()) === JSON.stringify(['moveItemBetweenActors', ['change', 'i2', 'vex']]), last());
	check('the picker resets after', give('i2').value === '', give('i2').value);
	Object.defineProperty(game, 'actors', { configurable: true, value: Object.assign([actor], { get: (id) => (id === actor.id ? actor : null) }) });
	Projection.render();
	await wait(100);
	check('with nobody to give to the picker stays, greyed out', give('i2')?.disabled && give('i2').options.length === 1);
	check('...and says why', /no other character/.test(give('i2').title), give('i2')?.title);

	/* ---- money ---- */
	const coinButtons = (el) => {
		el.innerHTML = '<div class="coinage"><button data-action="add-coins"></button><button data-action="remove-coins"></button></div>';
		for (const b of el.querySelectorAll('button')) b.addEventListener('click', () => record('sheet button', b.dataset.action));
	};
	const originalRender = sheet.render;
	sheet.render = function render() {
		setTimeout(() => {
			const el = document.createElement('div');
			el.id = this.id;
			coinButtons(el);
			document.body.append(el);
			this.rendered = true;
		}, 40);
		return this;
	};
	await press('[data-act="addCoins"]');
	await wait(200);
	check('+ presses the sheet\'s add-coins', JSON.stringify(calls[calls.length - 1]) === JSON.stringify(['sheet button', 'add-coins']), last());
	check('...and leaves no sheet behind', !sheet.rendered && !document.getElementById(sheet.id));
	await press('[data-act="removeCoins"]');
	await wait(200);
	check('− presses the sheet\'s remove-coins', JSON.stringify(calls[calls.length - 1]) === JSON.stringify(['sheet button', 'remove-coins']), last());
	sheet.render = originalRender;
	const sameRight = [...stage().querySelectorAll('select[data-pick="carry"]')].map((s) => Math.round(s.getBoundingClientRect().right));
	check('the pickers line up', new Set(sameRight).size === 1, sameRight);

	const search = () => stage().querySelector('[data-browse]');
	await press('[data-act="browseEquipment"]');
	check('Browse opens the equipment tab', last()?.[0] === 'browser.open' && last()[1].filter === filter, last());
	check('...clearing any old search', filter.search.text === '', filter.search.text);
	search().value = '  medi-gel ';
	await press('[data-act="browseEquipment"]');
	check('Browse searches for what was typed', filter.search.text === 'medi-gel', filter.search.text);
	calls.length = 0;
	search().value = 'armor';
	search().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
	await wait(60);
	check('Enter does the same', last()?.[0] === 'browser.open' && filter.search.text === 'armor', filter.search.text);

	hud.setPower(false, { silent: true });
	return out;
});
await browser.close();

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
