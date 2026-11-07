/*
 * Fallout 2d20's AP tracker rides on the device. The system puts it before the macro bar in
 * #ui-bottom; with the bar on the device it would be left loose in the page, where Foundry's
 * layout gives it width taken from the interface. So the device carries it: Overseer AP to the
 * left of the bar, Party AP to the right, in the device's colors, through rebuilds; and it goes
 * back where the system keeps it when the device comes down.
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
	const { DeviceChrome } = SFH;
	const deck = () => document.getElementById('sfh-deck');
	const rect = (el) => el.getBoundingClientRect();

	// the tracker as the fallout system draws it (templates/apps/ap-tracker.hbs), for a GM
	const resource = (kind, title, value, cog = '') => `
		<div class="ap-resource ${kind}"${kind === 'maxAP-box' ? ' hidden' : ''}>
			<div class="flexcol"><h4>${title}${cog}</h4></div>
			<div class="flexrow align-mid">
				<a class="ap-btn" data-action="decrementPool" data-type="${kind}"><i class="fa-solid fa-minus"></i></a>
				<input class="ap-input num-short-3" data-type="${kind}" type="number" value="${value}">
				<a class="ap-btn" data-action="incrementPool" data-type="${kind}"><i class="fa-solid fa-plus"></i></a>
			</div>
		</div>`;
	const form = document.createElement('form');
	form.id = 'ap-tracker-app';
	form.className = 'fallout ap-tracker';
	form.innerHTML = resource('gm', 'Overseer AP', 3) + resource('party', 'Party AP', 5, ' <a data-action="toggleMaxAP" class="toggle-maxAp"><i class="fas fa-cog"></i></a>') + resource('maxAP-box', 'Max Party AP', 6);
	const widthBefore = rect(document.getElementById('sfh-device')).width;

	/* ---- where the system leaves it ---- */
	document.body.append(form);
	Hooks.callAll('renderAPTrackerV2', {});
	await wait(100);
	check('a tracker left loose in the page goes onto the device', form.parentElement === deck(), form.parentElement?.id);
	check('where it takes no width from the page', rect(form).width === 0 && getComputedStyle(form).display === 'contents');
	const hotbar = rect(document.getElementById('hotbar'));
	const gm = form.querySelector('.ap-resource.gm');
	const party = form.querySelector('.ap-resource.party');
	check('Overseer AP to the left of the macro bar', rect(gm).right <= hotbar.left + 1, [rect(gm).right, hotbar.left]);
	check('Party AP to the right of it', rect(party).left >= hotbar.right - 1, [rect(party).left, hotbar.right]);
	check('Max AP stays shut until its cog opens it', !form.querySelector('.maxAP-box').offsetWidth);
	check('the device widens to carry them', rect(document.getElementById('sfh-device')).width > widthBefore, [rect(document.getElementById('sfh-device')).width, widthBefore]);
	const hot = getComputedStyle(document.body).getPropertyValue('--sfh-hot').trim();
	const input = gm.querySelector('input');
	const toRgb = (c) => { const el = document.createElement('i'); el.style.color = c; document.body.append(el); const v = getComputedStyle(el).color; el.remove(); return v; };
	check("the counts are in the device's colors", getComputedStyle(input).color === toRgb(hot), [getComputedStyle(input).color, hot]);
	check('still the system\'s own form: its buttons and inputs are inside it', form.contains(gm.querySelector('[data-action="incrementPool"]')) && form.contains(input));
	form.querySelector('.maxAP-box').hidden = false;
	await wait(50);
	check('opened, Max AP stands to the right too', rect(form.querySelector('.maxAP-box')).left >= hotbar.right - 1);
	form.querySelector('.maxAP-box').hidden = true;

	/* ---- through the device's own changes ---- */
	await game.settings.set(null, 'device', 'tron');
	await wait(400);
	check('changing the device keeps it on the deck', form.parentElement === deck() && form.isConnected);
	Hooks.callAll('renderAPTrackerV2', {});
	check('a redraw of the tracker leaves it there', form.parentElement === deck());
	await game.settings.set(null, 'device', 'omni');
	await wait(400);

	/* ---- the device coming down ---- */
	DeviceChrome.unmount();
	const bottom = document.getElementById('ui-bottom');
	check('taken down, the device gives it back where the system keeps it, before the macro bar',
		form.parentElement === bottom && form.nextElementSibling?.id === 'hotbar', [form.parentElement?.id, form.nextElementSibling?.id]);
	DeviceChrome.mount();
	await wait(200);
	check('and takes it again when it comes back', form.parentElement === deck());

	/* ---- the system's own first render ----
	 * As APTrackerV2 does it: inserted loose into the page, then placed before #hotbar in
	 * #ui-bottom, which throws with the bar on the device and would end the render there. */
	form.remove();
	const { adoptApTracker } = await import('../scripts/interface/ap-tracker.mjs');
	class Base { async _onFirstRender() {} }
	class APTrackerV2 extends Base {
		async _onFirstRender(...args) {
			await super._onFirstRender(...args);
			const uiBottom = document.querySelector('#ui-bottom');
			uiBottom.insertBefore(this.element, uiBottom.querySelector('#hotbar'));
		}
		async render() {
			this.element = form;
			document.body.append(form);
			await this._onFirstRender();
			this.rendered = true;
			Hooks.callAll('renderAPTrackerV2', this);
		}
	}
	let failed = null;
	await new APTrackerV2().render().catch((e) => { failed = e; });
	check('unadopted, the system\'s render fails with the bar on the device', failed?.name === 'NotFoundError' && form.parentElement === document.body, failed?.name);
	check('adopting it is done once', adoptApTracker(APTrackerV2) && !adoptApTracker(APTrackerV2));
	failed = null;
	const tracker = new APTrackerV2();
	await tracker.render().catch((e) => { failed = e; });
	check('adopted, the render goes through', !failed && tracker.rendered, failed && String(failed));
	check('with the tracker on the device', form.parentElement === deck());
	// any other failure is still the system's
	class Broken extends Base { async _onFirstRender() { throw new TypeError('not ours'); } }
	adoptApTracker(Broken);
	failed = null;
	await new Broken()._onFirstRender().catch((e) => { failed = e; });
	check('any other error in it still surfaces', failed instanceof TypeError);
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
