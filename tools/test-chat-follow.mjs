/*
 * The chat log keeps following new messages while Foundry's tab is in the background
 * (scripts/interface/chat-follow.mjs), on a stand-in of Foundry 14's chat log
 * (tools/harness-chat.html), in the sidebar and popped out.
 *
 * The tab is hidden by bringing another one to the front, as a player's other window does. While
 * hidden, a browser holds back the log's scroll events; a message that grows after it was scrolled
 * to then reads, once the tab is back, as the player having scrolled up, and Foundry stops
 * following. The first checks show that happening without the fix, the rest that it no longer does.
 *
 * Foundry 14 has reckoned the bottom of the log two ways (within a hundredth of its length up to
 * 14.369, within twenty pixels from 14.370), so everything is run once under each.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import path from 'path';

const RULE = process.env.SFH_BOTTOM;
if (!RULE) {
	let failed = 0;
	for (const rule of ['hundredth', 'pixels']) {
		const run = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, SFH_BOTTOM: rule }, encoding: 'utf8' });
		process.stdout.write(run.stdout.split(/\r?\n/).filter(Boolean).map((line) => `[${rule}] ${line}`).join('\n') + '\n');
		process.stderr.write(run.stderr);
		if (run.status !== 0) failed++;
	}
	process.exit(failed ? 1 : 0);
}

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
// an image that takes its time, as one fetched from the server does
await page.setRequestInterception(true);
page.on('request', async (req) => {
	if (!req.url().includes('slow.svg')) return req.continue();
	await new Promise((r) => setTimeout(r, 400));
	req.respond({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160"/>' });
});
await page.goto(`file:///${dir}/harness-chat.html?bottom=${RULE}`);
await new Promise((r) => setTimeout(r, 400));
const other = await browser.newPage();
await page.bringToFront();

const out = [];
const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const frames = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const hide = async () => { await other.bringToFront(); await wait(100); };
const show = async () => { await page.bringToFront(); await frames(); await wait(100); };
const state = () => page.evaluate(() => ({ sidebar: CHAT.state(CHAT.chat), popout: CHAT.state(CHAT.chat.popout), hidden: document.hidden }));
/** Away: a card comes in, and grows after it was scrolled to (filled in, redrawn). */
const away = async (grow = 40) => {
	await hide();
	await page.evaluate((grow) => {
		const cards = CHAT.post('<p style="height:30px">card</p>');
		setTimeout(() => { for (const li of cards) li.firstChild.style.height = `${30 + grow}px`; }, 250);
	}, grow);
	await wait(600);
};
const reset = async () => { await page.evaluate(() => { CHAT.chat.scrollBottom(); CHAT.chat.popout.scrollBottom(); }); await frames(); await wait(50); };

check('the tab is in front to begin with', (await state()).hidden === false);
await hide();
check('another tab in front hides it', (await state()).hidden === true);
await show();

/* ---- without the fix: the stand-in loses its place as Foundry does ---- */
await away();
let s = await state();
check('without the fix, while away the log is short of its bottom by what the card grew', s.sidebar.gap === 40, s);
await show();
s = await state();
check('without the fix, back in front the log reads as scrolled up', s.sidebar.following === false && s.popout.following === false, s);
await page.evaluate(() => CHAT.post('<p style="height:30px">next</p>'));
await frames();
s = await state();
check('without the fix, the next message is not followed down', s.sidebar.gap > 0, s);
await reset();
s = await state();
check('scrolled down again, the stand-in follows again', s.sidebar.following && s.sidebar.gap === 0, s);

// the page dressed after the log was drawn: the browser holds the view, short of the new bottom
await page.evaluate(() => CHAT.dress(true));
await frames();
await wait(100);
s = await state();
check('without the fix, a log dressed after it was drawn reads as scrolled up', s.sidebar.following === false && s.sidebar.gap > 0, s);
await page.evaluate(() => CHAT.dress(false));
await reset();

/* ---- with the fix ---- */
const loaded = await page.evaluate(async () => { const m = await CHAT.load(); m.followChat(); m.followChat(); return typeof m.followChat; });
check('the fix loads', loaded === 'function');

await away();
await show();
s = await state();
check('back in front, the sidebar log is at its bottom', s.sidebar.gap === 0, s);
check('and still following', s.sidebar.following === true, s);
check('the popped-out log is at its bottom and following', s.popout.gap === 0 && s.popout.following === true, s);
await page.evaluate(() => CHAT.post('<p style="height:30px">next</p>'));
await frames();
s = await state();
check('the next message is followed down', s.sidebar.gap === 0 && s.popout.gap === 0, s);

// several messages while away, some growing, one an image that loads late
await hide();
await page.evaluate(() => {
	for (let i = 0; i < 4; i++) {
		const cards = CHAT.post(`<p style="height:30px">card ${i}</p>`);
		setTimeout(() => { for (const li of cards) li.firstChild.style.height = '90px'; }, 100 * (i + 1));
	}
	CHAT.post('<img src="https://x.test/slow.svg" alt="">');
});
await wait(900);
await show();
s = await state();
check('several messages away, one an image: at the bottom when back', s.sidebar.gap === 0 && s.popout.gap === 0, s);
check('several messages away: still following', s.sidebar.following && s.popout.following, s);

// away long enough to be hidden twice over, with nothing in between
await hide();
await show();
await away(60);
await show();
s = await state();
check('hidden again after an idle return: still caught up', s.sidebar.gap === 0 && s.sidebar.following, s);

/* ---- the page dressed after the log was drawn ---- */
await page.evaluate(() => CHAT.dress(true));
await frames();
await wait(100);
s = await state();
check('dressed after it was drawn, the log is kept at its bottom', s.sidebar.gap === 0 && s.popout.gap === 0, s);
check('and still following', s.sidebar.following && s.popout.following, s);
await page.evaluate(() => CHAT.post('<p style="height:30px">next</p>'));
await frames();
s = await state();
check('dressed, the next message is followed down', s.sidebar.gap === 0, s);
await page.evaluate(() => CHAT.dress(false));
await frames();
await wait(100);
s = await state();
check('undressed (the log shrinks), it is still at its bottom and following', s.sidebar.gap === 0 && s.sidebar.following, s);

/* ---- a log the player scrolled up is theirs ---- */
await page.evaluate(() => CHAT.scrollUp(CHAT.chat, 400));
await frames();
await wait(50);
s = await state();
check('the sidebar log scrolled up reads as scrolled up', s.sidebar.following === false && s.sidebar.gap >= 390, s);
const before = s.sidebar.gap;
await away();
await show();
s = await state();
check('a log the player scrolled up is left where it was', s.sidebar.following === false && s.sidebar.gap > before + 40, { before, s });
check('while the popped-out one, at its bottom, is brought down', s.popout.gap === 0 && s.popout.following === true, s);
const up = s.sidebar.gap;
await page.evaluate(() => CHAT.dress(true));
await frames();
await wait(100);
s = await state();
check('a log the player scrolled up is not pulled down when the page is dressed', s.sidebar.following === false && s.sidebar.gap >= up, { up, s });
await page.evaluate(() => CHAT.dress(false));
await frames();
await reset();

/* ---- a closed popout ---- */
await page.evaluate(() => { CHAT.chat.popout.rendered = false; });
await away();
await show();
s = await state();
check('with the popout closed, the sidebar log is still brought down', s.sidebar.gap === 0 && s.sidebar.following, s);
await page.evaluate(() => { delete globalThis.ui.chat.popout; });
await hide();
await show();
check('with no popout at all, nothing is thrown', errors.length === 0, errors);

/* ---- a tab that loaded while hidden ---- */
await hide();
await page.reload();
await wait(400);
s = await state();
check('reloaded behind another tab, it loads hidden', s.hidden === true, s);
// Foundry's first draw stops short of the bottom, and the event that says so is held back
await page.evaluate(async () => { const m = await CHAT.load(); m.followChat(); for (const app of [CHAT.chat, CHAT.chat.popout]) app.element.querySelector('.chat-scroll').scrollTop -= 150; });
await wait(300);
await show();
s = await state();
check('first shown, a log that loaded hidden is at its bottom', s.sidebar.gap === 0 && s.popout.gap === 0, s);
check('and follows', s.sidebar.following && s.popout.following, s);
await page.evaluate(() => CHAT.post('<p style="height:30px">next</p>'));
await frames();
s = await state();
check('the next message is followed down', s.sidebar.gap === 0, s);

/* ---- a long log: a little growth is a small part of it, and still more than twenty pixels ---- */
await page.evaluate(() => { for (let i = 0; i < 600; i++) CHAT.post(`<p style="height:40px">long ${i}</p>`); });
await reset();
await page.evaluate(() => CHAT.dress(true));
await frames();
await wait(100);
s = await state();
check('a long log dressed after it was drawn is kept at its bottom', s.sidebar.gap === 0 && s.popout.gap === 0, s);
check('and still following', s.sidebar.following && s.popout.following, s);
await page.evaluate(() => CHAT.post('<p style="height:30px">next</p>'));
await frames();
s = await state();
check('long and dressed, the next message is followed down', s.sidebar.gap === 0 && s.popout.gap === 0, s);

await browser.close();
for (const r of out) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = out.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${out.length}` : `PASS: ${out.length} checks`);
process.exit(failed ? 1 : 0);
