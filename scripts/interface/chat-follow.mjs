/**
 * The chat log keeps following new messages.
 *
 * Foundry follows a new message down only if the log was at its bottom, and it learns that from
 * the log's scroll events: a scroll that leaves the log short of its bottom is taken for the
 * player having scrolled up, and from then on nothing is followed until they scroll down
 * themselves. Two things leave the log short of its bottom without the player doing anything.
 *
 * The log grows under them. Foundry draws the chat and scrolls it to its bottom as the world
 * loads; a moment later the HUD dresses the page as the device (its face, its chat cards) and
 * every message grows. A browser keeps what is in view where it was when the text above it grows,
 * so the log is left short of its bottom, with a scroll event that says so. It was, on every
 * load. A font arriving late, or a card redrawn, does the same. So each log's size is watched,
 * and when it changes while the log was at its bottom, it is put back there, before the scroll
 * event is read.
 *
 * The tab is hidden. A browser holds scroll events back while the tab is out of sight (another
 * tab in front, the window minimized or covered) and delivers the last one when it is shown again,
 * by when a message may have grown or redrawn after it was scrolled to; nor is a size watched
 * while the tab is hidden. So when the tab is hidden, each log at its bottom is remembered, and
 * when the tab is shown it is put back at its bottom, before the held-back event is read. A tab
 * that loaded the world while hidden has never been seen, so the player cannot have scrolled it:
 * its logs are all put at their bottom when it is first shown.
 *
 * Either way, a log the player had scrolled up is left where they put it. Both the sidebar's log
 * and a popped-out one.
 */

let watching = false;
let following = [];
// loaded while hidden, and not yet seen
let unseen = false;
const kept = new WeakSet();

/** The chat logs drawn now: the sidebar's, and a popped-out one. */
const logs = () => [globalThis.ui?.chat, globalThis.ui?.chat?.popout].filter((app) => app?.rendered);

/** How far a log is from its bottom, in pixels. */
const gap = (scroll) => scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop;

function onVisibility() {
	if (document.hidden) {
		if (!unseen) following = logs().filter((app) => app.isAtBottom === true);
		return;
	}
	for (const app of unseen ? logs() : following) if (app.rendered) app.scrollBottom();
	following = [];
	unseen = false;
}

/**
 * Keep one log at its bottom through a change of size, if it was there before the change. Foundry's
 * own mark says where it was: a resize is seen after the browser has laid the page out and before
 * the scroll that layout caused is delivered, so the mark is still the one from before the change,
 * and putting the log back then is in time. The mark is Foundry's, not a reckoning of our own,
 * because what counts as the bottom is its to decide, and has changed (within a hundredth of the
 * log's length up to 14.369, within twenty pixels from 14.370).
 */
export function keepFollowing(app) {
	const scroll = app?.element?.querySelector?.('.chat-scroll');
	const log = scroll?.querySelector('.chat-log');
	if (!scroll || !log || kept.has(scroll)) return;
	kept.add(scroll);
	const resized = new ResizeObserver(() => {
		if (app.isAtBottom !== true || gap(scroll) < 1 || !app.rendered || !scroll.isConnected) return;
		app.scrollBottom();
	});
	resized.observe(log);
	resized.observe(scroll);
}

/** Watch the tab being hidden and shown, and the logs drawn now. Safe to call more than once. */
export function followChat() {
	for (const app of logs()) keepFollowing(app);
	if (watching) return;
	watching = true;
	unseen = document.hidden;
	document.addEventListener('visibilitychange', onVisibility);
}
