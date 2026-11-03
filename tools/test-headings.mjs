/*
 * Show Foundry's settings tab, with its stylesheet and the module's, and check in numbers that
 * every heading fits the sidebar on every device, in a wide font and a narrow one, and that the
 * heading color follows the device until the player chooses one.
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
	const headings = await import('../scripts/interface/headings.mjs');
	const fonts = await import('../scripts/interface/fonts.mjs');
	headings.watchHeadings();

	// the settings tab comes into view the way Foundry shows one: by a change of class
	document.getElementById('chat').classList.remove('active');
	document.getElementById('settings').classList.add('active');
	await document.fonts.ready;
	await wait(120);

	const tab = document.getElementById('settings');
	const dividers = () => [...tab.querySelectorAll('h4.divider')];
	const overrun = (el) => {
		const range = document.createRange();
		range.selectNodeContents(el);
		const text = range.getBoundingClientRect();
		const panel = tab.getBoundingClientRect();
		return text.left < panel.left - 0.5 || text.right > panel.right + 0.5;
	};
	const rgb = (css) => {
		const probe = document.createElement('span');
		probe.style.color = css;
		document.body.append(probe);
		const value = getComputedStyle(probe).color;
		probe.remove();
		return value;
	};
	const mainColor = () => rgb(getComputedStyle(document.body).getPropertyValue('--sfh-hot').trim());

	const setFont = async (name) => {
		SFH.store.fontDisplay = name;
		SFH.store.googleFonts = false;
		await fonts.applyFonts();
		headings.fitHeadings();
		await wait(60);
	};

	for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal', 'vambrace']) {
		game.settings.set(null, 'device', device);
		await wait(60);
		headings.fitHeadings();
		for (const [label, font] of [["the device's face", ''], ['a wide face', 'Michroma'], ['a very wide face', 'Audiowide, Michroma']]) {
			await setFont(font);
			const sizes = dividers().map((el) => getComputedStyle(el).fontSize);
			check(`${device}, ${label}: none overrun`, !dividers().some(overrun), sizes.join(' '));
			check(`${device}, ${label}: all one size`, new Set(sizes).size === 1, sizes.join(' '));
			const title = tab.querySelector('.title');
			const under = tab.querySelector('.subtitle').getBoundingClientRect();
			check(`${device}, ${label}: title on one line, clear of the version`,
				!overrun(title) && title.getBoundingClientRect().bottom <= under.top + 0.5,
				`${title.getBoundingClientRect().bottom} vs ${under.top}`);
		}
		await setFont('');
		const color = getComputedStyle(dividers()[0]).color;
		check(`${device}: main color by default`, color === mainColor(), `${color} vs ${mainColor()}`);
	}

	// wide enough to matter: the longest heading fills the width rather than shrinking too far
	game.settings.set(null, 'device', 'omni');
	await setFont('Michroma');
	const longest = dividers()[0];
	const range = document.createRange();
	range.selectNodeContents(longest);
	const fill = range.getBoundingClientRect().width / longest.getBoundingClientRect().width;
	check('the longest fills the width', fill > 0.85 && fill <= 1, fill.toFixed(3));

	// a narrow face has room, so it keeps Foundry's size
	await setFont('Arial Narrow, Arial');
	longest.style.removeProperty('font-size');
	const natural = getComputedStyle(longest).fontSize;
	headings.fitHeadings();
	await wait(30);
	check('never grows past its size', parseFloat(getComputedStyle(longest).fontSize) <= parseFloat(natural));
	await setFont('');

	// a narrower sidebar refits by itself
	const before = parseFloat(getComputedStyle(longest).fontSize);
	document.getElementById('sidebar').style.width = '220px';
	tab.style.width = '220px';
	document.getElementById('sidebar-content').style.width = '220px';
	await wait(120);
	check('refits when the sidebar narrows', parseFloat(getComputedStyle(longest).fontSize) < before && !dividers().some(overrun));
	for (const id of ['sidebar', 'settings', 'sidebar-content']) document.getElementById(id).style.removeProperty('width');
	await wait(120);

	// the player's own color, in either shape the setting hands back
	SFH.store.headingColor = '#00ff88';
	headings.applyHeadingColor();
	check('a chosen color applies', getComputedStyle(longest).color === rgb('#00ff88'));
	game.settings.set(null, 'device', 'gdi');
	check('and stays across devices', getComputedStyle(longest).color === rgb('#00ff88'));
	SFH.store.headingColor = { css: '#ff0088' };
	headings.applyHeadingColor();
	check('a Color object applies', getComputedStyle(longest).color === rgb('#ff0088'));
	SFH.store.headingColor = null;
	headings.applyHeadingColor();
	check('clearing it returns to the main color', getComputedStyle(longest).color === mainColor());
	return out;
});
await browser.close();

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
