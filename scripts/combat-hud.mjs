import { MOD, S } from './constants.mjs';
import { setting } from './settings.mjs';
import { getTheme } from './themes.mjs';
import { themeFor, isHidden } from './shell.mjs';
import { openThemePicker } from './ui/theme-picker.mjs';

/**
 * The combat HUD.
 *
 * Not a window: a bar docked to the bottom of the canvas, bound to whichever token you
 * control, in the spirit of Argon's Enhanced Combat HUD. Portrait and vitals on the left,
 * the action economy in the middle, movement and drawers on the right.
 *
 * As everywhere else in this module, it renders and the system rules: every button hands
 * off to the system adapter, which calls the system's own API.
 */

const ROOT_ID = 'sfh-combat-hud';

let adapter = null;
let current = null;      // the actor the HUD is showing
let drawer = null;       // which drawer is open, if any

export function initCombatHud(systemAdapter) {
	adapter = systemAdapter;

	Hooks.on('controlToken', (token, controlled) => {
		if (controlled) show(token.actor);
		else if (!canvas.tokens?.controlled?.length) show(defaultActor());
	});
	Hooks.on('canvasReady', () => show(defaultActor()));
	Hooks.on('updateActor', (doc) => { if (doc.id === current?.id) render(); });
	Hooks.on('createItem', (i) => { if (i.parent?.id === current?.id) render(); });
	Hooks.on('updateItem', (i) => { if (i.parent?.id === current?.id) render(); });
	Hooks.on('deleteItem', (i) => { if (i.parent?.id === current?.id) render(); });
	Hooks.on('createActiveEffect', (e) => { if (e.parent?.id === current?.id) render(); });
	Hooks.on('deleteActiveEffect', (e) => { if (e.parent?.id === current?.id) render(); });
	Hooks.on('updateCombat', () => render());

	if (game.ready) show(defaultActor());
}

/** Your own character when nothing is selected, so the HUD is there out of combat too. */
function defaultActor() {
	return canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
}

export function show(actor) {
	current = actor?.isOwner ? actor : null;
	drawer = null;
	render();
}

export function hideCombatHud(hidden) {
	document.getElementById(ROOT_ID)?.classList.toggle('sfh-hidden', hidden);
}

/* -------------------------------------------- */
/*  Rendering                                    */
/* -------------------------------------------- */

function root() {
	let el = document.getElementById(ROOT_ID);
	if (!el) {
		el = document.createElement('div');
		el.id = ROOT_ID;
		el.className = 'sfh-chud';
		el.addEventListener('click', onClick);
		el.addEventListener('pointerover', onHover);
		(document.getElementById('interface') ?? document.body).append(el);
	}
	return el;
}

export function render() {
	if (!setting(S.combatHud)) return document.getElementById(ROOT_ID)?.remove();
	const el = root();
	if (!current) {
		el.innerHTML = '';
		el.dataset.empty = 'true';
		return;
	}

	const d = adapter.hud(current);
	const themeId = themeFor(current);
	el.dataset.empty = 'false';
	el.dataset.hudTheme = themeId;
	el.dataset.chrome = setting(S.chrome);
	el.classList.toggle('sfh-hidden', isHidden());

	el.innerHTML = `
		${portrait(d)}
		<div class="sfh-chud-actions">${d.groups.map(group).join('')}</div>
		${side(d)}
		${drawerPanel(d)}`;
}

function portrait(d) {
	const effects = d.effects.map((e) => `
		<img class="sfh-chud-effect" src="${esc(e.img)}" alt="${esc(e.name)}" data-tooltip="${esc(e.name)}">`).join('');
	return `
	<section class="sfh-chud-portrait">
		<div class="sfh-chud-face" style="background-image:url('${esc(d.img)}')"></div>
		<div class="sfh-chud-vitals">
			<div class="sfh-chud-name">${esc(d.name)}</div>
			<div class="sfh-chud-sub">${esc(d.subtitle)}</div>
			<div class="sfh-chud-hp">
				<button type="button" class="sfh-chud-mini" data-chud="hp" data-delta="-1" aria-label="−1 HP">−</button>
				<div class="sfh-chud-hpbar"><i style="width:${d.hp.pct}%"></i><span>${d.hp.value} / ${d.hp.max}${d.hp.temp ? ` +${d.hp.temp}` : ''}</span></div>
				<button type="button" class="sfh-chud-mini" data-chud="hp" data-delta="1" aria-label="+1 HP">+</button>
			</div>
			<div class="sfh-chud-effects">${effects}</div>
		</div>
		<div class="sfh-chud-ac" data-tooltip="${game.i18n.localize('SFH.Stat.AC')}">${d.ac}</div>
	</section>`;
}

function group(g) {
	const buttons = g.items.map((item) => `
		<button type="button" class="sfh-chud-btn" data-chud="use" data-item-id="${item.id}" data-item="${item.id}"
			data-tooltip="${esc(item.name)}" aria-label="${esc(item.name)}">
			<img src="${esc(item.img)}" alt="">
			<span class="sfh-chud-btn-name">${esc(item.name)}</span>
			${item.uses ? `<span class="sfh-chud-uses">${item.uses.value}/${item.uses.max}</span>` : ''}
		</button>`).join('');
	return `
	<section class="sfh-chud-group" data-group="${g.id}">
		<header>${game.i18n.localize(g.label)}${g.max ? `<span class="sfh-chud-pips">${pips(g.used, g.max)}</span>` : ''}</header>
		<div class="sfh-chud-buttons">${buttons || `<span class="sfh-chud-empty">${game.i18n.localize('SFH.Hud.NoActions')}</span>`}</div>
	</section>`;
}

function pips(used, max) {
	return Array.from({ length: max }, (_, i) => `<i class="${i < max - used ? 'is-on' : ''}"></i>`).join('');
}

function side(d) {
	const btn = (id, label, icon) => `
		<button type="button" class="sfh-chud-tool ${drawer === id ? 'is-on' : ''}" data-chud="drawer" data-drawer="${id}"
			data-tooltip="${game.i18n.localize(label)}" aria-label="${game.i18n.localize(label)}"><i class="fa-solid ${icon}"></i></button>`;
	return `
	<section class="sfh-chud-side">
		<div class="sfh-chud-move">
			<span class="sfh-chud-move-value">${d.speed}</span>
			<span class="sfh-chud-label">${game.i18n.localize('SFH.Stat.Speed')}</span>
		</div>
		<div class="sfh-chud-tools">
			${btn('skills', 'SFH.Tab.Skills', 'fa-hand')}
			${btn('saves', 'SFH.Hud.Saves', 'fa-shield-halved')}
			${btn('inventory', 'SFH.Tab.Inventory', 'fa-box-open')}
			<button type="button" class="sfh-chud-tool" data-chud="sheet" data-tooltip="${game.i18n.localize('SFH.Hud.OpenSheet')}" aria-label="${game.i18n.localize('SFH.Hud.OpenSheet')}"><i class="fa-solid fa-id-card"></i></button>
			<button type="button" class="sfh-chud-tool" data-chud="theme" data-tooltip="${game.i18n.localize('SFH.Bar.Theme')}" aria-label="${game.i18n.localize('SFH.Bar.Theme')}"><i class="fa-solid fa-palette"></i></button>
		</div>
	</section>`;
}

/** The drawer slides up above the bar, the way Argon's does. */
function drawerPanel(d) {
	if (!drawer) return '';
	const rows = {
		skills: d.skills.map((s) => `
			<button type="button" class="sfh-chud-row" data-chud="roll-skill" data-key="${s.key}">
				<span>${esc(s.label)}</span><span class="sfh-chud-mod">${esc(s.total)}</span>
			</button>`).join(''),
		saves: d.saves.map((s) => `
			<button type="button" class="sfh-chud-row" data-chud="roll-save" data-key="${s.key}">
				<span>${esc(s.label)}</span><span class="sfh-chud-mod">${esc(s.total)}</span>
			</button>`).join(''),
		inventory: d.inventory.map((i) => `
			<button type="button" class="sfh-chud-row" data-chud="use" data-item-id="${i.id}">
				<img src="${esc(i.img)}" alt=""><span>${esc(i.name)}</span>${i.quantity > 1 ? `<span class="sfh-chud-mod">×${i.quantity}</span>` : ''}
			</button>`).join(''),
	}[drawer] ?? '';
	return `<section class="sfh-chud-drawer" data-drawer="${drawer}"><div class="sfh-chud-drawer-grid">${rows}</div></section>`;
}

const esc = (s) => foundry.utils.escapeHTML(String(s ?? ''));

/* -------------------------------------------- */
/*  Interaction                                  */
/* -------------------------------------------- */

async function onClick(event) {
	const btn = event.target.closest('[data-chud]');
	if (!btn) return;
	event.preventDefault();
	const { chud: action, itemId, key, delta, drawer: which } = btn.dataset;

	switch (action) {
		case 'drawer':
			drawer = drawer === which ? null : which;
			return render();
		case 'sheet':
			return current?.sheet?.render(true);
		case 'theme':
			return openThemePicker(current, themeFor(current));
		case 'hp':
			return adapter.act(current, 'adjust-hp', { delta });
		case 'use':
			return adapter.act(current, 'use-item', { itemId });
		case 'roll-skill':
			return adapter.act(current, 'roll-skill', { key });
		case 'roll-save':
			return adapter.act(current, 'roll-save', { key });
		default:
			return null;
	}
}

/** Foundry's own tooltip carries the description, as Argon does. */
function onHover(event) {
	const btn = event.target.closest('[data-item-id]');
	if (!btn || !current) return;
	const item = current.items.get(btn.dataset.itemId);
	if (!item || btn.dataset.tooltipReady) return;
	btn.dataset.tooltipReady = '1';
	const parts = [item.name];
	const text = item.system?.description?.value?.replace(/<[^>]+>/g, ' ').trim();
	if (text) parts.push(text.slice(0, 220) + (text.length > 220 ? '…' : ''));
	btn.dataset.tooltip = parts.join(' — ');
}

export { MOD, getTheme };
