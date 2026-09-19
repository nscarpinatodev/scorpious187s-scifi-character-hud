/**
 * Device art drawn at the foot of the interface.
 *
 * Only the omni-tool has any: a single forearm section, centred, with the emitter band
 * on it. The arm is the thing the macro bar is mounted on, and the band is the power
 * switch — clicking it raises and lowers the projection.
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

const ART = { arm: ARM };

/** The art layer for a device, or null when it draws nothing at the foot of the screen. */
export function deviceArt(id) {
	return ART[id] ?? null;
}

/** An `<svg>` element for an art layer. */
export function buildArt(art) {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', art.viewBox);
	svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
	svg.setAttribute('aria-hidden', 'true');
	svg.classList.add('sfh-art');
	svg.innerHTML = art.svg;
	return svg;
}
