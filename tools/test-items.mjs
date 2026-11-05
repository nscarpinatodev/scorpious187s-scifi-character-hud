/*
 * PF2e and SF2e, on the real projection.
 *
 * A skill in the readout: its modifier, the character's training, its attribute and each bonus
 * and penalty in it, as the sheet's breakdown; a button for each of the system's actions that use
 * it (one for each way of doing it, where there are several), which takes that action through the
 * system; and their rules text.
 *
 * Making a blank item: the Inventory tab offers the kinds the system has, makes one named as
 * Foundry names a new one, and opens its sheet. Deleting one: its right-click editor has Delete,
 * behind Foundry's own are-you-sure.
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
	const { DeviceChrome: hud, Projection, store, actor } = SFH;
	store.sequences = false;
	const calls = [];
	const q = (sel) => document.querySelector(`#sfh-projection ${sel}`);
	const qa = (sel) => [...document.querySelectorAll(`#sfh-projection ${sel}`)];
	const text = (el) => el?.textContent.replace(/\s+/g, ' ').trim() ?? '';
	const tab = async (id) => { q(`[data-act="tab"][data-k="${id}"]`).click(); await wait(200); };

	/* ---- the system: its skill actions, the words they use, and a skill's breakdown ---- */
	const words = {
		'PF2E.Actions.Balance.Title': 'Balance', 'PF2E.Actions.Balance.Description': '<p>You move across a narrow surface.</p>',
		'PF2E.Actions.TumbleThrough.Title': 'Tumble Through', 'PF2E.Actions.TumbleThrough.Description': '<p>You Stride into an enemy\'s space.</p>',
		'PF2E.Actions.Maneuver.Title': 'Maneuver in Flight', 'PF2E.Actions.Maneuver.Description': '<p>You try a difficult maneuver while flying.</p>',
		'PF2E.Actions.Maneuver.Dive': 'Dive', 'PF2E.Actions.Maneuver.Roll': 'Barrel Roll',
		'PF2E.Actions.Grapple.Title': 'Grapple', 'PF2E.Actions.Grapple.Description': '<p>You grab.</p>',
		'PF2E.AbilityDex': 'Dexterity', 'PF2E.ProficiencyLevel3': 'Master', 'PF2E.MasterworkItemBonus': 'Item bonus',
	};
	const localize = game.i18n.localize;
	game.i18n.localize = (k) => words[k] ?? localize(k);
	const variants = (...list) => new Map(list.map((v) => [v.slug, v]));
	const action = (slug, statistic, cost, extra = {}) => ({
		slug, statistic, cost, name: `PF2E.Actions.${extra.key}.Title`, description: `PF2E.Actions.${extra.key}.Description`,
		variants: extra.variants ?? new Map(), use: async (options) => calls.push(['use', slug, options]),
	});
	game.pf2e = { actions: new Map([
		['balance', action('balance', 'acrobatics', 1, { key: 'Balance' })],
		['tumble-through', action('tumble-through', 'acrobatics', 1, { key: 'TumbleThrough' })],
		['maneuver-in-flight', action('maneuver-in-flight', ['acrobatics'], 1, { key: 'Maneuver', variants: variants({ slug: 'dive', name: 'PF2E.Actions.Maneuver.Dive' }, { slug: 'roll', name: 'PF2E.Actions.Maneuver.Roll' }) })],
		['grapple', action('grapple', 'athletics', 1, { key: 'Grapple' })],
	]) };
	CONFIG.PF2E.abilities = { dex: 'PF2E.AbilityDex' };
	Object.assign(actor.skills.acrobatics, {
		attribute: 'dex',
		check: { modifiers: [
			{ slug: 'dex', label: 'Dexterity', modifier: 4, enabled: true },
			{ slug: 'proficiency', label: 'Master', modifier: 8, enabled: true },
			{ slug: 'item', label: 'PF2E.MasterworkItemBonus', modifier: 2, enabled: true },
			{ slug: 'off', label: 'Switched off', modifier: -2, enabled: false },
		] },
	});

	await game.settings.set(null, 'device', 'omni');
	await wait(200);
	hud.setPower(true, { silent: true });
	await wait(500);

	/* ---- a skill in the readout ---- */
	await tab('skills');
	const readout = () => q('#sfh-readout');
	q('.proj-b [data-act="read"][data-k="skill:acrobatics"]').click();
	await wait(250);
	check('a skill shows in the readout by its name', text(readout().querySelector('h3')) === 'Acrobatics', text(readout()).slice(0, 80));
	const meta = Object.fromEntries([...readout().querySelectorAll('dl.meta dt')].map((dt) => [dt.textContent, dt.nextElementSibling.textContent]));
	check('with its modifier, training and attribute', meta.Modifier === '+14' && meta.Training === 'Master' && meta.Attribute === 'Dexterity', meta);
	check('and each bonus that makes it up, as the sheet breaks it down', meta.Dexterity === '+4' && meta.Master === '+8' && meta['Item bonus'] === '+2' && !('Switched off' in meta), meta);
	const buttons = [...readout().querySelectorAll('[data-act="skillAction"]')].map((b) => [b.dataset.k, text(b)]);
	check("a button for each of the system's actions that use it", buttons.map(([k]) => k).join() === 'balance,tumble-through,maneuver-in-flight:dive,maneuver-in-flight:roll', buttons);
	check('one for each way of doing an action that has several', buttons[2][1] === 'Maneuver in Flight: Dive' && buttons[3][1] === 'Maneuver in Flight: Barrel Roll', buttons);
	check("and none for another skill's", !buttons.some(([k]) => k === 'grapple'));
	check('a roll of the skill itself there too', !!readout().querySelector('[data-act="skill"][data-k="acrobatics"]'));
	check("the actions' rules text under them", /narrow surface/.test(text(readout())) && /enemy's space/.test(text(readout())) && readout().querySelectorAll('.ro-text h4').length === 3, text(readout()).slice(0, 200));
	readout().querySelector('[data-act="skillAction"][data-k="balance"]').click();
	await wait(60);
	check('an action is taken through the system, by this character', calls.at(-1)?.[1] === 'balance' && calls.at(-1)[2].actors?.[0] === actor && !('variant' in calls.at(-1)[2]), calls.at(-1)?.[2] && Object.keys(calls.at(-1)[2]));
	readout().querySelector('[data-act="skillAction"][data-k="maneuver-in-flight:roll"]').click();
	await wait(60);
	check('and a way of doing one is taken as that way', calls.at(-1)?.[1] === 'maneuver-in-flight' && calls.at(-1)[2].variant === 'roll', calls.at(-1)?.[2]?.variant);
	q('.proj-b [data-act="read"][data-k="skill:medicine"]').click();
	await wait(250);
	check('a skill no action uses still shows its numbers', text(readout().querySelector('h3')) === 'Medicine' && !readout().querySelector('[data-act="skillAction"]') && /Modifier/.test(text(readout())));

	/* ---- making a blank item ---- */
	game.documentTypes = { Item: ['weapon', 'armor', 'equipment', 'consumable', 'ammo', 'treasure', 'backpack', 'feat', 'spell'] };
	const made = [];
	actor.createEmbeddedDocuments = async (type, data) => { made.push([type, data]); return [{ id: 'new1', name: data[0].name, sheet: { render: (force) => calls.push(['sheet', force]) } }]; };
	CONFIG.Item = { documentClass: { defaultName: ({ type }) => `New ${type[0].toUpperCase()}${type.slice(1)}` } };
	await tab('inventory');
	const picker = () => q('.proj-b select[data-pick="create"]');
	const kinds = [...(picker()?.options ?? [])].map((o) => o.value).filter(Boolean);
	check('the Inventory tab offers a blank item of each kind the system has', kinds.join() === 'weapon,armor,equipment,consumable,ammo,treasure,backpack', kinds);
	check('beside the quick search', picker()?.closest('.sfh-browse') === q('.proj-b .sfh-browse'));
	picker().value = 'weapon';
	picker().dispatchEvent(new Event('change', { bubbles: true }));
	await wait(120);
	check('choosing one makes it on the character, named as Foundry names a new one', made.length === 1 && made[0][0] === 'Item' && made[0][1][0].type === 'weapon' && made[0][1][0].name === 'New Weapon', made);
	check('and opens it on its sheet to be filled in', JSON.stringify(calls.at(-1)) === '["sheet",true]', calls.at(-1));
	check('and the picker is ready for the next', picker().value === '');
	game.documentTypes = { Item: ['weapon', 'feat'] };
	await tab('effects');
	await tab('inventory');
	check('a kind the system does not have is never offered', [...picker().options].map((o) => o.value).filter(Boolean).join() === 'weapon');
	actor.isOwner = false;
	picker().value = 'weapon';
	picker().dispatchEvent(new Event('change', { bubbles: true }));
	await wait(80);
	check('someone who cannot change the character makes nothing', made.length === 1);
	actor.isOwner = true;

	/* ---- deleting one ---- */
	const effect = actor.itemTypes.effect[0];
	effect.isOwner = true;
	effect.deleteDialog = async () => calls.push(['deleteDialog', effect.id]);
	await tab('effects');
	const name = q('.proj-b [data-ro="item:e1"][draggable="true"]');
	const r = name.getBoundingClientRect();
	name.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 3, clientY: r.top + 3 }));
	await wait(60);
	const del = q('.sfh-menu [data-act="menu-delete"]');
	check("a thing's right-click editor has Delete", !!del && /Delete/.test(del.textContent));
	del.click();
	await wait(80);
	check("which asks Foundry's are-you-sure before anything goes", JSON.stringify(calls.at(-1)) === '["deleteDialog","e1"]', calls.at(-1));
	check('and the editor closes', !q('.sfh-menu'));
	q('[data-menu="hp"] input[data-commit="hp"]').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
	await wait(60);
	check('hit points have no Delete', !!q('.sfh-menu') && !q('.sfh-menu [data-act="menu-delete"]'));
	document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
	hud.setPower(false, { silent: true });
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
