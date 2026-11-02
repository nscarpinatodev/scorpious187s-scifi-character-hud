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
	/*
	 * Hit points are the one number people change constantly, so they are typed, not
	 * nudged: an amount, a Heal and a Damage button, and the value itself editable.
	 * Right-clicking the panel opens the maximum and the temporary pool as well.
	 */
	// the value's box is as wide as its digits, so it sits against its maximum
	const digits = Math.max(1, String(c.hp.value).length);
	const hp = `<div class="cell wide sfh-hp" data-menu="hp">
		<div class="row sp hp-h">${lbl('Hit Points')}
			<label class="sfh-temp">${lbl('Temp')}<input class="sfh-in mono" type="number" inputmode="numeric"
				value="${c.hp.temp}" data-commit="temp" aria-label="Temporary hit points"></label></div>
		<div class="row hp-v" style="justify-content:center;align-items:baseline;gap:2px">
			<input class="sfh-in sfh-in-hp mono" type="number" inputmode="numeric" value="${c.hp.value}" style="width:${digits + 0.6}ch"
				data-commit="hp" aria-label="Hit points"><span class="mono" style="font-size:15px;color:var(--dim)">/ ${c.hp.max}</span></div>
		${bar(c.hp.value, c.hp.max, 'hp-b')}
		<div class="row hp-a" style="gap:4px">
			<input class="sfh-in mono" type="number" inputmode="numeric" min="0" placeholder="amt" style="width:3.6em;flex:none"
				data-amount="1" aria-label="Amount to heal or damage">
			${actBtn('Heal', 'heal', '', { cls: 'sm ghost', extra: 'grow' })}
			${actBtn('Damage', 'damage', '', { cls: 'sm ghost', extra: 'grow' })}</div></div>`;

	const v = c.vitals;
	let cells = '';
	if (v.kind === 'pf2e') {
		// the system has already taken doomed off dying's maximum; those points show as locked
		cells = `${track('Hero Points', v.hero, 'hero')}
			${track('Dying', v.dying, 'dying', { bad: true, locked: v.doomed })}
			${counter('Wounded', v.wounded, 'wounded', 'warn')}
			${counter('Doomed', v.doomed, 'doomed', 'bad')}`;
	} else {
		// one track: three successes, a divider, three failures
		const death = (key, count, cls) => Array.from({ length: 3 }, (_, i) =>
			`<button type="button" class="seg ${cls} ${i < count ? 'on' : ''}" data-act="death" data-k="${key}" aria-label="Death save ${key} ${i + 1}"></button>`).join('');
		const saves = `Death saves: ${v.death.success} succeeded, ${v.death.failure} failed`;
		cells = `<button type="button" class="cell" data-act="hd" data-k="">${lbl('Hit Dice')}<span class="v">${v.hd.value}/${v.hd.max}</span></button>
			<button type="button" class="cell" data-act="insp" data-k="" aria-pressed="${v.inspiration}">${lbl('Inspiration')}<span class="v ${v.inspiration ? 'hot' : 'dimc'}">${v.inspiration ? '●' : '○'}</span></button>
			<div class="cell trk ${v.death.failure > 0 ? 'alert' : ''}" data-tooltip="${saves}" aria-label="${saves}">${lbl('Death Saves')}
				<div class="segs">${death('success', v.death.success, '')}<span class="segsep"></span>${death('failure', v.death.failure, 'bad')}</div></div>
			${counter('Exhaustion', v.exhaustion, 'exhaustion', 'warn')}`;
	}
	return `<div class="cells scroll">${hp}${cells}</div>`;
}

/** A count with − and +. `lit` is how the number shows while it is above zero. */
const counter = (label, value, key, lit = '') => `<div class="cell">${lbl(label)}<div class="row">
	${actBtn('−', 'stat', `${key}:${Math.max(0, value - 1)}`, { cls: 'sm' })}
	<span class="v ${value > 0 ? lit : ''}">${value}</span>
	${actBtn('+', 'stat', `${key}:${value + 1}`, { cls: 'sm' })}</div></div>`;

/**
 * A segmented track, one segment per point. Clicking a segment sets the value to it, and
 * clicking the last lit one takes it back off. `locked` adds dead segments at the end, for
 * points the maximum has lost; a dying track above zero puts its cell on alert.
 */
const track = (label, { value, max }, act, { bad = false, locked = 0 } = {}) => {
	const name = label.toLowerCase();
	const segs = Array.from({ length: max }, (_, i) => `<button type="button" class="seg ${bad ? 'bad' : ''} ${i < value ? 'on' : ''}"
		data-act="${act}" data-k="${i + 1 === value ? i : i + 1}" aria-label="${esc(`${label} ${i + 1}`)}"></button>`).join('')
		+ '<span class="seg lock" aria-hidden="true"></span>'.repeat(Math.max(0, locked));
	const title = `${label}: ${value} / ${max}`;
	return `<div class="cell trk ${bad && value > 0 ? 'alert' : ''}" data-tooltip="${esc(title)}" aria-label="${esc(title)}">${lbl(label)}
		<div class="segs" role="group" aria-label="${esc(name)}">${segs}</div></div>`;
};

/* -------------------------------------------- */
/*  Defenses                                     */
/* -------------------------------------------- */

export function renderDefenses(c, device) {
	// the EVA lays its defenses out as one strip along the bottom of the console
	const eva = device === 'gdi' || device === 'nod';
	// the panels only two boxes wide (layout.mjs): an odd one out at the end takes the whole
	// row rather than leaving a hole beside it
	const pairs = device === 'omni' || device === 'tron' || (device === 'wrist' && !!c.extras);
	const n = c.defenses.length;
	const cells = c.defenses.map((d, i) => {
		const style = d.lead ? ' style="background:var(--hotbg);border-color:var(--hot)"' : '';
		// the lead defense reads larger, except in the wrist unit's short panel
		const big = d.lead && device !== 'wrist';
		const value = `<span class="v"${big ? ' style="font-size:24px;text-shadow:0 0 10px var(--glow)"' : d.lead ? ' style="text-shadow:0 0 10px var(--glow)"' : ''}>${esc(d.value)}</span>`;
		const cls = pairs && n % 2 && i === n - 1 ? 'cell wide' : 'cell';
		return d.act
			? `<button type="button" class="${cls}" data-act="${esc(d.act)}" data-k="${esc(d.k ?? '')}" ${ro(`def:${d.label}`)}${style}>${lbl(d.label)}${value}</button>`
			: `<div class="${cls}"${style} ${ro(`def:${d.label}`)}>${lbl(d.label)}${value}</div>`;
	}).join('');
	const style = eva ? ' style="grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);height:100%"' : '';
	return `<div class="cells scroll"${style}>${cells}</div>`;
}

/* -------------------------------------------- */
/*  Effects                                      */
/* -------------------------------------------- */

export function renderEffectsSlot(c) {
	// `key` is what the readout describes; `remove` is the [act, k] the × sends, if it has one
	const chip = (name, inner, key, remove) => `<span class="chip" ${ro(key)}>${esc(name)}${inner}${remove
		? `<button type="button" data-act="${remove[0]}" data-k="${esc(remove[1])}" aria-label="Remove ${esc(name)}">×</button>`
		: ''}</span>`;
	const step = (x, delta, label) =>
		`<button type="button" data-act="cond" data-k="${esc(`${x.slug}:${delta}`)}" aria-label="${label} ${esc(x.name)}">${delta < 0 ? '−' : '+'}</button>`;
	const dnd = c.system === 'dnd5e';

	const effects = c.effects.map((e) => chip(e.name, e.duration ? ` · ${esc(e.duration)}` : '', `item:${e.id}`,
		[dnd ? 'deleteEffect' : 'delete', e.id])).join('');

	// PF2e raises, lowers and removes a condition by its slug, through the system's own calls.
	// A locked one was granted by something else, so it shows its value and nothing more.
	const conditions = c.conditions.map((x) => {
		const valued = x.value != null;
		const inner = valued && !dnd && !x.locked ? ` ${step(x, -1, 'Lower')}${x.value}${step(x, 1, 'Raise')}` : valued ? ` ${x.value}` : '';
		const remove = x.locked ? null : dnd ? ['deleteEffect', x.id] : ['cond', `${x.slug}:0`];
		return chip(x.name, inner, `item:${x.id}`, remove);
	}).join('');

	const empty = !effects && !conditions ? '<span class="dimc" style="font-size:13px">No active effects.</span>' : '';
	const choices = c.conditionChoices ?? [];
	const picker = choices.length
		? `<select class="sel" data-pick="condition" aria-label="Add a condition"><option value="">+ Add condition…</option>${
			choices.map((o) => `<option value="${esc(o.id)}">${esc(o.label)}</option>`).join('')}</select>`
		: '';
	return `<div class="row sp hd">${lbl('Effects')}<span class="mono dimc" style="font-size:12px">${c.effects.length + c.conditions.length}</span></div>
		<div class="scroll grow" style="display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start">${effects}${conditions}${empty}</div>
		${picker}`;
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
	return `<div class="row sp hd">${lbl('Dossier')}<span class="chip me">ME</span></div>
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
	spellcasting: 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3',
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

	if (device === 'omni' || device === 'tron') {
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
		// the first button is level with the top of the main panel, not tucked under the top row
		const top = L.nav[1];
		// 52px buttons on a 76px pitch: the label under one clears the next
		const buttons = tabs.map((tab, i) => btn(tab, `left:${i < half ? 66 : 1170}px;top:${top + (i < half ? i : i - half) * 76}px`)).join('');
		const ci = Math.max(0, tabs.findIndex((t) => t.id === current));
		const label = tabs[ci]?.label ?? '';
		return buttons + `<div class="mono" style="position:absolute;left:${ci < half ? 52 : 1156}px;top:${top + (ci < half ? ci : ci - half) * 76 + 54}px;width:72px;text-align:center;font-size:14px;line-height:1;color:var(--hot)">${esc(label.toUpperCase())}</div>`;
	}

	const N = L.nav;
	return `<div class="slot cameos" style="left:${N[0]}px;top:${N[1]}px;width:${N[2]}px;height:${N[3]}px;grid-template-rows:repeat(${Math.ceil(tabs.length / 2)},minmax(0,1fr))">
		${tabs.map((tab) => btn(tab, '', 'cam')).join('')}</div>`;
}
