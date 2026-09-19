import { EL } from '../constants.mjs';
import { currentDevice } from '../settings.mjs';

/**
 * The projection: the character sheet raised over the canvas by the device's switch.
 *
 * The frame, the panels around it and the power sequences are ours. What fills the tab
 * body is the **system's own sheet element**, moved into the frame — the same node, with
 * the same listeners, so every roll, drag and tab is still the system's code. Moving a
 * node does not detach its listeners, and neither application generation re-inserts its
 * element after the first render, so it stays where we put it.
 *
 * Geometry follows the mock-up's rule: centred on the window, never reaching under the
 * interface. The free area is measured from Foundry's own regions rather than guessed,
 * so it holds at any UI scale, sidebar width or window size.
 */
export class Projection {
	static #sheet = null;      // the system sheet we borrowed
	static #home = null;       // where its element came from, to put it back
	static #open = false;
	static #fitPending = false;

	static get isOpen() {
		return this.#open;
	}

	/* -------------------------------------------- */
	/*  The layer                                    */
	/* -------------------------------------------- */

	static get element() {
		return document.getElementById(EL.projection);
	}

	static #build() {
		let el = this.element;
		if (el) return el;
		el = document.createElement('div');
		el.id = EL.projection;
		el.innerHTML = `
			<div class="sfh-frame">
				<div class="sfh-screen">
					<div class="sfh-body" aria-live="polite"></div>
				</div>
			</div>`;
		(document.getElementById('interface') ?? document.body).append(el);
		return el;
	}

	/**
	 * Size the projection to the space the interface leaves free.
	 *
	 * Measured, not assumed: the sidebar can be collapsed or resized, the controls rail
	 * changes width with `--control-columns`, and the device at the foot of the screen is
	 * as tall as the user's key size makes it.
	 */
	static fit() {
		const el = this.element;
		if (!el) return;
		const gap = 12;
		const rect = (node) => node?.getBoundingClientRect();
		const shown = (r) => !!r && r.width > 0 && r.height > 0;

		// A region is as wide as the columns inside it, not as wide as its own box: #ui-left
		// spans half the window but only its columns are drawn on.
		const spread = (id, pick) => {
			const kids = [...(document.getElementById(id)?.children ?? [])].map(rect).filter(shown);
			return kids.length ? Math.max(...kids.map(pick)) : null;
		};

		const left = spread('ui-left', (r) => r.right);
		const leftEdge = left === null ? gap : left + gap;

		const sidebar = rect(document.getElementById('sidebar'));
		const rightEdge = shown(sidebar) ? innerWidth - sidebar.left + gap : gap;

		const top = spread('ui-top', (r) => r.bottom);
		const topEdge = top === null ? gap : top + gap;

		// the device at the foot of the screen, or the macro bar when it draws nothing
		const device = rect(document.getElementById(EL.device)) ?? rect(document.getElementById('hotbar'));
		const bottomEdge = shown(device) ? innerHeight - device.top + gap : gap;

		// centred on the window, so the projection stays in line with the device below it
		const half = Math.max(240, Math.min(innerWidth / 2 - leftEdge, innerWidth / 2 - rightEdge));
		const height = Math.max(200, innerHeight - topEdge - bottomEdge);
		el.style.setProperty('--sfh-proj-width', `${Math.round(half * 2)}px`);
		el.style.setProperty('--sfh-proj-height', `${Math.round(height)}px`);
		el.style.setProperty('--sfh-proj-bottom', `${Math.round(bottomEdge)}px`);
	}

	/** Follow a device change while the projection is up: frame, palette and size. */
	static syncDevice() {
		const el = this.element;
		if (!el) return;
		el.dataset.device = currentDevice();
		this.fit();
	}

	/** Re-fit on the next frame, coalescing bursts of layout changes. */
	static scheduleFit() {
		if (this.#fitPending) return;
		this.#fitPending = true;
		requestAnimationFrame(() => {
			this.#fitPending = false;
			this.fit();
		});
	}

	/* -------------------------------------------- */
	/*  Opening and closing                          */
	/* -------------------------------------------- */

	/** The character this user's projection shows. */
	static actor() {
		const assigned = game.user.character;
		if (assigned) return assigned;
		// no assigned character: the one they own, if there is exactly one
		const owned = game.actors.filter((a) => a.type !== 'loot' && a.isOwner && a.hasPlayerOwner);
		return owned.length === 1 ? owned[0] : null;
	}

	static async open() {
		const actor = this.actor();
		if (!actor) {
			ui.notifications.warn(game.i18n.localize('SFH.NoCharacter'));
			return false;
		}
		const el = this.#build();
		el.dataset.device = currentDevice();
		this.fit();
		el.classList.add('sfh-visible');
		this.#open = true;
		await this.#dock(actor);
		this.fit();
		return true;
	}

	static async close() {
		this.#open = false;
		this.element?.classList.remove('sfh-visible');
		await this.#undock();
	}

	/**
	 * Borrow the system's sheet.
	 *
	 * It is rendered the way Foundry always renders it, then its element is moved into the
	 * frame. `_insertElement` (v2) and `_injectHTML` (v1) both run on the first render only,
	 * so later re-renders rewrite the contents in place and leave it here.
	 */
	static async #dock(actor) {
		const sheet = actor.sheet;
		if (this.#sheet === sheet && this.#element(sheet)?.isConnected) return;
		await this.#undock();

		await sheet.render(true);
		const node = this.#element(sheet);
		if (!node) {
			console.warn('sfh | the system sheet rendered without an element; nothing to dock');
			return;
		}
		this.#sheet = sheet;
		this.#home = { parent: node.parentElement, next: node.nextSibling, style: node.getAttribute('style') };
		node.classList.add('sfh-docked');
		this.element.querySelector('.sfh-body').append(node);
	}

	/** Give the sheet back: the element returns where it was, then the sheet is closed. */
	static async #undock() {
		const sheet = this.#sheet;
		const node = sheet ? this.#element(sheet) : null;
		this.#sheet = null;
		if (!node) return;
		node.classList.remove('sfh-docked');
		if (this.#home?.parent?.isConnected) this.#home.parent.insertBefore(node, this.#home.next ?? null);
		if (this.#home?.style) node.setAttribute('style', this.#home.style);
		this.#home = null;
		await sheet.close();
	}

	/** Both application generations, one element. */
	static #element(app) {
		const el = app?.element;
		if (!el) return null;
		return el instanceof HTMLElement ? el : (el[0] ?? null);
	}
}
