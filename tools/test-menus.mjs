/*
 * The right-click editors, on every device and look, at a roomy screen and a small one: experience
 * (with the level), hit points, hero points and one of the character's things. Each opens on the
 * stage, over every panel, so no panel's edge cuts it off: it lies wholly inside the stage, every
 * field and its Close button can be reached (nothing is drawn over them), and it opens beside
 * what was right-clicked rather than over it.
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
const results = [];
for (const [width, height] of [[1600, 900], [1280, 720]]) {
	await page.setViewport({ width, height });
	await page.goto(`file:///${dir}/harness-device.html`);
	await new Promise((r) => setTimeout(r, 900));
	results.push(...await page.evaluate(async (size) => {
		const out = [];
		const check = (name, ok, detail = '') => out.push({ name: `${size}: ${name}`, ok: !!ok, detail: JSON.stringify(detail) });
		const wait = (ms) => new Promise((r) => setTimeout(r, ms));
		const { DeviceChrome: hud, store, actor } = SFH;
		const { DEVICES } = await import('../scripts/constants.mjs');
		store.sequences = false;
		actor.itemTypes.effect[0].isOwner = true;
		const q = (sel) => document.querySelector(`#sfh-projection ${sel}`);
		const wear = async (id, dark = false) => {
			if (hud.power) hud.setPower(false, { silent: true });
			store.journalDark = dark;
			await game.settings.set(null, 'device', id);
			await wait(200);
			hud.setPower(true, { silent: true });
			await wait(350);
		};
		const open = async (target) => {
			const r = target.getBoundingClientRect();
			target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 4, clientY: r.top + 4 }));
			await wait(40);
			return q('.sfh-menu');
		};
		const close = async () => { document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(20); };
		const within = (inner, outer) => inner.left >= outer.left - 1 && inner.right <= outer.right + 1 && inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;

		const problems = {};
		const note = (what, where) => (problems[what] ??= []).push(where);
		const opened = {};
		for (const [id, dark] of [...Object.keys(DEVICES).map((d) => [d, false]), ['journal', true]]) {
			const label = dark ? `${id} (dark)` : id;
			await wear(id, dark);
			// the effect's name, from the Effects tab, stands for any of the character's things
			q('[data-act="tab"][data-k="effects"]')?.click();
			await wait(120);
			const targets = {
				experience: q('[data-menu="xp"] input'),
				'hit points': q('[data-menu="hp"] input[data-commit="hp"]'),
				'hero points': q('[data-menu="hero"] .seg'),
				'a thing of theirs': q('.proj-b [data-ro="item:e1"][draggable="true"]'),
			};
			for (const [kind, target] of Object.entries(targets)) {
				if (!target) continue;
				const host = target.closest('[data-menu], .li, .row, .cell') ?? target;
				const menu = await open(target);
				if (!menu) { note('it opens', `${label} ${kind}`); continue; }
				(opened[kind] ??= []).push(label);
				const stage = q('.sfh-stage');
				const m = menu.getBoundingClientRect();
				if (menu.parentElement !== stage) note('it is on the stage, over every panel', `${label} ${kind}`);
				if (!within(m, stage.getBoundingClientRect())) note('it lies wholly inside the stage', `${label} ${kind}`);
				const covered = [...menu.querySelectorAll('input, button')].filter((f) => {
					const r = f.getBoundingClientRect();
					const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
					return !(hit === f || f.contains(hit));
				});
				if (covered.length) note('every field and Close can be reached', `${label} ${kind}: ${covered.map((f) => f.dataset.commit ?? f.dataset.itemField ?? f.textContent).join(',')}`);
				const h = host.getBoundingClientRect();
				if (m.top < h.bottom - 1 && m.bottom > h.top + 1) note('it opens beside what was right-clicked, not over it', `${label} ${kind}`);
				await close();
				if (q('.sfh-menu')) note('clicking away closes it', `${label} ${kind}`);
			}
		}
		for (const what of ['it opens', 'it is on the stage, over every panel', 'it lies wholly inside the stage', 'every field and Close can be reached', 'it opens beside what was right-clicked, not over it', 'clicking away closes it']) {
			check(`${what}, on every device and look`, !problems[what], problems[what] ?? '');
		}
		check('experience, hit points, hero points and things all tried', ['experience', 'hit points', 'hero points', 'a thing of theirs'].every((k) => opened[k]?.length), Object.fromEntries(Object.entries(opened).map(([k, v]) => [k, v.length])));
		hud.setPower(false, { silent: true });
		return out;
	}, `${width}×${height}`));
}

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
