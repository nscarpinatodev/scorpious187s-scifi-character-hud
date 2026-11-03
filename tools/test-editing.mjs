/*
 * Edit the character from the real projection, as play does: experience and level typed like hit
 * points; right-click for more than one number (hit points, experience, hero points) and for a
 * thing the character has, its name and quantity; and pick up a thing by its name, to drop it in a
 * container, on another sheet or on the macro bar, with the drag data the system's own sheet gives.
 * Also what the review against PF2e's sheet asked for alongside: immunities, weaknesses and
 * resistances in the defenses, and each strike's damage formula on its buttons.
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
	const { DeviceChrome: hud, actor, store } = SFH;
	store.sequences = false;

	// what the system would be asked to change
	const calls = [];
	actor.update = async (d) => { calls.push(['actor.update', d]); };
	const owned = new Map(actor.inventory.map((i) => [i.id, Object.assign(i, {
		isOwner: true,
		system: { ...i.system, quantity: i.quantity },
		update: async (d) => { calls.push(['item.update', i.id, d]); },
		toDragData: () => ({ type: 'Item', uuid: `Actor.asha.Item.${i.id}` }),
	})]));
	actor.items.get = (id) => owned.get(id) ?? null;
	const root = () => document.getElementById('sfh-projection');
	const typeIn = async (input, value) => {
		input.focus();
		input.value = String(value);
		input.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(60);
	};
	const rightClick = (el) => el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }));

	await game.settings.set(null, 'device', 'omni');
	await wait(200);
	hud.toggle();
	await wait(700);

	// experience and level, typed
	const xp = root().querySelector('[data-commit="xp"]');
	check('experience is typed', xp && xp.value === '640', xp?.value);
	await typeIn(xp, 820);
	check('typing it sets the experience', calls.some(([k, d]) => k === 'actor.update' && d['system.details.xp.value'] === 820), calls);
	const lvl = root().querySelector('[data-commit="level"]');
	check('the level is typed in PF2e', lvl && lvl.value === '6', lvl?.value);
	calls.length = 0;
	await typeIn(lvl, 7);
	check('typing it sets the level', calls.some(([, d]) => d?.['system.details.level.value'] === 7), calls);
	calls.length = 0;
	await typeIn(lvl, 0);
	check('a level below 1 is held to 1', calls.some(([, d]) => d?.['system.details.level.value'] === 1), calls);

	// right-click: experience with the level
	rightClick(root().querySelector('.sfh-xp'));
	let menu = root().querySelector('.sfh-menu');
	check('right-clicking experience opens its editor', menu && menu.querySelectorAll('input').length === 2, menu?.innerHTML);
	check('with experience and level in it', menu?.querySelector('[data-commit="xp"]') && menu?.querySelector('[data-commit="level"]'));
	check('its words come from the language file', menu?.textContent.includes('Experience') && !menu?.textContent.includes('SFH.'), menu?.textContent);
	menu?.remove();

	// right-click: hero points
	const hero = root().querySelector('[data-menu="hero"]');
	check('hero points have an editor', hero);
	rightClick(hero.querySelector('.seg'));
	menu = root().querySelector('.sfh-menu');
	const heroIn = menu?.querySelector('[data-commit="hero"]');
	check('right-clicking hero points opens it', heroIn && heroIn.value === '2', menu?.innerHTML);
	calls.length = 0;
	await typeIn(heroIn, 5);
	check('more than the most is held to the most', calls.some(([, d]) => d?.['system.resources.heroPoints.value'] === 3), calls);
	root().querySelector('.sfh-menu')?.remove();

	// right-click: hit points, as before
	rightClick(root().querySelector('[data-menu="hp"]'));
	menu = root().querySelector('.sfh-menu');
	check('hit points still open their editor', menu?.querySelectorAll('input').length === 3);
	menu?.remove();

	// a thing the character has: its name and quantity
	SFH.Projection.show?.('inventory');
	root().querySelector('[data-act="tab"][data-k="inventory"], .navb[data-k="inventory"]')?.click();
	await wait(400);
	const gel = root().querySelector('[data-ro="item:i4"]');
	check('the inventory shows the item', gel, root().querySelector('.proj-b')?.textContent.slice(0, 200));
	check('its name can be picked up', gel?.getAttribute('draggable') === 'true');
	rightClick(gel);
	menu = root().querySelector('.sfh-menu');
	const name = menu?.querySelector('[data-item-field="name"]');
	const qty = menu?.querySelector('[data-item-field="system.quantity"]');
	check('right-clicking it opens its name and quantity', name?.value === 'Medi-Gel' && qty?.value === '4', menu?.innerHTML);
	calls.length = 0;
	await typeIn(name, '  Medi-Gel (Field)  ');
	check('typing a name renames it, trimmed', calls.some(([k, id, d]) => k === 'item.update' && id === 'i4' && d.name === 'Medi-Gel (Field)'), calls);
	calls.length = 0;
	await typeIn(qty, 9);
	check('typing a quantity sets it', calls.some(([k, id, d]) => k === 'item.update' && id === 'i4' && d['system.quantity'] === 9), calls);
	calls.length = 0;
	await typeIn(name, '   ');
	check('a blank name is not saved', !calls.length, calls);
	root().querySelector('.sfh-menu')?.remove();

	// picked up by its name: found again, as typing above redrew the rows
	await wait(200);
	const data = new DataTransfer();
	const drag = new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data });
	root().querySelector('[data-ro="item:i4"]').dispatchEvent(drag);
	check('dragging it carries the sheet\'s drag data', data.getData('text/plain') === JSON.stringify({ type: 'Item', uuid: 'Actor.asha.Item.i4' }), data.getData('text/plain'));
	check('and is not refused', !drag.defaultPrevented);
	// a name that is not one of the character's things cannot be picked up
	const skill = root().querySelector('[data-ro^="skill:"]');
	check('a skill\'s name is not draggable', !skill || skill.getAttribute('draggable') !== 'true');

	// immunities, weaknesses and resistances, in the defenses panel
	actor.attributes = { immunities: [{ label: 'Poison' }], weaknesses: [{ label: 'Cold 5' }], resistances: [{ label: 'Fire 5' }, { label: 'Electricity 5' }] };
	// a strike's damage, worked out as the system does it: asynchronously
	const strike = actor.system.actions[0];
	strike.damage = async ({ getFormula } = {}) => (getFormula ? '<span>2d8+4 piercing</span>' : calls.push(['damage']));
	strike.critical = async ({ getFormula } = {}) => (getFormula ? '4d8+8 piercing' : calls.push(['critical']));
	root().querySelector('.navb[data-k="actions"], [data-act="tab"][data-k="actions"]')?.click();
	await wait(600);
	const defenses = root().querySelector('[data-slot="defenses"]');
	const lines = [...defenses.querySelectorAll('.sfh-iwr')].map((el) => el.textContent.replace(/\s+/g, ' ').trim());
	check('immunities, weaknesses and resistances are in the defenses', lines.length === 3, lines);
	check('each with what the system calls them', lines.join('|') === 'Immune Poison|Weak Cold 5|Resist Fire 5, Electricity 5', lines);
	const damage = root().querySelector('[data-act="strikeDamage"][data-k="0"]');
	const critical = root().querySelector('[data-act="critical"][data-k="0"]');
	check("a strike's Damage button shows its formula", damage?.textContent.replace(/\s+/g, ' ').trim() === 'Damage 2d8+4 piercing', damage?.textContent);
	check('and its Critical button the critical one', critical?.textContent.replace(/\s+/g, ' ').trim() === 'Critical 4d8+8 piercing', critical?.textContent);
	check("without the formula's markup", !damage?.innerHTML.includes('<span>2d8'), damage?.innerHTML);
	calls.length = 0;
	damage?.click();
	await wait(100);
	check('the button still rolls the damage', calls.some(([k]) => k === 'damage'), calls);
	delete actor.attributes;

	// not one's own character: no editors
	actor.isOwner = false;
	rightClick(root().querySelector('.sfh-xp') ?? root().querySelector('[data-menu="hp"]'));
	check('someone else\'s character opens no editor', !root().querySelector('.sfh-menu'));
	actor.isOwner = true;
	hud.setPower(false, { silent: true });
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
