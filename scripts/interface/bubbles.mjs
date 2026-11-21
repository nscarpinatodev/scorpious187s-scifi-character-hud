/**
 * Speech bubbles over tokens: sized for what they say, and up long enough to read.
 *
 * Foundry sizes a bubble from a hidden copy it puts straight on the page's body, then draws the
 * real one in the canvas overlay. The stylesheet gives that copy the device's face, as the overlay
 * has it (styles/interface.css); what it cannot know is whether the bubble is an emote, which
 * Foundry draws in italics but measures upright. So while a bubble is being made, the page is
 * marked with its kind, for the stylesheet to dress the copy the same way. Foundry measures it
 * straight after the hook below, before anything else runs, and the mark is gone just after.
 *
 * Foundry keeps a bubble up for a fifth of a second a word (300 words a minute), and never less
 * than a second: a line of six words was gone in just over one. A bubble now stays for two and a
 * half seconds and then three tenths of a second a word, read at 200 words a minute, as long as
 * Foundry's twenty seconds at the most. Its fade-out is held back by the difference; a long one
 * that scrolls is scrolled over the same, longer time. A new bubble from the same token still
 * replaces the old one at once.
 */

const FLOOR = 2500;
const PER_WORD = 300;
const MOST = 20000;

/** The words in a bubble, counted as Foundry counts them. */
const wordsIn = (html) => (html.textContent ?? '').split(/\s+/).filter((w) => w.trim().length).length;

/** How long Foundry keeps a bubble up (ChatBubbles#getDuration). */
export const foundryMs = (words) => Math.clamp(1000, (words * 60 * 1000) / 300, 20000);

/** How long it stays up here. */
export const readingMs = (words) => Math.min(MOST, Math.max(foundryMs(words), FLOOR + words * PER_WORD));

const fadesOut = (keyframes) => Array.isArray(keyframes?.opacity) && keyframes.opacity[0] === 1 && keyframes.opacity.at(-1) === 0;

/** A stand-in for an animation that has not started yet: Foundry only waits on its end. */
const later = (ms, start) => ({ finished: new Promise((r) => setTimeout(r, ms)).then(() => start().finished) });

/** The chatBubbleHTML hook: mark the page for the measuring copy, and give the bubble its time. */
export function dressBubble(token, html, message, options = {}) {
	if (!(html instanceof HTMLElement)) return;
	const kinds = [...(options.cssClasses ?? [])].filter((c) => typeof c === 'string' && c).join(' ');
	// each bubble sets the mark for itself, so none is left over from the one before
	if (kinds) {
		document.body.dataset.sfhBubble = kinds;
		queueMicrotask(() => { if (document.body.dataset.sfhBubble === kinds) delete document.body.dataset.sfhBubble; });
	} else delete document.body.dataset.sfhBubble;

	const words = wordsIn(html);
	const extra = readingMs(words) - foundryMs(words);
	if (extra <= 0) return;
	const own = Element.prototype.animate;
	// Foundry fades the bubble out once its own time is up; that is held back by the difference
	html.animate = function (keyframes, opts) {
		if (!fadesOut(keyframes)) return own.call(this, keyframes, opts);
		return later(extra, () => own.call(this, keyframes, opts));
	};
	// and a bubble too long for itself scrolls its words over that time, less the last second
	const inner = html.querySelector('.bubble-content');
	if (inner) {
		inner.animate = function (keyframes, opts) {
			if (keyframes?.top && opts?.duration) opts = { ...opts, duration: opts.duration + extra };
			return own.call(this, keyframes, opts);
		};
	}
}
