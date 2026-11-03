/*
 * Run the real carousel against a stand-in encounter, as a GM and as a player, and check what it
 * shows each of them, what its controls do and that it fits on every device. Screenshots for
 * looking at are written to a folder if one is given: node test-carousel.mjs <dir>
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

const browser = await puppeteer.launch({
	executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1.5 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));

await page.evaluate(async () => {
	const icons = 'file:///C:/Program Files/Foundry Virtual Tabletop/resources/app/public/icons/svg';
	const calls = [];
	globalThis.calls = calls;
	globalThis.CONST = { DEFAULT_TOKEN: `${icons}/mystery-man.svg`, ACTIVE_EFFECT_SHOW_ICON: { ALWAYS: 2, CONDITIONAL: 1, NONE: 0 } };
	const make = (id, name, extra = {}) => ({
		id, name, img: `${icons}/${extra.icon ?? 'mystery-man.svg'}`, visible: true, isOwner: false, hidden: false, isDefeated: false, initiative: 10,
		playersCanSeeName: true, players: [], actor: { system: { attributes: { hp: { value: 20, max: 40 } } }, appliedEffects: [] }, ...extra,
	});
	const you = { isGM: false, character: SFH.actor };
	globalThis.setUser = (gm) => { you.isGM = gm; };
	Object.defineProperty(game, 'user', { configurable: true, get: () => you });
	const turns = [
		make('c1', 'Blee', { initiative: 24, isOwner: true, players: [you], actor: { system: { attributes: { hp: { value: 8, max: 8 } } }, appliedEffects: [{ img: `${icons}/aura.svg`, name: 'Barrier', showIcon: 2 }, { img: `${icons}/aura.svg`, name: 'Off', showIcon: 0 }] } }),
		make('c2', 'Vex Kaori', { initiative: 19, icon: 'cowled.svg' }),
		make('c3', 'Hidden Ambusher', { initiative: 15, hidden: true }),
		make('c4', 'Geth Trooper', { initiative: 11, isDefeated: true, icon: 'skull.svg' }),
		make('c5', 'Secret Boss <b>', { initiative: 8, playersCanSeeName: false }),
		make('c6', 'Asha Rourke', { initiative: null, isOwner: true, players: [you], actor: { system: { attributes: { hp: { value: 3, max: 40 } } }, appliedEffects: [] } }),
	];
	// as in Foundry: a hidden combatant can be seen by the GM and nobody else
	Object.defineProperty(turns[2], 'visible', { get: () => you.isGM });
	const combat = {
		id: 'fight', round: 2, turn: 1, turns,
		get combatant() { return this.turns[this.turn]; },
		startCombat: async () => calls.push('start'),
		previousTurn: async () => calls.push('previous'),
		nextTurn: async () => calls.push('next'),
		rollInitiative: async (ids) => calls.push(`roll ${ids}`),
	};
	globalThis.combat = combat;
	globalThis.ui.combat = {
		viewed: combat,
		_onCombatantHoverIn: () => calls.push('hover in'),
		_onCombatantHoverOut: () => calls.push('hover out'),
		_onCombatantMouseDown: (e, card) => calls.push(`${e.type} ${card.dataset.combatantId}`),
	};
	SFH.store.carousel = true;
	const { Carousel } = await import('../scripts/interface/carousel.mjs');
	globalThis.Carousel = Carousel;
});

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const el = () => document.getElementById('sfh-carousel');
	const card = (id) => el()?.querySelector(`.sfh-card[data-combatant-id="${id}"]`);
	const ids = () => [...el().querySelectorAll('.sfh-card')].map((c) => c.dataset.combatantId).join();
	const draw = async () => { await Carousel.render(); await wait(40); };

	/* ---- switched off ---- */
	SFH.store.carousel = false;
	await draw();
	check('it is off unless asked for', !el());
	SFH.store.carousel = true;

	/* ---- a player ---- */
	setUser(false);
	game.pf2e = { settings: { tokens: { nameVisibility: true } } };
	await draw();
	check('the current turn comes first, then who is next, wrapping round', ids() === 'c2,c4,c5,c6,c1', ids());
	check('a combatant the player may not see is left out', !card('c3') && !el().textContent.includes('Hidden Ambusher'));
	check('a hidden name stays hidden', !el().innerHTML.includes('Secret Boss') && card('c5').classList.contains('unnamed'), card('c5').outerHTML.slice(0, 120));
	game.pf2e.settings.tokens.nameVisibility = false;
	await draw();
	check('with the system\'s name setting off, a player sees the name as on its tracker', /Secret Boss/.test(card('c5').textContent) && !card('c5').classList.contains('unnamed'));
	game.pf2e.settings.tokens.nameVisibility = true;
	await draw();
	check('hit points show on what they own', card('c1').querySelector('.sfh-bar'));
	check('but not on anyone else', !card('c2').querySelector('.sfh-bar') && !card('c5').querySelector('.sfh-bar'));
	check('low hit points are marked', card('c6').querySelector('.sfh-bar').classList.contains('low'));
	check('effects shown as the tracker shows them', card('c1').querySelectorAll('.sfh-effects img').length === 1, card('c1').querySelectorAll('.sfh-effects img').length);
	check('the current turn is marked', card('c2').classList.contains('active') && !card('c1').classList.contains('active'));
	check('defeated is marked', card('c4').classList.contains('defeated'));
	check('initiative shows', card('c2').querySelector('.sfh-init').textContent === '19');
	check('the next round is marked where it wraps', /Round 3/.test(el().querySelector('.sfh-next-round')?.textContent), el().querySelector('.sfh-next-round')?.textContent);
	check('the round is showing', /Round 2/.test(el().querySelector('.sfh-round').textContent));
	check('someone else\'s turn gives a player no controls', !el().querySelector('[data-cact="next"],[data-cact="previous"],[data-cact="begin"]'));
	check('an unrolled combatant they own can roll', card('c6').querySelector('[data-cact="roll"]'));
	check('nobody else\'s can be rolled', !card('c2').querySelector('[data-cact="roll"]'));

	combat.turn = 0;
	await draw();
	check('their own turn offers End Turn', el().querySelector('.sfh-wide[data-cact="next"]') && !el().querySelector('[data-cact="previous"]'));
	el().querySelector('[data-cact="next"]').click();
	check('End Turn advances the encounter', calls.at(-1) === 'next', calls.at(-1));
	combat.turn = 2; // a hidden combatant's turn
	await draw();
	check('during a hidden combatant\'s turn nothing is marked', !el().querySelector('.sfh-card.active') && !el().innerHTML.includes('Hidden Ambusher'));
	check('and the row starts with who is next', ids().startsWith('c4'), ids());

	/* ---- the GM ---- */
	combat.turn = 1;
	setUser(true);
	await draw();
	check('the GM sees hidden combatants, marked', card('c3')?.classList.contains('hide'));
	check('and hidden names, escaped', /Secret Boss/.test(card('c5').textContent) && !card('c5').querySelector('.sfh-name b'), card('c5').querySelector('.sfh-name').innerHTML);
	check('and everyone\'s hit points', card('c2').querySelector('.sfh-bar'));
	el().querySelector('[data-cact="next"]').click();
	el().querySelector('[data-cact="previous"]').click();
	check('the GM moves turns', calls.slice(-2).join() === 'next,previous', calls.slice(-2));
	card('c6').querySelector('[data-cact="roll"]').click();
	check('rolling asks the encounter', calls.at(-1) === 'roll c6', calls.at(-1));

	/* ---- the tracker's own handlers ---- */
	card('c2').querySelector('img').click();
	check('clicking a card goes to the tracker', calls.at(-1) === 'click c2', calls.at(-1));
	card('c2').querySelector('img').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
	check('so does double-clicking', calls.at(-1) === 'dblclick c2', calls.at(-1));
	card('c2').querySelector('img').dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));
	check('and hovering', calls.at(-1) === 'hover in', calls.at(-1));
	card('c2').querySelector('img').dispatchEvent(new MouseEvent('pointerout', { bubbles: true }));
	check('and leaving', calls.at(-1) === 'hover out', calls.at(-1));

	/* ---- before it starts, and after it ends ---- */
	combat.round = 0;
	combat.turn = null;
	await draw();
	check('not started: nothing is current', !el().querySelector('.sfh-card.active') && !el().querySelector('.sfh-next-round'));
	check('the GM can begin', el().querySelector('[data-cact="begin"]'));
	el().querySelector('[data-cact="begin"]').click();
	check('which starts the encounter', calls.at(-1) === 'start', calls.at(-1));
	combat.round = 2;
	combat.turn = 1;

	const realTurns = combat.turns;
	combat.turns = [];
	await draw();
	check('no combatants, no carousel', !el());
	combat.turns = realTurns;
	ui.combat.viewed = null;
	const realCombat = game.combat;
	await draw();
	check('no encounter, no carousel', !el());
	ui.combat.viewed = combat;

	/* ---- the buttons on a card ---- */
	{
		const handled = [];
		ui.combat._onToggleHidden = (c) => handled.push(['hidden', c.id]);
		ui.combat._onToggleDefeatedStatus = (c) => handled.push(['defeated', c.id]);
		const targets = [];
		const tokenFor = (id, visible = true) => ({ visible, targeted: new Set(), setTarget: (on, o) => targets.push([id, on, o.releaseOthers]) });
		combat.combatants = new Map(combat.turns.map((c) => [c.id, c]));
		for (const c of combat.turns) c.token = { object: tokenFor(c.id) };
		combat.combatants.get('c6').token = null;
		const ctl = (id, act) => card(id)?.querySelector(`[data-cact="${act}"]`);

		setUser(true);
		await draw();
		check('the GM has Hidden and Defeated on each card', ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].every((id) => ctl(id, 'hidden') && ctl(id, 'defeated')));
		check('they show their state', ctl('c3', 'hidden').classList.contains('on') && ctl('c4', 'defeated').classList.contains('on') && !ctl('c2', 'hidden').classList.contains('on') && !ctl('c2', 'defeated').classList.contains('on'));
		check('their pressed state is announced', ctl('c4', 'defeated').getAttribute('aria-pressed') === 'true');
		ctl('c2', 'hidden').click();
		check('Hidden goes to the tracker\'s handler', JSON.stringify(handled.at(-1)) === JSON.stringify(['hidden', 'c2']), handled.at(-1));
		ctl('c2', 'defeated').click();
		check('Defeated goes to the tracker\'s handler', JSON.stringify(handled.at(-1)) === JSON.stringify(['defeated', 'c2']), handled.at(-1));
		const clicksBefore = calls.length;
		ctl('c2', 'defeated').click();
		check('and does not also pan to the token', calls.length === clicksBefore);

		setUser(false);
		await draw();
		check('a player has neither', !el().querySelector('[data-cact="hidden"], [data-cact="defeated"]'));
		check('everyone can target', ctl('c2', 'target') && ctl('c1', 'target') && ctl('c5', 'target'));
		check('a token not on this scene cannot be targeted', !ctl('c6', 'target'));

		ctl('c2', 'target').click();
		check('a click targets it, replacing other targets', JSON.stringify(targets.at(-1)) === JSON.stringify(['c2', true, true]), targets.at(-1));
		ctl('c2', 'target').dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
		check('shift adds to the targets', JSON.stringify(targets.at(-1)) === JSON.stringify(['c2', true, false]), targets.at(-1));

		const you = game.user;
		you.color = '#ff00aa';
		you.name = 'Nick';
		const other = { name: 'Sam', color: '#00ff00' };
		combat.combatants.get('c2').token.object.targeted = new Set([you, other]);
		await draw();
		check('your target shows as on', ctl('c2', 'target').classList.contains('on'));
		check('who is targeting shows, in their colors', card('c2').querySelectorAll('.sfh-targeting i').length === 2 && /Nick, Sam/.test(card('c2').querySelector('.sfh-targeting').dataset.tooltip), card('c2').querySelector('.sfh-targeting')?.outerHTML.slice(0, 120));
		ctl('c2', 'target').click();
		check('clicking again clears it', targets.at(-1)[1] === false, targets.at(-1));
		combat.combatants.get('c2').token.object.targeted = new Set();

		const warned = [];
		const realWarn = ui.notifications.warn;
		ui.notifications.warn = (m) => warned.push(m);
		combat.combatants.get('c1').token.object.visible = false;
		const beforeTargets = targets.length;
		await draw();
		ctl('c1', 'target').click();
		check('an unseen token cannot be targeted', targets.length === beforeTargets && warned.length === 1, warned);
		combat.combatants.get('c1').token.object.visible = true;
		ui.notifications.warn = realWarn;
		setUser(true);
		await draw();
	}

	/* ---- the tracker's own right-click menu ---- */
	{
		const made = [];
		const options = () => [];
		ui.combat._getEntryContextOptions = options;
		ui.combat._createContextMenu = (handler, selector, config) => made.push({ handler, selector, config });
		SFH.store.carousel = false;
		await draw();
		SFH.store.carousel = true;
		await draw();
		check('it asks the tracker for its own menu', made.length === 1 && made[0].handler === options, made.length);
		check('on the cards, in the carousel', made[0].selector === '.sfh-card' && made[0].config.container === el() && made[0].config.fixed === true, made[0].selector);
		await draw();
		await draw();
		check('once, however often it redraws', made.length === 1, made.length);
		check('a card carries what the menu reads', card('c2').dataset.combatantId === 'c2' && card('c2').classList.contains('combatant'));
	}

	/* ---- the tracker's encounter menu, on the round bar ---- */
	const barMenu = () => el().querySelector('.sfh-turns .sfh-menu');
	{
		const rebuild = async () => {
			SFH.store.carousel = false;
			await draw();
			SFH.store.carousel = true;
			await draw();
		};
		const made = [];
		const encounter = () => [];
		ui.combat._getCombatContextOptions = encounter;
		ui.combat._createContextMenu = (handler, selector, config) => made.push({ handler, selector, config });
		setUser(true);
		await rebuild();
		const asked = made.filter((m) => m.handler === encounter);
		check('it asks the tracker for its encounter menu', asked.length === 1, asked.length);
		const c = asked[0]?.config ?? {};
		check('made as the tracker makes it', asked[0]?.selector === '.sfh-menu' && c.container === el() && c.eventName === 'click' && c.fixed === true && c.relative === 'target' && c.hookName === 'getCombatContextOptions' && c.parentClassHooks === false, asked[0]?.selector);
		check('the GM has the button on the round bar', !!barMenu());
		check('it has a name', /\S/.test(barMenu()?.getAttribute('aria-label') ?? ''));
		await draw();
		await draw();
		check('one menu, however often it redraws', made.filter((m) => m.handler === encounter).length === 1);
		combat.round = 0;
		combat.turn = null;
		await draw();
		check('it is there before the encounter starts too', !!barMenu() && !!el().querySelector('[data-cact="begin"]'));
		combat.round = 2;
		combat.turn = 1;

		setUser(false);
		await draw();
		check('a player does not have the button', !barMenu());
		made.length = 0;
		await rebuild();
		check('nor is the menu made for a player', !made.some((m) => m.handler === encounter));

		// Foundry's own menu class, so what opens is what opens in the game
		const { default: ContextMenu } = await import('file:///C:/Program Files/Foundry Virtual Tabletop/resources/app/client/applications/ux/context-menu.mjs');
		foundry.utils ??= {};
		foundry.utils.getType ??= (v) => (v instanceof HTMLElement ? 'HTMLElement' : typeof v);
		foundry.applications ??= {};
		foundry.applications.detached ??= document;
		game.tooltip ??= { deactivate() {} };
		globalThis._loc ??= (s) => s;
		if (!Array.prototype.filterJoin) Object.defineProperty(Array.prototype, 'filterJoin', { value(sep) { return this.filter(Boolean).join(sep); } });
		const chosen = [];
		ui.combat._getCombatContextOptions = () => ['Edit Name', 'Reset Initiative', 'End Encounter'].map((label) => ({ label, icon: 'fa-solid fa-tag', visible: () => true, onClick: () => chosen.push(label) }));
		ui.combat._createContextMenu = function (handler, selector, { container, hookName, parentClassHooks, ...options } = {}) {
			const items = handler.call(this);
			return items.length ? new ContextMenu(container, selector, items, { jQuery: false, ...options }) : null;
		};
		const opened = () => document.querySelectorAll('#context-menu');
		const animated = () => wait(300);
		setUser(true);
		await rebuild();
		const before = calls.length;
		barMenu().click();
		await animated();
		check('a click opens it', opened().length === 1, opened().length);
		const menu = opened()[0];
		check('with the tracker\'s entries', [...(menu?.querySelectorAll('.context-item') ?? [])].map((e) => e.textContent.trim()).join() === 'Edit Name,Reset Initiative,End Encounter', menu?.textContent);
		check('outside the carousel, so nothing clips it', menu?.parentElement === document.body);
		const box = menu?.getBoundingClientRect();
		const under = barMenu().getBoundingClientRect();
		check('under the button and on the screen', box?.top >= under.bottom - 1 && box?.right <= innerWidth && box?.bottom <= innerHeight, [box?.top, box?.right, box?.bottom]);
		check('hung from the button', Math.abs(box?.left - under.left) <= 1, [box?.left, under.left]);
		check('and does not pan to anything', calls.length === before);
		await draw();
		check('it stays open through a redraw', opened().length === 1);
		menu?.querySelector('.context-item:last-child')?.click();
		check('an entry does its job', chosen.at(-1) === 'End Encounter', chosen);
		await animated();
		check('and closes it', opened().length === 0, opened().length);
		barMenu().click();
		await animated();
		barMenu().click();
		await animated();
		check('a second click on the button closes it', opened().length === 0, opened().length);
		ui.context = null;
		await draw();

		// the omni-tool's cut corner shrinks with the bar, and stays clear of the button in it
		game.settings.set(null, 'device', 'omni');
		await wait(200);
		for (const percent of [50, 100, 200]) {
			SFH.store.carouselScale = percent;
			await draw();
			const bar = el().querySelector('.sfh-turns');
			const barBox = bar.getBoundingClientRect();
			const button = barMenu().getBoundingClientRect();
			const cut = parseFloat(getComputedStyle(bar).clipPath.match(/100% - ([\d.]+)px/)?.[1]);
			check(`${percent}%: the corner follows the size`, Math.abs(cut - 9 * percent / 100) < 0.01, cut);
			check(`${percent}%: and does not touch the button`, (barBox.right - button.right) + (button.top - barBox.top) >= cut, [barBox.right - button.right, button.top - barBox.top, cut]);
		}
		SFH.store.carouselScale = 100;
		await draw();
	}

	/* ---- it is not seen until its stylesheet has arrived ---- */
	{
		const sheet = document.querySelector('link[href*="carousel.css"]');
		SFH.store.carousel = false;
		await draw();
		sheet.disabled = true;
		SFH.store.carousel = true;
		await draw();
		check('drawn before its stylesheet, it is hidden', getComputedStyle(el()).visibility === 'hidden', getComputedStyle(el()).visibility);
		check('and so are its portraits', getComputedStyle(el().querySelector('.sfh-portrait img')).visibility === 'hidden');
		sheet.disabled = false;
		await wait(250);
		await draw();
		check('the stylesheet shows it', getComputedStyle(el()).visibility === 'visible', getComputedStyle(el()).visibility);
		check('at its proper size', Math.abs(el().querySelector('.sfh-card:not(.active)').getBoundingClientRect().width - 66) < 1, el().querySelector('.sfh-card:not(.active)').getBoundingClientRect().width);
	}

	/* ---- it steps down below Calendaria's HUD, and follows it ---- */
	{
		SFH.store.sequences = false;
		SFH.DeviceChrome.setPower(true, { silent: true });
		game.settings.set(null, 'device', 'omni');
		await wait(200);
		await draw();
		const natural = el().getBoundingClientRect();
		const hud = document.createElement('div');
		hud.id = 'calendaria-hud';
		const centre = natural.left + natural.width / 2;
		hud.style.cssText = `position:fixed;top:${natural.top + 10}px;left:${centre - 180}px;width:360px;height:60px;background:#1f2a44;z-index:30`;
		document.body.append(hud);
		const { refreshObstacles } = await import('../scripts/interface/obstacles.mjs');
		refreshObstacles();
		await wait(120);
		const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
		let box = el().getBoundingClientRect();
		let h = hud.getBoundingClientRect();
		check('with Calendaria\'s HUD in its place, it steps down below it', box.top >= h.bottom && !overlap(box, h), [box.top, h.bottom]);
		check('and only just below it', box.top - h.bottom < 12, box.top - h.bottom);
		SFH.Projection.fit();
		await wait(120);
		const panel = document.querySelector('#sfh-projection [data-slot="identity"]').getBoundingClientRect();
		check('the projection still clears it', panel.top >= box.bottom - 1, [panel.top, box.bottom]);
		hud.style.top = `${natural.top + 60}px`;
		await wait(200);
		box = el().getBoundingClientRect();
		h = hud.getBoundingClientRect();
		check('dragging the HUD lower takes it lower too', box.top >= h.bottom && !overlap(box, h), [box.top, h.bottom]);
		hud.style.left = '20px';
		await wait(200);
		box = el().getBoundingClientRect();
		check('moved out of the way, it goes back up', Math.abs(box.top - natural.top) < 1, [box.top, natural.top]);
		hud.style.left = `${centre - 180}px`;
		await wait(200);
		hud.remove();
		refreshObstacles();
		await wait(200);
		box = el().getBoundingClientRect();
		check('closed, it goes back up', Math.abs(box.top - natural.top) < 1, [box.top, natural.top]);
		SFH.DeviceChrome.setPower(false, { silent: true });
	}

	/* ---- it fits, on every device, and the projection clears it ---- */
	SFH.store.sequences = false;
	SFH.DeviceChrome.setPower(true, { silent: true });
	for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal', 'vambrace']) {
		game.settings.set(null, 'device', device);
		await wait(300);
		await draw();
		SFH.Projection.fit();
		await wait(120);
		const box = el().getBoundingClientRect();
		const sidebar = document.getElementById('sidebar').getBoundingClientRect();
		const sceneEdge = Math.max(...[...document.querySelectorAll('#scene-navigation .scene')].map((s) => s.getBoundingClientRect().right));
		const proj = document.getElementById('sfh-projection').getBoundingClientRect();
		const panel = document.querySelector('#sfh-projection [data-slot="identity"]').getBoundingClientRect();
		check(`${device}: inside the free space`, box.left >= sceneEdge - 1 && box.right <= sidebar.left + 1, [box.left, box.right, sceneEdge, sidebar.left]);
		const barBox = el().querySelector('.sfh-turns').getBoundingClientRect();
		const menuBox = barMenu().getBoundingClientRect();
		check(`${device}: the encounter menu button is inside the round bar`, menuBox.left >= barBox.left && menuBox.right <= barBox.right && menuBox.top >= barBox.top && menuBox.bottom <= barBox.bottom, [menuBox.left, menuBox.right, barBox.left, barBox.right]);
		check(`${device}: the projection stays clear of it`, panel.top >= box.bottom - 1, [panel.top, box.bottom]);
		const row = el().querySelector('.sfh-cards');
		const heights = [...el().querySelectorAll('.sfh-card')].map((c) => c.getBoundingClientRect());
		check(`${device}: no card runs into the next`, heights.every((r, i) => !heights[i + 1] || heights[i + 1].left >= r.right - 0.5), []);
		const active = el().querySelector('.sfh-card.active').getBoundingClientRect();
		check(`${device}: the current turn is the biggest`, heights.every((r) => r.width <= active.width + 0.5));
		const namesFit = [...el().querySelectorAll('.sfh-name')].every((n) => n.getBoundingClientRect().bottom <= n.closest('.sfh-card').getBoundingClientRect().bottom + 0.5);
		check(`${device}: names stay inside their cards`, namesFit);
	}
	SFH.DeviceChrome.setPower(false, { silent: true });

	/* ---- the round sits under the row ---- */
	const under = () => {
		const row = el().querySelector('.sfh-cards').getBoundingClientRect();
		const bar = el().querySelector('.sfh-turns').getBoundingClientRect();
		return { row, bar };
	};
	game.settings.set(null, 'device', 'omni');
	await wait(200);
	await draw();
	{
		const { row, bar } = under();
		check('the round is below the row', bar.top >= row.bottom - 0.5, [bar.top, row.bottom]);
		check('and centered under it', Math.abs((bar.left + bar.width / 2) - (row.left + row.width / 2)) <= 1, [bar.left, bar.right, row.left, row.right]);
	}

	/* ---- the two layouts ---- */
	{
		// the cards slide to their new places, so measure once they have arrived
		const settled = async () => { await draw(); await wait(340); };
		check('the current turn on the left is the default', SFH.store.carouselLayout === 'left', SFH.store.carouselLayout);
		combat.turn = 1;
		setUser(true);
		await settled();
		check('left: the current turn is first', ids() === 'c2,c3,c4,c5,c6,c1' && el().querySelector('.sfh-card').classList.contains('active'), ids());
		check('left: the next round is marked ahead', /Round 3/.test(el().querySelector('.sfh-next-round').textContent));

		SFH.store.carouselLayout = 'center';
		await settled();
		check('centered: those who just went are on its left', ids() === 'c6,c1,c2,c3,c4,c5', ids());
		check('centered: the current turn is marked', card('c2').classList.contains('active'));
		check('centered: the round change behind it is this round', /Round 2/.test(el().querySelector('.sfh-next-round').textContent), el().querySelector('.sfh-next-round').textContent);
		const offCenter = () => {
			const row = el().querySelector('.sfh-cards').getBoundingClientRect();
			const a = el().querySelector('.sfh-card.active').getBoundingClientRect();
			return Math.abs((a.left + a.width / 2) - (row.left + row.width / 2));
		};
		check('centered: it is in the very middle', offCenter() < 1, offCenter());
		const barCenter = () => { const b = el().querySelector('.sfh-turns').getBoundingClientRect(); return b.left + b.width / 2; };
		const activeCenter = () => { const a = el().querySelector('.sfh-card.active').getBoundingClientRect(); return a.left + a.width / 2; };
		check('centered: over the round bar', Math.abs(barCenter() - activeCenter()) < 1, [barCenter(), activeCenter()]);
		for (const [turn, label] of [[0, 'first'], [5, 'last'], [3, 'in the middle']]) {
			combat.turn = turn;
			await settled();
			check(`centered, on the ${label} turn: still in the middle`, offCenter() < 1, offCenter());
			const marks = [...el().querySelectorAll('.sfh-next-round')];
			check(`centered, on the ${label} turn: one round mark`, marks.length === 1, marks.length);
		}
		combat.turn = 0;
		await settled();
		check('centered, first turn: the mark to its left is this round', /Round 2/.test(el().querySelector('.sfh-next-round').textContent));
		combat.turn = 5;
		await settled();
		const markIndex = [...el().querySelector('.sfh-cards').children].findIndex((c) => c.classList.contains('sfh-next-round'));
		const activeIndex = [...el().querySelector('.sfh-cards').children].findIndex((c) => c.classList.contains('active'));
		check('centered, last turn: the mark to its right is the next round', markIndex > activeIndex && /Round 3/.test(el().querySelector('.sfh-next-round').textContent), [markIndex, activeIndex]);

		for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal', 'vambrace']) {
			game.settings.set(null, 'device', device);
			await wait(250);
			await settled();
			check(`${device}, centered: in the middle`, offCenter() < 1, offCenter());
		}
		game.settings.set(null, 'device', 'omni');
		await wait(150);

		// a crowd keeps the current one in view, in the middle
		const crowdList = Array.from({ length: 30 }, (_, i) => ({ ...combat.turns[1], id: `x${i}`, name: `Trooper ${i}`, token: null }));
		const realList = combat.turns;
		combat.turns = crowdList;
		combat.turn = 12;
		await settled();
		const crowdRow = el().querySelector('.sfh-cards');
		check('centered, with a crowd: it overflows', crowdRow.scrollWidth > crowdRow.clientWidth);
		check('centered, with a crowd: the current turn starts in the middle', offCenter() < 2, offCenter());
		crowdRow.scrollLeft += 100;
		await settled();
		check('centered, with a crowd: a redraw keeps the place', offCenter() > 50, offCenter());
		combat.turn = 13;
		await settled();
		check('centered, with a crowd: a new turn comes back to the middle', offCenter() < 2, offCenter());
		combat.turns = realList;

		// before it starts there is no current turn to center
		combat.round = 0;
		combat.turn = null;
		await settled();
		check('centered, not started: initiative order, nothing marked', ids() === 'c1,c2,c3,c4,c5,c6' && !el().querySelector('.sfh-next-round'), ids());
		combat.round = 2;
		combat.turn = 1;
		SFH.store.carouselLayout = 'left';
		await settled();
		check('back to left: no padding left over', !el().querySelector('.sfh-cards').style.paddingLeft && !el().querySelector('.sfh-cards').style.paddingRight);
	}

	/* ---- the size setting ---- */
	const sized = async (percent) => {
		SFH.store.carouselScale = percent;
		await draw();
		SFH.Projection.fit();
		await wait(100);
		return el().querySelector('.sfh-card:not(.active)').getBoundingClientRect().width;
	};
	SFH.DeviceChrome.setPower(true, { silent: true });
	await wait(200);
	const normal = await sized(100);
	check('100% is the size it was drawn at', Math.abs(normal - 66) < 1, normal);
	const small = await sized(50);
	check('50% halves the cards', Math.abs(small - 33) < 1, small);
	for (const percent of [50, 60, 150, 200]) {
		const width = await sized(percent);
		check(`${percent}%: cards follow the setting`, Math.abs(width - 66 * percent / 100) < 1, width);
		const { row, bar } = under();
		check(`${percent}%: the round stays below the row`, bar.top >= row.bottom - 0.5, [bar.top, row.bottom]);
		const fontNow = parseFloat(getComputedStyle(el().querySelector('.sfh-round')).fontSize);
		check(`${percent}%: its text follows too`, Math.abs(fontNow - 12 * percent / 100) < 0.5, fontNow);
		const names = [...el().querySelectorAll('.sfh-name')].every((n) => n.getBoundingClientRect().bottom <= n.closest('.sfh-card').getBoundingClientRect().bottom + 0.5);
		check(`${percent}%: names stay inside their cards`, names);
		const panel = document.querySelector('#sfh-projection [data-slot="identity"]').getBoundingClientRect();
		check(`${percent}%: the projection clears it`, panel.top >= el().getBoundingClientRect().bottom - 1, [panel.top, el().getBoundingClientRect().bottom]);
		const sidebarEdge = document.getElementById('sidebar').getBoundingClientRect().left;
		check(`${percent}%: it stays clear of the sidebar`, el().getBoundingClientRect().right <= sidebarEdge + 1);
	}
	await sized(100);
	SFH.DeviceChrome.setPower(false, { silent: true });

	/* ---- a crowd scrolls rather than spilling ---- */
	game.settings.set(null, 'device', 'omni');
	await wait(200);
	const crowd = Array.from({ length: 30 }, (_, i) => ({ ...realTurns[1], id: `x${i}`, name: `Trooper ${i}` }));
	combat.turns = crowd;
	await draw();
	const box = el().getBoundingClientRect();
	const row = el().querySelector('.sfh-cards');
	const clearOf = document.getElementById('sidebar').getBoundingClientRect().left;
	const clearFrom = Math.max(...[...document.querySelectorAll('#scene-navigation .scene')].map((s) => s.getBoundingClientRect().right));
	check('a long row scrolls inside its space', row.scrollWidth > row.clientWidth && box.right <= clearOf + 1 && box.left >= clearFrom - 1, [row.scrollWidth, row.clientWidth, box.left, box.right, clearFrom, clearOf]);
	el().dispatchEvent(new WheelEvent('wheel', { deltaY: 200, bubbles: true }));
	check('the wheel scrolls it', row.scrollLeft > 0, row.scrollLeft);
	await draw();
	check('a redraw keeps the place', el().querySelector('.sfh-cards').scrollLeft > 0, el().querySelector('.sfh-cards').scrollLeft);
	combat.turn = 2;
	await draw();
	check('a new turn goes back to the front', el().querySelector('.sfh-cards').scrollLeft === 0, el().querySelector('.sfh-cards').scrollLeft);
	combat.turns = realTurns;
	combat.turn = 1;

	/* ---- hidden with the rest of the HUD ---- */
	await draw();
	SFH.DeviceChrome.setHidden(true);
	check('the hide key clears it', getComputedStyle(el()).display === 'none');
	SFH.DeviceChrome.setHidden(false);
	check('and brings it back', getComputedStyle(el()).display !== 'none');
	return out;
});

if (shotsTo) {
	const shots = [];
	for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal', 'vambrace']) {
		await page.evaluate(async (d) => {
			setUser(true);
			game.settings.set(null, 'device', d);
			await new Promise((r) => setTimeout(r, 300));
			await Carousel.render();
		}, device);
		await new Promise((r) => setTimeout(r, 400));
		const clip = await page.evaluate(() => { const b = document.getElementById('sfh-carousel').getBoundingClientRect(); return { x: b.left - 4, y: b.top, width: b.width + 8, height: b.height + 4 }; });
		shots.push(await page.screenshot({ clip }));
	}
	const metas = await Promise.all(shots.map((b) => sharp(b).metadata()));
	const w = Math.max(...metas.map((m) => m.width));
	let y = 0;
	const comps = shots.map((b, i) => { const c = { input: b, left: 0, top: y }; y += metas[i].height + 8; return c; });
	await sharp({ create: { width: w, height: y, channels: 3, background: '#2a2f38' } }).composite(comps).png().toFile(`${shotsTo}/carousel.png`);
	await page.evaluate(async () => { SFH.store.sequences = false; game.settings.set(null, 'device', 'tron'); SFH.DeviceChrome.setPower(true, { silent: true }); await new Promise((r) => setTimeout(r, 400)); await Carousel.render(); SFH.Projection.fit(); });
	await new Promise((r) => setTimeout(r, 500));
	await page.screenshot({ path: `${shotsTo}/carousel-full.png` });
}
await browser.close();

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
