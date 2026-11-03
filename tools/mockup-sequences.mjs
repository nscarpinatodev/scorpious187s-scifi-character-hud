/*
 * Sequence mock-ups, played on the real projection in the harness (harness-device.html?mockup).
 * Nothing here is part of the module: it is a place to try openings before building one.
 *
 *   More fantasy looks: the Reliquary, Runeforge and Witchfire over the Vambrace, the Grove
 *                over the Journal, each a palette and a little art.
 *   The Journal: a satchel the book slides out of before it opens, and the writing fading in
 *                as the Marauder's Map's does: ink blooming out from where it is touched,
 *                soaking up through the paper unevenly and settling sharp.
 *
 * The Vambrace's arcane bolts were chosen and are built (scripts/projection/bolts.mjs); its
 * button here plays the real thing.
 */
import { SEQ_LONG } from '../scripts/constants.mjs';

const { Projection, DeviceChrome, store } = SFH;
const mock = { ink: 'marauder', satchel: true };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------------------------------- styles */

const css = document.createElement('style');
css.textContent = `
#sfh-projection .sfh-stage[data-mock-run] .slot,
#sfh-projection .sfh-stage[data-mock-run] .navb { animation: none !important; }
#sfh-projection .sfh-stage[data-mock-run] :is(.slot, .navb):not(.mock-lit) { opacity: 0 !important; }
#sfh-projection .sfh-stage[data-mock-run] .jb-ink { display: none; }
/* the satchel's flap turns on its hinge (openFlap, closeFlap): open, it is folded away behind the bag */
#sfh-device svg.sfh-art { overflow: visible; }
.mock-flap { transform-box: fill-box; transform-origin: 50% 0; }
.mock-flap.open { transform: scaleY(-.2); opacity: 0; }
.mock-straps.free { transform: translateY(-58px); }
#sfh-device svg.sfh-art.mock-out .mock-artback { visibility: hidden; }
#mock { display: flex; flex-direction: column; gap: 5px; border-top: 1px solid #556; margin-top: 4px; padding-top: 8px; }
#mock b { color: #fff; font-weight: 600; }
#mock .row { display: flex; gap: 6px; }
#mock button { flex: 1; }
`;
document.head.append(css);

/* ---------------------------------------------------------------- the satchel */

/*
 * The Journal's strap, as a satchel the book is kept in. Its back stands above its front, and the
 * flap is hinged on the back and buckled down over the mouth: two straps run down from it through
 * clasps on the front, over the clasps' outer edges and under their middle bars. The left clasp is
 * the switch. The macro bar's tags hang on the front.
 *
 * The art is drawn over the projection, so the book could only ever pass in front of a back drawn
 * there. While the book is out, the back is drawn again behind it, inside the projection
 * (satchelBack), in exactly the same place; the art's own copy is hidden for as long.
 */
const BACK = `
	<path d="M292 762 V 726 Q 292 712 308 712 H 972 Q 988 712 988 726 V 762 Z" fill="url(#mock-inside)" stroke="#2a0f08" stroke-width="1.5"/>
	<path d="M300 724 Q 300 718 310 718 H 970 Q 980 718 980 724" fill="none" stroke="#e8c496" stroke-opacity=".3" stroke-width="1.1" stroke-dasharray="6 5"/>
	<path d="M282 760 L 292 718 L 300 760 Z M998 760 L 988 718 L 980 760 Z" fill="#2c100a" stroke="#1a0805"/>`;
const INSIDE = `<linearGradient id="mock-inside" x1="0" y1="0" x2="0" y2="1">
	<stop offset="0" stop-color="#5a2618"/><stop offset=".25" stop-color="#2a0f08"/><stop offset="1" stop-color="#0e0402"/>
</linearGradient>`;
const strap = (x) => `<path d="M${x} 770 H ${x + 28} V 842 Q ${x + 14} 856 ${x} 842 Z" fill="url(#mock-flapleather)" stroke="#2a0f08" stroke-width="1.2"/>
	<path d="M${x + 4} 772 V 840 M${x + 24} 772 V 840" stroke="#e8c496" stroke-opacity=".35" stroke-width="1" stroke-dasharray="4 4"/>`;
const clasp = (x) => `<rect x="${x}" y="796" width="40" height="40" rx="6" fill="none" stroke="url(#sfh-brass)" stroke-width="6"/>`;
const bar = (x) => `<rect x="${x - 4}" y="813" width="48" height="6" rx="2" fill="url(#sfh-brass)" stroke="#5a440c" stroke-width=".8"/>`;
const SATCHEL = `
	<defs>
		<linearGradient id="sfh-leather" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#6a3020"/><stop offset=".55" stop-color="#43190f"/><stop offset="1" stop-color="#2c100a"/>
		</linearGradient>
		<linearGradient id="mock-flapleather" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#7a3826"/><stop offset="1" stop-color="#4a1c12"/>
		</linearGradient>
		${INSIDE}
		<linearGradient id="sfh-brass" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#f0d27a"/><stop offset=".45" stop-color="#c9a227"/><stop offset="1" stop-color="#7a5f12"/>
		</linearGradient>
		<filter id="mock-bagshadow" x="-5%" y="-40%" width="110%" height="200%"><feDropShadow dx="0" dy="-4" stdDeviation="6" flood-opacity=".55"/></filter>
	</defs>
	<!-- the back of the bag and the dark inside it -->
	<g class="mock-artback">${BACK}</g>
	<!-- the front, which the book rises from behind -->
	<path id="sfh-arm" d="M282 758 Q 282 742 300 742 H 980 Q 998 742 998 758 V 860 H 282 Z"
		fill="url(#sfh-leather)" stroke="#2a0f08" stroke-width="1.5" filter="url(#mock-bagshadow)"/>
	<path d="M286 756 Q 286 745 300 745 H 980 Q 994 745 994 756" fill="none" stroke="#1a0805" stroke-width="5" stroke-opacity=".7"/>
	<path d="M294 860 V 762 Q 294 752 306 752 H 974 Q 986 752 986 762 V 860" fill="none" stroke="#e8c496" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="6 5"/>
	<!-- the clasps' frames: the straps pass over them -->
	${clasp(312)}${clasp(928)}
	<!-- the flap, hinged on the back, and its straps, which run under it -->
	<g class="mock-flap">
		<g class="mock-straps">${strap(318)}${strap(934)}</g>
		<path d="M288 724 Q 288 710 304 710 H 976 Q 992 710 992 724 V 778 Q 640 796 288 778 Z" fill="url(#mock-flapleather)" stroke="#2a0f08" stroke-width="1.5"/>
		<path d="M298 726 Q 298 718 308 718 H 972 Q 982 718 982 726 V 772 Q 640 789 298 772" fill="none" stroke="#e8c496" stroke-opacity=".4" stroke-width="1.2" stroke-dasharray="6 5"/>
	</g>
	<!-- the clasps' middle bars, over the straps -->
	${bar(312)}${bar(928)}
	<g id="sfh-band" role="button" tabindex="0" aria-label="Power">
		<rect x="304" y="788" width="56" height="56" rx="7" fill="#2c100a" fill-opacity=".001"/>
	</g>`;

let strapSvg = null;
function syncSatchel() {
	const art = document.querySelector('#sfh-device svg.sfh-art');
	if (!art) return;
	const isStrap = art.querySelector('#sfh-arm')?.getAttribute('d')?.startsWith('M290 792');
	if (store.device === 'journal' && mock.satchel && isStrap) {
		strapSvg = art.innerHTML;
		art.innerHTML = SATCHEL;
		// put on with the power already on (no sequence), it is open and the book out
		const on = document.body.dataset.sfhPower === 'on';
		art.querySelector('.mock-flap').classList.toggle('open', on);
		art.querySelector('.mock-straps').classList.toggle('free', on);
		art.classList.toggle('mock-out', on);
	} else if ((!mock.satchel || store.device !== 'journal') && strapSvg && art.querySelector('.mock-flap')) {
		art.innerHTML = strapSvg;
		art.classList.remove('mock-out');
	}
	SEQ_LONG.book.on = mock.satchel ? 6000 : 3900;
	SEQ_LONG.book.off = mock.satchel ? 1800 : 1350;
}

/** The back of the bag, drawn again inside the projection behind the book, where the art has it. */
function satchelBack(stage) {
	stage.querySelector('.mock-back')?.remove();
	const art = document.querySelector('#sfh-device svg.sfh-art');
	if (!art?.querySelector('.mock-flap')) return;
	const m = art.getScreenCTM(), r = stage.getBoundingClientRect(), k = r.height / stage.offsetHeight;
	const at = [m.a / k, m.b / k, m.c / k, m.d / k, (m.e - r.left) / k, (m.f - r.top) / k].map((n) => n.toFixed(4)).join(' ');
	stage.querySelector('.jb').insertAdjacentHTML('beforebegin', `<svg class="mock-back" width="1" height="1"
		style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none"><defs>${INSIDE}</defs><g transform="matrix(${at})">${BACK}</g></svg>`);
}

/*
 * The flap turning over on its hinge, seen from the front: it shortens as it swings up to edge-on,
 * shows its darker underside as it stands up past the hinge, then tips back behind the bag and
 * out of sight. Closing is the same turn backward: it rises from behind, comes over and down.
 * The straps are pulled up out of the clasps first, and pushed back down into them last.
 */
const FLIP = [
	{ transform: 'scaleY(1)', filter: 'brightness(1)', opacity: 1 },
	{ offset: 0.38, transform: 'scaleY(.06)', filter: 'brightness(.62)', opacity: 1 },
	{ offset: 0.4, transform: 'scaleY(-.06)', filter: 'brightness(.5)', opacity: 1 },
	{ offset: 0.7, transform: 'scaleY(-.92)', filter: 'brightness(.72)', opacity: 1 },
	{ offset: 0.88, transform: 'scaleY(-.6)', filter: 'brightness(.55)', opacity: 0.7 },
	{ offset: 1, transform: 'scaleY(-.2)', filter: 'brightness(.4)', opacity: 0 },
];
const PULL = [{ transform: 'translateY(0)' }, { transform: 'translateY(-58px)' }];
const STRAPS = 320, TURN = 700;   // ms
function openFlap() {
	const art = document.querySelector('#sfh-device svg.sfh-art');
	const flap = art?.querySelector('.mock-flap'), straps = art?.querySelector('.mock-straps');
	if (!flap) return;
	straps.classList.add('free');
	straps.animate(PULL, { duration: STRAPS, easing: 'cubic-bezier(.5,0,.4,1)' });
	flap.classList.add('open');
	flap.animate(FLIP, { delay: STRAPS - 40, duration: TURN, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'backwards' });
	// the book has risen in front of the back by then: the projection's copy takes over
	setTimeout(() => art.classList.add('mock-out'), STRAPS + 500);
}
function closeFlap() {
	const art = document.querySelector('#sfh-device svg.sfh-art');
	const flap = art?.querySelector('.mock-flap'), straps = art?.querySelector('.mock-straps');
	if (!flap) return;
	art.classList.remove('mock-out');
	flap.classList.remove('open');
	flap.animate(FLIP, { duration: TURN, easing: 'cubic-bezier(.45,.05,.55,.95)', direction: 'reverse' });
	straps.classList.remove('free');
	straps.animate([...PULL].reverse(), { delay: TURN - 40, duration: STRAPS, easing: 'cubic-bezier(.5,0,.4,1)', fill: 'backwards' });
}

/* ---------------------------------------------------------------- helpers */

/** A panel's box on the board, from its styles: the board's own units. */
function box(el) {
	const s = getComputedStyle(el);
	return { x: parseFloat(s.left) || 0, y: parseFloat(s.top) || 0, w: parseFloat(s.width) || el.offsetWidth, h: parseFloat(s.height) || el.offsetHeight };
}

let run = 0;
function begin(stage) {
	const id = ++run;
	stage.dataset.mockRun = '';
	stage.querySelectorAll('.mock-lit').forEach((el) => el.classList.remove('mock-lit'));
	return () => id === run;
}
function end(stage, live) {
	if (!live()) return;
	// let go only once the sequence is over: the module's own animations would start again
	if (stage.classList.contains('sfh-seq-on')) return setTimeout(() => end(stage, live), 100);
	delete stage.dataset.mockRun;
	stage.querySelectorAll('.mock-lit').forEach((el) => el.classList.remove('mock-lit'));
}

/* ---------------------------------------------------------------- the Journal */

const BOOK = { cx: 640, cy: 434, half: 416 };   // .jb's middle on the board, and half its height with the boards

/** Where the satchel's mouth is, on the board. */
function mouth(stage) {
	const arm = document.querySelector('#sfh-device #sfh-arm');
	const s = stage.getBoundingClientRect();
	const k = s.height / stage.offsetHeight;
	return (arm.getBoundingClientRect().top - s.top) / k + 2;
}

/** Out of the satchel: the flap flips open and falls away, the book slides up out of the mouth, grows, and opens. */
function bookOut(stage) {
	const jb = stage.querySelector('.jb');
	const M = mouth(stage), s = 0.45;
	const inside = M - BOOK.cy + BOOK.half * s + 8, outside = M - BOOK.cy - BOOK.half * s - 10;
	const small = -(319 * s);   // the closed book is the right half and its cover: keep it over the bag's middle
	// the straps are pulled free, the flap turns over and away, and the book follows it out
	const T = 3.4, at = (x) => x / T;
	const layer = jb.parentElement;
	openFlap();
	satchelBack(stage);
	layer.style.clipPath = `polygon(-4000px -4000px, 5000px -4000px, 5000px ${M}px, -4000px ${M}px)`;
	setTimeout(() => layer.style.removeProperty('clip-path'), 1600);
	jb.animate([
		{ offset: 0, transform: `translate(${small}px, ${inside}px) scale(${s})`, opacity: 1 },
		{ offset: at(0.8), transform: `translate(${small}px, ${inside}px) scale(${s})`, easing: 'cubic-bezier(.25,.7,.35,1)' },
		{ offset: at(1.6), transform: `translate(${small}px, ${outside}px) scale(${s})`, easing: 'cubic-bezier(.45,.05,.3,1)' },
		{ offset: at(2.2), transform: 'translate(-300px, 0) scale(1)', easing: 'cubic-bezier(.45,.05,.25,1)' },
		{ offset: 1, transform: 'none', opacity: 1 },
	], { duration: T * 1000 });
	jb.querySelector('.jb-leaf').animate([
		{ offset: 0, transform: 'none', visibility: 'visible' },
		{ offset: at(2.2), transform: 'none', visibility: 'visible', easing: 'cubic-bezier(.45,.05,.25,1)' },
		{ offset: 0.995, transform: 'rotateY(-180deg)', visibility: 'visible' },
		{ offset: 1, transform: 'rotateY(-180deg)', visibility: 'hidden' },
	], { duration: T * 1000 });
	for (const el of jb.querySelectorAll('.jb-page.l, .jb-board.l')) {
		el.animate([{ visibility: 'hidden' }, { offset: 0.999, visibility: 'hidden' }, { visibility: 'visible' }], { duration: T * 1000 });
	}
	return T;
}

/** And back in: it shuts, shrinks over the bag and sinks into it; then the flap rises from behind and closes. */
function bookIn(stage) {
	const jb = stage.querySelector('.jb');
	const M = mouth(stage), s = 0.45;
	const inside = M - BOOK.cy + BOOK.half * s + 8, outside = M - BOOK.cy - BOOK.half * s - 10;
	const small = -(319 * s);
	const T = 1.7, at = (x) => x / T;
	const layer = jb.parentElement;
	layer.style.clipPath = `polygon(-4000px -4000px, 5000px -4000px, 5000px ${M}px, -4000px ${M}px)`;
	setTimeout(() => layer.style.removeProperty('clip-path'), T * 1000 + 200);
	satchelBack(stage);
	setTimeout(closeFlap, 1650);   // once the book is all the way in
	jb.animate([
		{ offset: 0, transform: 'none', opacity: 1 },
		{ offset: at(0.15), transform: 'none', easing: 'cubic-bezier(.45,.05,.25,1)' },
		{ offset: at(0.8), transform: 'translate(-300px, 0) scale(1)', easing: 'cubic-bezier(.45,.05,.3,1)' },
		{ offset: at(1.2), transform: `translate(${small}px, ${outside}px) scale(${s})`, easing: 'cubic-bezier(.5,0,.75,0)' },
		{ offset: 1, transform: `translate(${small}px, ${inside}px) scale(${s})`, opacity: 1 },
	], { duration: T * 1000, fill: 'forwards' });
	jb.querySelector('.jb-leaf').animate([
		{ offset: 0, transform: 'rotateY(-180deg)', visibility: 'visible' },
		{ offset: at(0.15), transform: 'rotateY(-180deg)', visibility: 'visible', easing: 'cubic-bezier(.45,.05,.25,1)' },
		{ offset: at(0.8), transform: 'none', visibility: 'visible' },
		{ offset: 1, transform: 'none', visibility: 'visible' },
	], { duration: T * 1000, fill: 'forwards' });
}

/*
 * The ink's bloom: a soft disc of ink, ragged at its edge, whose middle is solid and whose rim
 * fades out unevenly. Grown from the touch, it fades the writing in outward across the pages,
 * the far side last, patchy where the rim is passing.
 */
const BLOOM = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
	<defs>
		<radialGradient id='g'><stop offset='0'/><stop offset='.5'/><stop offset='.78' stop-opacity='.35'/><stop offset='1' stop-opacity='0'/></radialGradient>
		<filter id='f' x='-20%' y='-20%' width='140%' height='140%'>
			<feTurbulence type='fractalNoise' baseFrequency='.035' numOctaves='4' seed='3'/>
			<feDisplacementMap in='SourceGraphic' scale='34' xChannelSelector='R' yChannelSelector='G'/>
		</filter>
	</defs>
	<circle cx='100' cy='100' r='88' fill='url(#g)' filter='url(#f)'/></svg>`)}")`;

/** The Marauder's Map: touched at the spine, the writing fades in, spreading out across both pages. */
function marauder(stage, start) {
	const live = begin(stage);
	const touch = { x: 640, y: 434 };   // the spine, half way down
	const size = 3600, ms = 2400;       // big enough that the solid middle passes the farthest corner
	setTimeout(() => {
		if (!live()) return;
		for (const el of stage.querySelectorAll('.slot, .navb')) {
			const b = box(el);
			const x = touch.x - b.x, y = touch.y - b.y;
			Object.assign(el.style, { maskImage: BLOOM, maskRepeat: 'no-repeat' });
			el.classList.add('mock-lit');
			// the bloom grows about the touch, laid against the book rather than the panel, so every panel shares it
			const a = el.animate([
				{ maskSize: '0px 0px', maskPosition: `${x}px ${y}px`, filter: 'blur(1.6px)' },
				{ maskSize: `${size}px ${size}px`, maskPosition: `${x - size / 2}px ${y - size / 2}px`, filter: 'blur(0px)' },
			], { duration: ms, easing: 'cubic-bezier(.35,.15,.45,1)', fill: 'forwards' });
			a.onfinish = () => { el.style.removeProperty('mask-image'); el.style.removeProperty('mask-repeat'); a.cancel(); };
		}
		setTimeout(() => end(stage, live), ms + 100);
	}, start * 1000);
}

function journalOn(stage) {
	const open = mock.satchel ? bookOut(stage) : 1.9;
	if (mock.ink === 'marauder') return marauder(stage, open - 0.1);
	// the spilled ink, waiting for the book to come out of the satchel
	if (mock.satchel) {
		for (const el of stage.querySelectorAll('.slot, .navb, .jb-ink')) el.style.animationDelay = `${open}s`;
		setTimeout(() => stage.querySelectorAll('.slot, .navb, .jb-ink').forEach((el) => el.style.removeProperty('animation-delay')), (open + 2) * 1000);
	}
}

/* ---------------------------------------------------------------- more fantasy looks */

/*
 * The four looks proposed with the Journal and the Vambrace, each a palette and a little art over
 * one of those two: the Reliquary (stained glass and gold leading, for clerics), the Runeforge
 * (stone and brass, runes like embers) and Witchfire (bone, and a green flame) over the Vambrace;
 * the Grove (a druid's herbarium: green leather and pressed leaves) over the Journal.
 */
const LOOKS = {
	reliquary: { base: 'vambrace', label: 'Reliquary' },
	runeforge: { base: 'vambrace', label: 'Runeforge' },
	witchfire: { base: 'vambrace', label: 'Witchfire' },
	grove: { base: 'journal', label: 'Grove' },
};
const stage = (look) => `body[data-mock-look="${look}"] #sfh-projection .sfh-stage[data-device="${LOOKS[look].base}"]`;
const ui = (look) => `body[data-mock-look="${look}"][data-sfh-device="${LOOKS[look].base}"]`;
const leaf = (fill) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 100'><path d='M30 98 C 30 70 30 40 30 6' stroke='${fill}' stroke-width='1.6' fill='none'/><path d='M30 8 C 6 26 4 62 30 90 C 56 62 54 26 30 8 Z' fill='${fill}' fill-opacity='.35' stroke='${fill}' stroke-opacity='.6'/><path d='M30 30 L 16 22 M30 46 L 13 36 M30 62 L 15 52 M30 30 L 44 22 M30 46 L 47 36 M30 62 L 45 52' stroke='${fill}' stroke-opacity='.5'/></svg>`)}")`;
const looksCss = document.createElement('style');
looksCss.textContent = `
/* the Reliquary: leaded glass in jewel colors, gold for the leading, light through it */
${stage('reliquary')} {
	--pnl: rgba(22, 14, 30, .86); --pnl2: rgba(232, 194, 90, .05); --line: rgba(214, 170, 70, .7); --line2: rgba(214, 170, 70, .2);
	--text: #f2e8d6; --bright: #fff8e8; --dim: #b8a68a; --hot: #e8c25a; --hotbg: rgba(232, 194, 90, .18); --hover: rgba(232, 194, 90, .12);
	--glow: rgba(232, 194, 90, .45); --acc: #e0577f; --accbg: rgba(224, 87, 127, .16); --good: #6fd89a;
}
${stage('reliquary')} .pnl {
	background:
		radial-gradient(circle at 12% 18%, rgba(196, 40, 80, .2), transparent 38%),
		radial-gradient(circle at 88% 30%, rgba(40, 90, 200, .22), transparent 40%),
		radial-gradient(circle at 30% 92%, rgba(30, 150, 90, .18), transparent 42%),
		linear-gradient(var(--pnl), var(--pnl)) padding-box,
		linear-gradient(140deg, #f2d27a, #8a6a14 45%, #f2d27a 70%, #8a6a14) border-box;
	border: 2px solid transparent;
}
${stage('reliquary')} .pnl::before { content: '✠ ✠'; color: #e8c25a; }
${stage('reliquary')} .vb-sigil :is(circle, path) { stroke: #e8c25a; }
${stage('reliquary')} .vb-sigil text { fill: #e8c25a; }
body[data-mock-look="reliquary"] #sfh-device svg.sfh-art { filter: hue-rotate(195deg) saturate(1.3) brightness(1.1); }
${ui('reliquary')} { --sfh-hot: #e8c25a; --sfh-glow: rgb(232 194 90 / 45%); --sfh-line: rgb(214 170 70 / 60%); --sfh-acc: #e0577f; --sfh-panel: rgb(22 14 30 / 90%); --sfh-text: #f2e8d6; --sfh-dim: #b8a68a; --sfh-bright: #fff8e8; --sfh-hover: rgb(232 194 90 / 12%); }

/* the Runeforge: dressed stone, brass at the edges, runes glowing like a forge's coals */
${stage('runeforge')} {
	--pnl: rgba(40, 38, 36, .95); --pnl2: rgba(196, 150, 74, .05); --line: rgba(196, 150, 74, .75); --line2: rgba(196, 150, 74, .2);
	--text: #ece4d8; --bright: #fff6ea; --dim: #a59a8a; --hot: #ff9a3c; --hotbg: rgba(255, 154, 60, .16); --hover: rgba(255, 154, 60, .1);
	--glow: rgba(255, 130, 40, .5); --acc: #c4964a; --accbg: rgba(196, 150, 74, .16);
}
${stage('runeforge')} .pnl {
	background:
		url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.08' numOctaves='4'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .48 0 0 0 0 .44 0 0 0 .16 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E"),
		linear-gradient(var(--pnl), var(--pnl)) padding-box,
		linear-gradient(140deg, #e0b870, #6a4a1c 50%, #e0b870) border-box;
	border: 2px solid transparent;
	backdrop-filter: none;
}
${stage('runeforge')} .pnl::after { display: none; }
${stage('runeforge')} .vb-sigil :is(circle, path) { stroke: #ff9a3c; }
${stage('runeforge')} .vb-sigil text { fill: #ff9a3c; }
body[data-mock-look="runeforge"] #sfh-device svg.sfh-art { filter: sepia(.7) hue-rotate(-20deg) saturate(1.4) brightness(.95); }
${ui('runeforge')} { --sfh-hot: #ff9a3c; --sfh-glow: rgb(255 130 40 / 45%); --sfh-line: rgb(196 150 74 / 65%); --sfh-acc: #c4964a; --sfh-panel: rgb(40 38 36 / 94%); --sfh-text: #ece4d8; --sfh-dim: #a59a8a; --sfh-bright: #fff6ea; --sfh-hover: rgb(255 154 60 / 10%); }

/* Witchfire: bone for the frames, a sickly green flame for everything that burns */
${stage('witchfire')} {
	--pnl: rgba(12, 14, 10, .9); --pnl2: rgba(125, 255, 106, .04); --line: rgba(222, 214, 190, .55); --line2: rgba(222, 214, 190, .16);
	--text: #e8e4d4; --bright: #fbf8ee; --dim: #9a9a86; --hot: #7dff6a; --hotbg: rgba(125, 255, 106, .14); --hover: rgba(125, 255, 106, .1);
	--glow: rgba(125, 255, 106, .5); --acc: #d8d0b4; --accbg: rgba(216, 208, 180, .14); --bad: #ff6a5a;
}
${stage('witchfire')} .pnl {
	background:
		radial-gradient(ellipse at 50% 120%, rgba(125, 255, 106, .12), transparent 60%),
		linear-gradient(var(--pnl), var(--pnl)) padding-box,
		linear-gradient(160deg, #f2ead2, #8a8470 40%, #e6dcc0 75%, #6a6656) border-box;
	border: 2px solid transparent;
}
${stage('witchfire')} .pnl::before { content: '☠ ☠'; color: #d8d0b4; text-shadow: 0 0 6px rgba(125, 255, 106, .6); }
${stage('witchfire')} .pnl::after { background: radial-gradient(1.5px 1.5px at 20% 80%, #b8ff9a, transparent), radial-gradient(1px 1px at 60% 70%, #7dff6a, transparent), radial-gradient(1.5px 1.5px at 85% 90%, #b8ff9a, transparent); background-size: 100% 200px; }
${stage('witchfire')} .vb-sigil :is(circle, path) { stroke: #7dff6a; }
${stage('witchfire')} .vb-sigil text { fill: #7dff6a; }
body[data-mock-look="witchfire"] #sfh-device svg.sfh-art { filter: hue-rotate(-95deg) saturate(1.4); }
${ui('witchfire')} { --sfh-hot: #7dff6a; --sfh-glow: rgb(125 255 106 / 45%); --sfh-line: rgb(222 214 190 / 50%); --sfh-acc: #d8d0b4; --sfh-panel: rgb(12 14 10 / 92%); --sfh-text: #e8e4d4; --sfh-dim: #9a9a86; --sfh-bright: #fbf8ee; --sfh-hover: rgb(125 255 106 / 10%); }

/* the Grove: a herbarium bound in green leather, its notes in leaf-green ink, leaves pressed in it */
${stage('grove')} { --hot: #3f6b2a; --hotbg: rgba(63, 107, 42, .12); --hover: rgba(63, 107, 42, .08); --acc: #8a6a14; }
${stage('grove')} :is(.jb-board, .jb-front, .jb-back) { filter: hue-rotate(95deg) saturate(.8) brightness(.9); }
${stage('grove')} .jb-back::after { filter: hue-rotate(-95deg) saturate(1.25) brightness(1.11); }
${stage('grove')} .jb-title { filter: hue-rotate(-95deg) saturate(1.25) brightness(1.11); }
${stage('grove')} .jb-page { background-color: #e6e2c4; }
${stage('grove')} .jb-page.r::after { content: ''; position: absolute; right: 26px; bottom: 30px; width: 70px; height: 116px; transform: rotate(-24deg); background: ${leaf('#4f6b2c')} no-repeat center / contain; pointer-events: none; }
${stage('grove')} .jb-page.l::after { content: ''; position: absolute; left: 70px; bottom: 26px; width: 48px; height: 80px; transform: rotate(18deg); background: ${leaf('#7a6a2c')} no-repeat center / contain; opacity: .8; pointer-events: none; }
body[data-mock-look="grove"] #sfh-device svg.sfh-art { filter: hue-rotate(60deg) saturate(.7); }
${ui('grove')} { --sfh-hot: #3f6b2a; --sfh-heading: #3f6b2a; --sfh-panel: rgb(230 226 196 / 97%); }
`;
document.head.append(looksCss);

async function playLook(look) {
	document.body.dataset.mockLook = look;
	if (!look) return;
	await replay(LOOKS[look].base);
}

/* ---------------------------------------------------------------- wiring */

const play = Projection.playSequence.bind(Projection);
Projection.playSequence = (kind) => {
	syncSatchel();
	play(kind);
	const stage = Projection.element?.querySelector('.sfh-stage');
	if (!stage) return;
	if (kind === 'on' && store.device === 'journal') journalOn(stage);
	if (kind === 'off' && store.device === 'journal' && mock.satchel) bookIn(stage);
};

const rig = document.getElementById('rig');
rig.insertAdjacentHTML('beforeend', `<div id="mock">
	<b>Sequence mock-ups</b>
	<label><input type="checkbox" id="mockSatchel" checked> The Journal comes out of a satchel</label>
	<label>Journal ink <select id="mockInk">
		<option value="marauder">Marauder's Map (fades in)</option>
		<option value="spill">Spilled ink (now)</option>
	</select></label>
	<div class="row"><button type="button" id="mockJournal">Play the Journal</button><button type="button" id="mockVambrace">Play the Vambrace</button></div>
	<label>Fantasy look <select id="mockLook">
		<option value="">As built</option>
		<option value="reliquary">Reliquary (Vambrace)</option>
		<option value="runeforge">Runeforge (Vambrace)</option>
		<option value="witchfire">Witchfire (Vambrace)</option>
		<option value="grove">Grove (Journal)</option>
	</select></label>
</div>`);

async function replay(device) {
	if (store.device !== device) {
		await game.settings.set(null, 'device', device);
		document.getElementById('rigDevice').value = device;
		await wait(500);
	}
	if (Projection.isOpen) {
		DeviceChrome.setPower(false, { silent: true });
		document.querySelector('#sfh-device .mock-flap')?.classList.remove('open');
		document.querySelector('#sfh-device .mock-straps')?.classList.remove('free');
		document.querySelector('#sfh-device svg.sfh-art')?.classList.remove('mock-out');
		await wait(500);
	}
	syncSatchel();
	await wait(200);
	DeviceChrome.toggle();
}

document.getElementById('mockSatchel').addEventListener('change', (e) => { mock.satchel = e.target.checked; syncSatchel(); });
document.getElementById('mockInk').addEventListener('change', (e) => { mock.ink = e.target.value; });
document.getElementById('mockJournal').addEventListener('click', () => replay('journal'));
document.getElementById('mockVambrace').addEventListener('click', () => replay('vambrace'));
document.getElementById('mockLook').addEventListener('change', (e) => playLook(e.target.value));
document.getElementById('rigDevice').addEventListener('change', () => setTimeout(syncSatchel, 300));
globalThis.SFH.mock = { mock, replay, syncSatchel, playLook };
