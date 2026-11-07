/*
 * A private message says so, on its card in the chat and on the projection's Latest strip: a
 * private GM roll, a blind roll, a self roll, or a whisper and between whom, for whoever is
 * looking. A message the whole table sees is left as it is.
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
	const { messageMode, markMessage } = await import('../scripts/interface/chat-modes.mjs');
	const { Projection, actor } = SFH;

	// the table: a GM, and two players
	const people = {
		gm: { id: 'gm', name: 'Nick', isGM: true },
		ann: { id: 'ann', name: 'Ann', isGM: false, character: actor },
		bo: { id: 'bo', name: 'Bo', isGM: false },
		gm2: { id: 'gm2', name: 'Cass', isGM: true },
	};
	let me = people.gm;
	game.users = Object.assign(Object.values(people), { get: (id) => people[id] ?? null });
	Object.defineProperty(game, 'user', { configurable: true, get: () => me });
	const msg = (author, whisper = [], extra = {}) => ({ author: people[author], whisper, blind: false, isRoll: false, ...extra });
	const label = (m) => messageMode(m)?.label ?? null;
	const kind = (m) => messageMode(m)?.kind ?? null;

	/* ---- what each is ---- */
	check('one the whole table sees is left alone', messageMode(msg('ann')) === null && messageMode(msg('ann', [], { isRoll: true })) === null);
	const gmRoll = msg('ann', ['gm'], { isRoll: true });
	check("a player's private GM roll, to the GM", kind(gmRoll) === 'private' && label(gmRoll) === 'Private roll by Ann: GM only', label(gmRoll));
	me = people.ann;
	check('and to the player who rolled it', label(gmRoll) === 'Private roll: GM only', label(gmRoll));
	me = people.bo;
	check('and to another player, who sees that something was rolled', label(gmRoll) === 'Private roll by Ann: GM only', label(gmRoll));
	me = people.gm;
	// with one GM, Foundry stores the GM's private roll as it does a self roll: to the GM alone
	check("the GM's own private roll, with another GM at the table", label(msg('gm', ['gm', 'gm2'], { isRoll: true })) === 'Private roll: GM only', label(msg('gm', ['gm', 'gm2'], { isRoll: true })));
	check('a whisper between GMs is a whisper, not a roll', label(msg('gm', ['gm2'])) === 'Whisper to Cass');
	const blind = msg('ann', ['gm'], { isRoll: true, blind: true });
	check('a blind roll, to the GM', kind(blind) === 'blind' && label(blind) === 'Blind roll: the player cannot see it', label(blind));
	me = people.ann;
	check('and to the player who rolled it', label(blind) === 'Blind roll: only the GM sees the result', label(blind));
	check('a self roll, to whoever rolled it', kind(msg('ann', ['ann'], { isRoll: true })) === 'self' && label(msg('ann', ['ann'], { isRoll: true })) === 'Self roll');
	me = people.gm;
	check('and to the GM, with whose it is', label(msg('ann', ['ann'], { isRoll: true })) === 'Self roll · Ann', label(msg('ann', ['ann'], { isRoll: true })));
	const whisper = msg('ann', ['bo']);
	me = people.ann;
	check('a whisper, to whoever sent it', kind(whisper) === 'whisper' && label(whisper) === 'Whisper to Bo', label(whisper));
	me = people.bo;
	check('to whoever it is for', label(whisper) === 'Whisper from Ann', label(whisper));
	me = people.gm;
	check('and to the GM, between whom', label(whisper) === 'Whisper from Ann to Bo', label(whisper));
	me = people.ann;
	check('a whisper to the GM is from whom, to whoever it is for', (() => { me = people.gm; return label(msg('ann', ['gm'])) === 'Whisper from Ann'; })());
	check('one to several names them all', (() => { me = people.gm; return label(msg('gm', ['ann', 'bo'])) === 'Whisper to Ann, Bo'; })(), label(msg('gm', ['ann', 'bo'])));
	me = people.gm;

	/* ---- on the card ---- */
	const card = () => {
		const li = document.createElement('li');
		li.className = 'chat-message message flexcol whisper';
		li.innerHTML = `<header class="message-header flexrow"><h4 class="message-sender">Ann</h4><span class="message-metadata"><time>now</time></span>
			<span class="whisper-to">To: Nick</span><span class="flavor-text">Stealth check</span></header><div class="message-content">17</div>`;
		document.getElementById('chat-log-test')?.remove();
		const log = document.createElement('ol');
		log.id = 'chat-log-test';
		log.className = 'chat-log';
		log.append(li);
		document.body.append(log);
		return li;
	};
	let li = card();
	markMessage(gmRoll, li);
	const tag = li.querySelector('.sfh-mode');
	check('the card says what it is', tag?.textContent.trim() === 'Private roll by Ann: GM only' && li.classList.contains('sfh-mode-private'), li.outerHTML.slice(0, 200));
	check('in its header, before the flavor', tag?.parentElement === li.querySelector('.message-header') && tag.nextElementSibling?.matches('.whisper-to'));
	check("and Foundry's own To: line, which says less, is not shown as well", getComputedStyle(li.querySelector('.whisper-to')).display === 'none');
	check('it can be read: a label, not a tint alone', tag.getBoundingClientRect().height > 10 && getComputedStyle(tag).display !== 'none');
	markMessage(gmRoll, li);
	check('drawn again, it is marked once', li.querySelectorAll('.sfh-mode').length === 1);
	li = card();
	markMessage(msg('ann'), li);
	check('one everyone sees has no label', !li.querySelector('.sfh-mode') && !li.classList.contains('sfh-moded') && getComputedStyle(li.querySelector('.whisper-to')).display !== 'none');
	li = card();
	markMessage(blind, li);
	const blindTag = li.querySelector('.sfh-mode');
	li = card();
	markMessage(msg('ann', ['bo']), li);
	const whisperTag = li.querySelector('.sfh-mode');
	check('a blind roll and a whisper are told apart by color too', getComputedStyle(blindTag).borderTopColor !== getComputedStyle(whisperTag).borderTopColor);

	/* ---- the Latest strip ---- */
	await game.settings.set(null, 'device', 'omni');
	await wait(150);
	SFH.DeviceChrome.setPower(true, { silent: true });
	await wait(500);
	const roll = (id, extra) => ({ id, rolls: [{ formula: '1d20 + 9', total: 21 }], isContentVisible: true, visible: true, actor, flags: {}, flavor: '<h4>Stealth</h4>', whisper: [], blind: false, isRoll: true, author: people.ann, ...extra });
	const strip = () => document.querySelector('#sfh-projection [data-slot="latest"]');
	Projection.noteRoll(roll('r1', { whisper: ['gm'] }));
	await wait(80);
	const mark = strip()?.querySelector('.l-m');
	check('a private roll says so on the Latest strip', !!mark && mark.classList.contains('sfh-mode-private') && mark.dataset.tooltip === 'Private roll by Ann: GM only', strip()?.innerHTML.slice(0, 200));
	Projection.noteRoll(roll('r2'));
	await wait(80);
	check('one the table saw has no mark', /Stealth/.test(strip()?.textContent ?? '') && !strip().querySelector('.l-m'));
	SFH.DeviceChrome.setPower(false, { silent: true });
	return out;
});

await browser.close();
for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
