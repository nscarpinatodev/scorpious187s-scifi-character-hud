import { EL, MOD, SEQ } from '../constants.mjs';
import { currentDevice } from '../settings.mjs';
import { layout, BOARD, EVA_CAP, SEQ_ORDER } from './layout.mjs';
import { pos, esc } from './helpers.mjs';
import { renderIdentity, renderVitals, renderDefenses, renderEffectsSlot, renderExtras, renderReadout, renderNav } from './panels.mjs';
import { getAdapter } from '../adapters/index.mjs';
import { readDossier } from './dossier.mjs';
import { ornBack, evaReadouts } from './ornaments.mjs';

/**
 * The projection: the character sheet the device raises over the canvas.
 *
 * It is the mock-up's own layout — the panels, the tab ring, the readout — drawn on the
 * board the design was signed off on and scaled to whatever room the interface leaves.
 * Every button carries a `data-act`, and one delegated listener hands each press to the
 * game system through its adapter. The projection shows the numbers; the system still does
 * the work.
 */
export class Projection {
	static #open = false;
	static #actor = null;
	static #tab = null;
	static #pinned = null;
	static #preview = null;
	static #bound = false;
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
		el.innerHTML = '<div class="sfh-board"><div class="sfh-stage"></div></div>';
		(document.getElementById('interface') ?? document.body).append(el);
		this.#bind();
		return el;
	}

	/**
	 * Fit the board into the space the interface leaves free.
	 *
	 * Measured, not assumed: the sidebar can be collapsed or resized, the controls rail
	 * changes width, and the device at the foot of the screen is as tall as the user's key
	 * size makes it. The board itself never changes shape — it is scaled — so the layout
	 * keeps the proportions it was designed with.
	 */
	static fit() {
		const el = this.element;
		if (!el) return;
		const gap = 12;
		const rect = (node) => node?.getBoundingClientRect();
		const shown = (r) => !!r && r.width > 0 && r.height > 0;
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
		const device = rect(document.getElementById(EL.device)) ?? rect(document.getElementById('hotbar'));
		const bottomEdge = shown(device) ? innerHeight - device.top + gap : gap;

		// centred on the window, so the projection stays in line with the device below it
		const width = Math.max(480, Math.min(innerWidth / 2 - leftEdge, innerWidth / 2 - rightEdge) * 2);
		const height = Math.max(320, innerHeight - topEdge - bottomEdge);
		const board = BOARD[currentDevice()] ?? BOARD.omni;
		const scale = Math.min(width / board.w, height / board.h);

		el.style.setProperty('--sfh-proj-width', `${Math.round(width)}px`);
		el.style.setProperty('--sfh-proj-height', `${Math.round(height)}px`);
		el.style.setProperty('--sfh-proj-bottom', `${Math.round(bottomEdge)}px`);
		const boardEl = el.querySelector('.sfh-board');
		if (boardEl) {
			boardEl.style.width = `${board.w}px`;
			boardEl.style.height = `${board.h}px`;
			boardEl.style.transform = `translateX(-50%) scale(${scale})`;
		}
	}

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
		if (this.#actor?.id && game.actors.get(this.#actor.id)) return this.#actor;
		const assigned = game.user.character;
		if (assigned) return assigned;
		const owned = game.actors.filter((a) => a.type === 'character' && a.isOwner && a.hasPlayerOwner);
		return owned.length === 1 ? owned[0] : null;
	}

	static async open(actor = null) {
		const target = actor ?? this.actor();
		if (!target) {
			ui.notifications.warn(game.i18n.localize('SFH.NoCharacter'));
			return false;
		}
		if (!getAdapter()) {
			ui.notifications.warn(game.i18n.format('SFH.NoAdapter', { system: game.system.id }));
			return false;
		}
		this.#actor = target;
		this.#build();
		this.#open = true;
		this.render();
		this.fit();
		this.element.classList.add('sfh-visible');
		return true;
	}

	static async close() {
		this.#open = false;
		this.element?.classList.remove('sfh-visible');
	}

	static syncDevice() {
		if (!this.#open) return;
		this.render();
		this.fit();
	}

	/** Redraw if the character the projection is showing changed. */
	static refreshFor(doc) {
		if (!this.#open) return;
		const actor = this.actor();
		if (!actor) return;
		const id = doc?.parent?.id ?? doc?.id;
		if (id && id !== actor.id) return;
		this.render();
	}

	/* -------------------------------------------- */
	/*  Rendering                                    */
	/* -------------------------------------------- */

	static render() {
		const el = this.element;
		const actor = this.actor();
		const adapter = getAdapter();
		if (!el || !actor || !adapter) return;

		const c = adapter.read(actor);
		c.extras = readDossier(actor);
		const device = currentDevice();
		const extras = !!c.extras;
		const L = layout(device, extras);
		const eva = device === 'gdi' || device === 'nod';
		this.#tab = c.tabs.some((t) => t.id === this.#tab) ? this.#tab : c.tabs[0].id;

		el.dataset.device = device;
		const stage = el.querySelector('.sfh-stage');
		stage.dataset.device = device;

		// keep the scroll position of the tab body across re-renders
		const previous = stage.querySelector('.proj-b');
		const scrolled = previous ? { key: previous.dataset.key, top: previous.scrollTop } : null;

		const panel = (name, rect, inner, cls = 'pad') => {
			if (!rect) return '';
			const tile = device === 'wrist' && ['identity', 'vitals', 'defenses', 'extras'].includes(name) ? 'tile' : '';
			const cap = eva && EVA_CAP[name];
			const inside = cap
				? `<div class="cap">${esc(cap)}</div><div class="slot-in pad" style="display:flex;flex-direction:column;gap:10px;flex:1;min-height:0;padding:10px 12px">${inner}</div>`
				: inner;
			return `<section class="slot pnl ${tile} ${cap ? '' : cls}" data-slot="${name}" style="${pos(rect)}" aria-label="${esc(name)}">${inside}</section>`;
		};

		const tab = c.tabs.find((t) => t.id === this.#tab);
		const projection = `<section class="slot pnl proj" data-slot="projection" style="${pos(L.projection)}" aria-label="${esc(tab.label)}">
			<div class="proj-h"><span class="proj-t">${esc(tab.label)}</span><span class="src">${esc(game.system.id)} · ${esc(tab.id)}</span></div>
			<div class="proj-b scroll" data-key="${esc(`${actor.id}:${tab.id}`)}">${adapter.tabBody(actor, tab.id)}</div>
			<div class="scanfx"></div></section>`;

		stage.innerHTML = `<div class="ornlayer">${ornBack(device)}</div>
		<div class="foldwrap">
			<div class="sweep"></div><div class="flare"></div>
			${eva ? evaReadouts(c) : ''}
			${panel('identity', L.identity, renderIdentity(c, device), 'ident')}
			${panel('vitals', L.vitals, renderVitals(c))}
			${panel('defenses', L.defenses, renderDefenses(c, device), eva ? '' : 'pad')}
			${panel('effects', L.effects, renderEffectsSlot(c))}
			${extras ? panel('extras', L.extras, renderExtras(c)) : ''}
			${panel('readout', L.readout, `<div class="ro scroll" id="sfh-readout" aria-live="polite" style="display:flex;flex-direction:column;gap:8px;flex:1">${renderReadout(this.#entry(actor))}</div>`)}
			${projection}
			${renderNav(c, device, L, this.#tab)}
		</div>`;

		this.#stagger(stage);
		if (scrolled) {
			const next = stage.querySelector('.proj-b');
			if (next && next.dataset.key === scrolled.key) next.scrollTop = scrolled.top;
		}
	}

	/** Panels rise in order, so the projection assembles rather than appearing. */
	static #stagger(stage) {
		for (const el of stage.querySelectorAll('[data-slot]')) {
			const i = SEQ_ORDER[el.dataset.slot] ?? 7;
			el.style.setProperty('--d', `${i * 55}ms`);
			el.style.setProperty('--dr', `${(7 - i) * 34}ms`);
		}
		stage.querySelectorAll('.navb').forEach((el, i) => {
			el.style.setProperty('--d', `${200 + i * 26}ms`);
			el.style.setProperty('--dr', `${i * 14}ms`);
		});
	}

	/** The mock-up's sequences are written against classes on the stage element. */
	static playSequence(kind) {
		const stage = this.element?.querySelector('.sfh-stage');
		if (!stage) return;
		stage.classList.remove('sfh-seq-on', 'sfh-seq-off');
		void stage.offsetWidth; // restart the animations
		stage.classList.add(kind === 'on' ? 'sfh-seq-on' : 'sfh-seq-off');
		setTimeout(() => stage.classList.remove('sfh-seq-on', 'sfh-seq-off'), kind === 'on' ? SEQ.on : SEQ.off);
	}

	/* -------------------------------------------- */
	/*  The readout                                  */
	/* -------------------------------------------- */

	/** What the readout describes: whatever is hovered, else whatever is pinned. */
	static #entry(actor) {
		const key = this.#preview ?? this.#pinned;
		if (!key) return null;
		const [kind, id] = key.split(':');
		if (kind === 'item' || kind === 'effect') {
			const doc = actor.items.get(id) ?? actor.effects.get(id);
			if (!doc) return null;
			const text = String(doc.system?.description?.value ?? doc.description ?? '')
				.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
			return {
				name: doc.name,
				kind: doc.type ?? 'Effect',
				traits: doc.system?.traits?.value ?? [],
				text: text.slice(0, 700),
			};
		}
		if (kind === 'skill') return { name: id, kind: 'Skill' };
		if (kind === 'def') return { name: id, kind: 'Statistic' };
		if (kind === 'pr') return { name: id === 'paragon' ? 'Paragon' : 'Renegade', kind: 'Mass Effect · Tracker' };
		if (kind === 'shield') return { name: 'Kinetic Shield', kind: 'Mass Effect · Shields' };
		return null;
	}

	static #refreshReadout() {
		const el = document.getElementById('sfh-readout');
		const actor = this.actor();
		if (el && actor) el.innerHTML = renderReadout(this.#entry(actor));
	}

	/* -------------------------------------------- */
	/*  Listeners                                    */
	/* -------------------------------------------- */

	static #bind() {
		if (this.#bound) return;
		this.#bound = true;
		const el = this.element;

		el.addEventListener('click', async (event) => {
			const target = event.target.closest('[data-act]');
			if (!target) return;
			event.preventDefault();
			const action = target.dataset.act;
			const key = target.dataset.k ?? '';

			// the projection's own controls
			if (action === 'tab') {
				this.#tab = key;
				return this.render();
			}
			if (action === 'pin') {
				this.#pinned = this.#pinned === key ? null : key;
				return this.#refreshReadout();
			}
			if (action === 'sheet') return this.actor()?.sheet?.render(true);
			if (action === 'settings') return game.settings.sheet.render(true);

			// everything else belongs to the game system
			const adapter = getAdapter();
			const actor = this.actor();
			if (!adapter || !actor) return;
			try {
				await adapter.act(actor, action, key, event);
			} catch (err) {
				console.error(`${MOD} | "${action}" failed`, err);
				ui.notifications.error(game.i18n.format('SFH.ActionFailed', { action }));
			}
		});

		// the readout follows the pointer, as it does in the mock-up
		el.addEventListener('mouseover', (event) => {
			const target = event.target.closest('[data-ro]');
			const key = target ? target.dataset.ro : null;
			if (key === this.#preview) return;
			this.#preview = key;
			this.#refreshReadout();
		});
		el.addEventListener('mouseleave', () => {
			this.#preview = null;
			this.#refreshReadout();
		});
		el.addEventListener('focusin', (event) => {
			const target = event.target.closest('[data-ro]');
			if (!target) return;
			this.#preview = target.dataset.ro;
			this.#refreshReadout();
		});
	}
}
