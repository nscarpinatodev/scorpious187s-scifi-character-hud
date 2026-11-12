/*
 * D&D 5e's sheet tabs as a labeled row, on stand-ins for the system's character, NPC and vehicle
 * sheets under Foundry's stylesheet and the system's own (tools/harness-sheet5e.html).
 *
 * Off, which is the default, nothing is touched: the tabs hang outside the sheet as the system has
 * them. On, they lie in a row inside the sheet, under its header and over its body, each with its
 * name and none over another; the character's ability scores are set down under the row, clear of
 * it and of the Details tab, on a narrow sheet and a wide one, with optional abilities and without;
 * a row too long for its sheet scrolls, with an arrow only at the end that has more, and the open
 * tab is kept in view; a redrawn tabs part is dressed again; and switching it off puts everything
 * back where it was. It stands down for Carolingian UI's own tab row, and in any other system.
 * A screenshot of each state is written to a folder if one is given.
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
await page.setViewport({ width: 1900, height: 1600 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-sheet5e.html`);
await new Promise((r) => setTimeout(r, 900));
if (shotsTo) await page.exposeFunction('__shot', (name) => page.screenshot({ path: path.join(shotsTo, `sheet-tabs-${name}.png`) }));

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const shot = async (name) => { if (globalThis.__shot) await globalThis.__shot(name); };
	const box = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
	const round = (b) => [b.l, b.t, b.r, b.b].map(Math.round);
	const meets = (a, b) => a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5;
	const inside = (a, b, by = 0.5) => a.l >= b.l - by && a.r <= b.r + by && a.t >= b.t - by && a.b <= b.b + by;
	const sheets = () => ['character', 'npc', 'vehicle'].map((k) => document.getElementById(`sheet-${k}`));
	const nav = (sheet) => sheet.querySelector('nav.tabs');
	const tabs = (sheet) => [...nav(sheet).querySelectorAll(':scope > .item')];
	const scores = (sheet) => [...sheet.querySelectorAll('.ability-scores .ability-score')];
	const [character, npc, vehicle] = sheets();
	const before = Object.fromEntries(sheets().map((s) => [s.id, { nav: box(nav(s)), body: box(s.querySelector('.sheet-body')), scores: scores(s).map(box) }]));

	/* ---- off, as it comes ---- */
	check('the setting is off until it is asked for', SFH5.store.sheetTabs === false && document.body.dataset.sfhSheetTabs === 'off', document.body.dataset.sfhSheetTabs);
	for (const s of sheets()) {
		check(`${s.id}, off: the tabs hang outside the sheet, untouched`, nav(s).classList.contains('tabs-right') && before[s.id].nav.l >= box(s).r - 2
			&& !nav(s).querySelector('.sfh-tab-label, .sfh-tab-step') && tabs(s).every((t) => 'tooltip' in t.dataset), round(before[s.id].nav));
	}
	await shot('off');

	/* ---- on ---- */
	SFH5.set(true);
	await wait(200);
	check('on: the body carries the switch', document.body.dataset.sfhSheetTabs === 'on', document.body.dataset.sfhSheetTabs);
	for (const s of sheets()) {
		const n = box(nav(s));
		const list = tabs(s);
		check(`${s.id}: the row lies inside the sheet`, inside(n, box(s)) && n.h >= 30 && n.h <= 40, [round(n), round(box(s))]);
		check(`${s.id}: the side it hung on is put away, so the sheet is not held off the screen's edge`, !nav(s).matches('.tabs-right, .tabs-left') && nav(s).dataset.sfhSide === 'tabs-right', nav(s).className);
		check(`${s.id}: every tab is named, as its label has it`, list.length > 3 && list.every((t) => t.querySelector('.sfh-tab-label')?.textContent === t.getAttribute('aria-label')), list.map((t) => t.textContent.trim()));
		check(`${s.id}: the tooltips that repeated the names are put away`, list.every((t) => !('tooltip' in t.dataset) && 'sfhTooltip' in t.dataset));
		const boxes = list.map(box);
		check(`${s.id}: the tabs stand side by side, none over another, in the row`, boxes.every((b, i) => inside(b, n, 1) && (i === 0 || b.l >= boxes[i - 1].r - 0.5)), boxes.map(round));
		check(`${s.id}: a name fits its tab`, list.every((t) => { const l = box(t.querySelector('.sfh-tab-label')); return inside(l, box(t), 1); }));
		check(`${s.id}: the row fits the sheet as it opens, so no arrow shows`, nav(s).scrollWidth <= nav(s).clientWidth + 1 && [...nav(s).querySelectorAll('.sfh-tab-step')].every((b) => b.hidden && getComputedStyle(b).display === 'none'), [nav(s).scrollWidth, nav(s).clientWidth]);
		const body = box(s.querySelector('.sheet-body'));
		check(`${s.id}: the body starts under the row`, body.t >= n.b - 0.5 && body.t <= n.b + 12, [round(n), round(body)]);
	}
	for (const s of [character, npc]) {
		const header = box(s.querySelector('.sheet-header'));
		const n = box(nav(s));
		check(`${s.id}: the row is under the header, as wide as the sheet`, n.t >= header.b - 0.5 && n.t <= header.b + 12 && n.w >= box(s).w - 4, [round(header), round(n)]);
	}
	{
		const n = box(nav(vehicle));
		const side = box(vehicle.querySelector('.sheet-sidebar'));
		const stations = box(vehicle.querySelector('.sheet-stations'));
		const body = box(vehicle.querySelector('.sheet-body'));
		check('vehicle: the row is over the body, and the columns beside it run the full height', Math.abs(n.l - body.l) < 1 && Math.abs(n.r - body.r) < 1
			&& side.r <= n.l + 0.5 && stations.r <= n.l + 0.5 && Math.abs(side.b - body.b) < 1 && Math.abs(side.t - n.t) < 1, [round(n), round(body), round(side), round(stations)]);
		vehicle.classList.remove('has-stations');
		await wait(50);
		const [n2, body2, side2] = [box(nav(vehicle)), box(vehicle.querySelector('.sheet-body')), box(vehicle.querySelector('.sheet-sidebar'))];
		check('vehicle with no stations: the same, over the one column left', Math.abs(n2.l - body2.l) < 1 && side2.r <= n2.l + 0.5 && body2.t >= n2.b - 0.5, [round(n2), round(body2), round(side2)]);
		vehicle.classList.add('has-stations');
	}
	await shot('on');

	/* ---- the character's ability scores ---- */
	const scoresClear = (tag) => {
		const n = box(nav(character));
		const header = box(character.querySelector('.sheet-header'));
		const content = box(character.querySelector('.tab.details'));
		const all = scores(character);
		const low = all.filter((el) => !el.closest('.top') || box(el).t >= n.b);
		const high = all.filter((el) => !low.includes(el));
		check(`${tag}: no score lies on the row`, all.every((el) => !meets(box(el), n)), all.map((el) => round(box(el))));
		check(`${tag}: the six are under the row, and the Details tab starts under them`, low.length >= 6 && low.every((el) => box(el).t >= n.b + 2 && box(el).b <= content.t - 6), [round(n), round(content), low.map((el) => round(box(el)))]);
		check(`${tag}: any score the system hangs in the header is still in it`, high.every((el) => inside(box(el), header, 1)), high.map((el) => round(box(el))));
	};
	scoresClear('character');
	const rebuild = async (width, optional) => {
		document.getElementById('sheet-character').remove();
		document.body.insertAdjacentHTML('afterbegin', SFH5.builders.character('sheet-character', `left:20px;top:20px;width:${width}px;height:860px`, { optional }));
		SFH5.applySheetTabs();
		await wait(150);
	};
	await rebuild(800, 2);
	Object.assign(globalThis, { __c: document.getElementById('sheet-character') });
	const c2 = () => document.getElementById('sheet-character');
	{
		// the helpers above closed over the first sheet; look the new one up
		const n = box(nav(c2()));
		const header = box(c2().querySelector('.sheet-header'));
		const content = box(c2().querySelector('.tab.details'));
		const top = [...c2().querySelectorAll('.ability-scores .top .ability-score')];
		const bottom = [...c2().querySelectorAll('.ability-scores .bottom .ability-score')];
		check('two optional abilities, narrow: they stay hung in the header', top.length === 2 && top.every((el) => inside(box(el), header, 1) && !meets(box(el), n)), top.map((el) => round(box(el))));
		check('two optional abilities, narrow: the six are under the row, clear of the tab', bottom.length === 6 && bottom.every((el) => box(el).t >= n.b + 2 && box(el).b <= content.t - 6), [round(n), round(content), bottom.map((el) => round(box(el)))]);
		await shot('optional-narrow');
	}
	await rebuild(1200, 2);
	{
		const n = box(nav(c2()));
		const content = box(c2().querySelector('.tab.details'));
		const all = [...c2().querySelectorAll('.ability-scores .ability-score')];
		const row = new Set(all.map((el) => Math.round(box(el).t)));
		check('two optional abilities, wide: all eight in the one row, under the tab row and clear of the tab', all.length === 8 && row.size === 1 && all.every((el) => box(el).t >= n.b + 2 && box(el).b <= content.t - 6), [round(n), round(content), [...row]]);
		await shot('optional-wide');
	}
	await rebuild(800, 0);
	const sheet = c2();

	/* ---- the system's own tab handling still drives it ---- */
	tabs(sheet).find((t) => t.dataset.tab === 'inventory').click();
	await wait(60);
	check('a click on a tab is the system\'s: the tab lights and the sheet is told', nav(sheet).querySelector('.item.active')?.dataset.tab === 'inventory' && sheet.classList.contains('tab-inventory'));
	const lit = nav(sheet).querySelector('.item.active');
	check('the lit tab is the system\'s gold, its name dark on it', getComputedStyle(lit).backgroundColor !== 'rgba(0, 0, 0, 0)' && getComputedStyle(lit.querySelector('.sfh-tab-label')).color === getComputedStyle(lit).color, [getComputedStyle(lit).backgroundColor, getComputedStyle(lit).color]);
	tabs(sheet).find((t) => t.dataset.tab === 'details').click();
	await wait(60);

	/* ---- a row too long for its sheet ---- */
	nav(sheet).style.maxWidth = '420px';
	await wait(150);
	const n = nav(sheet);
	const [earlier, later] = ['earlier', 'later'].map((k) => n.querySelector(`.sfh-tab-step.${k}`));
	const shown = (b) => !b.hidden && getComputedStyle(b).display !== 'none';
	check('too long: it scrolls, and only the far end has an arrow', n.scrollWidth > n.clientWidth + 1 && n.classList.contains('sfh-overflows') && !shown(earlier) && shown(later), [n.scrollWidth, n.clientWidth, earlier.hidden, later.hidden]);
	check('its first tab is at the near end, in view', box(tabs(sheet)[0]).l >= box(n).l - 0.5 && n.scrollLeft === 0, [round(box(tabs(sheet)[0])), round(box(n))]);
	check('the arrow lies at the row\'s edge, over it', Math.abs(box(later).r - box(n).r) < 2 && box(later).t >= box(n).t - 0.5 && box(later).b <= box(n).b + 0.5, [round(box(later)), round(box(n))]);
	await shot('too-long');
	later.click();
	await wait(700);
	check('the arrow turns the row, and now the near end has one too', n.scrollLeft > 50 && shown(earlier), [n.scrollLeft, earlier.hidden]);
	n.scrollLeft = n.scrollWidth;
	await wait(120);
	check('at the far end, only the near arrow is left', shown(earlier) && !shown(later), [n.scrollLeft, n.scrollWidth - n.clientWidth]);
	check('and it lies at the row\'s near edge', Math.abs(box(earlier).l - box(n).l) < 2, [round(box(earlier)), round(box(n))]);
	await shot('too-long-far-end');
	n.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true, cancelable: true }));
	await wait(120);
	check('the wheel turns it too', n.scrollLeft < n.scrollWidth - n.clientWidth - 100, n.scrollLeft);
	n.scrollLeft = 0;
	await wait(120);
	const last = tabs(sheet).at(-1);
	last.click();
	await wait(200);
	check('opening a tab at the far end brings the whole of it into view', box(last).r <= box(n).r + 0.5 && box(last).l >= box(n).l - 0.5 && n.scrollLeft > 0, [round(box(last)), round(box(n))]);

	/* ---- the system redraws its tabs part ---- */
	SFH5.redrawTabs(sheet);
	await wait(150);
	const fresh = nav(sheet);
	fresh.style.maxWidth = '420px';
	await wait(150);
	check('a redrawn tabs part is dressed again', fresh !== n && !fresh.classList.contains('tabs-right') && tabs(sheet).every((t) => t.querySelector('.sfh-tab-label')) && fresh.querySelectorAll('.sfh-tab-step').length === 2);
	SFH5.dressSheet(sheet);
	check('and dressing it twice adds nothing twice', tabs(sheet).every((t) => t.querySelectorAll('.sfh-tab-label').length === 1) && fresh.querySelectorAll('.sfh-tab-step').length === 2);
	fresh.style.maxWidth = '';
	tabs(sheet).find((t) => t.dataset.tab === 'details').click();
	await wait(100);

	/* ---- off again ---- */
	SFH5.set(false);
	// the system eases its tabs' margins back over a quarter of a second
	await wait(500);
	check('off again: the body says so', document.body.dataset.sfhSheetTabs === 'off');
	for (const s of [sheet, npc, vehicle]) {
		const was = before[s.id];
		const now = box(nav(s));
		check(`${s.id}: the tabs are back outside, as the system has them`, nav(s).classList.contains('tabs-right') && !nav(s).dataset.sfhSide && !nav(s).querySelector('.sfh-tab-label, .sfh-tab-step')
			&& !nav(s).classList.contains('sfh-tab-row') && tabs(s).every((t) => 'tooltip' in t.dataset && !('sfhTooltip' in t.dataset))
			&& Math.abs(now.l - was.nav.l) < 1 && Math.abs(now.t - was.nav.t) < 1 && Math.abs(now.h - was.nav.h) < 1, [round(was.nav), round(now)]);
		const body = box(s.querySelector('.sheet-body'));
		check(`${s.id}: the body is where it was`, Math.abs(body.t - was.body.t) < 1 && Math.abs(body.h - was.body.h) < 1, [round(was.body), round(body)]);
	}
	check('the ability scores are back across the foot of the header', scores(sheet).every((el, i) => Math.abs(box(el).t - before['sheet-character'].scores[i].t) < 1), scores(sheet).map((el) => round(box(el))));

	/* ---- standing down ---- */
	document.body.classList.add('crlngn-sheet-tabs');
	SFH5.set(true);
	await wait(150);
	check('where Carolingian UI lays the tabs out itself, this leaves them alone', document.body.dataset.sfhSheetTabs === 'off' && nav(npc).classList.contains('tabs-right') && !nav(npc).querySelector('.sfh-tab-label'));
	document.body.classList.remove('crlngn-sheet-tabs');
	SFH5.set(false);
	game.system.id = 'pf2e';
	delete document.body.dataset.sfhSheetTabs;
	SFH5.set(true);
	await wait(150);
	check('in another system nothing is done at all', document.body.dataset.sfhSheetTabs === undefined && nav(npc).classList.contains('tabs-right') && !nav(npc).querySelector('.sfh-tab-label'));
	game.system.id = 'dnd5e';
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
