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

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
