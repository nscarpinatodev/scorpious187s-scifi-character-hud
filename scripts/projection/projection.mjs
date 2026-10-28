import { EL, MOD, SEQ, S } from '../constants.mjs';
import { currentDevice, setting } from '../settings.mjs';
import { layout, dossierHeight, BOARD, EVA_CAP, SEQ_ORDER } from './layout.mjs';
import { pos, esc } from './helpers.mjs';
import { renderIdentity, renderVitals, renderDefenses, renderEffectsSlot, renderExtras, renderReadout, renderNav } from './panels.mjs';
import { getAdapter } from '../adapters/index.mjs';
import { readDossier } from './dossier.mjs';
import { ornBack, ornDev, evaReadouts } from './ornaments.mjs';

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
	static #renders = 0;
	/** What the last fit() measured and decided. */
	static lastFit = null;

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

		/*
		 * What is actually on screen down each side. Foundry's region boxes are mostly air:
		 * #ui-left is half the window wide and its scene navigation stretches to fill it, though
		 * the scene buttons take only the top of it. Foundry turns pointer events off on those
		 * containers and back on for the panels in them, so the panels are what the projection
		 * keeps clear of — and only the ones beside it, not a scene list high above it.
		 */
		const panels = (root) => {
			const out = [];
			const walk = (node) => {
				for (const child of node.children) {
					const r = rect(child);
					if (!shown(r)) continue;
					if (getComputedStyle(child).pointerEvents !== 'none') out.push({ r, id: child.id || child.className });
					else walk(child);
				}
			};
			if (root) walk(root);
			return out;
		};
		const leftPanels = panels(document.getElementById('ui-left'));
		const sidebar = rect(document.getElementById('sidebar'));
		const rightPanels = shown(sidebar) ? [{ r: sidebar, id: 'sidebar' }] : [];
		const top = spread('ui-top', (r) => r.bottom);
		const topEdge = top === null ? gap : top + gap;
		const art = document.querySelector(`#${EL.device} svg.sfh-art`);
		/*
		 * The art box reaches above the plate to hold the emitter's glow, so measuring it
		 * would float the sheet. The plate itself is what the projection stands on.
		 */
		const plate = rect(document.getElementById('sfh-arm'));
		const device = rect(document.getElementById(EL.device)) ?? rect(document.getElementById('hotbar'));
		const foot = art && shown(plate) ? plate : device;
		const bottomEdge = shown(foot) ? innerHeight - foot.top + (art ? 0 : gap) : gap;

		/*
		 * Centred on the device, so the projection stays in line with what raised it. Foundry
		 * centres the macro bar between the controls and the sidebar, not on the window, so
		 * centring on the window would set the two off from each other and waste the room on
		 * the wider side.
		 */
		const centre = shown(foot) ? foot.left + foot.width / 2 : innerWidth / 2;
		const height = Math.max(320, innerHeight - topEdge - bottomEdge);
		const deviceId = currentDevice();
		const board = BOARD[deviceId] ?? BOARD.omni;
		const L = layout(deviceId);
		const standsAt = innerHeight - bottomEdge;

		/*
		 * The room beside a board of a given height: it stands on the device, so it spans from
		 * there up by its height, and only panels in that band are in its way. The taller the
		 * board, the more it can meet, so the largest scale that clears is found by halving.
		 */
		const clearance = (boardHeight) => {
			const beside = ({ r }) => r.bottom > standsAt - boardHeight && r.top < standsAt;
			const leftBy = leftPanels.filter(beside).sort((a, b) => b.r.right - a.r.right)[0];
			const rightBy = rightPanels.filter(beside).sort((a, b) => a.r.left - b.r.left)[0];
			const leftEdge = leftBy ? leftBy.r.right + gap : gap;
			const rightEdge = rightBy ? rightBy.r.left - gap : innerWidth - gap;
			return { width: Math.max(0, Math.min(centre - leftEdge, rightEdge - centre) * 2), leftEdge, rightEdge, leftBy, rightBy };
		};
		const fits = (s) => clearance(s * board.h).width >= s * board.w;
		let lo = 0.2;
		let hi = height / board.h;
		if (fits(hi)) lo = hi;
		else for (let i = 0; i < 16; i++) {
			const mid = (lo + hi) / 2;
			if (fits(mid)) lo = mid;
			else hi = mid;
		}
		const room = lo;

		/*
		 * With a device at the foot of the screen the projection is tied to it: the main panel
		 * comes out exactly as wide as the plate below, so the two read as one machine. Without
		 * one there is nothing to match, and the size setting decides how much of the free room
		 * it takes — 55% by default, so it sits above the device instead of swallowing the map.
		 */
		const fitsArm = art ? (art.getBoundingClientRect().width || board.w) / L.projection[2] : null;
		const share = Math.max(0.2, Math.min(1, (setting(S.projScale) ?? 55) / 100));
		const scale = art ? Math.min(room, fitsArm) : room * share;
		const clear = clearance(scale * board.h);
		// the layer is as wide as what it draws, so it never reaches over the furniture beside it
		const width = scale * board.w;

		// what decided the size, for debug(): measured in Foundry, not assumed
		this.lastFit = {
			viewport: [innerWidth, innerHeight],
			standsAt: Math.round(standsAt),
			room: { scale: +room.toFixed(3), height: Math.round(height), byHeight: +(height / board.h).toFixed(3) },
			fitsArm: fitsArm && +fitsArm.toFixed(3),
			share: art ? 'not used (omni-tool follows the arm)' : share,
			scale: +scale.toFixed(3),
			limitedBy: art && scale >= fitsArm - 0.001 ? 'arm'
				: !art && share < 1 ? 'size setting'
				: room >= height / board.h - 0.001 ? 'height'
				: `width: ${clear.leftBy?.id ?? 'window'} on the left, ${clear.rightBy?.id ?? 'window'} on the right`,
			clear: { left: Math.round(clear.leftEdge), right: Math.round(clear.rightEdge) },
			panels: { left: leftPanels.map((p) => `${p.id} ${Math.round(p.r.left)}–${Math.round(p.r.right)} × ${Math.round(p.r.top)}–${Math.round(p.r.bottom)}`) },
		};

		el.style.setProperty('--sfh-proj-left', `${Math.round(centre)}px`);
		el.style.setProperty('--sfh-proj-width', `${Math.round(width)}px`);
		el.style.setProperty('--sfh-proj-height', `${Math.round(height)}px`);
		el.style.setProperty('--sfh-proj-bottom', `${Math.round(bottomEdge)}px`);
		const boardEl = el.querySelector('.sfh-board');
		if (boardEl) {
			boardEl.style.width = `${board.w}px`;
			boardEl.style.height = `${board.h}px`;
			boardEl.style.transform = `translateX(-50%) scale(${scale})`;
			// The board is scaled, so a pattern drawn in board pixels is resampled into
			// uneven bands. Pitch the scan so it lands on whole screen pixels instead.
			const device2 = window.devicePixelRatio || 1;
			const px = 1 / scale;
			boardEl.style.setProperty('--scanline', `${(px * (device2 >= 2 ? 0.5 : 1)).toFixed(3)}px`);
			boardEl.style.setProperty('--scanpitch', `${(px * 3).toFixed(3)}px`);
		}
		this.#beam();
	}

	/**
	 * The cone of light between the emitter band and the projection.
	 *
	 * In the mock-up both were on one board and the beam was part of it. Here the arm is
	 * interface and the projection is a layer over the canvas, so the beam has to bridge
	 * them: it is drawn from the band's edges up to the projection's bottom corners.
	 */
	static #beam() {
		const band = document.querySelector('#sfh-band')?.getBoundingClientRect();
		// the light lands on the main panel, as it does in the mock-up, not on the whole
		// projection — the side columns are lit by it, not part of it
		const lit = this.element?.querySelector('[data-slot="projection"]')?.getBoundingClientRect();
		let beam = document.getElementById(EL.beam);
		if (!band || !band.width || !lit?.width || !this.#open) {
			beam?.remove();
			return;
		}
		if (!beam) {
			beam = document.createElement('div');
			beam.id = EL.beam;
			(document.getElementById('interface') ?? document.body).append(beam);
		}
		const top = lit.bottom;
		const bottom = band.top + band.height * 0.45;
		beam.style.top = `${Math.round(top)}px`;
		beam.style.height = `${Math.max(0, Math.round(bottom - top))}px`;
		beam.style.clipPath = `polygon(${Math.round(lit.left)}px 0, ${Math.round(lit.right)}px 0,`
			+ ` ${Math.round(band.right - band.width * 0.15)}px 100%, ${Math.round(band.left + band.width * 0.15)}px 100%)`;
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
		// visible first: a hidden element measures as nothing, and the beam is built from
		// the projection's own rectangle
		this.element.classList.add('sfh-visible');
		this.fit();
		return true;
	}

	static async close() {
		this.#open = false;
		this.element?.classList.remove('sfh-visible');
		document.getElementById(EL.beam)?.remove();
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
		// the dossier is other modules' data: if reading it fails, lose the panel, not the projection
		try {
			c.extras = readDossier(actor);
		} catch (err) {
			console.warn(`${MOD} | the Mass Effect dossier could not be read, so it is not shown`, err);
			c.extras = null;
		}
		const device = currentDevice();
		const extras = !!c.extras;
		const L = layout(device, dossierHeight(device, c.extras));
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
		const key = `${actor.id}:${tab.id}`;
		/*
		 * A tab body is markup, or a promise of it when the system only gives its data
		 * asynchronously. While one is pending the tab keeps what it showed last, so an update
		 * to the actor does not blank it.
		 */
		const body = adapter.tabBody(actor, tab.id);
		const pending = typeof body?.then === 'function';
		const holding = pending
			? (scrolled?.key === key ? previous.innerHTML : '<p class="dimc">Reading…</p>')
			: body;
		const token = ++this.#renders;
		const projection = `<section class="slot pnl proj" data-slot="projection" style="${pos(L.projection)}" aria-label="${esc(tab.label)}">
			<div class="proj-h"><span class="proj-t">${esc(tab.label)}</span><span class="src">${esc(game.system.id)} · ${esc(tab.id)}</span></div>
			<div class="proj-b scroll" data-key="${esc(key)}">${holding}</div>
			<div class="scanfx"></div></section>`;

		// the wrist unit's panels sit inside its case rather than flush to the board edge
		const inset = device === 'wrist';
		stage.innerHTML = `<div class="ornlayer">${ornBack(device)}</div>
		<div class="foldwrap">
			<div class="ornlayer">${ornDev(device)}</div>
			<div class="sweep"></div><div class="flare"></div>
			${inset ? '<div class="sfh-inset">' : ''}
			${eva ? evaReadouts(c) : ''}
			${panel('identity', L.identity, renderIdentity(c, device), 'ident')}
			${panel('vitals', L.vitals, renderVitals(c))}
			${panel('defenses', L.defenses, renderDefenses(c, device), eva ? '' : 'pad')}
			${panel('effects', L.effects, renderEffectsSlot(c))}
			${extras ? panel('extras', L.extras, renderExtras(c)) : ''}
			${eva || device === 'wrist' ? '<div class="scanfx"></div>' : ''}
			${panel('readout', L.readout, `<div class="ro scroll" id="sfh-readout" aria-live="polite" style="display:flex;flex-direction:column;gap:8px;flex:1">${renderReadout(this.#entry(actor))}</div>`)}
			${projection}
			${renderNav(c, device, L, this.#tab)}
			${inset ? '</div>' : ''}
		</div>`;

		this.#stagger(stage);
		const restore = () => {
			const next = stage.querySelector('.proj-b');
			if (scrolled && next && next.dataset.key === scrolled.key) next.scrollTop = scrolled.top;
		};
		restore();
		if (!pending) return;

		// only the newest render may fill the tab: an older promise can resolve after it
		body.then((html) => {
			const next = stage.querySelector('.proj-b');
			if (token !== this.#renders || next?.dataset.key !== key) return;
			next.innerHTML = html;
			restore();
		}, (err) => {
			console.error(`${MOD} | the "${tab.id}" tab could not be read`, err);
			const next = stage.querySelector('.proj-b');
			if (token === this.#renders && next) next.innerHTML = '<p class="dimc">This tab could not be read. See the console for details.</p>';
		});
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
			if (action === 'menu-close') return target.closest('.sfh-menu')?.remove();
			if (action === 'settings') return game.settings.sheet.render(true);

			// everything else belongs to the game system
			const adapter = getAdapter();
			const actor = this.actor();
			if (!adapter || !actor) return;

			// Heal and Damage take their amount from the box beside them.
			let value = key;
			if (action === 'heal' || action === 'damage') {
				const box = target.closest('.sfh-hp')?.querySelector('[data-amount]');
				value = Math.abs(Number(box?.value) || 0);
				if (!value) return box?.focus();
				if (box) box.value = '';
			}

			try {
				await adapter.act(actor, action, value, event);
			} catch (err) {
				console.error(`${MOD} | "${action}" failed`, err);
				ui.notifications.error(game.i18n.format('SFH.ActionFailed', { action }));
			}
		});

		// typed values commit on Enter or when the field is left
		el.addEventListener('change', async (event) => {
			const adapter = getAdapter();
			const actor = this.actor();
			if (!adapter || !actor) return;

			// a picker hands its choice to the adapter; the new chip arrives with the actor's update
			const pick = event.target.closest('[data-pick]');
			if (pick) {
				const action = { condition: 'addCondition' }[pick.dataset.pick];
				if (!action || !pick.value) return;
				try {
					await adapter.act(actor, action, pick.value, event);
				} catch (err) {
					console.error(`${MOD} | "${action}" failed`, err);
					ui.notifications.error(game.i18n.format('SFH.ActionFailed', { action }));
				}
				return this.render();
			}

			const field = event.target.closest('[data-commit]');
			if (!field) return;
			const value = Number(field.value);
			if (!Number.isFinite(value)) return this.render();
			const action = { hp: 'setHp', temp: 'setTemp', max: 'setMax' }[field.dataset.commit];
			if (!action) return;
			try {
				await adapter.act(actor, action, value, event);
			} catch (err) {
				console.error(`${MOD} | "${action}" failed`, err);
				this.render();
			}
		});
		el.addEventListener('keydown', (event) => {
			if (event.key === 'Enter' && event.target.matches('[data-commit],[data-amount]')) event.target.blur();
			if (event.key === 'Escape') {
				el.querySelector('.sfh-menu')?.remove();
				this.render();
			}
		});

		// right-click a value that has more to it than one number
		el.addEventListener('contextmenu', (event) => {
			const host = event.target.closest('[data-menu="hp"]');
			if (!host) return;
			event.preventDefault();
			el.querySelector('.sfh-menu')?.remove();
			const c = getAdapter()?.read(this.actor());
			if (!c) return;
			const menu = document.createElement('div');
			menu.className = 'sfh-menu';
			menu.innerHTML = `
				<label>Hit points<input class="sfh-in mono" type="number" value="${c.hp.value}" data-commit="hp" autofocus></label>
				<label>Maximum<input class="sfh-in mono" type="number" value="${c.hp.max}" data-commit="max"></label>
				<label>Temporary<input class="sfh-in mono" type="number" value="${c.hp.temp}" data-commit="temp"></label>
				<button type="button" class="b sm" data-act="menu-close" data-k="">Close</button>`;
			host.append(menu);
			menu.querySelector('input')?.focus();
		});

		// clicking away closes the editor
		document.addEventListener('pointerdown', (event) => {
			const menu = el.querySelector('.sfh-menu');
			if (menu && !menu.contains(event.target)) menu.remove();
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
