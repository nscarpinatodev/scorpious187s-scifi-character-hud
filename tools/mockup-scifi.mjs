/*
 * The sci-fi device proposals (design/theme-ideas.md), mocked up on the real projection in the
 * harness (harness-device.html?mockup, Look). Nothing here is part of the module.
 *
 * Each is a device already built, dressed as another: its own palette over the projection and the
 * interface, its own art at the foot of the screen where the device has any, and where the
 * proposal calls for one, its own way of opening. Building one means a device of its own, with
 * its palette in design/1-head.html and styles/device.css, its art in scripts/device/art.mjs, and
 * its sequence written for it rather than laid over another's.
 *
 *   Holoprojector   the omni-tool  a disc emitter; a flickering blue hologram
 *   Datapad         the wrist unit a battered handheld with an amber readout
 *   Beskar vambrace the omni-tool  a hammered steel gauntlet with a little red display
 *   Comm unit       the omni-tool  a teal and orange wrist slab with a hexagonal emitter
 *   Esper core      the Vambrace   a white ceramic band set with a crystal; frosted glass
 *   Retro terminal  the EVA (GDI)  green phosphor on an old beige monitor, typed out on opening
 *   Cyberdeck       TRON           a neon deck, glitching open
 */

const POWER = 'aria-label="SFH.Power.Toggle" role="button" tabindex="0"';

/* ---------------------------------------------------------------- the art */

/** A palm-sized disc emitter on a low pedestal; the light comes off the disc. */
const HOLO = `
	<defs>
		<linearGradient id="mk-holo-base" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#2c333d"/><stop offset=".4" stop-color="#151a21"/><stop offset="1" stop-color="#07090c"/>
		</linearGradient>
		<radialGradient id="mk-holo-disc" cx=".5" cy=".45" r=".6">
			<stop offset="0" stop-color="#e8f8ff"/><stop offset=".3" stop-color="#6fc8ff"/><stop offset=".75" stop-color="#1d4f7a"/><stop offset="1" stop-color="#0a1a2a"/>
		</radialGradient>
		<filter id="mk-holo-glow" x="-60%" y="-120%" width="220%" height="340%"><feGaussianBlur stdDeviation="9"/></filter>
	</defs>
	<path id="sfh-arm" d="M298 778 Q 302 768 316 768 H 964 Q 978 768 982 778 L 1000 860 H 280 Z"
		fill="url(#mk-holo-base)" stroke="#3e4856" stroke-width="1.5"/>
	<path d="M318 782 H 962" stroke="#6fc8ff" stroke-opacity=".35" stroke-dasharray="2 9"/>
	<path d="M420 770 L 412 860 M860 770 L 868 860" stroke="#05070a" stroke-width="2.5"/>
	<ellipse cx="640" cy="762" rx="104" ry="26" fill="#6fc8ff" fill-opacity=".4" filter="url(#mk-holo-glow)"/>
	<g id="sfh-band" ${POWER}>
		<path d="M556 772 Q 556 750 640 750 Q 724 750 724 772 V 790 Q 724 806 640 806 Q 556 806 556 790 Z" fill="#0e141b" stroke="#5c6a7c" stroke-width="2"/>
		<ellipse cx="640" cy="768" rx="70" ry="15" fill="url(#mk-holo-disc)" stroke="#a6dfff" stroke-width="1.5"/>
		<ellipse cx="640" cy="767" rx="46" ry="9" fill="none" stroke="#e8f8ff" stroke-opacity=".75" stroke-dasharray="7 4"/>
		<ellipse cx="640" cy="766" rx="11" ry="3" fill="#f2fbff"/>
		<path d="M572 788 h18 M690 788 h18" stroke="#6fc8ff" stroke-width="3" stroke-linecap="round"/>
	</g>`;

/** Hammered steel: the plate is lit by its own dents. Rivets, seams, two red lights, and a little display. */
const BESKAR = `
	<defs>
		<linearGradient id="mk-bsk-steel" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#a7b0bb"/><stop offset=".35" stop-color="#66707b"/><stop offset="1" stop-color="#262b31"/>
		</linearGradient>
		<filter id="mk-bsk-hammer" x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency=".085" numOctaves="2" seed="4" result="n"/>
			<feDiffuseLighting in="n" surfaceScale="1.8" diffuseConstant="1.2" lighting-color="#ffffff" result="l"><feDistantLight azimuth="235" elevation="55"/></feDiffuseLighting>
			<feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="m"/>
			<feComposite in="m" in2="SourceAlpha" operator="in"/>
		</filter>
		<filter id="mk-bsk-led" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3.5"/></filter>
	</defs>
	<path id="sfh-arm" d="M298 760 C 470 748 810 748 982 760 L 1002 860 H 278 Z" fill="url(#mk-bsk-steel)" filter="url(#mk-bsk-hammer)"/>
	<path d="M298 760 C 470 748 810 748 982 760 L 1002 860 H 278 Z" fill="none" stroke="#d6dde5" stroke-width="1.5"/>
	<path d="M312 772 C 470 761 810 761 968 772" fill="none" stroke="#e6ebf0" stroke-opacity=".55"/>
	<path d="M430 754 L 420 860 M850 754 L 860 860" stroke="#16191d" stroke-width="2.5"/>
	<path d="M432 754 L 422 860 M852 754 L 862 860" stroke="#c9d1da" stroke-opacity=".35"/>
	<g fill="#d3dae2" stroke="#3a4048" stroke-width=".8">
		<circle cx="322" cy="782" r="3.2"/><circle cx="958" cy="782" r="3.2"/><circle cx="446" cy="772" r="3"/><circle cx="834" cy="772" r="3"/>
		<circle cx="316" cy="840" r="3.2"/><circle cx="964" cy="840" r="3.2"/>
	</g>
	<g>
		<circle cx="486" cy="776" r="7" fill="#ff3b2f" fill-opacity=".7" filter="url(#mk-bsk-led)"/><circle cx="486" cy="776" r="3.6" fill="#ff5a4a" stroke="#4a0c08"/>
		<circle cx="794" cy="776" r="7" fill="#ff3b2f" fill-opacity=".7" filter="url(#mk-bsk-led)"/><circle cx="794" cy="776" r="3.6" fill="#ff5a4a" stroke="#4a0c08"/>
	</g>
	<g id="sfh-band" ${POWER}>
		<rect x="566" y="746" width="148" height="50" rx="5" fill="#2a2f35" stroke="#c9d1da" stroke-width="2"/>
		<rect x="574" y="752" width="132" height="38" rx="2" fill="#140504" stroke="#000"/>
		<path d="M584 762 h44 M584 771 h74 M584 780 h30" stroke="#ff3b2f" stroke-width="2" stroke-linecap="round"/>
		<path d="M680 760 l12 10 -12 10 -12 -10 Z" fill="none" stroke="#ff3b2f" stroke-width="1.6"/>
		<circle cx="680" cy="770" r="2" fill="#ff8a7a"/>
	</g>`;

/** A Pact Worlds wrist slab: slate, teal light strips, orange indicators, and a hexagonal emitter. */
const hex = (r, cx = 640, cy = 770) => Array.from({ length: 6 }, (_, i) => {
	const a = (Math.PI / 3) * i;
	return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
}).join(' ');
const COMM = `
	<defs>
		<linearGradient id="mk-comm-slab" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#2c3f4a"/><stop offset=".4" stop-color="#16232b"/><stop offset="1" stop-color="#080e12"/>
		</linearGradient>
		<radialGradient id="mk-comm-core"><stop offset="0" stop-color="#ffe0b8"/><stop offset=".35" stop-color="#ff8a2a"/><stop offset="1" stop-color="#5a2406"/></radialGradient>
		<filter id="mk-comm-glow" x="-30%" y="-300%" width="160%" height="700%"><feGaussianBlur stdDeviation="2.5"/></filter>
		<filter id="mk-comm-halo" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8"/></filter>
	</defs>
	<path id="sfh-arm" d="M300 768 L 318 754 H 962 L 980 768 L 998 860 H 282 Z" fill="url(#mk-comm-slab)" stroke="#2fd3c6" stroke-opacity=".7" stroke-width="1.5"/>
	<path d="M322 766 H 586 M694 766 H 958" stroke="#2fd3c6" stroke-width="3" filter="url(#mk-comm-glow)"/>
	<path d="M322 766 H 586 M694 766 H 958" stroke="#c9fff9" stroke-width="1"/>
	<path d="M336 778 l 10 -6 h 60 M944 778 l -10 -6 h -60" fill="none" stroke="#2fd3c6" stroke-opacity=".5"/>
	<g fill="#ff8a2a"><rect x="318" y="782" width="14" height="5" rx="1"/><rect x="948" y="782" width="14" height="5" rx="1"/><rect x="338" y="782" width="6" height="5" rx="1" opacity=".5"/><rect x="936" y="782" width="6" height="5" rx="1" opacity=".5"/></g>
	<polygon points="${hex(44)}" fill="#2fd3c6" fill-opacity=".35" filter="url(#mk-comm-halo)"/>
	<g id="sfh-band" ${POWER}>
		<polygon points="${hex(38)}" fill="#0b151a" stroke="#2fd3c6" stroke-width="3"/>
		<polygon points="${hex(27)}" fill="none" stroke="#2fd3c6" stroke-opacity=".5" stroke-dasharray="5 4"/>
		<polygon points="${hex(15)}" fill="url(#mk-comm-core)" stroke="#ffd2a0" stroke-width="1.2"/>
		<circle cx="640" cy="770" r="3.5" fill="#fff4e6"/>
	</g>`;

/** A white ceramic band, a cyan seam of light along it, and a cut crystal set in it. */
const ESPER = `
	<defs>
		<linearGradient id="mk-esp-shell" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#dde7f0"/><stop offset="1" stop-color="#93a4b6"/>
		</linearGradient>
		<linearGradient id="mk-esp-crystal" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#f4feff"/><stop offset=".4" stop-color="#7fe8ff"/><stop offset="1" stop-color="#1689b2"/>
		</linearGradient>
		<filter id="mk-esp-seam" x="-5%" y="-400%" width="110%" height="900%"><feGaussianBlur stdDeviation="2.5"/></filter>
		<filter id="mk-esp-halo" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9"/></filter>
	</defs>
	<path id="sfh-arm" d="M300 760 C 470 748 810 748 980 760 L 1000 860 L 280 860 Z" fill="url(#mk-esp-shell)" stroke="#b9c8d6" stroke-width="1.5"/>
	<path d="M314 778 C 470 767 810 767 966 778" fill="none" stroke="#4fd8ff" stroke-width="3" filter="url(#mk-esp-seam)"/>
	<path d="M314 778 C 470 767 810 767 966 778" fill="none" stroke="#c8f6ff" stroke-width="1"/>
	<path d="M308 800 C 470 789 810 789 972 800" fill="none" stroke="#a9b8c7" stroke-width="1"/>
	<circle class="sfh-gem-glow" cx="640" cy="768" r="32" fill="#7fe8ff" filter="url(#mk-esp-halo)"/>
	<g id="sfh-band" ${POWER}>
		<path d="M596 768 L 612 756 H 668 L 684 768 L 668 780 H 612 Z" fill="#eef4f9" stroke="#a9b8c7" stroke-width="1.5"/>
		<path d="M640 736 L 668 768 L 640 804 L 612 768 Z" fill="url(#mk-esp-crystal)" stroke="#ffffff" stroke-width="1.6"/>
		<path d="M640 736 L 640 804 M612 768 H 668 M626 752 L 654 786 M654 752 L 626 786" stroke="#ffffff" stroke-opacity=".55" stroke-width=".9"/>
		<path d="M640 742 L 652 760 L 640 768 Z" fill="#ffffff" fill-opacity=".55"/>
	</g>`;

/** A deck: a slab with a neon edge, rows of little keys either side, and a glitched logo for the switch. */
const keys = [];
for (const [x0, x1] of [[322, 556], [724, 958]]) {
	for (let r = 0; r < 2; r++) {
		for (let x = x0, i = 0; x + 10 <= x1; x += 14, i++) {
			const lit = (i * 7 + r * 3 + x0) % 11 === 0;
			keys.push(`<rect x="${x}" y="${764 + r * 11}" width="10" height="7" rx="1.5" fill="${lit ? '#19f0ff' : '#24142f'}" fill-opacity="${lit ? 0.85 : 1}" stroke="#ff2bd6" stroke-opacity=".45" stroke-width=".7"/>`);
		}
	}
}
const CYBER = `
	<defs>
		<linearGradient id="mk-cy-body" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#21122d"/><stop offset=".4" stop-color="#110817"/><stop offset="1" stop-color="#050208"/>
		</linearGradient>
		<filter id="mk-cy-neon" x="-5%" y="-400%" width="110%" height="900%"><feGaussianBlur stdDeviation="3"/></filter>
	</defs>
	<path id="sfh-arm" d="M292 768 L 312 754 H 968 L 988 768 L 1004 860 H 276 Z" fill="url(#mk-cy-body)" stroke="#ff2bd6" stroke-width="1.5"/>
	<path d="M312 754 H 968" stroke="#ff2bd6" stroke-width="4" filter="url(#mk-cy-neon)"/>
	<path d="M312 754 H 968" stroke="#ffd6f6" stroke-width="1"/>
	<path d="M300 792 H 540 l 8 6 M980 792 H 740 l -8 6" fill="none" stroke="#19f0ff" stroke-width="1.6"/>
	<path d="M300 792 H 540 M980 792 H 740" stroke="#19f0ff" stroke-width="3" filter="url(#mk-cy-neon)" opacity=".7"/>
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
	</g>`;

/* ---------------------------------------------------------------- the looks */

export const SCIFI = {
	holo: { base: 'omni', label: 'Holoprojector (omni-tool)', art: HOLO },
	datapad: { base: 'wrist', label: 'Datapad (wrist computer)' },
	beskar: { base: 'omni', label: 'Beskar vambrace (omni-tool)', art: BESKAR },
	comm: { base: 'omni', label: 'Comm unit (omni-tool)', art: COMM },
	esper: { base: 'vambrace', label: 'Esper core (Vambrace)', art: ESPER },
	retro: { base: 'gdi', label: 'Retro terminal (EVA)' },
	cyber: { base: 'tron', label: 'Cyberdeck (TRON)', art: CYBER },
};

/** The looks' styles, given the selectors for a look's stage and its interface. */
export function scifiCss(stage, ui) {
	// the omni-tool's sweep of light up the board and the flare at the emitter, in a look's own color
	const sweep = (look, c, light) => `
${stage(look)}.sfh-seq-on .sweep { background: linear-gradient(0deg, rgba(${c}, 0) 0%, rgba(${c}, .35) 55%, rgba(${light}, .9) 78%, rgba(${c}, 0) 100%); }
${stage(look)}:is(.sfh-seq-on, .sfh-seq-off) .flare { background: radial-gradient(ellipse at 50% 60%, rgba(${light}, .95), rgba(${c}, .35) 45%, transparent 72%); }`;
	return `${sweep('holo', '111, 200, 255', '232, 248, 255')}${sweep('beskar', '255, 59, 47', '255, 210, 200')}${sweep('comm', '47, 211, 198', '255, 224, 190')}
/* ---------------- the Holoprojector: a hologram, translucent, flickering, with interference */
${stage('holo')} {
	--scan: rgba(150, 215, 255, .11); --pnl: rgba(30, 90, 150, .2); --pnl2: rgba(111, 200, 255, .06);
	--line: rgba(111, 200, 255, .6); --line2: rgba(111, 200, 255, .2); --text: #bfe6ff; --bright: #eaf8ff; --dim: #6fa9d4;
	--hot: #6fc8ff; --hotbg: rgba(111, 200, 255, .2); --hover: rgba(111, 200, 255, .14); --glow: rgba(111, 200, 255, .75);
	--acc: #a8f0ff; --accbg: rgba(168, 240, 255, .14); --bad: #ff8a7a; --good: #9fffe0;
	--font: Rajdhani, 'Arial Narrow', sans-serif; --display: Orbitron, Rajdhani, sans-serif; --mono: 'Share Tech Mono', monospace;
	--r: 2px; --clip: inset(0); --pshadow: 0 0 18px rgba(111, 200, 255, .22), inset 0 0 22px rgba(111, 200, 255, .1);
}
${stage('holo')} .hexbg { display: none; }
${stage('holo')} :is(.pnl, .big, .proj-t) { text-shadow: 0 0 6px rgba(111, 200, 255, .7); }
${stage('holo')} .pnl { animation: mock-holo-idle 7s infinite; }
${stage('holo')} .pnl::before { content: ''; position: absolute; left: 0; right: 0; top: -24px; height: 22px; z-index: 4; pointer-events: none;
	background: linear-gradient(transparent, rgba(170, 225, 255, .16), transparent); animation: mock-holo-band 5.5s linear infinite; }
${stage('holo')} .navb { background: rgba(10, 30, 50, .5); border-color: var(--line); }
${stage('holo')} .navb.on { background: var(--hotbg); border-color: var(--hot); box-shadow: 0 0 16px var(--glow); }
${stage('holo')}.sfh-seq-on :is(.slot, .navb) { animation: mock-holo-in .95s linear backwards; animation-delay: var(--d, 0ms); }
@keyframes mock-holo-idle { 0%, 46%, 50%, 80%, 84%, 100% { opacity: .95; } 47% { opacity: .62; } 48% { opacity: .9; } 49% { opacity: .7; } 82% { opacity: .85; } }
@keyframes mock-holo-band { from { top: -24px; } to { top: 105%; } }
@keyframes mock-holo-in {
	0% { opacity: 0; transform: scaleY(.02); filter: brightness(3); }
	16% { opacity: .85; transform: scaleY(1) translateX(-7px) skewX(-6deg); }
	22% { opacity: .1; transform: translateX(6px); }
	32% { opacity: .9; transform: translateX(-3px) skewX(3deg); }
	40% { opacity: .25; transform: none; }
	52% { opacity: 1; filter: brightness(1.7); }
	60% { opacity: .55; }
	to { opacity: 1; transform: none; filter: none; }
}
${ui('holo')} {
	--sfh-bg-rgb: 6 16 26; --sfh-hot: #6fc8ff; --sfh-glow: rgb(111 200 255 / 70%); --sfh-bright: #eaf8ff; --sfh-text: #bfe6ff; --sfh-dim: #6fa9d4;
	--sfh-line: rgb(111 200 255 / 55%); --sfh-line-2: rgb(111 200 255 / 18%); --sfh-hover: rgb(111 200 255 / 14%);
	--sfh-panel: rgb(8 22 38 / 82%); --sfh-cell: rgb(6 16 28 / 70%); --sfh-acc: #a8f0ff; --sfh-bad: #ff8a7a;
	--sfh-face: Rajdhani, sans-serif; --sfh-display: Orbitron, Rajdhani, sans-serif; --sfh-mono: 'Share Tech Mono', monospace; --sfh-radius: 2px;
}

/* ---------------- the Datapad: a battered handheld, amber on a dark LCD */
${stage('datapad')} {
	--scan: rgba(0, 0, 0, .22); --pnl: rgba(30, 26, 12, .96); --pnl2: rgba(255, 176, 0, .05);
	--line: rgba(255, 176, 0, .45); --line2: rgba(255, 176, 0, .16); --text: #ffbe3a; --bright: #ffd27a; --dim: #a8781c;
	--hot: #ffb000; --hotbg: rgba(255, 176, 0, .18); --hover: rgba(255, 176, 0, .12); --glow: rgba(255, 176, 0, .55);
	--acc: #ffe08a; --accbg: rgba(255, 224, 138, .12); --bad: #ff6a3a; --good: #d8ff7a;
	--font: VT323, monospace; --display: VT323, monospace; --mono: VT323, monospace; --fs: 18px;
	--r: 3px; --clip: none; --pshadow: inset 0 0 0 1px #000, inset 0 0 26px rgba(0, 0, 0, .7);
}
${stage('datapad')} .pnl::after {
	background:
		repeating-linear-gradient(0deg, rgba(0, 0, 0, .22) 0 1px, transparent 1px 3px),
		repeating-linear-gradient(90deg, rgba(0, 0, 0, .14) 0 1px, transparent 1px 3px);
}
${stage('datapad')} :is(.pnl, .big) { text-shadow: 0 0 4px rgba(255, 176, 0, .55); }
${stage('datapad')} :is(.lbl, .cap, .proj-t) { letter-spacing: .08em; font-size: 1.15em; }
${stage('datapad')} .big { letter-spacing: .06em; }
/* the wrist unit's case and screen, worn to grey plastic around a dark olive glass */
${stage('datapad')} .foldwrap > .ornlayer > svg { filter: grayscale(1) sepia(.25) brightness(2.4) contrast(.85); }
${stage('datapad')} .foldwrap > .ornlayer > div {
	background: radial-gradient(ellipse at 50% 40%, #2a2612, #0e0c05 80%) !important;
	box-shadow: inset 0 0 50px rgba(0, 0, 0, .8), 0 0 0 1px #8a877a !important; border-color: #14130f !important;
}
${stage('datapad')} .ident .nm { color: var(--bright); text-shadow: 0 0 8px var(--glow); }
${stage('datapad')} .navb { border: 1px solid #5a5446; border-radius: 6px; background: linear-gradient(180deg, #4a463c, #23211b); color: var(--dim); box-shadow: inset 0 2px 0 rgba(255, 255, 255, .1), 0 3px 0 #0a0905; }
${stage('datapad')} .navb.on { color: #1a1406; background: linear-gradient(180deg, #ffcc4a, #e09a00); border-color: #ffe0a0; box-shadow: 0 0 12px var(--glow); }
${ui('datapad')} {
	--sfh-bg-rgb: 22 19 9; --sfh-hot: #ffb000; --sfh-glow: rgb(255 176 0 / 55%); --sfh-bright: #ffd27a; --sfh-text: #ffbe3a; --sfh-dim: #a8781c;
	--sfh-line: rgb(255 176 0 / 45%); --sfh-line-2: rgb(255 176 0 / 15%); --sfh-hover: rgb(255 176 0 / 12%);
	--sfh-panel: rgb(30 26 12 / 94%); --sfh-cell: rgb(18 15 7 / 85%); --sfh-acc: #ffe08a; --sfh-bad: #ff6a3a;
	--sfh-face: VT323, monospace; --sfh-display: VT323, monospace; --sfh-mono: VT323, monospace; --sfh-radius: 3px;
}

/* ---------------- the Beskar vambrace: gunmetal, silver edges, a red readout */
${stage('beskar')} {
	--scan: transparent; --pnl: rgba(36, 40, 46, .92); --pnl2: rgba(200, 210, 220, .05);
	--line: rgba(201, 209, 218, .55); --line2: rgba(201, 209, 218, .16); --text: #dfe4ea; --bright: #f6f8fa; --dim: #8c96a2;
	--hot: #ff3b2f; --hotbg: rgba(255, 59, 47, .18); --hover: rgba(255, 59, 47, .1); --glow: rgba(255, 59, 47, .5);
	--acc: #c9d1da; --accbg: rgba(201, 209, 218, .12); --bad: #ffb02e; --good: #9fe0a8;
	--font: Oxanium, sans-serif; --display: Oxanium, sans-serif; --mono: 'Share Tech Mono', monospace;
	--r: 2px; --clip: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
	--pshadow: inset 0 1px 0 rgba(255, 255, 255, .12), inset 0 -12px 24px rgba(0, 0, 0, .35);
}
${stage('beskar')} .hexbg { display: none; }
${stage('beskar')} .pnl {
	background:
		repeating-linear-gradient(100deg, rgba(255, 255, 255, .025) 0 2px, transparent 2px 5px),
		linear-gradient(170deg, rgba(70, 76, 84, .95), var(--pnl) 45%, rgba(22, 25, 29, .95));
}
${stage('beskar')} :is(.proj-t, .cap) { text-transform: uppercase; letter-spacing: .24em; }
${stage('beskar')} .big { color: var(--hot); text-shadow: 0 0 8px var(--glow); }
${stage('beskar')} .navb { background: rgba(30, 34, 40, .9); border-color: var(--line); border-radius: 4px; }
${stage('beskar')} .navb.on { background: var(--hotbg); border-color: var(--hot); box-shadow: 0 0 12px var(--glow); }
${ui('beskar')} {
	--sfh-bg-rgb: 24 27 31; --sfh-hot: #ff3b2f; --sfh-glow: rgb(255 59 47 / 45%); --sfh-bright: #f6f8fa; --sfh-text: #dfe4ea; --sfh-dim: #8c96a2;
	--sfh-line: rgb(201 209 218 / 50%); --sfh-line-2: rgb(201 209 218 / 15%); --sfh-hover: rgb(255 59 47 / 10%);
	--sfh-panel: rgb(30 34 39 / 94%); --sfh-cell: rgb(20 23 27 / 85%); --sfh-acc: #c9d1da; --sfh-bad: #ffb02e;
	--sfh-face: Oxanium, sans-serif; --sfh-display: Oxanium, sans-serif; --sfh-mono: 'Share Tech Mono', monospace; --sfh-radius: 2px;
}

/* ---------------- the Comm unit: teal light and orange signals, cut-cornered panels, a hex grid */
${stage('comm')} {
	--scan: rgba(47, 211, 198, .04); --pnl: rgba(12, 28, 34, .88); --pnl2: rgba(47, 211, 198, .05);
	--line: rgba(47, 211, 198, .6); --line2: rgba(47, 211, 198, .18); --text: #c8f4ef; --bright: #effffd; --dim: #6fb3ac;
	--hot: #ff8a2a; --hotbg: rgba(255, 138, 42, .2); --hover: rgba(47, 211, 198, .14); --glow: rgba(255, 138, 42, .55);
	--acc: #2fd3c6; --accbg: rgba(47, 211, 198, .14); --bad: #ff5a4a; --good: #8dffb0;
	--font: 'Chakra Petch', sans-serif; --display: Michroma, 'Chakra Petch', sans-serif; --mono: 'Share Tech Mono', monospace;
	--r: 0px; --clip: polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px);
	--pshadow: inset 0 0 22px rgba(47, 211, 198, .12);
}
${stage('comm')} .hexbg { filter: hue-rotate(150deg) saturate(1.4); opacity: 1.6; }
${stage('comm')} .cap { background: linear-gradient(90deg, rgba(255, 138, 42, .25), transparent); }
${stage('comm')} .navb { background: rgba(10, 24, 30, .9); border-color: var(--line); border-radius: 0;
	clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%); border: 0; box-shadow: inset 0 0 0 2px rgba(47, 211, 198, .6); }
${stage('comm')} .navb.on { background: var(--hotbg); box-shadow: inset 0 0 0 2px var(--hot); color: #fff; }
${ui('comm')} {
	--sfh-bg-rgb: 9 22 27; --sfh-hot: #ff8a2a; --sfh-glow: rgb(255 138 42 / 50%); --sfh-bright: #effffd; --sfh-text: #c8f4ef; --sfh-dim: #6fb3ac;
	--sfh-line: rgb(47 211 198 / 55%); --sfh-line-2: rgb(47 211 198 / 16%); --sfh-hover: rgb(47 211 198 / 14%);
	--sfh-panel: rgb(10 24 30 / 90%); --sfh-cell: rgb(6 16 20 / 82%); --sfh-acc: #2fd3c6; --sfh-bad: #ff5a4a;
	--sfh-face: 'Chakra Petch', sans-serif; --sfh-display: Michroma, 'Chakra Petch', sans-serif; --sfh-mono: 'Share Tech Mono', monospace; --sfh-radius: 0px;
}

/* ---------------- the Esper core: frosted glass, navy ink, cyan light, a crystal's rings behind */
${stage('esper')} {
	--pnl: rgba(240, 247, 252, .8); --pnl2: rgba(79, 216, 255, .08);
	--line: rgba(22, 150, 196, .55); --line2: rgba(22, 150, 196, .18); --text: #183650; --bright: #0b2238; --dim: #5a7690;
	--hot: #0a9cc8; --hotbg: rgba(10, 156, 200, .14); --hover: rgba(10, 156, 200, .1); --glow: rgba(79, 216, 255, .5);
	--acc: #6a5cff; --accbg: rgba(106, 92, 255, .12); --bad: #d8342a; --good: #138a5a;
	--font: Rajdhani, sans-serif; --display: Rajdhani, sans-serif; --mono: 'Share Tech Mono', monospace; --fs: 15px;
	--pshadow: 0 0 26px rgba(79, 216, 255, .28), 0 12px 28px rgba(0, 20, 40, .35);
}
${stage('esper')} .pnl {
	background: linear-gradient(var(--pnl), var(--pnl)) padding-box,
		linear-gradient(140deg, rgba(255, 255, 255, .95), rgba(79, 216, 255, .7) 40%, rgba(255, 255, 255, .5) 70%, rgba(79, 216, 255, .9)) border-box;
	backdrop-filter: blur(8px) saturate(1.2);
}
${stage('esper')} .pnl::before { content: '◇ ◇'; color: #4fd8ff; text-shadow: 0 0 6px rgba(79, 216, 255, .8); }
${stage('esper')} .pnl::after { background: radial-gradient(1.5px 1.5px at 20% 80%, #4fd8ff, transparent), radial-gradient(1px 1px at 60% 70%, #9a8cff, transparent), radial-gradient(1.5px 1.5px at 85% 90%, #4fd8ff, transparent); background-size: 100% 200px; opacity: .7; }
${stage('esper')} :is(.lbl, .proj-t) { color: var(--hot); text-shadow: none; }
${stage('esper')} .cell .lbl { color: var(--dim); }
${stage('esper')} .big { text-shadow: 0 0 10px rgba(79, 216, 255, .5); }
/* only the name and the main heading in the wide face; the small buttons stay narrow */
${stage('esper')} :is(.proj-t, .ident .nm) { font-family: Michroma, Rajdhani, sans-serif; }
${stage('esper')} :is(.lbl, .cap) { font-weight: 700; }
${stage('esper')} .navb { background: radial-gradient(circle at 40% 35%, #ffffff, #d6e4ef 70%); border-color: rgba(22, 150, 196, .5); color: #3e6886; box-shadow: 0 6px 14px rgba(0, 20, 40, .35); }
${stage('esper')} .navb.on { color: #ffffff; background: radial-gradient(circle at 40% 35%, #8ff0ff, #0a9cc8 75%); border-color: #ffffff; box-shadow: 0 0 18px rgba(79, 216, 255, .7); }
${stage('esper')} .vb-sigil :is(circle, path) { stroke: #bff4ff; }
${stage('esper')} .vb-sigil text { display: none; }
body[data-mock-look="esper"][data-sfh-device="vambrace"] #sfh-deck #action-bar .slot {
	border-color: #9fb4c6; background: radial-gradient(circle at 50% 30%, #ffffff, #dde7ef); box-shadow: inset 0 2px 5px rgb(0 30 60 / 25%);
}
body[data-mock-look="esper"][data-sfh-power="on"][data-sfh-device="vambrace"] #sfh-deck #action-bar .slot { border-color: #4fd8ff; box-shadow: inset 0 2px 5px rgb(0 30 60 / 25%), 0 0 8px rgb(79 216 255 / 45%); }
body[data-mock-look="esper"][data-sfh-device="vambrace"] #sfh-deck #action-bar .slot .key { color: #5a7690; }
${ui('esper')} {
	--sfh-bg-rgb: 232 241 248; --sfh-hot: #0a9cc8; --sfh-glow: rgb(79 216 255 / 45%); --sfh-bright: #0b2238; --sfh-text: #183650; --sfh-dim: #5a7690;
	/* a light look's hover and lit fills have to be light themselves: over the dark canvas a faint tint reads as dark */
	--sfh-line: rgb(22 150 196 / 50%); --sfh-line-2: rgb(22 150 196 / 16%); --sfh-hover: rgb(198 236 250 / 94%);
	--sfh-panel: rgb(236 244 250 / 90%); --sfh-cell: rgb(255 255 255 / 70%); --sfh-acc: #6a5cff; --sfh-bad: #d8342a;
	--sfh-face: Rajdhani, sans-serif; --sfh-display: Michroma, Rajdhani, sans-serif; --sfh-mono: 'Share Tech Mono', monospace; --sfh-radius: 4px;
}

/* ---------------- the Retro terminal: green phosphor in an old beige monitor, typed out on opening */
${stage('retro')} {
	--scan: rgba(0, 0, 0, .35); --pnl: #020a03; --pnl2: rgba(51, 255, 102, .04);
	--line: rgba(51, 255, 102, .4); --line2: rgba(51, 255, 102, .14); --text: #39ff6a; --bright: #b8ffc8; --dim: #1fa844;
	--hot: #39ff6a; --hotbg: rgba(51, 255, 102, .16); --hover: rgba(51, 255, 102, .1); --glow: rgba(51, 255, 102, .6);
	--acc: #9dffb4; --accbg: rgba(157, 255, 180, .12); --bad: #b8ffc8; --good: #39ff6a;
	--font: VT323, monospace; --display: VT323, monospace; --mono: VT323, monospace; --fs: 18px;
	--pshadow: none;
}
${stage('retro')} * { text-shadow: 0 0 5px rgba(51, 255, 102, .7); }
${stage('retro')} .pnl { border-style: dashed; }
${stage('retro')} :is(.lbl, .cap, .proj-t) { letter-spacing: .1em; font-size: 1.15em; }
${stage('retro')} .cap { background: none; border-bottom-style: dashed; }
${stage('retro')} :is(.cap, .proj-t)::after { content: '▌'; margin-left: .3em; animation: mock-blink 1.06s steps(1) infinite; }
${stage('retro')} .ornlayer > div[style*="border:14px"] { border-color: #cfc4a2 !important; box-shadow: inset 0 0 0 2px #8a8068, inset 0 0 0 4px #000, inset 0 0 40px rgba(0, 0, 0, .5) !important; border-radius: 22px; }
${stage('retro')} .ornlayer > span { background: radial-gradient(circle at 35% 35%, #efe8d2, #9a9076) !important; }
${stage('retro')}::after { content: ''; position: absolute; inset: 14px; border-radius: 18px; pointer-events: none; z-index: 50;
	background: radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(0, 0, 0, .6) 100%); }
${stage('retro')}.sfh-seq-on :is(.slot, .navb) { animation: mock-type .8s steps(16) backwards; animation-delay: calc(320ms + var(--d, 0ms) * 2.5); }
@keyframes mock-type { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes mock-blink { 50% { opacity: 0; } }
${ui('retro')} {
	--sfh-bg-rgb: 2 10 3; --sfh-hot: #39ff6a; --sfh-glow: rgb(51 255 102 / 55%); --sfh-bright: #b8ffc8; --sfh-text: #39ff6a; --sfh-dim: #1fa844;
	--sfh-line: rgb(51 255 102 / 40%); --sfh-line-2: rgb(51 255 102 / 14%); --sfh-hover: rgb(51 255 102 / 10%);
	--sfh-panel: rgb(2 10 3 / 96%); --sfh-cell: rgb(0 0 0 / 80%); --sfh-acc: #9dffb4; --sfh-bad: #b8ffc8;
	--sfh-face: VT323, monospace; --sfh-display: VT323, monospace; --sfh-mono: VT323, monospace; --sfh-radius: 0px;
}

/* ---------------- the Cyberdeck: neon magenta and cyan, glitching open */
${stage('cyber')} {
	--scan: rgba(255, 43, 214, .05); --pnl: rgba(16, 6, 24, .9); --pnl2: rgba(25, 240, 255, .05);
	--line: rgba(255, 43, 214, .65); --line2: rgba(255, 43, 214, .2); --text: #f6d8ff; --bright: #ffffff; --dim: #b07ac8;
	--hot: #19f0ff; --hotbg: rgba(25, 240, 255, .16); --hover: rgba(255, 43, 214, .14); --glow: rgba(25, 240, 255, .6);
	--acc: #ff2bd6; --accbg: rgba(255, 43, 214, .16); --bad: #ffe04a; --good: #7dffb8;
	--font: 'Chakra Petch', sans-serif; --display: Audiowide, 'Chakra Petch', sans-serif; --mono: 'Share Tech Mono', monospace;
	--r: 0px; --clip: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px));
	--pshadow: 0 0 16px rgba(255, 43, 214, .28), inset 0 0 18px rgba(25, 240, 255, .07);
}
${stage('cyber')} .hexbg { filter: hue-rotate(120deg) saturate(1.5); }
${stage('cyber')} :is(.proj-t, .big) { text-shadow: 2px 0 rgba(255, 43, 214, .75), -2px 0 rgba(25, 240, 255, .75); }
${stage('cyber')} .cap { background: linear-gradient(90deg, rgba(255, 43, 214, .3), rgba(25, 240, 255, .1)); }
${stage('cyber')}.sfh-seq-on :is(.slot, .navb) { animation: mock-glitch .7s backwards; animation-delay: var(--d, 0ms); }
@keyframes mock-glitch {
	0% { opacity: 0; clip-path: inset(0 0 100% 0); animation-timing-function: steps(1); }
	10% { opacity: 1; clip-path: inset(12% 0 60% 0); transform: translateX(-16px); filter: drop-shadow(4px 0 #ff2bd6) drop-shadow(-4px 0 #19f0ff); animation-timing-function: steps(1); }
	20% { clip-path: inset(52% 0 18% 0); transform: translateX(12px); animation-timing-function: steps(1); }
	30% { clip-path: inset(0 0 72% 0); transform: translateX(-7px); animation-timing-function: steps(1); }
	40% { clip-path: inset(28% 0 34% 0); transform: translateX(9px); animation-timing-function: steps(1); }
	52% { clip-path: inset(0); transform: translateX(-4px); filter: drop-shadow(2px 0 #ff2bd6) drop-shadow(-2px 0 #19f0ff); animation-timing-function: steps(1); }
	66% { transform: translateX(3px); animation-timing-function: steps(1); }
	80% { transform: none; filter: drop-shadow(1px 0 #ff2bd6); animation-timing-function: steps(1); }
	to { opacity: 1; clip-path: var(--clip); transform: none; filter: none; }
}
${ui('cyber')} {
	--sfh-bg-rgb: 14 5 20; --sfh-hot: #19f0ff; --sfh-glow: rgb(25 240 255 / 55%); --sfh-bright: #ffffff; --sfh-text: #f6d8ff; --sfh-dim: #b07ac8;
	--sfh-line: rgb(255 43 214 / 60%); --sfh-line-2: rgb(255 43 214 / 18%); --sfh-hover: rgb(255 43 214 / 14%);
	--sfh-panel: rgb(16 6 24 / 92%); --sfh-cell: rgb(10 4 16 / 85%); --sfh-acc: #ff2bd6; --sfh-bad: #ffe04a;
	--sfh-face: 'Chakra Petch', sans-serif; --sfh-display: Audiowide, 'Chakra Petch', sans-serif; --sfh-mono: 'Share Tech Mono', monospace; --sfh-radius: 0px;
}
`;
}
