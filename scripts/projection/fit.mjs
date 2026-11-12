/**
 * Making a panel of cells fit what is put in it.
 *
 * The cells are drawn to a size, and what goes in them is not: a system's own words, in whatever
 * language, in whatever font the player has chosen. A stylesheet can let a label of several words
 * wrap, but it cannot make one long word narrower, nor know that a panel has come out a line too
 * tall. So once a panel is drawn it is measured:
 *
 *  - a label wider than its cell is set a little smaller, half a pixel at a time, until it fits or
 *    has given up three tenths of its size;
 *  - a panel of cells taller than its slot is drawn a little smaller as a whole, down to four
 *    fifths, so that nothing in it is cut off at the foot of the slot. Past that it scrolls, as
 *    it did before.
 *
 * Both are undone before measuring, so a panel that fits is left exactly as the stylesheet has it.
 */

const LABEL_FLOOR = 0.7;
const PANEL_FLOOR = 0.8;

function fitLabel(label) {
	label.style.fontSize = '';
	if (label.scrollWidth <= label.clientWidth + 0.5) return;
	const full = parseFloat(getComputedStyle(label).fontSize);
	if (!full) return;
	for (let size = full - 0.5; size >= full * LABEL_FLOOR; size -= 0.5) {
		label.style.fontSize = `${size}px`;
		if (label.scrollWidth <= label.clientWidth + 0.5) return;
	}
}

function fitPanel(cells) {
	cells.style.zoom = '';
	// smaller text wraps differently, so one step may not land: look again, a few times at most
	for (let step = 0; step < 4; step++) {
		if (cells.scrollHeight <= cells.clientHeight + 0.5) return;
		const now = Number(cells.style.zoom) || 1;
		const next = Math.max(PANEL_FLOOR, now * (cells.clientHeight / cells.scrollHeight) - 0.004);
		if (next >= now) return;
		cells.style.zoom = next.toFixed(3);
	}
}

/** Fit every panel of cells on the stage. A stage that is not shown measures as nothing and is left alone. */
export function fitCells(stage) {
	if (!stage?.isConnected || !stage.offsetParent) return;
	for (const cells of stage.querySelectorAll('.slot > .cells.scroll')) cells.style.zoom = '';
	for (const label of stage.querySelectorAll('.cell .lbl')) fitLabel(label);
	for (const cells of stage.querySelectorAll('.slot > .cells.scroll')) fitPanel(cells);
}
