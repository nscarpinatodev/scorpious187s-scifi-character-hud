import { esc, sgn, lbl, bar, actBtn, rollBtn, nameBtn, ro } from './helpers.mjs';

/**
 * The panels around the projection, built exactly as the mock-up builds them
 * (design/4-slots.js), with real numbers from the adapters instead of sample data.
 */

/* -------------------------------------------- */
/*  Identity                                     */
/* -------------------------------------------- */

export function renderIdentity(c, device) {
	const xp = `<div style="display:flex;flex-direction:column;gap:4px;width:170px;flex:none">${lbl('Experience')}
		<span class="mono" style="font-size:13px">${c.xp.value.toLocaleString()} / ${c.xp.max.toLocaleString()}</span>
		${bar(c.xp.value, c.xp.max)}</div>`;
	const rest = c.system === 'dnd5e'
		? `${actBtn('Short rest', 'rest', 'short', { cls: 'sm ghost' })}${actBtn('Long rest', 'rest', 'long', { cls: 'sm ghost' })}`
		: actBtn('Rest', 'rest', 'night', { cls: 'sm ghost' });
	const gear = `<button type="button" class="b ic" data-act="settings" data-k="" data-tooltip="Device settings" aria-label="Device settings">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg></button>`;
	const sheet = `<button type="button" class="b ic" data-act="sheet" data-k="" data-tooltip="Open the system sheet" aria-label="Open the system sheet">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11"/></svg></button>`;
	const level = `<div class="lvl">${lbl('Level')}<span class="big" style="font-size:21px">${c.level}</span></div>`;

	if (device === 'wrist') {
		return `<div class="lbl">Operator</div><div class="nm">${esc(c.name)}</div><div class="st">${esc(c.sub)}</div>
			<div class="row" style="margin-top:auto"><div class="grow">${bar(c.xp.value, c.xp.max)}</div>
			<span class="mono" style="font-size:17px">LV ${c.level}</span></div>
			<div class="row">${rest}<span class="grow"></span>${sheet}${gear}</div>`;
	}
	if (device === 'gdi' || device === 'nod') {
		return `<span class="big hot" style="font-family:var(--display);font-size:24px;font-weight:800;letter-spacing:.3em">EVA</span>
			<div class="ticker" id="sfh-ticker">&gt; ${esc(c.name)} · unit ready<i>▌</i></div>
			<span style="font-weight:700;letter-spacing:.08em;color:var(--acc);font-size:17px;text-transform:uppercase">${esc(c.name)}</span>
			<span class="mono hot" style="padding:3px 9px;border:1px solid var(--line)">LV ${c.level}</span>${rest}${sheet}${gear}`;
	}
	return `<div style="display:flex;flex-direction:column;flex:1 1 auto;min-width:0">
		<div class="nm">${esc(c.name)}</div><div class="st">${esc(c.sub)}</div></div>${xp}${level}${rest}${sheet}${gear}`;
}

/* -------------------------------------------- */
/*  Vitals                                       */
/* -------------------------------------------- */

export function renderVitals(c) {
	const hp = `<div class="cell wide" style="align-items:stretch;gap:5px;padding:8px 10px">
		<div class="row sp">${lbl('Hit Points')}${actBtn(`TEMP ${c.hp.temp}`, 'temp', '5', { cls: 'sm', title: 'Add 5 temporary hit points' })}</div>
		<div class="row sp" style="gap:3px">
			${actBtn('−5', 'hp', '-5', { cls: 'sm' })}${actBtn('−', 'hp', '-1', { cls: 'sm' })}
			<span class="big grow" style="font-size:26px;text-align:center">${c.hp.value}<span style="font-size:14px;color:var(--dim)">/${c.hp.max}</span></span>
			${actBtn('+', 'hp', '1', { cls: 'sm' })}${actBtn('+5', 'hp', '5', { cls: 'sm' })}</div>
		${bar(c.hp.value, c.hp.max)}</div>`;

	const v = c.vitals;
	let cells = '';
	if (v.kind === 'pf2e') {
		const pips = (n, current, act, cls = '') => Array.from({ length: n }, (_, i) =>
			`<button type="button" class="pip ${cls} ${i < current ? 'on' : ''}" data-act="${act}" data-k="${i + 1 === current ? i : i + 1}" aria-label="${act} ${i + 1}"></button>`).join('');
		cells = `<div class="cell">${lbl('Hero Points')}<div class="pips" style="padding:4px 0">${pips(v.hero.max, v.hero.value, 'hero')}</div></div>
			<div class="cell">${lbl('Dying')}<div class="pips" style="padding:4px 0">${pips(v.dying.max, v.dying.value, 'dying', 'bad')}</div></div>
			${counter('Wounded', v.wounded, 'wounded')}
			${counter('Doomed', v.doomed, 'doomed')}`;
	} else {
		const death = (key, count, cls) => Array.from({ length: 3 }, (_, i) =>
			`<button type="button" class="pip ${cls} ${i < count ? 'on' : ''}" data-act="death" data-k="${key}" aria-label="Death save ${key} ${i + 1}"></button>`).join('');
		cells = `<button type="button" class="cell" data-act="hd" data-k="">${lbl('Hit Dice')}<span class="v">${v.hd.value}/${v.hd.max}</span></button>
			<button type="button" class="cell" data-act="insp" data-k="" aria-pressed="${v.inspiration}">${lbl('Inspiration')}<span class="v ${v.inspiration ? 'hot' : 'dimc'}">${v.inspiration ? '●' : '○'}</span></button>
			<div class="cell">${lbl('Death Saves')}<div class="pips">${death('success', v.death.success, '')}</div><div class="pips">${death('failure', v.death.failure, 'bad')}</div></div>
			${counter('Exhaustion', v.exhaustion, 'exhaustion')}`;
	}
	return `<div class="cells scroll">${hp}${cells}</div>`;
}

const counter = (label, value, key) => `<div class="cell">${lbl(label)}<div class="row">
	${actBtn('−', 'stat', `${key}:${Math.max(0, value - 1)}`, { cls: 'sm' })}
	<span class="v">${value}</span>
	${actBtn('+', 'stat', `${key}:${value + 1}`, { cls: 'sm' })}</div></div>`;

/* -------------------------------------------- */
/*  Defenses                                     */
/* -------------------------------------------- */

export function renderDefenses(c, device) {
	const cells = c.defenses.map((d) => {
		const style = d.lead ? ' style="background:var(--hotbg);border-color:var(--hot)"' : '';
		const value = `<span class="v"${d.lead ? ' style="font-size:24px;text-shadow:0 0 10px var(--glow)"' : ''}>${esc(d.value)}</span>`;
		return d.act
			? `<button type="button" class="cell" data-act="${esc(d.act)}" data-k="${esc(d.k ?? '')}" ${ro(`def:${d.label}`)}${style}>${lbl(d.label)}${value}</button>`
			: `<div class="cell"${style} ${ro(`def:${d.label}`)}>${lbl(d.label)}${value}</div>`;
	}).join('');
	// the EVA lays its defenses out as one strip along the bottom of the console
	const eva = device === 'gdi' || device === 'nod';
	const style = eva ? ' style="grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);height:100%"' : '';
	return `<div class="cells scroll"${style}>${cells}</div>`;
}

/* -------------------------------------------- */
/*  Effects                                      */
/* -------------------------------------------- */

export function renderEffectsSlot(c) {
	const chip = (name, extra, act, k) => `<span class="chip" ${ro(k)}>${esc(name)}${extra}
		<button type="button" data-act="${act}" data-k="${esc(k.split(':')[1] ?? '')}" aria-label="Remove ${esc(name)}">×</button></span>`;
	const effects = c.effects.map((e) => chip(e.name, e.duration ? ` · ${esc(e.duration)}` : '', c.system === 'dnd5e' ? 'deleteEffect' : 'delete', `item:${e.id}`)).join('');
	const conditions = c.conditions.map((x) => chip(x.name, x.value != null ? ` ${x.value}` : '', c.system === 'dnd5e' ? 'deleteEffect' : 'cond', `item:${x.id}`)).join('');
	const empty = !effects && !conditions ? '<span class="dimc" style="font-size:13px">No active effects.</span>' : '';
	return `<div class="row sp">${lbl('Effects')}<span class="mono dimc" style="font-size:12px">${c.effects.length + c.conditions.length}</span></div>
		<div class="scroll grow" style="display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start">${effects}${conditions}${empty}</div>`;
}

/* -------------------------------------------- */
/*  Dossier (Mass Effect)                        */
/* -------------------------------------------- */

export function renderExtras(c) {
	const x = c.extras;
	const track = (key, value, colour) => {
		const ticks = [20, 40, 60, 80].map((p) => `<span style="position:absolute;left:${p}%;top:-2px;bottom:-2px;width:1px;background:rgba(255,255,255,.35)"></span>`).join('');
		return `<button type="button" class="b" data-act="pin" data-k="pr:${key}" ${ro(`pr:${key}`)} style="display:flex;flex-direction:column;align-items:stretch;gap:4px;padding:5px 8px;min-height:0;border-color:${colour}55">
			<span class="row sp" style="font-size:11px;font-weight:700;letter-spacing:.12em;color:${colour}">${key.toUpperCase()}<span class="mono" style="font-size:14px">${value}</span></span>
			<span style="position:relative;height:6px;background:rgba(255,255,255,.08)"><span style="position:absolute;left:0;top:0;bottom:0;width:${Math.max(0, Math.min(100, value))}%;background:${colour};box-shadow:0 0 8px ${colour}"></span>${ticks}</span></button>`;
	};
	const shields = x.shields
		? `<div ${ro('shield')} style="display:flex;flex-direction:column;gap:4px">
			<div class="row sp"><span class="lbl" style="color:var(--acc)">Shields</span><span class="mono" style="color:#d9f2ff">${x.shields.value} / ${x.shields.max}</span></div>
			${bar(x.shields.value, x.shields.max, 'a')}</div>`
		: '';
	return `<div class="row sp">${lbl('Dossier')}<span class="chip me">ME</span></div>
		${shields}
		${x.paragon != null ? track('paragon', x.paragon, '#4aa8ff') : ''}
		${x.renegade != null ? track('renegade', x.renegade, '#ff4a3a') : ''}`;
}

/* -------------------------------------------- */
/*  Readout                                      */
/* -------------------------------------------- */

export function renderReadout(entry) {
	if (!entry) {
		return `<div class="lbl">Readout</div>
			<p class="dimc" style="font-size:13px;line-height:1.4">Point at a weapon, action, feat, skill or item to read it here.</p>`;
	}
	const traits = (entry.traits ?? []).map((t) => `<span class="chip">${esc(t)}</span>`).join('');
	const meta = (entry.meta ?? []).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
	return `<div class="row sp"><span class="lbl">${esc(entry.kind ?? '')}</span>${entry.cost ? `<span class="cost">${esc(entry.cost)}</span>` : ''}</div>
		<h3>${esc(entry.name)}</h3>
		${traits ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${traits}</div>` : ''}
		${meta ? `<dl class="meta">${meta}</dl>` : ''}
		${entry.text ? `<p>${esc(entry.text)}</p>` : ''}`;
}

/* -------------------------------------------- */
/*  Tab navigation                               */
/* -------------------------------------------- */

const ICON = {
	character: 'M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0M4 21c1-4 4.5-6 8-6s7 2 8 6',
	details: 'M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0M4 21c1-4 4.5-6 8-6s7 2 8 6',
	actions: 'M12 3l9 9-9 9-9-9z',
	inventory: 'M6 7h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM9 7V4h6v3M4 13h16',
	spells: 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3',
	skills: 'M5 20V11M12 20V4M19 20v-7',
	feats: 'M7 14a5 5 0 1 0 10 0a5 5 0 1 0-10 0M8 3l4 6 4-6',
	features: 'M7 14a5 5 0 1 0 10 0a5 5 0 1 0-10 0M8 3l4 6 4-6',
	effects: 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0M3 12a9 9 0 0 1 9-9M21 12a9 9 0 0 1-9 9',
	biography: 'M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11',
};

const svgIcon = (id) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[id] ?? ICON.character}"/></svg>`;

export function renderNav(c, device, L, current) {
	const tabs = c.tabs;
	const btn = (tab, style, cls = '') => `<button type="button" class="navb ${cls} ${tab.id === current ? 'on' : ''}"
		data-act="tab" data-k="${tab.id}" aria-label="${esc(tab.label)}" aria-current="${tab.id === current}"
		data-tooltip="${esc(tab.label)}" style="${style}">${svgIcon(tab.id)}${cls === 'cam' ? `<span>${esc(tab.label)}</span>` : ''}</button>`;

	if (device === 'omni') {
		const n = tabs.length;
		const mid = (n - 1) / 2;
		const P = L.projection;
		const base = P[1] + P[3] + 12;
		return tabs.map((tab, i) => {
			const k = mid ? (i - mid) / mid : 0;
			const x = 640 - 28 + (i - mid) * 72;
			const y = base + 26 * (1 - k * k);
			const label = tab.id === current ? `<div class="navlbl" style="left:${x - 17}px;top:${y + 60}px">${esc(tab.label)}</div>` : '';
			return btn(tab, `left:${x}px;top:${y}px`) + label;
		}).join('');
	}

	if (device === 'wrist') {
		const half = Math.ceil(tabs.length / 2);
		// 52px buttons on a 76px pitch: the label under one clears the next
		const buttons = tabs.map((tab, i) => btn(tab, `left:${i < half ? 66 : 1170}px;top:${212 + (i < half ? i : i - half) * 76}px`)).join('');
		const ci = Math.max(0, tabs.findIndex((t) => t.id === current));
		const label = tabs[ci]?.label ?? '';
		return buttons + `<div class="mono" style="position:absolute;left:${ci < half ? 52 : 1156}px;top:${212 + (ci < half ? ci : ci - half) * 76 + 54}px;width:72px;text-align:center;font-size:14px;line-height:1;color:var(--hot)">${esc(label.toUpperCase())}</div>`;
	}

	const N = L.nav;
	return `<div class="slot cameos" style="left:${N[0]}px;top:${N[1]}px;width:${N[2]}px;height:${N[3]}px;grid-template-rows:repeat(${Math.ceil(tabs.length / 2)},minmax(0,1fr))">
		${tabs.map((tab) => btn(tab, '', 'cam')).join('')}</div>`;
}
