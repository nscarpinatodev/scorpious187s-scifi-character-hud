/*
 * Show Foundry's real combat tracker, with its stylesheet and the module's, and check in numbers
 * that it follows the device, that the current turn stands out, and that nothing is unreadable or
 * clipped. Screenshots for looking at go beside this file if asked for: node test-tracker.mjs <dir>
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// puppeteer and sharp live in the sibling conversion repo; this tool is dev-only
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');
const dir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');
const shotsTo = process.argv[2];

const browser = await puppeteer.launch({
	executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1.5 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));
await page.evaluate(() => {
	document.getElementById('chat').classList.remove('active');
	document.getElementById('combat').classList.add('active');
	document.body.style.setProperty('--ui-fade-opacity', '1');
	document.getElementById('sidebar-content').style.height = '520px';
	document.getElementById('combat').style.height = '520px';
});

const results = [];
const shots = [];
for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal']) {
	await page.evaluate((d) => game.settings.set(null, 'device', d), device);
	// long enough for Foundry's color transitions to finish
	await new Promise((r) => setTimeout(r, 700));
	results.push(...await page.evaluate((d) => {
		const out = [];
		const check = (name, ok, detail = '') => out.push({ name: `${d}: ${name}`, ok: !!ok, detail: JSON.stringify(detail) });
		const rgb = (css) => {
			const probe = document.createElement('span');
			probe.style.color = css;
			document.body.append(probe);
			const value = getComputedStyle(probe).color;
			probe.remove();
			return value;
		};
		const token = (t) => rgb(getComputedStyle(document.body).getPropertyValue(t).trim());
		const q = (s) => document.querySelector(`#combat ${s}`);
		const st = (s) => getComputedStyle(q(s));
		const alpha = (c) => { const m = c.match(/^rgba\(.*,\s*([\d.]+)\)$/); return m ? Number(m[1]) : 1; };

		check('the round is in the main color', st('.encounter-title').color === token('--sfh-heading'), st('.encounter-title').color);
		check('the current turn has the main color edge', st('.combatant.active').borderTopColor === token('--sfh-hot'));
		check('the current turn has its bar', /inset/.test(st('.combatant.active').boxShadow), st('.combatant.active').boxShadow);
		check('its name is in the main color', st('.combatant.active .name').color === token('--sfh-heading'));
		check('other turns are quiet', st('.combatant:not(.active):not(.defeated):not(.hide)').borderTopColor !== token('--sfh-hot'));
		check('a defeated name can be read', alpha(st('.combatant.defeated .name').color) === 1 && st('.combatant.defeated .name').color === token('--sfh-bad'), st('.combatant.defeated .name').color);
		check('a defeated name is struck through', /line-through/.test(st('.combatant.defeated .name').textDecorationLine));
		// the device's face for numbers: a monospace on the sci-fi devices, Garamond's lining figures in the Journal
		const numbers = getComputedStyle(document.body).getPropertyValue('--sfh-mono').split(',')[0].replace(/"/g, '').trim();
		check('initiative is in the number face', st('.token-initiative input').fontFamily.replace(/"/g, '').startsWith(numbers), [st('.token-initiative input').fontFamily, numbers]);
		const roll = q('.token-initiative button');
		check('the roll button is showing', roll.getBoundingClientRect().width > 0 && getComputedStyle(roll).maskImage !== 'none', getComputedStyle(roll).maskImage.slice(0, 50));
		check('the roll button is colored by the device', getComputedStyle(roll).backgroundColor === token('--sfh-hot'));
		check('an active control is lit', st('.combatant.defeated .fa-skull.active').color === token('--sfh-hot'), st('.combatant.defeated .fa-skull.active').color);

		const tab = document.getElementById('combat').getBoundingClientRect();
		const clipped = [...document.querySelectorAll('#combat .combatant, #combat .combat-controls, #combat .encounter-controls')]
			.filter((el) => { const r = el.getBoundingClientRect(); return r.left < tab.left - 0.5 || r.right > tab.right + 0.5; }).map((el) => el.className);
		check('rows stay inside the sidebar', !clipped.length, clipped);
		const rows = [...document.querySelectorAll('#combat .combatant')].map((el) => el.getBoundingClientRect());
		check('rows do not run together', rows.every((r, i) => !rows[i + 1] || rows[i + 1].top >= r.bottom), rows.map((r) => [r.top, r.bottom]));
		const init = [...document.querySelectorAll('#combat .token-initiative')].map((el) => Math.round(el.getBoundingClientRect().right));
		check('the initiative column lines up', new Set(init).size === 1, init);
		const footer = q('button.combat-control-lg');
		const label = footer.querySelector('span').getBoundingClientRect();
		const box = footer.getBoundingClientRect();
		check('the footer\'s label fits, on one line', label.left >= box.left && label.right <= box.right && label.top >= box.top && label.bottom <= box.bottom, [label, box]);
		return out;
	}, device));
	if (shotsTo) {
		const clip = await page.evaluate(() => { const b = document.getElementById('combat').getBoundingClientRect(); return { x: b.left - 6, y: b.top, width: b.width + 12, height: 520 }; });
		shots.push(await page.screenshot({ clip }));
	}
}

// popped out, it is outside the interface regions but takes the same style
results.push(...await page.evaluate(() => {
	const out = [];
	game.settings.set(null, 'device', 'tron');
	const pop = document.getElementById('combat').cloneNode(true);
	pop.id = 'combat-popout';
	pop.classList.add('sidebar-popout', 'active');
	pop.style.cssText = 'position:fixed;left:40px;top:40px;width:300px;height:400px;';
	document.body.append(pop);
	const name = getComputedStyle(pop.querySelector('.combatant.active .name')).color;
	const hot = getComputedStyle(document.body).getPropertyValue('--sfh-heading');
	const probe = document.createElement('span');
	probe.style.color = 'var(--sfh-heading)';
	document.body.append(probe);
	out.push({ name: 'popped out, it takes the device\'s style', ok: name === getComputedStyle(probe).color, detail: JSON.stringify([name, hot]) });
	probe.remove();
	pop.remove();
	return out;
}));
await browser.close();

if (shotsTo) {
	const metas = await Promise.all(shots.map((b) => sharp(b).metadata()));
	let x = 0;
	const comps = shots.map((b, i) => { const c = { input: b, left: x, top: 0 }; x += metas[i].width + 8; return c; });
	await sharp({ create: { width: x, height: metas[0].height, channels: 3, background: '#222' } }).composite(comps).png().toFile(`${shotsTo}/tracker.png`);
}

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
