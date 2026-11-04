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
 * it (`behind`, placed by Projection.fit), and this copy is hidden.
 *
 * Drawn from a palette, so a look over the Journal can bind it in its own leather.
 */
const LEATHER = {
	front: ['#6a3020', '#43190f', '#2c100a'],
	flap: ['#7a3826', '#4a1c12'],
	inside: ['#5a2618', '#2a0f08', '#0e0402'],
	seam: '#2a0f08', dark: '#1a0805', wing: '#2c100a', stitch: '#e8c496',
	emboss: '',
};

function satchel(p) {
	const back = (inside) => `
	<path d="M292 762 V 726 Q 292 712 308 712 H 972 Q 988 712 988 726 V 762 Z" fill="url(#${inside})" stroke="${p.seam}" stroke-width="1.5"/>
	<path d="M300 724 Q 300 718 310 718 H 970 Q 980 718 980 724" fill="none" stroke="${p.stitch}" stroke-opacity=".3" stroke-width="1.1" stroke-dasharray="6 5"/>
	<path d="M282 760 L 292 718 L 300 760 Z M998 760 L 988 718 L 980 760 Z" fill="${p.wing}" stroke="${p.dark}"/>`;
	const inside = (id) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
	<stop offset="0" stop-color="${p.inside[0]}"/><stop offset=".25" stop-color="${p.inside[1]}"/><stop offset="1" stop-color="${p.inside[2]}"/>
</linearGradient>`;
	const strap = (x) => `<path d="M${x} 770 H ${x + 28} V 842 Q ${x + 14} 856 ${x} 842 Z" fill="url(#sfh-flapleather)" stroke="${p.seam}" stroke-width="1.2"/>
	<path d="M${x + 4} 772 V 840 M${x + 24} 772 V 840" stroke="${p.stitch}" stroke-opacity=".35" stroke-width="1" stroke-dasharray="4 4"/>`;
	const clasp = (x) => `<rect x="${x}" y="796" width="40" height="40" rx="6" fill="none" stroke="url(#sfh-brass)" stroke-width="6"/>`;
	const claspBar = (x) => `<rect x="${x - 4}" y="813" width="48" height="6" rx="2" fill="url(#sfh-brass)" stroke="#5a440c" stroke-width=".8"/>`;
	return {
		viewBox: ARM.viewBox,
		deck: { bottom: 0.1, width: 0.74 },
		svg: `
	<defs>
		<linearGradient id="sfh-leather" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="${p.front[0]}"/><stop offset=".55" stop-color="${p.front[1]}"/><stop offset="1" stop-color="${p.front[2]}"/>
		</linearGradient>
		<linearGradient id="sfh-flapleather" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="${p.flap[0]}"/><stop offset="1" stop-color="${p.flap[1]}"/>
		</linearGradient>
		${inside('sfh-inside')}
		<linearGradient id="sfh-brass" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#f0d27a"/><stop offset=".45" stop-color="#c9a227"/><stop offset="1" stop-color="#7a5f12"/>
		</linearGradient>
		<filter id="sfh-bagshadow" x="-5%" y="-40%" width="110%" height="200%"><feDropShadow dx="0" dy="-4" stdDeviation="6" flood-opacity=".55"/></filter>
	</defs>
	<g class="sfh-satchel-back">${back('sfh-inside')}</g>
	<path id="sfh-arm" d="M282 758 Q 282 742 300 742 H 980 Q 998 742 998 758 V 860 H 282 Z"
		fill="url(#sfh-leather)" stroke="${p.seam}" stroke-width="1.5" filter="url(#sfh-bagshadow)"/>
	<path d="M286 756 Q 286 745 300 745 H 980 Q 994 745 994 756" fill="none" stroke="${p.dark}" stroke-width="5" stroke-opacity=".7"/>
	<path d="M294 860 V 762 Q 294 752 306 752 H 974 Q 986 752 986 762 V 860" fill="none" stroke="${p.stitch}" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="6 5"/>
	${clasp(312)}${clasp(928)}
	<g class="sfh-flap">
		<g class="sfh-straps">${strap(318)}${strap(934)}</g>
		<path d="M288 724 Q 288 710 304 710 H 976 Q 992 710 992 724 V 778 Q 640 796 288 778 Z" fill="url(#sfh-flapleather)" stroke="${p.seam}" stroke-width="1.5"/>
		<path d="M298 726 Q 298 718 308 718 H 972 Q 982 718 982 726 V 772 Q 640 789 298 772" fill="none" stroke="${p.stitch}" stroke-opacity=".4" stroke-width="1.2" stroke-dasharray="6 5"/>
		${p.emboss}
	</g>
	${claspBar(312)}${claspBar(928)}
	<g id="sfh-band" role="button" tabindex="0" aria-label="SFH.Power.Toggle">
		<rect x="304" y="788" width="56" height="56" rx="7" fill="${p.wing}" fill-opacity=".001"/>
	</g>`,
		/** Its back alone, for the projection to draw behind the book: the same box as the art. */
		behind: () => `<svg class="sfh-satchel-back" viewBox="${ARM.viewBox}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
		<defs>${inside('sfh-inside-behind')}</defs>${back('sfh-inside-behind')}</svg>`,
	};
}

export const SATCHEL = satchel(LEATHER);

/**
 * The Grove: the Journal as a druid's herbarium, its satchel in green leather with a spray of
 * leaves tooled into the flap.
 */
const sprig = (x, y, a, s = 1) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">
	<path d="M0 0 C -9 -8 -9 -22 0 -32 C 9 -22 9 -8 0 0 Z" fill="#1c2e12" fill-opacity=".35" stroke="#9fbf6a" stroke-opacity=".55" stroke-width="1"/>
	<path d="M0 0 V -30 M0 -10 L -5 -15 M0 -10 L 5 -15 M0 -19 L -4 -23 M0 -19 L 4 -23" stroke="#9fbf6a" stroke-opacity=".45" stroke-width=".8" fill="none"/></g>`;
export const GROVE = satchel({
	front: ['#4c6a30', '#2f4a1e', '#1c2e12'],
	flap: ['#5c7e3a', '#304c1e'],
	inside: ['#34501f', '#15220c', '#060a03'],
	seam: '#14200c', dark: '#0c1406', wing: '#1c2e12', stitch: '#e8dca6',
	emboss: `<path d="M560 758 C 600 746 680 746 720 758" fill="none" stroke="#9fbf6a" stroke-opacity=".5" stroke-width="1.4"/>
		${sprig(600, 754, -64, 0.9)}${sprig(620, 750, -34)}${sprig(640, 748, 0, 1.1)}${sprig(660, 750, 34)}${sprig(680, 754, 64, 0.9)}`,
});

/**
 * The Runic Vambrace: an engraved steel bracer on the arm's own lines. The runes in its groove
 * kindle one after another when it wakes (styles/device.css), and the gem at its crown is the
 * switch, as the omni-tool's band is.
 *
 * Drawn from a palette, so the looks over the Vambrace forge it from their own metal, set their
 * own stone and cut their own glyphs. The gem is whatever carries the class `sfh-gem`: the
 * stylesheet fills it from #sfh-gem-lit once the bracer wakes.
 */
const RUNE_GLYPHS = ['M0 0 L0 14 M0 4 L6 0', 'M0 0 L0 14 M0 0 L6 5 L0 9', 'M0 14 L4 0 L8 14', 'M0 0 L7 14 M7 0 L0 14',
	'M0 0 L0 14 M6 0 L6 14 M0 7 L6 7', 'M3 0 L3 14 M0 4 L3 0 L6 4', 'M0 7 L4 0 L8 7 L4 14 Z', 'M0 0 L8 14 M0 14 L4 7'];
const RUNE_X = [336, 366, 396, 426, 456, 486, 516, 546, 726, 756, 786, 816, 846, 876, 906, 936];
const runesOf = (glyphs) => RUNE_X.map((x, i) => {
	// they kindle outward from the gem, one beat apart
	const order = i < 8 ? 7 - i : i - 8;
	return `<path class="sfh-rune" style="--r:${order}" transform="translate(${x} ${i < 8 ? 772 - i * 0.9 : 765 + (i - 8) * 0.9})" d="${glyphs[i % glyphs.length]}"/>`;
}).join('');

/** The gem as the Vambrace cuts it: a lozenge in a steel setting. */
const LOZENGE = (p) => `
		<rect x="617" y="747" width="46" height="46" rx="6" transform="rotate(45 640 770)" fill="${p.setting[0]}" stroke="${p.setting[1]}" stroke-width="3"/>
		<rect class="sfh-gem" x="623" y="753" width="34" height="34" rx="5" transform="rotate(45 640 770)" fill="url(#sfh-gem-dark)" stroke="${p.gemEdge}" stroke-width="2"/>`;

function bracer(p) {
	return {
		viewBox: ARM.viewBox,
		deck: ARM.deck,
		svg: `
	<defs>
		<linearGradient id="sfh-steel" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="${p.metal[0]}"/><stop offset=".4" stop-color="${p.metal[1]}"/><stop offset="1" stop-color="${p.metal[2]}"/>
		</linearGradient>
		<linearGradient id="sfh-steeledge" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0" stop-color="${p.edge[0]}"/><stop offset=".5" stop-color="${p.edge[1]}"/><stop offset="1" stop-color="${p.edge[0]}"/>
		</linearGradient>
		<radialGradient id="sfh-gem-dark" cx=".35" cy=".3" r=".8">
			<stop offset="0" stop-color="${p.dark[0]}"/><stop offset="1" stop-color="${p.dark[1]}"/>
		</radialGradient>
		<radialGradient id="sfh-gem-lit" cx=".35" cy=".3" r=".8">
			<stop offset="0" stop-color="${p.lit[0]}"/><stop offset=".35" stop-color="${p.lit[1]}"/><stop offset=".8" stop-color="${p.lit[2]}"/>
		</radialGradient>
		<filter id="sfh-gemglow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9"/></filter>
		${p.defs ?? ''}
	</defs>
	<path id="sfh-arm" d="M300 758 C 470 746 810 746 980 758 L 1000 860 L 280 860 Z"
		fill="url(#sfh-steel)" stroke="url(#sfh-steeledge)" stroke-width="2"${p.texture ? ` filter="url(#${p.texture})"` : ''}/>
	<path d="M312 768 C 470 757 810 757 968 768" fill="none" stroke="${p.ridge}" stroke-width="1"/>
	<path d="M306 792 C 470 781 810 781 974 792" fill="none" stroke="${p.groove}" stroke-width="2"/>
	${p.trim ?? ''}
	<g class="sfh-runes" fill="none" stroke-width="2.2" stroke-linecap="round">${runesOf(p.glyphs ?? RUNE_GLYPHS)}</g>
	<circle class="sfh-gem-glow" cx="640" cy="770" r="26" fill="${p.glow}" filter="url(#sfh-gemglow)"/>
	<g id="sfh-band" role="button" tabindex="0" aria-label="SFH.Power.Toggle">${(p.gem ?? LOZENGE)(p)}
	</g>`,
	};
}

export const BRACER = bracer({
	metal: ['#5b6578', '#2b3140', '#11141c'], edge: ['#8a96ad', '#c7d0e0'], ridge: '#6b768c', groove: '#0a0c12',
	dark: ['#4a5b80', '#141b2c'], lit: ['#e6f2ff', '#7ab8ff', '#2b4f9a'], glow: '#7ab8ff',
	setting: ['#2a3142', '#59647a'], gemEdge: '#8fa3c4',
});

/**
 * The Reliquary: a bracer of white gold for a cleric or a paladin, its glyphs small crosses and
 * its stone a rose window of stained glass in gold leading, which lights from within.
 */
const ROSE = (p) => `
		<circle cx="640" cy="770" r="27" fill="${p.setting[0]}" stroke="${p.setting[1]}" stroke-width="3"/>
		<circle class="sfh-gem" cx="640" cy="770" r="22" fill="url(#sfh-gem-dark)" stroke="${p.gemEdge}" stroke-width="1.5"/>
		<g fill="none" stroke="#c9a227" stroke-width="1.6" pointer-events="none">
			<circle cx="640" cy="770" r="8"/>
			<path d="M640 748 V 762 M640 778 V 792 M618 770 H 632 M648 770 H 662 M624.4 754.4 L 634.3 764.3 M645.7 775.7 L 655.6 785.6 M655.6 754.4 L 645.7 764.3 M634.3 775.7 L 624.4 785.6"/>
		</g>
		<g pointer-events="none" opacity=".55">
			<path d="M640 748 A 22 22 0 0 1 655.6 754.4 L 645.7 764.3 A 8 8 0 0 0 640 762 Z" fill="#c42850"/>
			<path d="M662 770 A 22 22 0 0 1 655.6 785.6 L 645.7 775.7 A 8 8 0 0 0 648 770 Z" fill="#2858c4"/>
			<path d="M640 792 A 22 22 0 0 1 624.4 785.6 L 634.3 775.7 A 8 8 0 0 0 640 778 Z" fill="#1e9a5a"/>
			<path d="M618 770 A 22 22 0 0 1 624.4 754.4 L 634.3 764.3 A 8 8 0 0 0 632 770 Z" fill="#8a2ac4"/>
		</g>`;
export const RELIQUARY = bracer({
	metal: ['#f4ecd6', '#c9bd98', '#6e6448'], edge: ['#b8962e', '#f6dc8a'], ridge: '#fff6d8', groove: '#5a4a24',
	dark: ['#5a4a2a', '#241a10'], lit: ['#fffbe6', '#ffe08a', '#c9a227'], glow: '#ffd76a',
	setting: ['#8a6a14', '#f2d27a'], gemEdge: '#f6dc8a',
	glyphs: ['M3 0 V14 M0 4 H6', 'M4 0 L8 7 L4 14 L0 7 Z', 'M3 0 V14 M0 5 H6 M1 10 H5', 'M0 7 H8 M4 3 V11'],
	trim: `<path d="M300 758 C 470 746 810 746 980 758" fill="none" stroke="#f2d27a" stroke-width="3" stroke-opacity=".8"/>
		<g fill="#f2d27a" stroke="#8a6a14" stroke-width=".8">
			<circle cx="330" cy="806" r="3.2"/><circle cx="950" cy="806" r="3.2"/><circle cx="580" cy="796" r="2.6"/><circle cx="700" cy="796" r="2.6"/></g>`,
	gem: ROSE,
});

/**
 * The Runeforge: dressed stone banded in brass, riveted at the seams, its runes cut square and
 * glowing like a forge's coals, and an ember stone set in a brass mount for its switch.
 */
const EMBER = (p) => `
		<rect x="616" y="746" width="48" height="48" rx="3" fill="${p.setting[0]}" stroke="${p.setting[1]}" stroke-width="3"/>
		<rect class="sfh-gem" x="623" y="753" width="34" height="34" rx="2" fill="url(#sfh-gem-dark)" stroke="${p.gemEdge}" stroke-width="2"/>
		<path d="M616 746 L 623 753 M664 746 L 657 753 M616 794 L 623 787 M664 794 L 657 787" stroke="#e0b870" stroke-width="1.5" pointer-events="none"/>`;
export const RUNEFORGE = bracer({
	metal: ['#8a857c', '#55514a', '#26241f'], edge: ['#8a6a2c', '#e0b870'], ridge: '#a8a196', groove: '#14120f',
	dark: ['#5a3a20', '#1e140c'], lit: ['#fff2c8', '#ff9a3c', '#a83a10'], glow: '#ff8a2a',
	setting: ['#6a4a1c', '#e0b870'], gemEdge: '#3a2410',
	defs: `<filter id="sfh-stone" x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="3" seed="11" result="n"/>
			<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0" result="spots"/>
			<feComposite in="spots" in2="SourceGraphic" operator="in" result="grain"/>
			<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="grain"/></feMerge></filter>`,
	texture: 'sfh-stone',
	glyphs: ['M0 0 H7 V14 M0 7 H7', 'M0 14 V0 L7 7 V14', 'M0 0 V14 H7 M0 7 H5', 'M0 0 L7 0 L0 14 H7', 'M0 0 V14 M7 0 V14 M0 0 L7 14'],
	trim: `<path d="M300 758 C 470 746 810 746 980 758" fill="none" stroke="#c9a04c" stroke-width="4"/>
		<path d="M322 758 L 312 860 M958 758 L 968 860" stroke="#c9a04c" stroke-width="7"/>
		<path d="M322 758 L 312 860 M958 758 L 968 860" stroke="#6a4a1c" stroke-width="1.2"/>
		<g fill="#e0b870" stroke="#4a3412" stroke-width=".8">
			<circle cx="320" cy="780" r="3"/><circle cx="315" cy="830" r="3"/><circle cx="960" cy="780" r="3"/><circle cx="965" cy="830" r="3"/></g>`,
	gem: EMBER,
});

/**
 * Witchfire: a bracer of bone, joined like a spine, its glyphs scratched into it, and a flame
 * of green witch-fire guttering in a dark socket for its switch.
 */
const FLAME = (p) => `
		<path d="M640 742 C 660 754 666 768 662 782 C 658 794 622 794 618 782 C 614 768 620 754 640 742 Z" fill="${p.setting[0]}" stroke="${p.setting[1]}" stroke-width="3"/>
		<path class="sfh-gem" d="M640 750 C 654 760 657 770 654 780 C 651 789 629 789 626 780 C 623 770 628 762 636 758 C 634 766 638 770 640 770 C 640 762 636 756 640 750 Z" fill="url(#sfh-gem-dark)" stroke="${p.gemEdge}" stroke-width="1.5"/>`;
export const WITCHFIRE = bracer({
	metal: ['#efe6cc', '#b8ae90', '#5c5646'], edge: ['#8a8470', '#f6efd8'], ridge: '#fffaea', groove: '#3a3628',
	dark: ['#2a3a24', '#0c120a'], lit: ['#eaffd8', '#7dff6a', '#1e7a1a'], glow: '#5aff4a',
	setting: ['#1a1c16', '#d8d0b4'], gemEdge: '#3a5a2a',
	glyphs: ['M0 0 L6 14', 'M0 14 Q4 0 8 14', 'M0 0 L3 14 M4 0 L7 14', 'M0 7 Q4 0 8 7 Q4 14 0 7', 'M2 0 V14 M0 3 L4 6'],
	trim: `<g fill="none" stroke="#6a6450" stroke-width="2" stroke-linecap="round">
			<path d="M372 750 Q 366 806 370 860 M450 748 Q 444 806 448 860 M528 747 Q 522 806 526 860 M752 747 Q 758 806 754 860 M830 748 Q 836 806 832 860 M908 750 Q 914 806 910 860"/></g>`,
	gem: FLAME,
});

const ART = { arm: ARM, disc: DISC, satchel: SATCHEL, grove: GROVE, bracer: BRACER, reliquary: RELIQUARY, runeforge: RUNEFORGE, witchfire: WITCHFIRE };

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
