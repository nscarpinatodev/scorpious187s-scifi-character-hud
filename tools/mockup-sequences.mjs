/*
 * Mock-ups, played on the real projection in the harness (harness-device.html?mockup). Nothing
 * here is part of the module: it is a place to try things before building them.
 *
 *   More fantasy looks: the Reliquary, Runeforge and Witchfire over the Vambrace, the Grove over
 *   the Journal, each a palette and a little art.
 *
 * The Vambrace's arcane bolts and the Journal's satchel and Marauder's Map fade-in were tried
 * here, chosen and built (scripts/projection/bolts.mjs; the satchel in scripts/device/art.mjs and
 * styles/device.css, the book and its writing in design/1-head.html); the buttons play the real
 * things.
 */
const { DeviceChrome, store } = SFH;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const css = document.createElement('style');
css.textContent = `
#mock { display: flex; flex-direction: column; gap: 5px; border-top: 1px solid #556; margin-top: 4px; padding-top: 8px; }
#mock b { color: #fff; font-weight: 600; }
#mock .row { display: flex; gap: 6px; }
#mock button { flex: 1; }
`;
document.head.append(css);

/* ---------------------------------------------------------------- more fantasy looks */

/*
 * The four looks proposed with the Journal and the Vambrace, each a palette and a little art over
 * one of those two: the Reliquary (stained glass and gold leading, for clerics), the Runeforge
 * (stone and brass, runes like embers) and Witchfire (bone, and a green flame) over the Vambrace;
 * the Grove (a druid's herbarium: green leather and pressed leaves) over the Journal.
 */
const LOOKS = {
	reliquary: { base: 'vambrace', label: 'Reliquary' },
	runeforge: { base: 'vambrace', label: 'Runeforge' },
	witchfire: { base: 'vambrace', label: 'Witchfire' },
	grove: { base: 'journal', label: 'Grove' },
};
const stage = (look) => `body[data-mock-look="${look}"] #sfh-projection .sfh-stage[data-device="${LOOKS[look].base}"]`;
const ui = (look) => `body[data-mock-look="${look}"][data-sfh-device="${LOOKS[look].base}"]`;
const leaf = (fill) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 100'><path d='M30 98 C 30 70 30 40 30 6' stroke='${fill}' stroke-width='1.6' fill='none'/><path d='M30 8 C 6 26 4 62 30 90 C 56 62 54 26 30 8 Z' fill='${fill}' fill-opacity='.35' stroke='${fill}' stroke-opacity='.6'/><path d='M30 30 L 16 22 M30 46 L 13 36 M30 62 L 15 52 M30 30 L 44 22 M30 46 L 47 36 M30 62 L 45 52' stroke='${fill}' stroke-opacity='.5'/></svg>`)}")`;
const looksCss = document.createElement('style');
looksCss.textContent = `
/* the Reliquary: leaded glass in jewel colors, gold for the leading, light through it */
${stage('reliquary')} {
	--pnl: rgba(22, 14, 30, .86); --pnl2: rgba(232, 194, 90, .05); --line: rgba(214, 170, 70, .7); --line2: rgba(214, 170, 70, .2);
	--text: #f2e8d6; --bright: #fff8e8; --dim: #b8a68a; --hot: #e8c25a; --hotbg: rgba(232, 194, 90, .18); --hover: rgba(232, 194, 90, .12);
	--glow: rgba(232, 194, 90, .45); --acc: #e0577f; --accbg: rgba(224, 87, 127, .16); --good: #6fd89a;
}
${stage('reliquary')} .pnl {
	background:
		radial-gradient(circle at 12% 18%, rgba(196, 40, 80, .2), transparent 38%),
		radial-gradient(circle at 88% 30%, rgba(40, 90, 200, .22), transparent 40%),
		radial-gradient(circle at 30% 92%, rgba(30, 150, 90, .18), transparent 42%),
		linear-gradient(var(--pnl), var(--pnl)) padding-box,
		linear-gradient(140deg, #f2d27a, #8a6a14 45%, #f2d27a 70%, #8a6a14) border-box;
	border: 2px solid transparent;
}
${stage('reliquary')} .pnl::before { content: '✠ ✠'; color: #e8c25a; }
${stage('reliquary')} .vb-sigil :is(circle, path) { stroke: #e8c25a; }
${stage('reliquary')} .vb-sigil text { fill: #e8c25a; }
body[data-mock-look="reliquary"] #sfh-device svg.sfh-art { filter: hue-rotate(195deg) saturate(1.3) brightness(1.1); }
${ui('reliquary')} { --sfh-hot: #e8c25a; --sfh-glow: rgb(232 194 90 / 45%); --sfh-line: rgb(214 170 70 / 60%); --sfh-acc: #e0577f; --sfh-panel: rgb(22 14 30 / 90%); --sfh-text: #f2e8d6; --sfh-dim: #b8a68a; --sfh-bright: #fff8e8; --sfh-hover: rgb(232 194 90 / 12%); }

/* the Runeforge: dressed stone, brass at the edges, runes glowing like a forge's coals */
${stage('runeforge')} {
	--pnl: rgba(40, 38, 36, .95); --pnl2: rgba(196, 150, 74, .05); --line: rgba(196, 150, 74, .75); --line2: rgba(196, 150, 74, .2);
	--text: #ece4d8; --bright: #fff6ea; --dim: #a59a8a; --hot: #ff9a3c; --hotbg: rgba(255, 154, 60, .16); --hover: rgba(255, 154, 60, .1);
	--glow: rgba(255, 130, 40, .5); --acc: #c4964a; --accbg: rgba(196, 150, 74, .16);
}
${stage('runeforge')} .pnl {
	background:
		url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.08' numOctaves='4'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .48 0 0 0 0 .44 0 0 0 .16 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E"),
		linear-gradient(var(--pnl), var(--pnl)) padding-box,
		linear-gradient(140deg, #e0b870, #6a4a1c 50%, #e0b870) border-box;
	border: 2px solid transparent;
	backdrop-filter: none;
}
${stage('runeforge')} .pnl::after { display: none; }
${stage('runeforge')} .vb-sigil :is(circle, path) { stroke: #ff9a3c; }
${stage('runeforge')} .vb-sigil text { fill: #ff9a3c; }
body[data-mock-look="runeforge"] #sfh-device svg.sfh-art { filter: sepia(.7) hue-rotate(-20deg) saturate(1.4) brightness(.95); }
${ui('runeforge')} { --sfh-hot: #ff9a3c; --sfh-glow: rgb(255 130 40 / 45%); --sfh-line: rgb(196 150 74 / 65%); --sfh-acc: #c4964a; --sfh-panel: rgb(40 38 36 / 94%); --sfh-text: #ece4d8; --sfh-dim: #a59a8a; --sfh-bright: #fff6ea; --sfh-hover: rgb(255 154 60 / 10%); }

/* Witchfire: bone for the frames, a sickly green flame for everything that burns */
${stage('witchfire')} {
	--pnl: rgba(12, 14, 10, .9); --pnl2: rgba(125, 255, 106, .04); --line: rgba(222, 214, 190, .55); --line2: rgba(222, 214, 190, .16);
	--text: #e8e4d4; --bright: #fbf8ee; --dim: #9a9a86; --hot: #7dff6a; --hotbg: rgba(125, 255, 106, .14); --hover: rgba(125, 255, 106, .1);
	--glow: rgba(125, 255, 106, .5); --acc: #d8d0b4; --accbg: rgba(216, 208, 180, .14); --bad: #ff6a5a;
}
${stage('witchfire')} .pnl {
	background:
		radial-gradient(ellipse at 50% 120%, rgba(125, 255, 106, .12), transparent 60%),
		linear-gradient(var(--pnl), var(--pnl)) padding-box,
		linear-gradient(160deg, #f2ead2, #8a8470 40%, #e6dcc0 75%, #6a6656) border-box;
	border: 2px solid transparent;
}
${stage('witchfire')} .pnl::before { content: '☠ ☠'; color: #d8d0b4; text-shadow: 0 0 6px rgba(125, 255, 106, .6); }
${stage('witchfire')} .pnl::after { background: radial-gradient(1.5px 1.5px at 20% 80%, #b8ff9a, transparent), radial-gradient(1px 1px at 60% 70%, #7dff6a, transparent), radial-gradient(1.5px 1.5px at 85% 90%, #b8ff9a, transparent); background-size: 100% 200px; }
${stage('witchfire')} .vb-sigil :is(circle, path) { stroke: #7dff6a; }
${stage('witchfire')} .vb-sigil text { fill: #7dff6a; }
body[data-mock-look="witchfire"] #sfh-device svg.sfh-art { filter: hue-rotate(-95deg) saturate(1.4); }
${ui('witchfire')} { --sfh-hot: #7dff6a; --sfh-glow: rgb(125 255 106 / 45%); --sfh-line: rgb(222 214 190 / 50%); --sfh-acc: #d8d0b4; --sfh-panel: rgb(12 14 10 / 92%); --sfh-text: #e8e4d4; --sfh-dim: #9a9a86; --sfh-bright: #fbf8ee; --sfh-hover: rgb(125 255 106 / 10%); }

/* the Grove: a herbarium bound in green leather, its notes in leaf-green ink, leaves pressed in it */
${stage('grove')} { --hot: #3f6b2a; --hotbg: rgba(63, 107, 42, .12); --hover: rgba(63, 107, 42, .08); --acc: #8a6a14; }
${stage('grove')} :is(.jb-board, .jb-front, .jb-back) { filter: hue-rotate(95deg) saturate(.8) brightness(.9); }
${stage('grove')} .jb-back::after { filter: hue-rotate(-95deg) saturate(1.25) brightness(1.11); }
${stage('grove')} .jb-title { filter: hue-rotate(-95deg) saturate(1.25) brightness(1.11); }
${stage('grove')} .jb-page { background-color: #e6e2c4; }
${stage('grove')} .jb-page.r::after { content: ''; position: absolute; right: 26px; bottom: 30px; width: 70px; height: 116px; transform: rotate(-24deg); background: ${leaf('#4f6b2c')} no-repeat center / contain; pointer-events: none; }
${stage('grove')} .jb-page.l::after { content: ''; position: absolute; left: 70px; bottom: 26px; width: 48px; height: 80px; transform: rotate(18deg); background: ${leaf('#7a6a2c')} no-repeat center / contain; opacity: .8; pointer-events: none; }
body[data-mock-look="grove"] #sfh-device svg.sfh-art { filter: hue-rotate(60deg) saturate(.7); }
${ui('grove')} { --sfh-hot: #3f6b2a; --sfh-heading: #3f6b2a; --sfh-panel: rgb(230 226 196 / 97%); }
`;
document.head.append(looksCss);

async function playLook(look) {
	document.body.dataset.mockLook = look;
	if (!look) return;
	await replay(LOOKS[look].base);
}

/* ---------------------------------------------------------------- wiring */

const rig = document.getElementById('rig');
rig.insertAdjacentHTML('beforeend', `<div id="mock">
	<b>Mock-ups</b>
	<div class="row"><button type="button" id="mockJournal">Play the Journal</button><button type="button" id="mockVambrace">Play the Vambrace</button></div>
	<label>Fantasy look <select id="mockLook">
		<option value="">As built</option>
		<option value="reliquary">Reliquary (Vambrace)</option>
		<option value="runeforge">Runeforge (Vambrace)</option>
		<option value="witchfire">Witchfire (Vambrace)</option>
		<option value="grove">Grove (Journal)</option>
	</select></label>
</div>`);

async function replay(device) {
	if (store.device !== device) {
		await game.settings.set(null, 'device', device);
		document.getElementById('rigDevice').value = device;
		await wait(500);
	}
	if (DeviceChrome.power) {
		DeviceChrome.setPower(false, { silent: true });
		await wait(500);
	}
	DeviceChrome.toggle();
}

document.getElementById('mockJournal').addEventListener('click', () => replay('journal'));
document.getElementById('mockVambrace').addEventListener('click', () => replay('vambrace'));
document.getElementById('mockLook').addEventListener('change', (e) => playLook(e.target.value));
globalThis.SFH.mock = { replay, playLook };
