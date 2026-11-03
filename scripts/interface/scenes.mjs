import { EL, MOD, S } from '../constants.mjs';
import { esc } from '../projection/helpers.mjs';

/**
 * The scene bar: Foundry's scene navigation as a bar across the top left, in the device's style,
 * with a drawer of every scene by folder, a search, and a preview of each scene.
 *
 * It stands in for Foundry's own list, which is hidden while it is on, but every action is
 * Foundry's: viewing and activating, preloading, pulling everyone, the scene's own
 * configuration, and the list's right-click menu, which other modules add to. What decides
 * whether a player sees a scene is Foundry's rule too.
 *
 * Another module can sit at the top center of the screen, as Calendaria's HUD does. The bar
 * ends short of it, and what does not fit waits behind a "+N" that opens the drawer.
 */
export class SceneBar {
	static #pending = false;
	static #drawerOpen = false;
	static #folder = 'bar';
	static #query = '';
	/** The scene viewed before this one, for the back button. */
	static #previous = null;
	static #current = null;
	static #previewing = null;
	static #hover = null;
	static #leave = null;
	static #click = null;
	/** Collapsed for an encounter, and back as it was afterward. */
	static #combatCollapsed = false;
	/** Opened by the pointer while collapsed, and closed again when it leaves. */
	static #peeking = false;
	static #preloaded = new Set();
	static #preloading = new Set();
	static #watched = null;
	static #observers = [];
	static #dragging = null;

	static get element() {
		return document.getElementById(EL.scenes);
	}

	static get enabled() {
		return !!game.settings.get(MOD, S.sceneBar);
	}

	/** Collapsed as it stands, whether or not the pointer has it open for a look. */
	static get #keptCollapsed() {
		return this.#combatCollapsed || !!game.settings.get(MOD, S.sceneBarCollapsed);
	}

	static get collapsed() {
		return !this.#peeking && this.#keptCollapsed;
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

	static remove() {
		this.element?.remove();
		this.#card()?.remove();
		delete document.body.dataset.sfhScenes;
		Hooks.callAll('sfhScenes', false);
	}

	/* -------------------------------------------- */
	/*  What it shows                                */
	/* -------------------------------------------- */

	/** The name a user sees: a player sees the navigation name if the scene has one. */
	static #name(scene) {
		return game.user.isGM ? scene.name : scene.navName || scene.name;
	}

	/** Who is looking at each scene, as Foundry's list shows them. */
	static #viewers() {
		const out = {};
		for (const user of game.users) {
			if (!user.active || !user.viewedScene) continue;
			(out[user.viewedScene] ??= []).push(user);
		}
		return out;
	}

	/** Foundry's rule for its list: the active scene, the viewed one, and what is in navigation that this user may see. */
	static #barScenes() {
		const scenes = game.scenes.filter((s) => s.active || s.isView || (s.navigation && s.visible));
		return scenes.sort((a, b) => (b.active - a.active) || (b.isView - a.isView) || ((a.navOrder ?? 0) - (b.navOrder ?? 0)));
	}

	/** Everything this user may look up. A player has what they can see, the GM everything. */
	static #allScenes() {
		return game.scenes.filter((s) => game.user.isGM || s.active || s.isView || (s.navigation && s.visible));
	}

	static #folders() {
		return (game.folders?.filter((f) => f.type === 'Scene') ?? []).sort((a, b) => ((a.sort ?? 0) - (b.sort ?? 0)) || a.name.localeCompare(b.name));
	}

	/** Every folder from the top down, with how deep it is, so the drawer can indent them. */
	static #folderTree() {
		const folders = this.#folders();
		const out = [];
		const add = (parent, depth) => {
			for (const f of folders.filter((x) => (x.folder?.id ?? null) === parent)) {
				out.push({ folder: f, depth });
				add(f.id, depth + 1);
			}
		};
		add(null, 0);
		return out;
	}

	/** A folder and everything inside it, however deep. */
	static #inFolder(scene, folderId) {
		let f = scene.folder;
		while (f) {
			if (f.id === folderId) return true;
			f = f.folder;
		}
		return false;
	}

	static #path(scene) {
		const out = [];
		let f = scene.folder;
		while (f) {
			out.unshift(f.name);
			f = f.folder;
		}
		return out.join(' / ');
	}

	/* -------------------------------------------- */
	/*  Rendering                                    */
	/* -------------------------------------------- */

	static render() {
		if (!this.enabled || !game.scenes) return this.remove();
		document.body.dataset.sfhScenes = 'on';
		let el = this.element;
		if (!el) {
			const parent = document.getElementById('ui-left-column-2') ?? document.getElementById('ui-top');
			if (!parent) return;
			el = document.createElement('nav');
			el.id = EL.scenes;
			el.setAttribute('aria-label', game.i18n.localize('SFH.Scenes.Label'));
			parent.prepend(el);
			this.#bind(el);
		}
		this.#watch();
		const l = (key) => game.i18n.localize(key);
		const icon = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${path}"/></svg>`;
		const gm = game.user.isGM;
		const collapsed = this.collapsed;
		// the button says what it will do: open for a look, it still opens the bar for good
		const kept = this.#keptCollapsed;
		const viewers = this.#viewers();
		const chips = collapsed ? '' : this.#barScenes().map((s) => this.#chip(s, viewers[s.id])).join('');
		const back = this.#previous && game.scenes.get(this.#previous)
			? `<button type="button" class="sfh-sb" data-sact="back" aria-label="${esc(l('SFH.Scenes.Back'))}" data-tooltip="${esc(game.i18n.format('SFH.Scenes.BackTo', { name: this.#name(game.scenes.get(this.#previous)) }))}">${icon('M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3')}</button>`
			: '';
		el.classList.toggle('collapsed', collapsed);
		el.innerHTML = `<div class="sfh-bar">
			${back}
			<button type="button" class="sfh-sb ${this.#drawerOpen ? 'on' : ''}" data-sact="drawer" aria-expanded="${this.#drawerOpen}" data-tooltip="${esc(l('SFH.Scenes.AllHint'))}">${icon('M3 6h7l2 2h9v11H3z')}<span>${esc(l('SFH.Scenes.All'))}</span></button>
			${collapsed ? '' : `<span class="sfh-sep"></span><ol class="sfh-chips plain">${chips}</ol>${this.#levels()}
			<button type="button" class="sfh-sb sfh-more" data-sact="more" hidden></button>`}
			<span class="sfh-sep"></span>
			<button type="button" class="sfh-sb" data-sact="collapse" aria-pressed="${kept}" aria-label="${esc(l(kept ? 'SFH.Scenes.Expand' : 'SFH.Scenes.Collapse'))}" data-tooltip="${esc(l(kept ? 'SFH.Scenes.Expand' : 'SFH.Scenes.Collapse'))}">${icon(kept ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6')}</button>
		</div>
		${this.#drawerOpen ? this.#drawer(viewers, gm) : ''}`;
		this.#fit(el);
		if (this.#previewing) {
			const anchor = el.querySelector(`[data-scene-id="${CSS.escape(this.#previewing)}"]`);
			if (anchor && game.scenes.get(this.#previewing)) this.#showCard(this.#previewing, anchor);
			else this.#hideCard();
		}
		Hooks.callAll('sfhScenes', true);
	}

	static #chip(scene, users = []) {
		const l = (key) => game.i18n.localize(key);
		const marks = [
			scene.active ? `<span class="sfh-mark hot" aria-label="${esc(l('SFH.Scenes.Active'))}" data-tooltip="${esc(l('SFH.Scenes.Active'))}">▲</span>` : '',
			game.user.isGM && scene.ownership?.default === 0 && !scene.active ? `<i class="fa-solid fa-eye-slash sfh-mark" aria-label="${esc(l('SFH.Scenes.Hidden'))}" data-tooltip="${esc(l('SFH.Scenes.Hidden'))}"></i>` : '',
		].join('');
		const pips = users.length ? `<span class="sfh-pips">${users.map((u) => `<i style="--pip:${esc(u.color?.css ?? u.color ?? '#888')}" aria-label="${esc(u.name)}" data-tooltip="${esc(u.name)}">${esc(u.name[0] ?? '')}</i>`).join('')}</span>` : '';
		return `<li class="sfh-scene ${scene.active ? 'active' : ''} ${scene.isView ? 'viewed' : ''}" data-scene-id="${esc(scene.id)}" tabindex="0"${game.user.isGM ? ' draggable="true"' : ''}>
			${marks}<span class="sfh-nm">${esc(this.#name(scene))}</span>${pips}</li>`;
	}

	/** A scene of several levels gets a picker for them, as Foundry's list has. */
	static #levels() {
		const scene = canvas?.scene;
		const levels = scene ? [...(scene.availableLevels ?? [])] : [];
		if (levels.length < 2) return '';
		const options = levels.toReversed().map((level) => `<option value="${esc(level.id)}"${level.isView ? ' selected' : ''}>${esc(level.name)}</option>`).join('');
		return `<select class="sfh-level" data-sact="level" aria-label="${esc(game.i18n.localize('SFH.Scenes.Level'))}" data-tooltip="${esc(game.i18n.localize('SFH.Scenes.Level'))}">${options}</select>`;
	}

	static #drawer(viewers, gm) {
		const l = (key) => game.i18n.localize(key);
		const all = this.#allScenes();
		const tree = this.#folderTree().filter(({ folder }) => gm || all.some((s) => this.#inFolder(s, folder.id)));
		const loose = all.filter((s) => !s.folder);
		const count = (id) => all.filter((s) => this.#inFolder(s, id)).length;
		const folders = [
			`<li class="sfh-folder ${this.#folder === 'bar' ? 'on' : ''}" data-folder="bar">${esc(l('SFH.Scenes.InTheBar'))}<span>${this.#barScenes().length}</span></li>`,
			...tree.map(({ folder, depth }) => `<li class="sfh-folder ${this.#folder === folder.id ? 'on' : ''}" data-folder="${esc(folder.id)}" style="--depth:${depth}${folder.color ? `;--folder:${esc(folder.color.css ?? folder.color)}` : ''}">${esc(folder.name)}<span>${count(folder.id)}</span></li>`),
			loose.length ? `<li class="sfh-folder ${this.#folder === 'loose' ? 'on' : ''}" data-folder="loose">${esc(l('SFH.Scenes.NoFolder'))}<span>${loose.length}</span></li>` : '',
		].join('');
		const query = this.#query.trim().toLowerCase();
		let list;
		let crumbs;
		if (query) {
			list = all.filter((s) => this.#name(s).toLowerCase().includes(query) || this.#path(s).toLowerCase().includes(query));
			crumbs = game.i18n.format('SFH.Scenes.Found', { count: list.length, query: this.#query.trim() });
		} else if (this.#folder === 'bar') {
			list = this.#barScenes();
			crumbs = l('SFH.Scenes.InTheBar');
		} else if (this.#folder === 'loose') {
			list = loose;
			crumbs = l('SFH.Scenes.NoFolder');
		} else {
			list = all.filter((s) => this.#inFolder(s, this.#folder));
			const folder = game.folders?.get(this.#folder);
			crumbs = folder ? [...this.#ancestors(folder), folder.name].join(' / ') : '';
		}
		const tiles = list.map((s) => `<li class="sfh-tile ${s.active ? 'active' : ''} ${s.isView ? 'viewed' : ''}" data-scene-id="${esc(s.id)}" tabindex="0">
			${s.active ? `<span class="sfh-flag">${esc(l('SFH.Scenes.Active'))}</span>` : ''}
			${s.thumb ? `<img src="${esc(s.thumb)}" alt="" loading="lazy">` : '<span class="sfh-nothumb"></span>'}
			<span class="sfh-tile-t"><span class="sfh-nm">${esc(this.#name(s))}</span>
				${gm && s.ownership?.default === 0 && !s.active ? `<i class="fa-solid fa-eye-slash sfh-mark" aria-label="${esc(l('SFH.Scenes.Hidden'))}"></i>` : ''}
				${this.#preloaded.has(s.id) ? `<i class="fa-solid fa-download sfh-mark hot" aria-label="${esc(l('SFH.Scenes.Preloaded'))}"></i>` : ''}</span></li>`).join('');
		return `<div class="sfh-drawer">
			<ol class="sfh-folders plain">${folders}</ol>
			<div class="sfh-pane">
				<div class="sfh-pane-h"><input class="sfh-search" type="search" value="${esc(this.#query)}" placeholder="${esc(l('SFH.Scenes.Search'))}" aria-label="${esc(l('SFH.Scenes.Search'))}"></div>
				<div class="sfh-crumbs">${esc(crumbs)}</div>
				<ol class="sfh-tiles plain">${tiles || `<li class="sfh-none">${esc(l('SFH.Scenes.NoScenes'))}</li>`}</ol>
			</div></div>`;
	}

	static #ancestors(folder) {
		const out = [];
		let f = folder.folder;
		while (f) {
			out.unshift(f.name);
			f = f.folder;
		}
		return out;
	}

	/* -------------------------------------------- */
	/*  Room                                         */
	/* -------------------------------------------- */

	/** What sits at the top of the screen that the bar must not run under: Calendaria's HUD, wherever it is stuck. */
	static #obstacles() {
		return [document.getElementById('calendaria-hud')].filter((el) => el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
	}

	/**
	 * Hold the bar to the room it has, and move what does not fit behind "+N". The interface can
	 * be scaled, which rectangles see and a style's pixels do not.
	 */
	static #fit(el) {
		const bar = el.querySelector('.sfh-bar');
		const box = bar.getBoundingClientRect();
		const scale = box.width / (bar.offsetWidth || box.width) || 1;
		const sidebar = document.getElementById('sidebar')?.getBoundingClientRect();
		let right = sidebar?.width ? sidebar.left : window.innerWidth;
		for (const other of this.#obstacles()) {
			const r = other.getBoundingClientRect();
			// only something level with the bar is in its way
			if (r.top < box.bottom + 4 && r.bottom > box.top - 4 && r.left > box.left) right = Math.min(right, r.left);
		}
		el.style.setProperty('--room', `${Math.max(160, (right - 12 - box.left) / scale)}px`);
		const chips = el.querySelector('.sfh-chips');
		const more = el.querySelector('.sfh-more');
		if (chips && more) {
			more.hidden = true;
			let hidden = 0;
			while (chips.scrollWidth > chips.clientWidth + 1 && chips.children.length > 1) {
				chips.lastElementChild.remove();
				hidden++;
				more.hidden = false;
				more.textContent = `+${hidden}`;
				const tip = game.i18n.format('SFH.Scenes.More', { count: hidden });
				more.dataset.tooltip = tip;
				more.setAttribute('aria-label', tip);
			}
		}
		// the drawer is not held to that: it runs to the sidebar, below whatever it would cover
		const drawer = el.querySelector('.sfh-drawer');
		if (drawer) {
			const width = Math.min(900, ((sidebar?.width ? sidebar.left : window.innerWidth) - 20 - box.left) / scale);
			drawer.style.width = `${Math.max(320, width)}px`;
			let drop = 0;
			for (const other of this.#obstacles()) {
				const r = other.getBoundingClientRect();
				if (box.left + width * scale > r.left && r.right > box.left && r.bottom > box.bottom) drop = Math.max(drop, (r.bottom + 8 - box.bottom - 6) / scale);
			}
			drawer.style.marginTop = `${drop}px`;
		}
	}

	/** Calendaria's HUD can be dragged and resized; the bar follows it. */
	static #watch() {
		const hud = document.getElementById('calendaria-hud');
		if (hud === this.#watched) return;
		for (const o of this.#observers) o.disconnect();
		this.#observers = [];
		this.#watched = hud;
		if (!hud) return;
		const resized = new ResizeObserver(() => this.schedule());
		resized.observe(hud);
		const moved = new MutationObserver(() => this.schedule());
		moved.observe(hud, { attributes: true, attributeFilter: ['style', 'class'] });
		this.#observers = [resized, moved];
	}

	/* -------------------------------------------- */
	/*  The preview                                  */
	/* -------------------------------------------- */

	static #card() {
		return document.getElementById(`${EL.scenes}-preview`);
	}

	static #showCard(id, anchor) {
		const scene = game.scenes.get(id);
		if (!scene) return this.#hideCard();
		const l = (key) => game.i18n.localize(key);
		const gm = game.user.isGM;
		this.#previewing = id;
		let card = this.#card();
		if (!card) {
			card = document.createElement('div');
			card.id = `${EL.scenes}-preview`;
			card.setAttribute('role', 'dialog');
			card.addEventListener('click', (event) => this.#onClick(event));
			card.addEventListener('pointerenter', () => clearTimeout(this.#leave));
			card.addEventListener('pointerleave', () => { this.#leave = setTimeout(() => this.#hideCard(), 300); });
			document.body.append(card);
		}
		const users = this.#viewers()[id] ?? [];
		const fact = (on, onText, offText) => `<span class="${on ? '' : 'off'}"><i class="sfh-dot"></i>${esc(on ? onText : offText)}</span>`;
		const sound = scene.playlistSound;
		const facts = gm ? [
			fact(scene.environment?.globalLight?.enabled, l('SFH.Scenes.LightOn'), l('SFH.Scenes.LightOff')),
			fact(scene.tokenVision, l('SFH.Scenes.VisionOn'), l('SFH.Scenes.VisionOff')),
			sound ? fact(sound.playing, game.i18n.format('SFH.Scenes.SoundPlaying', { name: sound.name }), game.i18n.format('SFH.Scenes.SoundSet', { name: sound.name })) : fact(false, '', l('SFH.Scenes.NoSound')),
			fact(users.length, game.i18n.format('SFH.Scenes.Here', { names: users.map((u) => u.name).join(', ') }), l('SFH.Scenes.Nobody')),
		].join('') : (users.length ? fact(true, game.i18n.format('SFH.Scenes.Here', { names: users.map((u) => u.name).join(', ') }), '') : '');
		const button = (act, text, hint, { disabled = false, cls = '' } = {}) => `<button type="button" class="sfh-sb ${cls}" data-sact="${act}" data-tooltip="${esc(hint)}"${disabled ? ' disabled' : ''}>${text}</button>`;
		const preloading = this.#preloading.has(id);
		const preloaded = this.#preloaded.has(id);
		const actions = [
			button('view', esc(l('SFH.Scenes.View')), l('SFH.Scenes.ViewHint'), { disabled: scene.isView }),
			gm ? button('activate', esc(l('SFH.Scenes.Activate')), l('SFH.Scenes.ActivateHint'), { disabled: scene.active }) : '',
			gm ? button('preload', `<span class="sfh-fill"></span><span>${esc(l(preloaded ? 'SFH.Scenes.Preloaded' : preloading ? 'SFH.Scenes.Preloading' : 'SFH.Scenes.Preload'))}</span>`, l('SFH.Scenes.PreloadHint'), { disabled: preloading, cls: `sfh-preload ${preloading ? 'busy' : ''} ${preloaded ? 'done' : ''}` }) : '',
			gm ? button('pull', esc(l('SFH.Scenes.Pull')), l('SFH.Scenes.PullHint')) : '',
			gm ? button('initial', esc(l('SFH.Scenes.Initial')), l(scene.isView ? 'SFH.Scenes.InitialHint' : 'SFH.Scenes.InitialNotViewed'), { disabled: !scene.isView }) : '',
			gm ? button('config', esc(l('SFH.Scenes.Configure')), l('SFH.Scenes.ConfigureHint')) : '',
			gm ? button('nav', esc(l(scene.navigation ? 'SFH.Scenes.OutOfBar' : 'SFH.Scenes.IntoBar')), l('SFH.Scenes.NavHint')) : '',
			gm && scene.journal ? button('notes', esc(l('SFH.Scenes.Notes')), l('SFH.Scenes.NotesHint')) : '',
		].join('');
		const state = [
			scene.active ? `<span class="sfh-pill hot">${esc(l('SFH.Scenes.Active'))}</span>` : '',
			scene.isView ? `<span class="sfh-pill">${esc(l('SFH.Scenes.Viewing'))}</span>` : '',
			gm && scene.ownership?.default === 0 && !scene.active ? `<span class="sfh-pill">${esc(l('SFH.Scenes.Hidden'))}</span>` : '',
		].join('');
		card.innerHTML = `<div class="sfh-thumb" style="${scene.thumb ? `background-image:url('${esc(scene.thumb)}')` : ''}"><div class="sfh-state">${state}</div></div>
			<div class="sfh-card-b">
				<div><h3>${esc(this.#name(scene))}</h3>${gm && this.#path(scene) ? `<div class="sfh-path">${esc(this.#path(scene))}</div>` : ''}</div>
				${facts ? `<div class="sfh-facts">${facts}</div>` : ''}
				<div class="sfh-acts">${actions}</div></div>`;
		card.dataset.sceneId = id;
		card.classList.add('show');
		this.#place(card, anchor);
	}

	/** Beside what it describes, on the screen, and clear of the drawer and of Calendaria. */
	static #place(card, anchor) {
		const r = anchor.getBoundingClientRect();
		const w = card.offsetWidth;
		const h = card.offsetHeight;
		const limit = (document.getElementById('sidebar')?.getBoundingClientRect().left || window.innerWidth) - 10;
		let left = Math.min(r.left, limit - w);
		let top = r.bottom + 8;
		const tile = anchor.closest('.sfh-tile');
		if (tile) {
			const drawer = anchor.closest('.sfh-drawer').getBoundingClientRect();
			top = Math.min(r.top, window.innerHeight - h - 10);
			left = drawer.right + 8 + w <= limit ? drawer.right + 8 : r.right + 8 + w <= limit ? r.right + 8 : r.left - w - 8;
		}
		if (top + h > window.innerHeight - 10) top = Math.max(10, r.top - h - 8);
		for (const other of this.#obstacles()) {
			const c = other.getBoundingClientRect();
			const overlaps = left < c.right && left + w > c.left && top < c.bottom && top + h > c.top;
			if (overlaps && c.left - w - 8 >= 10) left = c.left - w - 8;
			else if (overlaps) top = c.bottom + 8;
		}
		card.style.left = `${Math.max(10, left)}px`;
		card.style.top = `${Math.max(10, top)}px`;
	}

	static #hideCard() {
		this.#card()?.classList.remove('show');
		this.#previewing = null;
	}

	/* -------------------------------------------- */
	/*  What everything does                         */
	/* -------------------------------------------- */

	static #bind(el) {
		// Foundry's own right-click menu for its list, with whatever other modules add to it
		ui.nav?._createContextMenu?.(ui.nav._getContextMenuOptions, '.sfh-scene, .sfh-tile', {
			container: el,
			fixed: true,
			hookName: 'getSceneContextOptions',
			parentClassHooks: false,
		});
		el.addEventListener('click', (event) => this.#onClick(event));
		el.addEventListener('dblclick', (event) => {
			const id = event.target.closest('[data-scene-id]')?.dataset.sceneId;
			if (!id) return;
			clearTimeout(this.#click);
			const scene = game.scenes.get(id);
			if (game.user.isGM && !scene.active) scene.activate();
			else scene.view();
		});
		el.addEventListener('change', (event) => {
			if (event.target.matches('.sfh-level')) canvas.scene?.view({ level: event.target.value });
		});
		el.addEventListener('input', (event) => {
			if (!event.target.matches('.sfh-search')) return;
			this.#query = event.target.value;
			const at = event.target.selectionStart;
			this.render();
			const search = this.element.querySelector('.sfh-search');
			search.focus();
			search.setSelectionRange(at, at);
		});
		el.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && this.#drawerOpen) {
				this.#drawerOpen = false;
				this.#hideCard();
				this.render();
			}
			const id = event.target.closest?.('[data-scene-id]')?.dataset.sceneId;
			if (event.key === 'Enter' && id) game.scenes.get(id)?.view();
		});
		// the preview waits a moment, so crossing the bar does not flash every scene
		el.addEventListener('pointerover', (event) => {
			const target = event.target.closest('[data-scene-id]');
			clearTimeout(this.#hover);
			if (target) {
				clearTimeout(this.#leave);
				this.#hover = setTimeout(() => this.#showCard(target.dataset.sceneId, target), 250);
			} else if (this.#previewing) {
				this.#leave = setTimeout(() => this.#hideCard(), 300);
			}
		});
		el.addEventListener('pointerleave', () => {
			clearTimeout(this.#hover);
			if (this.#previewing) this.#leave = setTimeout(() => this.#hideCard(), 300);
			if (this.#peeking) {
				this.#peeking = false;
				this.render();
			}
		});
		// collapsed, it opens while the pointer is on it, if the setting says so
		el.addEventListener('pointerenter', () => {
			if (!this.collapsed || !game.settings.get(MOD, S.sceneBarHover)) return;
			this.#peeking = true;
			this.render();
		});
		// the GM reorders the bar by dragging, as in Foundry's list
		el.addEventListener('dragstart', (event) => {
			const id = event.target.closest?.('.sfh-scene')?.dataset.sceneId;
			if (!id || !game.user.isGM) return;
			this.#dragging = id;
			event.dataTransfer?.setData('text/plain', id);
		});
		el.addEventListener('dragover', (event) => {
			if (this.#dragging && event.target.closest('.sfh-scene')) event.preventDefault();
		});
		el.addEventListener('drop', async (event) => {
			const target = game.scenes.get(event.target.closest('.sfh-scene')?.dataset.sceneId);
			const scene = game.scenes.get(this.#dragging);
			this.#dragging = null;
			if (!scene || !target || scene === target) return;
			event.preventDefault();
			await scene.sortRelative({ sortKey: 'navOrder', target, siblings: game.scenes.filter((s) => s !== scene) });
		});
	}

	static async #onClick(event) {
		const scene = game.scenes.get(event.target.closest('[data-scene-id]')?.dataset.sceneId);
		const button = event.target.closest('[data-sact]');
		// a single click on a scene waits to see if it is a double
		if (scene && !button && !event.target.closest('#sfh-scenes-preview')) {
			clearTimeout(this.#click);
			this.#click = setTimeout(() => scene.view(), 220);
			return;
		}
		const folder = event.target.closest('[data-folder]')?.dataset.folder;
		if (folder) {
			this.#folder = folder;
			this.#query = '';
			return this.render();
		}
		if (!button || button.tagName === 'SELECT') return;
		const shown = game.scenes.get(this.#card()?.dataset.sceneId);
		switch (button.dataset.sact) {
			case 'drawer':
				this.#drawerOpen = !this.#drawerOpen;
				this.#hideCard();
				this.render();
				if (this.#drawerOpen) this.element.querySelector('.sfh-search')?.focus();
				return;
			case 'more':
				this.#drawerOpen = true;
				this.#folder = 'bar';
				this.#query = '';
				return this.render();
			case 'collapse': {
				// open for a look is still collapsed: the button opens it for good
				const collapsed = this.#keptCollapsed;
				this.#peeking = false;
				this.#combatCollapsed = false;
				this.#drawerOpen = false;
				this.#hideCard();
				await game.settings.set(MOD, S.sceneBarCollapsed, !collapsed);
				return this.render();
			}
			case 'back': return game.scenes.get(this.#previous)?.view();
			case 'view': return shown?.view();
			case 'activate': return shown?.activate();
			case 'preload': return shown && this.#preload(shown);
			case 'pull': return shown?.pullUsers(game.users);
			case 'initial': return shown && this.#captureView(shown);
			case 'config': return shown?.sheet?.render(true);
			case 'nav': return shown?.update({ navigation: !shown.navigation });
			case 'notes': return shown?.journal?.sheet?.render(true, shown.journalEntryPage ? { pageId: shown.journalEntryPage } : {});
			default: return null;
		}
	}

	/** Load it on every player's machine ahead of time, as the list's own Preload does. */
	static async #preload(scene) {
		this.#preloading.add(scene.id);
		if (this.#previewing === scene.id) this.#refreshCard();
		try {
			await game.scenes.preload(scene.id, { broadcast: true });
			this.#preloaded.add(scene.id);
			ui.notifications.info(game.i18n.format('SFH.Scenes.PreloadDone', { name: scene.name }));
		} finally {
			this.#preloading.delete(scene.id);
			if (this.#drawerOpen) this.render();
			else if (this.#previewing === scene.id) this.#refreshCard();
		}
	}

	/** Where the camera is now becomes where everyone starts, as the scene configuration's own Capture does. */
	static #captureView(scene) {
		if (!scene.isView || !canvas.stage) return null;
		const initial = { x: Math.round(canvas.stage.pivot.x), y: Math.round(canvas.stage.pivot.y), scale: canvas.stage.scale.x };
		ui.notifications.info(game.i18n.format('SFH.Scenes.InitialSet', { name: scene.name }));
		return scene.update({ initial });
	}

	static #refreshCard() {
		const id = this.#previewing;
		const anchor = id && (this.element?.querySelector(`[data-scene-id="${CSS.escape(id)}"]`));
		if (anchor) this.#showCard(id, anchor);
	}

	/* -------------------------------------------- */
	/*  What changes it                              */
	/* -------------------------------------------- */

	/** A new scene on the canvas: the one before it is where Back goes. */
	static noteView() {
		const id = canvas?.scene?.id ?? null;
		if (id && id !== this.#current) {
			if (this.#current) this.#previous = this.#current;
			this.#current = id;
		}
		this.schedule();
	}

	/** Out of the way while an encounter runs, if the setting says so, and back afterward. */
	static noteCombat() {
		const fighting = !!game.combats?.some((c) => c.started && (c.scene?.id ?? c.scene) === canvas?.scene?.id);
		const want = fighting && !!game.settings.get(MOD, S.sceneBarCombat);
		if (want !== this.#combatCollapsed) {
			this.#combatCollapsed = want;
			if (want) {
				this.#drawerOpen = false;
				this.#hideCard();
			}
			this.schedule();
		}
	}

	/** Collapsed from the start, if the setting says so. */
	static async ready() {
		if (game.settings.get(MOD, S.sceneBarStartCollapsed) && !game.settings.get(MOD, S.sceneBarCollapsed)) {
			await game.settings.set(MOD, S.sceneBarCollapsed, true);
		}
		this.noteView();
		this.noteCombat();
		this.#warnClashes();
	}

	/** Other modules that replace the same list. Both at once would fight over it. */
	static #warnClashes() {
		if (!game.user.isGM || !this.enabled) return;
		const clashes = ['monks-scene-navigation', 'compact-scene-navigation', 'crlngn-ui']
			.map((id) => game.modules.get(id))
			.filter((m) => m?.active);
		for (const m of clashes) ui.notifications.warn(game.i18n.format('SFH.Scenes.Clash', { module: m.title }));
	}
}
