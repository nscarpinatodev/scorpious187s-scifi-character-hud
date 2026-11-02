import { EL, DEVICES, SEQ, S, MOD, KEYS } from '../constants.mjs';
import { currentDevice, setting } from '../settings.mjs';
import { deviceArt, buildArt } from './art.mjs';

/**
 * The device at the foot of the interface.
 *
 * This is a skin over Foundry's own furniture, not a replacement for it. The macro bar
 * is the real `#hotbar` — the same element, with the same listeners, drag-drop targets
 * and page controls — moved onto the device and resized. Nothing is re-implemented, so
 * a Foundry update that changes the hotbar changes ours too.
 *
 * Foundry inserts a frameless application's element on its *first* render only, so once
 * the hotbar has been moved it stays moved; later renders just rewrite its contents.
 * The power key is kept outside `#hotbar` for that reason: its contents are replaced
 * whenever a macro is dropped or the page turns.
 */
/** The hide key as the user has bound it, e.g. "Alt+H", or '' when it is unbound. */
function hideKeyLabel() {
	const [binding] = game.keybindings?.get(MOD, KEYS.hide) ?? [];
	if (!binding?.key) return '';
	return [...(binding.modifiers ?? []), binding.key.replace(/^(Key|Digit)/, '')].join('+');
}

export class DeviceChrome {
	static #power = false;
	static #hidden = false;
	static #told = false;
	/** What currently needs the canvas clear. */
	static #suspended = new Set();
	static #seqTimer = null;
	static #bound = false;

	static get power() {
		return this.#power;
	}

	static get hidden() {
		return this.#hidden;
	}

	static get device() {
		return document.body.dataset.sfhDevice || currentDevice();
	}

	/* -------------------------------------------- */
	/*  Mounting                                     */
	/* -------------------------------------------- */

	/** Build the device layer and move the macro bar onto it. Safe to call repeatedly. */
	static mount() {
		const bottom = document.getElementById('ui-bottom');
		const hotbar = document.getElementById('hotbar');
		if (!bottom || !hotbar) return false;

		const id = currentDevice();
		const device = DEVICES[id];
		document.body.dataset.sfhDevice = id;
		document.body.dataset.sfhGrid = setting(S.grid);
		document.body.dataset.sfhChat = setting(S.chatCards) ? 'on' : 'off';
		document.body.dataset.sfhPower = this.#power ? 'on' : 'off';
		document.body.dataset.sfhHidden = this.#hidden ? 'on' : 'off';

		let layer = document.getElementById(EL.device);
		if (!layer) {
			layer = document.createElement('div');
			layer.id = EL.device;
			const deck = document.createElement('div');
			deck.id = EL.deck;
			layer.append(deck);
			bottom.append(layer);
		}
		layer.dataset.device = id;

		// the art layer: only the devices with a plate of their own have one
		const art = deviceArt(device.art);
		const existing = layer.querySelector('svg.sfh-art');
		if (!art) existing?.remove();
		else if (!existing || existing.dataset.art !== device.art) {
			existing?.remove();
			const svg = buildArt(art);
			svg.dataset.art = device.art;
			layer.prepend(svg);
			layer.style.setProperty('--sfh-deck-bottom', `${art.deck.bottom * 100}%`);
			layer.style.setProperty('--sfh-deck-width', `${art.deck.width * 100}%`);
		}

		// the real macro bar rides on the device
		const deck = layer.querySelector(`#${EL.deck}`);
		if (hotbar.parentElement !== deck) deck.append(hotbar);
		hotbar.style.setProperty('--hotbar-size', `${setting(S.deckSize)}px`);
		// the bar fades out with the rest of Foundry's furniture; on a device it should not
		hotbar.classList.remove('faded-ui');

		// the power key, for devices that have no switch of their own
		this.#syncPowerKey(deck, device);
		this.#syncRestoreKey(deck);
		this.#bind();
		this.fit();
		return true;
	}

	/**
	 * Size the art to the macro bar.
	 *
	 * The mock-up's proportion is the bar covering roughly three quarters of the plate, so
	 * the arm follows the bar rather than the window: whatever key size the user picks, the
	 * bar sits on the plate the way it was drawn to.
	 */
	static fit() {
		const layer = document.getElementById(EL.device);
		const art = layer?.querySelector('svg.sfh-art');
		const deck = document.getElementById(EL.deck);
		if (!layer || !art || !deck) return;
		const share = Number(getComputedStyle(layer).getPropertyValue('--sfh-deck-width').replace('%', '')) / 100 || 0.74;
		// the bar's own width, not the deck's: the deck is sized from the art, so measuring it
		// would just feed the art's width back into itself
		const bar = document.getElementById('hotbar')?.scrollWidth;
		if (!bar) return;
		layer.style.width = `${Math.round(Math.min(1180, Math.max(420, bar / share)))}px`;
	}

	/** Put Foundry's furniture back as we found it. */
	static unmount() {
		const bottom = document.getElementById('ui-bottom');
		const hotbar = document.getElementById('hotbar');
		if (hotbar && bottom) {
			hotbar.style.removeProperty('--hotbar-size');
			hotbar.classList.add('faded-ui');
			bottom.append(hotbar);
		}
		document.getElementById(EL.device)?.remove();
		for (const k of ['sfhDevice', 'sfhGrid', 'sfhChat', 'sfhPower', 'sfhHidden', 'sfhSuspended']) delete document.body.dataset[k];
	}

	/** Rebuild for a new device or a changed setting, keeping the power state. */
	static refresh() {
		const layer = document.getElementById(EL.device);
		const hotbar = document.getElementById('hotbar');
		// the art belongs to one device, so drop it and let mount() draw the right one
		if (layer && hotbar) {
			document.getElementById('ui-bottom')?.append(hotbar);
			layer.remove();
		}
		this.mount();
	}

	static #syncPowerKey(deck, device) {
		const existing = document.getElementById(EL.power);
		if (device.switch === 'band') return existing?.remove();
		if (existing) return deck.prepend(existing);
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.id = EL.power;
		btn.className = 'sfh-power';
		btn.innerHTML = '<i class="fa-solid fa-power-off"></i>';
		btn.setAttribute('aria-pressed', String(this.#power));
		btn.setAttribute('data-tooltip', game.i18n.localize('SFH.Power.Toggle'));
		deck.prepend(btn);
	}

	/** The way back from hidden. Always there; styles/device.css shows it only while hidden. */
	static #syncRestoreKey(deck) {
		const existing = document.getElementById(EL.restore);
		if (existing) return deck.prepend(existing);
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.id = EL.restore;
		btn.className = 'sfh-power';
		btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
		const label = game.i18n.localize('SFH.Hide.Restore');
		const key = hideKeyLabel();
		btn.setAttribute('aria-label', label);
		btn.setAttribute('data-tooltip', key ? `${label} (${key})` : label);
		deck.prepend(btn);
	}

	/* -------------------------------------------- */
	/*  Hiding                                       */
	/* -------------------------------------------- */

	/**
	 * Clear the HUD off the screen without switching it off, for small monitors: the device's
	 * art, the projection and the beam go, and the projection comes back on the same tab and
	 * scroll position. Foundry's macro bar stays, docked plainly, with a key on it that
	 * brings the rest back — a hidden HUD must never be a lost one.
	 */
	static setHidden(on) {
		on = !!on;
		if (on === this.#hidden) return;
		this.#hidden = on;
		document.body.dataset.sfhHidden = on ? 'on' : 'off';
		if (on && !this.#told) {
			// once a session is enough to learn where the way back is
			this.#told = true;
			const key = hideKeyLabel();
			ui.notifications.info(key
				? game.i18n.format('SFH.Hide.Notice', { key })
				: game.i18n.localize('SFH.Hide.NoticeUnbound'));
		}
		// nothing measured right while it was hidden
		if (!on) requestAnimationFrame(() => this.fit());
		Hooks.callAll('sfhHidden', on);
	}

	static toggleHidden() {
		this.setHidden(!this.#hidden);
	}

	static get suspended() {
		return this.#suspended.size > 0;
	}

	/**
	 * Clear the HUD for as long as something needs the canvas. It looks the same as hiding but
	 * is kept apart from it: the player did not ask for this, so there is no notice and no
	 * restore key, and a HUD they hid themselves stays hidden afterwards.
	 * @param {*} token  Handed back to resume(), so overlapping requests each count.
	 */
	static suspend(token) {
		this.#suspended.add(token);
		document.body.dataset.sfhSuspended = '';
	}

	static resume(token) {
		this.#suspended.delete(token);
		if (!this.#suspended.size) this.#unsuspend();
	}

	static resumeAll() {
		this.#suspended.clear();
		this.#unsuspend();
	}

	static #unsuspend() {
		if (!('sfhSuspended' in document.body.dataset)) return;
		delete document.body.dataset.sfhSuspended;
		if (this.#hidden) return;
		// nothing measured right while it was clear
		requestAnimationFrame(() => this.fit());
		Hooks.callAll('sfhHidden', false);
	}

	/* -------------------------------------------- */
	/*  Power                                        */
	/* -------------------------------------------- */

	/**
	 * Raise or lower the projection.
	 * @param {boolean} on
	 * @param {object} [options]
	 * @param {boolean} [options.silent]  Skip the sequence and switch straight over.
	 */
	static setPower(on, { silent = false } = {}) {
		on = !!on;
		// raising the projection while hidden would raise it out of sight
		if (on && this.#hidden) this.setHidden(false);
		if (on === this.#power) return;
		this.#power = on;
		document.body.dataset.sfhPower = on ? 'on' : 'off';
		document.getElementById(EL.power)?.setAttribute('aria-pressed', String(on));
		// The projection is raised by whoever listens to this hook, and only then is there
		// anything to animate — so the sequence is played from there, not here.
		Hooks.callAll('sfhPower', on, { sequence: !silent && setting(S.sequences) });
	}

	static toggle() {
		this.setPower(!this.#power);
	}

	/**
	 * Play a device's activation or shutdown sequence. The classes drive every animation
	 * in styles/device.css and styles/projection.css, so the device art and the projection
	 * stay in step.
	 */
	static playSequence(kind) {
		const targets = [document.getElementById(EL.device), document.getElementById(EL.projection)].filter(Boolean);
		if (!targets.length) return;
		clearTimeout(this.#seqTimer);
		for (const el of targets) {
			el.classList.remove('sfh-seq-on', 'sfh-seq-off');
			void el.offsetWidth; // restart the animations
			el.classList.add(kind === 'on' ? 'sfh-seq-on' : 'sfh-seq-off');
		}
		this.#seqTimer = setTimeout(() => {
			for (const el of targets) el.classList.remove('sfh-seq-on', 'sfh-seq-off');
		}, kind === 'on' ? SEQ.on : SEQ.off);
	}

	/* -------------------------------------------- */
	/*  Listeners                                    */
	/* -------------------------------------------- */

	static #bind() {
		if (this.#bound) return;
		this.#bound = true;

		// The bar changes width when a page control appears or the key size changes, and it
		// is rendered after we first mount, so keep the art in step with it.
		const hotbar = document.getElementById('hotbar');
		if (hotbar && globalThis.ResizeObserver) new ResizeObserver(() => this.fit()).observe(hotbar);
		addEventListener('resize', () => this.fit());

		// One delegated listener on the body: the device layer is rebuilt on every device
		// change, so binding to its children would go stale.
		document.addEventListener('click', (event) => {
			if (event.target.closest(`#${EL.restore}`)) return this.setHidden(false);
			if (event.target.closest(`#${EL.power}`)) return this.toggle();
			if (event.target.closest('#sfh-band')) return this.toggle();
		});
		document.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ') return;
			if (!event.target.closest?.('#sfh-band')) return;
			event.preventDefault();
			this.toggle();
		});
	}
}
