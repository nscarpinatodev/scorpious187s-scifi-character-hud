/*
 * Fallout 2d20 with Scorpious187's Pip-Boy: the device's switch brings up the Pip-Boy in place of
 * a projection. A player's is only ever their own character's; the GM's follows the selected
 * token. Closing the Pip-Boy's window turns the device off, and in any system the HUD has a sheet
 * for, nothing changes.
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
const warnings = [];
page.on('console', (m) => { if (m.type() === 'warn') warnings.push(m.text()); });
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome, PipBoy } = SFH;
	const projected = () => !!document.querySelector('#sfh-projection.sfh-visible');

	// the table: Ann plays Ann; Bo, a robot and an NPC are on the canvas too
	const ann = { id: 'a', name: 'Ann', type: 'character' };
	const bo = { id: 'b', name: 'Bo', type: 'character' };
	const robot = { id: 'r', name: 'Codsworth', type: 'robot' };
	const raider = { id: 'n', name: 'Raider', type: 'npc' };
	const player = { id: 'p', isGM: false, character: ann };
	const gm = { id: 'g', isGM: true, character: null };
	let me = player;
	Object.defineProperty(game, 'user', { configurable: true, get: () => me });
	let actors = [ann, bo, robot, raider];
	Object.defineProperty(game, 'actors', { configurable: true, get: () => Object.assign([...actors], { get: (id) => actors.find((x) => x.id === id) ?? null }) });
	const select = (...actors) => { globalThis.canvas = { tokens: { controlled: actors.map((actor) => ({ actor })) } }; };
	select();

	// the Pip-Boy module, as far as the HUD sees it: its api.open, and the window it opens
	const calls = [];
	let pipboyActive = true;
	const pipboy = {
		get active() { return pipboyActive; },
		api: {
			open(actor) {
				calls.push(`open ${actor.name}`);
				return {
					document: actor, rendered: true,
					async close() { this.rendered = false; calls.push(`close ${actor.name}`); Hooks.callAll('closeApplicationV2', this); },
				};
			},
		},
	};
	const otherModules = game.modules.get;
	game.modules.get = (id) => (id === 'scorpious187s-pip-boy' ? pipboy : otherModules(id));
	const off = async () => { DeviceChrome.setPower(false, { silent: true }); await wait(60); };
	const on = async () => { DeviceChrome.setPower(true, { silent: true }); await wait(60); };

	/* ---- when it applies ---- */
	check('in a system the HUD has a sheet for, the projection stays', !PipBoy.handles());
	game.system.id = 'fallout';
	check('in Fallout with the Pip-Boy, the Pip-Boy takes over', PipBoy.handles());
	pipboyActive = false;
	check('in Fallout without it, it does not', !PipBoy.handles());
	pipboyActive = true;

	/* ---- a player ---- */
	await on();
	check("the switch brings up the player's own character's Pip-Boy", calls.join() === 'open Ann' && DeviceChrome.power, calls);
	check('and no projection', !projected());
	select(bo);
	await PipBoy.follow();
	check("selecting someone else's token never shows a player theirs", calls.join() === 'open Ann', calls);
	await off();
	check('switching off puts it away', calls.join() === 'open Ann,close Ann' && !PipBoy.open, calls);
	calls.length = 0;
	await on();
	check('on again, it comes back', calls.join() === 'open Ann' && DeviceChrome.power, calls);
	calls.length = 0;

	/* ---- closing it from its own window ---- */
	const opened = [];
	const realOpen = pipboy.api.open;
	pipboy.api.open = (actor) => { const app = realOpen(actor); opened.push(app); return app; };
	await off(); calls.length = 0; opened.length = 0;
	await on();
	await opened[0].close();
	await wait(60);
	check("closing the Pip-Boy's window turns the device off", !DeviceChrome.power && !PipBoy.open, [DeviceChrome.power, calls]);
	calls.length = 0;

	/* ---- the GM ---- */
	me = gm;
	select(robot);
	await on();
	check("the GM's shows the selected token's", calls.join() === 'open Codsworth', calls);
	select(bo);
	await PipBoy.follow();
	check('and follows the selection, the device staying on', calls.join() === 'open Codsworth,close Codsworth,open Bo' && DeviceChrome.power && PipBoy.open, calls);
	select(raider);
	await PipBoy.follow();
	check('an NPC, which has no Pip-Boy, is passed over', calls.at(-1) === 'open Bo' && calls.length === 3, calls);
	select();
	await PipBoy.follow();
	check('letting go of every token keeps the last one', calls.length === 3 && PipBoy.open);
	await off();
	calls.length = 0;

	/* ---- the Pip-Boy as the actor's sheet, whose open throws part way ----
	 * As in Foundry: open() starts the sheet's render and brings it to the front before it is
	 * drawn, which throws; the window comes up anyway. */
	me = player;
	class PipBoyApp {
		constructor(actor) { this.document = actor; this.state = 0; }
		get rendered() { return this.state === 2; }
		render() { this.state = 1; foundry.applications.instances.set('sheet', this); setTimeout(() => { this.state = 2; }, 30); }
		async close() { calls.push(`close ${this.document.name}`); this.state = -1; foundry.applications.instances.delete('sheet'); Hooks.callAll('closeApplicationV2', this); }
	}
	globalThis.foundry ??= {};
	foundry.applications ??= {};
	foundry.applications.instances = new Map();
	foundry.applications.api ??= { ApplicationV2: { RENDER_STATES: { CLOSED: -1 } } };
	const sheet = new PipBoyApp(ann);
	ann.sheet = sheet;
	pipboy.api.open = () => { calls.push('open Ann (throws)'); sheet.render(); throw new TypeError("Cannot read properties of null (reading 'style')"); };
	const logged = [];
	const consoleError = console.error;
	console.error = (e) => logged.push(String(e));
	await on();
	console.error = consoleError;
	check('an open that throws part way still leaves the device on', DeviceChrome.power && PipBoy.open, [DeviceChrome.power, calls]);
	check('and the error is still reported', logged.some((m) => m.includes("reading 'style'")), logged);
	await off();
	check('switching off puts away the window it opened', calls.at(-1) === 'close Ann' && !PipBoy.open, calls);
	calls.length = 0;
	// switched off again while the window is still drawing
	await on();
	DeviceChrome.setPower(false, { silent: true });
	await wait(80);
	check('even while it is still drawing', calls.includes('close Ann') && sheet.state === -1, [calls, sheet.state]);
	calls.length = 0;
	delete ann.sheet;

	/* ---- nobody to show ---- */
	me = { id: 'q', isGM: false, character: null };
	actors = [];
	await on();
	check('with no character, nothing opens and the device stays off', !calls.length && !DeviceChrome.power, [calls, DeviceChrome.power]);
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const told = warnings.some((w) => /SFH\.NoCharacter|character/i.test(w));
if (!told) console.log('FAIL nobody was told there is no character to show');
const failed = results.filter((r) => !r.ok).length + errors.length + (told ? 0 : 1);
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length + 1}` : `PASS: ${results.length + 1} checks`);
process.exit(failed ? 1 : 0);
