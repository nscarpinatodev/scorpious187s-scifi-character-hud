import { esc, lbl, pct } from './helpers.mjs';

/**
 * The housing each device draws around its own screen, ported from the mock-up
 * (design/6-app.js, `ornBack`). Everything is in board coordinates, so it scales with the
 * rest of the projection.
 *
 * The omni-tool has none: its arm is part of the interface now, and its panels are light
 * in the air. The wrist unit has a case; the EVA has a bezel and its own readout bays.
 */

/** Behind the panels. */
export function ornBack(device) {
	if (device === 'omni') {
		return `<svg width="1280" height="740" viewBox="0 0 1280 740" style="position:absolute;inset:0" aria-hidden="true">
			<defs><pattern id="sfh-hx" width="28" height="48.5" patternUnits="userSpaceOnUse">
				<path d="M14 0l14 8v16l-14 8L0 24V8zM14 32v16.5" fill="none" stroke="#ff8c2a" stroke-opacity=".07"/>
			</pattern></defs>
			<rect class="hexbg" width="1280" height="740" fill="url(#sfh-hx)"/></svg>`;
	}
	if (device === 'wrist') {
		return `<svg width="1280" height="860" viewBox="0 0 1280 860" style="position:absolute;inset:0" aria-hidden="true">
			<defs><linearGradient id="sfh-case" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#2d1a52"/><stop offset=".5" stop-color="#1a0e33"/><stop offset="1" stop-color="#0f0820"/>
			</linearGradient></defs>
			<rect x="136" y="206" width="1008" height="640" rx="54" fill="url(#sfh-case)" stroke="#8a55d6" stroke-width="2"/>
			<rect x="142" y="212" width="996" height="628" rx="50" fill="none" stroke="#35ecf2" stroke-opacity=".5"/>
			<rect x="580" y="218" width="120" height="6" rx="3" fill="#ff3ea5" fill-opacity=".85"/>
			<circle cx="1100" cy="236" r="6" fill="#35ecf2"/>
			<path d="M300 846 v14 M980 846 v14" stroke="#8a55d6" stroke-width="10"/></svg>
			<div style="position:absolute;left:212px;top:250px;width:856px;height:560px;box-sizing:border-box;border-radius:22px;
				border:3px solid #05020c;box-shadow:inset 0 0 40px rgba(255,62,165,.18),0 0 0 1px #8a55d6;
				background:radial-gradient(ellipse at 50% 40%,#1d0f3a 0%,#0d0620 75%)"></div>`;
	}
	// EVA: the bezel of the console, and its corner screws
	const bezel = device === 'gdi' ? '#3a3d2c' : '#3a2020';
	const screws = ['left:2px;top:2px', 'right:2px;top:2px', 'left:2px;bottom:2px', 'right:2px;bottom:2px']
		.map((p) => `<span style="position:absolute;${p};width:10px;height:10px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#9a9a8a,#2a2a24);z-index:6"></span>`)
		.join('');
	return `<div style="position:absolute;inset:0;border:14px solid ${bezel};box-shadow:inset 0 0 0 2px #000,inset 0 0 0 4px var(--line);pointer-events:none;z-index:5"></div>${screws}`;
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
