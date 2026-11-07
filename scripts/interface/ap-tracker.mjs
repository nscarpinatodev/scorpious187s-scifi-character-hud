/**
 * Fallout 2d20's AP tracker, carried on the device.
 *
 * The system puts its tracker (Overseer AP and Party AP) into `#ui-bottom`, just before the macro
 * bar. With the bar on the device that fails, and the tracker is left loose in the page, where
 * Foundry's layout takes its width from the interface and pushes the sidebar in from the edge.
 * So the device carries it: the form goes onto the deck, and its counters stand either side of the
 * bar (styles/interface.css). It stays the system's own form, so its buttons, its typing and its
 * syncing between players are untouched.
 */
import { EL } from '../constants.mjs';

const ID = 'ap-tracker-app';

/** Put the tracker on the deck. True when it moved. */
export function holdApTracker(deck = document.getElementById(EL.deck)) {
	const form = document.getElementById(ID);
	if (!form || !deck || form.parentElement === deck) return false;
	deck.append(form);
	return true;
}

/** Give it back where the system keeps it: before the macro bar in `#ui-bottom`, the device being taken down. */
export function releaseApTracker() {
	const form = document.getElementById(ID);
	const bottom = document.getElementById('ui-bottom');
	if (!form || !bottom || form.parentElement === bottom) return;
	bottom.insertBefore(form, bottom.querySelector(':scope > #hotbar'));
}

/**
 * The system's tracker places itself on its first render with `#ui-bottom.insertBefore(tracker,
 * #hotbar)`, which throws while the bar is on the device rather than directly in `#ui-bottom`.
 * The throw ends the render there: the tracker is left loose in the page, its own `_onRender`
 * never runs and no render hook is called. So that one failure is caught, and the device takes
 * the tracker instead; any other error is the system's to report. Wrapped once, before the
 * system draws the tracker in its `ready` hook.
 */
const ADOPTED = Symbol('sfh-ap-tracker');
export function adoptApTracker(Tracker = globalThis.fallout?.APTrackerV2) {
	const proto = Tracker?.prototype;
	if (!proto?._onFirstRender || proto[ADOPTED]) return false;
	const first = proto._onFirstRender;
	proto._onFirstRender = async function (...args) {
		try {
			return await first.apply(this, args);
		} catch (err) {
			if (err?.name === 'NotFoundError' && holdApTracker()) return undefined;
			throw err;
		}
	};
	proto[ADOPTED] = true;
	return true;
}

/** The width the tracker's counters take on the deck, with the gaps beside them. */
export function apTrackerWidth(deck) {
	const form = deck?.querySelector(`:scope > #${ID}`);
	if (!form) return 0;
	const gap = parseFloat(getComputedStyle(deck).columnGap) || 0;
	return [...form.children].filter((el) => el.offsetWidth).reduce((sum, el) => sum + el.offsetWidth + gap, 0);
}
