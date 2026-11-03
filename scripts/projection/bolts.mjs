/**
 * The Runic Vambrace's opening. Once the sigil has turned open and the main body is drawn, the
 * sigil's inner ring flares and an arcane bolt leaps from it to the middle of every other panel,
 * which is drawn out of the light from where it strikes. Until its bolt lands a panel waits,
 * hidden (projection.css: .vb-struck). Played from Projection.playSequence.
 */
const NS = 'http://www.w3.org/2000/svg';
const SIGIL = { x: 640, y: 380, r: 200 };   // the sigil's middle and inner ring, on the board (ornaments.mjs)
const FIRE = 680;     // ms into the sequence: the sigil is open and the main body half drawn
const REACH = 0.06;   // s for a bolt to reach its panel
const LIFE = 0.5;     // s a bolt lasts, flickering, before it is gone

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (t) => Math.max(0, Math.min(1, t));

function make(tag, attrs, parent) {
	const el = document.createElementNS(NS, tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	parent.append(el);
	return el;
}

/** A panel's box on the board, from its styles: the board may not be laid out yet. */
function box(el) {
	const s = getComputedStyle(el);
	return { x: parseFloat(s.left) || 0, y: parseFloat(s.top) || 0, w: parseFloat(s.width) || 0, h: parseFloat(s.height) || 0 };
}

/** A jagged line from a to b, by midpoint displacement. */
function jag(a, b, rough = 0.42, depth = 5) {
	let pts = [a, b];
	for (let d = 0; d < depth; d++) {
		const next = [pts[0]];
		for (let i = 0; i < pts.length - 1; i++) {
			const p = pts[i], q = pts[i + 1];
			const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
			const off = (Math.random() - 0.5) * len * rough;
			next.push({ x: (p.x + q.x) / 2 - ((q.y - p.y) / len) * off, y: (p.y + q.y) / 2 + ((q.x - p.x) / len) * off }, q);
		}
		pts = next;
	}
	return pts;
}
const points = (pts) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

/** The ring flaring, and the flash where a bolt lands: both fade by themselves. */
function flare(svg) {
	for (const [width, filter] of [[3, 'url(#sfh-bolt-glow)'], [1.2, 'none']]) {
		const ring = make('circle', { cx: SIGIL.x, cy: SIGIL.y, r: SIGIL.r, fill: 'none', stroke: '#9fd0ff', 'stroke-width': width, filter, opacity: 0 }, svg);
		ring.animate([{ opacity: 0, r: SIGIL.r - 14 }, { opacity: 0.95, r: SIGIL.r, offset: 0.3 }, { opacity: 0, r: SIGIL.r + 14 }], { duration: 700, fill: 'forwards' });
	}
}
function burst(svg, p) {
	const flash = make('circle', { cx: p.x, cy: p.y, r: 3, fill: '#eaf4ff', filter: 'url(#sfh-bolt-glow)' }, svg);
	flash.animate([{ r: 3, opacity: 1 }, { r: 28, opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' });
	const ring = make('circle', { cx: p.x, cy: p.y, r: 4, fill: 'none', stroke: '#9fd0ff', 'stroke-width': 3 }, svg);
	ring.animate([{ r: 4, opacity: 1, strokeWidth: 3 }, { r: 38, opacity: 0, strokeWidth: 0.5 }], { duration: 480, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
}

function fire(svg, panels) {
	if (!svg.isConnected) return;
	svg.classList.add('on');
	flare(svg);
	const bolts = panels.map((el) => {
		const b = box(el);
		const p = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
		const dx = p.x - SIGIL.x, dy = p.y - SIGIL.y, d = Math.hypot(dx, dy) || 1;
		const r = Math.max(0, Math.min(SIGIL.r, d - 60));
		const g = make('g', { fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
		return {
			el, p, o: { x: SIGIL.x + (dx / d) * r, y: SIGIL.y + (dy / d) * r }, g,
			glow: make('polyline', { stroke: '#7ab8ff', 'stroke-width': 7, opacity: 0.55, filter: 'url(#sfh-bolt-glow)' }, g),
			core: make('polyline', { stroke: '#eef6ff', 'stroke-width': 1.8 }, g),
			fork: make('polyline', { stroke: '#cfe6ff', 'stroke-width': 1.1, opacity: 0.8 }, g),
			at: rand(0, 0.12), next: 0, struck: false,
		};
	});
	const t0 = performance.now();
	const tick = (now) => {
		if (!svg.isConnected) return;
		const t = (now - t0) / 1000;
		for (const b of bolts) {
			const life = t - b.at;
			if (life < 0) continue;
			const reach = clamp(life / REACH);
			// a new shape every few frames, so it flickers
			if (life >= b.next) {
				b.next = life + 0.045;
				const full = jag(b.o, b.p);
				const shown = points(full.slice(0, Math.max(2, Math.ceil(full.length * reach))));
				b.core.setAttribute('points', shown);
				b.glow.setAttribute('points', shown);
				const from = full[Math.floor(full.length * rand(0.3, 0.6))];
				const away = { x: from.x + (b.p.x - b.o.x) * 0.3 + rand(-40, 40), y: from.y + (b.p.y - b.o.y) * 0.3 + rand(-40, 40) };
				b.fork.setAttribute('points', reach < 1 ? '' : points(jag(from, away, 0.5, 3)));
			}
			if (reach >= 1 && !b.struck) {
				b.struck = true;
				burst(svg, b.p);
				b.el.classList.add('vb-struck');
			}
			b.g.setAttribute('opacity', String(clamp(1 - (life - (LIFE - 0.2)) / 0.2)));
		}
		if (t < 0.12 + LIFE + 0.45) requestAnimationFrame(tick);
		else svg.remove();
	};
	requestAnimationFrame(tick);
}

/** Send the bolts out across the board on the stage, once the sigil is open. */
export function arcaneBolts(stage) {
	stage.querySelector('.vb-bolts')?.remove();
	stage.querySelectorAll('.vb-struck').forEach((el) => el.classList.remove('vb-struck'));
	const panels = [...stage.querySelectorAll('.slot:not([data-slot="projection"])')];
	if (!panels.length) return;
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
		panels.forEach((el) => el.classList.add('vb-struck'));
		return;
	}
	const svg = make('svg', { class: 'vb-bolts', width: stage.offsetWidth || 1280, height: stage.offsetHeight || 728, 'aria-hidden': 'true' }, stage);
	const glow = make('filter', { id: 'sfh-bolt-glow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, make('defs', {}, svg));
	make('feGaussianBlur', { stdDeviation: 4 }, glow);
	setTimeout(() => fire(svg, panels), FIRE);
}

/** Put them away: a sequence that stops early leaves no bolts behind. */
export function stopBolts(stage) {
	stage?.querySelector('.vb-bolts')?.remove();
}
