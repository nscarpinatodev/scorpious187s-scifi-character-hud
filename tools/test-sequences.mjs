/*
 * Play the Runic Vambrace's opening on the real projection and check its arcane bolts: the side
 * panels wait, hidden, while the main body is drawn; then the sigil sends a bolt to the middle of
 * each, all together, and each is drawn out as it is struck; and nothing is left behind once the
 * sequence is over, or when it is stopped early. With reduced motion there are no bolts and
 * nothing waits. With an output folder as the argument, it also shoots the bolts mid-strike.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// puppeteer lives in the sibling conversion repo; this tool is dev-only
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const dir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');
const shots = process.argv[2];

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

const play = () => page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, store } = SFH;
	store.sequences = true;
	await game.settings.set(null, 'device', 'vambrace');
	await wait(300);
	if (SFH.Projection.isOpen) { hud.setPower(false, { silent: true }); await wait(300); }
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const tag = reduced ? 'reduced motion: ' : '';
	const stage = () => document.querySelector('#sfh-projection .sfh-stage');
	const sides = () => [...stage().querySelectorAll('.slot:not([data-slot="projection"])')];
	const shown = (el) => Number(getComputedStyle(el).opacity) > 0;

	hud.toggle();
	// the projection is raised first, then the sequence played: time everything from that
	for (let i = 0; i < 40 && !stage()?.classList.contains('sfh-seq-on'); i++) await wait(25);
	check(`${tag}the sequence is playing`, stage()?.classList.contains('sfh-seq-on'));
	await wait(250);
	check(`${tag}there are side panels`, sides().length >= 4, sides().length);
	if (reduced) {
		check('reduced motion: no bolts', !stage().querySelector('.vb-bolts'));
		check('reduced motion: every side panel is there from the start', sides().every(shown), sides().map(shown));
		await wait(1500);
		return out;
	}
	check('the bolts are waiting on the board', stage().querySelector('.vb-bolts'));
	check('before the bolts, the side panels wait unseen', sides().every((el) => !shown(el) && !el.classList.contains('vb-struck')), sides().map(shown));
	check('the main body is not kept waiting', !stage().querySelector('[data-slot="projection"]').classList.contains('vb-struck'));

	await wait(700); // a second in: every bolt has struck, and is still flickering
	const bolts = [...stage().querySelectorAll('.vb-bolts g')];
	check('a bolt for each side panel', bolts.length === sides().length, [bolts.length, sides().length]);
	check('they have all struck together', sides().every((el) => el.classList.contains('vb-struck')), sides().map((el) => el.dataset.slot));
	// each bolt ends in the middle of its panel
	const ends = bolts.map((g) => g.querySelector('polyline').getAttribute('points').trim().split(' ').at(-1).split(',').map(Number));
	const middles = sides().map((el) => { const s = getComputedStyle(el); return [parseFloat(s.left) + parseFloat(s.width) / 2, parseFloat(s.top) + parseFloat(s.height) / 2]; });
	check('each strikes the middle of its panel', ends.every((e, i) => Math.hypot(e[0] - middles[i][0], e[1] - middles[i][1]) < 1), { ends, middles });
	check('the bolts start in the sigil, not at the panels', bolts.every((g) => {
		const [x, y] = g.querySelector('polyline').getAttribute('points').trim().split(' ')[0].split(',').map(Number);
		return Math.hypot(x - 640, y - 380) <= 201;
	}));
	check('the bolts are drawn over the panels', Number(getComputedStyle(stage().querySelector('.vb-bolts')).zIndex) > 0);

	await wait(960); // past the sequence's end
	check('the bolts are gone afterward', !stage().querySelector('.vb-bolts'));
	check('the sequence is over', !stage().classList.contains('sfh-seq-on'));
	check('every side panel is there afterward', sides().every(shown), sides().map(shown));

	// switched off as the bolts are about to fly: none are left behind
	hud.setPower(false, { silent: true });
	await wait(300);
	hud.toggle();
	await wait(400);
	SFH.Projection.playSequence('off');
	await wait(700);
	check('switching off early leaves no bolts', !stage()?.querySelector('.vb-bolts'));
	hud.setPower(false, { silent: true });
	return out;
});

const results = [];
results.push(...await play());
if (shots) {
	await page.evaluate(() => SFH.DeviceChrome.toggle());
	await new Promise((r) => setTimeout(r, 740));
	await page.screenshot({ path: `${shots}/bolts.png` });
	await page.evaluate(() => SFH.DeviceChrome.setPower(false, { silent: true }));
}
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
results.push(...await play());
await browser.close();

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
