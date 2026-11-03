/**
 * Device art drawn at the foot of the interface.
 *
 * The omni-tool has a single forearm section, centered, with the emitter band on it. The
 * TRON device has a deck of light lines with the identity disc on it. Either way the plate
 * (#sfh-arm) is what the macro bar is mounted on, and the switch (#sfh-band) raises and
 * lowers the projection.
 *
 * The wrist unit and the EVA console draw their housing around the projection itself,
 * so at the foot of the screen there is nothing but the macro bar.
 *
 * Coordinates are the same ones the approved mock-up uses, cropped to the arm.
 */

/** The arm, in mock-up coordinates cropped to `viewBox`. */
export const ARM = {
	viewBox: '276 728 728 132',
	/** Where the macro bar sits on the plate, as a share of the art box. */
	deck: { bottom: 0.06, width: 0.74 },
	svg: `
	<defs>
		<linearGradient id="sfh-plate" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#3a4150"/><stop offset=".3" stop-color="#1c2029"/><stop offset="1" stop-color="#0b0d12"/>
		</linearGradient>
		<filter id="sfh-bandglow" x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>
	</defs>
	<path id="sfh-arm" d="M300 754 C 470 742 810 742 980 754 L 1000 860 L 280 860 Z"
		fill="url(#sfh-plate)" stroke="#4a5263" stroke-width="1.5"/>
	<path d="M396 748 L386 860 M470 745 L464 860 M812 745 L820 860 M886 748 L900 860" stroke="#0a0c10" stroke-width="3"/>
	<rect x="540" y="734" width="200" height="74" rx="20" fill="#ff8c2a" fill-opacity=".22" filter="url(#sfh-bandglow)"/>
	<g id="sfh-band" role="button" tabindex="0" aria-label="SFH.Power.Toggle">
		<path d="M548 741 C 600 732 680 732 732 741 L 736 806 C 680 798 600 798 544 806 Z"
			fill="#ff8c2a" fill-opacity=".2" stroke="#ffb866" stroke-opacity=".8"/>
		<path d="M560 758 h160 M560 774 h160 M560 790 h160" stroke="#ffb866" stroke-opacity=".35" stroke-dasharray="6 5"/>
		<path d="M640 736 l14 8 v14 l-14 8 l-14 -8 v-14 z" fill="#ff8c2a" fill-opacity=".45" stroke="#ffd9b0"/>
		<circle cx="640" cy="751" r="4" fill="#fff1de"/>
	</g>`,
};

/** The TRON deck and its identity disc, on the same coordinates as the arm. */
export const DISC = {
	viewBox: ARM.viewBox,
	deck: ARM.deck,
	svg: `
	<defs>
		<linearGradient id="sfh-deckplate" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#0c1c26"/><stop offset=".35" stop-color="#050d13"/><stop offset="1" stop-color="#010305"/>
		</linearGradient>
		<filter id="sfh-discglow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
		<filter id="sfh-lineglow" x="-5%" y="-300%" width="110%" height="700%"><feGaussianBlur stdDeviation="2"/></filter>
	</defs>
	<path id="sfh-arm" d="M292 762 L 352 750 H 928 L 988 762 L 1004 860 H 276 Z"
		fill="url(#sfh-deckplate)" stroke="#6fe9ff" stroke-width="1.5"/>
	<path d="M306 772 H 470 l 12 -12 H 584 M974 772 H 810 l -12 -12 H 696" fill="none" stroke="#6fe9ff" stroke-width="3" filter="url(#sfh-lineglow)"/>
	<path d="M306 772 H 470 l 12 -12 H 584 M974 772 H 810 l -12 -12 H 696" fill="none" stroke="#dffcff" stroke-width="1.2"/>
	<circle cx="640" cy="768" r="38" fill="#6fe9ff" fill-opacity=".4" filter="url(#sfh-discglow)"/>
	<g id="sfh-band" role="button" tabindex="0" aria-label="SFH.Power.Toggle">
		<circle cx="640" cy="768" r="35" fill="#02090e" stroke="#9ff3ff" stroke-width="3"/>
		<circle id="sfh-disc-ring" cx="640" cy="768" r="26" fill="none" stroke="#6fe9ff" stroke-width="2.5" stroke-dasharray="30 11"/>
		<circle cx="640" cy="768" r="15" fill="#6fe9ff" fill-opacity=".22" stroke="#dffcff" stroke-width="1.5"/>
		<circle cx="640" cy="768" r="4.5" fill="#f0feff"/>
	</g>`,
};

/**
 * The Journal's strap: a stitched leather belt that the macro bar's tags hang on, with its
 * brass buckle at the left end. The buckle opens the book. The strap is the plate the book
 * stands on, so it is low and flat; the buckle sits beside the bar, not under it.
 */
export const STRAP = {
	viewBox: ARM.viewBox,
	deck: { bottom: 0.1, width: 0.74 },
	svg: `
	<defs>
		<linearGradient id="sfh-leather" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#6a3020"/><stop offset=".55" stop-color="#43190f"/><stop offset="1" stop-color="#2c100a"/>
		</linearGradient>
		<linearGradient id="sfh-brass" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#f0d27a"/><stop offset=".45" stop-color="#c9a227"/><stop offset="1" stop-color="#7a5f12"/>
		</linearGradient>
		<filter id="sfh-strapshadow" x="-5%" y="-40%" width="110%" height="200%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity=".55"/></filter>
	</defs>
	<path id="sfh-arm" d="M290 792 Q 300 786 312 786 H 968 Q 980 786 990 792 V 852 Q 980 858 968 858 H 312 Q 300 858 290 852 Z"
		fill="url(#sfh-leather)" stroke="#2a0f08" stroke-width="1.5" filter="url(#sfh-strapshadow)"/>
	<path d="M300 795 H 980 M300 849 H 980" stroke="#e8c496" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="6 5"/>
	<path d="M960 786 Q 1000 786 1000 822 Q 1000 858 960 858" fill="#3a170e" stroke="#2a0f08"/>
	<g id="sfh-band" role="button" tabindex="0" aria-label="SFH.Power.Toggle">
		<rect x="300" y="770" width="64" height="104" rx="9" fill="#2c100a" fill-opacity=".001"/>
		<rect x="306" y="776" width="52" height="92" rx="8" fill="none" stroke="url(#sfh-brass)" stroke-width="7"/>
		<rect x="306" y="776" width="52" height="92" rx="8" fill="none" stroke="#5a440c" stroke-width="1"/>
		<rect id="sfh-prong" x="329" y="770" width="6" height="104" rx="2" fill="url(#sfh-brass)" stroke="#5a440c" stroke-width=".8"/>
	</g>`,
};

const ART = { arm: ARM, disc: DISC, strap: STRAP };

/** The art layer for a device, or null when it draws nothing at the foot of the screen. */
export function deviceArt(id) {
	return ART[id] ?? null;
}

/** An `<svg>` element for an art layer. */
export function buildArt(art) {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', art.viewBox);
	svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
	svg.classList.add('sfh-art');
	svg.innerHTML = art.svg;
	// Not aria-hidden: the band inside is the power switch. Its label is written as a key.
	for (const el of svg.querySelectorAll('[aria-label^="SFH."]')) {
		el.setAttribute('aria-label', game.i18n.localize(el.getAttribute('aria-label')));
	}
	return svg;
}
