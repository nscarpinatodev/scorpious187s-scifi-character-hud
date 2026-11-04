/*
 * Wear each look on the real device and projection and check it is its device in its own dress:
 * the page, the device layer and the stage are marked with both the device and the look, so the
 * device's layout, board and sequence are kept while its colors, art and bolts are the look's; a
 * satchel look draws its own leather behind the book; and going back to the device itself takes
 * every trace of the look away. A look with an opening of its own plays it, for as long as its own
 * sequence says, and not with reduced motion. Then the Journal's interface in the dark: the interface around the
 * book goes dark, the Journal and the Grove each in their own leather, and the book stays paper.
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
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, store } = SFH;
	const { DEVICES, seqMs, SEQ_LONG } = await import('../scripts/constants.mjs');
	const { currentDevice, currentLook } = await import('../scripts/settings.mjs');
	store.sequences = false;

	const stage = () => document.querySelector('#sfh-projection .sfh-stage');
	const art = () => document.querySelector('#sfh-device svg.sfh-art');
	const ui = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();
	const token = (name) => getComputedStyle(stage()).getPropertyValue(name).trim();
	const wear = async (id) => {
		if (hud.power) hud.setPower(false, { silent: true });
		await game.settings.set(null, 'device', id);
		await wait(350);
		hud.setPower(true, { silent: true });
		await wait(500);
	};
	const snapshot = () => ({
		hot: ui('--sfh-hot'), edge: ui('--sfh-edge'), rune: ui('--sfh-rune-lit'),
		stageHot: token('--hot'), bolt: token('--bolt'), corner: token('--corner'), paper: token('--jb-paper'),
		board: document.querySelector('#sfh-projection .sfh-board')?.style.width,
		art: art()?.dataset.art,
	});

	const looks = Object.values(DEVICES).filter((d) => d.base);
	check('four fantasy looks and seven for science fiction', looks.length === 11, looks.map((d) => d.id));
	const bases = {};
	for (const base of new Set(looks.map((d) => d.base))) {
		await wear(base);
		bases[base] = snapshot();
		check(`${base}: no look is worn`, !document.body.dataset.sfhLook && !stage().dataset.look && !document.getElementById('sfh-device').dataset.look);
	}

	for (const look of looks) {
		const tag = `${look.id} (over the ${look.base})`;
		await wear(look.id);
		const base = bases[look.base];
		const now = snapshot();
		check(`${tag}: the code sees its device`, currentDevice() === look.base && currentLook() === look.id, [currentDevice(), currentLook()]);
		check(`${tag}: the page is the device, wearing the look`, document.body.dataset.sfhDevice === look.base && document.body.dataset.sfhLook === look.id);
		check(`${tag}: so are the device layer and the stage`, document.getElementById('sfh-device').dataset.look === look.id
			&& stage().dataset.device === look.base && stage().dataset.look === look.id);
		// a look opens as its device does, or its own way for as long as its own sequence says
		const own = look.sequence !== DEVICES[look.base].sequence;
		check(own ? `${tag}: its own opening runs its own length` : `${tag}: its sequence is its device's`,
			own ? SEQ_LONG[look.sequence] && seqMs('on', look.id) === SEQ_LONG[look.sequence].on : seqMs('on', look.id) === seqMs('on', look.base) && seqMs('off', look.id) === seqMs('off', look.base),
			[look.sequence, seqMs('on', look.id)]);
		check(`${tag}: on its device's board`, now.board === base.board, [now.board, base.board]);
		check(look.art ? `${tag}: its own art` : `${tag}: no art, as its device has none`,
			look.art ? now.art === look.art && art().querySelector('#sfh-arm') && art().querySelector('#sfh-band') : !art(), now.art);
		check(`${tag}: its own interface colors`, now.hot && now.hot !== base.hot, [now.hot, base.hot]);
		check(`${tag}: its own projection colors`, now.stageHot && now.stageHot !== base.stageHot, [now.stageHot, base.stageHot]);
		if (look.base === 'vambrace') {
			check(`${tag}: its own edge and corner marks`, now.edge !== base.edge && now.corner !== base.corner, [now.corner, now.edge]);
			check(`${tag}: its bolts strike in its own color`, now.bolt && now.bolt !== base.bolt, [now.bolt, base.bolt]);
			// a bracer of runes lights its runes and its stone; the Crystal core is a band, not a bracer
			if (art().querySelector('.sfh-rune')) {
				check(`${tag}: its own runes`, now.rune !== base.rune, now.rune);
				check(`${tag}: its stone is the gem the stylesheet lights`, art().querySelector('#sfh-band .sfh-gem') && art().querySelector('#sfh-gem-lit'));
			}
		}
		if (look.base === 'journal') {
			check(`${tag}: its own leather and paper`, now.paper !== base.paper, [now.paper, base.paper]);
			const behind = document.querySelector('#sfh-projection > svg.sfh-satchel-back');
			check(`${tag}: the back behind the book is its own satchel's`, behind?.dataset.art === look.art, behind?.dataset.art);
			check(`${tag}: drawn in its own leather`, behind?.innerHTML.includes('#34501f'));
		}
		check(`${tag}: its name and hint are in the language file`, game.i18n.localize(look.label) !== look.label && game.i18n.localize(look.hint) !== look.hint);
	}

	// back to a device as it is: nothing of the look is left
	await wear('journal');
	check('back to the Journal: no look is worn', !document.body.dataset.sfhLook && !stage().dataset.look);
	check('back to the Journal: its own art again', art()?.dataset.art === 'satchel', art()?.dataset.art);
	check('back to the Journal: its own satchel behind the book', document.querySelector('#sfh-projection > svg.sfh-satchel-back')?.dataset.art === 'satchel');
	check('back to the Journal: its own colors', ui('--sfh-hot') === bases.journal.hot, ui('--sfh-hot'));
	await wear('vambrace');
	check('back to the Vambrace: its own art and colors', art()?.dataset.art === 'bracer' && ui('--sfh-hot') === bases.vambrace.hot);
	hud.setPower(false, { silent: true });
	return out;
});

// a look with an opening of its own plays it, for as long as its sequence says, and not with reduced motion
const openings = async (reduced) => page.evaluate(async (reduced) => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, store } = SFH;
	const { DEVICES, seqMs } = await import('../scripts/constants.mjs');
	const stage = () => document.querySelector('#sfh-projection .sfh-stage');
	const tag = reduced ? ', with reduced motion' : '';
	for (const look of Object.values(DEVICES).filter((d) => d.base && d.sequence !== DEVICES[d.base].sequence)) {
		store.sequences = false;
		if (hud.power) hud.setPower(false, { silent: true });
		await game.settings.set(null, 'device', look.id);
		await wait(300);
		store.sequences = true;
		hud.toggle();
		const t0 = performance.now();
		for (let i = 0; i < 40 && !stage()?.classList.contains('sfh-seq-on'); i++) await wait(20);
		await wait(120);
		const slot = stage().querySelector('[data-slot="projection"]');
		const name = getComputedStyle(slot).animationName;
		if (reduced) check(`${look.id}${tag}: no opening plays`, name === 'none', name);
		else check(`${look.id}: plays its own opening`, /^sfh-look-/.test(name), name);
		const ms = seqMs('on', look.id);
		await wait(Math.max(0, ms - (performance.now() - t0) - 200));
		check(`${look.id}${tag}: still opening just before its sequence ends`, stage().classList.contains('sfh-seq-on'), [Math.round(performance.now() - t0), ms]);
		await wait(450);
		check(`${look.id}${tag}: done once it has`, !stage().classList.contains('sfh-seq-on'), Math.round(performance.now() - t0));
		hud.setPower(false, { silent: true });
		store.sequences = false;
		await wait(200);
	}
	return out;
}, reduced);
results.push(...await openings(false));
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
results.push(...await openings(true));
await page.emulateMediaFeatures([]);

// the bolts take the look's colors when they fly
const bolts = await page.evaluate(async () => {
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, store } = SFH;
	store.sequences = true;
	await game.settings.set(null, 'device', 'witchfire');
	await wait(350);
	hud.toggle();
	await wait(900);
	const glow = document.querySelector('#sfh-projection .vb-bolts polyline')?.getAttribute('stroke');
	await wait(1000);
	hud.setPower(false, { silent: true });
	store.sequences = false;
	return glow;
});
results.push({ name: 'witchfire: the bolts fly green', ok: bolts === '#5aff4a', detail: JSON.stringify(bolts) });

// the Journal's interface in the dark: the interface around the book, never the book
const dark = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud } = SFH;
	const ui = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();
	const paper = () => getComputedStyle(document.querySelector('#sfh-projection .sfh-stage')).getPropertyValue('--jb-paper').trim();
	const light = (rgb) => rgb.split(/\s+/).map(Number).reduce((a, b) => a + b, 0) > 3 * 128;
	for (const id of ['journal', 'grove']) {
		if (hud.power) hud.setPower(false, { silent: true });
		await game.settings.set(null, 'device', id);
		await game.settings.set(null, 'journalDark', false);
		await wait(300);
		hud.setPower(true, { silent: true });
		await wait(500);
		const before = { hot: ui('--sfh-hot'), bg: ui('--sfh-bg-rgb'), paper: paper() };
		await game.settings.set(null, 'journalDark', true);
		await wait(100);
		check(`${id} in the dark: the page says so`, document.body.dataset.sfhDark === 'on');
		check(`${id} in the dark: the interface is dark`, light(before.bg) && !light(ui('--sfh-bg-rgb')), [before.bg, ui('--sfh-bg-rgb')]);
		check(`${id} in the dark: its own main color`, ui('--sfh-hot') !== before.hot, ui('--sfh-hot'));
		check(`${id} in the dark: the book is still paper`, paper() === before.paper, paper());
		await game.settings.set(null, 'journalDark', false);
		await wait(100);
		check(`${id} back on paper: as it was`, document.body.dataset.sfhDark === 'off' && ui('--sfh-bg-rgb') === before.bg && ui('--sfh-hot') === before.hot);
	}
	// the other devices are dark already, and the setting leaves them be
	await game.settings.set(null, 'device', 'vambrace');
	await wait(300);
	const hot = ui('--sfh-hot');
	await game.settings.set(null, 'journalDark', true);
	await wait(100);
	check('the Vambrace is left as it is', ui('--sfh-hot') === hot, [hot, ui('--sfh-hot')]);
	await game.settings.set(null, 'journalDark', false);
	hud.setPower(false, { silent: true });
	return out;
});
results.push(...dark);

// the Holoprojector closes its hologram first and its light last
const holo = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, store } = SFH;
	store.sequences = false;
	if (hud.power) hud.setPower(false, { silent: true });
	await game.settings.set(null, 'device', 'holoprojector');
	await wait(300);
	hud.setPower(true, { silent: true });
	await wait(400);
	store.sequences = true;
	hud.toggle();
	const stage = () => document.querySelector('#sfh-projection .sfh-stage');
	for (let i = 0; i < 40 && !stage()?.classList.contains('sfh-seq-off'); i++) await wait(20);
	await wait(60);
	const main = stage().querySelector('[data-slot="projection"]');
	check('Holoprojector closing: the hologram flickers out', getComputedStyle(main).animationName === 'sfh-look-holo-out', getComputedStyle(main).animationName);
	check('not the idle flicker standing in for it', !stage().querySelector('.pnl') || [...stage().querySelectorAll('.pnl')].every((p) => getComputedStyle(p).animationName !== 'sfh-look-holo-idle'));
	await wait(400);
	const beam = Number(getComputedStyle(document.getElementById('sfh-beam')).opacity);
	const panels = Math.max(...[...stage().querySelectorAll('.slot')].map((e) => Number(getComputedStyle(e).opacity)));
	const emitter = Number(/brightness\(([\d.]+)\)/.exec(getComputedStyle(document.getElementById('sfh-band')).filter)?.[1] ?? 0);
	check('the light still on while the hologram is going', beam > 0.95 && panels > 0.05, { beam, panels });
	check('and the emitter still lit', emitter >= 0.99, emitter);
	await wait(500);
	hud.setPower(false, { silent: true });
	store.sequences = false;
	return out;
});
results.push(...holo);

// Heal and Damage keep their words inside them, on every device and look
const words = await page.evaluate(async () => {
	const out = [];
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, store } = SFH;
	const { DEVICES } = await import('../scripts/constants.mjs');
	store.sequences = false;
	for (const id of Object.keys(DEVICES)) {
		if (hud.power) hud.setPower(false, { silent: true });
		await game.settings.set(null, 'device', id);
		await wait(200);
		hud.setPower(true, { silent: true });
		await wait(300);
		const over = [];
		for (const b of document.querySelectorAll('#sfh-projection .sfh-hp .hp-a .b')) {
			const range = document.createRange();
			range.selectNodeContents(b);
			const box = b.getBoundingClientRect();
			const s = getComputedStyle(b);
			const k = box.width / b.offsetWidth;
			const room = box.width - (parseFloat(s.paddingLeft) + parseFloat(s.paddingRight) + parseFloat(s.borderLeftWidth) + parseFloat(s.borderRightWidth)) * k;
			if (range.getBoundingClientRect().width > room + 0.5) over.push(b.textContent.trim());
		}
		out.push({ name: `${id}: Heal and Damage keep their words inside them`, ok: over.length === 0, detail: JSON.stringify(over) });
	}
	hud.setPower(false, { silent: true });
	return out;
});
results.push(...words);

// a device of your own wins over the world's, and changing the world's says so
const notice = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const said = [];
	const before = ui.notifications;
	ui.notifications = { info: (m) => said.push(m), warn: () => {}, error: () => {} };
	const user = Object.getOwnPropertyDescriptor(game, 'user');
	Object.defineProperty(game, 'user', { configurable: true, get: () => ({ isGM: true, character: SFH.actor }) });
	await game.settings.set(null, 'device', 'cyberdeck');
	await game.settings.set(null, 'worldDevice', 'omni');
	await wait(100);
	check('the GM is told their own device stays', said.length === 1 && /Mass Effect Omni-tool/.test(said[0]) && /Cyberdeck/.test(said[0]), said);
	check('and it does', document.body.dataset.sfhLook === 'cyberdeck');
	said.length = 0;
	await game.settings.set(null, 'device', '');
	await game.settings.set(null, 'worldDevice', 'tron');
	await wait(100);
	check('following the world, nothing to say', said.length === 0, said);
	check('and the world\'s is worn', document.body.dataset.sfhDevice === 'tron' && !document.body.dataset.sfhLook);
	await game.settings.set(null, 'worldDevice', 'omni');
	await game.settings.set(null, 'device', 'omni');
	Object.defineProperty(game, 'user', user);
	ui.notifications = before;
	return out;
});
results.push(...notice);

// the Retro terminal: its own monitor case, the panels inside its screen, and its glass on the screen alone
const retro = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, store } = SFH;
	store.sequences = false;
	if (hud.power) hud.setPower(false, { silent: true });
	await game.settings.set(null, 'device', 'retro');
	await wait(250);
	hud.setPower(true, { silent: true });
	await wait(450);
	const stage = document.querySelector('#sfh-projection .sfh-stage');
	const glass = stage.querySelector('.ornlayer rect[fill="url(#sfh-rt-glass)"]');
	check("Retro terminal: its own monitor case, not the EVA's bezel", glass && !stage.querySelector('.ornlayer > div[style*="border:14px"]'));
	const g = glass.getBoundingClientRect();
	const outside = [...stage.querySelectorAll('.slot, .navb')].filter((e) => e.offsetWidth).filter((e) => {
		const r = e.getBoundingClientRect();
		return r.left < g.left - 0.5 || r.right > g.right + 0.5 || r.top < g.top - 0.5 || r.bottom > g.bottom + 0.5;
	});
	check('every panel inside its screen', outside.length === 0, outside.map((e) => e.dataset.slot ?? e.textContent.trim()));
	// the glass, in board units, is the screen's box: the scanlines and the glare do not reach the case
	const k = stage.getBoundingClientRect().width / stage.offsetWidth;
	const after = getComputedStyle(stage, '::after');
	const box = [parseFloat(after.left), parseFloat(after.top), parseFloat(after.width), parseFloat(after.height)].map((n) => n * k);
	const s = stage.getBoundingClientRect();
	const same = Math.abs(s.left + box[0] - g.left) < 1.5 && Math.abs(s.top + box[1] - g.top) < 1.5 && Math.abs(box[2] - g.width) < 1.5 && Math.abs(box[3] - g.height) < 1.5;
	check('its glass and scanlines lie on the screen, not the case', same && /repeating-linear-gradient/.test(after.backgroundImage), { box, glass: [g.left - s.left, g.top - s.top, g.width, g.height] });
	check("no scanlines of the EVA's across the whole board", !stage.querySelector('.scanfx') || getComputedStyle(stage.querySelector('.scanfx')).display === 'none');
	check('it calls itself a terminal', /TERMINAL/.test(stage.querySelector('[data-slot="identity"]').textContent) && !/EVA Link/.test(stage.textContent));
	hud.setPower(false, { silent: true });
	return out;
});
results.push(...retro);

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
