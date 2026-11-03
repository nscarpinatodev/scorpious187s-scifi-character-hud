/**
 * What other modules put at the top of the screen that ours keep clear of: Calendaria's HUD,
 * wherever it is stuck. It can be dragged, resized, opened and closed, so whatever keeps clear of
 * it is told when it changes.
 */

const listeners = new Set();
let watched = null;
let observers = [];

const tell = () => {
	for (const listener of listeners) listener();
};

/** What is on the screen now, as elements. Something hidden is not in the way. */
export function topObstacles() {
	return [document.getElementById('calendaria-hud')]
		.filter((el) => el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
}

/** Be told whenever any of them moves, changes size, or comes and goes. */
export function watchObstacles(listener) {
	listeners.add(listener);
	refreshObstacles();
}

/** Look again for them: an application has opened or closed, and it may be one. */
export function refreshObstacles() {
	const hud = document.getElementById('calendaria-hud');
	if (hud === watched) return;
	for (const o of observers) o.disconnect();
	observers = [];
	watched = hud;
	if (hud) {
		const resized = new ResizeObserver(tell);
		resized.observe(hud);
		const moved = new MutationObserver(tell);
		moved.observe(hud, { attributes: true, attributeFilter: ['style', 'class'] });
		observers = [resized, moved];
	}
	// it has appeared or gone, which is a change in itself
	tell();
}
