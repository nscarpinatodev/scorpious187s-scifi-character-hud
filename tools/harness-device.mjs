/*
 * Harness glue. Stubs just enough of Foundry — settings, i18n, hooks — for the module's
 * own chrome.mjs to run unmodified, then drives it from the rig controls.
 */
const store = { device: 'omni', worldDevice: 'omni', sequences: true, deckSize: 40, grid: 'panels' };
const onChange = {};

globalThis.game = {
	ready: true,
	settings: {
		register(mod, key, cfg) {
			if (cfg.onChange) onChange[key] = cfg.onChange;
			if (!(key in store)) store[key] = cfg.default;
		},
		get: (mod, key) => store[key],
		set: (mod, key, value) => {
			store[key] = value;
			onChange[key]?.(value);
		},
	},
	i18n: { localize: (k) => k },
	modules: { get: () => ({ version: 'harness' }) },
};
globalThis.Hooks = {
	on() {},
	once() {},
	callAll(...args) {
		(globalThis.__hooks ??= []).push(args);
	},
};

const { DeviceChrome } = await import('../scripts/device/chrome.mjs');
const { registerSettings } = await import('../scripts/settings.mjs');

registerSettings(() => DeviceChrome.refresh());
DeviceChrome.mount();

// the ten macro slots Foundry would have rendered
document.getElementById('action-bar').innerHTML = Array.from({ length: 10 }, (_, i) =>
	`<li class="slot ${i % 3 ? 'full' : ''}" role="button" data-action="execute" data-slot="${i + 1}">
		<span class="key">${i === 9 ? 0 : i + 1}</span>
	</li>`).join('');
DeviceChrome.fit();   // Foundry renders the bar before we mount; the harness does not

document.getElementById('rigDevice').addEventListener('change', (e) => game.settings.set(null, 'device', e.target.value));
document.getElementById('rigSize').addEventListener('input', (e) => game.settings.set(null, 'deckSize', Number(e.target.value)));
document.getElementById('rigPower').addEventListener('click', () => DeviceChrome.toggle());

globalThis.SFH = { DeviceChrome, store };
