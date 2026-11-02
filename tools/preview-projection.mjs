/*
 * Raise the projection on every device and check, in numbers, that it is clear of the
 * interface: the controls on the left, the sidebar on the right, the scene bar above and
 * the device below. Screenshots are for looking at; the clearances are the test.
 */
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
await page.setViewport({ width: 1600, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`file:///${dir}/harness-device.html`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(1200);

const report = {};
const shots = [];
for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron']) {
	await page.evaluate((d) => game.settings.set(null, 'device', d), device);
	await wait(300);
	if (!(await page.evaluate(() => SFH.Projection.isOpen))) await page.evaluate(() => SFH.DeviceChrome.toggle());
	await wait(1100);
	shots.push(await page.screenshot());
	report[device] = await page.evaluate(() => {
		const r = (el) => { const b = el?.getBoundingClientRect(); return b ? { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom) } : null; };
		const proj = r(document.getElementById('sfh-projection'));
		const sidebar = r(document.getElementById('sidebar'));
		const leftCol = r(document.getElementById('ui-left-column-1'));
		// a device with art stands on the panels, which do not clear it: measure the plate, not the layer, whose
		// box reaches above it to hold the emitter glow
		const device = r(document.getElementById('sfh-arm') ?? document.getElementById('sfh-device'));
		const slots = [...document.querySelectorAll('#sfh-projection [data-slot]')].map((n) => n.dataset.slot);
		return {
			open: SFH.Projection.isOpen,
			proj,
			slots,
			tabs: document.querySelectorAll('#sfh-projection .navb').length,
			body: document.querySelector('#sfh-projection .proj-b')?.children.length ?? 0,
			clear: {
				left: proj && leftCol ? proj.l - leftCol.r : null,
				right: proj && sidebar ? sidebar.l - proj.r : null,
				bottom: proj && device ? device.t - proj.b : null,
				top: proj ? proj.t : null,
			},
		};
	});
}

console.log('errors:', errors.length ? errors.slice(0, 4) : 'none');
console.dir(report, { depth: 4 });

const needed = ['identity', 'vitals', 'defenses', 'effects', 'readout', 'projection'];
const bad = Object.entries(report).filter(([, v]) =>
	!v.open || !v.tabs || !v.body || needed.some((s) => !v.slots.includes(s)) || Object.values(v.clear).some((c) => c !== null && c < 0));
console.log(bad.length ? `FAIL: ${bad.map(([k]) => k).join(', ')}` : 'PASS: every panel drawn, tabs present, clear of the interface');

const imgs = await Promise.all(shots.map((b) => sharp(b).resize(780).toBuffer()));
const m = await sharp(imgs[0]).metadata();
await sharp({ create: { width: 2 * 788, height: 3 * (m.height + 8), channels: 3, background: '#111' } })
	.composite(imgs.map((b, i) => ({ input: b, left: (i % 2) * 788, top: Math.floor(i / 2) * (m.height + 8) })))
	.png()
	.toFile(`${dir}/preview-projection.png`);
await browser.close();
