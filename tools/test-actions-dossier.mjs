/*
 * What the mock-up had that the build did not, on the real projection.
 *
 * The Actions tab's encounter, exploration and downtime: each shows its own actions, sorted by the
 * traits the sheet sorts them by; strikes and the held shield are an encounter's; the choice is
 * kept per character.
 *
 * The Mass Effect dossier: the conversion's shields read from where it keeps them (temporary hit
 * points, the Kinetic Shield's maximum and regeneration, and a capacitor that raises them while
 * invested); −5 lowers them alone, marked so the conversion does not route it as damage; the
 * recharge adds their regeneration up to full; the credits and the omni-gel are shown; and the
 * panel is tall enough for all of it on every device.
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
	const { DeviceChrome: hud, store, actor } = SFH;
	const q = (sel) => document.querySelector(`#sfh-projection ${sel}`);
	const qa = (sel) => [...document.querySelectorAll(`#sfh-projection ${sel}`)];
	store.sequences = false;
	const wear = async (id) => {
		if (hud.power) hud.setPower(false, { silent: true });
		await game.settings.set(null, 'device', id);
		await wait(250);
		hud.setPower(true, { silent: true });
		await wait(400);
	};
	await wear('omni');

	/* ---- the Actions tab's three kinds ---- */
	q('[data-act="tab"][data-k="actions"]').click();
	await wait(150);
	const names = () => qa('.proj-b .sfh-action .nm').map((n) => n.textContent);
	const kinds = () => qa('.proj-b .sfh-kinds [data-act="actionKind"]');
	check('the three kinds, encounter first', kinds().map((b) => b.dataset.k).join() === 'encounter,exploration,downtime', kinds().map((b) => b.dataset.k));
	check('named from the language file', kinds().map((b) => b.textContent).join() === 'Encounter,Exploration,Downtime', kinds().map((b) => b.textContent));
	check('an encounter is shown first', q('.proj-b .sfh-kinds .on')?.dataset.k === 'encounter');
	check('an encounter has the strikes', /Strikes/.test(q('.proj-b').textContent) && qa('.proj-b [data-act="strike"]').length > 0);
	check('and the actions without exploration or downtime', names().includes('Biotic Charge') && names().includes('Aid') && !names().includes('Search') && !names().includes('Earn Income'), names());
	const pick = async (kind) => { q(`.proj-b [data-act="actionKind"][data-k="${kind}"]`).click(); await wait(150); };
	await pick('exploration');
	check('exploration: what has the exploration trait', names().join() === 'Search', names());
	check('and no strikes', !/Strikes/.test(q('.proj-b').textContent) && !q('.proj-b [data-act="strike"]'));
	check('marked as the one shown', q('.proj-b .sfh-kinds .on')?.dataset.k === 'exploration');
	check('an action with no cost shows none', !q('.proj-b .sfh-action .cost')?.textContent.trim(), q('.proj-b .sfh-action .cost')?.textContent);
	await pick('downtime');
	check('downtime: what has the downtime trait', names().join() === 'Earn Income', names());
	// another tab and back: still downtime
	q('[data-act="tab"][data-k="inventory"]').click();
	await wait(120);
	q('[data-act="tab"][data-k="actions"]').click();
	await wait(150);
	check('kept when the tab is left and come back to', q('.proj-b .sfh-kinds .on')?.dataset.k === 'downtime');
	await pick('encounter');

	/* ---- the dossier ---- */
	const temp = () => actor.system.attributes.hp.temp;
	actor.system.attributes.hp.temp = 22;
	await wear('omni');
	const dossier = () => q('[data-slot="extras"]');
	check('the shields are the conversion\'s temporary hit points over its maximum, raised by the capacitor', /22\s*\/\s*40/.test(dossier().querySelector('.sfh-me-shields').textContent), dossier().querySelector('.sfh-me-shields').textContent.replace(/\s+/g, ' '));
	check('the recharge is the shield\'s regeneration', dossier().querySelector('[data-act="shieldRegen"]').textContent.trim() === '+10');
	dossier().querySelector('[data-act="shieldAdjust"]').click();
	await wait(150);
	check('−5 lowers them by five', temp() === 17, temp());
	check('marked as the shields alone, so the conversion does not route it through barrier and armor', actor.lastUpdate?.options?.['mass-effect-sf2e-conversion']?.shieldRemoval === true, actor.lastUpdate?.options);
	check('and the panel follows', /17\s*\/\s*40/.test(dossier().querySelector('.sfh-me-shields').textContent));
	dossier().querySelector('[data-act="shieldRegen"]').click();
	await wait(150);
	check('the recharge adds the regeneration', temp() === 27, temp());
	actor.system.attributes.hp.temp = 36;
	await wear('omni');
	dossier().querySelector('[data-act="shieldRegen"]').click();
	await wait(150);
	check('up to full and no further', temp() === 40, temp());
	check('full, the recharge is spent', dossier().querySelector('[data-act="shieldRegen"]').disabled);
	actor.system.attributes.hp.temp = 3;
	await wear('omni');
	dossier().querySelector('[data-act="shieldAdjust"]').click();
	await wait(150);
	check('−5 stops at empty', temp() === 0, temp());
	check('empty, −5 is spent', dossier().querySelector('[data-act="shieldAdjust"]').disabled);
	actor.system.attributes.hp.temp = 22;
	await wear('omni');
	check('the credits, as the system writes the money', /Credits\s*4,820 cr/i.test(dossier().querySelector('.sfh-me-kit').textContent.replace(/\s+/g, ' ')), dossier().querySelector('.sfh-me-kit').textContent.replace(/\s+/g, ' '));
	check('the omni-gel carried', /Omni-Gel\s*6/i.test(dossier().querySelector('.sfh-me-kit').textContent.replace(/\s+/g, ' ')));
	check('the omni-gel describes itself in the readout', dossier().querySelector('.sfh-me-gel')?.dataset.ro === 'item:i5');

	// tall enough for all of it, everywhere
	for (const id of ['omni', 'tron', 'vambrace', 'journal', 'wrist', 'gdi', 'nod']) {
		await wear(id);
		const slot = dossier();
		const box = slot.getBoundingClientRect();
		const k = box.height / slot.offsetHeight;
		const lowest = Math.max(...[...slot.querySelectorAll('.sfh-me-kit, .sfh-me-shields, button')].map((e) => e.getBoundingClientRect().bottom));
		const wraps = [...slot.querySelectorAll('.sfh-me-v')].some((v) => v.getClientRects().length > 1 || v.offsetHeight > 22);
		check(`${id}: the dossier holds all it shows`, (lowest - box.bottom) / k <= 0.5, +((lowest - box.bottom) / k).toFixed(1));
		check(`${id}: the shields' value on one line`, !wraps);
	}
	hud.setPower(false, { silent: true });
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
