/*
 * Mock-ups, played on the real projection in the harness (harness-device.html?mockup). Nothing
 * here is part of the module: it is a place to try things before building them.
 *
 *   The sci-fi devices proposed in design/theme-ideas.md, each dressed over a device already
 *   built (tools/mockup-scifi.mjs).
 *
 * The Vambrace's arcane bolts, the Journal's satchel, what else is kept in it and the Marauder's
 * Map fade-in, and the four fantasy looks were tried here, chosen and built
 * (scripts/projection/bolts.mjs; the satchel and its clutter in scripts/device/art.mjs and
 * styles/device.css, the book and its writing in design/1-head.html; the looks in
 * styles/looks.css); the buttons play the real things.
 */
import { SCIFI, scifiCss } from './mockup-scifi.mjs';

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

/* ---------------------------------------------------------------- looks */

/*
 * The sci-fi devices, each a palette and its own art dressed over a device already built. The
 * four fantasy looks that were tried here (the Reliquary, Runeforge, Witchfire and Grove) are
 * built now: pick them from the rig's own device picker.
 */
const LOOKS = { ...SCIFI };
const stage = (look) => `body[data-mock-look="${look}"] #sfh-projection .sfh-stage[data-device="${LOOKS[look].base}"]`;
const ui = (look) => `body[data-mock-look="${look}"][data-sfh-device="${LOOKS[look].base}"]`;
const looksCss = document.createElement('style');
looksCss.textContent = `
${scifiCss(stage, ui)}`;
document.head.append(looksCss);

/*
 * A look with art of its own draws it in place of its device's, in the same box, keeping the
 * plate (#sfh-arm) and the switch (#sfh-band). The device's own is put back when the look goes.
 */
let swapped = null;
function restoreArt() {
	if (swapped?.svg.isConnected) swapped.svg.innerHTML = swapped.html;
	swapped = null;
}
function swapArt(markup) {
	const svg = document.querySelector('#sfh-device svg.sfh-art');
	if (!svg) return;
	swapped = { svg, html: svg.innerHTML };
	svg.innerHTML = markup;
	for (const el of svg.querySelectorAll('[aria-label^="SFH."]')) el.setAttribute('aria-label', game.i18n.localize(el.getAttribute('aria-label')));
	DeviceChrome.fit();
}

async function playLook(look) {
	restoreArt();
	document.body.dataset.mockLook = look;
	if (!look) return;
	await replay(LOOKS[look].base, () => LOOKS[look].art && swapArt(LOOKS[look].art));
}

/* ---------------------------------------------------------------- wiring */

const rig = document.getElementById('rig');
rig.insertAdjacentHTML('beforeend', `<div id="mock">
	<b>Mock-ups</b>
	<div class="row"><button type="button" id="mockJournal">Play the Journal</button><button type="button" id="mockVambrace">Play the Vambrace</button></div>
	<label>Look <select id="mockLook">
		<option value="">As built</option>
		<optgroup label="Sci-fi">
			${Object.entries(SCIFI).map(([id, l]) => `<option value="${id}">${l.label}</option>`).join('')}
		</optgroup>
	</select></label>
</div>`);

/** Switch to a device, with the power off, and raise it; `before` runs just before it is raised. */
async function replay(device, before) {
	if (store.device !== device) {
		await game.settings.set(null, 'device', device);
		document.getElementById('rigDevice').value = device;
		await wait(500);
	}
	if (DeviceChrome.power) {
		DeviceChrome.setPower(false, { silent: true });
		await wait(500);
	}
	before?.();
	DeviceChrome.toggle();
}

const asBuilt = (device) => {
	restoreArt();
	document.getElementById('mockLook').value = '';
	delete document.body.dataset.mockLook;
	return replay(device);
};
document.getElementById('mockJournal').addEventListener('click', () => asBuilt('journal'));
document.getElementById('mockVambrace').addEventListener('click', () => asBuilt('vambrace'));
document.getElementById('mockLook').addEventListener('change', (e) => playLook(e.target.value));
// the rig's own device picker shows a device as built, with its own art drawn afresh
document.getElementById('rigDevice').addEventListener('change', () => {
	swapped = null;
	document.getElementById('mockLook').value = '';
	delete document.body.dataset.mockLook;
});
globalThis.SFH.mock = { replay, playLook, LOOKS };
