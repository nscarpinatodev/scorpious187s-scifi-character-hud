/*
 * Everyone's volume, from the Playlists tab. The GM, and only the GM, gets a button under Foundry's
 * own volume sliders; nothing is shown until it is pressed. Pressing it asks every connected player
 * over the module's socket and lists each one's music, environment and interface volume as their
 * own sliders show them, with a level at zero marked, and whether they have muted Foundry or their
 * browser is holding sound back until they click. Whoever does not answer in time is listed as
 * such; when everyone has answered the list comes up at once. A player asked answers the GM who
 * asked, with their own settings. The list survives the tab being drawn again, and the button
 * puts it away.
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
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { store } = SFH;

	// Foundry's pieces this touches: users, the socket, the audio helper and its settings
	const sent = [];
	game.socket = { emit: (name, data) => sent.push([name, data]), on() {} };
	foundry.utils = { randomID: () => Math.random().toString(36).slice(2, 12) };
	foundry.audio = { AudioHelper: { volumeToInput: (v, o = 1.5) => Math.pow(v, 1 / o), volumeToPercentage: (v) => `${(v * 100).toFixed(0)}%` } };
	game.audio = { globalMute: false, locked: false };
	// Foundry's own words for its three channels
	const words = { 'AUDIO.CHANNELS.MUSIC.label': 'Music', 'AUDIO.CHANNELS.ENVIRONMENT.label': 'Environment', 'AUDIO.CHANNELS.INTERFACE.label': 'Interface' };
	const localize = game.i18n.localize;
	game.i18n.localize = (k) => words[k] ?? localize(k);
	Object.assign(store, { globalPlaylistVolume: 0.125, globalAmbientVolume: 0.5, globalInterfaceVolume: 1 });
	const gm = { id: 'gm', name: 'Gamemaster', isGM: true, active: true, color: { css: '#c33' } };
	const asha = { id: 'asha', name: 'Asha', isGM: false, active: true, color: { css: '#3c6' } };
	const vex = { id: 'vex', name: 'Vex', isGM: false, active: true, color: { css: '#36c' } };
	const away = { id: 'away', name: 'Away', isGM: false, active: false, color: { css: '#999' } };
	let users = [gm, asha, vex, away];
	Object.defineProperty(game, 'users', { configurable: true, get: () => users });
	let me = gm;
	Object.defineProperty(game, 'user', { configurable: true, get: () => me });

	const { addVolumeCheck, onVolumeMessage, myVolumes } = await import('../scripts/interface/volumes.mjs');
	// the Playlists tab's volume controls, as Foundry draws them
	const tab = () => {
		const el = document.createElement('section');
		el.innerHTML = '<div class="global-volume expanded"><header class="playlist-header"></header><div class="expandable"><div class="wrapper"><ol class="plain"></ol></div></div></div>';
		document.body.append(el);
		return el;
	};

	/* ---- a player ---- */
	me = asha;
	const theirs = tab();
	addVolumeCheck(theirs);
	check('a player gets no button', !theirs.querySelector('.sfh-vol-check'));
	game.audio.globalMute = true;
	onVolumeMessage({ type: 'volumeAsk', ask: 'q1', from: 'gm' });
	const reply = sent.at(-1)?.[1];
	check('asked, a player answers the GM who asked, with their own settings',
		reply?.type === 'volumeAnswer' && reply.to === 'gm' && reply.ask === 'q1' && reply.answer.userId === 'asha' && reply.answer.music === 0.125 && reply.answer.muted === true, reply);
	game.audio.globalMute = false;
	theirs.remove();

	/* ---- the GM ---- */
	me = gm;
	let el = tab();
	addVolumeCheck(el);
	addVolumeCheck(el);
	const button = () => el.querySelector('.sfh-vol-check');
	check('the GM gets one button under the volume sliders, and no list yet', el.querySelectorAll('.sfh-vol-check').length === 1 && !el.querySelector('.sfh-volumes'));
	sent.length = 0;
	button().click();
	await wait(30);
	const ask = sent.find(([, d]) => d.type === 'volumeAsk')?.[1];
	check('pressing it asks everyone over the module socket', sent[0]?.[0] === 'module.scorpious187s-scifi-character-hud' && ask?.from === 'gm', sent);
	check('and says so while it waits', button().disabled && /Asking/.test(button().textContent));
	// Asha answers: muted, environment at zero, sound still held back by her browser; Vex does not answer
	onVolumeMessage({ type: 'volumeAnswer', ask: ask.ask, to: 'gm', answer: { userId: 'asha', music: 0.125, environment: 0, interface: 0.5, muted: true, locked: true } });
	onVolumeMessage({ type: 'volumeAnswer', ask: 'someone-else', to: 'gm', answer: { userId: 'vex', music: 1, environment: 1, interface: 1 } });
	await wait(1700);
	const rows = () => [...el.querySelectorAll('.sfh-vol-who')];
	const row = (name) => rows().find((r) => r.querySelector('.sfh-vol-name').textContent.trim() === name);
	check('a row for everyone connected, and no one who is not', rows().map((r) => r.querySelector('.sfh-vol-name').textContent.trim()).join() === 'Gamemaster,Asha,Vex', rows().map((r) => r.textContent));
	check("the GM's own, read here", /Music 25%/.test(row('Gamemaster').textContent) && /Environment 63%/.test(row('Gamemaster').textContent) && /Interface 100%/.test(row('Gamemaster').textContent), row('Gamemaster').textContent.replace(/\s+/g, ' '));
	check("a player's, as their own sliders show them", /Music 25%/.test(row('Asha').textContent) && /Environment 0%/.test(row('Asha').textContent) && /Interface 63%/.test(row('Asha').textContent), row('Asha').textContent.replace(/\s+/g, ' '));
	check('a level at zero is marked', row('Asha').querySelector('.sfh-vol-levels .bad')?.textContent.includes('Environment'));
	check('muted, and sound held back until a click, are said', /Muted/.test(row('Asha').textContent) && /until they click/.test(row('Asha').textContent));
	check('an answer to someone else\'s question is not taken', /No answer/.test(row('Vex').textContent));
	check('the button now puts the list away', !button().disabled && /Hide/.test(button().textContent));

	// the tab is drawn again, as it is whenever a sound plays: the list comes back with it
	el.remove();
	el = tab();
	addVolumeCheck(el);
	check('drawn again, the tab keeps the list', rows().length === 3 && /Hide/.test(button().textContent));
	button().click();
	await wait(30);
	check('pressed again, the list goes', !el.querySelector('.sfh-volumes') && /Everyone/.test(button().textContent));

	// everyone answers: the list comes up as soon as the last one does
	sent.length = 0;
	const started = performance.now();
	button().click();
	await wait(20);
	const ask2 = sent.find(([, d]) => d.type === 'volumeAsk')?.[1];
	for (const id of ['asha', 'vex']) onVolumeMessage({ type: 'volumeAnswer', ask: ask2.ask, to: 'gm', answer: { ...myVolumes(), userId: id } });
	await wait(80);
	check('with every answer in, the list is up at once', !!el.querySelector('.sfh-volumes') && performance.now() - started < 1000 && !/No answer/.test(el.textContent), performance.now() - started);
	el.remove();
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
