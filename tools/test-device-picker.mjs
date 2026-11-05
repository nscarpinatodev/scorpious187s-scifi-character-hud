/*
 * The Default device and My device settings as two menus: a category, then the looks in it.
 * Foundry's own select stays the one that is saved; the category is worked out from what is
 * chosen, its looks are the only ones offered, and changing it puts its first look in. My device
 * can also follow the world's default, which leaves only the category showing. The setting's
 * value never moves on its own.
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
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const { DEVICES } = await import('../scripts/constants.mjs');
	const { splitDevicePicker } = await import('../scripts/interface/device-picker.mjs');
	const MOD = 'scorpious187s-scifi-character-hud';
	const l = (k) => game.i18n.localize(k);

	// Foundry's settings window, as it draws a setting with choices
	const looks = Object.values(DEVICES).map((d) => [d.id, l(d.label)]);
	const group = (key, label, value, extra = []) => `<div class="form-group"><label>${label}</label><div class="form-fields">
		<select name="${MOD}.${key}">${[...extra, ...looks].map(([v, t]) => `<option value="${v}"${v === value ? ' selected' : ''}>${t}</option>`).join('')}</select></div></div>`;
	const draw = (world, mine) => {
		const form = document.createElement('form');
		form.innerHTML = group('worldDevice', 'Default device', world) + group('device', 'My device', mine, [['', l('SFH.Settings.DeviceWorld')]]);
		document.body.append(form);
		splitDevicePicker(null, form);
		return form;
	};
	const parts = (form, key) => {
		const select = form.querySelector(`select[name="${MOD}.${key}"]`);
		return { select, category: select.previousElementSibling, offered: [...select.options].map((o) => o.value) };
	};
	const scifi = Object.values(DEVICES).filter((d) => d.genre === 'scifi').map((d) => d.id);
	const fantasy = Object.values(DEVICES).filter((d) => d.genre === 'fantasy').map((d) => d.id);

	let form = draw('omni', '');
	let world = parts(form, 'worldDevice');
	let mine = parts(form, 'device');
	check('each gets a category menu beside its look menu', world.category?.matches('select.sfh-category') && mine.category?.matches('select.sfh-category') && world.category.parentElement === world.select.parentElement);
	check('the Default device offers science fiction and fantasy', [...world.category.options].map((o) => o.value).join() === 'scifi,fantasy');
	check('My device can also follow the world default', [...mine.category.options].map((o) => o.value).join() === 'world,scifi,fantasy');
	check("the category is the chosen look's", world.category.value === 'scifi' && world.select.value === 'omni');
	check('only that category\'s looks are offered, in their order', world.offered.join() === scifi.join(), world.offered);
	check('following the world default shows only the category', mine.category.value === 'world' && mine.select.hidden && mine.select.value === '');
	check('the setting is unchanged by being drawn', new FormData(form).get(`${MOD}.worldDevice`) === 'omni' && new FormData(form).get(`${MOD}.device`) === '');

	let changed = 0;
	world.select.addEventListener('change', () => changed++);
	world.category.value = 'fantasy';
	world.category.dispatchEvent(new Event('change'));
	world = parts(form, 'worldDevice');
	check('another category offers its own looks', world.offered.join() === fantasy.join(), world.offered);
	check("and puts its first in, as a change Foundry's form sees", world.select.value === fantasy[0] && changed === 1 && new FormData(form).get(`${MOD}.worldDevice`) === fantasy[0]);
	world.category.value = 'scifi';
	world.category.dispatchEvent(new Event('change'));
	check('and back again', parts(form, 'worldDevice').select.value === scifi[0]);

	mine.category.value = 'fantasy';
	mine.category.dispatchEvent(new Event('change'));
	mine = parts(form, 'device');
	check('a player choosing a category gets its looks to choose from', !mine.select.hidden && mine.offered.join() === fantasy.join() && mine.select.value === fantasy[0]);
	mine.category.value = 'world';
	mine.category.dispatchEvent(new Event('change'));
	check('and choosing the world default again leaves nothing else', parts(form, 'device').select.hidden && new FormData(form).get(`${MOD}.device`) === '');
	splitDevicePicker(null, form);
	check('drawn twice, still one category menu each', form.querySelectorAll('.sfh-category').length === 2);
	form.remove();

	form = draw('reliquary', 'crystal');
	check('a fantasy look is found under fantasy', parts(form, 'worldDevice').category.value === 'fantasy' && parts(form, 'worldDevice').select.value === 'reliquary');
	check('the Crystal core is science fiction, though it dresses the Vambrace', parts(form, 'device').category.value === 'scifi' && parts(form, 'device').select.value === 'crystal');
	form.remove();
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
