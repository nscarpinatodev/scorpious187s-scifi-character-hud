/*
 * Sharing the screen with other modules that move Foundry's macro bar.
 *
 * PF2e HUD's persistent HUD puts `#hotbar` back into `#ui-bottom` whenever it closes (at load
 * and whenever its settings change, even when it is switched off), and pulls it into a panel of
 * its own each time it draws when it is on. Either way the device takes it back, on every
 * device, without Foundry having to redraw the bar. Taking the device down, rebuilding it for
 * another device and hiding the HUD still move the bar as they always did, with no tug of war.
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
	const { DEVICES } = await import('../scripts/constants.mjs');
	store.sequences = false;
	const hotbar = () => document.getElementById('hotbar');
	const onDeck = () => hotbar()?.parentElement?.id === 'sfh-deck';
	const bottom = () => document.getElementById('ui-bottom');
	// what PF2e HUD's persistent HUD does: close() prepends the bar to #ui-bottom; a render appends it to its panel
	const closeLikePf2eHud = () => bottom().prepend(hotbar());
	const panel = Object.assign(document.createElement('div'), { id: 'pf2e-hud-persistent' });
	document.body.append(panel);
	const renderLikePf2eHud = () => panel.appendChild(hotbar());

	check('the bar starts on the device', onDeck());

	const missed = [];
	for (const id of Object.keys(DEVICES)) {
		await game.settings.set(null, 'device', id);
		await wait(120);
		closeLikePf2eHud();
		await wait(30);
		if (!onDeck()) missed.push(`${id}: close`);
		renderLikePf2eHud();
		await wait(30);
		if (!onDeck()) missed.push(`${id}: render`);
	}
	check('taken back from #ui-bottom and from a panel of its own, on every device and look', !missed.length, missed);
	check('and sized for the device again', hotbar().style.getPropertyValue('--hotbar-size') !== '' && !hotbar().classList.contains('faded-ui'));

	// a move made over and over settles each time, with no loop
	let moves = 0;
	const count = new MutationObserver(() => moves++);
	count.observe(document.body, { childList: true, subtree: true });
	for (let i = 0; i < 5; i++) { renderLikePf2eHud(); await wait(20); }
	await wait(100);
	count.disconnect();
	check('a module that keeps taking it does not start a tug of war', onDeck() && moves < 40, moves);

	await game.settings.set(null, 'device', 'omni');
	await wait(150);
	hud.setHidden(true);
	await wait(100);
	check('hiding the HUD leaves the bar where hiding puts it', onDeck(), hotbar().parentElement?.id);
	hud.setHidden(false);
	await wait(100);

	hud.unmount();
	await wait(80);
	check('taking the device down puts the bar back in #ui-bottom, and it stays there', hotbar().parentElement === bottom() && !document.getElementById('sfh-device'));
	closeLikePf2eHud();
	await wait(50);
	check('with the device down, another module may move it freely', hotbar().parentElement === bottom() && !document.getElementById('sfh-device'));
	hud.mount();
	await wait(80);
	check('mounted again, it is back on the device', onDeck());
	panel.remove();

	/* ---- PF2e HUD's panel keeps its width without the bar (with its own stylesheet, when installed) ---- */
	const sheet = 'file:///C:/Users/djsco/AppData/Local/FoundryVTT/Data/modules/pf2e-hud/styles/pf2e-hud.css';
	const ok = await fetch(sheet).then((r) => r.ok, () => false);
	if (ok) {
		const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: sheet });
		document.head.append(link);
		await new Promise((r) => { link.onload = r; link.onerror = r; });
		const hudPanel = Object.assign(document.createElement('div'), { id: 'pf2e-hud-persistent', className: 'pf2e-hud' });
		hudPanel.innerHTML = `<div data-panel="menu"><div class="group"><button>☰</button></div></div>
			<div data-panel="owned-actors">${'<div class="owned-actor"><img src="" width="40"><span>20</span></div>'.repeat(6)}</div>`;
		bottom().append(hudPanel);
		const card = () => hudPanel.querySelector('.owned-actor').getBoundingClientRect().width;
		// with the bar in it, measured before the device takes it back
		hudPanel.append(hotbar());
		const withBar = card();
		const panelWithBar = hudPanel.getBoundingClientRect().width;
		await wait(60);
		check('the device takes the bar back from the panel', onDeck());
		const without = card();
		check("the party's portraits keep the width they had beside the bar", Math.abs(without - withBar) < 1.5 && withBar > 80, { withBar, without });
		check('and so does the panel', Math.abs(hudPanel.getBoundingClientRect().width - panelWithBar) < 1.5, { panelWithBar, now: hudPanel.getBoundingClientRect().width });
		document.body.classList.add('pf2e-hud-hidden-persistent');
		check('a panel PF2e HUD has hidden gets no placeholder', getComputedStyle(hudPanel, '::after').content === 'none');
		document.body.classList.remove('pf2e-hud-hidden-persistent');
		hud.unmount();
		await wait(50);
		check('nor does one with the device down', getComputedStyle(hudPanel, '::after').content === 'none');
		hud.mount();
		hudPanel.remove();
		link.remove();
	}

	/* ---- PF2e HUD's panel on the left: its shortcuts reach under the projection, not over it ---- */
	await game.settings.set(null, 'device', 'journal');
	await wait(200);
	hud.setPower(true, { silent: true });
	await wait(400);
	const proj = document.getElementById('sfh-projection');
	const left = document.getElementById('ui-left');
	const z = (el) => Number(getComputedStyle(el).zIndex);
	const leftBefore = z(left);
	// as wide and tall as the screen, so whatever it is drawn over is under it everywhere
	const shortcuts = Object.assign(document.createElement('div'), { id: 'pf2e-hud-persistent' });
	shortcuts.style.cssText = 'position: absolute; inset: 0; width: 100vw; height: 100vh; pointer-events: all; background: rgb(0 0 0 / 37%)';
	document.getElementById('ui-left-column-1').append(shortcuts);
	const inside = (x, y, root) => root.contains(document.elementFromPoint(x, y));
	const middle = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
	const pnl = [...proj.querySelectorAll('.pnl')].find((el) => getComputedStyle(el).pointerEvents !== 'none' && el.getBoundingClientRect().width);
	check('the projection is up to be covered', proj.classList.contains('sfh-visible') && !!pnl);
	if (pnl) check("the projection is drawn over PF2e HUD's shortcuts", inside(...middle(pnl), proj), document.elementFromPoint(...middle(pnl))?.id);
	check('and so is the device', inside(...middle(document.getElementById('action-bar')), document.getElementById('sfh-device')));
	check('the left column is under the projection only while the panel is in it', z(left) < z(proj) && leftBefore >= z(proj), { left: z(left), leftBefore, proj: z(proj) });
	shortcuts.remove();
	check("without it, Foundry's own stacking is left alone", z(left) === leftBefore);
	hud.setPower(false, { silent: true });
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
