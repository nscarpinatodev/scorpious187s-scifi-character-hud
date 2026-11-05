/*
 * The Holoprojector's bright band runs down every panel and never gives one a scroll bar: stepped
 * through its whole run, at the top, the middle and past the bottom, no part of the projection
 * scrolls further than it does with the band taken away. And it still runs.
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
	const { DeviceChrome: hud, store } = SFH;
	store.sequences = false;
	await game.settings.set(null, 'device', 'holoprojector');
	await wait(250);
	hud.setPower(true, { silent: true });
	await wait(500);

	const stage = document.querySelector('#sfh-projection .sfh-stage');
	// every box in the projection that scrolls, or would
	const scrollers = () => [...stage.querySelectorAll('*')].filter((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.clientHeight > 0);
	const reach = () => scrollers().map((e) => e.scrollHeight);
	const band = () => document.getAnimations().filter((a) => a.animationName === 'sfh-look-holo-band');

	// how far each scrolls with the band taken away
	const off = document.createElement('style');
	off.textContent = '#sfh-projection .pnl::before { display: none !important; }';
	document.head.append(off);
	await wait(60);
	const without = reach();
	off.remove();
	await wait(60);

	const runs = band();
	check('the band runs on every panel', runs.length > 3, runs.length);
	const grew = [];
	for (const at of [0, 0.25, 0.5, 0.75, 0.9, 0.97, 0.999]) {
		for (const a of runs) { a.pause(); a.currentTime = at * a.effect.getTiming().duration; }
		await wait(30);
		const now = reach();
		now.forEach((h, i) => { if (h > without[i] + 1) grew.push(`${Math.round(at * 100)}%: ${scrollers()[i].className} ${without[i]}→${h}`); });
	}
	check('at no point in its run does it give anything more to scroll', !grew.length, grew.slice(0, 6));
	for (const a of runs) a.play();
	hud.setPower(false, { silent: true });
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
