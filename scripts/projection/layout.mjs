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
	wrist: { w: 1280, h: 860 },
	gdi: { w: 1280, h: 860 },
	nod: { w: 1280, h: 860 },
};

/**
 * Slot rectangles: [x, y, width, height].
 * @param {string} device
 * @param {boolean} extras  Whether the Mass Effect dossier panel is shown.
 */
export function layout(device, extras) {
	if (device === 'omni') {
		return {
			identity: [250, 20, 780, 60],
			vitals: [28, 96, 204, 300],
			effects: extras ? [28, 408, 204, 112] : [28, 408, 204, 318],
			extras: [28, 532, 204, 194],
			defenses: [1048, 96, 204, 250],
			readout: [1048, 360, 204, 366],
			projection: [250, 92, 780, 470],
			nav: [250, 580, 780, 120],
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
	// EVA, both schemes
	return {
		identity: [26, 24, 1228, 50],
		vitals: [26, 258, 262, 236],
		effects: extras ? [26, 506, 262, 104] : [26, 506, 262, 330],
		extras: [26, 622, 262, 214],
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
