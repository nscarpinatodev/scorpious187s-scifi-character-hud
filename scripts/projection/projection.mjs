import { EL, MOD, SEQ, S } from '../constants.mjs';
import { currentDevice, setting } from '../settings.mjs';
import { layout, dossierHeight, BOARD, EVA_CAP, SEQ_ORDER } from './layout.mjs';
import { pos, esc } from './helpers.mjs';
import { renderIdentity, renderVitals, renderDefenses, renderEffectsSlot, renderExtras, renderReadout, renderNav, renderLatest } from './panels.mjs';
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
	/** The last roll each character made, for the strip over the main panel. */
	static #latest = new Map();
	/** The quick search: what was typed and found, which a re-render would otherwise wipe. */
	static #quick = { text: '', results: '', timer: null, token: 0 };
	/** What the readout describes: the last thing pointed at or clicked. */
	static #showing = null;
	/** The description showing there, which only comes asynchronously: a re-render reuses it. */
	static #described = { key: null, html: '' };
	static #descriptions = 0;
	/** The wait before a hovered item takes over the readout. */
	static #hover = null;
	static #bound = false;
	static #fitPending = false;
	static #renders = 0;
	/** A redraw held back while someone is typing in the main panel. */
	static #redrawLater = false;
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
		 * Centered on the device, so the projection stays in line with what raised it. Foundry
		 * centers the macro bar between the controls and the sidebar, not on the window, so
		 * centering on the window would set the two off from each other and waste the room on
		 * the wider side.
		 */
		const center = shown(foot) ? foot.left + foot.width / 2 : innerWidth / 2;
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
			return { width: Math.max(0, Math.min(center - leftEdge, rightEdge - center) * 2), leftEdge, rightEdge, leftBy, rightBy };
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
			share: art ? 'not used (the projection follows the plate)' : share,
			scale: +scale.toFixed(3),
			limitedBy: art && scale >= fitsArm - 0.001 ? 'arm'
				: !art && share < 1 ? 'size setting'
				: room >= height / board.h - 0.001 ? 'height'
				: `width: ${clear.leftBy?.id ?? 'window'} on the left, ${clear.rightBy?.id ?? 'window'} on the right`,
			clear: { left: Math.round(clear.leftEdge), right: Math.round(clear.rightEdge) },
			panels: { left: leftPanels.map((p) => `${p.id} ${Math.round(p.r.left)}–${Math.round(p.r.right)} × ${Math.round(p.r.top)}–${Math.round(p.r.bottom)}`) },
		};

		el.style.setProperty('--sfh-proj-left', `${Math.round(center)}px`);
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
		this.#finishEditing();
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
		this.#finishEditing();
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

	/**
	 * Is someone typing in the main panel? A redraw replaces the panel, so it would take the text
	 * from under them, and an open editor's text would be saved to nowhere. It waits instead.
	 */
	static get #editing() {
		const body = this.element?.querySelector('.proj-b');
		return !!body && (!!body.querySelector('prose-mirror[open]') || !!document.activeElement?.closest?.('.proj-b :is(input, textarea)[data-field]'));
	}

	/** Do the redraw that was waiting, once nobody is typing. */
	static #settle() {
		if (this.#redrawLater && !this.#editing) this.render();
	}

	/** An editor that just opened is taller than it was, and may have grown past the panel's edge. */
	static #revealEditor(editor) {
		const body = editor.closest('.proj-b');
		if (!body) return;
		const panel = body.getBoundingClientRect();
		const box = editor.getBoundingClientRect();
		// the projection is scaled, which rectangles see and scrolling does not
		const scale = panel.height / (body.offsetHeight || panel.height) || 1;
		if (box.top < panel.top) body.scrollTop -= (panel.top - box.top) / scale;
		else if (box.bottom > panel.bottom) body.scrollTop += Math.min(box.bottom - panel.bottom, box.top - panel.top) / scale;
	}

	/** Save what is being typed, as leaving the field or pressing the editor's save would. */
	static #finishEditing() {
		const el = this.element;
		if (!el) return;
		for (const editor of el.querySelectorAll('.proj-b prose-mirror[open]')) editor.save();
		if (document.activeElement?.closest?.('#sfh-projection .proj-b :is(input, textarea)[data-field]')) document.activeElement.blur();
	}

	static render() {
		const el = this.element;
		const actor = this.actor();
		const adapter = getAdapter();
		if (!el || !actor || !adapter) return;
		if (this.#editing) {
			this.#redrawLater = true;
			return;
		}
		this.#redrawLater = false;

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
		// the strip takes the top of the main panel's space, only once there is a roll to show
		const latest = this.#latest.get(actor.id) ?? null;
		const P = L.projection;
		const latestRect = latest ? [P[0], P[1], P[2], 38] : null;
		if (latest) L.projection = [P[0], P[1] + 44, P[2], P[3] - 44];
		const eva = device === 'gdi' || device === 'nod';
		this.#tab = c.tabs.some((t) => t.id === this.#tab) ? this.#tab : c.tabs[0].id;

		el.dataset.device = device;
		const stage = el.querySelector('.sfh-stage');
		stage.dataset.device = device;

		// keep the scroll position of the tab body across re-renders
		const previous = stage.querySelector('.proj-b');
		const scrolled = previous ? { key: previous.dataset.key, top: previous.scrollTop } : null;
		const readTo = document.getElementById('sfh-readout')?.scrollTop ?? 0;
		// the old markup is about to go, and the focus with it
		const quickHadFocus = document.activeElement?.matches?.('#sfh-projection [data-browse]');

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
			${latest ? panel('latest', latestRect, renderLatest(latest), 'sfh-latest') : ''}
			${projection}
			${renderNav(c, device, L, this.#tab)}
			${inset ? '</div>' : ''}
		</div>`;

		this.#stagger(stage);
		document.getElementById('sfh-readout')?.scrollTo({ top: readTo });
		this.#fillReadout();
		const restore = () => {
			this.#restoreQuick(quickHadFocus);
			const next = stage.querySelector('.proj-b');
			if (scrolled && next && next.dataset.key === scrolled.key) next.scrollTop = scrolled.top;
		};
		restore();
		if (!pending) return;

		// only the newest render may fill the tab: an older promise can resolve after it
		body.then((html) => {
			const next = stage.querySelector('.proj-b');
			if (token !== this.#renders || next?.dataset.key !== key) return;
			// someone started typing in what was held on the screen: this comes after they finish
			if (this.#editing) {
				this.#redrawLater = true;
				return;
			}
			next.innerHTML = html;
			restore();
		}, (err) => {
			console.error(`${MOD} | the "${tab.id}" tab could not be read`, err);
			const next = stage.querySelector('.proj-b');
			if (token === this.#renders && next) next.innerHTML = '<p class="dimc">This tab could not be read. See the console for details.</p>';
		});
	}

	/**
	 * Run the quick search a moment after typing stops. Only the newest search may fill the
	 * results: the first one has to wait for the compendiums to be read, and can finish last.
	 */
	static #quickSearch(text) {
		const quick = this.#quick;
		quick.text = text;
		clearTimeout(quick.timer);
		const token = ++quick.token;
		const show = (html) => {
			if (token !== quick.token) return;
			quick.results = html;
			const box = this.element?.querySelector('.sfh-results');
			if (box) box.innerHTML = html;
		};
		// the search engine ignores anything shorter
		if (text.trim().length < 2) return show('');
		quick.timer = setTimeout(async () => {
			const box = this.element?.querySelector('.sfh-results');
			if (box && !box.children.length) box.innerHTML = '<p class="dimc">Searching…</p>';
			try {
				show(await getAdapter()?.searchItems?.(text) ?? '');
			} catch (err) {
				console.error(`${MOD} | the quick search failed`, err);
				show('<p class="dimc">The search could not be run. See the console for details.</p>');
			}
		}, 200);
	}

	/** Put the quick search back after a re-render: adding an item is what causes one. */
	static #restoreQuick(hadFocus) {
		const input = this.element?.querySelector('[data-browse]');
		if (!input) return;
		input.value = this.#quick.text;
		const box = this.element.querySelector('.sfh-results');
		if (box) box.innerHTML = this.#quick.results;
		if (hadFocus) input.focus();
	}

	/** A new chat message. If it is a roll this user may see, it takes the strip. */
	static noteRoll(message) {
		const roll = getAdapter()?.readRoll?.(message);
		if (!roll) return;
		this.#latest.set(roll.actorId, roll);
		if (this.#open && this.actor()?.id === roll.actorId) this.render();
	}

	/** A deleted message cannot be followed up, so the strip lets go of it. */
	static forgetRoll(message) {
		for (const [actorId, roll] of this.#latest) {
			if (roll.messageId !== message.id) continue;
			this.#latest.delete(actorId);
			if (this.#open && this.actor()?.id === actorId) this.render();
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

	static #entry(actor) {
		const key = this.#showing;
		if (!key) return null;
		const own = getAdapter()?.readoutEntry?.(actor, key);
		if (own) return { ...own, html: this.#described.key === key ? this.#described.html : '' };
		const [kind, id] = key.split(':');
		if (kind === 'item' || kind === 'effect' || kind === 'strike') {
			const doc = this.#documentFor(actor, key);
			if (!doc) return null;
			return {
				name: doc.name,
				kind: doc.type ?? 'Effect',
				traits: getAdapter()?.readoutTraits?.(doc) ?? doc.system?.traits?.value ?? [],
				meta: getAdapter()?.readoutMeta?.(doc) ?? [],
				actions: getAdapter()?.readoutActions?.(doc, actor) ?? '',
				html: this.#described.key === key ? this.#described.html : '',
			};
		}
		if (kind === 'skill') return { name: id, kind: 'Skill' };
		if (kind === 'def') return { name: id, kind: 'Statistic' };
		if (kind === 'pr') return { name: id === 'paragon' ? 'Paragon' : 'Renegade', kind: 'Mass Effect · Tracker' };
		if (kind === 'shield') return { name: 'Kinetic Shield', kind: 'Mass Effect · Shields' };
		return null;
	}

	/** The document a readout key describes, if it has one. A strike describes the weapon it comes from. */
	static #documentFor(actor, key) {
		const [kind, id] = key.split(':');
		if (kind === 'strike') return actor.system?.actions?.[Number(id)]?.item ?? null;
		if (kind === 'item' || kind === 'effect') {
			// an effect may be on an item rather than the character
			return actor.items.get(id) ?? actor.effects.get(id)
				?? [...(actor.allApplicableEffects?.() ?? [])].find((e) => e.id === id) ?? null;
		}
		return null;
	}

	/** A description as the sheet shows it, through the same enricher: live links, and secrets only for an owner. */
	static async #describe(doc) {
		const own = await getAdapter()?.describe?.(doc);
		if (own != null) return own;
		return foundry.applications.ux.TextEditor.implementation.enrichHTML(doc.system?.description?.value ?? doc.description ?? '', {
			rollData: doc.getRollData?.(),
			relativeTo: doc,
			secrets: doc.isOwner,
		});
	}

	/** Put the description in. Only the newest may: an older one can finish after it. */
	static async #fillReadout() {
		const key = this.#showing;
		const actor = this.actor();
		const doc = key && actor ? this.#documentFor(actor, key) : null;
		const adapter = getAdapter();
		const own = !doc && key && actor && adapter?.readoutEntry?.(actor, key);
		if (!doc && !own) return;
		const token = ++this.#descriptions;
		let html;
		try {
			html = doc ? await this.#describe(doc) : await adapter.describeEntry?.(actor, key) ?? '';
		} catch (err) {
			console.error(`${MOD} | the description of "${doc?.name ?? own.name}" could not be read`, err);
			html = '<p class="dimc">This description could not be read. See the console for details.</p>';
		}
		if (token !== this.#descriptions) return;
		const same = this.#described.key === key && this.#described.html === html;
		this.#described = { key, html };
		// the same text again must not lose the reader's place
		const box = document.querySelector('#sfh-readout .ro-text');
		if (box && !same) box.innerHTML = html;
	}

	static #refreshReadout() {
		const el = document.getElementById('sfh-readout');
		const actor = this.actor();
		if (!el || !actor) return;
		el.innerHTML = renderReadout(this.#entry(actor));
		// something new starts from its top
		el.scrollTop = 0;
		this.#fillReadout();
	}

	/**
	 * Describe something else. Nothing takes it away again: with the pointer on nothing the readout
	 * keeps what it shows, so it can be read and scrolled, and it stays through a change of page.
	 */
	static #show(key) {
		if (!key || key === this.#showing) return;
		this.#showing = key;
		this.#refreshReadout();
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
				this.#finishEditing();
				this.#tab = key;
				return this.render();
			}
			// for whoever has no pointer to hover with
			if (action === 'read') return this.#show(key);
			if (action === 'sheet') return this.actor()?.sheet?.render(true);
			if (action === 'menu-close') return target.closest('.sfh-menu')?.remove();
			if (action === 'settings') return game.settings.sheet.render(true);
			if (action === 'chatLog') {
				ui.chat?.activate?.();
				return ui.sidebar?.expand?.();
			}
			if (action === 'latestClear') {
				this.#latest.delete(this.actor()?.id);
				return this.render();
			}

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
			// Browse takes what to look for from the box beside it.
			if (action === 'browseEquipment') value = target.closest('.sfh-browse')?.querySelector('[data-browse]')?.value ?? '';

			try {
				// nothing on the character changed, so no update will redraw it
				if (await adapter.act(actor, action, value, event) === 'redraw') this.render();
			} catch (err) {
				console.error(`${MOD} | "${action}" failed`, err);
				ui.notifications.error(game.i18n.format('SFH.ActionFailed', { action }));
			}
		});

		el.addEventListener('input', (event) => {
			if (event.target.matches('[data-browse]')) this.#quickSearch(event.target.value);
		});

		// typed values commit on Enter or when the field is left
		el.addEventListener('change', async (event) => {
			const adapter = getAdapter();
			const actor = this.actor();
			if (!adapter || !actor) return;

			// a picker hands its choice to the adapter; the new chip arrives with the actor's update
			const pick = event.target.closest('[data-pick]');
			if (pick) {
				const action = { condition: 'addCondition', rank: 'setRank', carry: 'setCarry', give: 'giveItem', aux: 'aux', ammo: 'linkAmmo' }[pick.dataset.pick];
				// choosing "none" is a choice only where the picker says so
				if (!action || (!pick.value && !pick.dataset.allowEmpty)) return;
				// a picker on one thing of many says which, as a button does
				const value = pick.dataset.k ? `${pick.dataset.k}:${pick.value}` : pick.value;
				try {
					await adapter.act(actor, action, value, event);
				} catch (err) {
					console.error(`${MOD} | "${action}" failed`, err);
					ui.notifications.error(game.i18n.format('SFH.ActionFailed', { action }));
				}
				return this.render();
			}

			// a field of a tab, typed or saved from its editor; the system's update redraws it
			if (event.target.matches('[data-field]')) {
				try {
					await adapter.setField?.(actor, event.target.dataset.field, event.target.value);
				} catch (err) {
					console.error(`${MOD} | "${event.target.dataset.field}" could not be saved`, err);
					ui.notifications.error(game.i18n.format('SFH.ActionFailed', { action: event.target.dataset.field }));
				}
				return;
			}

			const field = event.target.closest('[data-commit]');
			if (!field) return;
			const value = Number(field.value);
			if (!Number.isFinite(value)) return this.render();
			const action = { hp: 'setHp', temp: 'setTemp', max: 'setMax', shieldHp: 'setShieldHp' }[field.dataset.commit];
			if (!action) return;
			try {
				await adapter.act(actor, action, value, event);
			} catch (err) {
				console.error(`${MOD} | "${action}" failed`, err);
				this.render();
			}
		});
		el.addEventListener('keydown', (event) => {
			if (event.key === 'Enter' && event.target.matches('[data-commit],[data-amount],input[data-field]')) event.target.blur();
			if (event.key === 'Enter' && event.target.matches('[data-browse]')) {
				event.preventDefault();
				event.target.closest('.sfh-browse')?.querySelector('[data-act="browseEquipment"]')?.click();
			}
			if (event.key === 'Escape') {
				if (event.target.matches('[data-browse]')) this.#quickSearch('');
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
		/*
		 * The readout changes a moment after the pointer settles, so crossing other rows on the
		 * way to it does not swap what it shows, and it holds still while the pointer is on it.
		 */
		el.addEventListener('mouseover', (event) => {
			clearTimeout(this.#hover);
			if (event.target.closest('[data-slot="readout"]')) return;
			const key = event.target.closest('[data-ro]')?.dataset.ro;
			if (key) this.#hover = setTimeout(() => this.#show(key), 120);
		});
		el.addEventListener('mouseleave', () => clearTimeout(this.#hover));
		// after the focus has landed: moving to the next field is still typing
		el.addEventListener('focusout', () => setTimeout(() => this.#settle()));
		el.addEventListener('close', () => this.#settle());
		// the editor's open event does not bubble, but it can be caught on the way down
		el.addEventListener('open', (event) => {
			if (event.target.matches('prose-mirror')) this.#revealEditor(event.target);
		}, true);
		// the keyboard's pointing: a row clicked earlier keeps the focus, and must not come back with it
		el.addEventListener('focusin', (event) => {
			if (event.target.matches(':focus-visible')) this.#show(event.target.closest('[data-ro]')?.dataset.ro);
		});
	}
}
