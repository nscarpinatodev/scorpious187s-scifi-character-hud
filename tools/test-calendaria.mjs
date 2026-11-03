/*
 * Put Calendaria's HUD, with Calendaria's own stylesheet and a 3DS:ATLAS theme laid on it the way
 * Atlas lays one, under the module's, and check that the setting puts it in each device's colors,
 * follows the device, and hands it back to Atlas's theme when switched off. With an output folder
 * as the argument, it also shoots the HUD on every device.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// puppeteer lives in the sibling conversion repo; this tool is dev-only
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const dir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');
const shots = process.argv[2];
const calendaria = `file:///${process.env.LOCALAPPDATA.replace(/\\/g, '/')}/FoundryVTT/Data/modules/calendaria/styles/calendaria.css`;

const browser = await puppeteer.launch({
	executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 400 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));

const results = await page.evaluate(async (href) => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));

	// Calendaria's stylesheet goes before the module's, as a module listed earlier would load
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = href;
	const loaded = new Promise((r) => { link.onload = r; link.onerror = r; });
	document.querySelector('link[href$="interface.css"]').before(link);
	await loaded;
	const sample = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'calendaria-hud' }));
	check('Calendaria\'s stylesheet loaded', getComputedStyle(sample).position === 'fixed');
	sample.remove();

	// Atlas writes the chosen theme as a <style> in the head, on Calendaria's scope; Parchment is a light one
	const atlas = document.createElement('style');
	atlas.id = 'atlas-theme-calendaria';
	atlas.textContent = `.calendaria {
		--atlas-bg: #c8aa78; --atlas-bg-lighter: #e0cca0; --atlas-bg-hover: #b89868; --atlas-border: #9a7840;
		--atlas-text: #2a1a08; --atlas-text-dim: #5a4020; --atlas-primary: #7a3010; --atlas-button-bg: #b89868;
		--atlas-button-text: #2a1a08; --atlas-shadow-color: rgb(0 0 0 / 40%); --atlas-today: #a02020;
		--atlas-surface-dim: #e0cca0; --atlas-surface-dim-75: rgb(224 204 160 / 75%); color-scheme: light;
	}`;
	document.head.append(atlas);

	// the HUD as Calendaria renders it: calendaria-hud.hbs, with the bar and the tray in its content,
	// on an element without a frame, which Foundry does not mark as an application
	const hud = document.createElement('div');
	hud.id = 'calendaria-hud';
	hud.className = 'calendaria calendaria-hud';
	hud.style.cssText = 'top:120px;left:50%;transform:translateX(-50%)';
	hud.innerHTML = `<div class="content"><div class="bar-wrapper"><div class="bar">
		<div class="section left"><div class="btn-group left">
			<button type="button" class="btn" data-action="addNote"><i class="fa-solid fa-calendar-plus"></i></button>
			<button type="button" class="btn" data-action="openChronicle"><i class="fa-solid fa-scroll"></i></button>
		</div><div class="info-panel"><span class="date">14 Kythorn, 1492 DR</span></div></div>
		<div class="center"><div class="time-wrapper"><span class="time">15:20:07</span>
			<button type="button" class="play-btn" data-action="toggleTimeFlow"><i class="fa-solid fa-play"></i></button></div></div>
		<div class="section right"><div class="indicators"><span class="weather-label">Clear skies</span></div>
		<div class="btn-group right"><button type="button" class="btn" data-action="openMiniCal"><i class="fa-solid fa-calendar"></i></button>
			<button type="button" class="btn" data-action="openSettings"><i class="fa-solid fa-gear"></i></button></div></div>
	</div><div class="tray visible">
		<button type="button" class="time-btn"><i class="fa-solid fa-sun"></i></button>
		<button type="button" class="time-btn"><i class="fa-solid fa-moon"></i></button>
	</div></div></div>`;
	document.body.append(hud);

	const probe = (css) => {
		const p = document.createElement('span');
		p.style.color = css;
		document.body.append(p);
		const value = getComputedStyle(p).color;
		p.remove();
		return value;
	};
	const device = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();
	const bar = () => getComputedStyle(hud.querySelector('.bar'));
	const date = () => getComputedStyle(hud.querySelector('.date'));
	const time = () => getComputedStyle(hud.querySelector('.time'));

	/* ---- off: Atlas's theme ---- */
	SFH.store.calendaria = false;
	game.settings.set(null, 'device', 'omni');
	await wait(150);
	check('the setting reaches the page', document.body.dataset.sfhCalendaria === 'off', document.body.dataset.sfhCalendaria);
	check('off, the bar is Atlas\'s theme', bar().backgroundColor === probe('#c8aa78'), bar().backgroundColor);
	check('and so is its text', date().color === probe('#2a1a08'), date().color);

	/* ---- on, on every device ---- */
	SFH.store.calendaria = true;
	for (const id of ['omni', 'wrist', 'gdi', 'nod', 'tron']) {
		game.settings.set(null, 'device', id);
		await wait(150);
		const bg = probe(`rgb(${device('--sfh-bg-rgb')})`);
		check(`${id}: the setting reaches the page`, document.body.dataset.sfhCalendaria === 'on');
		check(`${id}: the bar is the device's background`, bar().backgroundColor === bg, [bar().backgroundColor, bg]);
		check(`${id}: its border is the device's line`, bar().borderTopColor === probe(device('--sfh-line')), [bar().borderTopColor, device('--sfh-line')]);
		check(`${id}: its corners are the device's`, bar().borderTopLeftRadius === device('--sfh-radius'), [bar().borderTopLeftRadius, device('--sfh-radius')]);
		check(`${id}: the date is the device's text`, date().color === probe(device('--sfh-text')), date().color);
		check(`${id}: in the device's face`, date().fontFamily.split(',')[0].replace(/"/g, '') === device('--sfh-face').split(',')[0].replace(/"/g, ''), [date().fontFamily, device('--sfh-face')]);
		check(`${id}: the clock in its mono face`, time().fontFamily.split(',')[0].replace(/"/g, '') === device('--sfh-mono').split(',')[0].replace(/"/g, ''), time().fontFamily);
		const button = getComputedStyle(hud.querySelector('.btn'));
		check(`${id}: no parchment left anywhere in it`, ![bar().backgroundColor, date().color, button.color, button.backgroundColor, getComputedStyle(hud.querySelector('.tray')).backgroundColor].some((c) => [probe('#c8aa78'), probe('#2a1a08'), probe('#b89868')].includes(c)), [button.color, button.backgroundColor]);
		check(`${id}: dark, so the browser draws dark controls`, getComputedStyle(hud).colorScheme === 'dark', getComputedStyle(hud).colorScheme);
	}

	/* ---- Calendaria's windows, which read --background from Atlas's colors ---- */
	const win = document.createElement('div');
	win.className = 'calendaria mini-cal application';
	document.body.append(win);
	check('a Calendaria window\'s background is the device\'s', getComputedStyle(win).getPropertyValue('--background').trim() !== '' && probe(getComputedStyle(win).getPropertyValue('--atlas-bg').trim()) === probe(`rgb(${device('--sfh-bg-rgb')})`), getComputedStyle(win).getPropertyValue('--atlas-bg'));
	win.remove();

	/* ---- the player's own heading color reaches its titles ---- */
	document.body.dataset.sfhHeadingColor = '';
	document.body.style.setProperty('--sfh-heading-color', '#00ff88');
	check('a chosen heading color reaches its titles', probe(getComputedStyle(hud).getPropertyValue('--atlas-title-text').trim()) === probe('#00ff88'), getComputedStyle(hud).getPropertyValue('--atlas-title-text'));
	delete document.body.dataset.sfhHeadingColor;
	document.body.style.removeProperty('--sfh-heading-color');

	/* ---- switched off again, Atlas has it back ---- */
	SFH.store.calendaria = false;
	document.body.dataset.sfhCalendaria = 'off';
	// the date eases from one color to the next
	await wait(400);
	check('off again, Atlas\'s theme is back', bar().backgroundColor === probe('#c8aa78') && date().color === probe('#2a1a08'), [bar().backgroundColor, date().color]);
	check('and Atlas\'s style was never touched', document.getElementById('atlas-theme-calendaria')?.textContent.includes('#c8aa78'));
	SFH.store.calendaria = true;
	document.body.dataset.sfhCalendaria = 'on';
	return out;
}, calendaria);

if (shots) {
	for (const id of ['omni', 'wrist', 'gdi', 'nod', 'tron']) {
		await page.evaluate((d) => game.settings.set(null, 'device', d), id);
		await new Promise((r) => setTimeout(r, 200));
		await page.screenshot({ path: `${shots}/calendaria-${id}.png`, clip: { x: 250, y: 90, width: 900, height: 140 } });
	}
}
await browser.close();

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
