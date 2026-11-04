/*
 * Mock-ups, played on the real projection in the harness (harness-device.html?mockup). Nothing
 * here is part of the module: it is a place to try things before building them.
 *
 * Everything tried here so far has been built: the Vambrace's arcane bolts, the Journal's satchel,
 * what else is kept in it and the Marauder's Map fade-in, the four fantasy looks and the seven
 * sci-fi looks (scripts/projection/bolts.mjs; scripts/device/art.mjs and styles/device.css;
 * design/1-head.html; styles/looks.css). What is left is a pair of buttons that play the Journal's
 * and the Vambrace's openings again; pick a look from the rig's own device picker.
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

const rig = document.getElementById('rig');
rig.insertAdjacentHTML('beforeend', `<div id="mock">
	<b>Mock-ups</b>
	<div class="row"><button type="button" id="mockJournal">Play the Journal</button><button type="button" id="mockVambrace">Play the Vambrace</button></div>
</div>`);

/** Switch to a device, with the power off, and raise it. */
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
globalThis.SFH.mock = { replay };
