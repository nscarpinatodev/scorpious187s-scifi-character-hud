/**
 * Where each panel sits, in the mock-up's own coordinates (design/6-app.js).
 *
 * The projection is drawn on a fixed board and scaled to whatever room the interface
 * leaves, so the proportions are the approved ones at every window size. Nothing here is
 * responsive by design: the board is, as a whole.
 */

/** The board each device's layout was drawn on. */
export const BOARD = {
	// The arm belongs to the interface now, so the board ends where the panels do (726) and
	// its foot is set on the arm plate itself — anything more is empty space holding the
	// sheet up off the device.
	omni: { w: 1280, h: 728 },
	tron: { w: 1280, h: 728 },
	wrist: { w: 1280, h: 860 },
	gdi: { w: 1280, h: 860 },
	nod: { w: 1280, h: 860 },
	// the open book: 1200 × 800 of pages at 40,34, in a cover that overhangs them by 38
	journal: { w: 1280, h: 860 },
};

/** The dossier's parts, in board pixels: its heading, a shields bar, a Paragon or Renegade track. */
const DOSSIER = { head: 20, shields: 26, track: 36, gap: 10 };

/**
 * How tall the Mass Effect dossier needs to be for what it shows. Where it shares a column
 * with the effects panel, the effects panel gets the rest.
 * @param {string} device
 * @param {object|null} x  What readDossier() found, or nothing.
 */
export function dossierHeight(device, x) {
	if (!x) return 0;
	const rows = [x.shields && DOSSIER.shields, x.paragon != null && DOSSIER.track, x.renegade != null && DOSSIER.track]
		.filter(Boolean);
	const body = rows.reduce((h, row) => h + DOSSIER.gap + row, 0);
	// the EVA's caption and bay padding stand in for the panel's own heading
	if (device === 'gdi' || device === 'nod') return 46 + body - DOSSIER.gap;
	return 26 + DOSSIER.head + body;
}

/**
 * Slot rectangles: [x, y, width, height].
 * @param {string} device
 * @param {number} dossier  The dossier's height (dossierHeight()), or 0 when it is not shown.
 */
export function layout(device, dossier = 0) {
	const extras = dossier > 0;
	// TRON stands on a plate as the omni-tool does, and lays out the same way
	if (device === 'omni' || device === 'tron') {
		// the effects and the dossier share the column under the vitals, 370–726
		const d = Math.min(dossier, 194);
		return {
			identity: [250, 20, 780, 60],
			vitals: [28, 96, 204, 262],
			effects: extras ? [28, 370, 204, 344 - d] : [28, 370, 204, 356],
			extras: [28, 726 - d, 204, d],
			defenses: [1048, 96, 204, 250],
			readout: [1048, 360, 204, 366],
			projection: [250, 92, 780, 470],
			nav: [250, 580, 780, 120],
		};
	}
	/*
	 * The Journal: an open book (ornaments.mjs). The main body is written on the left page;
	 * everything else is kept as notes on the right, under the name: hit points beside the
	 * defenses, the conditions and the dossier below them, and the readout on a card tucked
	 * into the page. The index tabs are cut into the left page's fore-edge, over the cover's
	 * overhang.
	 */
	if (device === 'journal') {
		const d = Math.min(dossier, 140);
		return {
			identity: [684, 50, 536, 104],
			vitals: [684, 170, 256, 310],
			defenses: [964, 170, 256, 300],
			effects: extras ? [684, 494, 256, 300 - d - 12] : [684, 494, 256, 300],
			extras: [684, 794 - d, 256, d],
			readout: [966, 486, 250, 304],
			projection: [98, 60, 508, 746],
			nav: [10, 92, 38, 660],
		};
	}
	if (device === 'wrist') {
		return {
			identity: [24, 14, 286, 204],
			vitals: [322, 14, 420, 204],
			defenses: extras ? [754, 14, 238, 204] : [754, 14, 502, 204],
			extras: [1004, 14, 252, 204],
			projection: [228, 266, 604, 532],
			effects: [844, 266, 208, 150],
			readout: [844, 428, 208, 370],
			nav: [24, 266, 188, 532],
		};
	}
	// EVA, both schemes: the effects and the dossier share the bay under the vitals, 530–836
	const d = Math.min(dossier, 214);
	return {
		identity: [26, 24, 1228, 50],
		vitals: [26, 258, 262, 260],
		effects: extras ? [26, 530, 262, 294 - d] : [26, 530, 262, 306],
		extras: [26, 836 - d, 262, d],
		projection: [300, 86, 664, 660],
		defenses: [300, 758, 664, 78],
		readout: [976, 322, 278, 200],
		nav: [1006, 534, 248, 302],
	};
}

/** The EVA console captions its bays; the other devices do not. */
export const EVA_CAP = {
	vitals: 'Unit Status',
	effects: 'Effects',
	extras: 'Dossier',
	readout: 'Intel',
	defenses: null,
	identity: null,
	projection: null,
};

/** The order panels rise in, and how far apart, when the device powers up. */
export const SEQ_ORDER = {
	projection: 0,
	identity: 1,
	vitals: 2,
	defenses: 3,
	effects: 4,
	extras: 5,
	readout: 6,
};
