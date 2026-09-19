import { S } from './constants.mjs';
import { setting } from './settings.mjs';
import { getTheme } from './themes.mjs';
import { mountReadout } from './readout.mjs';
import { mountExtras, extrasEnabled } from './me-extras.mjs';
import { buildBar, observeSize, playSequence, themeFor, isHidden, setHidden } from './shell.mjs';

/**
 * The ApplicationV2 shell, for sheets like D&D 5e's.
 *
 * These sheets re-render individual parts on their own schedule, so moving their elements
 * around would be undone the moment a part refreshes. Instead we leave the system's layout
 * exactly where it is and dock our own panels beside it, making room with padding. The
 * system keeps full control of its content; we own the frame, the art and the side panels.
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

	content.classList.add('sfh-frame', 'sfh-dock');
	content.dataset.hudTheme = themeId;
	content.dataset.chrome = chrome;
	content.dataset.sequence = theme.sequence;
	content.dataset.size = content.dataset.size ?? 'wide';
	content.dataset.drawer = content.dataset.drawer ?? 'closed';
	content.dataset.scanlines = setting(S.scanlines) ? 'on' : 'off';

	if (chrome !== 'clean') {
		const art = document.createElement('div');
		art.className = 'sfh-art sfh-own';
		art.dataset.chrome = chrome;
		art.innerHTML = theme.art();
		content.appendChild(art);
	}

	const bar = buildBar(app, themeId);
	bar.classList.add('sfh-own');
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

	root.classList.add('sfh-app');
	root.classList.toggle('sfh-hidden', isHidden());
	root.style.setProperty('--sfh-scale', String(setting(S.scale)));
	observeSize(app, root, content);

	if (!app._sfhBooted) {
		app._sfhBooted = true;
		if (isHidden()) setHidden(false);
		playSequence(content, 'on');
	}
}
