import { S } from './constants.mjs';
import { setting } from './settings.mjs';
import { getTheme } from './themes.mjs';
import { mountReadout } from './readout.mjs';
import { mountExtras, extrasEnabled } from './me-extras.mjs';
import { buildBar, observeSize, playSequence, themeFor, isHidden, setHidden, staggerSlots } from './shell.mjs';

/**
 * The ApplicationV2 shell, for sheets like D&D 5e's.
 *
 * Same principle as the PF2e shell: the sheet's content element becomes our grid, and the
 * blocks the system rendered are assigned to slots where they stand. Nothing is re-parented,
 * so the system's own `.window-content > …` selectors keep matching and its parts can
 * re-render into place. What changes is where those blocks sit and what the frame around
 * them looks like.
 *
 * ApplicationV2 replaces part elements on every render, which wipes the `data-slot` marks,
 * so this runs again after each render.
 */
export function applyDockShell(app, root) {
	if (!root) return;
	const content = root.querySelector('.window-content');
	if (!content) return;

	const actor = app.actor ?? app.document;
	const themeId = themeFor(actor);
	const theme = getTheme(themeId);
	const chrome = setting(S.chrome);

	for (const old of content.querySelectorAll(':scope > .sfh-own')) old.remove();

	content.classList.add('sfh-frame', 'sfh-v2-frame');
	content.dataset.hudTheme = themeId;
	content.dataset.chrome = chrome;
	content.dataset.sequence = theme.sequence;
	content.dataset.size = content.dataset.size ?? 'wide';
	content.dataset.drawer = content.dataset.drawer ?? 'closed';
	content.dataset.scanlines = setting(S.scanlines) ? 'on' : 'off';

	assignSlots(content);

	if (chrome !== 'clean') {
		const art = document.createElement('div');
		art.className = 'sfh-art sfh-own';
		art.dataset.chrome = chrome;
		art.innerHTML = theme.art();
		content.appendChild(art);
	}

	const bar = buildBar(app, themeId);
	bar.classList.add('sfh-slot', 'sfh-own');
	bar.dataset.slot = 'bar';
	content.appendChild(bar);

	if (extrasEnabled(actor)) {
		const extras = document.createElement('aside');
		extras.classList.add('sfh-own');
		content.appendChild(extras);
		mountExtras(app, extras);
	}

	if (setting(S.readout)) {
		const readout = document.createElement('aside');
		readout.classList.add('sfh-own');
		content.appendChild(readout);
		mountReadout(app, readout, content);
	}

	const glass = document.createElement('div');
	glass.className = 'sfh-glass sfh-own';
	content.appendChild(glass);

	staggerSlots(content);

	root.classList.add('sfh-app', 'sfh-framed');
	root.classList.toggle('sfh-hidden', isHidden());
	root.style.setProperty('--sfh-scale', String(setting(S.scale)));
	observeSize(app, root, content);

	if (!app._sfhBooted) {
		app._sfhBooted = true;
		if (isHidden()) setHidden(false);
		playSequence(content, 'on');
	}
}

/**
 * Work out which of the sheet's blocks goes in which slot.
 *
 * The 5e sheet groups its parts into containers, and whether the tab bodies sit beside the
 * sidebar or inside its container has changed between releases — so both shapes are
 * handled, and anything unrecognised is given a full-width row of its own rather than being
 * hidden or stacked on top of something else.
 */
function assignSlots(content) {
	const children = [...content.children].filter((el) => !el.classList.contains('sfh-own'));
	const part = (name) => children.find((el) => el.dataset.applicationPart === name);

	const header = part('header') ?? children.find((el) => el.matches('.sheet-header, header'));
	const navTabs = part('tabs') ?? children.find((el) => el.matches('nav.tabs, .tabs-right'));
	const scores = part('abilityScores') ?? children.find((el) => el.matches('.ability-scores'));
	const warnings = part('warnings');
	/*
	 * 5e assembles this in `_onFirstRender`: `.sheet-body` wraps `.main-content`, which
	 * holds `.sidebar` and `.tab-body`. So the block we place is `.sheet-body`, and the
	 * sidebar stays where 5e put it — pulling it out would break `.main-content > .sidebar`.
	 */
	const main = children.find((el) => el.matches('.sheet-body, .main-content'));
	const ownTabBody = children.find((el) => el.matches('.tab-body'));

	const mark = (el, slot) => {
		if (!el) return;
		el.classList.add('sfh-slot');
		el.dataset.slot = slot;
	};

	mark(header, 'identity');
	mark(navTabs, 'nav');
	mark(scores, 'scores');
	mark(warnings, 'warnings');

	if (ownTabBody) {
		// Sidebar and tab bodies are siblings: the sidebar becomes our side slot.
		mark(main, 'aside');
		mark(ownTabBody, 'projection');
		content.dataset.hasAside = 'yes';
	} else {
		// Everything lives inside the main container: it is the projection, and 5e keeps
		// arranging its own sidebar inside it.
		mark(main, 'projection');
		content.dataset.hasAside = 'no';
	}

	for (const el of children) {
		if (!el.dataset.slot) {
			el.classList.add('sfh-slot');
			el.dataset.slot = 'loose';
		}
	}
}
