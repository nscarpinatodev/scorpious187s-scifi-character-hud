/*
 * D&D 5e's own sheets marked as the projection is, on stand-ins for the system's character, NPC
 * and vehicle sheets under Foundry's stylesheet and the system's own (tools/harness-sheet5e.html),
 * with item and spell lists written as the system's template writes them.
 *
 * An item's name is in the color of its rarity, D&D Beyond's five, on all three sheets and among a
 * character's favorites, in the light theme and the dark, each read against the pixels really
 * behind it; a common thing, a thing with no rarity and a thing not yet identified keep the
 * sheet's own ink. A character's spell that has to be prepared and is not is grayed, all but its
 * controls; a cantrip, a prepared or always-prepared spell, a pact spell and a spell cast from an
 * item are not; an NPC's spells are left alone. Each setting switched off takes its marks away.
 * A screenshot of each theme is written to a folder if one is given.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// puppeteer lives in the sibling conversion repo; this tool is dev-only
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const dir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');
const shotsTo = process.argv[2];

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1900, height: 1600, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-sheet5e.html`);
await new Promise((r) => setTimeout(r, 900));
await page.exposeFunction('__png', () => page.screenshot({ encoding: 'base64', type: 'png' }));
if (shotsTo) await page.exposeFunction('__shot', (name) => page.screenshot({ path: path.join(shotsTo, `sheet-marks-${name}.png`) }));

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const sheets = () => ['character', 'npc', 'vehicle'].map((k) => document.getElementById(`sheet-${k}`));
	const [character, npc, vehicle] = sheets();
	const THEMES = ['theme-light', 'theme-dark'];
	const theme = async (name) => { for (const s of sheets()) { s.classList.remove(...THEMES); if (name) s.classList.add(name); } await wait(150); };
	const show = async (tab) => { for (const s of sheets()) s.querySelector(`nav.tabs [data-tab="${tab}"]`)?.click(); await wait(120); };
	const row = (sheet, id) => sheet.querySelector(`.tab-body li.item[data-item-id="${id}"]`);
	const title = (sheet, id) => row(sheet, id).querySelector(':scope > .item-row > .item-name .title');
	const ink = (el) => getComputedStyle(el).color;
	const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
	const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
	const nums = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
	// what is really behind each piece of text: the page photographed with its text hidden
	const grounds = async (els) => {
		const hide = document.head.appendChild(document.createElement('style'));
		hide.textContent = '*, *::before, *::after { color: transparent !important; text-shadow: none !important; transition: none !important; }';
		const img = new Image();
		img.src = `data:image/png;base64,${await globalThis.__png()}`;
		await img.decode();
		hide.remove();
		const cv = document.createElement('canvas');
		[cv.width, cv.height] = [img.width, img.height];
		const cx = cv.getContext('2d', { willReadFrequently: true });
		cx.drawImage(img, 0, 0);
		return els.map((el) => {
			const r = el.getBoundingClientRect();
			const d = cx.getImageData(Math.round(r.left), Math.round(r.top), Math.max(1, Math.round(r.width)), Math.max(1, Math.round(r.height))).data;
			return [0, 1, 2].map((k) => { const v = []; for (let i = k; i < d.length; i += 4) v.push(d[i]); v.sort((a, b) => a - b); return v[v.length >> 1]; });
		});
	};
	const RARE = ['ring', 'sword', 'bow', 'staff', 'orb'];
	const PLAIN = ['rope', 'potion', 'wand'];
	const WANT = {
		'theme-light': ['rgb(16, 103, 13)', 'rgb(45, 89, 140)', 'rgb(137, 14, 202)', 'rgb(122, 78, 19)', 'rgb(112, 81, 67)'],
		'theme-dark': ['rgb(31, 194, 25)', 'rgb(115, 170, 233)', 'rgb(206, 140, 240)', 'rgb(254, 162, 39)', 'rgb(200, 156, 137)'],
	};

	check('before a sheet is drawn nothing is marked', !document.querySelector('[data-sfh-rarity], [data-sfh-unprepared]'));
	SFH5.mark();

	for (const name of THEMES) {
		await theme(name);
		await show('inventory');
		if (globalThis.__shot) await globalThis.__shot(`${name}-inventory`);
		for (const s of sheets()) {
			const titles = RARE.map((id) => title(s, id));
			const inks = titles.map(ink);
			check(`${s.id}, ${name}: the five rarities are named in D&D Beyond's colors, as far as each reads`, inks.join() === WANT[name].join(), inks);
			const under = await grounds(titles);
			const ratios = inks.map((c, i) => +contrast(nums(c), under[i]).toFixed(2));
			check(`${s.id}, ${name}: each reads on what is behind it`, ratios.every((r) => r >= 4.5), [ratios, under.map((u) => u.join(' '))]);
			const plain = PLAIN.map((id) => ink(title(s, id)));
			check(`${s.id}, ${name}: a common thing, a thing with no rarity and a thing not yet identified keep the sheet's ink`,
				new Set(plain).size === 1 && !inks.includes(plain[0]) && PLAIN.every((id) => !('sfhRarity' in row(s, id).dataset)), plain);
			check(`${s.id}, ${name}: only the name is colored, not the line under it`, ink(row(s, 'sword').querySelector('.subtitle')) !== ink(title(s, 'sword')));
		}
		const fav = character.querySelector('.favorites li[data-item-id="sword"] .title');
		check(`${name}: a favorite is named in its color too`, ink(fav) === WANT[name][1], ink(fav));

		await show('spells');
		if (globalThis.__shot) await globalThis.__shot(`${name}-spells`);
		const gray = (s, id) => 'sfhUnprepared' in row(s, id).dataset;
		const strength = (el) => Number(getComputedStyle(el).opacity);
		check(`${name}: a character's spell that is not prepared is grayed`, gray(character, 'unready') && strength(row(character, 'unready').querySelector('.item-name')) === 0.5
			&& /grayscale/.test(getComputedStyle(row(character, 'unready').querySelector('.item-name')).filter), strength(row(character, 'unready').querySelector('.item-name')));
		check(`${name}: all but its controls, where it is prepared from`, strength(row(character, 'unready').querySelector('.item-controls')) === 1);
		const clear = ['cantrip', 'ready', 'always', 'pact', 'fromitem'];
		check(`${name}: a cantrip, a prepared or always-prepared spell, a pact spell and one cast from an item are not`, clear.every((id) => !gray(character, id) && strength(row(character, id).querySelector('.item-name')) === 1), clear.filter((id) => gray(character, id)));
		const favSpell = character.querySelector('.favorites li[data-item-id="unready"]');
		check(`${name}: the same spell among the favorites is grayed`, 'sfhUnprepared' in favSpell.dataset && strength(favSpell.querySelector('.name-stacked')) === 0.5);
		check(`${name}: an NPC's spells are left as they are`, !npc.querySelector('[data-sfh-unprepared]') && strength(row(npc, 'unready').querySelector('.item-name')) === 1);
	}

	/* ---- a sheet with no theme of its own takes the interface's ---- */
	await theme('');
	await show('inventory');
	check('a sheet with no theme of its own, under a dark interface, has the dark theme\'s colors', document.body.classList.contains('theme-dark') && RARE.map((id) => ink(title(npc, id))).join() === WANT['theme-dark'].join(), RARE.map((id) => ink(title(npc, id))));
	await theme('theme-light');

	/* ---- each setting, switched off ---- */
	SFH5.store.rarityColors = false;
	SFH5.mark();
	check('rarity colors off: no row says a rarity, and the names are in the sheet\'s ink', !document.querySelector('[data-sfh-rarity]') && ink(title(character, 'sword')) === ink(title(character, 'rope')));
	check('and the grayed spell is still grayed', 'sfhUnprepared' in row(character, 'unready').dataset);
	SFH5.store.rarityColors = true;
	SFH5.store.grayUnprepared = false;
	SFH5.mark();
	check('graying off: no spell is grayed, and the colors are back', !document.querySelector('[data-sfh-unprepared]') && 'sfhRarity' in row(character, 'sword').dataset);
	SFH5.store.grayUnprepared = true;
	SFH5.mark();
	check('both on again: a sheet drawn twice is marked once, the same', row(character, 'sword').dataset.sfhRarity === 'rare' && row(character, 'bow').dataset.sfhRarity === 'veryrare' && 'sfhUnprepared' in row(character, 'unready').dataset);

	/* ---- another system ---- */
	for (const el of document.querySelectorAll('[data-sfh-rarity]')) delete el.dataset.sfhRarity;
	game.system.id = 'pf2e';
	SFH5.mark();
	check('in another system nothing is marked', !document.querySelector('[data-sfh-rarity]'));
	game.system.id = 'dnd5e';
	SFH5.mark();
	return out;
});

let failed = 0;
for (const r of results) {
	if (!r.ok) failed++;
	console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  ${r.detail}`}`);
}
if (errors.length) console.log('page errors:', errors);
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
