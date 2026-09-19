import { MOD, S, SEQ, SIZES, FLAG_THEME } from './constants.mjs';
import { setting } from './settings.mjs';
import { getTheme, DEFAULT_THEME, THEMES } from './themes.mjs';
import { mountReadout } from './readout.mjs';
import { mountExtras, extrasEnabled } from './me-extras.mjs';
import { openThemePicker } from './ui/theme-picker.mjs';

/**
 * The shell.
 *
 * We deliberately do NOT replace the system's sheet template. The system renders its own
 * markup, and then we move those elements — the same nodes, with the system's own listeners
 * already bound to them — into our layout, and add our own panels beside them. Nothing the
 * system draws is rewritten, so a system update changes the panels' contents and never the
 * HUD's structure.
 */

/** Slots, in the order they animate in. */
const SLOT_ORDER = ['projection', 'identity', 'bar', 'aside', 'extras', 'readout', 'nav'];

/** Sheets whose HUD is currently hidden by the keybinding. */
let hidden = false;

export function isHidden() {
	return hidden;
}

export function setHidden(value) {
	hidden = value;
	for (const el of document.querySelectorAll('.sfh-app')) el.classList.toggle('sfh-hidden', hidden);
	renderRestoreTab();
}

/**
 * While the HUD is hidden there has to be something to click, or the only way back is
 * remembering a keybinding. This is that something: a small tab at the screen edge.
 */
function renderRestoreTab() {
	const existing = document.getElementById('sfh-restore');
	if (!hidden) return existing?.remove();
	if (existing) return;

	const tab = document.createElement('button');
	tab.type = 'button';
	tab.id = 'sfh-restore';
	tab.className = 'sfh-restore';
	tab.innerHTML = `<i class="fa-solid fa-eye"></i><span>${game.i18n.format('SFH.Restore', { key: hideKeyLabel() })}</span>`;
	tab.addEventListener('click', () => setHidden(false));
	document.body.appendChild(tab);
}

/** The theme this actor uses: its own choice, else the world default. */
export function themeFor(actor) {
	const own = actor?.getFlag(MOD, FLAG_THEME);
	if (own && THEMES[own]) return own;
	const world = game.settings.get(MOD, S.defaultTheme);
	return THEMES[world] ? world : DEFAULT_THEME;
}

/**
 * Restructure a freshly rendered character sheet into the HUD.
 * @param {ActorSheet} app   the sheet application
 * @param {HTMLElement} form the sheet's root form element
 */
export function applyShell(app, form) {
	const actor = app.actor;
	const themeId = themeFor(actor);
	const theme = getTheme(themeId);
	const chrome = setting(S.chrome);

	// The form itself becomes the frame. We do not wrap the system's children: PF2e's own
	// CSS uses direct-child selectors such as `form > aside`, and a wrapper would quietly
	// unstyle the sidebar. Slots are assigned on the elements the system already rendered.
	for (const old of form.querySelectorAll(':scope > .sfh-own')) old.remove();

	const frame = form;
	frame.classList.add('sfh-frame');
	frame.dataset.hudTheme = themeId;
	frame.dataset.chrome = chrome;
	frame.dataset.sequence = theme.sequence;
	frame.dataset.size = frame.dataset.size ?? 'wide';
	frame.dataset.drawer = frame.dataset.drawer ?? 'closed';
	frame.dataset.scanlines = setting(S.scanlines) ? 'on' : 'off';

	// Classify what the system drew. Anything unrecognised (a module's injected block)
	// rides along in the identity slot, so nothing is ever dropped.
	const children = [...form.children].filter((el) => !el.classList.contains('sfh-own'));
	const pick = (sel) => children.find((el) => el.matches(sel));
	const aside = pick('aside');
	const header = pick('header, .char-header');
	const nav = pick('nav.sheet-navigation, nav[data-group="primary"]');
	const body = pick('.sheet-body, section.sheet-body');
	const rest = children.filter((el) => ![aside, header, nav, body].includes(el));

	const place = (el, slot) => {
		if (!el) return null;
		el.classList.add('sfh-slot');
		el.dataset.slot = slot;
		return el;
	};

	place(header, 'identity');
	for (const el of rest) place(el, 'identity');
	place(aside, 'aside');
	place(nav, 'nav');
	place(body, 'projection');

	// Art layer: the device and its backdrop, dropped entirely in `clean`.
	if (chrome !== 'clean') {
		const art = document.createElement('div');
		art.className = 'sfh-art sfh-own';
		art.dataset.chrome = chrome;    // `bare` keeps the backdrop, hides the device
		art.innerHTML = theme.art();
		frame.appendChild(art);
	}

	// Our own chrome bar, carrying the controls the window header used to.
	const bar = buildBar(app, themeId);
	bar.classList.add('sfh-slot', 'sfh-own');
	bar.dataset.slot = 'bar';
	frame.appendChild(bar);

	if (extrasEnabled(actor)) {
		const extras = document.createElement('aside');
		extras.classList.add('sfh-own');
		frame.appendChild(extras);
		mountExtras(app, extras);
	}

	if (setting(S.readout)) {
		const readout = document.createElement('aside');
		readout.classList.add('sfh-own');
		frame.appendChild(readout);
		mountReadout(app, readout, frame);
	}

	// Scanline / glass overlay sits above everything but takes no clicks.
	const glass = document.createElement('div');
	glass.className = 'sfh-glass sfh-own';
	frame.appendChild(glass);

	staggerSlots(frame);

	const root = app.element instanceof HTMLElement ? app.element : app.element?.[0];
	if (root) {
		root.classList.add('sfh-app');
		root.classList.toggle('sfh-hidden', hidden);
		root.style.setProperty('--sfh-scale', String(setting(S.scale)));
		observeSize(app, root, frame);
	}

	if (!app._sfhBooted) {
		app._sfhBooted = true;
		// Opening a sheet is a request to see it, so it comes back from hidden. A
		// re-render (damage, an item change) leaves a hidden HUD hidden.
		if (hidden) setHidden(false);
		playSequence(frame, 'on');
	}
}

/** Per-slot animation delays, so the sequence runs in a deliberate order. */
export function staggerSlots(frame) {
	for (const el of frame.querySelectorAll(':scope > [data-slot]')) {
		const i = SLOT_ORDER.indexOf(el.dataset.slot);
		const n = i < 0 ? SLOT_ORDER.length : i;
		el.style.setProperty('--sfh-d', `${n * 55}ms`);
		el.style.setProperty('--sfh-dr', `${(SLOT_ORDER.length - n) * 34}ms`);
	}
}

/**
 * Play an activation or shutdown sequence.
 * @returns {Promise<void>} resolves when it has finished.
 */
export function playSequence(frame, kind) {
	if (!frame) return Promise.resolve();
	const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
	if (reduced || !setting(S.sequences)) return Promise.resolve();
	frame.classList.remove('sfh-seq-on', 'sfh-seq-off');
	void frame.offsetWidth;                       // restart the animations
	frame.classList.add(kind === 'on' ? 'sfh-seq-on' : 'sfh-seq-off');
	return new Promise((resolve) => setTimeout(() => {
		frame.classList.remove('sfh-seq-on', 'sfh-seq-off');
		resolve();
	}, kind === 'on' ? SEQ.on : SEQ.off));
}

/* -------------------------------------------- */
/*  Chrome bar                                   */
/* -------------------------------------------- */

export function buildBar(app, themeId) {
	const bar = document.createElement('div');
	bar.className = 'sfh-bar';
	bar.innerHTML = `
		<button type="button" class="sfh-btn" data-sfh="drawer" data-tooltip="${game.i18n.localize('SFH.Bar.Panels')}" aria-label="${game.i18n.localize('SFH.Bar.Panels')}">
			<i class="fa-solid fa-table-columns"></i>
		</button>
		<button type="button" class="sfh-btn" data-sfh="chrome" data-tooltip="${game.i18n.localize('SFH.Bar.Chrome')}" aria-label="${game.i18n.localize('SFH.Bar.Chrome')}">
			<i class="fa-solid fa-image"></i>
		</button>
		<button type="button" class="sfh-btn" data-sfh="hide" data-tooltip="${game.i18n.localize('SFH.Bar.Hide')}" aria-label="${game.i18n.localize('SFH.Bar.Hide')}">
			<i class="fa-solid fa-eye-slash"></i>
		</button>
		<button type="button" class="sfh-btn" data-sfh="theme" data-tooltip="${game.i18n.localize('SFH.Bar.Theme')}" aria-label="${game.i18n.localize('SFH.Bar.Theme')}">
			<i class="fa-solid fa-palette"></i>
		</button>
		<button type="button" class="sfh-btn" data-sfh="sheet" data-tooltip="${game.i18n.localize('SFH.Bar.Sheet')}" aria-label="${game.i18n.localize('SFH.Bar.Sheet')}">
			<i class="fa-solid fa-gear"></i>
		</button>`;

	bar.addEventListener('click', async (event) => {
		const btn = event.target.closest('[data-sfh]');
		if (!btn) return;
		event.preventDefault();
		const frame = bar.closest('.sfh-frame');
		switch (btn.dataset.sfh) {
			case 'drawer':
				frame.dataset.drawer = frame.dataset.drawer === 'open' ? 'closed' : 'open';
				break;
			case 'chrome': {
				const order = ['full', 'bare', 'clean'];
				const next = order[(order.indexOf(setting(S.chrome)) + 1) % order.length];
				await game.settings.set(MOD, S.chrome, next);
				break;
			}
			case 'hide':
				setHidden(true);
				ui.notifications.info(game.i18n.format('SFH.HiddenHint', { key: hideKeyLabel() }));
				break;
			case 'theme':
				openThemePicker(app.actor, themeId);
				break;
			case 'sheet':
				new foundry.applications.apps.DocumentSheetConfig(app.actor).render(true);
				break;
		}
	});
	return bar;
}

/** Human-readable binding for the hide key, for the "press X to bring it back" notice. */
export function hideKeyLabel() {
	const binding = game.keybindings.get(MOD, 'hideHud')?.[0];
	if (!binding) return game.i18n.localize('SFH.Unbound');
	const mods = (binding.modifiers ?? []).join('+');
	const key = String(binding.key ?? '').replace(/^Key/, '').replace(/^Digit/, '');
	return mods ? `${mods}+${key}` : key;
}

/* -------------------------------------------- */
/*  Compact layout                               */
/* -------------------------------------------- */

/**
 * The layout follows the sheet's own width, not the window's, so a player who drags the
 * sheet narrow gets the compact arrangement without touching a setting.
 */
export function observeSize(app, root, frame) {
	const compactAt = setting(S.compactAt);
	const apply = (width) => {
		const size = width < SIZES.mini ? 'mini' : width < compactAt ? 'compact' : 'wide';
		if (frame.dataset.size !== size) {
			frame.dataset.size = size;
			// Side panels live in a drawer once there is no room for them.
			if (size === 'wide') frame.dataset.drawer = 'closed';
		}
	};
	apply(root.getBoundingClientRect().width);
	app._sfhResize?.disconnect();
	app._sfhResize = new ResizeObserver((entries) => {
		for (const entry of entries) apply(entry.contentRect.width);
	});
	app._sfhResize.observe(root);
}
