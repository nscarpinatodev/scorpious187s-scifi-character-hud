import { EL, MOD, S } from '../constants.mjs';
import { esc } from '../projection/helpers.mjs';
import { topObstacles, watchObstacles } from './obstacles.mjs';

/**
 * The carousel: the turn order as a row of portraits across the top of the screen, in the
 * device's style. It is a second view of the same encounter, switched on in the module settings,
 * and leaves Foundry's tracker in the sidebar as it is.
 *
 * It shows only what that tracker would. A combatant the user may not see is left out, a name the
 * system hides stays hidden, and hit points are shown only on what the user owns. Hovering and
 * clicking go to the tracker's own handlers, so they light the token and pan to it the same way.
 * Turns move through the Combat document, as the tracker's own buttons do.
 */
export class Carousel {
	static #pending = false;
	static #watching = false;
	static #renders = 0;

	static get element() {
		return document.getElementById(EL.carousel);
	}

	/** The encounter being shown, which is the one the sidebar tracker is showing. */
	static get combat() {
		return ui.combat?.viewed ?? game.combat ?? null;
	}

	/** Draw it again once the current burst of changes is over. */
	static schedule() {
		if (this.#pending) return;
		this.#pending = true;
		requestAnimationFrame(() => {
			this.#pending = false;
			this.render();
		});
	}

	/** Take it off the screen, and tell whatever is measuring the room it left. */
	static remove() {
		if (!this.element) return;
		this.element.remove();
		Hooks.callAll('sfhCarousel', false);
	}

	static async render() {
		const combat = this.combat;
		if (!game.settings.get(MOD, S.carousel) || !combat?.turns?.length) return this.remove();

		// everything from the current turn on, then around to the top: who is up, and who is next
		const started = combat.round > 0 && Number.isInteger(combat.turn);
		const from = started ? combat.turn : 0;
		const ahead = combat.turns.slice(from).filter((c) => c.visible);
		const behind = combat.turns.slice(0, from).filter((c) => c.visible);
		const coming = [...ahead, ...behind];
		if (!coming.length) return this.remove();

		// centered, those furthest off in the order are the ones who just went: they go on the left
		const centered = started && game.settings.get(MOD, S.carouselLayout) === 'center';
		const before = centered ? Math.floor((coming.length - 1) / 2) : 0;
		const row = [...coming.slice(coming.length - before), ...coming.slice(0, coming.length - before)];

		const token = ++this.#renders;
		const current = started ? combat.turns[combat.turn] : null;
		const cards = await Promise.all(row.map((c) => this.#card(c, c === current)));
		// only the newest may draw: an older one can finish after it
		if (token !== this.#renders) return;
		if (started) this.#markRound(cards, row, combat, before);
		const anchorId = centered ? coming[0].id : null;

		const parent = document.getElementById('ui-top');
		if (!parent) return;
		let el = this.element;
		const isNew = !el;
		if (isNew) {
			el = document.createElement('section');
			el.id = EL.carousel;
			el.setAttribute('aria-label', 'Turn order');
			// its stylesheet shows it, so without one its portraits are never seen at full size
			el.style.visibility = 'hidden';
			parent.append(el);
			this.#bind(el);
		}
		const positions = this.#measure(el);
		const scrolled = el.querySelector('.sfh-cards')?.scrollLeft ?? 0;
		const turnKey = `${combat.id}:${combat.round}:${combat.turn}`;
		const sameTurn = el.dataset.turn === turnKey;
		el.dataset.turn = turnKey;
		// a new size for the carousel is put on at once: every card at a new size is not a turn
		const size = String((game.settings.get(MOD, S.carouselScale) ?? 100) / 100);
		const resized = !isNew && el.style.getPropertyValue('--cs') !== size;
		el.style.setProperty('--cs', size);
		this.#update(el, cards.join(''), this.#controls(combat, started));
		this.#fitWidth(el);
		this.#dropBelow(el);
		if (!this.#watching) {
			this.#watching = true;
			watchObstacles(() => this.schedule());
		}
		const cardsRow = el.querySelector('.sfh-cards');
		// the row is kept from one drawing to the next, so centering's padding has to go when it stops
		if (anchorId) this.#balance(cardsRow, anchorId);
		else {
			cardsRow.style.removeProperty('padding-left');
			cardsRow.style.removeProperty('padding-right');
		}
		// a new turn starts with the current one in view; anything else leaves the row where it was
		if (sameTurn) cardsRow.scrollLeft = scrolled;
		else if (anchorId) cardsRow.scrollLeft = (cardsRow.scrollWidth - cardsRow.clientWidth) / 2;
		else cardsRow.scrollLeft = 0;
		if (!resized) this.#slide(el, positions);
		Hooks.callAll('sfhCarousel', true);
	}

	/** The round, and the turn controls this user is allowed. The same rules as the tracker's footer. */
	static #controls(combat, started) {
		const gm = game.user.isGM;
		const button = (act, icon, label) => `<button type="button" class="sfh-ctl" data-cact="${act}" aria-label="${esc(label)}" data-tooltip="${esc(label)}"><i class="fa-solid ${icon}" inert></i></button>`;
		const title = game.i18n.localize('COMBAT.TurnPrev');
		const mine = combat.combatant?.players?.includes(game.user);
		let controls = '';
		if (gm && !started) controls = `<button type="button" class="sfh-ctl sfh-wide" data-cact="begin"><i class="fa-solid fa-swords" inert></i> ${esc(game.i18n.localize('COMBAT.Begin'))}</button>`;
		else if (gm) controls = `${button('previous', 'fa-arrow-left', title)}${button('next', 'fa-arrow-right', game.i18n.localize('COMBAT.TurnNext'))}`;
		else if (started && mine) controls = `<button type="button" class="sfh-ctl sfh-wide" data-cact="next"><i class="fa-solid fa-check" inert></i> ${esc(game.i18n.localize('COMBAT.TurnEnd'))}</button>`;
		if (this.#hasEncounterMenu) {
			const label = game.i18n.localize('SFH.Carousel.EncounterMenu');
			controls += `<button type="button" class="sfh-ctl sfh-menu" aria-label="${esc(label)}" data-tooltip="${esc(label)}"><i class="fa-solid fa-ellipsis-vertical" inert></i></button>`;
		}
		const round = started ? game.i18n.format('COMBAT.Round', { round: combat.round }) : game.i18n.localize('COMBAT.NotStarted');
		return `<div class="sfh-turns"><strong class="sfh-round">${esc(round)}</strong>${controls ? `<div class="sfh-ctls">${controls}</div>` : ''}</div>`;
	}

	/** The tracker keeps its encounter menu for the GM. */
	static get #hasEncounterMenu() {
		return game.user.isGM && !!ui.combat?._getCombatContextOptions;
	}

	static async #card(combatant, active) {
		const owner = combatant.isOwner;
		// as on the system's tracker: its setting decides whether a hidden nameplate hides the name
		const hidesNames = !!game.pf2e?.settings?.tokens?.nameVisibility;
		const seesName = game.user.isGM || owner || !hidesNames || combatant.playersCanSeeName !== false;
		const name = seesName ? combatant.name : '';
		const defeated = !!combatant.isDefeated;
		const img = await ui.combat?._getCombatantThumbnail?.(combatant) ?? combatant.img ?? CONST.DEFAULT_TOKEN;
		const css = ['combatant', 'sfh-card', active && 'active', combatant.hidden && 'hide', defeated && 'defeated', !seesName && 'unnamed'].filter(Boolean).join(' ');

		// hit points where the system keeps them: attributes.hp, or Fallout 2d20's health
		const system = combatant.actor?.system;
		const hp = owner || game.user.isGM ? system?.attributes?.hp ?? system?.health : null;
		const bar = hp?.max
			? `<span class="sfh-bar ${hp.value / hp.max <= 0.35 ? 'low' : ''}" role="img" aria-label="${esc(`${hp.value} of ${hp.max} hit points`)}"><i style="width:${Math.max(0, Math.min(100, (hp.value / hp.max) * 100))}%"></i></span>`
			: '';

		// what the tracker shows as icons, and no more
		const show = CONST.ACTIVE_EFFECT_SHOW_ICON;
		const icons = [...(combatant.actor?.appliedEffects ?? [])]
			.filter((e) => e.showIcon === show?.ALWAYS || (e.showIcon === show?.CONDITIONAL && e.isTemporary))
			.slice(0, 4)
			.map((e) => `<img src="${esc(e.img)}" alt="${esc(e.name)}">`).join('');

		const value = combatant.initiative;
		const initiative = Number.isFinite(value)
			? `<span class="sfh-init">${esc(Number.isInteger(value) ? value : value.toFixed(CONFIG.Combat?.initiative?.decimals ?? 2))}</span>`
			: owner
				? `<button type="button" class="sfh-init sfh-roll" data-cact="roll" aria-label="${esc(game.i18n.localize('COMBAT.InitiativeRoll'))}" data-tooltip="${esc(game.i18n.localize('COMBAT.InitiativeRoll'))}"><i class="fa-solid fa-dice-d20" inert></i></button>`
				: '<span class="sfh-init sfh-unrolled">–</span>';

		return `<li class="${css}" data-key="${esc(combatant.id)}" data-combatant-id="${esc(combatant.id)}"${seesName ? ` data-tooltip="${esc(name)}"` : ''}>
			<span class="sfh-portrait"><img src="${esc(img)}" alt="${esc(name)}">${icons ? `<span class="sfh-effects">${icons}</span>` : ''}${this.#targetedBy(combatant)}</span>
			${initiative}${bar}
			<strong class="sfh-name">${esc(name)}</strong>
			${this.#cardControls(combatant)}
		</li>`;
	}

	/** Who has this combatant targeted, each in their own color, as the system's tracker shows it. */
	static #targetedBy(combatant) {
		const users = [...(combatant.token?.object?.targeted ?? [])];
		if (!users.length) return '';
		const marks = users.map((u) => `<i class="fa-duotone fa-solid fa-location-crosshairs" style="color:${esc(u.color?.toString?.() ?? u.color ?? '')}" inert></i>`).join('');
		return `<span class="sfh-targeting" data-tooltip="${esc(users.map((u) => u.name).join(', '))}">${marks}</span>`;
	}

	/** The GM's Hidden and Defeated, and everyone's target, as on the tracker's rows. */
	static #cardControls(combatant) {
		const button = (act, icon, on, label) => `<button type="button" class="sfh-card-ctl${on ? ' on' : ''}" data-cact="${act}" aria-pressed="${on}"
			aria-label="${esc(label)}" data-tooltip="${esc(label)}"><i class="fa-solid ${icon}" inert></i></button>`;
		const l = (key) => game.i18n.localize(key);
		const gm = game.user.isGM
			? button('hidden', 'fa-eye-slash', !!combatant.hidden, l(combatant.hidden ? 'COMBATANT.Show' : 'COMBATANT.Hide'))
				+ button('defeated', 'fa-skull', !!combatant.isDefeated, l(combatant.isDefeated ? 'COMBATANT.UnmarkDefeated' : 'COMBATANT.MarkDefeated'))
			: '';
		// a token on another scene has nothing on the map to target
		const token = combatant.token?.object;
		const target = token ? button('target', 'fa-location-crosshairs', !!token.targeted?.has(game.user), l('SFH.Carousel.Target')) : '';
		return gm || target ? `<span class="sfh-card-ctls">${gm}${target}</span>` : '';
	}

	/** Target a combatant's token, as clicking it with the target tool does. Shift adds to the targets. */
	static #target(combatant, event) {
		const token = combatant?.token?.object;
		if (!token) return;
		if (!(ui.combat?._isTokenVisible?.(token) ?? token.visible)) {
			return ui.notifications.warn('COMBAT.WarnNonVisibleToken', { localize: true });
		}
		return token.setTarget(!token.targeted?.has(game.user), { releaseOthers: !event.shiftKey });
	}

	/**
	 * Keep to the room between the scene list and the sidebar. The region it sits in is centered on
	 * the window and takes no account of either, so a long row would run under them. It is centered
	 * itself, so the nearer of the two sets its width. The interface can be scaled, which
	 * rectangles see and a style's pixels do not.
	 */
	static #fitWidth(el) {
		const parent = el.parentElement.getBoundingClientRect();
		const center = parent.left + parent.width / 2;
		const sidebar = document.getElementById('sidebar')?.getBoundingClientRect();
		// the buttons, not their list: the list stretches to fill a column that is mostly empty
		// the scene bar, or Foundry's own list where that is off
		const scenes = [...document.querySelectorAll('#sfh-scenes .sfh-bar, #scene-navigation .scene')].map((s) => s.getBoundingClientRect().right).filter(Boolean);
		const gap = 12;
		const toRight = sidebar?.width ? sidebar.left - center - gap : Infinity;
		const toLeft = scenes.length ? center - Math.max(...scenes) - gap : Infinity;
		const scale = parent.width / (el.parentElement.offsetWidth || parent.width) || 1;
		const room = Math.min(toRight, toLeft, parent.width / 2) * 2;
		el.style.maxWidth = `${Math.max(240, Math.floor(room / scale))}px`;
	}

	/**
	 * Step down below anything stuck at the top of the screen in its way, as Calendaria's HUD at
	 * the top center would be. The interface can be scaled, which rectangles see and a style's
	 * pixels do not.
	 */
	static #dropBelow(el) {
		el.style.removeProperty('margin-top');
		const box = el.getBoundingClientRect();
		const scale = box.width / (el.offsetWidth || box.width) || 1;
		let drop = 0;
		for (const other of topObstacles()) {
			const r = other.getBoundingClientRect();
			if (r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > box.top) drop = Math.max(drop, r.bottom + 6 - box.top);
		}
		if (drop) el.style.marginTop = `${drop / scale}px`;
	}

	/**
	 * Mark where the order goes around from its last combatant to its first. To the right of the
	 * current turn that is the next round; to its left, the start of this one.
	 */
	static #markRound(cards, row, combat, before) {
		const visible = combat.turns.filter((c) => c.visible);
		const at = row.findIndex((c, i) => c === visible.at(-1) && row[i + 1] === visible[0]);
		if (at < 0) return;
		const round = at < before ? combat.round : combat.round + 1;
		cards.splice(at + 1, 0, `<li class="sfh-next-round" data-key="round" aria-hidden="true">${esc(game.i18n.format('COMBAT.Round', { round }))}</li>`);
	}

	/**
	 * Put one card at the very middle of the row. The row is centered, so it only needs what is
	 * either side of that card to take up the same width: the shorter side gets the difference.
	 * It goes by where the cards' places are, not where they are seen: part way through a slide
	 * they are somewhere else, and centering on that would shift the row and start the slide over.
	 */
	static #balance(row, anchorId) {
		const anchor = row.querySelector(`[data-combatant-id="${CSS.escape(anchorId)}"]`);
		if (!anchor) return;
		row.style.removeProperty('padding-left');
		row.style.removeProperty('padding-right');
		const first = row.firstElementChild;
		const last = row.lastElementChild;
		const left = anchor.offsetLeft - first.offsetLeft;
		const right = (last.offsetLeft + last.offsetWidth) - (anchor.offsetLeft + anchor.offsetWidth);
		const difference = right - left;
		const base = parseFloat(getComputedStyle(row).paddingLeft) || 0;
		if (difference > 0) row.style.paddingLeft = `${base + difference}px`;
		else if (difference < 0) row.style.paddingRight = `${base - difference}px`;
	}

	/**
	 * Draw the row without starting it again. A card that has not changed is the same element as
	 * before, so its portrait does not load again and a slide it is in the middle of runs on; one
	 * that has changed keeps its portrait's image. The cards are put in their new order by moving
	 * them, and the turn controls are replaced only when they change.
	 */
	static #update(el, cardsHtml, controlsHtml) {
		let row = el.querySelector(':scope > .sfh-cards');
		if (!row) {
			el.innerHTML = '<ol class="sfh-cards plain"></ol>';
			row = el.firstElementChild;
		}
		const old = new Map([...row.children].map((li) => [li.dataset.key, li]));
		const fresh = document.createElement('template');
		fresh.innerHTML = cardsHtml;
		const next = [...fresh.content.children].map((li) => {
			const markup = li.outerHTML;
			const was = old.get(li.dataset.key);
			if (was?._sfhHtml === markup) {
				old.delete(li.dataset.key);
				return was;
			}
			li._sfhHtml = markup;
			const img = li.querySelector('.sfh-portrait > img');
			const keep = was?.querySelector('.sfh-portrait > img');
			if (img && keep && keep.getAttribute('src') === img.getAttribute('src')) {
				keep.alt = img.alt;
				img.replaceWith(keep);
			}
			return li;
		});
		next.forEach((node, i) => {
			if (row.children[i] !== node) row.insertBefore(node, row.children[i] ?? null);
		});
		while (row.children.length > next.length) row.lastElementChild.remove();

		const turns = el.querySelector(':scope > .sfh-turns');
		if (turns?._sfhHtml === controlsHtml) return;
		const box = document.createElement('template');
		box.innerHTML = controlsHtml;
		const made = box.content.firstElementChild;
		made._sfhHtml = controlsHtml;
		if (turns) turns.replaceWith(made);
		else el.append(made);
	}

	/** How much the interface is scaled: rectangles see it, a style's pixels do not. */
	static #uiScale(el) {
		const row = el.querySelector('.sfh-cards') ?? el;
		return row.getBoundingClientRect().width / (row.offsetWidth || 1) || 1;
	}

	/** How far a card's slide still has to go, in screen pixels. */
	static #shift(card, ui) {
		const transform = getComputedStyle(card).transform;
		if (!transform || transform === 'none') return 0;
		return new DOMMatrixReadOnly(transform).m41 * ui;
	}

	/**
	 * Where each card is on the screen now, part way through a slide or not, and where its place
	 * in the row is: what a slide starts from, and whether it has a new place to go to at all.
	 */
	static #measure(el) {
		const out = new Map();
		const ui = this.#uiScale(el);
		for (const card of el.querySelectorAll('.sfh-cards > [data-key]')) {
			const rect = card.getBoundingClientRect();
			out.set(card.dataset.key, { seen: rect.left, place: rect.left - this.#shift(card, ui), width: rect.width / ui });
		}
		return out;
	}

	/**
	 * Slide each card from where it was seen to its new place, growing or shrinking as it goes when
	 * its turn starts or ends. One whose place and size have not changed is left alone, so another
	 * drawing part way through a turn's slide does not start it over. The order goes around, so on
	 * a new turn the card that wraps from one end to the other does not cross the whole row: it
	 * carries on off its edge with the rest, and comes in at the other.
	 */
	static #slide(el, before) {
		if (!before.size || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const ui = this.#uiScale(el);
		const moves = [];
		for (const card of el.querySelectorAll('.sfh-cards > [data-key]')) {
			const was = before.get(card.dataset.key);
			const rect = card.getBoundingClientRect();
			const place = rect.left - this.#shift(card, ui);
			if (!was) {
				card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
				continue;
			}
			const width = card.offsetWidth || 1;
			const grow = was.width / width;
			const resized = card.getAnimations().some((a) => a.id === 'sfh-slide') ? false : Math.abs(grow - 1) > 0.01;
			if (Math.abs(place - was.place) < 1 && !resized) continue;
			for (const running of card.getAnimations()) if (running.id === 'sfh-slide') running.cancel();
			moves.push({ card, by: (was.seen - place) / ui, step: (place - was.place) / ui, width, grow });
		}
		if (!moves.length) return;

		// which way the order turned: most cards move one place that way
		const lean = Math.sign(moves.reduce((sum, m) => sum + Math.sign(m.step), 0));
		const sizes = moves.filter((m) => Math.sign(m.step) === lean).map((m) => Math.abs(m.step)).sort((a, b) => a - b);
		const usual = sizes[Math.floor(sizes.length / 2)] ?? 0;
		for (const { card, by, step, width, grow } of moves) {
			const wraps = lean && Math.sign(step) === -lean && Math.abs(step) > usual * 1.5;
			const slide = { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)', id: 'sfh-slide' };
			// the cards line up along their tops, so a card grows from its top left corner
			const size = Math.abs(grow - 1) > 0.01 ? ` scale(${grow})` : '';
			const origin = { transformOrigin: 'left top' };
			if (!wraps) {
				card.animate([{ transform: `translateX(${by}px)${size}`, ...origin }, { transform: 'none', ...origin }], slide);
				continue;
			}
			// off one edge, in at the other, moving the way the rest are
			const off = lean * Math.max(usual, width);
			card.animate([
				{ transform: `translateX(${by}px)${size}`, opacity: 1, ...origin },
				{ transform: `translateX(${by + off}px)${size}`, opacity: 0, offset: 0.45, ...origin },
				{ transform: `translateX(${-off}px)`, opacity: 0, offset: 0.55, ...origin },
				{ transform: 'none', opacity: 1, ...origin },
			], { ...slide, duration: 380, easing: 'ease-in-out' });
		}
	}

	static #bind(el) {
		// the tracker's own menu, so it has whatever the system and other modules add to it
		ui.combat?._createContextMenu?.(ui.combat._getEntryContextOptions, '.sfh-card', { container: el, fixed: true });
		// and its encounter menu, made as it makes it there, but hung from the button rather than
		// the cursor: this bar is small enough for the menu to cover it
		if (this.#hasEncounterMenu) {
			ui.combat._createContextMenu?.(ui.combat._getCombatContextOptions, '.sfh-menu', {
				container: el,
				eventName: 'click',
				fixed: true,
				relative: 'target',
				hookName: 'getCombatContextOptions',
				parentClassHooks: false,
			});
		}
		el.addEventListener('pointerover', (event) => {
			if (event.target.closest('.sfh-card')) ui.combat?._onCombatantHoverIn?.(event);
		});
		el.addEventListener('pointerout', (event) => {
			if (event.target.closest('.sfh-card')) ui.combat?._onCombatantHoverOut?.(event);
		});
		const activate = (event) => {
			const card = event.target.closest('.sfh-card');
			if (card) ui.combat?._onCombatantMouseDown?.(event, card);
		};
		el.addEventListener('click', (event) => {
			const button = event.target.closest('[data-cact]');
			if (!button) return activate(event);
			const combat = this.combat;
			const combatant = combat?.combatants?.get(button.closest('.sfh-card')?.dataset.combatantId);
			switch (button.dataset.cact) {
				// the tracker's own handlers: a system may do these its own way
				case 'hidden': return combatant && ui.combat?._onToggleHidden?.(combatant);
				case 'defeated': return combatant && ui.combat?._onToggleDefeatedStatus?.(combatant);
				case 'target': return this.#target(combatant, event);
				case 'begin': return combat?.startCombat();
				case 'previous': return combat?.previousTurn();
				case 'next': return combat?.nextTurn();
				case 'roll': return combat?.rollInitiative([button.closest('.sfh-card').dataset.combatantId]);
				default: return null;
			}
		});
		el.addEventListener('dblclick', activate);
		// a long row is scrolled with the ordinary wheel
		el.addEventListener('wheel', (event) => {
			const row = el.querySelector('.sfh-cards');
			if (row) row.scrollLeft += event.deltaY;
		}, { passive: true });
	}
}
