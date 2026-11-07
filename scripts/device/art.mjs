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

/*
 * What else a traveler keeps in the satchel, sticking up out of it: a map rolled and tied with a
 * red ribbon, loose pages, a sealed letter, a quill and a corked vial. They stand inside the bag,
 * in front of its back and behind its front, so with the flap down their tops show above it. The
 * middle is left clear for the book, which comes up in front of them: they are part of the back,
 * so the projection's copy behind the book has them too. `id` names the map's shading, which the
 * art and the copy each have their own of.
 */
const clutter = (id) => `
	<g class="sfh-clutter">
		<defs>
			<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stop-color="#b8a274"/><stop offset=".45" stop-color="#efe2c0"/><stop offset="1" stop-color="#a08a5c"/>
			</linearGradient>
		</defs>
		<!-- a map, rolled and tied, leaning to the left -->
		<g transform="rotate(-12 400 760)">
			<rect x="384" y="652" width="30" height="110" rx="5" fill="url(#${id})" stroke="#6b5530" stroke-width="1"/>
			<ellipse cx="399" cy="652" rx="15" ry="5" fill="#f2e6c8" stroke="#6b5530" stroke-width="1"/>
			<path d="M399 652 m-9 0 a9 3 0 1 0 18 0 a6 2 0 1 0 -12 0" fill="none" stroke="#a08a5c" stroke-width=".8"/>
			<path d="M384 684 h30" stroke="#a3271c" stroke-width="4"/>
			<path d="M412 684 q12 8 5 22 M412 684 q18 1 20 16" stroke="#a3271c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
		</g>
		<!-- loose pages, fanned -->
		<path d="M446 770 L 442 690 L 524 683 L 532 770 Z" fill="#e2d2ac" stroke="#8a7050" stroke-width=".8" transform="rotate(-7 488 740)"/>
		<path d="M468 770 L 466 682 L 552 680 L 556 770 Z" fill="#efe3c6" stroke="#8a7050" stroke-width=".8" transform="rotate(5 510 740)"/>
		<g transform="rotate(5 510 740)" stroke="#6b5842" stroke-opacity=".45" stroke-width="1">
			<path d="M478 694 h62 M478 702 h54 M478 710 h58 M478 718 h40"/>
		</g>
		<!-- a sealed letter, tucked in on the right -->
		<g transform="rotate(9 790 730)">
			<rect x="754" y="692" width="72" height="62" fill="#f2e8d0" stroke="#8a7050" stroke-width=".9"/>
			<path d="M754 692 l36 27 l36 -27" fill="none" stroke="#8a7050" stroke-width=".9"/>
			<circle cx="790" cy="719" r="7.5" fill="#a3271c" stroke="#6a140e"/>
			<path d="M786 717 l4 4 l4 -6" fill="none" stroke="#e26a4f" stroke-width="1"/>
		</g>
		<!-- a quill, standing tall -->
		<g transform="rotate(13 878 770)">
			<path d="M878 640 C 858 664 856 704 876 744 C 898 704 900 664 878 640 Z" fill="#f6f2e8" stroke="#b8ad96" stroke-width=".8"/>
			<path d="M878 652 L 878 780" stroke="#7a6a4e" stroke-width="1.6"/>
			<path d="M878 664 l -12 8 M878 680 l -15 9 M878 696 l -15 10 M878 712 l -12 10 M878 670 l 12 8 M878 686 l 15 9 M878 702 l 14 10 M878 718 l 10 9"
				stroke="#c9bfa8" stroke-width=".9"/>
		</g>
		<!-- a vial, corked -->
		<g transform="rotate(-6 922 740)">
			<rect x="914" y="692" width="17" height="64" rx="6" fill="#5aa0c8" fill-opacity=".55" stroke="#cfe6f2" stroke-width="1"/>
			<rect x="916" y="682" width="13" height="12" rx="2" fill="#9a7444" stroke="#5a4020" stroke-width=".8"/>
			<path d="M918 700 v40" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
		</g>
	</g>`;

function satchel(p) {
	const back = (inside) => `
	<path d="M292 762 V 726 Q 292 712 308 712 H 972 Q 988 712 988 726 V 762 Z" fill="url(#${inside})" stroke="${p.seam}" stroke-width="1.5"/>
	<path d="M300 724 Q 300 718 310 718 H 970 Q 980 718 980 724" fill="none" stroke="${p.stitch}" stroke-opacity=".3" stroke-width="1.1" stroke-dasharray="6 5"/>
	<path d="M282 760 L 292 718 L 300 760 Z M998 760 L 988 718 L 980 760 Z" fill="${p.wing}" stroke="${p.dark}"/>
	${clutter(`${inside}-roll`)}`;
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

/* ---------------------------------------------------------------- the sci-fi looks' art */

const POWER = 'role="button" tabindex="0" aria-label="SFH.Power.Toggle"';

/** The Holoprojector: a palm-sized disc emitter on a low pedestal; the light comes off the disc. */
export const HOLOPROJECTOR = {
	viewBox: ARM.viewBox,
	deck: ARM.deck,
	svg: `
	<defs>
		<linearGradient id="sfh-holo-base" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#2c333d"/><stop offset=".4" stop-color="#151a21"/><stop offset="1" stop-color="#07090c"/>
		</linearGradient>
		<radialGradient id="sfh-holo-disc" cx=".5" cy=".45" r=".6">
			<stop offset="0" stop-color="#e8f8ff"/><stop offset=".3" stop-color="#6fc8ff"/><stop offset=".75" stop-color="#1d4f7a"/><stop offset="1" stop-color="#0a1a2a"/>
		</radialGradient>
		<filter id="sfh-holo-glow" x="-60%" y="-120%" width="220%" height="340%"><feGaussianBlur stdDeviation="9"/></filter>
	</defs>
	<path id="sfh-arm" d="M298 778 Q 302 768 316 768 H 964 Q 978 768 982 778 L 1000 860 H 280 Z"
		fill="url(#sfh-holo-base)" stroke="#3e4856" stroke-width="1.5"/>
	<path d="M318 782 H 962" stroke="#6fc8ff" stroke-opacity=".35" stroke-dasharray="2 9"/>
	<path d="M420 770 L 412 860 M860 770 L 868 860" stroke="#05070a" stroke-width="2.5"/>
	<ellipse cx="640" cy="762" rx="104" ry="26" fill="#6fc8ff" fill-opacity=".4" filter="url(#sfh-holo-glow)"/>
	<g id="sfh-band" ${POWER}>
		<path d="M556 772 Q 556 750 640 750 Q 724 750 724 772 V 790 Q 724 806 640 806 Q 556 806 556 790 Z" fill="#0e141b" stroke="#5c6a7c" stroke-width="2"/>
		<ellipse cx="640" cy="768" rx="70" ry="15" fill="url(#sfh-holo-disc)" stroke="#a6dfff" stroke-width="1.5"/>
		<ellipse cx="640" cy="767" rx="46" ry="9" fill="none" stroke="#e8f8ff" stroke-opacity=".75" stroke-dasharray="7 4"/>
		<ellipse cx="640" cy="766" rx="11" ry="3" fill="#f2fbff"/>
		<path d="M572 788 h18 M690 788 h18" stroke="#6fc8ff" stroke-width="3" stroke-linecap="round"/>
	</g>`,
};

/** The Armored gauntlet: hammered steel lit by its own dents, rivets and seams, two red lights, and a little display. */
export const GAUNTLET = {
	viewBox: ARM.viewBox,
	deck: ARM.deck,
	svg: `
	<defs>
		<linearGradient id="sfh-gnt-steel" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#a7b0bb"/><stop offset=".35" stop-color="#66707b"/><stop offset="1" stop-color="#262b31"/>
		</linearGradient>
		<filter id="sfh-gnt-hammer" x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency=".085" numOctaves="2" seed="4" result="n"/>
			<feDiffuseLighting in="n" surfaceScale="1.8" diffuseConstant="1.2" lighting-color="#ffffff" result="l"><feDistantLight azimuth="235" elevation="55"/></feDiffuseLighting>
			<feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="m"/>
			<feComposite in="m" in2="SourceAlpha" operator="in"/>
		</filter>
		<filter id="sfh-gnt-led" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3.5"/></filter>
	</defs>
	<path id="sfh-arm" d="M298 760 C 470 748 810 748 982 760 L 1002 860 H 278 Z" fill="url(#sfh-gnt-steel)" filter="url(#sfh-gnt-hammer)"/>
	<path d="M298 760 C 470 748 810 748 982 760 L 1002 860 H 278 Z" fill="none" stroke="#d6dde5" stroke-width="1.5"/>
	<path d="M312 772 C 470 761 810 761 968 772" fill="none" stroke="#e6ebf0" stroke-opacity=".55"/>
	<path d="M430 754 L 420 860 M850 754 L 860 860" stroke="#16191d" stroke-width="2.5"/>
	<path d="M432 754 L 422 860 M852 754 L 862 860" stroke="#c9d1da" stroke-opacity=".35"/>
	<g fill="#d3dae2" stroke="#3a4048" stroke-width=".8">
		<circle cx="322" cy="782" r="3.2"/><circle cx="958" cy="782" r="3.2"/><circle cx="446" cy="772" r="3"/><circle cx="834" cy="772" r="3"/>
		<circle cx="316" cy="840" r="3.2"/><circle cx="964" cy="840" r="3.2"/>
	</g>
	<g>
		<circle cx="486" cy="776" r="7" fill="#ff3b2f" fill-opacity=".7" filter="url(#sfh-gnt-led)"/><circle cx="486" cy="776" r="3.6" fill="#ff5a4a" stroke="#4a0c08"/>
		<circle cx="794" cy="776" r="7" fill="#ff3b2f" fill-opacity=".7" filter="url(#sfh-gnt-led)"/><circle cx="794" cy="776" r="3.6" fill="#ff5a4a" stroke="#4a0c08"/>
	</g>
	<g id="sfh-band" ${POWER}>
		<rect x="566" y="746" width="148" height="50" rx="5" fill="#2a2f35" stroke="#c9d1da" stroke-width="2"/>
		<rect x="574" y="752" width="132" height="38" rx="2" fill="#140504" stroke="#000"/>
		<path d="M584 762 h44 M584 771 h74 M584 780 h30" stroke="#ff3b2f" stroke-width="2" stroke-linecap="round"/>
		<path d="M680 760 l12 10 -12 10 -12 -10 Z" fill="none" stroke="#ff3b2f" stroke-width="1.6"/>
		<circle cx="680" cy="770" r="2" fill="#ff8a7a"/>
	</g>`,
};

/** The Comm unit: a slate wrist slab, teal light strips, orange indicators, and a hexagonal emitter. */
const hex = (r, cx = 640, cy = 770) => Array.from({ length: 6 }, (_, i) => {
	const a = (Math.PI / 3) * i;
	return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
}).join(' ');
export const COMM = {
	viewBox: ARM.viewBox,
	deck: ARM.deck,
	svg: `
	<defs>
		<linearGradient id="sfh-comm-slab" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#2c3f4a"/><stop offset=".4" stop-color="#16232b"/><stop offset="1" stop-color="#080e12"/>
		</linearGradient>
		<radialGradient id="sfh-comm-core"><stop offset="0" stop-color="#ffe0b8"/><stop offset=".35" stop-color="#ff8a2a"/><stop offset="1" stop-color="#5a2406"/></radialGradient>
		<filter id="sfh-comm-glow" x="-30%" y="-300%" width="160%" height="700%"><feGaussianBlur stdDeviation="2.5"/></filter>
		<filter id="sfh-comm-halo" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8"/></filter>
	</defs>
	<path id="sfh-arm" d="M300 768 L 318 754 H 962 L 980 768 L 998 860 H 282 Z" fill="url(#sfh-comm-slab)" stroke="#2fd3c6" stroke-opacity=".7" stroke-width="1.5"/>
	<path d="M322 766 H 586 M694 766 H 958" stroke="#2fd3c6" stroke-width="3" filter="url(#sfh-comm-glow)"/>
	<path d="M322 766 H 586 M694 766 H 958" stroke="#c9fff9" stroke-width="1"/>
	<path d="M336 778 l 10 -6 h 60 M944 778 l -10 -6 h -60" fill="none" stroke="#2fd3c6" stroke-opacity=".5"/>
	<g fill="#ff8a2a"><rect x="318" y="782" width="14" height="5" rx="1"/><rect x="948" y="782" width="14" height="5" rx="1"/><rect x="338" y="782" width="6" height="5" rx="1" opacity=".5"/><rect x="936" y="782" width="6" height="5" rx="1" opacity=".5"/></g>
	<polygon points="${hex(44)}" fill="#2fd3c6" fill-opacity=".35" filter="url(#sfh-comm-halo)"/>
	<g id="sfh-band" ${POWER}>
		<polygon points="${hex(38)}" fill="#0b151a" stroke="#2fd3c6" stroke-width="3"/>
		<polygon points="${hex(27)}" fill="none" stroke="#2fd3c6" stroke-opacity=".5" stroke-dasharray="5 4"/>
		<polygon points="${hex(15)}" fill="url(#sfh-comm-core)" stroke="#ffd2a0" stroke-width="1.2"/>
		<circle cx="640" cy="770" r="3.5" fill="#fff4e6"/>
	</g>`,
};

/** The Crystal core: a white ceramic band, a cyan seam of light along it, and a cut crystal set in it. */
export const CRYSTAL = {
	viewBox: ARM.viewBox,
	deck: ARM.deck,
	svg: `
	<defs>
		<linearGradient id="sfh-crys-shell" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#dde7f0"/><stop offset="1" stop-color="#93a4b6"/>
		</linearGradient>
		<linearGradient id="sfh-crys-crystal" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#f4feff"/><stop offset=".4" stop-color="#7fe8ff"/><stop offset="1" stop-color="#1689b2"/>
		</linearGradient>
		<filter id="sfh-crys-seam" x="-5%" y="-400%" width="110%" height="900%"><feGaussianBlur stdDeviation="2.5"/></filter>
		<filter id="sfh-crys-halo" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9"/></filter>
	</defs>
	<path id="sfh-arm" d="M300 760 C 470 748 810 748 980 760 L 1000 860 L 280 860 Z" fill="url(#sfh-crys-shell)" stroke="#b9c8d6" stroke-width="1.5"/>
	<path d="M314 778 C 470 767 810 767 966 778" fill="none" stroke="#4fd8ff" stroke-width="3" filter="url(#sfh-crys-seam)"/>
	<path d="M314 778 C 470 767 810 767 966 778" fill="none" stroke="#c8f6ff" stroke-width="1"/>
	<path d="M308 800 C 470 789 810 789 972 800" fill="none" stroke="#a9b8c7" stroke-width="1"/>
	<circle class="sfh-gem-glow" cx="640" cy="768" r="32" fill="#7fe8ff" filter="url(#sfh-crys-halo)"/>
	<g id="sfh-band" ${POWER}>
		<path d="M596 768 L 612 756 H 668 L 684 768 L 668 780 H 612 Z" fill="#eef4f9" stroke="#a9b8c7" stroke-width="1.5"/>
		<path d="M640 736 L 668 768 L 640 804 L 612 768 Z" fill="url(#sfh-crys-crystal)" stroke="#ffffff" stroke-width="1.6"/>
		<path d="M640 736 L 640 804 M612 768 H 668 M626 752 L 654 786 M654 752 L 626 786" stroke="#ffffff" stroke-opacity=".55" stroke-width=".9"/>
		<path d="M640 742 L 652 760 L 640 768 Z" fill="#ffffff" fill-opacity=".55"/>
	</g>`,
};

/** The Cyberdeck: a slab with a neon edge, rows of little keys either side, and a glitched logo for the switch. */
const keys = [];
for (const [x0, x1] of [[322, 556], [724, 958]]) {
	for (let r = 0; r < 2; r++) {
		for (let x = x0, i = 0; x + 10 <= x1; x += 14, i++) {
			const lit = (i * 7 + r * 3 + x0) % 11 === 0;
			keys.push(`<rect x="${x}" y="${764 + r * 11}" width="10" height="7" rx="1.5" fill="${lit ? '#19f0ff' : '#24142f'}" fill-opacity="${lit ? 0.85 : 1}" stroke="#ff2bd6" stroke-opacity=".45" stroke-width=".7"/>`);
		}
	}
}
export const CYBERDECK = {
	viewBox: ARM.viewBox,
	deck: ARM.deck,
	svg: `
	<defs>
		<linearGradient id="sfh-cy-body" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#21122d"/><stop offset=".4" stop-color="#110817"/><stop offset="1" stop-color="#050208"/>
		</linearGradient>
		<filter id="sfh-cy-neon" x="-5%" y="-400%" width="110%" height="900%"><feGaussianBlur stdDeviation="3"/></filter>
	</defs>
	<path id="sfh-arm" d="M292 768 L 312 754 H 968 L 988 768 L 1004 860 H 276 Z" fill="url(#sfh-cy-body)" stroke="#ff2bd6" stroke-width="1.5"/>
	<path d="M312 754 H 968" stroke="#ff2bd6" stroke-width="4" filter="url(#sfh-cy-neon)"/>
	<path d="M312 754 H 968" stroke="#ffd6f6" stroke-width="1"/>
	<path d="M300 792 H 540 l 8 6 M980 792 H 740 l -8 6" fill="none" stroke="#19f0ff" stroke-width="1.6"/>
	<path d="M300 792 H 540 M980 792 H 740" stroke="#19f0ff" stroke-width="3" filter="url(#sfh-cy-neon)" opacity=".7"/>
	${keys.join('')}
	<g id="sfh-band" ${POWER}>
		<rect x="584" y="752" width="112" height="44" rx="4" fill="#0b0612" stroke="#19f0ff" stroke-width="2"/>
		<g font-family="Audiowide, sans-serif" font-size="22" text-anchor="middle">
			<text x="638" y="782" fill="#19f0ff" opacity=".8">J4CK</text>
			<text x="642" y="781" fill="#ff2bd6" opacity=".8">J4CK</text>
			<text x="640" y="781" fill="#fff0fb">J4CK</text>
		</g>
		<rect x="590" y="768" width="100" height="3" fill="#0b0612"/>
		<rect x="604" y="774" width="70" height="2" fill="#19f0ff" opacity=".6"/>
	</g>`,
};

/**
 * The Lonestar Edition: the forearm unit of Scorpious187's Pip-Boy, in its olive paint, worn only
 * in a Fallout 2d20 world. Its switch is the strip under the unit's screen: the amber POWER lamp,
 * lit while the device is on, and the maker's plate. The plate's title is Wide Glide (Brain Stew
 * Fonts) drawn as outlines, so the font is never shipped.
 */
const LONESTAR_TITLE = 'M1051 -438 988 -321Q948 -246 779 -234Q754 -232 729 -232L352 -233L223 5L-74 7L-36 -64H84L299 -462H179L217 -533H884Q1061 -533 1061 -469Q1061 -457 1051 -438ZM819 -461 476 -462 392 -305H728Q804 -305 823 -340L873 -432Q880 -445 870.5 -453.0Q861 -461 819 -461ZM1413 -395Q1374 -370 1298 -370Q1256 -370 1228 -381Q1207 -393 1207 -409Q1207 -426 1232 -441Q1275 -467 1343 -467Q1389 -467 1412 -454Q1436 -445 1436 -427Q1436 -410 1413 -395ZM1452 0H920L957 -70H1065L1185 -292H1077L1115 -362H1391L1233 -70L1489 -69ZM2055 -283 1794 -284 1674 -62H1928Q1996 -62 2010 -73Q2015 -78 2019 -84L2118 -268Q2119 -270 2120 -271Q2124 -283 2055 -283ZM2160 -10Q2147 -15 2140 -24L2138 -26Q2080 8 1948 8H1637L1600 76L1601 77L1563 147H1296L1334 76H1432L1627 -284H1521L1559 -354H2136Q2279 -354 2294 -311Q2300 -294 2290 -276L2218 -142Q2216 -131 2216 -122Q2216 -105 2223 -95Q2239 -78 2286 -78L2284 -76H2389L2302 -2H2196Q2190 0 2151 -3ZM2977 -202H2438L2472 -265H3011ZM3910 -271Q3956 -257 3956 -229Q3956 -218 3949 -205L3890 -95Q3855 -30 3751 -8Q3690 5 3589 5H2918L2957 -66H3077L3292 -464H3172L3210 -535H3873Q3940 -535 3993 -523Q4078 -504 4078 -458Q4078 -446 4068.5 -427.0Q4059 -408 4042 -373Q4015 -322 3997 -306Q3975 -287 3914 -272ZM3899 -456Q3890 -463 3845 -463L3469 -464L3386 -310H3756Q3833 -310 3851 -344L3899 -434Q3907 -448 3899 -456ZM3723 -236 3346 -237 3254 -66H3624Q3701 -66 3720 -101L3777 -208Q3784 -222 3775.5 -229.0Q3767 -236 3723 -236ZM4510 -292 4343 -293Q4279 -293 4262 -280Q4257 -276 4253 -269L4154 -86Q4149 -77 4154 -75Q4167 -70 4215 -70L4438 -71Q4476 -73 4486 -92L4586 -277Q4593 -290 4555 -292Q4533 -292 4510 -292ZM4989 -284H4992L4905 -210Q4853 -210 4853 -210Q4752 -203 4722 -213L4719 -214L4642 -71Q4604 -1 4415 -1H4137Q3975 -1 3975 -54Q3975 -64 3982 -77L4098 -292Q4136 -362 4325 -362L4603 -363Q4764 -363 4764 -307Q4764 -303 4763 -298H5005ZM5751 -264H5632L5022 166H4814L5085 -25L4982 -264H4853L4901 -354H5304L5255 -264H5183L5235 -124L5425 -264H5345L5393 -354H5800Z';
export const LONESTAR = {
	viewBox: ARM.viewBox,
	deck: ARM.deck,
	svg: `
	<defs>
		<linearGradient id="sfh-ls-paint" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#6c794b"/><stop offset=".3" stop-color="#4f5b35"/><stop offset="1" stop-color="#262c19"/>
		</linearGradient>
		<linearGradient id="sfh-ls-sleeve" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#3b3a35"/><stop offset=".5" stop-color="#22211e"/><stop offset="1" stop-color="#0e0e0d"/>
		</linearGradient>
		<pattern id="sfh-ls-rib" width="12" height="10" patternUnits="userSpaceOnUse"><rect width="3" height="10" fill="#000" opacity=".4"/></pattern>
		<linearGradient id="sfh-ls-rubber" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#45443e"/><stop offset=".5" stop-color="#2b2a26"/><stop offset="1" stop-color="#1a1917"/>
		</linearGradient>
		<radialGradient id="sfh-ls-dome" cx=".35" cy=".3" r=".75">
			<stop offset="0" stop-color="#d8d6cc"/><stop offset=".5" stop-color="#77756c"/><stop offset="1" stop-color="#1c1c1a"/>
		</radialGradient>
		<radialGradient id="sfh-ls-lamp-off" cx=".4" cy=".35" r=".7">
			<stop offset="0" stop-color="#b98a52"/><stop offset=".6" stop-color="#6b3f12"/><stop offset="1" stop-color="#2a1604"/>
		</radialGradient>
		<radialGradient id="sfh-ls-lamp-on" cx=".4" cy=".35" r=".7">
			<stop offset="0" stop-color="#fff6d2"/><stop offset=".45" stop-color="#ffb43c"/><stop offset="1" stop-color="#9a4300"/>
		</radialGradient>
		<filter id="sfh-ls-halo" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6"/></filter>
		<filter id="sfh-ls-grime" x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency=".02 .035" numOctaves="4" seed="11" result="blotch"/>
			<feColorMatrix in="blotch" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.15" result="a"/>
			<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="3" result="grain"/>
			<feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.2 .62" result="b"/>
			<feMerge><feMergeNode in="a"/><feMergeNode in="b"/></feMerge>
		</filter>
		<clipPath id="sfh-ls-body"><path d="M300 768 Q 300 750 320 750 H 960 Q 980 750 980 768 L 992 860 H 288 Z"/></clipPath>
		<path id="sfh-ls-title" d="${LONESTAR_TITLE}"/>
	</defs>
	<path d="M276 802 Q 640 794 1004 802 V 860 H 276 Z" fill="url(#sfh-ls-sleeve)"/>
	<path d="M276 802 Q 640 794 1004 802 V 860 H 276 Z" fill="url(#sfh-ls-rib)"/>
	<path id="sfh-arm" d="M300 768 Q 300 750 320 750 H 960 Q 980 750 980 768 L 992 860 H 288 Z" fill="url(#sfh-ls-paint)" stroke="#11140b" stroke-width="2"/>
	<g clip-path="url(#sfh-ls-body)"><rect x="276" y="728" width="728" height="132" filter="url(#sfh-ls-grime)" opacity=".34"/></g>
	<path d="M316 753 H 964" stroke="#fff" stroke-opacity=".18" stroke-width="1.5"/>
	<path d="M420 752 L 414 860 M860 752 L 866 860" stroke="#000" stroke-opacity=".45" stroke-width="2"/>
	<g fill="#0d0d0c"><rect x="318" y="762" width="40" height="3.5" rx="1.7"/><rect x="318" y="769" width="40" height="3.5" rx="1.7"/><rect x="318" y="776" width="40" height="3.5" rx="1.7"/><rect x="318" y="783" width="40" height="3.5" rx="1.7"/><rect x="318" y="790" width="40" height="3.5" rx="1.7"/></g>
	<g fill="#0b0b0a"><circle cx="924" cy="764" r="1.8"/><circle cx="931" cy="764" r="1.8"/><circle cx="938" cy="764" r="1.8"/><circle cx="945" cy="764" r="1.8"/><circle cx="952" cy="764" r="1.8"/><circle cx="959" cy="764" r="1.8"/><circle cx="966" cy="764" r="1.8"/><circle cx="927" cy="771" r="1.8"/><circle cx="934" cy="771" r="1.8"/><circle cx="941" cy="771" r="1.8"/><circle cx="948" cy="771" r="1.8"/><circle cx="955" cy="771" r="1.8"/><circle cx="962" cy="771" r="1.8"/><circle cx="969" cy="771" r="1.8"/><circle cx="924" cy="778" r="1.8"/><circle cx="931" cy="778" r="1.8"/><circle cx="938" cy="778" r="1.8"/><circle cx="945" cy="778" r="1.8"/><circle cx="952" cy="778" r="1.8"/><circle cx="959" cy="778" r="1.8"/><circle cx="966" cy="778" r="1.8"/><circle cx="927" cy="785" r="1.8"/><circle cx="934" cy="785" r="1.8"/><circle cx="941" cy="785" r="1.8"/><circle cx="948" cy="785" r="1.8"/><circle cx="955" cy="785" r="1.8"/><circle cx="962" cy="785" r="1.8"/><circle cx="969" cy="785" r="1.8"/><circle cx="924" cy="792" r="1.8"/><circle cx="931" cy="792" r="1.8"/><circle cx="938" cy="792" r="1.8"/><circle cx="945" cy="792" r="1.8"/><circle cx="952" cy="792" r="1.8"/><circle cx="959" cy="792" r="1.8"/><circle cx="966" cy="792" r="1.8"/></g>
	<g fill="#3a4327" stroke="#000" stroke-opacity=".6">
		<rect x="440" y="741" width="64" height="12" rx="3"/><rect x="776" y="741" width="64" height="12" rx="3"/>
	</g>
	<g fill="url(#sfh-ls-dome)">
		<circle cx="448" cy="747" r="2.6"/><circle cx="496" cy="747" r="2.6"/><circle cx="784" cy="747" r="2.6"/><circle cx="832" cy="747" r="2.6"/>
	</g>
	<circle class="sfh-ls-halo" cx="578" cy="771" r="20" fill="#ffb43c" filter="url(#sfh-ls-halo)"/>
	<g id="sfh-band" ${POWER}>
		<rect x="552" y="744" width="176" height="54" rx="10" fill="url(#sfh-ls-rubber)" stroke="#000" stroke-opacity=".7"/>
		<circle cx="578" cy="771" r="15" fill="#111" stroke="#55534b" stroke-width="2"/>
		<circle class="sfh-ls-bulb" cx="578" cy="771" r="10.5" fill="url(#sfh-ls-lamp-off)"/>
		<ellipse cx="574.5" cy="767" rx="3.5" ry="2.2" fill="#fff" opacity=".45"/>
		<use href="#sfh-ls-title" transform="translate(603 778.3) scale(.019)" fill="#111" opacity=".85"/>
		<use href="#sfh-ls-title" transform="translate(602 777) scale(.019)" fill="#e9e6da"/>
		<text x="657" y="791" text-anchor="middle" font-family="Rajdhani, sans-serif" font-weight="700" font-size="7.4" letter-spacing="1.6" fill="#a9a698" opacity=".75">LONESTAR EDITION</text>
	</g>`,
};

const ART = {
	arm: ARM, disc: DISC, satchel: SATCHEL, grove: GROVE, bracer: BRACER, reliquary: RELIQUARY, runeforge: RUNEFORGE, witchfire: WITCHFIRE,
	holoprojector: HOLOPROJECTOR, gauntlet: GAUNTLET, comm: COMM, crystal: CRYSTAL, cyberdeck: CYBERDECK, lonestar: LONESTAR,
};

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
