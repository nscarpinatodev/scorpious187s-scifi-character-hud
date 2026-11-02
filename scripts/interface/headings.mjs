import { MOD, S } from '../constants.mjs';

/**
 * The sidebar's headings: their color, and a size that fits.
 *
 * Foundry's section headings don't wrap, and are sized for its own narrow body font. In a
 * device's display face they run off both sides of the sidebar. CSS cannot size text to its
 * content, so they are measured here: all the headings of a kind in a tab share one size, the
 * one that lets the longest of them fill the width. They only ever shrink from the size Foundry
 * gave them, and below a size that can be read they wrap instead.
 *
 * Chat is left out: a long log would be measured on every message, and a card's headings wrap.
 */

/** Below this a heading stops shrinking and wraps. */
const SMALLEST = 11;

const HEADINGS = 'h1, h2, h3, h4, legend';

/** How wide a heading's text is, and how much room it has, in its own pixels. */
function measure(el) {
	const style = getComputedStyle(el);
	const box = el.getBoundingClientRect();
	if (!box.width) return null;
	// the interface can be scaled, which rectangles see and offsetWidth does not
	const scale = box.width / el.offsetWidth || 1;
	let room = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
	const size = parseFloat(style.fontSize);

	// a heading that may wrap only overflows on a single word too long for it
	if (style.whiteSpace !== 'nowrap') {
		return { size, ratio: el.scrollWidth > el.clientWidth + 1 ? el.clientWidth / el.scrollWidth : 1 };
	}

	// a divider's rules keep their margins however far they are squeezed
	for (const pseudo of ['::before', '::after']) {
		const rule = getComputedStyle(el, pseudo);
		if (rule.content !== 'none') room -= parseFloat(rule.marginLeft) + parseFloat(rule.marginRight);
	}
	const range = document.createRange();
	range.selectNodeContents(el);
	const text = range.getBoundingClientRect().width / scale;
	return { size, ratio: text > room ? room / text : 1 };
}

/** Fit the headings of the visible tab. Anything hidden measures as nothing, so it waits its turn. */
export function fitHeadings() {
	const tab = document.querySelector('#sidebar-content .sidebar-tab.active');
	if (!tab) return;
	const headings = [...tab.querySelectorAll(HEADINGS)].filter((el) => !el.closest('.chat-log'));

	// back to Foundry's size first, then measure everything, then write: one layout, not one each
	for (const el of headings) {
		el.style.removeProperty('font-size');
		el.style.removeProperty('white-space');
	}
	if (!document.body.dataset.sfhDevice) return;

	const groups = new Map();
	for (const el of headings) {
		const fit = measure(el);
		if (!fit) continue;
		const key = `${el.tagName}.${el.className}`;
		const group = groups.get(key) ?? { size: fit.size, ratio: 1, members: [] };
		group.ratio = Math.min(group.ratio, fit.ratio);
		group.members.push(el);
		groups.set(key, group);
	}
	for (const { size, ratio, members } of groups.values()) {
		if (ratio >= 1) continue;
		const fitted = size * ratio;
		for (const el of members) {
			el.style.fontSize = `${Math.max(fitted, SMALLEST).toFixed(2)}px`;
			if (fitted < SMALLEST) el.style.whiteSpace = 'normal';
		}
	}
}

let scheduled = false;

/** Fit once the current burst of changes is over. */
export function scheduleFitHeadings() {
	if (scheduled) return;
	scheduled = true;
	requestAnimationFrame(() => {
		scheduled = false;
		fitHeadings();
	});
}

let watched = null;

/**
 * Refit when the tab changes, a tab is drawn again, or the sidebar changes width. Only classes
 * and children are watched, so writing a size here cannot set it off again. Safe to call
 * repeatedly: Foundry can replace the sidebar's element.
 */
export function watchHeadings() {
	const sidebar = document.getElementById('sidebar');
	if (!sidebar || sidebar === watched) return;
	watched = sidebar;
	new MutationObserver((records) => {
		if (records.some((r) => !r.target.closest?.('.chat-log'))) scheduleFitHeadings();
	}).observe(sidebar, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
	new ResizeObserver(scheduleFitHeadings).observe(sidebar);
	document.fonts?.addEventListener('loadingdone', scheduleFitHeadings);
	scheduleFitHeadings();
}

/** The color the player chose for headings, if any: the field hands back a Color or a string. */
export function headingColor() {
	const value = game.settings.get(MOD, S.headingColor);
	return value ? String(value.css ?? value) : '';
}

/** Put the chosen color on <body>; without one, device.css uses the device's main color. */
export function applyHeadingColor() {
	const { style, dataset } = document.body;
	const color = headingColor();
	if (color) {
		style.setProperty('--sfh-heading-color', color);
		dataset.sfhHeadingColor = '';
	} else {
		style.removeProperty('--sfh-heading-color');
		delete dataset.sfhHeadingColor;
	}
}
