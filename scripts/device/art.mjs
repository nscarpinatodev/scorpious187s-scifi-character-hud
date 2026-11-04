/**
 * Device art drawn at the foot of the interface.
 *
 * The omni-tool has a single forearm section, centered, with the emitter band on it. The
 * TRON device has a deck of light lines with the identity disc on it, the Journal a satchel and
 * the Vambrace a bracer. Either way the plate
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
 * The Journal's satchel: the bag the book is kept in, its back standing above its front and the
 * flap hinged on the back and buckled down over the mouth. Two straps run down from the flap
 * through brass clasps on the front, over the clasps' outer edges and under their middle bars;
 * the left clasp is the switch. The macro bar's tags hang on the front, which is the plate the
 * book stands on.
 *
 * Opening, the straps pull free, the flap turns over on its hinge and falls away behind the bag,
 * and the book rises out of the mouth; closing runs it backward (styles/device.css and
 * design/1-head.html). The art is drawn over the projection, so the book could never pass in
 * front of the bag's back here: while the book is out, the projection draws the back again behind
 * it (satchelBackSvg, placed by Projection.fit), and this copy is hidden.
 */
const satchelBack = (inside) => `
	<path d="M292 762 V 726 Q 292 712 308 712 H 972 Q 988 712 988 726 V 762 Z" fill="url(#${inside})" stroke="#2a0f08" stroke-width="1.5"/>
	<path d="M300 724 Q 300 718 310 718 H 970 Q 980 718 980 724" fill="none" stroke="#e8c496" stroke-opacity=".3" stroke-width="1.1" stroke-dasharray="6 5"/>
	<path d="M282 760 L 292 718 L 300 760 Z M998 760 L 988 718 L 980 760 Z" fill="#2c100a" stroke="#1a0805"/>`;
const satchelInside = (id) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
	<stop offset="0" stop-color="#5a2618"/><stop offset=".25" stop-color="#2a0f08"/><stop offset="1" stop-color="#0e0402"/>
</linearGradient>`;
const strap = (x) => `<path d="M${x} 770 H ${x + 28} V 842 Q ${x + 14} 856 ${x} 842 Z" fill="url(#sfh-flapleather)" stroke="#2a0f08" stroke-width="1.2"/>
	<path d="M${x + 4} 772 V 840 M${x + 24} 772 V 840" stroke="#e8c496" stroke-opacity=".35" stroke-width="1" stroke-dasharray="4 4"/>`;
const clasp = (x) => `<rect x="${x}" y="796" width="40" height="40" rx="6" fill="none" stroke="url(#sfh-brass)" stroke-width="6"/>`;
const claspBar = (x) => `<rect x="${x - 4}" y="813" width="48" height="6" rx="2" fill="url(#sfh-brass)" stroke="#5a440c" stroke-width=".8"/>`;

export const SATCHEL = {
	viewBox: ARM.viewBox,
	deck: { bottom: 0.1, width: 0.74 },
	svg: `
	<defs>
		<linearGradient id="sfh-leather" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#6a3020"/><stop offset=".55" stop-color="#43190f"/><stop offset="1" stop-color="#2c100a"/>
		</linearGradient>
		<linearGradient id="sfh-flapleather" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#7a3826"/><stop offset="1" stop-color="#4a1c12"/>
		</linearGradient>
		${satchelInside('sfh-inside')}
		<linearGradient id="sfh-brass" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#f0d27a"/><stop offset=".45" stop-color="#c9a227"/><stop offset="1" stop-color="#7a5f12"/>
		</linearGradient>
		<filter id="sfh-bagshadow" x="-5%" y="-40%" width="110%" height="200%"><feDropShadow dx="0" dy="-4" stdDeviation="6" flood-opacity=".55"/></filter>
	</defs>
	<g class="sfh-satchel-back">${satchelBack('sfh-inside')}</g>
	<path id="sfh-arm" d="M282 758 Q 282 742 300 742 H 980 Q 998 742 998 758 V 860 H 282 Z"
		fill="url(#sfh-leather)" stroke="#2a0f08" stroke-width="1.5" filter="url(#sfh-bagshadow)"/>
	<path d="M286 756 Q 286 745 300 745 H 980 Q 994 745 994 756" fill="none" stroke="#1a0805" stroke-width="5" stroke-opacity=".7"/>
	<path d="M294 860 V 762 Q 294 752 306 752 H 974 Q 986 752 986 762 V 860" fill="none" stroke="#e8c496" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="6 5"/>
	${clasp(312)}${clasp(928)}
	<g class="sfh-flap">
		<g class="sfh-straps">${strap(318)}${strap(934)}</g>
		<path d="M288 724 Q 288 710 304 710 H 976 Q 992 710 992 724 V 778 Q 640 796 288 778 Z" fill="url(#sfh-flapleather)" stroke="#2a0f08" stroke-width="1.5"/>
		<path d="M298 726 Q 298 718 308 718 H 972 Q 982 718 982 726 V 772 Q 640 789 298 772" fill="none" stroke="#e8c496" stroke-opacity=".4" stroke-width="1.2" stroke-dasharray="6 5"/>
	</g>
	${claspBar(312)}${claspBar(928)}
	<g id="sfh-band" role="button" tabindex="0" aria-label="SFH.Power.Toggle">
		<rect x="304" y="788" width="56" height="56" rx="7" fill="#2c100a" fill-opacity=".001"/>
	</g>`,
};

/** The satchel's back alone, for the projection to draw behind the book: the same box as the art. */
export function satchelBackSvg() {
	return `<svg class="sfh-satchel-back" viewBox="${SATCHEL.viewBox}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
		<defs>${satchelInside('sfh-inside-behind')}</defs>${satchelBack('sfh-inside-behind')}</svg>`;
}

/**
 * The Runic Vambrace: an engraved steel bracer on the arm's own lines. The runes in its groove
 * kindle one after another when it wakes (styles/device.css), and the gem at its crown is the
 * switch, as the omni-tool's band is.
 */
const RUNE_GLYPHS = ['M0 0 L0 14 M0 4 L6 0', 'M0 0 L0 14 M0 0 L6 5 L0 9', 'M0 14 L4 0 L8 14', 'M0 0 L7 14 M7 0 L0 14',
	'M0 0 L0 14 M6 0 L6 14 M0 7 L6 7', 'M3 0 L3 14 M0 4 L3 0 L6 4', 'M0 7 L4 0 L8 7 L4 14 Z', 'M0 0 L8 14 M0 14 L4 7'];
const RUNE_X = [336, 366, 396, 426, 456, 486, 516, 546, 726, 756, 786, 816, 846, 876, 906, 936];
const runes = RUNE_X.map((x, i) => {
	// they kindle outward from the gem, one beat apart
	const order = i < 8 ? 7 - i : i - 8;
	return `<path class="sfh-rune" style="--r:${order}" transform="translate(${x} ${i < 8 ? 772 - i * 0.9 : 765 + (i - 8) * 0.9})" d="${RUNE_GLYPHS[i % RUNE_GLYPHS.length]}"/>`;
}).join('');

export const BRACER = {
	viewBox: ARM.viewBox,
	deck: ARM.deck,
	svg: `
	<defs>
		<linearGradient id="sfh-steel" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#5b6578"/><stop offset=".4" stop-color="#2b3140"/><stop offset="1" stop-color="#11141c"/>
		</linearGradient>
		<linearGradient id="sfh-steeledge" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0" stop-color="#8a96ad"/><stop offset=".5" stop-color="#c7d0e0"/><stop offset="1" stop-color="#8a96ad"/>
		</linearGradient>
		<radialGradient id="sfh-gem-dark" cx=".35" cy=".3" r=".8">
			<stop offset="0" stop-color="#4a5b80"/><stop offset="1" stop-color="#141b2c"/>
		</radialGradient>
		<radialGradient id="sfh-gem-lit" cx=".35" cy=".3" r=".8">
			<stop offset="0" stop-color="#e6f2ff"/><stop offset=".35" stop-color="#7ab8ff"/><stop offset=".8" stop-color="#2b4f9a"/>
		</radialGradient>
		<filter id="sfh-gemglow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9"/></filter>
	</defs>
	<path id="sfh-arm" d="M300 758 C 470 746 810 746 980 758 L 1000 860 L 280 860 Z"
		fill="url(#sfh-steel)" stroke="url(#sfh-steeledge)" stroke-width="2"/>
	<path d="M312 768 C 470 757 810 757 968 768" fill="none" stroke="#6b768c" stroke-width="1"/>
	<path d="M306 792 C 470 781 810 781 974 792" fill="none" stroke="#0a0c12" stroke-width="2"/>
	<g class="sfh-runes" fill="none" stroke-width="2.2" stroke-linecap="round">${runes}</g>
	<circle class="sfh-gem-glow" cx="640" cy="770" r="26" fill="#7ab8ff" filter="url(#sfh-gemglow)"/>
	<g id="sfh-band" role="button" tabindex="0" aria-label="SFH.Power.Toggle">
		<rect x="617" y="747" width="46" height="46" rx="6" transform="rotate(45 640 770)" fill="#2a3142" stroke="#59647a" stroke-width="3"/>
		<rect class="sfh-gem" x="623" y="753" width="34" height="34" rx="5" transform="rotate(45 640 770)" fill="url(#sfh-gem-dark)" stroke="#8fa3c4" stroke-width="2"/>
	</g>`,
};

const ART = { arm: ARM, disc: DISC, satchel: SATCHEL, bracer: BRACER };

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
