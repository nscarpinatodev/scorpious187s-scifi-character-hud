/*
 * D&D 5e's Compendium Browser tabs as a labeled row, on stand-ins for the browser under Foundry's
 * stylesheet and the system's own (tools/harness-browser5e.html): the basic set of tabs, the
 * Advanced set with a selection footer, one locked to a single kind of thing (no tabs at all), and
 * one at the system's narrowest width.
 *
 * Off, which is the default, nothing is touched: the tabs hang outside the window's left edge as
 * the system has them. On, they lie in a row across the top of the window's body, over the search
 * and the results, each with its name and none over another, in either theme; the basic set fits
 * the browser at the size it opens at, and at its narrowest the row scrolls; the window's own
 * controls and the Advanced toggle can still be clicked; a tabs part redrawn by the Advanced
 * toggle is dressed again; a browser with no tabs keeps its layout; and switching it off puts
 * everything back. A screenshot of each state is written to a folder if one is given.
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
await page.setViewport({ width: 1900, height: 1500 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-browser5e.html`);
await new Promise((r) => setTimeout(r, 1200));
if (shotsTo) await page.exposeFunction('__shot', (name) => page.screenshot({ path: path.join(shotsTo, `browser-tabs-${name}.png`) }));

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const shot = async (name) => { if (globalThis.__shot) await globalThis.__shot(name); };
	const box = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
	const round = (b) => [b.l, b.t, b.r, b.b].map(Math.round);
	const meets = (a, b) => a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5;
	const inside = (a, b, by = 0.5) => a.l >= b.l - by && a.r <= b.r + by && a.t >= b.t - by && a.b <= b.b + by;
	const app = (k) => document.getElementById(`browser-${k}`);
	const [basic, advanced, locked, narrow] = ['basic', 'advanced', 'locked', 'narrow'].map(app);
	const all = [basic, advanced, locked, narrow];
	const withTabs = [basic, advanced, narrow];
	const nav = (a) => a.querySelector('nav.tabs');
	const tabs = (a) => [...nav(a).querySelectorAll(':scope > .item')];
	const part = (a, name) => a.querySelector(`.window-content > ${name}`);
	const struck = (el) => { const b = el.getBoundingClientRect(); return document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); };
	const reached = (el) => { const hit = struck(el); return hit === el || el.contains(hit); };
	const said = (el) => { const hit = struck(el); return hit && `${hit.tagName.toLowerCase()}.${String(hit.className).split(' ').slice(0, 2).join('.')}`; };
	const controls = (a) => [...a.querySelectorAll('.window-header .header-control, .mode-toggle slide-toggle, .window-content input[name="name"]')];
	const shown = (b) => !!b && !b.hidden && getComputedStyle(b).display !== 'none';
	const rgb = (c) => c.match(/[\d.]+/g).map(Number);
	const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((t, v, i) => t + v * [0.2126, 0.7152, 0.0722][i], 0);
	const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
	const THEMES = ['theme-light', 'theme-dark'];
	const theme = async (name) => { for (const a of all) { a.classList.remove(...THEMES); a.classList.add(name); } await wait(120); };
	const layout = (a) => ({ sidebar: box(part(a, '.sidebar')), results: box(part(a, '.results')), footer: box(part(a, '.footer')) });
	const before = Object.fromEntries(all.map((a) => [a.id, { nav: box(nav(a)), ...layout(a) }]));

	/* ---- off, as it comes ---- */
	check('the setting is off until it is asked for', SFH5.store.sheetTabs === false && document.body.dataset.sfhSheetTabs === 'off', document.body.dataset.sfhSheetTabs);
	for (const a of withTabs) {
		check(`${a.id}, off: the tabs hang outside the window's left edge, untouched`, nav(a).classList.contains('tabs-left') && before[a.id].nav.r <= box(a).l + 2
			&& !nav(a).querySelector('.sfh-tab-label, .sfh-tab-step') && tabs(a).every((t) => 'tooltip' in t.dataset), round(before[a.id].nav));
	}
	await shot('off');

	/* ---- on ---- */
	for (const name of THEMES) {
		await theme(name);
		SFH5.set(true);
		await wait(200);
		check(`${name}: the body carries the switch`, document.body.dataset.sfhSheetTabs === 'on');
		for (const a of withTabs) {
			const n = box(nav(a));
			const content = box(a.querySelector('.window-content'));
			const { sidebar, results, footer } = layout(a);
			const list = tabs(a);
			const tag = `${name}, ${a.id}`;
			check(`${tag}: the row lies across the top of the window's body, wall to wall`, Math.abs(n.t - content.t) < 1 && Math.abs(n.l - content.l) < 1 && Math.abs(n.r - content.r) < 1 && n.h >= 30 && n.h <= 40, [round(n), round(content)]);
			check(`${tag}: under the window's title, not over it`, n.t >= box(a.querySelector('.window-header')).b - 0.5, [round(n), round(box(a.querySelector('.window-header')))]);
			check(`${tag}: the search and the results lie under the row, beside each other as before`, sidebar.t >= n.b - 0.5 && results.t >= n.b - 0.5 && !meets(sidebar, n) && !meets(results, n)
				&& Math.abs(sidebar.w - before[a.id].sidebar.w) < 1 && Math.abs(results.l - before[a.id].results.l) < 1, [round(n), round(sidebar), round(results)]);
			check(`${tag}: the footer stays under the results, inside the window`, Math.abs(footer.l - results.l) < 1 && footer.t >= results.b - 0.5 && inside(footer, box(a), 1) && Math.abs(footer.h - before[a.id].footer.h) < 1, [round(footer), round(results)]);
			check(`${tag}: the side it hung on is put away`, !nav(a).matches('.tabs-left, .tabs-right') && nav(a).dataset.sfhSide === 'tabs-left', nav(a).className);
			check(`${tag}: every tab is named, as its label has it`, list.length >= 2 && list.every((t) => t.querySelector('.sfh-tab-label')?.textContent === t.getAttribute('aria-label')), list.map((t) => t.textContent.trim()));
			check(`${tag}: the tooltips that repeated the names are put away`, list.every((t) => !('tooltip' in t.dataset) && 'sfhTooltip' in t.dataset));
			const boxes = list.map(box);
			check(`${tag}: the tabs stand side by side, none over another, in the row`, boxes.every((b, i) => inside(b, n, 1) || (a === narrow && b.t >= n.t - 1 && b.b <= n.b + 1)) && boxes.every((b, i) => i === 0 || b.l >= boxes[i - 1].r - 0.5), boxes.map(round));
			const icons = list.map((t) => t.querySelector('i, dnd5e-icon')).filter(Boolean).map(box);
			check(`${tag}: the icons are drawn at the sheets' size`, icons.length === list.length && icons.every((b) => b.w <= 16.5 && b.h <= 16.5), icons.map((b) => [Math.round(b.w), Math.round(b.h)]));
			const missed = [...controls(a), ...tabs(a).filter((t) => box(t).r <= n.r - 30)].filter((el) => !reached(el));
			check(`${tag}: its controls, the Advanced toggle, the search and the tabs can all be clicked`, !missed.length, missed.map(said));
		}
		// the row has no ground of its own, in either theme: the browser's background shows through it, and
		// every name is read on that. Measured from the system's own textures, the worst of each is the
		// darkest grain of the light paper, rgb(203, 203, 203), and the lightest thread of the dark denim
		// as Foundry lays it on the system's dark gray, rgb(30, 30, 30)
		const BEHIND = name === 'theme-light' ? [203, 203, 203] : [30, 30, 30];
		for (const a of withTabs) {
			const ground = rgb(getComputedStyle(nav(a)).backgroundColor);
			check(`${name}, ${a.id}: the row is see-through, the browser's background showing`, ground[3] === 0, ground);
			const under = (t) => { const fill = rgb(getComputedStyle(t).backgroundColor); return fill[3] !== 0 ? fill : BEHIND; };
			const worst = Math.min(...tabs(a).map((t) => contrast(rgb(getComputedStyle(t).color), under(t))));
			check(`${name}, ${a.id}: every tab's name can be read, open or not`, worst >= 4.5, +worst.toFixed(2));
		}
		check(`${name}: the basic set fits the browser at the size it opens at, so no arrow shows`, nav(basic).scrollWidth <= nav(basic).clientWidth + 1
			&& [...nav(basic).querySelectorAll('.sfh-tab-step')].every((b) => !shown(b)), [nav(basic).scrollWidth, nav(basic).clientWidth]);
		await shot(`on-${name}`);
		SFH5.set(false);
		await wait(120);
	}
	await theme('theme-light');
	SFH5.set(true);
	await wait(200);

	/* ---- a browser with no theme of its own takes the game's ---- */
	{
		// a tab that is not open is named in the darker gold in the light, the system's gold in the dark
		const ground = () => rgb(getComputedStyle(tabs(basic).find((t) => !t.classList.contains('active'))).color).join();
		basic.classList.remove('themed', ...THEMES);
		document.body.classList.replace('theme-dark', 'theme-light');
		await wait(80);
		const light = ground();
		document.body.classList.replace('theme-light', 'theme-dark');
		await wait(80);
		const dark = ground();
		basic.classList.add('themed', 'theme-light');
		await wait(80);
		check("a browser with no theme of its own follows the game's: the darker gold in the light, the system's own in the dark", light === '95,82,54' && dark !== light, [light, dark]);
	}

	/* ---- at its narrowest ---- */
	{
		const n = nav(narrow);
		const [earlier, later] = ['earlier', 'later'].map((k) => n.querySelector(`.sfh-tab-step.${k}`));
		check('at its narrowest the row scrolls, and only the far end has an arrow', n.scrollWidth > n.clientWidth + 1 && !shown(earlier) && shown(later), [n.scrollWidth, n.clientWidth]);
		later?.click();
		await wait(700);
		check('the arrow turns the row, and now the near end has one too', n.scrollLeft > 50 && shown(earlier), n.scrollLeft);
		n.scrollLeft = 0;
		await wait(80);
	}

	/* ---- a tab clicked ---- */
	{
		const spells = tabs(basic).find((t) => t.dataset.tab === 'spells');
		spells.click();
		await wait(60);
		check('a click on a tab is the system\'s, and lights it', spells.classList.contains('active') && tabs(basic).filter((t) => t.classList.contains('active')).length === 1);
	}

	/* ---- the Advanced toggle redraws the tabs part ---- */
	{
		const old = nav(basic);
		SFH5.toggleMode(basic, true);
		await wait(80);
		const fresh = nav(basic);
		check('the Advanced set, drawn anew, is dressed again', fresh !== old && !fresh.matches('.tabs-left') && tabs(basic).length === 2 && tabs(basic).every((t) => t.querySelector('.sfh-tab-label')) && fresh.querySelectorAll('.sfh-tab-step').length === 2, tabs(basic).map((t) => t.textContent.trim()));
		check('and lies where the basic set lay', Math.abs(box(fresh).t - box(basic.querySelector('.window-content')).t) < 1 && tabs(basic).every(reached));
		SFH5.dressSheet(basic);
		check('and dressing it twice adds nothing twice', tabs(basic).every((t) => t.querySelectorAll('.sfh-tab-label').length === 1) && fresh.querySelectorAll('.sfh-tab-step').length === 2);
		SFH5.toggleMode(basic, false);
		await wait(80);
	}

	/* ---- locked to one kind of thing: no tabs, no row ---- */
	{
		const { sidebar, results } = layout(locked);
		check('a browser with no tabs keeps its layout: no row, nothing moved', getComputedStyle(nav(locked)).display === 'none' && !nav(locked).classList.contains('sfh-tab-row')
			&& Math.abs(sidebar.t - before[locked.id].sidebar.t) < 1 && Math.abs(results.t - before[locked.id].results.t) < 1 && Math.abs(results.h - before[locked.id].results.h) < 1, [round(sidebar), round(before[locked.id].sidebar)]);
	}
	await shot('on-details');

	/* ---- off again ---- */
	SFH5.set(false);
	await wait(200);
	check('off again: the body says so', document.body.dataset.sfhSheetTabs === 'off');
	for (const a of all) {
		const now = { nav: box(nav(a)), ...layout(a) };
		check(`${a.id}: everything is back where it was`, ['sidebar', 'results', 'footer'].every((k) => round(now[k]).join() === round(before[a.id][k]).join()), ['sidebar', 'results', 'footer'].map((k) => [round(now[k]), round(before[a.id][k])]));
		if (a === locked) continue;
		check(`${a.id}: the tabs are back outside, as the system has them`, nav(a).classList.contains('tabs-left') && !nav(a).dataset.sfhSide && !nav(a).querySelector('.sfh-tab-label, .sfh-tab-step')
			&& tabs(a).every((t) => 'tooltip' in t.dataset && !('sfhTooltip' in t.dataset)) && now.nav.r <= box(a).l + 2, round(now.nav));
		check(`${a.id}: its controls can still be clicked`, controls(a).every(reached), controls(a).filter((el) => !reached(el)).map(said));
	}
	await shot('off-again');
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
