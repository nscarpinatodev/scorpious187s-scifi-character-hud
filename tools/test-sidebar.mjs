/*
 * Foundry's sidebar under every device and look (tools/harness-sidebar.html, Foundry 14's own markup
 * and stylesheet): the directories' folder rows read on the device's own folder color and on a color
 * the GM gave a folder; the folders' plus badge is lit in the device's color; Foundry's white
 * placeholder art has an ink tile behind it on a page, and nothing behind it on glass; entries read
 * on the panel; the Compendium's packs stay light on their banners; the Settings tab's headings fit
 * the sidebar; the chat's message modes keep their size and light the one in use; and a tab popped
 * out of the sidebar is the same panel in a window of its own.
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
await page.setViewport({ width: 1400, height: 820 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-sidebar.html`);
await page.waitForFunction(() => globalThis.SFH?.ready);

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DEVICES } = await import('../scripts/constants.mjs');

	// any CSS color, as the browser paints it: [r, g, b, a] in 0..255
	const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
	const rgba = (css) => {
		ctx.clearRect(0, 0, 1, 1);
		ctx.fillStyle = '#000';
		ctx.fillStyle = css;
		ctx.fillRect(0, 0, 1, 1);
		return [...ctx.getImageData(0, 0, 1, 1).data];
	};
	const lum = (css) => {
		const [r, g, b] = rgba(css).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};
	// a translucent color as it lands on what is under it
	const over = (top, under) => {
		const [t, u] = [rgba(top), rgba(under)];
		const k = t[3] / 255;
		return `rgb(${[0, 1, 2].map((i) => Math.round(t[i] * k + u[i] * (1 - k))).join(' ')})`;
	};
	const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
	const same = (a, b) => rgba(a).slice(0, 3).every((v, i) => Math.abs(v - rgba(b)[i]) <= 2);
	const css = (el, prop, pseudo) => getComputedStyle(el, pseudo)[prop];
	const token = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();

	// every device and look, and the two that have a dark interface, in the dark
	const wearing = [...Object.keys(DEVICES).map((id) => [id, false]), ['journal', true], ['grove', true]];
	const fails = {};
	const note = (what, id, detail) => ((fails[what] ??= []).push(detail === undefined ? id : `${id}: ${detail}`));

	for (const [id, dark] of wearing) {
		const label = dark ? `${id} (dark)` : id;
		SFH.wear(id);
		SFH.dark(dark);
		SFH.show('actors');
		await wait(650); // Foundry's buttons fade their colors in

		const tab = document.getElementById('actors');
		const panel = over(css(tab, 'backgroundColor'), '#10141a'); // over the map
		const [plain, colored] = tab.querySelectorAll('.directory-list > .folder > .folder-header');
		const plainBg = over(css(plain, 'backgroundColor'), over(panel, '#10141a'));
		const coloredBg = colored.style.backgroundColor;

		if (contrast(css(plain, 'color'), plainBg) < 4.5) note('folder names read on the folder row', label, contrast(css(plain, 'color'), plainBg).toFixed(2));
		if (contrast(css(colored, 'color'), coloredBg) < 4.5) note("folder names read on a GM's folder color", label, contrast(css(colored, 'color'), coloredBg).toFixed(2));
		for (const b of colored.querySelectorAll('.create-button')) {
			if (contrast(css(b, 'color'), coloredBg) < 3) note("a colored folder's buttons read on it", label, contrast(css(b, 'color'), coloredBg).toFixed(2));
			if (rgba(css(b, 'backgroundColor'))[3] > 10) note("a colored folder's buttons are not filled boxes", label, css(b, 'backgroundColor'));
		}
		const badge = plain.querySelector('.icon-plus');
		if (!same(css(badge, 'backgroundColor', '::after'), token('--sfh-hot'))) note("the folders' plus badge is the device's color", label, css(badge, 'backgroundColor', '::after'));
		if (contrast(css(badge, 'color', '::after'), css(badge, 'backgroundColor', '::after')) < 3) note('the plus reads on its badge', label);

		// PF2e's party row, in the system's own dark red
		const party = tab.querySelector('ol.parties header.active');
		const partyBg = css(party, 'backgroundColor');
		if (contrast(css(party.querySelector('.folder-name'), 'color'), partyBg) < 4.5) note("PF2e's party row reads on its red", label, contrast(css(party.querySelector('.folder-name'), 'color'), partyBg).toFixed(2));
		for (const b of party.querySelectorAll('button')) {
			if (contrast(css(b, 'color'), partyBg) < 3 || rgba(css(b, 'backgroundColor'))[3] > 10) note("its buttons are its lettering, not boxes", label, [css(b, 'color'), css(b, 'backgroundColor')]);
		}

		const thumb = tab.querySelector('img.thumbnail');
		const tile = css(thumb, 'backgroundColor');
		const page = lum(panel) > 0.4;
		if (page && (rgba(tile)[3] < 200 || lum(tile) > 0.2)) note("white placeholder art has an ink tile on a page", label, tile);
		if (!page && rgba(tile)[3] > 10) note('and nothing behind it on glass', label, tile);

		const name = tab.querySelector('.directory-item.entry .entry-name');
		if (contrast(css(name, 'color'), panel) < 4.5) note('entry names read on the panel', label, contrast(css(name, 'color'), panel).toFixed(2));

		SFH.show('playlists');
		await wait(50);
		const volumes = document.querySelector('#playlists .global-control > header');
		const band = over(css(volumes, 'backgroundColor'), over(css(document.getElementById('playlists'), 'backgroundColor'), '#10141a'));
		if (contrast(css(volumes, 'color'), band) < 4.5) note("the Playlists tab's own headers read", label, contrast(css(volumes, 'color'), band).toFixed(2));

		SFH.show('compendium');
		await wait(50);
		for (const pack of document.querySelectorAll('#compendium .compendium')) {
			if (lum(css(pack, 'color')) < 0.6) note("the packs' names stay light on their banners", label, css(pack, 'color'));
		}

		SFH.show('settings');
		await document.fonts.ready;
		SFH.fit();
		await wait(30);
		for (const h of document.querySelectorAll('#settings :is(h1, h4)')) {
			const r = document.createRange();
			r.selectNodeContents(h);
			const text = r.getBoundingClientRect();
			const box = h.getBoundingClientRect();
			if (text.left < box.left - 1 || text.right > box.right + 1) note("the Settings tab's headings fit the sidebar", label, h.textContent);
		}

		SFH.show('chat');
		await wait(50);
		const modes = [...document.querySelectorAll('#message-modes .ui-control')];
		if (modes.some((b) => Math.round(b.getBoundingClientRect().width) !== 32)) note('the message modes keep their size', label, modes.map((b) => b.getBoundingClientRect().width));
		const lit = modes.find((b) => b.getAttribute('aria-pressed') === 'true');
		// lit in the device's color, or inked in on a page: either way, not like the others
		const unlit = modes.find((b) => b !== lit);
		const looks = (b) => [css(b, 'borderTopColor'), css(b, 'backgroundColor'), css(b, 'color'), css(b, 'boxShadow')].join();
		if (!lit || looks(lit) === looks(unlit)) note('the message mode in use is lit', label);

		SFH.popout('actors');
		await wait(50);
		const win = document.querySelector('.sidebar-popout');
		if (css(win, 'backgroundColor') !== css(tab, 'backgroundColor')) note('a popped-out tab is the same panel', label, [css(win, 'backgroundColor'), css(tab, 'backgroundColor')]);
		if (!same(css(win, 'borderTopColor'), token('--sfh-line'))) note('framed in the device\'s line', label, css(win, 'borderTopColor'));
		const winFolder = win.querySelector('.folder > .folder-header');
		if (css(winFolder, 'boxShadow') === 'none') note('and its folders are dressed as the sidebar\'s', label);
		const winThumb = win.querySelector('img.thumbnail');
		if (css(winThumb, 'backgroundColor') !== tile) note('its art tiled as the sidebar\'s', label);
		win.remove();
	}

	const every = (what) => check(`${what}, on every device`, !fails[what], fails[what] ?? '');
	every('folder names read on the folder row');
	every("folder names read on a GM's folder color");
	every("a colored folder's buttons read on it");
	every("a colored folder's buttons are not filled boxes");
	every("the folders' plus badge is the device's color");
	every('the plus reads on its badge');
	every('white placeholder art has an ink tile on a page');
	every('and nothing behind it on glass');
	every('entry names read on the panel');
	every("PF2e's party row reads on its red");
	every("its buttons are its lettering, not boxes");
	every("the Playlists tab's own headers read");
	every("the packs' names stay light on their banners");
	every("the Settings tab's headings fit the sidebar");
	every('the message modes keep their size');
	every('the message mode in use is lit');
	every('a popped-out tab is the same panel');
	every("framed in the device's line");
	every("and its folders are dressed as the sidebar's");
	every("its art tiled as the sidebar's");
	const unknown = Object.keys(fails).filter((k) => !out.some((r) => r.name.startsWith(k)));
	check('no other failures', !unknown.length, unknown);
	check('pages and glass both covered', wearing.length >= 20, wearing.length);
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
