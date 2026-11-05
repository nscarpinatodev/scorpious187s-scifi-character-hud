/*
 * The sidebar's Scenes tab: a click views the scene, Shift+click opens its configuration, and the
 * setting can swap them back to Foundry's way. Only the Scenes tab changes: another directory,
 * built on the same base, still opens what is clicked. A scene not yet loaded into the collection
 * is fetched first, as Foundry's own click does.
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
	const calls = [];

	// Foundry's directories, as far as the click goes: the base opens the clicked document's sheet
	class DocumentDirectory {
		constructor(collection) { this.collection = collection; }
		async _onClickEntry(event, target) {
			event.preventDefault();
			const { entryId } = target.closest('[data-entry-id]').dataset;
			const doc = this.collection.get(entryId) ?? await this.collection.getDocument(entryId);
			calls.push(['sheet', doc.id]);
		}
	}
	class SceneDirectory extends DocumentDirectory {}
	class ActorDirectory extends DocumentDirectory {}
	foundry.applications.sidebar = { tabs: { SceneDirectory, ActorDirectory } };

	const scene = (id) => ({ id, view: async () => calls.push(['view', id]) });
	const loaded = { bridge: scene('bridge') };
	const scenes = new SceneDirectory({ get: (id) => loaded[id] ?? null, getDocument: async (id) => { calls.push(['fetch', id]); return scene(id); } });
	const actors = new ActorDirectory({ get: (id) => ({ id }), getDocument: async (id) => ({ id }) });
	const entry = (id) => { const li = document.createElement('li'); li.dataset.entryId = id; const a = document.createElement('a'); li.append(a); return a; };
	const click = (app, id, shiftKey = false) => app._onClickEntry({ shiftKey, preventDefault() {} }, entry(id));

	const { viewScenesOnClick } = await import('../scripts/interface/scene-directory.mjs');
	check('the Scenes tab takes the change', viewScenesOnClick() === true);
	check('a click views the scene by default', game.settings.get(null, 'sceneClick') === 'view');

	await click(scenes, 'bridge');
	check('a click on a scene views it', JSON.stringify(calls.at(-1)) === '["view","bridge"]', calls.at(-1));
	await click(scenes, 'bridge', true);
	check('Shift+click opens its configuration', JSON.stringify(calls.at(-1)) === '["sheet","bridge"]', calls.at(-1));
	await click(scenes, 'cargo');
	check('a scene not yet loaded is fetched, then viewed', JSON.stringify(calls.slice(-2)) === '[["fetch","cargo"],["view","cargo"]]', calls.slice(-2));
	await click(actors, 'asha');
	check('another directory still opens what is clicked', JSON.stringify(calls.at(-1)) === '["sheet","asha"]', calls.at(-1));

	await game.settings.set(null, 'sceneClick', 'configure');
	await click(scenes, 'bridge');
	check("set to Foundry's way, a click opens the configuration", JSON.stringify(calls.at(-1)) === '["sheet","bridge"]', calls.at(-1));
	await click(scenes, 'bridge', true);
	check('and Shift+click views it', JSON.stringify(calls.at(-1)) === '["view","bridge"]', calls.at(-1));
	await game.settings.set(null, 'sceneClick', 'view');
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
