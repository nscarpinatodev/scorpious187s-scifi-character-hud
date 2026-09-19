/*
 * Harness glue. Stubs just enough of Foundry — settings, i18n, hooks — for the module's
 * own chrome.mjs to run unmodified, then drives it from the rig controls.
 */
const store = { device: 'omni', worldDevice: 'omni', sequences: true, deckSize: 40, grid: 'panels' };
const onChange = {};

globalThis.game = {
	ready: true,
	get user() { return { character: actor }; },
	get actors() { return [actor]; },
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
const hooks = {};
globalThis.Hooks = {
	on(name, fn) { (hooks[name] ??= []).push(fn); },
	once(name, fn) { this.on(name, fn); },
	callAll(name, ...args) {
		(globalThis.__hooks ??= []).push([name, ...args]);
		for (const fn of hooks[name] ?? []) fn(...args);
	},
};
globalThis.ui = { notifications: { warn: (m) => console.warn('notify:', m) } };

/*
 * A stand-in for a system character sheet: a floating application window with the header,
 * content and inline position Foundry gives one. If the projection can dock this, it can
 * dock a real sheet — the mechanics are the same node move.
 */
class FakeSheet {
	element = null;

	async render() {
		if (this.element) return this;
		const el = document.createElement('div');
		el.className = 'application sheet actor character';
		el.style.cssText = 'position:absolute;left:180px;top:90px;width:560px;height:520px;z-index:101;background:#1b1b22;border:1px solid #444';
		el.innerHTML = `
			<header class="window-header"><h1 class="window-title">Asha Rourke</h1><button class="header-control">✕</button></header>
			<section class="window-content">
				<nav class="sheet-tabs"><a class="item active">Character</a><a class="item">Actions</a><a class="item">Inventory</a><a class="item">Feats</a></nav>
				<div class="tab active">
					<p>The system's own sheet content lives here: strikes, skills, items, everything.</p>
					${Array.from({ length: 14 }, (_, i) => `<div class="row">Row ${i + 1} — the system rendered this</div>`).join('')}
				</div>
			</section>`;
		document.body.append(el);
		this.element = el;
		return this;
	}

	async close() {
		this.element?.remove();
		this.element = null;
	}
}

const sheet = new FakeSheet();
const actor = { name: 'Asha Rourke', sheet, isOwner: true, hasPlayerOwner: true, type: 'character' };

const { DeviceChrome } = await import('../scripts/device/chrome.mjs');
const { registerSettings } = await import('../scripts/settings.mjs');
const { Projection } = await import('../scripts/projection/projection.mjs');
const { SEQ } = await import('../scripts/constants.mjs');

// what module.mjs does in Foundry: the switch says what it wants, the projection obeys
Hooks.on('sfhPower', async (on, { sequence } = {}) => {
	if (on) {
		const raised = await Projection.open();
		if (!raised) return DeviceChrome.setPower(false, { silent: true });
		if (sequence) DeviceChrome.playSequence('on');
		return;
	}
	if (!sequence) return Projection.close();
	DeviceChrome.playSequence('off');
	setTimeout(() => Projection.close(), SEQ.off);
});

registerSettings(() => { DeviceChrome.refresh(); Projection.syncDevice(); });
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

globalThis.SFH = { DeviceChrome, Projection, store };
