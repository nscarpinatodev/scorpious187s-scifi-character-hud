/*
 * Play the Runic Vambrace's opening on the real projection and check its arcane bolts: the side
 * panels wait, hidden, while the main body is drawn; then the sigil sends a bolt to the middle of
 * each, all together, and each is drawn out as it is struck; and nothing is left behind once the
 * sequence is over, or when it is stopped early. With reduced motion there are no bolts and
 * nothing waits. With an output folder as the argument, it also shoots the bolts mid-strike.
 *
 * Then the Journal's: the book waits shut inside its satchel, cut off at the mouth, while the
 * straps are pulled free and the flap turns away; it comes out and opens, and its writing fades in
 * from the spine; closing, it goes back in and the flap is buckled down after it. While the book
 * is out, the bag's back is drawn behind it in the projection, exactly where the art's is. What
 * else is kept in the bag stays packed out of sight while the flap is shut.
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

/* ------------------------------------------------ the Journal and its satchel */

const journal = () => page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, Projection, store } = SFH;
	store.sequences = true;
	await game.settings.set(null, 'device', 'journal');
	await wait(300);
	if (Projection.isOpen) { hud.setPower(false, { silent: true }); await wait(300); }
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const tag = reduced ? 'Journal, reduced motion: ' : 'Journal: ';
	const art = () => document.querySelector('#sfh-device svg.sfh-art');
	const flap = () => art().querySelector('.sfh-flap');
	const straps = () => art().querySelector('.sfh-straps');
	const artBack = () => getComputedStyle(art().querySelector('.sfh-satchel-back')).visibility;
	const stage = () => document.querySelector('#sfh-projection .sfh-stage');
	const book = () => stage().querySelector('.jb');
	const copy = () => document.querySelector('#sfh-projection > svg.sfh-satchel-back');
	const shown = (el) => Number(getComputedStyle(el).opacity) > 0.99;
	const lift = (el) => new DOMMatrix(getComputedStyle(el).transform).f;
	const scale = (el) => new DOMMatrix(getComputedStyle(el).transform).d;
	const panels = () => [...stage().querySelectorAll('.slot, .navb')];
	const masked = (el) => getComputedStyle(el).maskImage !== 'none';
	const shut = () => shown(flap()) && lift(straps()) === 0;
	// what else is kept in the bag: packed down behind its front while the flap is shut, up out of
	// its mouth once the flap is away, in the art's back and in the projection's copy of it
	const mouth = () => art().querySelector('#sfh-arm').getBoundingClientRect().top;
	const clutterTop = (where) => document.querySelector(`${where} .sfh-clutter`)?.getBoundingClientRect().top ?? NaN;
	const packed = (where) => clutterTop(where) >= mouth() - 0.5;
	const up = (where) => clutterTop(where) < mouth() - 30;
	const IN_ART = '#sfh-device svg.sfh-art', BEHIND = '#sfh-projection > svg.sfh-satchel-back';

	check(`${tag}the satchel is the art`, art()?.dataset.art === 'satchel' && flap() && straps());
	check(`${tag}it reaches above its frame`, getComputedStyle(art()).overflow === 'visible');
	check(`${tag}buckled shut while the power is off`, shut(), [getComputedStyle(flap()).opacity, lift(straps())]);
	check(`${tag}what else is in the bag is packed out of sight`, packed(IN_ART), [clutterTop(IN_ART), mouth()]);

	hud.toggle();
	for (let i = 0; i < 40 && !stage()?.classList.contains('sfh-seq-on'); i++) await wait(25);
	await wait(100);
	if (reduced) {
		check(`${tag}the book is out and open at once`, getComputedStyle(book()).transform === 'none', getComputedStyle(book()).transform);
		check(`${tag}the flap is away at once`, !shown(flap()));
		check(`${tag}what else is in the bag is up at once`, up(BEHIND), [clutterTop(BEHIND), mouth()]);
		check(`${tag}the writing is not masked`, panels().every((el) => !masked(el)));
		await wait(6100);
		hud.setPower(false, { silent: true });
		await wait(300);
		return out;
	}
	check(`${tag}the straps are pulled free first`, lift(straps()) < 0 && lift(straps()) > -58, lift(straps()));
	check(`${tag}the flap has not turned yet`, shown(flap()) && Math.abs(scale(flap()) - 1) < 0.05, getComputedStyle(flap()).transform);
	check(`${tag}the book waits small, inside the bag`, Math.abs(scale(book()) - 0.45) < 1e-3 && lift(book()) > 600, getComputedStyle(book()).transform);
	const layer = book().parentElement;
	check(`${tag}it is cut off at the mouth`, getComputedStyle(layer).clipPath.includes('862px'), getComputedStyle(layer).clipPath);
	check(`${tag}the writing waits unseen`, panels().every(masked));
	check(`${tag}the bag's back is drawn under the book`, copy() && copy().compareDocumentPosition(stage()) & Node.DOCUMENT_POSITION_FOLLOWING);
	const a = art().getBoundingClientRect(), b = copy().getBoundingClientRect();
	check(`${tag}exactly where the art's is`, ['left', 'top', 'width', 'height'].every((k) => Math.abs(a[k] - b[k]) < 0.5), { art: [a.left, a.top, a.width], copy: [b.left, b.top, b.width] });
	check(`${tag}and the art's own is hidden`, artBack() === 'hidden');
	check(`${tag}what else is in the bag waits packed for the flap`, packed(BEHIND), [clutterTop(BEHIND), mouth()]);

	await wait(700); // 0.9s: the flap is turning over, the book still in the bag
	check(`${tag}the flap turns over on its hinge`, scale(flap()) < 0.6, getComputedStyle(flap()).transform);
	check(`${tag}what else is in the bag waits for the flap to be gone, not coming up behind it`, packed(BEHIND), [clutterTop(BEHIND), mouth(), getComputedStyle(flap()).opacity]);
	await wait(900); // 1.8s: out of the bag and rising, still small and shut
	check(`${tag}out of the mouth by 1.8s`, lift(book()) < 400 && scale(book()) < 0.8, getComputedStyle(book()).transform);
	check(`${tag}no longer cut off once out`, getComputedStyle(layer).clipPath === 'none');
	check(`${tag}the flap has fallen away behind`, Number(getComputedStyle(flap()).opacity) < 0.05);
	check(`${tag}what else is in the bag is up out of it`, up(BEHIND), [clutterTop(BEHIND), mouth()]);
	await wait(1900); // 3.6s: open, the writing about to fade in
	check(`${tag}open by 3.6s`, Math.abs(scale(book()) - 1) < 1e-3 && Math.abs(lift(book())) < 0.5, getComputedStyle(book()).transform);
	await wait(700); // 4.4s: fading in from the spine
	const main = stage().querySelector('[data-slot="projection"]');
	check(`${tag}the writing fades in from the spine`, masked(main) && parseFloat(getComputedStyle(main).maskSize) > 0, getComputedStyle(main).maskSize);
	await wait(1800); // past the end
	check(`${tag}the sequence is over by 6s`, !stage().classList.contains('sfh-seq-on'));
	check(`${tag}every panel is written, unmasked`, panels().every((el) => !masked(el) && shown(el)));
	check(`${tag}the back stays behind the open book`, copy() && artBack() === 'hidden');

	hud.toggle();
	await wait(1200);
	check(`${tag}closing, the flap stays away while the book goes in`, !shown(flap()));
	check(`${tag}the book goes back in small`, scale(book()) < 0.6, getComputedStyle(book()).transform);
	await wait(1600); // 2.8s
	check(`${tag}put away by 2.7s`, !Projection.isOpen);
	check(`${tag}buckled shut after it`, shut(), [getComputedStyle(flap()).opacity, lift(straps())]);
	check(`${tag}with what else is in the bag packed away under it`, packed(IN_ART), [clutterTop(IN_ART), mouth()]);
	check(`${tag}the art's back is back`, artBack() === 'visible');

	// switched back on while it is being put away: it stays up
	hud.setPower(true, { silent: true });
	await wait(300);
	hud.toggle();
	await wait(600);
	hud.setPower(true, { silent: true });
	await wait(2600);
	check(`${tag}switched back on mid-close, it stays up`, Projection.isOpen);
	hud.setPower(false, { silent: true });
	await wait(300);
	return out;
});

const results = [];
results.push(...await play());
results.push(...await journal());
if (shots) {
	await page.evaluate(() => SFH.DeviceChrome.toggle());
	await new Promise((r) => setTimeout(r, 740));
	await page.screenshot({ path: `${shots}/bolts.png` });
	await page.evaluate(() => SFH.DeviceChrome.setPower(false, { silent: true }));
}
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
results.push(...await play());
results.push(...await journal());
await browser.close();

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
