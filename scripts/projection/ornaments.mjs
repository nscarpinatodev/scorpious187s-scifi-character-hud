import { esc, lbl, pct } from './helpers.mjs';

/**
 * The housing each device draws around its own screen, ported from the mock-up
 * (design/6-app.js, `ornBack`). Everything is in board coordinates, so it scales with the
 * rest of the projection.
 *
 * The omni-tool has none: its arm is part of the interface now, and its panels are light
 * in the air. TRON's are the same, on a square grid. The wrist unit has a case; the EVA has
 * a bezel and its own readout bays.
 */

/**
 * The Adventurer's Journal: the book the sheet is written in. The boards and pages stand
 * behind the writing; the cover is a leaf hinged on the spine, which the power sequence
 * swings open (design/1-head.html). At rest the book lies open and the leaf is put away.
 */
function journalBook(c) {
	const rose = `<svg viewBox="-60 -60 120 120" aria-hidden="true"><g fill="none" stroke="#c9a227" stroke-width="1.5"><circle r="54"/><circle r="46" stroke-dasharray="2 4"/><circle r="12"/></g>
		<g fill="#c9a227"><path d="M0 -52 L7 -7 L0 0 L-7 -7 Z"/><path d="M0 52 L7 7 L0 0 L-7 7 Z" opacity=".7"/><path d="M52 0 L7 7 L0 0 L7 -7 Z" opacity=".7"/><path d="M-52 0 L-7 7 L0 0 L-7 -7 Z" opacity=".7"/></g></svg>`;
	return `<div class="jb">
		<div class="jb-board l"></div><div class="jb-board r"></div>
		<div class="jb-page l"></div><div class="jb-page r"></div>
		<div class="jb-gutter"></div>
		<div class="jb-leaf">
			<div class="jb-front"><div class="jb-title">${rose}${esc(c?.name ?? '')}<small>${esc(game.i18n.localize('SFH.Projection.Journal.Cover'))}</small></div></div>
			<div class="jb-back"></div>
		</div>
	</div>`;
}

/**
 * The Vambrace's sigil: rings, two crossed triangles and the elder futhark around them. It turns
 * open behind the board when the bracer wakes, then rests there faintly.
 */
function vambraceSigil() {
	const futhark = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'.split('');
	const letters = futhark.map((g, i) => {
		const a = (i / futhark.length) * Math.PI * 2;
		return `<text x="${(Math.cos(a) * 316).toFixed(1)}" y="${(Math.sin(a) * 316 + 8).toFixed(1)}" text-anchor="middle">${g}</text>`;
	}).join('');
	return `<svg class="vb-sigil" width="1280" height="740" viewBox="0 0 1280 740" style="position:absolute;inset:0" aria-hidden="true">
		<g transform="translate(640 380)"><g class="vb-turn">
			<circle r="350" stroke-width="2"/><circle r="292" stroke-width="1" stroke-dasharray="4 10"/><circle r="200" stroke-width="2"/>
			<path d="M0 -350 L303 175 L-303 175 Z" stroke-width="1.5"/><path d="M0 350 L303 -175 L-303 -175 Z" stroke-width="1.5"/>
			${letters}</g></g></svg>`;
}

/**
 * The Retro terminal's housing, in place of the EVA's bezel: a chunky monitor case in painted
 * olive steel, worn at the edges, screwed together at the corners and with a blank maker's plate
 * under the screen; a deep recess; and in it a rounded screen of dark green glass, brightest in
 * the middle where the phosphor glows. The panels sit inside the screen (the stage's .sfh-inset),
 * and the glass, its scanlines and its glare are laid over them there (styles/looks.css), so none
 * of that crosses the case.
 */
const RETRO_SCREEN = { x: 46, y: 34, w: 1188, h: 792, r: 44 };
function retroTerminal() {
	const s = RETRO_SCREEN;
	const screw = (x, y) => `<g transform="translate(${x} ${y})"><circle r="6.5" fill="url(#sfh-rt-screw)" stroke="#1d1c15" stroke-width="1"/><path d="M-4 -1.2 L 4 1.2" stroke="#2a2920" stroke-width="1.6"/></g>`;
	return `<svg width="1280" height="860" viewBox="0 0 1280 860" style="position:absolute;inset:0" aria-hidden="true">
		<defs>
			<linearGradient id="sfh-rt-case" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#7d7a5e"/><stop offset=".08" stop-color="#6a6750"/><stop offset=".55" stop-color="#55533f"/><stop offset="1" stop-color="#3a3929"/>
			</linearGradient>
			<filter id="sfh-rt-paint" x="0" y="0" width="100%" height="100%">
				<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/>
				<feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0" result="grain"/>
				<feComposite in="grain" in2="SourceGraphic" operator="in" result="g"/>
				<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="g"/></feMerge>
			</filter>
			<radialGradient id="sfh-rt-glass" cx=".5" cy=".46" r=".7">
				<stop offset="0" stop-color="#0d2b16"/><stop offset=".55" stop-color="#071a0d"/><stop offset="1" stop-color="#020703"/>
			</radialGradient>
			<radialGradient id="sfh-rt-screw" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#b8b39a"/><stop offset="1" stop-color="#55523f"/></radialGradient>
			<linearGradient id="sfh-rt-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9b496"/><stop offset="1" stop-color="#7d785e"/></linearGradient>
		</defs>
		<rect width="1280" height="860" rx="34" fill="url(#sfh-rt-case)" filter="url(#sfh-rt-paint)"/>
		<rect x="4" y="4" width="1272" height="852" rx="31" fill="none" stroke="#a9a487" stroke-opacity=".45" stroke-width="2"/>
		<rect x="1.5" y="1.5" width="1277" height="857" rx="33" fill="none" stroke="#14130d" stroke-width="3"/>
		<rect x="${s.x - 16}" y="${s.y - 14}" width="${s.w + 32}" height="${s.h + 28}" rx="${s.r + 12}" fill="#1b1a13" stroke="#0c0b07" stroke-width="2"/>
		<rect x="${s.x - 16}" y="${s.y - 14}" width="${s.w + 32}" height="${s.h + 28}" rx="${s.r + 12}" fill="none" stroke="#8d8869" stroke-opacity=".35" stroke-width="1.5" transform="translate(0 2)"/>
		<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.r}" fill="url(#sfh-rt-glass)"/>
		<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.r}" fill="none" stroke="#000" stroke-width="6" stroke-opacity=".7"/>
		${screw(16, 16)}${screw(1264, 16)}${screw(16, 844)}${screw(1264, 844)}
		<g transform="translate(640 843)">
			<rect x="-74" y="-6.5" width="148" height="13" rx="2" fill="url(#sfh-rt-plate)" stroke="#3a3828" stroke-width="1"/>
			<path d="M-62 -1.5 H 22 M-62 2.5 H -8 M34 -2 h 26 v4 h -26 z" stroke="#4a4734" stroke-width="1.1" fill="none"/>
		</g>
	</svg>`;
}

/** Behind the panels, and outside the fold: housing that stays put. A look may bring its own. */
export function ornBack(device, c, look = null) {
	if (look === 'retro') return retroTerminal();
	if (device === 'journal') return journalBook(c);
	if (device === 'vambrace') return vambraceSigil();
	if (device === 'omni') {
		return `<svg width="1280" height="740" viewBox="0 0 1280 740" style="position:absolute;inset:0" aria-hidden="true">
			<defs><pattern id="sfh-hx" width="28" height="48.5" patternUnits="userSpaceOnUse">
				<path d="M14 0l14 8v16l-14 8L0 24V8zM14 32v16.5" fill="none" stroke="#ff8c2a" stroke-opacity=".07"/>
			</pattern></defs>
			<rect class="hexbg" width="1280" height="740" fill="url(#sfh-hx)"/></svg>`;
	}
	if (device === 'tron') {
		return `<svg width="1280" height="740" viewBox="0 0 1280 740" style="position:absolute;inset:0" aria-hidden="true">
			<defs><pattern id="sfh-gridlines" width="40" height="40" patternUnits="userSpaceOnUse">
				<path d="M40 0H0V40" fill="none" stroke="#6fe9ff" stroke-opacity=".1"/>
			</pattern></defs>
			<rect class="hexbg" width="1280" height="740" fill="url(#sfh-gridlines)"/></svg>`;
	}
	// The wrist unit's housing folds with the screen, so it is drawn in ornDev, not here.
	if (device === 'wrist') return '';

	// EVA: a console has a back panel, so the space between its bays is not thin air
	const bezel = device === 'gdi' ? '#3a3d2c' : '#3a2020';
	const back = device === 'gdi'
		? 'radial-gradient(ellipse at 50% 38%, #0d1509 0%, #050803 78%)'
		: 'radial-gradient(ellipse at 50% 38%, #170808 0%, #080303 78%)';
	const backing = `<div style="position:absolute;inset:14px;background:${back};box-shadow:inset 0 0 60px rgb(0 0 0 / 70%);pointer-events:none"></div>`;
	const screws = ['left:2px;top:2px', 'right:2px;top:2px', 'left:2px;bottom:2px', 'right:2px;bottom:2px']
		.map((p) => `<span style="position:absolute;${p};width:10px;height:10px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#9a9a8a,#2a2a24);z-index:6"></span>`)
		.join('');
	return `${backing}<div style="position:absolute;inset:0;border:14px solid ${bezel};box-shadow:inset 0 0 0 2px #000,inset 0 0 0 4px var(--line);pointer-events:none;z-index:5"></div>${screws}`;
}

/**
 * The EVA console's own readouts: the link dish, the credit strip, the unit card and the
 * hit-point ladder. They are part of the picture, so they live inside the fold and open
 * with everything else.
 */
export function evaReadouts(c) {
	const hp = pct(c.hp.value, c.hp.max);
	const segments = 24;
	const lit = Math.round((segments * hp) / 100);
	const bars = [16, 32, 48, 24, 60, 36, 52, 20, 40, 12]
		.map((h, i) => `<rect x="${92 + i * 8}" y="${66 - h / 2}" width="5" height="${h}" fill="var(--hot)">
			<animate attributeName="height" values="${h};${h / 3};${h}" dur="${0.6 + i * 0.07}s" repeatCount="indefinite"/>
			<animate attributeName="y" values="${66 - h / 2};${66 - h / 6};${66 - h / 2}" dur="${0.6 + i * 0.07}s" repeatCount="indefinite"/></rect>`)
		.join('');
	const ladder = Array.from({ length: segments }, (_, i) =>
		`<div style="flex:1;background:${i < lit ? (i < 5 ? 'var(--bad)' : i < 10 ? 'var(--acc)' : 'var(--hot)') : 'rgba(255,255,255,.05)'}"></div>`).join('');
	const status = hp < 35 ? 'CRITICAL' : hp < 70 ? 'DAMAGED' : 'OPERATIONAL';

	return `<div class="slot pnl" style="left:26px;top:86px;width:262px;height:160px">
			<div class="cap">EVA Link</div>
			<svg viewBox="0 0 260 134" width="260" height="134" aria-hidden="true">
				<circle cx="130" cy="66" r="56" fill="none" stroke="var(--hot)" stroke-opacity=".3"/>
				<circle cx="130" cy="66" r="44" fill="none" stroke="var(--hot)" stroke-opacity=".5" stroke-dasharray="3 5"/>
				<circle cx="130" cy="66" r="30" fill="var(--hot)" fill-opacity=".08" stroke="var(--hot)"/>${bars}</svg></div>
		<div class="slot pnl" style="left:976px;top:86px;width:278px;height:52px;flex-direction:row;align-items:center;justify-content:space-between;padding:0 14px;background:#000">
			${lbl('Level')}<span class="big hot" style="font-size:28px">${c.level}</span></div>
		<div class="slot pnl" style="left:976px;top:150px;width:278px;height:160px;background:#000;overflow:hidden">
			<svg width="276" height="158" style="position:absolute;inset:0" aria-hidden="true">
				<g stroke="var(--hot)" stroke-opacity=".18"><path d="M0 31H276M0 62H276M0 94H276M0 125H276M46 0V158M92 0V158M138 0V158M184 0V158M230 0V158"/></g>
				<circle cx="138" cy="79" r="70" fill="none" stroke="var(--hot)" stroke-opacity=".35"/>
				<path d="M138 79 L 204 50 A 70 70 0 0 0 184 26 Z" fill="var(--hot)" fill-opacity=".2">
					<animateTransform attributeName="transform" type="rotate" from="0 138 79" to="360 138 79" dur="6s" repeatCount="indefinite"/></path></svg>
			<div style="position:absolute;left:120px;top:14px;right:10px;display:flex;flex-direction:column;gap:3px">
				${lbl('Unit')}<b class="acc" style="font-size:15px">${esc(c.name)}</b>
				${lbl('Status')}<b style="font-size:13px;color:${hp < 35 ? 'var(--bad)' : 'var(--hot)'}">${status}</b></div></div>
		<div class="slot" style="left:976px;top:534px;width:24px;height:302px;box-sizing:border-box;border:1px solid var(--line);background:#000;display:flex;flex-direction:column-reverse;padding:3px;gap:2px"
			role="img" aria-label="Hit points ${c.hp.value} of ${c.hp.max}">${ladder}</div>`;
}


/**
 * Housing that belongs to the screen rather than behind it.
 *
 * The wrist unit's case hinges at its base and takes the whole display with it, so it is
 * drawn inside the fold — with every panel inside the case, not floating over it.
 */
export function ornDev(device, look = null) {
	// the Retro terminal keeps the wrist unit's layout but stands in its own monitor case (retroTerminal)
	if (device !== 'wrist' || look === 'retro') return '';
	/*
	 * The mock-up's case, expanded rather than redrawn: the same double edge, the same pink
	 * indicator on the top rail, the same cyan lamp and the same two feet — only the shell is
	 * large enough now to hold every panel instead of three of them floating above it.
	 *
	 * Mock-up:  case 136,206 1008x640  ·  here: 14,4 1252x842
	 */
	return `<svg width="1280" height="860" viewBox="0 0 1280 860" style="position:absolute;inset:0" aria-hidden="true">
			<defs><linearGradient id="sfh-case" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#2d1a52"/><stop offset=".5" stop-color="#1a0e33"/><stop offset="1" stop-color="#0f0820"/>
			</linearGradient></defs>
			<rect x="14" y="4" width="1252" height="842" rx="54" fill="url(#sfh-case)" stroke="#8a55d6" stroke-width="2"/>
			<rect x="20" y="10" width="1240" height="830" rx="50" fill="none" stroke="#35ecf2" stroke-opacity=".5"/>
			<rect x="580" y="16" width="120" height="6" rx="3" fill="#ff3ea5" fill-opacity=".85"/>
			<circle cx="1222" cy="34" r="6" fill="#35ecf2"/>
			<path d="M300 846 v14 M980 846 v14" stroke="#8a55d6" stroke-width="10"/></svg>
		<div style="position:absolute;left:44px;top:40px;width:1192px;height:772px;box-sizing:border-box;border-radius:34px;
			border:3px solid #05020c;box-shadow:inset 0 0 60px rgba(255,62,165,.18),0 0 0 1px #8a55d6;
			background:radial-gradient(ellipse at 50% 40%,#1d0f3a 0%,#0d0620 75%)"></div>`;
}
