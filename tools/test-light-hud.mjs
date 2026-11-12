/*
 * The light interfaces, the Journal's paper, the Grove's and the Crystal's glass, against
 * Foundry's own token HUD (its markup from templates/hud/token-hud.hbs, its own stylesheet): its
 * pictured icons are inked in the palette's text color rather than left white on cream, its drawn
 * icons are dark enough to read on their buttons, a lit control keeps a light icon on the
 * Journal's red, and in the dark, or on a dark device, nothing is inked; the conditions a token
 * lacks are drawn strongly enough to make out, and the ones it has are ringed. Then the rest of a
 * light interface: what Foundry fades until it is pointed at stops fading while it can still be
 * read; the turn order's placeholder figure and condition marks are not white on cream; and in the
 * book, Paragon and Renegade are inked to read on the page, and a spent spell is struck out rather
 * than faded away. The Crystal core's glass is a page too: its lettering is a deep cyan that reads
 * on it, and the bright cyan is kept for what is lit, and for the tab's name over the map.
 * tools/scan-contrast.mjs measures all of it at once. Then the Journal's size
 * setting: the book opens as large as the room allows, and a lower setting makes it that much
 * smaller, still standing in the same place. A screenshot of each HUD is written to a folder if
 * one is given.
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
await page.setViewport({ width: 1600, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));
if (shotsTo) await page.exposeFunction('__shot', (name) => page.screenshot({ path: path.join(shotsTo, `token-hud-${name}.png`), clip: { x: 560, y: 260, width: 480, height: 300 } }));

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, Projection, store } = SFH;
	store.sequences = false;
	const icons = 'file:///C:/Program Files/Foundry Virtual Tabletop/resources/app/public/icons/svg';

	/* ---- Foundry's token HUD, over a token ---- */
	// where Foundry puts it, at the canvas's corner, above the interface the harness lays out
	document.getElementById('interface').insertAdjacentHTML('beforeend', `<div id="hud" style="left:0;top:0;z-index:100">
		<form id="token-hud" class="placeable-hud active" style="left:700px;top:330px;width:200px;height:200px">
			<div class="col left">
				<div class="attribute elevation"><i class="caret fa-solid fa-angle-up"></i><input type="text" name="elevation" value="0"></div>
				<button type="button" class="control-icon" data-action="sort"><i class="fa-solid fa-bring-forward"></i></button>
				<button type="button" class="control-icon active" data-action="locked"><i class="fa-solid fa-lock"></i></button>
				<button type="button" class="control-icon" data-action="config"><i class="fa-solid fa-gear"></i></button>
			</div>
			<div class="col middle">
				<div class="attribute bar2"><input type="text" name="bar2" value="12"></div>
				<div class="attribute bar1"><input type="text" name="bar1" value="40"></div>
			</div>
			<div class="col right">
				<button type="button" class="control-icon" data-action="visibility"><i class="fa-solid fa-eye"></i></button>
				<button type="button" class="control-icon" data-action="togglePalette" data-palette="effects"><img src="${icons}/aura.svg"></button>
				<button type="button" class="control-icon active" data-action="target"><img src="${icons}/target.svg"></button>
				<button type="button" class="control-icon" data-action="combat"><img src="${icons}/combat.svg"></button>
			</div>
			<div class="palette status-effects active" data-palette="effects" style="left:260px;top:0">
				<img class="effect-control" src="${icons}/blind.svg" data-status-id="blind">
				<img class="effect-control active" src="${icons}/skull.svg" data-status-id="dead">
			</div>
		</form></div>`);
	const th = document.getElementById('token-hud');
	const seen = th.querySelector('[data-action="sort"]').getBoundingClientRect();
	check('the HUD is on screen, over everything', document.elementFromPoint(seen.x + 5, seen.y + 5)?.closest('#token-hud') === th, [seen.x, seen.y]);
	const img = (sel) => th.querySelector(`${sel} img`);
	const filterOf = (el) => getComputedStyle(el).filter;
	// WCAG contrast, from computed colors
	const rgb = (c) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
	const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
	const contrast = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
	const wear = async (id, dark = false) => {
		await game.settings.set(null, 'device', id);
		document.body.dataset.sfhDark = dark ? 'on' : 'off';
		await wait(300);
	};

	for (const [id, dark, inked] of [['journal', false, true], ['grove', false, true], ['crystal', false, true], ['journal', true, false], ['grove', true, false], ['omni', false, false], ['vambrace', false, false]]) {
		await wear(id, dark);
		const tag = `${id}${dark ? ' in the dark' : ''}`;
		const plain = filterOf(img('[data-action="combat"]'));
		check(inked ? `${tag}: the pictured icons are inked` : `${tag}: the pictured icons are left white`, inked ? /sepia/.test(plain) : plain === 'none', plain);
		const button = th.querySelector('[data-action="sort"]');
		const ratio = contrast(getComputedStyle(button).color, getComputedStyle(document.body).getPropertyValue('--sfh-panel') || getComputedStyle(button).backgroundColor);
		const drawn = contrast(getComputedStyle(button).color, getComputedStyle(button).backgroundColor);
		check(`${tag}: a drawn icon reads on its button`, Math.max(ratio, drawn) >= 4.5, [getComputedStyle(button).color, getComputedStyle(button).backgroundColor, +drawn.toFixed(2)]);
		if (id === 'journal' && !dark) {
			check(`${tag}: a lit control's icon stays light on the red`, filterOf(img('.control-icon.active')) === 'none', filterOf(img('.control-icon.active')));
		}
		const [lacks, has] = [th.querySelector('.effect-control:not(.active)'), th.querySelector('.effect-control.active')];
		if (inked) {
			check(`${tag}: a condition the token lacks is drawn strongly enough to make out, and inked`, Number(getComputedStyle(lacks).opacity) >= 0.7 && /sepia/.test(filterOf(lacks)), [getComputedStyle(lacks).opacity, filterOf(lacks)]);
			check(`${tag}: one it has is at full strength and ringed`, getComputedStyle(has).opacity === '1' && getComputedStyle(has).boxShadow !== 'none', getComputedStyle(has).boxShadow);
		} else {
			check(`${tag}: the conditions are as Foundry draws them`, getComputedStyle(lacks).opacity === '0.5' && filterOf(lacks) === 'none' && getComputedStyle(has).boxShadow === 'none', [getComputedStyle(lacks).opacity, filterOf(lacks)]);
		}
		if (globalThis.__shot) await globalThis.__shot(tag.replace(/ /g, '-'));
	}
	document.body.dataset.sfhDark = 'off';
	document.getElementById('hud').remove();

	/* ---- what Foundry fades until it is pointed at ---- */
	const faded = ['#scene-controls', '#players', '#sidebar-tabs', '#scene-navigation'];
	for (const [id, dark, floor] of [['journal', false, 0.88], ['grove', false, 0.88], ['crystal', false, 0.88], ['journal', true, 0.4], ['grove', true, 0.4], ['omni', false, 0.4]]) {
		await wear(id, dark);
		// Foundry eases the fade: a quarter of a second's wait, then a quarter of a second
		await wait(700);
		const got = faded.map((sel) => Number(getComputedStyle(document.querySelector(sel)).opacity));
		check(`${id}${dark ? ' in the dark' : ''}: ${floor > 0.4 ? 'a faded control stops while its page can still be read' : 'a faded control fades as far as Foundry says'}`, got.every((o) => Math.abs(o - floor) < 0.01), got);
	}

	/* ---- the turn order ---- */
	const showTab = (tab) => { for (const el of document.querySelectorAll('#sidebar-content > .tab')) el.classList.toggle('active', el.dataset.tab === tab); };
	showTab('combat');
	const figure = () => document.querySelector('#combat .combat-tracker .token-image');
	const mark = () => document.querySelector('#combat .combat-tracker .token-effect');
	await wear('journal');
	check('journal: a token with no art has ink behind its white figure', lum(rgb(getComputedStyle(figure()).backgroundColor)) < 0.1, getComputedStyle(figure()).backgroundColor);
	check('journal: its condition marks are inked', /sepia/.test(filterOf(mark())), filterOf(mark()));
	await wear('journal', true);
	check('journal in the dark: the figure is on leather and the marks are left white', lum(rgb(getComputedStyle(figure()).backgroundColor)) < 0.1 && filterOf(mark()) === 'none', [getComputedStyle(figure()).backgroundColor, filterOf(mark())]);
	await wear('omni');
	check('omni: the marks are left white', filterOf(mark()) === 'none', filterOf(mark()));
	showTab('chat');
	document.body.dataset.sfhDark = 'off';

	/* ---- in the book ---- */
	hud.setPower(true, { silent: true });
	await wait(100);
	await wear('journal');
	await Projection.open();
	await wait(300);
	const stage = () => document.querySelector('#sfh-projection .sfh-stage');
	const page = 'rgb(236, 223, 192)';
	for (const key of ['paragon', 'renegade']) {
		const head = stage().querySelector(`.pr-${key} .pr-h`);
		check(`journal: ${key} is inked to read on the page`, head && contrast(getComputedStyle(head).color, page) >= 4.5, head && [getComputedStyle(head).color, +contrast(getComputedStyle(head).color, page).toFixed(2)]);
	}
	stage().querySelector('[data-act="tab"][data-k="spellcasting"]').click();
	await wait(200);
	const spent = stage().querySelector('.li.spent .nm');
	const thin = (el) => { let o = 1; for (let e = el; e && e !== stage(); e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };
	check('journal: a spent spell is struck out in ink that reads, not faded away', spent && thin(spent) === 1 && /line-through/.test(getComputedStyle(spent).textDecorationLine)
		&& contrast(getComputedStyle(spent).color, page) >= 4.5, spent && [thin(spent), getComputedStyle(spent).textDecorationLine, getComputedStyle(spent).color]);
	const prompt = stage().querySelector('input.sfh-in[placeholder]');
	check('journal: a field\'s prompt is in the label ink', !prompt || contrast(getComputedStyle(prompt, '::placeholder').color, page) >= 4.5, prompt && getComputedStyle(prompt, '::placeholder').color);
	await wear('omni');
	await wait(200);
	stage().querySelector('[data-act="tab"]').click();
	await wait(200);
	const blue = stage().querySelector('.pr-paragon .pr-h');
	check('omni: Paragon keeps its blue, and a spent spell still fades', getComputedStyle(blue).color === 'rgb(74, 168, 255)', getComputedStyle(blue).color);

	/* ---- on the Crystal core's glass ---- */
	await wear('crystal');
	await wait(300);
	// the glass at its darkest, under a tinted cell
	const glass = 'rgb(195, 227, 240)';
	const lit = 'rgb(10, 156, 200)';
	const reads = (el) => el && contrast(getComputedStyle(el).color, glass) >= 4.5;
	const inkOf = (el) => el && [getComputedStyle(el).color, +contrast(getComputedStyle(el).color, glass).toFixed(2)];
	for (const [what, sel] of [['a heading', '.proj-t'], ['a label', '.kv .lbl'], ['a small button', '.b.sm.ghost'], ['Paragon', '.pr-paragon .pr-h'], ['Renegade', '.pr-renegade .pr-h'], ['the source line', '.src']]) {
		const el = stage().querySelector(sel);
		check(`crystal: ${what} is in ink that reads on the glass`, reads(el) && thin(el) === 1, inkOf(el));
	}
	const pip = stage().querySelector(':is(.pip, .seg).on:not(.bad)');
	check('crystal: a lit pip keeps the bright cyan', pip && getComputedStyle(pip).backgroundColor === lit, pip && getComputedStyle(pip).backgroundColor);
	const tabName = stage().querySelector('.navlbl');
	check('crystal: the tab name, over the map, keeps the bright cyan', tabName && getComputedStyle(tabName).color === lit, tabName && getComputedStyle(tabName).color);
	stage().querySelector('[data-act="tab"][data-k="spellcasting"]').click();
	await wait(200);
	const used = stage().querySelector('.li.spent .nm');
	check('crystal: a spent spell is struck out in ink that reads, not faded away', used && thin(used) === 1 && /line-through/.test(getComputedStyle(used).textDecorationLine) && reads(used), used && [thin(used), getComputedStyle(used).textDecorationLine, ...inkOf(used)]);
	// a variable's color as the browser paints it
	const painted = (name) => { const probe = document.body.appendChild(document.createElement('i')); probe.style.color = `var(${name})`; const c = getComputedStyle(probe).color; probe.remove(); return c; };
	const [hot, onHot] = [painted('--sfh-hot'), painted('--sfh-on-hot')];
	check('crystal: the interface letters in the deep cyan, and white on a fill of it', contrast(hot, glass) >= 4.5 && contrast(onHot, hot) >= 4.5, [hot, onHot]);
	const pageNo = document.querySelector('#sfh-deck .hotbar-page-number');
	check('crystal: the macro bar page number is navy on the band', !pageNo || getComputedStyle(pageNo).color === 'rgb(24, 54, 80)', pageNo && getComputedStyle(pageNo).color);
	await wear('omni');
	await wait(200);
	Projection.close?.();
	await wait(200);

	/* ---- the Journal's size ---- */
	hud.setPower(true, { silent: true });
	await wait(100);
	await game.settings.set(null, 'device', 'journal');
	await wait(300);
	await Projection.open();
	await wait(300);
	const board = () => document.querySelector('#sfh-projection .sfh-board');
	const scaleOf = () => Number(board().style.transform.match(/scale\(([\d.]+)\)/)?.[1]);
	check('the Journal opens at its full size by default', store.journalScale === 100 && Projection.lastFit.limitedBy !== 'size setting', [store.journalScale, Projection.lastFit.limitedBy]);
	const full = scaleOf();
	const fullBox = board().getBoundingClientRect();
	await game.settings.set(null, 'journalScale', 60);
	await wait(300);
	const small = scaleOf();
	const smallBox = board().getBoundingClientRect();
	check('at 60 it is three fifths the size', Math.abs(small / full - 0.6) < 0.01, [full, small]);
	check('and says the setting is why', Projection.lastFit.limitedBy === 'size setting' && Projection.lastFit.share === 0.6, Projection.lastFit);
	check('standing where it stood, centered over the satchel', Math.abs(smallBox.bottom - fullBox.bottom) < 1.5 && Math.abs((smallBox.left + smallBox.right) / 2 - (fullBox.left + fullBox.right) / 2) < 1.5, [fullBox.bottom, smallBox.bottom]);
	await game.settings.set(null, 'device', 'omni');
	await wait(300);
	const omni = scaleOf();
	await game.settings.set(null, 'journalScale', 100);
	await wait(300);
	check('the omni-tool does not follow it', Math.abs(scaleOf() - omni) < 0.001, [omni, scaleOf()]);
	await game.settings.set(null, 'device', 'grove');
	await wait(300);
	const grove = scaleOf();
	await game.settings.set(null, 'journalScale', 50);
	await wait(300);
	check('the Grove does', Math.abs(scaleOf() / grove - 0.5) < 0.01, [grove, scaleOf()]);
	await game.settings.set(null, 'journalScale', 100);
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
