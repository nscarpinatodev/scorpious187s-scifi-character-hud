/*
 * Speech bubbles over tokens, on every device and look (styles/interface.css, scripts/interface/bubbles.mjs).
 *
 * Foundry sizes a bubble before it shows it: it puts a hidden copy of the bubble straight on the
 * page's body, measures it, and gives the real one, in the canvas overlay, that width and height.
 * The device's face is set on the overlay, so the real bubble was drawn wider than the copy and
 * its last line was cut off. Here both are made as Foundry 14 makes them (ChatBubbles: the
 * template, #getMessageDimensions, #setPosition) and the real one must hold all of its text, read
 * on its own paper, and stay up long enough to be read.
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
await page.setViewport({ width: 1600, height: 1000 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const { DEVICES } = await import('../scripts/constants.mjs');
	Math.clamp ??= (min, n, max) => Math.min(max, Math.max(min, n));
	const { dressBubble, readingMs, foundryMs } = await import('../scripts/interface/bubbles.mjs');

	// the canvas overlay, as Foundry draws it (HUDContainer): the bubbles' layer is in the light theme
	const hud = document.createElement('div');
	hud.id = 'hud';
	hud.innerHTML = '<div id="chat-bubbles" class="themed theme-light"></div>';
	document.body.append(hud);
	const uiScale = 1;

	/** ChatBubbles#say, as far as size goes: the template, the hook, a copy measured on the body, the real one sized. */
	const say = (message, classes = '') => {
		const bubble = document.createElement('div');
		bubble.className = `chat-bubble ${classes}`.trim();
		bubble.innerHTML = `<div class="bubble-content">${message}</div>`;
		dressBubble({ id: 't1' }, bubble, message, { cssClasses: classes ? [classes] : [] });
		const div = document.createElement('div');
		div.classList.add('chat-bubble');
		div.style.visibility = 'hidden';
		div.innerHTML = message;
		document.body.append(div);
		const dims = { width: div.clientWidth + (8 * uiScale), height: div.clientHeight };
		div.style.maxHeight = 'none';
		dims.unconstrained = div.clientHeight;
		div.remove();
		bubble.classList.add('left');
		bubble.style.width = `${dims.width}px`;
		bubble.style.height = `${dims.height}px`;
		bubble.style.top = '200px';
		bubble.style.left = '200px';
		document.getElementById('chat-bubbles').append(bubble);
		const inner = bubble.querySelector('.bubble-content');
		const box = bubble.getBoundingClientRect();
		const cs = getComputedStyle(bubble);
		// the bubble clips its text at its padding's edge, not its content's
		const room = box.height - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingTop);
		const result = { dims, room: Math.round(room), text: Math.round(inner.scrollHeight), face: cs.fontFamily, color: cs.color, background: cs.backgroundColor };
		bubble.remove();
		return result;
	};

	const rgb = (c) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
	const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
	const contrast = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

	const LINES = [
		'Testosterizing the testing of the tester',
		'Hold the door! They are coming up the stairs, all of them, and they brought the big one.',
		'Wait',
	];
	const LONG = 'The courier walks into the saloon, sets a battered cap on the bar and asks whether anyone here has seen a man in a checkered coat, because he owes her a bullet and she means to give it back. '.repeat(2);

	/** Wear a device or a look, as the page is marked when the HUD is on. */
	const wear = async (id) => {
		const d = DEVICES[id];
		document.body.dataset.sfhDevice = d.base ?? id;
		if (d.base) document.body.dataset.sfhLook = id;
		else delete document.body.dataset.sfhLook;
		const face = getComputedStyle(document.body).getPropertyValue('--sfh-face').trim();
		await document.fonts.load(`16px ${face.split(',')[0]}`).catch(() => {});
		await document.fonts.ready;
	};

	for (const id of Object.keys(DEVICES)) {
		await wear(id);
		for (const line of LINES) {
			const r = say(line);
			check(`${id}: "${line.slice(0, 24)}…" fits its bubble`, r.text <= r.room + 1, r);
		}
		const r = say(line(LINES[0]));
		check(`${id}: the bubble is in the device's face`, r.face === getComputedStyle(document.body).getPropertyValue('--sfh-face').trim()
			|| r.face.replace(/["']/g, '') === getComputedStyle(document.body).getPropertyValue('--sfh-face').trim().replace(/["']/g, ''), r.face);
		check(`${id}: its words read on its paper (4.5:1)`, contrast(r.color, r.background) >= 4.5, { color: r.color, background: r.background, ratio: contrast(r.color, r.background).toFixed(2) });
		const e = say(LINES[0], 'emote');
		check(`${id}: an emote fits its bubble`, e.text <= e.room + 1, e);
		check(`${id}: an emote reads on its paper (4.5:1)`, contrast(e.color, e.background) >= 4.5, { color: e.color, background: e.background });
		const long = say(LONG);
		check(`${id}: a long speech is measured whole, for its scroll`, Math.abs(long.dims.unconstrained - 16 - long.text) <= 1, long);
	}
	function line(s) { return s; }

	/* ---- how long a bubble stays up ---- */
	check('six words: Foundry gives 1.2 seconds', foundryMs(6) === 1200, foundryMs(6));
	check('six words stay up 4.3 seconds', readingMs(6) === 4300, readingMs(6));
	check('one word stays up 2.8 seconds', readingMs(1) === 2800, readingMs(1));
	check("a long speech is held to Foundry's twenty seconds", readingMs(200) === 20000, readingMs(200));
	check('never shorter than Foundry keeps it', [0, 1, 6, 40, 70, 100, 150].every((w) => readingMs(w) >= foundryMs(w)));

	const made = (text, classes = []) => {
		const el = document.createElement('div');
		el.className = 'chat-bubble';
		el.innerHTML = `<div class="bubble-content">${text}</div>`;
		dressBubble({ id: 't2' }, el, text, { cssClasses: classes });
		document.getElementById('chat-bubbles').append(el);
		return el;
	};
	const timed = async (p) => { const t = performance.now(); await p; return performance.now() - t; };
	let el = made('Testosterizing the testing of the tester');
	const fadeIn = await timed(el.animate({ opacity: [0, 1] }, { duration: 50 }).finished);
	check('the fade-in is not held', fadeIn < 400, Math.round(fadeIn));
	const fadeOut = await timed(el.animate({ opacity: [1, 0] }, { duration: 50 }).finished);
	check('the fade-out is held back by the difference (3.1 s for six words)', fadeOut >= 3050 && fadeOut < 3600, Math.round(fadeOut));
	el.remove();
	el = made('Testosterizing the testing of the tester');
	const cleared = await timed(el.animate({ opacity: 0 }, { duration: 50 }).finished);
	check('a new bubble from the same token clears the old one at once', cleared < 400, Math.round(cleared));
	el.remove();
	el = made(LONG);
	const words = LONG.split(/\s+/).filter(Boolean).length;
	const scroll = el.querySelector('.bubble-content').animate({ top: [0, '-60px'] }, { duration: foundryMs(words) - 1000 });
	check('a long one scrolls over its longer time', Math.round(scroll.effect.getTiming().duration) === readingMs(words) - 1000, { got: scroll.effect.getTiming().duration, want: readingMs(words) - 1000 });
	scroll.cancel();
	el.remove();
	el = made('Wait');
	check("the page is marked with the bubble's kind only while it is measured", !document.body.dataset.sfhBubble);
	el.remove();
	const marked = (() => { const e = document.createElement('div'); e.innerHTML = '<div class="bubble-content">waves</div>'; dressBubble({ id: 't3' }, e, 'waves', { cssClasses: ['emote'] }); return document.body.dataset.sfhBubble; })();
	await Promise.resolve();
	check('an emote marks the page for its measure, then the mark goes', marked === 'emote' && !document.body.dataset.sfhBubble, { marked, after: document.body.dataset.sfhBubble ?? null });

	// without the HUD the bubble is Foundry's own
	delete document.body.dataset.sfhDevice;
	delete document.body.dataset.sfhLook;
	const plain = say(LINES[0]);
	check('with the HUD off, the bubble is left in Foundry\'s face', !/Rajdhani|VT323|Oxanium|Chakra|Alegreya|Garamond/.test(plain.face), plain.face);
	check('with the HUD off, it fits', plain.text <= plain.room + 1, plain);
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
