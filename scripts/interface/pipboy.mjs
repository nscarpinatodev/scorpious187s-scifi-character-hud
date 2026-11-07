/**
 * Fallout 2d20: the device brings up the Pip-Boy.
 *
 * The HUD draws no projection for a system it has no adapter for. In a Fallout world with
 * Scorpious187's Pip-Boy active, the device's switch opens the Pip-Boy instead, for the same
 * character the projection would have shown: a player's own character, and for the GM the token
 * selected on the canvas. Everything else the HUD does (the interface, chat, carousel and scene
 * bar) is the same in any system.
 */
import { DeviceChrome } from '../device/chrome.mjs';
import { Projection } from '../projection/projection.mjs';
import { getAdapter } from '../adapters/index.mjs';

export const PIPBOY = 'scorpious187s-pip-boy';

/** The actor types the Pip-Boy is a sheet for. */
const TYPES = ['character', 'robot'];

export class PipBoy {
	/** The Pip-Boy this device brought up, while it is open. */
	static #app = null;

	/** Closing it ourselves, to switch characters: the device stays on. */
	static #switching = false;

	static #api() {
		const mod = game.modules?.get(PIPBOY);
		return mod?.active && typeof mod.api?.open === 'function' ? mod.api : null;
	}

	/** Whether the Pip-Boy takes the projection's place: a system the HUD has no sheet for, and the Pip-Boy there. */
	static handles() {
		return !getAdapter() && !!this.#api();
	}

	static get open() {
		return !!this.#app;
	}

	/**
	 * Whose Pip-Boy: a player's own character, never anyone else's; for the GM, the last
	 * selected token's, then the one already up, then their own.
	 */
	static target() {
		if (!game.user.isGM) {
			const own = Projection.actor();
			return TYPES.includes(own?.type) ? own : null;
		}
		const picked = (globalThis.canvas?.tokens?.controlled ?? []).map((t) => t.actor).filter((a) => TYPES.includes(a?.type));
		const current = this.#app?.document ?? this.#app?.actor ?? null;
		const assigned = game.user.character;
		return picked.at(-1) ?? current ?? (TYPES.includes(assigned?.type) ? assigned : null);
	}

	/**
	 * The device's switch, when the Pip-Boy takes the projection's place: on brings it up, off
	 * puts it away. The Pip-Boy has its own boot, so only the device plays its sequence.
	 * @returns {boolean} whether the Pip-Boy took the switch
	 */
	static power(on, { sequence } = {}) {
		if (!this.handles()) return false;
		if (!on) {
			if (sequence) DeviceChrome.playSequence('off');
			this.hide();
			return true;
		}
		if (!this.show()) DeviceChrome.setPower(false, { silent: true });
		else if (sequence) DeviceChrome.playSequence('on');
		return true;
	}

	/** Bring it up. False when there is nobody to bring it up for. */
	static show(actor = this.target()) {
		if (!actor) {
			ui.notifications.warn(game.i18n.localize(game.user.isGM ? 'SFH.NoCharacterGM' : 'SFH.NoCharacter'));
			return false;
		}
		// The Pip-Boy's open can fail part way, after its window has started to draw (bringing a
		// sheet to the front before it has rendered): the window comes up all the same, so it is
		// found and kept, and the device can put it away again.
		let app = null;
		try {
			app = this.#api()?.open(actor) ?? null;
		} catch (err) {
			console.error(err);
		}
		this.#app = app ?? this.#windowFor(actor);
		return !!this.#app;
	}

	/** The Pip-Boy window for an actor, open or opening: its own, or the actor's sheet when that is the Pip-Boy. */
	static #windowFor(actor) {
		const isPipBoy = (app) => app?.constructor?.name === 'PipBoyApp';
		const open = [...(foundry.applications?.instances?.values() ?? [])].find((app) => isPipBoy(app) && app.document === actor);
		return open ?? (isPipBoy(actor.sheet) ? actor.sheet : null);
	}

	/** Put it away, drawn or still drawing. */
	static async hide() {
		const app = this.#app;
		this.#app = null;
		const CLOSED = foundry.applications?.api?.ApplicationV2?.RENDER_STATES?.CLOSED;
		if (app && (app.rendered || (CLOSED !== undefined && app.state > CLOSED))) await app.close();
	}

	/** The GM selected someone else: their Pip-Boy takes over, as the projection would. */
	static async follow() {
		if (!this.#app || !game.user.isGM) return;
		const next = this.target();
		const current = this.#app.document ?? this.#app.actor;
		if (!next || next === current) return;
		this.#switching = true;
		try {
			await this.hide();
			this.show(next);
		} finally {
			this.#switching = false;
		}
	}

	/** The Pip-Boy was closed from its own window: the device goes off with it. */
	static closed(app) {
		if (this.#switching || app !== this.#app) return;
		this.#app = null;
		if (DeviceChrome.power) DeviceChrome.setPower(false, { silent: true });
	}
}
