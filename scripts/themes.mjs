/**
 * Theme registry.
 *
 * A theme is a name, a set of CSS custom properties (in styles/themes.css, keyed off
 * `[data-hud-theme]`) and an optional art layer drawn behind the panels. Nothing here
 * knows anything about a game system: themes only decide how the HUD looks and where
 * the slots sit.
 */

export const THEMES = {
	omni: {
		id: 'omni',
		label: 'SFH.Theme.Omni',
		hint: 'SFH.Theme.OmniHint',
		/** How the activation sequence reads: panels rise out of the device. */
		sequence: 'rise',
		/** Art drawn behind the panels when chrome is `full`. */
		art: omniArt,
	},
	wrist: {
		id: 'wrist',
		label: 'SFH.Theme.Wrist',
		hint: 'SFH.Theme.WristHint',
		/** The whole case hinges at its base. */
		sequence: 'fold',
		art: wristArt,
	},
	gdi: {
		id: 'gdi',
		label: 'SFH.Theme.Gdi',
		hint: 'SFH.Theme.GdiHint',
		sequence: 'crt',
		art: consoleArt,
	},
	nod: {
		id: 'nod',
		label: 'SFH.Theme.Nod',
		hint: 'SFH.Theme.NodHint',
		sequence: 'crt',
		art: consoleArt,
	},
};

export const DEFAULT_THEME = 'omni';

export function getTheme(id) {
	return THEMES[id] ?? THEMES[DEFAULT_THEME];
}

/** Choices object for a settings dropdown. */
export function themeChoices() {
	return Object.fromEntries(Object.values(THEMES).map((t) => [t.id, t.label]));
}

/* -------------------------------------------- */
/*  Art layers                                   */
/* -------------------------------------------- */

/*
 * Art is inline SVG so it scales with the sheet, costs no requests and can be recoloured
 * from the theme's CSS variables. These are the shapes from the design prototype; the
 * final device renders will replace the body paths, not the structure.
 */

function omniArt() {
	return `
	<svg class="sfh-art-svg" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
		<defs>
			<linearGradient id="sfh-omni-beam" x1="0" y1="1" x2="0" y2="0">
				<stop offset="0" stop-color="var(--sfh-hot)" stop-opacity=".45" />
				<stop offset=".4" stop-color="var(--sfh-hot)" stop-opacity=".12" />
				<stop offset="1" stop-color="var(--sfh-hot)" stop-opacity=".02" />
			</linearGradient>
			<linearGradient id="sfh-omni-arm" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#3a4150" />
				<stop offset=".3" stop-color="#1c2029" />
				<stop offset="1" stop-color="#0b0d12" />
			</linearGradient>
		</defs>
		<polygon class="sfh-beam" points="40,470 960,470 560,556 440,556" fill="url(#sfh-omni-beam)" />
		<g class="sfh-device">
			<path d="M-20 560 C 180 552 640 546 900 550 L 900 620 L -20 620 Z" fill="url(#sfh-omni-arm)" stroke="#4a5263" stroke-width="1.2" />
			<path d="M60 556 L72 620 M260 552 L270 620 M760 549 L754 620" stroke="#0a0c10" stroke-width="2.5" />
			<path d="M20 557 L32 620 L48 620 L34 556 Z" fill="#b3261e" />
			<path d="M52 556 L66 620 L74 620 L60 555 Z" fill="#e8e6e1" />
			<path d="M420 548 C 460 542 540 542 580 548 L 583 596 C 540 590 460 590 417 596 Z"
				fill="var(--sfh-hot)" fill-opacity=".2" stroke="var(--sfh-hot)" stroke-opacity=".75" />
			<path d="M432 562 h136 M432 574 h136 M432 586 h136" stroke="var(--sfh-hot)" stroke-opacity=".3" stroke-dasharray="5 4" />
			<path class="sfh-emitter" d="M500 543 l11 6 v11 l-11 6 l-11 -6 v-11 z" fill="var(--sfh-hot)" fill-opacity=".45" stroke="var(--sfh-bright)" />
		</g>
	</svg>`;
}

function wristArt() {
	return `
	<svg class="sfh-art-svg" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
		<defs>
			<linearGradient id="sfh-wrist-sun" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#ffd34f" />
				<stop offset=".55" stop-color="#ff5e8a" />
				<stop offset="1" stop-color="#b3269a" />
			</linearGradient>
			<linearGradient id="sfh-wrist-case" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#2d1a52" />
				<stop offset=".5" stop-color="#1a0e33" />
				<stop offset="1" stop-color="#0f0820" />
			</linearGradient>
			<clipPath id="sfh-wrist-sky"><rect width="1000" height="150" /></clipPath>
		</defs>
		<g class="sfh-backdrop">
			<rect width="1000" height="150" fill="#150733" />
			<g clip-path="url(#sfh-wrist-sky)">
				<circle cx="500" cy="150" r="110" fill="url(#sfh-wrist-sun)" />
				<g fill="#150733">
					<rect x="380" y="92" width="240" height="4" />
					<rect x="380" y="108" width="240" height="6" />
					<rect x="380" y="126" width="240" height="8" />
				</g>
			</g>
			<g stroke="#ff3ea5" stroke-opacity=".4">
				<path d="M0 150 H1000 M500 150 L30 620 M500 150 L190 620 M500 150 L350 620 M500 150 L650 620 M500 150 L810 620 M500 150 L970 620" />
			</g>
			<g stroke="#ff3ea5" stroke-opacity=".22">
				<path d="M0 170 H1000 M0 200 H1000 M0 250 H1000 M0 330 H1000 M0 450 H1000 M0 600 H1000" />
			</g>
		</g>
		<g class="sfh-device">
			<rect x="30" y="120" width="940" height="480" rx="42" fill="url(#sfh-wrist-case)" stroke="#8a55d6" stroke-width="1.6" />
			<rect x="36" y="126" width="928" height="468" rx="38" fill="none" stroke="var(--sfh-acc)" stroke-opacity=".45" />
			<rect x="440" y="130" width="120" height="5" rx="2" fill="#ff3ea5" fill-opacity=".85" />
			<circle cx="920" cy="146" r="5" fill="var(--sfh-acc)" />
		</g>
	</svg>`;
}

function consoleArt() {
	return `
	<svg class="sfh-art-svg" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
		<g class="sfh-device">
			<rect x="3" y="3" width="994" height="614" fill="none" stroke="var(--sfh-metal)" stroke-width="14" />
			<rect x="11" y="11" width="978" height="598" fill="none" stroke="#000" stroke-width="2" />
			<rect x="15" y="15" width="970" height="590" fill="none" stroke="var(--sfh-line)" stroke-width="1" />
			<g fill="#2a2a24">
				<circle cx="14" cy="14" r="5" /><circle cx="986" cy="14" r="5" />
				<circle cx="14" cy="606" r="5" /><circle cx="986" cy="606" r="5" />
			</g>
		</g>
	</svg>`;
}
