/*
 * Run-through of every device and look, on every tab, for PF2e/SF2e (the harness's character),
 * 5e and 3.5e (the characters their tests build), looking for text that runs past the edge of the
 * cell, button or panel it is written in, or is cut off by one. Ellipses and line clamps, which are
 * meant, are listed apart. Prints what it finds, grouped, and exits 1 if anything overruns or is cut off.
 *
 *   node tools/scan-overflow.mjs [pf2e|pf2e-dying|dnd5e|dnd5e-npc|d35e ...] [--shots <folder>]
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const dir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');

const argv = process.argv.slice(2);
const shotsAt = argv.indexOf('--shots');
const shotsTo = shotsAt >= 0 ? argv.splice(shotsAt, 2)[1] : null;
const systems = argv.length ? argv : ['pf2e', 'pf2e-dying', 'dnd5e', 'dnd5e-npc', 'd35e'];
if (shotsTo) fs.mkdirSync(shotsTo, { recursive: true });

/** A system test's set-up: everything in its page script before it opens the projection. */
const setupFrom = (file) => {
	const src = fs.readFileSync(path.join(dir, file), 'utf8');
	const from = src.indexOf('const results = await page.evaluate(async () => {');
	const to = src.indexOf('/* ---- open it ---- */');
	if (from < 0 || to < 0) throw new Error(`no set-up found in ${file}`);
	return src.slice(from + 'const results = await page.evaluate(async () => {'.length, to);
};
const SETUPS = {
	pf2e: `const out = []; const check = () => {}; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
		const { DeviceChrome: hud, Projection, store } = SFH; store.sequences = false; const actor = undefined;`,
	dnd5e: setupFrom('test-dnd5e.mjs'),
	d35e: setupFrom('test-d35e.mjs'),
};
// the labels only some characters show: a PF2e character who is dying, and so has a recovery
// check to roll, with the doomed points that lock some of it; and a 5e NPC that is a legend
SETUPS['pf2e-dying'] = `${SETUPS.pf2e}
	Object.assign(SFH.actor.system.attributes, { dying: { value: 2, max: 3 }, wounded: { value: 1 }, doomed: { value: 1 } });`;
SETUPS['dnd5e-npc'] = `${SETUPS.dnd5e}
	actor.type = 'npc';
	actor.system.details = { ...actor.system.details, cr: 0.5, type: { label: 'Humanoid (Goblinoid)' }, xp: { value: 100 } };
	actor.system.attributes.hd = { max: 4, spent: 1 };
	delete actor.system.attributes.inspiration;
	actor.system.resources = { legact: { max: 3, spent: 1 }, legres: { max: 2, spent: 0 } };`;

const SCAN = String.raw`
	const { DEVICES } = await import('../scripts/constants.mjs');
	const stage = () => document.querySelector('#sfh-projection .sfh-stage');
	const devices = Object.values(DEVICES).filter((d) => !d.system).map((d) => d.id);
	const found = [];
	const pad = 1.5;
	const transparent = (c) => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c);
	const isBox = (el) => {
		if (el.matches('button, input, select, textarea, .cell, .b, .li, .chip, .pill, [data-slot]')) return true;
		const cs = getComputedStyle(el);
		const border = ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs['border' + s + 'Width']) > 0 && !transparent(cs['border' + s + 'Color']));
		return border || !transparent(cs.backgroundColor) || (cs.backgroundImage !== 'none' && !/^url/.test(cs.backgroundImage));
	};
	const where = (el) => {
		const parts = [];
		for (let e = el; e && !e.matches?.('.sfh-stage') && parts.length < 4; e = e.parentElement) {
			parts.unshift(e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '') + (e.dataset?.slot ? '[slot=' + e.dataset.slot + ']' : ''));
		}
		return parts.join(' > ');
	};
	const scan = (root, label) => {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		for (let node; (node = walker.nextNode());) {
			const text = node.textContent.trim();
			const parent = node.parentElement;
			if (!text || !parent || !parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
			if (parent.closest('svg, script, style, option, .sfh-tip, [aria-hidden="true"]')) continue;
			const range = document.createRange();
			range.selectNodeContents(node);
			const rects = [...range.getClientRects()].filter((r) => r.width > 0.5);
			if (!rects.length) continue;
			const r = { left: Math.min(...rects.map((x) => x.left)), right: Math.max(...rects.map((x) => x.right)), top: Math.min(...rects.map((x) => x.top)), bottom: Math.max(...rects.map((x) => x.bottom)) };
			for (let a = parent; a && a !== root.parentElement; a = a.parentElement) {
				const cs = getComputedStyle(a);
				const ar = a.getBoundingClientRect();
				const over = { l: ar.left - r.left, r: r.right - ar.right, t: ar.top - r.top, b: r.bottom - ar.bottom };
				// a face's line box is taller than its letters, so a few pixels up and down are not seen
				const padY = Math.max(pad, parseFloat(getComputedStyle(parent).fontSize) * 0.3);
				const outX = over.l > pad || over.r > pad;
				const outY = over.t > padY || over.b > padY;
				const dir = (outX ? 'across' : '') + (outX && outY ? ' and ' : '') + (outY ? 'down' : '');
				const clipsX = cs.overflowX !== 'visible';
				const clipsY = cs.overflowY !== 'visible';
				if (clipsX || clipsY) {
					const scrollsY = /auto|scroll/.test(cs.overflowY);
					const scrollsX = /auto|scroll/.test(cs.overflowX);
					// an ellipsis, or a clamp to so many lines, is a cut that is meant
					const kind = (cs.textOverflow === 'ellipsis' && outX) || (cs.webkitLineClamp !== 'none' && outY) ? 'ellipsis' : 'cut off';
					if ((outX && clipsX && !scrollsX) || (outY && clipsY && !scrollsY)) {
						found.push({ label, kind, dir, text: text.slice(0, 40), at: where(parent), by: where(a), px: Math.round(Math.max(over.l, over.r, over.t, over.b)) });
					}
					// text out of view in a scroller is only scrolled away
					if (scrollsY || scrollsX || outX || outY) break;
				}
				if (isBox(a)) {
					if (outX || outY) found.push({ label, kind: 'overruns', dir, text: text.slice(0, 40), at: where(parent), by: where(a), px: Math.round(Math.max(over.l, over.r, over.t, over.b)) });
					break;
				}
			}
		}
	};
	hud.setPower(true, { silent: true });
	await wait(100);
	await Projection.open(actor);
	await wait(200);
	for (const device of devices) {
		await game.settings.set(null, 'device', device);
		await wait(350);
		const tabs = [...stage().querySelectorAll('[data-act="tab"]')].map((t) => t.dataset.k);
		for (const t of tabs) {
			stage().querySelector('[data-act="tab"][data-k="' + t + '"]').click();
			await wait(90);
			scan(stage(), device + ' ' + t);
			if (globalThis.__shot) await globalThis.__shot(device + '-' + t);
		}
		const deviceEl = document.getElementById('sfh-device');
		if (deviceEl) scan(deviceEl, device + ' device');
	}
	return found;
`;

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files'] });
let bad = 0;
for (const system of systems) {
	const page = await browser.newPage();
	await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1.25 });
	const errors = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	await page.goto(`file:///${dir}/harness-device.html`);
	await new Promise((r) => setTimeout(r, 900));
	if (shotsTo) await page.exposeFunction('__shot', (name) => page.screenshot({ path: path.join(shotsTo, `${system}-${name}.png`) }));
	const found = await page.evaluate(`(async () => { ${SETUPS[system]}\n${SCAN} })()`);
	await page.close();

	// the same text at the same place on many devices is one finding
	const groups = new Map();
	for (const f of found) {
		const key = `${f.kind}|${f.dir}|${f.text}|${f.at}`;
		const g = groups.get(key) ?? { ...f, on: [], px: 0 };
		g.on.push(f.label);
		g.px = Math.max(g.px, f.px);
		groups.set(key, g);
	}
	const list = [...groups.values()].sort((a, b) => (a.kind === 'ellipsis') - (b.kind === 'ellipsis') || b.px - a.px);
	console.log(`\n=== ${system}: ${list.filter((g) => g.kind !== 'ellipsis').length} overruns or cut-offs, ${list.filter((g) => g.kind === 'ellipsis').length} ellipses`);
	for (const g of list) {
		console.log(`${g.kind.toUpperCase()} ${g.dir} by ${g.px}px  "${g.text}"\n   at ${g.at}\n   by ${g.by}\n   on ${g.on.length > 6 ? `${g.on.slice(0, 6).join(', ')} … (${g.on.length})` : g.on.join(', ')}`);
	}
	if (errors.length) console.log('page errors:', errors);
	bad += list.filter((g) => g.kind !== 'ellipsis').length + errors.length;
}
await browser.close();
process.exit(bad ? 1 : 0);
