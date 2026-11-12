import { MOD, S } from '../constants.mjs';

/**
 * D&D 5e's sheet tabs as a labeled row.
 *
 * The system hangs its tabs down the outside of a character's, an NPC's and a vehicle's sheet, as
 * icons that name themselves only when hovered. With the setting on, the same tabs are laid in a
 * row across the sheet, between its header and its body, each with its name beside its icon. They
 * are still the system's own tabs: its markup, its click handling, its colors. Only where they sit
 * and what they show changes, in styles/sheet-tabs.css; what cannot be done in a stylesheet is done
 * here, each time a sheet is drawn:
 *
 *  - the name is written into each tab, and its tooltip, which only repeated the name, is put away;
 *  - the side the tabs hung on is put away too, because the system keeps a sheet that far from the
 *    edge of the screen, and a row inside the sheet needs no such room;
 *  - a row too long for its sheet scrolls, by the wheel or by an arrow at whichever end has more.
 *
 * All of it is undone when the setting goes off. Where Carolingian UI is laying the tabs out
 * itself, this stands down.
 */

const SHEETS = '.dnd5e2.sheet.actor.vertical-tabs';
const SIDES = ['tabs-right', 'tabs-left'];

/** The rows that are dressed, and the ones whose listeners are already on. */
const dressed = new WeakSet();
const wired = new WeakSet();
let watcher = null;

const wanted = () => game.system?.id === 'dnd5e'
	&& !!game.settings.get(MOD, S.sheetTabs)
	&& !document.body.classList.contains('crlngn-sheet-tabs');

const label = (key, fallback) => {
	const text = game.i18n?.localize?.(key);
	return text && text !== key ? text : fallback;
};

/** Whether the row has more than it shows, and at which end. */
function mark(nav) {
	if (!dressed.has(nav)) return;
	const more = nav.scrollWidth - nav.clientWidth;
	nav.classList.toggle('sfh-overflows', more > 1);
	const [earlier, later] = ['earlier', 'later'].map((k) => nav.querySelector(`:scope > .sfh-tab-step.${k}`));
	if (earlier) earlier.hidden = more <= 1 || nav.scrollLeft <= 1;
	if (later) later.hidden = more <= 1 || nav.scrollLeft >= more - 1;
}

/** Bring the open tab into the row's view, without scrolling anything but the row. */
function reveal(nav) {
	if (!dressed.has(nav)) return;
	const tab = nav.querySelector(':scope > .item.active');
	if (!tab || nav.scrollWidth - nav.clientWidth <= 1) return;
	const room = 28;	// an arrow's width, so the tab is not left under one
	const left = tab.offsetLeft - room;
	const right = tab.offsetLeft + tab.offsetWidth + room;
	if (left < nav.scrollLeft) nav.scrollLeft = Math.max(0, left);
	else if (right > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = right - nav.clientWidth;
	mark(nav);
}

function wire(nav) {
	if (wired.has(nav)) return;
	wired.add(nav);
	nav.addEventListener('scroll', () => mark(nav), { passive: true });
	// the wheel turns the row sideways, where there is a row to turn
	nav.addEventListener('wheel', (event) => {
		if (!dressed.has(nav) || nav.scrollWidth - nav.clientWidth <= 1 || !event.deltaY || event.deltaX) return;
		nav.scrollLeft += event.deltaY;
		event.preventDefault();
	}, { passive: false });
	// the system lights the tab in its own handler; look once it has
	nav.addEventListener('click', (event) => {
		if (event.target.closest?.('.item')) requestAnimationFrame(() => reveal(nav));
	});
	watcher ??= typeof ResizeObserver === 'function' ? new ResizeObserver((entries) => {
		for (const entry of entries) {
			if (entry.target.isConnected) mark(entry.target);
			else watcher.unobserve(entry.target);
		}
	}) : null;
	watcher?.observe(nav);
}

function step(nav, way) {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = `sfh-tab-step ${way}`;
	button.hidden = true;
	button.tabIndex = -1;
	button.setAttribute('aria-label', way === 'earlier'
		? label('SFH.SheetTabs.Earlier', 'Earlier tabs')
		: label('SFH.SheetTabs.Later', 'More tabs'));
	button.innerHTML = `<i class="fa-solid fa-caret-${way === 'earlier' ? 'left' : 'right'}" inert></i>`;
	button.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();
		nav.scrollBy({ left: (way === 'earlier' ? -1 : 1) * Math.max(120, nav.clientWidth * 0.6), behavior: 'smooth' });
	});
	return button;
}

function dress(nav) {
	// a sheet shown to someone with limited permission has no tabs, and the system hides the empty row
	if (!nav.querySelector(':scope > .item')) return;
	for (const side of SIDES) {
		if (!nav.classList.contains(side)) continue;
		nav.classList.remove(side);
		nav.dataset.sfhSide = side;
	}
	for (const tab of nav.querySelectorAll(':scope > .item')) {
		if (!tab.querySelector(':scope > .sfh-tab-label')) {
			const name = document.createElement('span');
			name.className = 'sfh-tab-label';
			name.textContent = tab.getAttribute('aria-label') ?? '';
			tab.append(name);
		}
		if ('tooltip' in tab.dataset) {
			tab.dataset.sfhTooltip = tab.dataset.tooltip;
			delete tab.dataset.tooltip;
		}
	}
	if (!nav.querySelector(':scope > .sfh-tab-step')) {
		nav.prepend(step(nav, 'earlier'));
		nav.append(step(nav, 'later'));
	}
	nav.classList.add('sfh-tab-row');
	dressed.add(nav);
	wire(nav);
	reveal(nav);
	mark(nav);
}

function undress(nav) {
	if (nav.dataset.sfhSide) {
		nav.classList.add(nav.dataset.sfhSide);
		delete nav.dataset.sfhSide;
	}
	for (const tab of nav.querySelectorAll(':scope > .item')) {
		tab.querySelector(':scope > .sfh-tab-label')?.remove();
		if ('sfhTooltip' in tab.dataset) {
			tab.dataset.tooltip = tab.dataset.sfhTooltip;
			delete tab.dataset.sfhTooltip;
		}
	}
	for (const button of nav.querySelectorAll(':scope > .sfh-tab-step')) button.remove();
	nav.classList.remove('sfh-tab-row', 'sfh-overflows');
	nav.scrollLeft = 0;
	dressed.delete(nav);
}

/** A sheet has been drawn, or one of its parts redrawn: its tabs are the system's again, so see to them. */
export function dressSheet(element) {
	if (game.system?.id !== 'dnd5e' || !element?.matches?.(SHEETS)) return;
	const on = wanted();
	document.body.dataset.sfhSheetTabs = on ? 'on' : 'off';
	for (const nav of element.querySelectorAll('nav.tabs')) {
		if (on) dress(nav);
		else if (dressed.has(nav) || nav.dataset.sfhSide) undress(nav);
	}
}

/** The setting has changed, or the game has just loaded: every open sheet follows. */
export function applySheetTabs() {
	if (game.system?.id !== 'dnd5e') return;
	document.body.dataset.sfhSheetTabs = wanted() ? 'on' : 'off';
	for (const element of document.querySelectorAll(SHEETS)) {
		dressSheet(element);
		// the system holds a sheet clear of the screen's edge by the width of its side tabs:
		// have it look again now that they have come or gone
		const app = globalThis.foundry?.applications?.instances?.get(element.id);
		try { app?.setPosition?.(); } catch { /* a sheet mid-close has nowhere to be put */ }
	}
}
