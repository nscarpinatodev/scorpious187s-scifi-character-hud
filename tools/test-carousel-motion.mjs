/*
 * The carousel's motion, on the real carousel against a stand-in encounter.
 *
 * A new turn slides each card to its new place, from wherever it is seen. The card that wraps
 * around from one end of the row to the other leaves off its edge and comes in at the other,
 * instead of crossing the whole row; the round marker slides with the rest. A redraw keeps the
 * cards that have not changed, so their portraits do not load again, and one part way through a
 * slide does not start the slide over.
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
	const slideOf = (node) => node?.getAnimations().find((a) => a.id === 'sfh-slide') ?? null;
	const frames = (anim) => anim?.effect?.getKeyframes() ?? [];
	const shiftOf = (frame) => Number(/translateX\((-?[\d.]+)px\)/.exec(frame.transform ?? '')?.[1] ?? 0);

	SFH.DeviceChrome.setPower(true, { silent: true });
	await wait(300);
	setUser(true);
	SFH.store.carouselLayout = 'center';
	combat.round = 2;
	combat.turn = 1;
	await Carousel.render();
	await wait(500);
	check('centered: who just went on the left', ids() === 'c6,c1,c2,c3,c4,c5', ids());
	const nodes = Object.fromEntries(['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map((id) => [id, card(id)]));
	const portraits = Object.fromEntries(Object.entries(nodes).map(([id, n]) => [id, n.querySelector('.sfh-portrait > img')]));
	const marker = el().querySelector('.sfh-next-round');

	/* ---- a new turn ---- */
	combat.turn = 2;
	await Carousel.render();
	check('the order turns one place', ids() === 'c1,c2,c3,c4,c5,c6', ids());
	check('a card that has not changed is the same card, its portrait not loaded again', card('c5') === nodes.c5 && card('c4') === nodes.c4);
	check('one that has changed keeps its portrait', card('c2') !== nodes.c2 && card('c2').querySelector('.sfh-portrait > img') === portraits.c2
		&& card('c3').querySelector('.sfh-portrait > img') === portraits.c3);
	const steps = ['c1', 'c2', 'c3', 'c4', 'c5'].map((id) => frames(slideOf(card(id))));
	check('the rest slide one place, from where they were', steps.every((f) => f.length === 2 && shiftOf(f[0]) > 0 && f[1].transform === 'none'), steps.map((f) => f.map((k) => k.transform)));
	const wrap = frames(slideOf(card('c6')));
	const shifts = wrap.map(shiftOf);
	check('the card going around fades off its edge and in at the other', wrap.length === 4 && wrap[0].opacity === '1' && wrap[1].opacity === '0' && wrap[2].opacity === '0' && wrap[3].opacity === '1', wrap.map((k) => [k.transform, k.opacity]));
	check('moving the way the others do: on off the left, in from the right', shifts[1] < shifts[0] && shifts[2] > 0 && wrap[3].transform === 'none', shifts);
	const rowWidth = el().querySelector('.sfh-cards').getBoundingClientRect().width;
	check('so it never crosses the row on its way in', shifts[2] < rowWidth / 3, [shifts[2], rowWidth]);
	check('the round marker goes when the order no longer wraps inside the row', !el().querySelector('.sfh-next-round') && !marker.isConnected);

	/* ---- a redraw part way through ---- */
	await wait(90);
	const running = slideOf(card('c4'));
	const at = running?.currentTime;
	nodes.c4 = card('c4');
	await Carousel.render();
	check('a redraw mid-slide keeps the same card', card('c4') === nodes.c4);
	check('and its slide runs on, not started over', slideOf(card('c4')) === running && running.currentTime >= at, [running?.currentTime, at]);
	await wait(450);
	check('every slide arrives', ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].every((id) => !slideOf(card(id))));
	const settledAt = Object.fromEntries(['c1', 'c6'].map((id) => [id, card(id).getBoundingClientRect().left]));
	await Carousel.render();
	check('a redraw with nothing changed moves nothing', ['c1', 'c6'].every((id) => !slideOf(card(id)) && card(id).getBoundingClientRect().left === settledAt[id]));

	/* ---- the round marker ---- */
	combat.turn = 3;
	await Carousel.render();
	await wait(450);
	const mark = el().querySelector('.sfh-next-round');
	check('it comes back where the order wraps', !!mark && mark.previousElementSibling === card('c6') && mark.nextElementSibling === card('c1'));
	combat.turn = 4;
	await Carousel.render();
	check('and slides with the cards, rather than jumping', el().querySelector('.sfh-next-round') === mark && !!slideOf(mark), mark.outerHTML.slice(0, 90));
	await wait(450);

	/* ---- someone joins ---- */
	combat.turns.push({ ...combat.turns[1], id: 'c7', name: 'Late Arrival', initiative: 1 });
	await Carousel.render();
	const joined = card('c7')?.getAnimations() ?? [];
	check('a new card fades in where it belongs', joined.some((a) => a.effect.getKeyframes()[0].opacity === '0') && !slideOf(card('c7')));
	combat.turns.pop();

	/* ---- the setting for less motion ---- */
	await wait(450);
	const media = window.matchMedia;
	window.matchMedia = (q) => (q.includes('reduced-motion') ? { matches: true } : media.call(window, q));
	combat.turn = 3;
	await Carousel.render();
	check('with less motion asked for, the cards move without sliding', [...el().querySelectorAll('[data-key]')].every((n) => !slideOf(n)));
	window.matchMedia = media;
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
