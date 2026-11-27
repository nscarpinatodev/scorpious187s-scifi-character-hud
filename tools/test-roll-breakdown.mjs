/*
 * D&D 5e: a roll's dice open in its card (scripts/interface/roll-breakdown.mjs,
 * styles/interface.css), on stand-in compact cards under Foundry's stylesheet and the system's
 * own (tools/harness-rolls5e.html).
 *
 * The system hangs the dice in a pop-up under the total, over the card below. The first checks
 * show that, as the system leaves it; the rest that a click now opens them in the card, which
 * grows to hold them, and closes them again.
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
await page.setViewport({ width: 1400, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-rolls5e.html`);
await new Promise((r) => setTimeout(r, 900));

const out = [];
const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Where a card, its roll and its dice are. */
const look = (id) => page.evaluate((id) => {
	const b = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), height: Math.round(r.height) }; };
	const card = document.querySelector(`[data-message-id="${id}"]`);
	const list = card.querySelector('.roll-breakdown');
	const next = card.nextElementSibling;
	return {
		card: b(card), next: next ? b(next) : null, list: b(list),
		popup: list.matches(':popover-open'), open: list.classList.contains('sfh-open'), shown: list.getClientRects().length > 0,
		expanded: card.querySelector('button.dice-roll').getAttribute('aria-expanded'),
		rows: list.querySelectorAll('.tooltip-part').length,
		lastRow: b(list.querySelector('.tooltip-part:last-child')),
		background: getComputedStyle(list).backgroundColor,
	};
}, id);
/** A real click on a card's total, as a player's. */
const click = async (id) => {
	const at = await page.evaluate((id) => { const el = document.querySelector(`[data-message-id="${id}"] button.dice-roll`); el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, id);
	await page.mouse.click(...at);
	await wait(350);
};

for (const [theme, on] of [['the system as it is', false], ['with the device on', true]]) {
	await page.evaluate(async (on) => { if (on) { document.body.dataset.sfhDevice = 'omni'; document.body.dataset.sfhChat = 'on'; } else { delete document.body.dataset.sfhDevice; delete document.body.dataset.sfhChat; } await document.fonts.load('16px Rajdhani').catch(() => {}); await document.fonts.load('16px "Share Tech Mono"').catch(() => {}); await document.fonts.ready; }, on);
	await wait(400);
	if (!on) {
		/* ---- as the system leaves it ---- */
		const before = await look('attack');
		check('closed, the dice are not shown', !before.shown && !before.popup, before);
		await click('attack');
		const s = await look('attack');
		check('the system opens the dice in a pop-up', s.popup && s.shown, s);
		check('and the card stays the size it was', s.card.height === before.card.height, { before: before.card.height, now: s.card.height });
		check('so the dice lie over the card below', s.list.bottom > s.next.top + 4, { list: s.list, next: s.next });
		await page.keyboard.press('Escape');
		await wait(200);
		check('closed again for the rest', !(await look('attack')).shown);
		const loaded = await page.evaluate(async () => { const m = await ROLLS.load(); m.openRollsInCard(); m.openRollsInCard(); return typeof m.openRollsInCard; });
		check('the fix loads', loaded === 'function');
	}

	/* ---- in the card ---- */
	const before = await look('attack');
	await click('attack');
	let s = await look('attack');
	check(`${theme}: a click opens the dice`, s.open && s.shown && s.rows === 3, s);
	check(`${theme}: not in a pop-up`, s.popup === false, s.popup);
	check(`${theme}: the card grows to hold them`, s.card.height >= before.card.height + s.list.height - 2 && s.list.height > 40, { before: before.card.height, now: s.card.height, list: s.list.height });
	check(`${theme}: every die is inside the card`, s.list.top >= s.card.top && s.lastRow.bottom <= s.card.bottom + 1, { card: s.card, list: s.list, lastRow: s.lastRow });
	check(`${theme}: the card below has moved down, clear of them`, s.next.top >= s.list.bottom && s.next.top > before.next.top, { list: s.list.bottom, next: s.next.top, was: before.next.top });
	check(`${theme}: they span the card, under the roll's row`, s.list.right - s.list.left > (s.card.right - s.card.left) * 0.8, { list: s.list, card: s.card });
	check(`${theme}: the button says it is open`, s.expanded === 'true', s.expanded);
	await click('attack');
	s = await look('attack');
	check(`${theme}: a second click closes them`, !s.open && !s.shown && !s.popup && s.expanded === 'false', s);
	check(`${theme}: and the card is the size it was`, s.card.height === before.card.height && s.next.top === before.next.top, { before: before.card.height, now: s.card.height });

	// two open at once, each in its own card
	await click('attack');
	await click('damage');
	const a = await look('attack');
	const d = await look('damage');
	check(`${theme}: two cards can be open at once`, a.open && d.open && a.shown && d.shown, { a: a.open, d: d.open });
	check(`${theme}: neither over the other`, a.card.bottom <= d.card.top + 1 && d.list.top >= d.card.top && d.list.bottom <= d.card.bottom + 1, { a: a.card, d: d.card, list: d.list });
	await click('attack');
	await click('damage');

	// a roll the player may not see has a dead button
	const priv = await look('private');
	await page.evaluate(() => document.querySelector('[data-message-id="private"] button.dice-roll').click());
	await wait(100);
	s = await look('private');
	check(`${theme}: a private roll's dice stay shut`, !s.open && !s.shown && s.card.height === priv.card.height, s);

	// a summary of saves: pills, the roll, and the dice under them
	const saves = await look('saves');
	await click('saves');
	s = await look('saves');
	check(`${theme}: a save in a summary opens in its card too`, s.open && s.shown && !s.popup && s.card.height > saves.card.height + 40 && s.lastRow.bottom <= s.card.bottom + 1, s);
	await click('saves');

	// the last card in the log: its dice are in the log's scroll, not past its foot
	await click('last');
	const reach = await page.evaluate(() => {
		const scroll = document.querySelector('.chat-scroll');
		const list = document.querySelector('[data-message-id="last"] .roll-breakdown');
		scroll.scrollTop = scroll.scrollHeight;
		const s = scroll.getBoundingClientRect(), l = list.getBoundingClientRect();
		return { scrollBottom: Math.round(s.bottom), listBottom: Math.round(l.bottom), inScroll: scroll.contains(list), scrollable: scroll.scrollHeight > scroll.clientHeight };
	});
	check(`${theme}: the last card's dice can be scrolled into the chat`, reach.inScroll && reach.listBottom <= reach.scrollBottom + 1, reach);
	await click('last');

	// a card the system draws later is caught the same way
	await page.evaluate(() => ROLLS.message('later', 'Belka Tampson', `<section class="icon-row">${ROLLS.roll(15, 8, ROLLS.D20)}</section>`));
	await click('later');
	s = await look('later');
	check(`${theme}: a card posted afterwards opens in its card`, s.open && s.shown && !s.popup, s);
	await click('later');
	await page.evaluate(() => document.querySelector('[data-message-id="later"]').remove());
}

await browser.close();
for (const r of out) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = out.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${out.length}` : `PASS: ${out.length} checks`);
process.exit(failed ? 1 : 0);
