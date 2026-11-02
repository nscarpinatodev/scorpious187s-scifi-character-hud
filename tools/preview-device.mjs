/* Screenshot the device chrome harness across every device. */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// puppeteer and sharp live in the sibling conversion repo; this tool is dev-only
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');
const dir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');

const browser = await puppeteer.launch({
	executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`file:///${dir}/harness-device.html`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(1200);

const shots = [];
const report = {};
const measure = () => page.evaluate(() => {
	const r = (el) => { const b = el?.getBoundingClientRect(); return b ? { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom) } : null; };
	const hotbar = document.getElementById('hotbar');
	return {
		hotbarParent: hotbar?.parentElement?.id,
		power: document.body.dataset.sfhPower,
		art: r(document.querySelector('svg.sfh-art')),
		band: r(document.getElementById('sfh-band')),
		bar: r(hotbar),
		powerKey: r(document.getElementById('sfh-power')),
	};
});
for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron']) {
	await page.evaluate((d) => game.settings.set(null, 'device', d), device);
	await wait(400);
	shots.push(await page.screenshot());
	report[device] = await measure();
}
console.log('errors:', errors.length ? errors.slice(0, 4) : 'none');
console.log(report);

const imgs = await Promise.all(shots.map((b) => sharp(b).resize(760).toBuffer()));
const m = await sharp(imgs[0]).metadata();
await sharp({ create: { width: 2 * 768, height: 3 * (m.height + 8), channels: 3, background: '#111' } })
	.composite(imgs.map((b, i) => ({ input: b, left: (i % 2) * 768, top: Math.floor(i / 2) * (m.height + 8) })))
	.png()
	.toFile(`${dir}/preview-device.png`);
await browser.close();
