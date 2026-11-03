/*
 * Run a placement through the real watcher and check, in numbers, that the HUD gets out of the
 * way of the canvas and comes back as it was. Foundry's layer is replaced by a class with
 * the same shape: a placement is a promise that settles when the player finishes, and a system's
 * layer reaches the base class through super.
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
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, Projection } = SFH;

	let pending = [];
	class RegionLayer {
		placeRegion(data) { return new Promise((resolve, reject) => pending.push({ resolve, reject, data })); }
		async placeRegions(list) {
			const docs = [];
			for (const d of list) docs.push(await this.placeRegion(d));
			return docs;
		}
	}
	class SystemLayer extends RegionLayer {
		placeRegion(data, options) { return super.placeRegion(data, options); }
	}
	globalThis.foundry = { ...globalThis.foundry, canvas: { layers: { RegionLayer } } };
	const { watchPlacement } = await import('../scripts/interface/placement.mjs');
	watchPlacement();
	const layer = new SystemLayer();

	const shown = (sel) => {
		const el = document.querySelector(sel);
		return !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
	};
	const clear = () => !shown('#sfh-projection') && !shown('#sfh-device svg.sfh-art') && !shown('#sfh-beam');

	for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal']) {
		game.settings.set(null, 'device', device);
		await wait(100);
		if (!hud.power) hud.setPower(true, { silent: true });
		await wait(250);
		const before = Projection.element.getBoundingClientRect();
		check(`${device}: raised first`, shown('#sfh-projection'));

		const placing = layer.placeRegion({ id: 1 });
		await wait(30);
		check(`${device}: clear while placing`, clear());
		check(`${device}: macro bar stays`, shown('#hotbar'));
		check(`${device}: no restore key or notice`, !shown('#sfh-restore') && !hud.hidden);
		const hit = document.elementFromPoint(before.left + before.width / 2, before.top + before.height / 2);
		check(`${device}: map under the pointer`, !hit?.closest('#sfh-projection'), hit?.id || hit?.tagName);

		pending.shift().resolve({ placed: 1 });
		const value = await placing;
		check(`${device}: result passes through`, value?.placed === 1);
		await wait(120);
		const after = Projection.element.getBoundingClientRect();
		check(`${device}: back where it was`, shown('#sfh-projection') && Math.abs(after.left - before.left) < 1 && Math.abs(after.width - before.width) < 1);
	}

	// dismissing can reject: the error still reaches the caller and the HUD still comes back
	const failing = layer.placeRegion({ id: 2 });
	await wait(20);
	pending.shift().reject(new Error('boom'));
	check('rejection reaches the caller', await failing.then(() => false, (e) => e.message === 'boom'));
	check('back after a rejection', !hud.suspended);

	// several regions in a row stay clear between them
	const many = layer.placeRegions([{ id: 3 }, { id: 4 }]);
	await wait(20);
	pending.shift().resolve('a');
	await wait(20);
	check('still clear between regions', hud.suspended && clear());
	pending.shift().resolve('b');
	check('every result returned', (await many).join() === 'a,b');
	check('back after the last', !hud.suspended);

	// a HUD the player hid stays hidden
	hud.setHidden(true);
	const whileHidden = layer.placeRegion({ id: 5 });
	await wait(20);
	pending.shift().resolve(null);
	await whileHidden;
	await wait(30);
	check('hidden stays hidden', hud.hidden && !shown('#sfh-projection') && shown('#sfh-restore'));
	hud.setHidden(false);

	// a placement that never settles, abandoned by a change of scene
	layer.placeRegion({ id: 6 });
	await wait(20);
	check('clear before the scene change', hud.suspended);
	Hooks.callAll('canvasTearDown');
	check('scene change brings it back', !hud.suspended && !('sfhSuspended' in document.body.dataset));
	return out;
});
await browser.close();

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
