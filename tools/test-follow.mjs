/*
 * Whose sheet the projection shows.
 *
 * A player's projection is only ever their own character: selecting another token, theirs or
 * not, changes nothing. The GM's follows the canvas: the last selected token whose actor is a
 * character or an NPC, kept when every token is let go so clicking from one token to another
 * never flickers, with anything else that can be selected (a familiar, a hazard) passed over.
 * Opening the HUD shows whoever is selected then; with nothing to show, the GM is told to select
 * a token. An NPC (PF2e and SF2e) is drawn as its own sheet has it: its traits for a byline, no
 * experience, hero points or rest, its own tabs ending in Notes, and only the skills it has.
 * A selected token's own actor (an unlinked token) is redrawn when it changes.
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
	const { DeviceChrome: hud, Projection, store, actor: asha } = SFH;
	store.sequences = false;

	// another character, an NPC, someone else's character and a familiar, each as a token
	const like = (extra) => Object.assign(Object.create(Object.getPrototypeOf(asha)), asha, extra);
	const kai = like({ id: 'kai', name: 'Kai Leng' });
	const geth = like({
		id: 'geth', name: 'Geth Trooper', type: 'npc', heroPoints: undefined, ancestry: null, heritage: null, class: null, background: null,
		system: { ...asha.system, details: { ...asha.system.details, xp: undefined, level: { value: 4 }, publicNotes: '<p>Networked synthetic infantry.</p>', privateNotes: '<p>Weak to overload.</p>' },
			traits: { ...asha.system.traits, value: ['construct', 'geth'], rarity: 'uncommon' } },
		skills: { athletics: { ...asha.skills.athletics, proficient: true }, stealth: { ...asha.skills.stealth, proficient: true }, medicine: { ...asha.skills.medicine, proficient: false } },
	});
	const theirs = like({ id: 'vex', name: 'Vex Kaori', isOwner: false });
	const drone = like({ id: 'drone', name: 'Combat Drone', type: 'familiar' });
	const everyone = [asha, kai, geth, theirs, drone];
	Object.defineProperty(game, 'actors', { configurable: true, get: () => Object.assign([...everyone], { get: (id) => everyone.find((a) => a.id === id) ?? null }) });
	CONFIG.PF2E.creatureTraits = { construct: 'Construct', geth: 'Geth' };
	CONFIG.PF2E.rarityTraits = { uncommon: 'Uncommon' };
	let user = { isGM: false, character: asha };
	Object.defineProperty(game, 'user', { configurable: true, get: () => user });
	globalThis.canvas = { tokens: { controlled: [] } };
	const warnings = [];
	const warn = ui.notifications.warn;
	ui.notifications.warn = (m) => warnings.push(m);

	// what module.mjs does on controlToken: the GM's projection follows once the canvas settles
	const select = async (...actors) => {
		canvas.tokens.controlled = actors.map((a) => ({ actor: a }));
		if (game.user.isGM) Projection.follow();
		await wait(150);
	};
	const q = (sel) => document.querySelector(`#sfh-projection ${sel}`);
	const shown = () => (q('.nm')?.textContent ?? '').trim();
	const power = async (on) => { hud.setPower(on, { silent: true }); await wait(400); };

	/* ---- the GM, first thing, with nothing selected ---- */
	user = { isGM: true, character: null };
	await power(true);
	check('the GM, with nothing selected, is told to select a token', !Projection.isOpen && /token on the canvas/.test(warnings.at(-1) ?? ''), [Projection.isOpen, warnings.at(-1)]);
	await power(false);

	/* ---- a player ---- */
	user = { isGM: false, character: asha };
	await power(true);
	check('a player sees their own character', shown() === 'Asha Rourke', shown());
	await select(kai);
	check('selecting another of their characters changes nothing', shown() === 'Asha Rourke', shown());
	Projection.follow();
	await wait(100);
	check('even if the projection is told to follow', shown() === 'Asha Rourke', shown());
	await power(false);
	canvas.tokens.controlled = [{ actor: geth }];
	await power(true);
	check('nor does opening the HUD with another token selected', shown() === 'Asha Rourke', shown());
	await power(false);

	/* ---- the GM ---- */
	user = { isGM: true, character: null };
	canvas.tokens.controlled = [{ actor: kai }];
	await power(true);
	check('opening the HUD shows whoever is selected', shown() === 'Kai Leng', shown());
	await select(geth);
	check('selecting an NPC shows it', shown() === 'Geth Trooper', shown());
	await select();
	check('letting go of every token keeps it', shown() === 'Geth Trooper', shown());
	await select(drone);
	check('a familiar is passed over', shown() === 'Geth Trooper', shown());
	await select(theirs);
	check("a player's character the GM selects is shown", shown() === 'Vex Kaori', shown());
	await select(kai, geth);
	check('of several selected, the last one', shown() === 'Geth Trooper', shown());
	await power(false);
	user = { isGM: false, character: asha };
	await power(true);
	check("a player's projection is their own character, whatever was shown before", shown() === 'Asha Rourke', shown());
	await power(false);
	user = { isGM: true, character: null };
	canvas.tokens.controlled = [{ actor: geth }];
	await power(true);

	/* ---- an NPC's sheet (PF2e and SF2e) ---- */
	check("its traits under its name, with its rarity", (q('.st')?.textContent ?? '').trim() === 'Uncommon · Construct · Geth', q('.st')?.textContent);
	check('no experience, and no rest', !q('[data-commit="xp"]') && !q('[data-act="rest"]'));
	check('no hero points', !q('[data-slot="vitals"] [data-act="hero"]'));
	check('dying is still tracked', !!q('[data-slot="vitals"] [data-act="dying"]'));
	const tabs = [...document.querySelectorAll('#sfh-projection [data-act="tab"]')].map((b) => b.dataset.k);
	check("its own sheet's tabs, ending in Notes", tabs.join() === 'character,actions,inventory,spellcasting,skills,effects,notes', tabs);
	const tab = async (id) => { q(`[data-act="tab"][data-k="${id}"]`).click(); await wait(200); };
	await tab('skills');
	const skills = [...document.querySelectorAll('#sfh-projection .proj-b [data-act="skill"]')].map((b) => b.dataset.k);
	check('only the skills it has, with no training to change', skills.join() === 'athletics,stealth' && !q('.proj-b [data-pick="rank"]'), skills);
	await tab('notes');
	const editors = [...document.querySelectorAll('#sfh-projection .proj-b prose-mirror')].map((e) => e.dataset.field);
	check('its notes, public and private, each in an editor', editors.join() === 'publicNotes,privateNotes', editors);
	await tab('character');
	const labels = [...document.querySelectorAll('#sfh-projection .proj-b .kv .lbl')].map((l) => l.textContent);
	check('no ancestry, class or background on its Creature tab', !labels.some((l) => /Ancestry|Heritage|Class|Background/.test(l)) && labels.includes('Size'), labels);
	await select(kai);
	check('a character after it has its own tabs and experience again', tabs.length && [...document.querySelectorAll('#sfh-projection [data-act="tab"]')].some((b) => b.dataset.k === 'feats') && !!q('[data-commit="xp"]'));

	/* ---- an unlinked token's actor: its updates arrive with the token and the scene above it ---- */
	const render = Projection.render;
	let drawn = 0;
	Projection.render = function () { drawn++; };
	const scene = { documentName: 'Scene', id: 'scene1', parent: null };
	const token = { documentName: 'Token', id: 'tok1', parent: scene };
	Projection.refreshFor({ documentName: 'Actor', id: 'kai', parent: token });
	Projection.refreshFor({ documentName: 'Item', id: 'i9', parent: { documentName: 'Actor', id: 'kai', parent: token } });
	Projection.refreshFor({ documentName: 'Actor', id: 'geth', parent: token });
	Projection.render = render;
	check("a selected token's own actor is redrawn when it or its things change, and no one else's", drawn === 2, drawn);

	await power(false);
	ui.notifications.warn = warn;
	delete globalThis.canvas;
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
