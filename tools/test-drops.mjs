/*
 * Drag things onto the real projection and check it hands each drop to the character's own
 * sheet, as dropping on that sheet would: the same event, while the sheet is closed, shown the
 * projection's tab, in either kind of sheet. A text field keeps its own drops, and only someone
 * who may change the character can drop on it. With an output folder as the argument, it also
 * shoots the projection mid-drag.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// puppeteer lives in the sibling conversion repo; this tool is dev-only
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const dir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');
const shots = process.argv[2];

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
	const { DeviceChrome: hud, actor } = SFH;
	const words = await (await fetch('../lang/en.json')).json();
	game.i18n.format = (k, data) => (words[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => data?.[n] ?? '');
	const failures = [];
	ui.notifications = { error: (m) => failures.push(m), warn: () => {}, info: () => {} };

	// a PF2e sheet is the older kind: its tabs are a list of Tabs, the first the main one
	const drops = [];
	const overs = [];
	const pf2eSheet = {
		rendered: false,
		_tabs: [{ active: 'character' }],
		_onDragOver(event) { overs.push(event.type); event.dataTransfer.dropEffect = 'move'; },
		async _onDrop(event) {
			drops.push({ event, tab: this._tabs[0].active, data: JSON.parse(event.dataTransfer.getData('text/plain')) });
		},
	};
	actor.sheet = pf2eSheet;

	hud.setPower(true, { silent: true });
	await wait(300);
	const el = () => document.getElementById('sfh-projection');
	const board = () => el().querySelector('.sfh-board');
	const tab = async (id) => { el().querySelector(`[data-act="tab"][data-k="${id}"]`).click(); await wait(120); };
	const drag = (type, target, data = { type: 'Item', uuid: 'Compendium.pf2e.equipment-srd.Item.rope' }, types = 'text/plain') => {
		const dataTransfer = new DataTransfer();
		if (types) dataTransfer.setData(types, typeof data === 'string' ? data : JSON.stringify(data));
		const event = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer });
		target.dispatchEvent(event);
		return event;
	};
	const somewhere = () => el().querySelector('[data-slot="projection"]');

	/* ---- over it ---- */
	await tab('inventory');
	let over = drag('dragover', somewhere());
	check('a drag over it is taken', over.defaultPrevented);
	// a made-up drag's dropEffect cannot be set, so this sees the sheet asked, not its answer
	check('the sheet judges it, copy or move', overs.at(-1) === 'dragover');
	check('the board says whose it will be', board().dataset.drop === `Drop to add to ${actor.name}`, board().dataset.drop);
	const ring = getComputedStyle(board(), '::before');
	check('and is ringed in the device\'s color', ring.borderTopStyle === 'dashed' && ring.content !== 'none', [ring.borderTopStyle, ring.content]);
	check('its label shows', getComputedStyle(board(), '::after').content.includes(actor.name), getComputedStyle(board(), '::after').content);
	somewhere().dispatchEvent(new DragEvent('dragleave', { bubbles: true, relatedTarget: board() }));
	check('crossing from panel to panel keeps the ring', !!board().dataset.drop);
	board().dispatchEvent(new DragEvent('dragleave', { bubbles: true, relatedTarget: document.body }));
	check('leaving it takes the ring away', !board().dataset.drop);
	drag('dragover', somewhere());
	document.dispatchEvent(new DragEvent('dragend'));
	check('so does the drag ending anywhere', !board().dataset.drop);

	/* ---- the drop ---- */
	const dropped = drag('drop', somewhere());
	await wait(30);
	check('the drop goes to the character\'s sheet', drops.length === 1 && drops[0].event === dropped && drops[0].data.uuid === 'Compendium.pf2e.equipment-srd.Item.rope', drops.length);
	check('as a drop the browser will not open as a link', dropped.defaultPrevented);
	check('the closed sheet is on the projection\'s tab while it decides', drops[0].tab === 'inventory', drops[0].tab);
	check('and back on its own after', pf2eSheet._tabs[0].active === 'character', pf2eSheet._tabs[0].active);
	check('the ring is gone', !board().dataset.drop);

	await tab('spellcasting');
	drag('drop', somewhere(), { type: 'Item', uuid: 'Compendium.pf2e.spells-srd.Item.heal' });
	await wait(30);
	check('a spell on the Spells tab is offered as a spell', drops.at(-1).tab === 'spellcasting');
	drag('drop', somewhere(), { type: 'ActiveEffect', uuid: 'Item.x.ActiveEffect.y' });
	drag('drop', somewhere(), { type: 'PersistentDamage', formula: '1d6[fire]' });
	drag('drop', somewhere(), { type: 'Folder', uuid: 'Folder.f' });
	await wait(30);
	check('effects, damage and folders go the same way', drops.slice(-3).map((d) => d.data.type).join() === 'ActiveEffect,PersistentDamage,Folder', drops.slice(-3).map((d) => d.data.type));
	check('drops on top of each other still give the sheet its own tab back', pf2eSheet._tabs[0].active === 'character', pf2eSheet._tabs[0].active);

	/* ---- an open sheet keeps its own tab ---- */
	pf2eSheet.rendered = true;
	drag('drop', somewhere());
	await wait(30);
	check('an open sheet is left on the tab it shows', drops.at(-1).tab === 'character' && pf2eSheet._tabs[0].active === 'character', drops.at(-1).tab);
	pf2eSheet.rendered = false;

	/* ---- the newer kind of sheet ---- */
	const seen = [];
	const v2 = { rendered: false, tabGroups: { primary: 'details' }, async _onDrop() { seen.push(this.tabGroups.primary); } };
	actor.sheet = v2;
	await tab('inventory');
	drag('drop', somewhere());
	await wait(30);
	check('an ApplicationV2 sheet is lent the tab too', seen.at(-1) === 'inventory' && v2.tabGroups.primary === 'details', [seen.at(-1), v2.tabGroups.primary]);
	actor.sheet = pf2eSheet;

	/* ---- what it leaves alone ---- */
	const count = drops.length;
	await tab('biography');
	const field = el().querySelector('textarea, input[type="text"], prose-mirror');
	if (field) {
		over = drag('dragover', field);
		check('a text field takes its own drops', !over.defaultPrevented && !board().dataset.drop);
		drag('drop', field);
		await wait(30);
		check('and they never reach the sheet', drops.length === count);
	} else check('the biography has a field to drop text in', false);
	await tab('inventory');
	over = drag('dragover', somewhere(), 'plain words', 'text/uri-list');
	check('something that is not Foundry\'s is left alone', !over.defaultPrevented);
	actor.isOwner = false;
	over = drag('dragover', somewhere());
	check('someone who cannot change the character cannot drop on it', !over.defaultPrevented && !board().dataset.drop);
	drag('drop', somewhere());
	await wait(30);
	check('and nothing reaches the sheet', drops.length === count);
	actor.isOwner = true;

	/* ---- a drop the sheet throws on ---- */
	actor.sheet = { rendered: false, _tabs: [{ active: 'character' }], async _onDrop() { throw new Error('bad drop'); } };
	drag('drop', somewhere());
	await wait(30);
	check('a failed drop says so', failures.length === 1, failures);
	check('and still gives the sheet its tab back', actor.sheet._tabs[0].active === 'character');
	actor.sheet = pf2eSheet;

	/* ---- PF2e's containers ---- */
	{
		const before = actor.inventory;
		const updates = [];
		const contents = (...items) => Object.assign(items, { size: items.length });
		const thing = (id, name, type, extra = {}) => ({
			id, name, type, quantity: 1, sort: 0, isEquipped: false, isInvested: null, isInContainer: false,
			system: { bulk: { value: 'L' }, usage: { type: 'carried' }, equipped: { carryType: 'worn' } },
			update: async (d) => updates.push([id, d]), ...extra,
		});
		const rope = thing('rope', 'Grapple Line', 'equipment', { isInContainer: true, system: { bulk: { value: 'L' }, usage: { type: 'carried' }, equipped: { carryType: 'stowed' } } });
		const gel = thing('gel', 'Medi-Gel Pack', 'consumable', { isInContainer: true, sort: 2 });
		const pouch = thing('pouch', 'Belt Pouch', 'backpack', { isInContainer: true, sort: 1, contents: contents(gel), capacity: { value: 'L', max: '1' }, percentFull: 10, isCollapsed: false, system: { collapsed: false, bulk: { value: 0 }, usage: { type: 'worn' }, equipped: { carryType: 'stowed' } } });
		const pack = thing('pack', 'Field Pack', 'backpack', { contents: contents(rope, pouch), capacity: { value: '5', max: '4' }, percentFull: 125, isCollapsed: false, system: { collapsed: false, bulk: { value: 1 }, usage: { type: 'worn' }, equipped: { carryType: 'worn' } } });
		const empty = thing('crate', 'Empty Crate', 'backpack', { contents: contents(), capacity: { value: '0', max: '8' }, percentFull: 0, isCollapsed: false, system: { collapsed: false, bulk: { value: 2 }, usage: { type: 'worn' }, equipped: { carryType: 'worn' } } });
		const shield = thing('shield', 'Kinetic Barrier', 'shield');
		const inventory = Object.assign([...before, rope, gel, pouch, pack, empty, shield], { invested: before.invested, bulk: before.bulk, coins: before.coins });
		actor.inventory = inventory;
		const realGet = actor.items.get;
		actor.items.get = (id) => inventory.find((i) => i.id === id) ?? realGet?.(id);
		await tab('character');
		await tab('inventory');
		const body = () => el().querySelector('[data-slot="projection"]');
		const row = (name) => [...body().querySelectorAll('.li')].find((l) => l.querySelector('.grow')?.textContent.includes(name));
		const heads = [...body().querySelectorAll('.sec')].map((s) => s.textContent.trim());
		check('the sections are the sheet\'s, in its order, in its words', heads.join() === 'Weapons & Shields,Armor,Equipment,Consumables,Containers', heads);
		check('a shield is with the weapons', row('Kinetic Barrier') && [...body().querySelectorAll('.sec')][0].compareDocumentPosition(row('Kinetic Barrier')) === Node.DOCUMENT_POSITION_FOLLOWING);
		check('what is in a container is not in its own section', [...body().querySelectorAll('.li')].filter((l) => l.textContent.includes('Grapple Line')).length === 1);
		const box = body().querySelector('li[data-is-container][data-item-id="pack"]');
		check('a container is a list item marked as the sheet marks it', !!box && box.contains(row('Field Pack')));
		check('with what it holds inside it, one step in', box?.contains(row('Grapple Line')) && row('Grapple Line').style.getPropertyValue('--depth') === '1');
		check('a container in a container nests again', box?.querySelector('li[data-is-container][data-item-id="pouch"]')?.contains(row('Medi-Gel Pack')) && row('Medi-Gel Pack').style.getPropertyValue('--depth') === '2', [!!box?.querySelector('li[data-item-id="pouch"]'), row('Medi-Gel Pack')?.outerHTML.slice(0, 120)]);
		check('in the sheet\'s order', row('Grapple Line').compareDocumentPosition(row('Belt Pouch')) === Node.DOCUMENT_POSITION_FOLLOWING);
		check('its capacity shows', /5 \/ 4/.test(row('Field Pack').textContent) && /0 \/ 8/.test(row('Empty Crate').textContent));
		check('and an overfull one says so', row('Field Pack').querySelector('.sfh-cap').style.color.includes('--bad'));
		check('a container with things in it keeps its quantity, as on the sheet', !row('Field Pack').querySelector('[data-act="qty"]') && !!row('Empty Crate').querySelector('[data-act="qty"]'));
		check('it does not look like a bulleted list', getComputedStyle(box).listStyleType === 'none' && getComputedStyle(box).display === 'block');

		// the sheet's own two lookups: a new item (_handleDroppedItem) and one from another character (moveItemBetweenActors)
		const into = [];
		actor.sheet = { rendered: false, _tabs: [{ active: 'character' }], async _onDrop(event) {
			into.push([event.target.closest('li[data-is-container]')?.dataset.itemId ?? null, event.target.closest('[data-is-container]')?.dataset.itemId?.trim() ?? null]);
		} };
		const on = (name) => row(name).querySelector('.grow');
		for (const [where, expected] of [['Field Pack', 'pack'], ['Grapple Line', 'pack'], ['Belt Pouch', 'pouch'], ['Medi-Gel Pack', 'pouch'], ['M-23 Eviscerator', null]]) {
			drag('drop', on(where));
			await wait(20);
			check(`dropped on ${where}, the sheet puts it ${expected ? `in ${expected}` : 'loose'}`, into.at(-1)?.[0] === expected && into.at(-1)?.[1] === expected, into.at(-1));
		}
		drag('dragover', on('Grapple Line'));
		check('the container lights up over anything in it', box.classList.contains('sfh-drop-target') && !row('Grapple Line').classList.contains('sfh-drop-target'));
		drag('dragover', on('Medi-Gel Pack'));
		check('the innermost one, when they nest', body().querySelector('[data-item-id="pouch"]').classList.contains('sfh-drop-target') && !box.classList.contains('sfh-drop-target'));
		document.dispatchEvent(new DragEvent('dragend'));

		// the sheet's box icon
		row('Field Pack').querySelector('[data-act="toggleContainer"]').click();
		await wait(40);
		check('the box icon closes it, as the sheet\'s does', JSON.stringify(updates.at(-1)) === JSON.stringify(['pack', { 'system.collapsed': true }]), updates.at(-1));
		pack.isCollapsed = true;
		pack.system.collapsed = true;
		await tab('character');
		await tab('inventory');
		check('closed, what is in it is hidden', !row('Grapple Line') && !!row('Field Pack') && row('Field Pack').querySelector('[data-act="toggleContainer"]').getAttribute('aria-expanded') === 'false');
		drag('drop', on('Field Pack'));
		await wait(20);
		check('and a drop on it still goes in', into.at(-1)?.[0] === 'pack');
		pack.isCollapsed = false;
		pack.system.collapsed = false;
		await tab('character');
		await tab('inventory');

		// left mid-drag over a container for the picture
		actor.sheet = pf2eSheet;
		// only the panel's own list scrolls, as a player would scroll it; scrollIntoView would move the board too
		let list = row('Field Pack').parentElement;
		while (list && !/auto|scroll/.test(getComputedStyle(list).overflowY)) list = list.parentElement;
		if (list) list.scrollTop += row('Field Pack').getBoundingClientRect().top - list.getBoundingClientRect().top - 60;
		drag('dragover', on('Grapple Line'));
	}
	return out;
});

if (shots) await page.screenshot({ path: `${shots}/drop.png` });
await browser.close();

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
