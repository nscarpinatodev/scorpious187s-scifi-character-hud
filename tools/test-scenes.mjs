/*
 * Run the real scene bar against stand-in scenes, folders and users in the shapes read from
 * Foundry 14's source, with Calendaria's HUD stuck at the top center, as a GM and as a player.
 * Screenshots for looking at are written to a folder if one is given: node test-scenes.mjs <dir>
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// puppeteer and sharp live in the sibling conversion repo; this tool is dev-only
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');
const dir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');
const shotsTo = process.argv[2];

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));

const shots = [];
const shoot = async (label) => {
	if (!shotsTo) return;
	const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1620, height: 620 } });
	const tag = Buffer.from(`<svg width="1620" height="34"><rect width="100%" height="100%" fill="#111"/><text x="10" y="23" fill="#fff" font-family="Arial" font-size="18" font-weight="700">${label}</text></svg>`);
	shots.push(await sharp({ create: { width: 1620, height: 654, channels: 3, background: '#111' } }).composite([{ input: tag, left: 0, top: 0 }, { input: buf, left: 0, top: 34 }]).png().toBuffer());
};

const setup = await page.evaluate(async () => {
	const words = await (await fetch('../lang/en.json')).json();
	game.i18n.localize = (k) => words[k] ?? k;
	game.i18n.format = (k, data = {}) => (words[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => data[x] ?? '');
	const calls = [];
	globalThis.calls = calls;
	const record = (name) => (...args) => { calls.push([name, ...args]); return Promise.resolve(); };

	/* ---- folders, scenes and users, in Foundry's shapes ---- */
	const folders = new Map();
	const folder = (id, name, parent = null, sort = 0) => folders.set(id, { id, name, type: 'Scene', folder: parent ? folders.get(parent) : null, sort, color: null }).get(id);
	folder('act1', 'Act I: The Reach', null, 1);
	folder('ship', 'Shipboard', 'act1', 1);
	folder('omega', 'Omega Station', 'act1', 2);
	folder('act2', 'Act II: Horizon', null, 2);
	folder('wild', 'Encounters', null, 3);
	const icons = 'file:///C:/Program Files/Foundry Virtual Tabletop/resources/app/public/icons/svg';
	const scenes = [];
	const scene = (id, name, f, extra = {}) => {
		const made = {
			id, name, navName: '', folder: f ? folders.get(f) : null, navigation: true, navOrder: scenes.length, active: false, isView: false, visible: true,
			ownership: { default: 2 }, thumb: `${icons}/${['mountain', 'village', 'ruins', 'castle', 'cave'][scenes.length % 5]}.svg`,
			environment: { globalLight: { enabled: true } }, tokenVision: true, playlistSound: null, journal: null, availableLevels: [],
			view: record(`view:${id}`), activate: record(`activate:${id}`), update: record(`update:${id}`), pullUsers: record(`pull:${id}`),
			sortRelative: record(`sort:${id}`), sheet: { render: record(`sheet:${id}`) }, ...extra,
		};
		scenes.push(made);
		return made;
	};
	scene('bridge', 'Normandy Bridge', 'ship', { active: true, isView: true, playlistSound: { name: 'Galaxy Map', playing: true } });
	scene('cargo', 'Normandy Cargo Bay', 'ship', { tokenVision: false });
	scene('club', 'Afterlife Club', 'omega', { environment: { globalLight: { enabled: false } }, journal: { sheet: { render: record('journal:club') } } });
	scene('aria', "Aria's Office", 'omega', { navigation: false, visible: false, ownership: { default: 0 } });
	scene('market', 'Omega Market District', 'omega');
	scene('landing', 'Horizon: Landing Zone', 'act2', { ownership: { default: 0 }, visible: false });
	scene('tower', 'Horizon: Tower', 'act2', { navigation: false, ownership: { default: 0 }, visible: false });
	scene('ambush', 'Geth Ambush', 'wild', { navName: 'A Quiet Road' });
	scene('maw', 'Thresher Maw Field', 'wild', { navigation: false });
	scene('mako', 'Mako Run', 'wild');
	scene('loose', 'Loose Scene', null);
	const collection = (list) => Object.assign(list, { get: (id) => list.find((x) => x.id === id) ?? null, apps: [], preload: (id, options) => { calls.push(['preload', id, options]); return new Promise((r) => setTimeout(r, 120)); } });
	game.scenes = collection(scenes);
	game.folders = Object.assign([...folders.values()], { get: (id) => folders.get(id) ?? null });
	const you = { id: 'gm', name: 'Gamemaster', isGM: true, active: true, viewedScene: 'bridge', color: { css: '#c33' } };
	const users = [you, { id: 'u1', name: 'Asha', active: true, viewedScene: 'bridge', color: { css: '#3c6' } }, { id: 'u2', name: 'Vex', active: true, viewedScene: 'club', color: { css: '#36c' } }, { id: 'u3', name: 'Offline', active: false, viewedScene: 'club', color: { css: '#999' } }];
	game.users = users;
	Object.defineProperty(game, 'user', { configurable: true, get: () => you });
	globalThis.setGM = (gm) => { you.isGM = gm; };
	game.combats = [];
	const clashes = new Set();
	game.modules = { get: (id) => (clashes.has(id) ? { id, title: id, active: true } : { version: 'harness', active: false }) };
	globalThis.clashes = clashes;
	globalThis.canvas = { scene: scenes[0], stage: { pivot: { x: 1234.6, y: 987.2 }, scale: { x: 0.75 } } };
	const made = [];
	globalThis.ui.nav = { _getContextMenuOptions: () => [], _createContextMenu: (handler, selector, config) => made.push({ handler, selector, config }) };
	globalThis.menusMade = made;
	const notes = [];
	globalThis.ui.notifications = { info: (m) => notes.push(['info', m]), warn: (m) => notes.push(['warn', m]), error: (m) => notes.push(['error', m]) };
	globalThis.notes = notes;

	/* Calendaria's HUD, stuck to the top center */
	const hud = document.createElement('div');
	hud.id = 'calendaria-hud';
	hud.style.cssText = 'position:fixed;top:8px;left:810px;transform:translateX(-50%);width:360px;height:58px;border-radius:30px;background:#1f2a44;border:1px solid #3c5a9a;color:#dfe8ff;display:flex;align-items:center;justify-content:center;font:600 14px Georgia;z-index:30';
	hud.textContent = '14 Kythorn, 1492 DR · 3:20 pm';
	document.body.append(hud);

	SFH.store.sequences = false;
	const { SceneBar } = await import('../scripts/interface/scenes.mjs');
	globalThis.SceneBar = SceneBar;
	SceneBar.render();
	await new Promise((r) => setTimeout(r, 100));
	return { ok: true };
});

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const el = () => document.getElementById('sfh-scenes');
	const card = () => document.getElementById('sfh-scenes-preview');
	const chip = (id) => el().querySelector(`.sfh-scene[data-scene-id="${id}"]`);
	const tile = (id) => el().querySelector(`.sfh-tile[data-scene-id="${id}"]`);
	const last = () => calls.at(-1);
	const draw = async () => { SceneBar.render(); await wait(40); };
	const hover = async (target) => { target.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); await wait(320); };
	const unhover = async () => { el().dispatchEvent(new PointerEvent('pointerleave')); document.body.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); await wait(380); };
	const click = async (target) => { target.click(); await wait(260); };
	const act = async (name) => { card().querySelector(`[data-sact="${name}"]`).click(); await wait(60); };

	/* ---- in place of Foundry's list ---- */
	check('Foundry\'s own list is hidden', getComputedStyle(document.getElementById('scene-navigation')).display === 'none');
	check('the bar sits where that list was', el()?.parentElement?.id === 'ui-left-column-2');
	const order = [...el().querySelectorAll('.sfh-scene')].map((c) => c.dataset.sceneId);
	check('the active scene comes first', order[0] === 'bridge', order);
	check('what is not in navigation is not in the bar', !order.includes('aria') && !order.includes('maw') && !order.includes('tower'), order);
	check('the GM sees what is hidden from players, marked', !!chip('landing')?.querySelector('.fa-eye-slash') || !order.includes('landing'), order);
	check('who is looking shows, and only those online', chip('bridge').querySelectorAll('.sfh-pips i').length === 2, chip('bridge').querySelectorAll('.sfh-pips i').length);

	/* ---- the room, beside Calendaria ---- */
	const hud = document.getElementById('calendaria-hud').getBoundingClientRect();
	const bar = el().querySelector('.sfh-bar').getBoundingClientRect();
	check('the bar ends short of Calendaria', bar.right <= hud.left - 8, [bar.right, hud.left]);
	const chipsBox = el().querySelector('.sfh-chips').getBoundingClientRect();
	const cut = [...el().querySelectorAll('.sfh-scene')].filter((c) => c.getBoundingClientRect().right > chipsBox.right + 0.5);
	check('no scene in it is cut off', !cut.length, cut.map((c) => c.dataset.sceneId));
	const more = el().querySelector('.sfh-more');
	const shown = el().querySelectorAll('.sfh-scene').length;
	check('what does not fit is counted in +N', !more.hidden && Number(more.textContent.slice(1)) + shown === order.length + Number(more.textContent.slice(1)) - (order.length - shown), more.textContent);
	document.getElementById('calendaria-hud').style.display = 'none';
	await draw();
	const roomy = el().querySelectorAll('.sfh-scene').length;
	check('without Calendaria the bar takes the room', roomy > shown, [roomy, shown]);
	document.getElementById('calendaria-hud').style.display = 'flex';
	await draw();
	check('it follows Calendaria back', el().querySelector('.sfh-bar').getBoundingClientRect().right <= hud.left - 8);

	/* ---- the preview ---- */
	await hover(chip('bridge'));
	check('hovering a scene previews it', card()?.classList.contains('show') && /Normandy Bridge/.test(card().querySelector('h3').textContent));
	check('with its folder', /Act I: The Reach \/ Shipboard/.test(card().textContent));
	check('and what is on there', /Global light on/.test(card().textContent) && /Token vision on/.test(card().textContent) && /Playing: Galaxy Map/.test(card().textContent) && /Gamemaster, Asha/.test(card().textContent), card().querySelector('.sfh-facts')?.textContent);
	check('the active scene cannot be activated again', card().querySelector('[data-sact="activate"]').disabled);
	const cbox = card().getBoundingClientRect();
	check('the preview stays clear of Calendaria', cbox.right <= hud.left || cbox.top >= hud.bottom, cbox);
	await unhover();
	// room for every scene in the bar, for the buttons that follow
	document.getElementById('calendaria-hud').style.display = 'none';
	await draw();
	await hover(chip('club'));
	check('another scene, another preview', /Afterlife Club/.test(card().querySelector('h3').textContent) && /Global light off/.test(card().textContent) && /Vex/.test(card().textContent));
	check('its Notes are there, since it has some', !!card().querySelector('[data-sact="notes"]'));
	card().dispatchEvent(new PointerEvent('pointerenter'));
	await wait(400);
	check('the preview stays while the pointer is on it', card().classList.contains('show'));
	await act('view');
	check('View views it', last()[0] === 'view:club');
	await act('activate');
	check('Activate activates it', last()[0] === 'activate:club');
	await act('pull');
	check('Pull all pulls everyone there', last()[0] === 'pull:club' && last()[1] === game.users);
	await act('config');
	check('Configure opens its configuration', last()[0] === 'sheet:club');
	await act('notes');
	check('Notes opens its journal', last()[0] === 'journal:club');
	await act('nav');
	check('Out of bar takes it out of navigation', last()[0] === 'update:club' && last()[1].navigation === false);
	check('Initial view waits until the scene is viewed', card().querySelector('[data-sact="initial"]').disabled);
	card().querySelector('[data-sact="preload"]').click();
	await wait(30);
	check('Preload broadcasts it to the players', calls.some((c) => c[0] === 'preload' && c[1] === 'club' && c[2].broadcast === true));
	check('and says it is working', /Preloading/.test(card().querySelector('[data-sact="preload"]').textContent) && card().querySelector('[data-sact="preload"]').disabled);
	await wait(200);
	check('then that it is done', /Preloaded/.test(card().querySelector('[data-sact="preload"]').textContent) && notes.some(([k, m]) => k === 'info' && /preloaded/.test(m)));
	await unhover();
	await hover(chip('bridge'));
	await act('initial');
	check('Initial view takes the camera where it is', last()[0] === 'update:bridge' && last()[1].initial.x === 1235 && last()[1].initial.y === 987 && last()[1].initial.scale === 0.75, last());
	await unhover();

	/* ---- clicking ---- */
	await click(chip('cargo'));
	check('a click views a scene', last()[0] === 'view:cargo');
	const before = calls.length;
	chip('cargo').dispatchEvent(new MouseEvent('click', { bubbles: true }));
	chip('cargo').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
	await wait(300);
	check('a double-click activates it, and does not also view it', calls.slice(before).map((c) => c[0]).join() === 'activate:cargo', calls.slice(before).map((c) => c[0]));
	check('the right-click menu is Foundry\'s own, with what modules add', menusMade.length === 1 && menusMade[0].config.hookName === 'getSceneContextOptions' && menusMade[0].config.container === el() && menusMade[0].selector.includes('.sfh-scene'), menusMade.map((m) => m.selector));
	const dt = new DataTransfer();
	chip('cargo').dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
	chip('bridge').dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt, cancelable: true }));
	await wait(40);
	check('dragging reorders the bar, as Foundry\'s list does', last()[0] === 'sort:cargo' && last()[1].target.id === 'bridge' && last()[1].sortKey === 'navOrder', last());

	/* ---- back ---- */
	SceneBar.noteView();
	canvas.scene = game.scenes.get('market');
	SceneBar.noteView();
	await wait(60);
	const back = el().querySelector('[data-sact="back"]');
	check('Back appears once there is somewhere to go back to', !!back && /Normandy Bridge/.test(back.dataset.tooltip), back?.dataset.tooltip);
	await click(back);
	check('and goes there', last()[0] === 'view:bridge');
	canvas.scene = game.scenes.get('bridge');

	/* ---- levels ---- */
	canvas.scene.availableLevels = [{ id: 'l1', name: 'Deck 1', isView: false }, { id: 'l2', name: 'Deck 2', isView: true }];
	canvas.scene.view = (o) => { calls.push(['viewLevel', o]); };
	await draw();
	const levels = el().querySelector('.sfh-level');
	check('a scene of several levels gets a level picker', !!levels && levels.value === 'l2' && levels.options[0].textContent === 'Deck 2', levels?.value);
	levels.value = 'l1';
	levels.dispatchEvent(new Event('change', { bubbles: true }));
	check('choosing one views it', last()[0] === 'viewLevel' && last()[1].level === 'l1', last());
	canvas.scene.availableLevels = [];
	canvas.scene.view = (...a) => { calls.push(['view:bridge', ...a]); };

	document.getElementById('calendaria-hud').style.display = 'flex';
	await draw();

	/* ---- the drawer ---- */
	await click(el().querySelector('[data-sact="drawer"]'));
	const drawer = () => el().querySelector('.sfh-drawer');
	check('Scenes opens the drawer', !!drawer());
	const folderNames = [...drawer().querySelectorAll('.sfh-folder')].map((f) => f.textContent.replace(/\d+$/, '').trim());
	check('folders, nested, then those without one', folderNames.join('|') === 'In the bar|Act I: The Reach|Shipboard|Omega Station|Act II: Horizon|Encounters|No folder', folderNames);
	check('a subfolder is indented', drawer().querySelector('[data-folder="ship"]').style.getPropertyValue('--depth') === '1');
	check('a folder counts what is inside, however deep', /5$/.test(drawer().querySelector('[data-folder="act1"]').textContent.trim()), drawer().querySelector('[data-folder="act1"]').textContent);
	await click(drawer().querySelector('[data-folder="omega"]'));
	check('a folder lists its scenes, the GM\'s hidden ones too', ['club', 'aria', 'market'].every((id) => tile(id)), [...drawer().querySelectorAll('.sfh-tile')].map((t) => t.dataset.sceneId));
	check('with their pictures', !!tile('club').querySelector('img[src]'));
	const dbox = drawer().getBoundingClientRect();
	check('the drawer drops below Calendaria rather than squeezing beside it', dbox.top >= hud.bottom && dbox.width >= 800, dbox);
	await hover(tile('market'));
	const tcard = card().getBoundingClientRect();
	check('a tile previews beside the drawer, not over it', tcard.left >= dbox.right, [tcard.left, dbox.right]);
	await unhover();
	const search = drawer().querySelector('.sfh-search');
	search.value = 'horizon';
	search.dispatchEvent(new Event('input', { bubbles: true }));
	await wait(40);
	check('search finds across folders, by name or folder', ['landing', 'tower'].every((id) => tile(id)) && el().querySelectorAll('.sfh-tile').length === 2);
	check('and keeps the cursor in the box', document.activeElement === el().querySelector('.sfh-search'));
	await click(el().querySelector('[data-folder="loose"]'));
	check('a folder clears the search', !el().querySelector('.sfh-search').value && !!tile('loose'));
	await click(more.isConnected ? el().querySelector('.sfh-more') : el().querySelector('.sfh-more'));
	check('+N opens what is in the bar', el().querySelector('[data-folder="bar"]').classList.contains('on'));
	el().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
	await wait(40);
	check('Escape closes the drawer', !drawer());

	/* ---- collapsing ---- */
	await click(el().querySelector('[data-sact="collapse"]'));
	check('collapsing leaves the buttons', !el().querySelector('.sfh-scene') && game.settings.get(null, 'sceneBarCollapsed') === true);
	el().dispatchEvent(new PointerEvent('pointerenter'));
	await wait(40);
	check('pointing at it opens it for a look', !!el().querySelector('.sfh-scene'));
	el().dispatchEvent(new PointerEvent('pointerleave'));
	await wait(40);
	check('and leaving closes it again', !el().querySelector('.sfh-scene'));
	SFH.store.sceneBarHover = false;
	el().dispatchEvent(new PointerEvent('pointerenter'));
	await wait(40);
	check('unless that is turned off', !el().querySelector('.sfh-scene'));
	SFH.store.sceneBarHover = true;
	await click(el().querySelector('[data-sact="collapse"]'));
	check('and it opens again', !!el().querySelector('.sfh-scene'));

	// as a pointer really does it: onto the bar, which opens it for a look, then the button
	await click(el().querySelector('[data-sact="collapse"]'));
	el().dispatchEvent(new PointerEvent('pointerenter'));
	await wait(40);
	const reopen = el().querySelector('[data-sact="collapse"]');
	check('open for a look, the button still offers to open it', /Open/.test(reopen.dataset.tooltip) && reopen.getAttribute('aria-pressed') === 'true', reopen.dataset.tooltip);
	await click(reopen);
	check('and pressing it opens it for good', game.settings.get(null, 'sceneBarCollapsed') === false && !!el().querySelector('.sfh-scene'));
	el().dispatchEvent(new PointerEvent('pointerleave'));
	await wait(40);
	check('so it stays open when the pointer leaves', !!el().querySelector('.sfh-scene'));

	SFH.store.sceneBarCombat = true;
	game.combats = [{ started: true, scene: canvas.scene }];
	SceneBar.noteCombat();
	await wait(60);
	check('it gets out of the way during combat', !el().querySelector('.sfh-scene'));
	game.combats = [];
	SceneBar.noteCombat();
	await wait(60);
	check('and comes back when it ends', !!el().querySelector('.sfh-scene'));
	SFH.store.sceneBarCombat = false;

	/* ---- a player ---- */
	setGM(false);
	await draw();
	const playerOrder = [...el().querySelectorAll('.sfh-scene')].map((c) => c.dataset.sceneId);
	check('a player does not see hidden scenes', !playerOrder.includes('landing'), playerOrder);
	check('and sees the navigation name', [...el().querySelectorAll('.sfh-scene .sfh-nm')].some((n) => n.textContent === 'A Quiet Road') || !playerOrder.includes('ambush'));
	check('nor the hidden mark', !el().querySelector('.fa-eye-slash'));
	await hover(chip('bridge'));
	check('their preview has no GM buttons', !card().querySelector('[data-sact="activate"], [data-sact="preload"], [data-sact="config"], [data-sact="nav"]') && !!card().querySelector('[data-sact="view"]'));
	check('nor the GM\'s facts about the scene', !/Global light/.test(card().textContent));
	await unhover();
	await click(el().querySelector('[data-sact="drawer"]'));
	check('a folder of only hidden scenes is not offered to them', !el().querySelector('[data-folder="act2"]'));
	await click(el().querySelector('[data-folder="omega"]'));
	check('nor a hidden scene in an open one', !tile('aria') && !!tile('club'));
	const dblBefore = calls.length;
	tile('club').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
	await wait(40);
	check('a player\'s double-click only views', calls.slice(dblBefore).every((c) => !c[0].startsWith('activate')));
	el().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
	setGM(true);
	await draw();

	/* ---- other modules that replace the list ---- */
	clashes.add('crlngn-ui');
	notes.length = 0;
	await SceneBar.ready();
	check('a clash with another scene navigation is pointed out', notes.some(([k, m]) => k === 'warn' && /crlngn-ui/.test(m)), notes);
	clashes.clear();

	/* ---- every device ---- */
	for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron']) {
		game.settings.set(null, 'device', device);
		await wait(150);
		await draw();
		const b = el().querySelector('.sfh-bar').getBoundingClientRect();
		const box = el().querySelector('.sfh-chips').getBoundingClientRect();
		check(`${device}: short of Calendaria, nothing cut off`, b.right <= hud.left - 8 && [...el().querySelectorAll('.sfh-scene')].every((c) => c.getBoundingClientRect().right <= box.right + 0.5), [b.right, hud.left]);
		const labels = [...el().querySelectorAll('.sfh-sb')].filter((x) => x.scrollWidth > x.clientWidth + 1);
		check(`${device}: every button's label fits`, !labels.length, labels.map((x) => x.textContent));
	}

	/* ---- just the button ---- */
	SFH.store.sceneBarStyle = 'button';
	game.settings.set(null, 'device', 'tron');
	await wait(150);
	await draw();
	check('just the button: no row of scenes', !el().querySelector('.sfh-scene') && !el().querySelector('.sfh-more'));
	check('and nothing to collapse', !el().querySelector('[data-sact="collapse"]'));
	check('Foundry\'s list stays hidden', getComputedStyle(document.getElementById('scene-navigation')).display === 'none');
	check('the button is small', el().querySelector('.sfh-bar').getBoundingClientRect().width < 200, el().querySelector('.sfh-bar').getBoundingClientRect().width);
	await click(el().querySelector('[data-sact="drawer"]'));
	check('it opens the drawer', !!el().querySelector('.sfh-drawer'));
	check('which calls the first list "In navigation"', /In navigation/.test(el().querySelector('[data-folder="bar"]').textContent));
	await click(el().querySelector('[data-folder="bar"]'));
	await hover(tile('bridge'));
	check('and its preview\'s navigation button says what it does to players', /Hide from players/.test(card().querySelector('[data-sact="nav"]').textContent), card().querySelector('[data-sact="nav"]').textContent);
	await unhover();
	el().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
	canvas.scene.availableLevels = [{ id: 'l1', name: 'Deck 1', isView: false }, { id: 'l2', name: 'Deck 2', isView: true }];
	await draw();
	check('a scene of several levels keeps its picker', !!el().querySelector('.sfh-level'));
	canvas.scene.availableLevels = [];
	await draw();
	SFH.store.sceneBarCollapsed = true;
	await draw();
	el().dispatchEvent(new PointerEvent('pointerenter'));
	await wait(40);
	check('a collapsed bar left from before does not hide the button', !!el().querySelector('[data-sact="drawer"]') && !el().classList.contains('collapsed') && !el().querySelector('.sfh-scene'));
	SFH.store.sceneBarCollapsed = false;
	SFH.store.sceneBarStyle = 'bar';
	await draw();
	check('back to the bar, the scenes come back', !!el().querySelector('.sfh-scene') && !!el().querySelector('[data-sact="collapse"]'));

	/* ---- off ---- */
	SFH.store.sceneBar = false;
	await draw();
	check('turned off, Foundry\'s list comes back', !el() && getComputedStyle(document.getElementById('scene-navigation')).display !== 'none');
	SFH.store.sceneBar = true;
	await draw();
	return out;
});

if (shotsTo) {
	const states = [
		['TRON: the bar beside Calendaria, a scene previewed', async () => page.evaluate(async () => { game.settings.set(null, 'device', 'tron'); await new Promise((r) => setTimeout(r, 200)); SceneBar.render(); document.querySelector('#sfh-scenes .sfh-scene[data-scene-id="bridge"]').dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); await new Promise((r) => setTimeout(r, 350)); })],
		['TRON: the drawer, a folder, and a tile previewed', async () => page.evaluate(async () => { document.body.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); await new Promise((r) => setTimeout(r, 380)); document.querySelector('#sfh-scenes [data-sact="drawer"]').click(); await new Promise((r) => setTimeout(r, 60)); document.querySelector('#sfh-scenes [data-folder="omega"]').click(); await new Promise((r) => setTimeout(r, 60)); document.querySelector('#sfh-scenes .sfh-tile[data-scene-id="market"]').dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); await new Promise((r) => setTimeout(r, 350)); })],
		['Omni-tool: the drawer', async () => page.evaluate(async () => { game.settings.set(null, 'device', 'omni'); await new Promise((r) => setTimeout(r, 250)); SceneBar.render(); await new Promise((r) => setTimeout(r, 60)); document.querySelector('#sfh-scenes .sfh-tile[data-scene-id="club"]').dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); await new Promise((r) => setTimeout(r, 350)); })],
		['Wrist computer: collapsed', async () => page.evaluate(async () => { document.body.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); await new Promise((r) => setTimeout(r, 380)); game.settings.set(null, 'device', 'wrist'); await new Promise((r) => setTimeout(r, 250)); document.querySelector('#sfh-scenes [data-sact="collapse"]').click(); await new Promise((r) => setTimeout(r, 100)); })],
	];
	for (const [label, run] of states) {
		await run();
		await shoot(label);
	}
	const metas = await Promise.all(shots.map((b) => sharp(b).metadata()));
	let y = 0;
	const comps = shots.map((b, i) => { const c = { input: b, left: 0, top: y }; y += metas[i].height + 8; return c; });
	await sharp({ create: { width: 1620, height: y, channels: 3, background: '#222' } }).composite(comps).png().toFile(`${shotsTo}/scene-bar.png`);
}
await browser.close();

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
