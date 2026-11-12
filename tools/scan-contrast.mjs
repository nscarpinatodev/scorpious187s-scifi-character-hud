/*
 * Run-through of the interface under a device or look, for text that cannot be read: every tab of
 * the sidebar and a tab popped out of it (tools/harness-sidebar.html), and the game view with its
 * controls, players, scene list, chat, turn order, macro bar and the projection on each of its
 * tabs (tools/harness-device.html). Every piece of text, every icon drawn as a glyph and every
 * field is measured against what is really behind it: the page is photographed with its text
 * hidden, and the color under each piece is read from the photograph, so paper grain, gradients,
 * see-through panels and the map behind them all count. The text's own color is its computed one,
 * thinned by any opacity above it.
 *
 * Lists what falls under WCAG's 4.5:1 (3:1 for large text), worst first, the same text in the same
 * place on many views once. Exits 1 if anything is under 3:1, which nobody can read. Lettering over
 * a picture (a pack's banner, a token's art) is listed apart and not counted: its shadow and the
 * picture's own darks carry it, and a ratio against the picture's middle color says little.
 * What it cannot see: anything only shown on hover or focus, and anything the harnesses do not
 * stand in for (a system's chat cards, tooltips, menus, the scene bar, the carousel).
 *
 *   node tools/scan-contrast.mjs [device ...] [--dark] [--min 4.5] [--shots <folder>]
 *
 * With no device it scans the Journal as it comes: on paper.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const dir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');

const argv = process.argv.slice(2);
const take = (flag, hasValue) => {
	const at = argv.indexOf(flag);
	if (at < 0) return null;
	return hasValue ? argv.splice(at, 2)[1] : argv.splice(at, 1)[0];
};
const shotsTo = take('--shots', true);
const min = Number(take('--min', true) ?? 4.5);
const dark = !!take('--dark', false);
const devices = argv.length ? argv : ['journal'];
if (shotsTo) fs.mkdirSync(shotsTo, { recursive: true });

/* ---- in the page: what there is to read, and where ---- */
const COLLECT = String.raw`(() => {
	const cv = document.createElement('canvas');
	cv.width = cv.height = 1;
	const cx = cv.getContext('2d', { willReadFrequently: true });
	const seen = new Map();
	// any color the browser can paint, as [r, g, b, a]
	const rgba = (c) => {
		if (seen.has(c)) return seen.get(c);
		cx.clearRect(0, 0, 1, 1);
		cx.fillStyle = '#000';
		cx.fillStyle = c;
		cx.fillRect(0, 0, 1, 1);
		const d = cx.getImageData(0, 0, 1, 1).data;
		const out = [d[0], d[1], d[2], d[3] / 255];
		seen.set(c, out);
		return out;
	};
	const where = (el) => {
		const parts = [];
		for (let e = el; e && e !== document.body && parts.length < 5; e = e.parentElement) {
			const cls = typeof e.className === 'string' ? e.className.trim().split(/\s+/).filter((c) => c && !/^fa-|^fa[srb]?$/.test(c)).slice(0, 3).join('.') : '';
			parts.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (cls ? '.' + cls : ''));
			if (e.id) break;
		}
		return parts.join(' > ');
	};
	const opacityOf = (el) => {
		let o = 1;
		for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
		return o;
	};
	const vw = innerWidth, vh = innerHeight;
	const onScreen = (r) => r.width > 1 && r.height > 1 && r.right > 0 && r.bottom > 0 && r.left < vw && r.top < vh;
	// what is under a point may be the piece itself, something inside it, or something it is inside
	const inFront = (el, r) => {
		const x = Math.min(vw - 1, Math.max(0, (r.left + r.right) / 2));
		const y = Math.min(vh - 1, Math.max(0, (r.top + r.bottom) / 2));
		const top = document.elementFromPoint(x, y);
		return !top || top === el || el.contains(top) || top.contains(el);
	};
	// what is left of a box once everything that clips it has: text scrolled out of a list is not there to read
	const clipped = (el, r) => {
		let [l, t, rt, b] = [r.left, r.top, r.right, r.bottom];
		for (let e = el.parentElement; e && e !== document.documentElement; e = e.parentElement) {
			const cs = getComputedStyle(e);
			if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
			const c = e.getBoundingClientRect();
			if (cs.overflowX !== 'visible') { l = Math.max(l, c.left); rt = Math.min(rt, c.right); }
			if (cs.overflowY !== 'visible') { t = Math.max(t, c.top); b = Math.min(b, c.bottom); }
		}
		return { left: l, top: t, right: rt, bottom: b, width: rt - l, height: b - t };
	};
	// a photograph or drawing behind the piece: a pack's banner, a token's art. Lettering over one is
	// held up by its shadow and by where the picture happens to be dark, which a number cannot judge.
	const overPicture = (el, r) => {
		const stack = document.elementsFromPoint(Math.min(vw - 1, Math.max(0, (r.left + r.right) / 2)), Math.min(vh - 1, Math.max(0, (r.top + r.bottom) / 2)));
		return stack.some((e) => e !== el && !el.contains(e) && (/^(IMG|VIDEO|CANVAS)$/.test(e.tagName) || /url\("(?!data:)/.test(getComputedStyle(e).backgroundImage)) && !e.matches('body, html'));
	};
	const items = [];
	const add = (el, box, color, kind, text, cs) => {
		const r = clipped(el, box);
		// most of it has to be showing
		if (r.width < 2 || r.height < 2 || r.width * r.height < 0.6 * box.width * box.height) return;
		if (!onScreen(r) || !inFront(el, r)) return;
		if (el.closest('#rig, script, style, [hidden]')) return;
		const size = parseFloat(cs.fontSize);
		const bold = Number(cs.fontWeight) >= 700;
		items.push({
			kind, text: text.slice(0, 44), at: where(el), color: rgba(color), opacity: opacityOf(el), size,
			picture: overPicture(el, r),
			// a glyph on a ground of its own, like the plus on a folder's badge, is read against that
			ground: cs.backgroundColor && kind === 'icon' && rgba(cs.backgroundColor)[3] > 0.5 ? rgba(cs.backgroundColor) : null,
			large: size >= 24 || (bold && size >= 18.66),
			rect: [Math.max(0, r.left), Math.max(0, r.top), Math.min(vw, r.right), Math.min(vh, r.bottom)].map(Math.round),
		});
	};
	const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
	for (let node; (node = walker.nextNode());) {
		const text = node.textContent.trim();
		const el = node.parentElement;
		if (!text || !el || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
		if (el.closest('svg, option, noscript')) continue;
		const range = document.createRange();
		range.selectNodeContents(node);
		const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
		if (!rects.length) continue;
		const r = { left: Math.min(...rects.map((x) => x.left)), right: Math.max(...rects.map((x) => x.right)), top: Math.min(...rects.map((x) => x.top)), bottom: Math.max(...rects.map((x) => x.bottom)) };
		r.width = r.right - r.left;
		r.height = r.bottom - r.top;
		const cs = getComputedStyle(el);
		const fill = cs.webkitTextFillColor && cs.webkitTextFillColor !== cs.color ? cs.webkitTextFillColor : cs.color;
		add(el, r, fill, 'text', text, cs);
	}
	for (const el of document.body.querySelectorAll('*')) {
		if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
		// an icon drawn as a glyph, on an element with no words of its own
		for (const pseudo of ['::before', '::after']) {
			const ps = getComputedStyle(el, pseudo);
			if (!ps.content || ps.content === 'none' || ps.content === 'normal' || ps.content === '""') continue;
			if (!/Font Awesome|icon/i.test(ps.fontFamily)) continue;
			add(el, el.getBoundingClientRect(), ps.color, 'icon', (el.getAttribute('aria-label') || el.className || 'icon') + '', ps);
		}
		if (el.matches('input:not([type="checkbox"], [type="radio"], [type="range"], [type="hidden"]), textarea, select')) {
			const cs = getComputedStyle(el);
			if (el.value) add(el, el.getBoundingClientRect(), cs.color, 'field', el.value, cs);
			else if (el.placeholder) add(el, el.getBoundingClientRect(), getComputedStyle(el, '::placeholder').color, 'placeholder', el.placeholder, cs);
		}
	}
	return items;
})()`;

/* ---- in the page: the photograph with the text hidden, and each piece against it ---- */
const HIDE = `*, *::before, *::after, ::placeholder { color: transparent !important; -webkit-text-fill-color: transparent !important;
	text-shadow: none !important; caret-color: transparent !important; transition: none !important; animation: none !important; }
	#rig { visibility: hidden !important; }`;

const MEASURE = String.raw`(async (items, shot) => {
	const img = new Image();
	img.src = 'data:image/png;base64,' + shot;
	await img.decode();
	const cv = document.createElement('canvas');
	cv.width = img.width;
	cv.height = img.height;
	const cx = cv.getContext('2d', { willReadFrequently: true });
	cx.drawImage(img, 0, 0);
	const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
	const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
	const median = (list) => { list.sort((a, b) => a - b); return list[list.length >> 1]; };
	for (const it of items) {
		const [l, t, r, b] = it.rect;
		const w = Math.max(1, r - l), h = Math.max(1, b - t);
		const d = cx.getImageData(l, t, w, h).data;
		const ch = [[], [], []];
		const stride = Math.max(1, Math.floor((w * h) / 400));
		for (let p = 0; p < w * h; p += stride) for (let k = 0; k < 3; k++) ch[k].push(d[p * 4 + k]);
		const under = ch.map(median);
		const bg = it.ground ? under.map((v, k) => Math.round(it.ground[k] * it.ground[3] + v * (1 - it.ground[3]))) : under;
		// the ink as it lands: its own alpha and every opacity above it, over what is behind
		const a = it.color[3] * it.opacity;
		const fg = bg.map((v, k) => Math.round(it.color[k] * a + v * (1 - a)));
		it.bg = bg;
		it.fg = fg;
		it.ratio = ratio(fg, bg);
	}
	return items;
})`;

const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files'] });
let unreadable = 0;

async function scanView(page, view, found) {
	const items = await page.evaluate(COLLECT);
	if (shotsTo) await page.screenshot({ path: path.join(shotsTo, `${view.replace(/[^\w-]+/g, '-')}.png`) });
	const style = await page.addStyleTag({ content: HIDE });
	const shot = await page.screenshot({ encoding: 'base64', type: 'png' });
	// the ink comes back at once: left to ease back in, a slow control would be caught half inked by the next view
	await style.evaluate((el) => {
		el.textContent = '*, *::before, *::after { transition: none !important; }';
		void document.body.offsetWidth;
		el.remove();
	});
	const measured = await page.evaluate(`${MEASURE}(${JSON.stringify(items)}, ${JSON.stringify(shot)})`);
	for (const it of measured) found.push({ ...it, view });
}

for (const device of devices) {
	const found = [];
	const tag = `${device}${dark ? ' in the dark' : ''}`;

	/* the sidebar, every tab, and one popped out */
	{
		const page = await browser.newPage();
		await page.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 1 });
		await page.goto(`file:///${dir}/harness-sidebar.html`);
		await page.waitForFunction('globalThis.SFH?.ready');
		await page.evaluate((d, isDark) => { SFH.wear(d); SFH.dark(isDark); }, device, dark);
		// Foundry eases a faded control over a second: let it settle before looking
		await wait(1300);
		const tabs = await page.evaluate(() => [...document.querySelectorAll('#sidebar-content > .tab')].map((t) => t.dataset.tab));
		for (const tab of tabs) {
			await page.evaluate((t) => SFH.show(t), tab);
			await wait(250);
			await scanView(page, `${tag} sidebar ${tab}`, found);
		}
		for (const tab of tabs.filter((t) => t !== 'chat').slice(0, 2)) {
			await page.evaluate((t) => { document.querySelectorAll('.sidebar-popout').forEach((w) => w.remove()); SFH.popout(t); }, tab);
			await wait(250);
			await scanView(page, `${tag} popout ${tab}`, found);
		}
		await page.close();
	}

	/* the game view: the interface, then the projection on each of its tabs */
	{
		const page = await browser.newPage();
		await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
		await page.goto(`file:///${dir}/harness-device.html`);
		await wait(900);
		await page.evaluate(async (d, isDark) => {
			SFH.store.sequences = false;
			await game.settings.set(null, 'device', d);
			document.body.dataset.sfhDark = isDark ? 'on' : 'off';
		}, device, dark);
		await wait(1300);
		const tabs = await page.evaluate(() => [...document.querySelectorAll('#sidebar-content > .tab')].map((t) => t.dataset.tab));
		for (const tab of tabs) {
			await page.evaluate((t) => {
				for (const el of document.querySelectorAll('#sidebar-content > .tab')) el.classList.toggle('active', el.dataset.tab === t);
				for (const b of document.querySelectorAll('#sidebar-tabs [data-action="tab"]')) b.setAttribute('aria-pressed', String(b.dataset.tab === t));
			}, tab);
			await wait(250);
			await scanView(page, `${tag} game ${tab}`, found);
		}
		await page.evaluate(async () => {
			SFH.DeviceChrome.setPower(true, { silent: true });
			await new Promise((r) => setTimeout(r, 100));
			await SFH.Projection.open();
		});
		await wait(400);
		const sheetTabs = await page.evaluate(() => [...document.querySelectorAll('#sfh-projection .sfh-stage [data-act="tab"]')].map((t) => t.dataset.k));
		for (const t of sheetTabs) {
			await page.evaluate((k) => document.querySelector(`#sfh-projection .sfh-stage [data-act="tab"][data-k="${k}"]`).click(), t);
			await wait(200);
			await scanView(page, `${tag} projection ${t}`, found);
		}
		await page.close();
	}

	// the same words in the same place on many views are one finding
	const groups = new Map();
	const pictures = new Set();
	for (const f of found) {
		const need = f.large ? Math.min(3, min) : min;
		if (f.ratio >= need) continue;
		if (f.picture) { pictures.add(`${f.text} (${f.ratio.toFixed(1)})`); continue; }
		const key = `${f.kind}|${f.text}|${f.at}`;
		const g = groups.get(key) ?? { ...f, on: [] };
		if (f.ratio < g.ratio) Object.assign(g, { ratio: f.ratio, fg: f.fg, bg: f.bg });
		g.on.push(f.view.replace(`${tag} `, ''));
		groups.set(key, g);
	}
	const list = [...groups.values()].sort((a, b) => a.ratio - b.ratio);
	const bad = list.filter((g) => g.ratio < 3);
	unreadable += bad.length;
	console.log(`\n=== ${tag}: ${found.length} pieces measured, ${bad.length} unreadable (under 3:1), ${list.length - bad.length} weak (under ${min}:1)`);
	if (pictures.size) console.log(`over a picture, to be judged by eye: ${[...pictures].join(', ')}`);
	for (const g of list) {
		const on = [...new Set(g.on)];
		console.log(`${g.ratio.toFixed(2)}  ${g.kind} "${g.text}"  ${hex(g.fg)} on ${hex(g.bg)}  ${Math.round(g.size)}px\n      at ${g.at}\n      on ${on.length > 5 ? `${on.slice(0, 5).join(', ')} … (${on.length})` : on.join(', ')}`);
	}
}
await browser.close();
process.exit(unreadable ? 1 : 0);
