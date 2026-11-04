/*
 * Wear each look on the real device and projection and check it is its device in its own dress:
 * the page, the device layer and the stage are marked with both the device and the look, so the
 * device's layout, board and sequence are kept while its colors, art and bolts are the look's; a
 * satchel look draws its own leather behind the book; and going back to the device itself takes
 * every trace of the look away.
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
	const { DEVICES, seqMs } = await import('../scripts/constants.mjs');
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
	check('there are four looks', looks.length === 4, looks.map((d) => d.id));
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
		check(`${tag}: its sequence is its device's`, seqMs('on', look.id) === seqMs('on', look.base) && seqMs('off', look.id) === seqMs('off', look.base));
		check(`${tag}: on its device's board`, now.board === base.board, [now.board, base.board]);
		check(`${tag}: its own art`, now.art === look.art && art().querySelector('#sfh-arm') && art().querySelector('#sfh-band'), now.art);
		check(`${tag}: its own interface colors`, now.hot && now.hot !== base.hot, [now.hot, base.hot]);
		check(`${tag}: its own projection colors`, now.stageHot && now.stageHot !== base.stageHot, [now.stageHot, base.stageHot]);
		if (look.base === 'vambrace') {
			check(`${tag}: its own edge, runes and corner marks`, now.edge !== base.edge && now.rune !== base.rune && now.corner !== base.corner, [now.corner, now.rune]);
			check(`${tag}: its bolts strike in its own color`, now.bolt && now.bolt !== base.bolt, [now.bolt, base.bolt]);
			check(`${tag}: its stone is the gem the stylesheet lights`, art().querySelector('#sfh-band .sfh-gem') && art().querySelector('#sfh-gem-lit'));
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

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
