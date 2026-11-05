/*
 * PF2e and SF2e, from the review against the system's sheet, on the real projection.
 *
 * The Character tab names size and languages as the sheet does, and adds every speed, the senses
 * and the reach. Initiative is rolled with the statistic the character chose, which is picked
 * there, and the Initiative box shows that statistic's modifier. The roll options feats and
 * effects let a character switch are buttons, on the Actions tab or, for spellcasting's, on the
 * Spells tab, with their choices; each goes through the system's toggleRollOption. An effect with
 * a counter is raised and lowered from its chip. Stamina and Resolve (with the variant on) and the
 * special resources sit beside hit points, typed. A loaded magazine's rounds are typed.
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
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, Projection, store, actor } = SFH;
	const q = (sel) => document.querySelector(`#sfh-projection ${sel}`);
	const qa = (sel) => [...document.querySelectorAll(`#sfh-projection ${sel}`)];
	const text = (el) => el?.textContent.replace(/\s+/g, ' ').trim() ?? '';
	store.sequences = false;
	const wear = async (id) => {
		if (hud.power) hud.setPower(false, { silent: true });
		await game.settings.set(null, 'device', id);
		await wait(250);
		hud.setPower(true, { silent: true });
		await wait(400);
	};
	const tab = async (id) => { q(`[data-act="tab"][data-k="${id}"]`).click(); await wait(150); };
	const redraw = async () => { Projection.render(); await wait(150); };
	// a press the system answers with an update, which redraws the projection in Foundry
	const press = async (button) => { button.click(); await wait(100); await redraw(); };
	// a typed field, as a person types it: the value, then leaving the field
	const type = async (input, value) => {
		input.value = String(value);
		input.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(150);
	};
	const pick = async (select, value) => {
		select.value = value;
		select.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(150);
	};
	await wear('omni');

	/* ---- names, speeds, senses, reach ---- */
	await tab('character');
	const kv = (label) => qa('.proj-b .kv').find((k) => k.querySelector('.lbl')?.textContent === label);
	check('size by its name, not its slug', text(kv('Size')?.querySelector('b')) === 'Medium', text(kv('Size')));
	check('languages by their names', text(kv('Languages')?.querySelector('b')) === 'Common, Thessian', text(kv('Languages')));
	check('every speed the character has, land first', text(kv('Speeds')?.querySelector('b')) === 'Land 25 ft · Swim 15 ft', text(kv('Speeds')));
	check('the senses', text(kv('Senses')?.querySelector('b')) === 'Low-Light Vision', text(kv('Senses')));
	check('the reach', text(kv('Reach')?.querySelector('b')) === '5 ft', text(kv('Reach')));
	actor.system.perception.senses = [];
	await redraw();
	check('no senses shows a dash', text(kv('Senses')?.querySelector('b')) === '—');
	actor.system.perception.senses = [{ type: 'low-light-vision', label: 'Low-Light Vision' }];

	/* ---- initiative ---- */
	const initPick = q('.proj-b [data-pick="initiative"]');
	const options = [...(initPick?.options ?? [])].map((o) => o.value);
	check('initiative can be rolled with Perception or any skill', options[0] === 'perception' && options.includes('stealth') && options.length === 1 + Object.keys(actor.skills).length, options);
	check('Perception chosen, as the character has it', initPick?.value === 'perception');
	await pick(initPick, 'stealth');
	check('choosing a skill sets the statistic the system rolls', actor.system.initiative.statistic === 'stealth', actor.system.initiative);
	const initBox = () => qa('[data-act="initiative"]').map((b) => text(b.querySelector('.v')))[0];
	actor.system.initiative.totalModifier = 12;
	await redraw();
	check("the Initiative box shows the chosen statistic's modifier", initBox() === '+12', initBox());
	delete actor.system.initiative.totalModifier;
	await redraw();
	check("without the system's total, it is the chosen skill's", initBox() === '+12', initBox());
	actor.system.initiative = { statistic: 'perception', totalModifier: 11 };
	await redraw();

	/* ---- roll-option toggles ---- */
	await tab('actions');
	const toggle = () => q('.proj-b [data-act="rollOption"]');
	check('the toggles are on the Actions tab, under Options', toggle() && /Options/.test(text(q('.proj-b'))) && text(toggle()) === 'Biotic Momentum');
	check('shown off', toggle().getAttribute('aria-pressed') === 'false' && !toggle().classList.contains('on'));
	await press(toggle());
	check('pressing it calls the system with the domain, option and item', actor.lastToggle?.domain === 'all' && actor.lastToggle.option === 'biotic-momentum' && actor.lastToggle.itemId === 'a1' && actor.lastToggle.checked === true, actor.lastToggle);
	check('and it shows on', toggle()?.getAttribute('aria-pressed') === 'true' && toggle().classList.contains('on'));
	await press(toggle());
	check('pressed again, off', actor.lastToggle.checked === false && toggle()?.getAttribute('aria-pressed') === 'false');
	const t = actor.synthetics.toggles.all['biotic-momentum'];
	t.suboptions = [{ value: 'push', label: 'Push', selected: true }, { value: 'pull', label: 'Pull', selected: false }];
	await redraw();
	const sub = q('.proj-b [data-pick="suboption"]');
	check('a toggle with choices has them beside it', sub && [...sub.options].map((o) => o.value).join() === 'push,pull' && sub.value === 'push');
	await pick(sub, 'pull');
	check('choosing one turns it on with that choice', actor.lastToggle.suboption === 'pull' && actor.lastToggle.checked === true, actor.lastToggle);
	t.suboptions = [];
	t.checked = false;
	t.enabled = false;
	await redraw();
	check('one the character cannot use now is shown but cannot be pressed', toggle()?.disabled === true);
	t.enabled = true;
	t.placement = 'spellcasting';
	await redraw();
	check("spellcasting's toggles are not on the Actions tab", !toggle());
	await tab('spellcasting');
	check('they are on the Spells tab', text(toggle()) === 'Biotic Momentum');
	t.placement = 'actions';

	/* ---- an effect's counter ---- */
	const chip = () => qa('[data-slot="effects"] .chip').find((c) => /Overcharge/.test(c.textContent));
	check('an effect with a counter shows its value with − and +', /Overcharge\s*−\s*2\s*\+/.test(text(chip())), text(chip()));
	check('one without has neither', !qa('[data-slot="effects"] .chip').find((c) => /Biotic Barrier/.test(c.textContent))?.querySelector('[data-act="effectStep"]'));
	await press(chip().querySelector('[data-act="effectStep"][data-k="e2:1"]'));
	check('+ raises it through the effect', actor.itemTypes.effect[1].system.badge.value === 3 && /−\s*3\s*\+/.test(text(chip())), text(chip()));
	await press(chip().querySelector('[data-act="effectStep"][data-k="e2:-1"]'));
	check('− lowers it', actor.itemTypes.effect[1].system.badge.value === 2);
	actor.itemTypes.effect[1].system.badge.labels = ['Low', 'Mid', 'High'];
	await redraw();
	check('a counter with labels shows the label for its value', /−\s*Mid\s*\+/.test(text(chip())), text(chip()));
	delete actor.itemTypes.effect[1].system.badge.labels;

	/* ---- stamina, resolve and special resources ---- */
	const pools = () => qa('[data-slot="vitals"] .sfh-pool');
	check('without the Stamina variant, no Stamina or Resolve', !pools().length);
	globalThis.game.pf2e = { settings: { variants: { stamina: true } } };
	actor.system.attributes.hp.sp = { value: 8, max: 12 };
	actor.system.resources.resolve = { value: 2, max: 3 };
	actor.synthetics.resources = { 'surge': { slug: 'surge', label: 'Surge', value: 1, max: 2 } };
	actor.getResource = (slug) => (slug === 'surge' ? actor.synthetics.resources.surge : null);
	actor.updateResource = async (slug, value) => { actor.synthetics.resources[slug].value = value; actor.lastResource = { slug, value }; };
	await redraw();
	check('with it, Stamina and Resolve beside hit points, then the special resources', pools().map((p) => text(p.querySelector('.lbl'))).join() === 'Stamina,Resolve,Surge', pools().map((p) => text(p)));
	check('each against its maximum', pools().map((p) => `${p.querySelector('input').value}${text(p.querySelector('.dimc'))}`).join() === '8/ 12,2/ 3,1/ 2', pools().map((p) => text(p)));
	await type(pools()[0].querySelector('input'), 5);
	check('Stamina typed is written to the actor', actor.system.attributes.hp.sp.value === 5, actor.system.attributes.hp.sp);
	await type(pools()[1].querySelector('input'), 9);
	check('Resolve typed past its maximum stops at it', actor.system.resources.resolve.value === 3, actor.system.resources.resolve);
	await type(pools()[2].querySelector('input'), 2);
	check("a special resource goes through the system's updateResource", actor.lastResource?.slug === 'surge' && actor.lastResource.value === 2, actor.lastResource);
	delete globalThis.game.pf2e;
	actor.synthetics.resources = {};
	await redraw();

	/* ---- a loaded magazine ---- */
	const updates = [];
	const magazine = { id: 'm1', type: 'ammo', isMagazine: true, system: { uses: { value: 20, autoDestroy: false } },
		update: async (c) => updates.push(c), delete: async () => updates.push('delete') };
	const strike = actor.system.actions[1];
	strike.item = { subitems: { get: (id) => (id === 'm1' ? magazine : null) } };
	strike.ammunition = { requiresReload: true, loaded: [{ id: 'm1', name: 'Battery', quantity: 20, max: 20 }], selected: { id: 'm1' }, remaining: 0, capacity: 1 };
	await tab('actions');
	const rounds = q('.proj-b [data-commit="ammoQty"]');
	check("a loaded magazine's rounds are a field, against its capacity", rounds?.value === '20' && /\/\s*20/.test(text(rounds.parentElement)), text(rounds?.parentElement));
	await type(rounds, 12);
	check('typed, the magazine keeps the rounds left', JSON.stringify(updates.at(-1)) === JSON.stringify({ 'system.uses.value': 12 }), updates);
	await type(q('.proj-b [data-commit="ammoQty"]'), 0);
	check('emptied, a magazine kept when empty stays loaded', JSON.stringify(updates.at(-1)) === JSON.stringify({ 'system.uses.value': 0 }), updates);
	magazine.isMagazine = false;
	await type(q('.proj-b [data-commit="ammoQty"]'), 3);
	check('loaded ammunition that is not a magazine keeps its quantity', JSON.stringify(updates.at(-1)) === JSON.stringify({ 'system.quantity': 3 }), updates);
	await type(q('.proj-b [data-commit="ammoQty"]'), 0);
	check('and nothing left takes it out, as on the sheet', updates.at(-1) === 'delete', updates);
	delete strike.item;
	delete strike.ammunition;

	hud.setPower(false, { silent: true });
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
