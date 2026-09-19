import { MOD, S, SIZES } from './constants.mjs';
import { setting } from './settings.mjs';
import { getTheme } from './themes.mjs';
import { themeFor, isHidden, setHidden, playSequence, hideKeyLabel } from './shell.mjs';
import { openThemePicker } from './ui/theme-picker.mjs';
import { extrasEnabled, mountExtras, unmountExtras } from './me-extras.mjs';

/**
 * The HUD sheet.
 *
 * This is a sheet in its own right, not a restyled system sheet: it renders its own
 * markup from a view model and never borrows the system's layout. What it does *not* do
 * is implement any rules — every roll, use, rest and edit is handed to the system adapter,
 * which calls the system's own API. So the display is entirely ours and the mechanics are
 * entirely the system's.
 */

// DocumentSheetV2, not ApplicationV2: DocumentSheetConfig.registerSheet only accepts a
// DocumentSheetV2 (or an ApplicationV1 sheet), and it hands us the actor as `document`.
const { DocumentSheetV2 } = foundry.applications.api;

const ICONS = {
	character: 'M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0M4 21c1-4 4.5-6 8-6s7 2 8 6',
	inventory: 'M6 7h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM9 7V4h6v3M4 13h16',
	feats: 'M7 14a5 5 0 1 0 10 0a5 5 0 1 0-10 0M8 3l4 6 4-6',
	spells: 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3',
	effects: 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0M3 12a9 9 0 0 1 9-9M21 12a9 9 0 0 1-9 9',
	biography: 'M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11',
};

const esc = (s) => foundry.utils.escapeHTML(String(s ?? ''));
const icon = (id) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="${ICONS[id] ?? ICONS.character}"/></svg>`;
const L = (key) => game.i18n.localize(key);

export function makeHudSheet(adapter) {
	return class SciFiHudSheet extends DocumentSheetV2 {
		static SFH_HUD = true;

		static DEFAULT_OPTIONS = {
			id: 'sfh-hud-{id}',
			classes: ['sfh-app', 'sfh-window'],
			tag: 'div',
			window: { resizable: true, minimizable: true, contentClasses: ['sfh-window-content'] },
			position: { width: 1120, height: 780 },
			form: { submitOnChange: false, closeOnSubmit: false },
			sheetConfig: true,
		};

		tab = adapter.TABS[0].id;

		/** DocumentSheetV2 supplies `document`; the rest of the code says `actor`. */
		get actor() { return this.document; }
		get title() { return this.document?.name ?? L('SFH.SheetLabel'); }

		/* ---------- rendering ---------- */

		async _renderHTML() {
			const data = adapter.read(this.actor);
			const themeId = themeFor(this.actor);
			const theme = getTheme(themeId);
			const chrome = setting(S.chrome);

			const frame = document.createElement('div');
			frame.className = 'sfh-hud';
			frame.dataset.hudTheme = themeId;
			frame.dataset.chrome = chrome;
			frame.dataset.sequence = theme.sequence;
			frame.dataset.scanlines = setting(S.scanlines) ? 'on' : 'off';
			frame.dataset.size = this._sfhSize ?? 'wide';
			frame.dataset.drawer = this._sfhDrawer ?? 'closed';

			frame.innerHTML = `
				${chrome === 'clean' ? '' : `<div class="sfh-art" data-chrome="${chrome}">${theme.art()}</div>`}
				${this.#identity(data)}
				<div class="sfh-slot sfh-col" data-slot="aside">
					${this.#vitals(data)}
					${this.#conditionPanel(data)}
					<aside class="sfh-extras sfh-own" hidden></aside>
				</div>
				<section class="sfh-slot sfh-projection" data-slot="projection">
					<header class="sfh-proj-head">
						<span class="sfh-proj-title">${L(adapter.TABS.find((t) => t.id === this.tab)?.label ?? '')}</span>
						<span class="sfh-src">${esc(adapter.id)} · parts/${esc(this.tab)}</span>
					</header>
					<div class="sfh-proj-body" data-scroll="${this.tab}">${this.#tab(data)}</div>
				</section>
				<div class="sfh-slot sfh-col" data-slot="side">
					${this.#defenses(data)}
					<aside class="sfh-readout">
						<header class="sfh-panel-head"><span class="sfh-label">${L('SFH.Readout.Title')}</span></header>
						<div class="sfh-readout-body"><p class="sfh-dim">${L('SFH.Readout.Empty')}</p></div>
					</aside>
				</div>
				${this.#nav()}
				<div class="sfh-glass"></div>`;

			return frame;
		}

		_replaceHTML(result, content) {
			const previous = content.querySelector('.sfh-proj-body');
			const scroll = previous?.scrollTop ?? 0;
			content.replaceChildren(result);
			const body = content.querySelector('.sfh-proj-body');
			if (body) body.scrollTop = scroll;
		}

		/* ---------- slots ---------- */

		#identity(d) {
			const box = (action, label) => `<button type="button" class="sfh-boxed sfh-click" data-sfh="${action}"><span class="sfh-boxed-label">${L(label)}</span></button>`;
			const iconBtn = (action, label, ic) => `<button type="button" class="sfh-boxed sfh-click sfh-icon" data-sfh="${action}" data-tooltip="${L(label)}" aria-label="${L(label)}"><i class="fa-solid ${ic}"></i></button>`;
			return `
			<header class="sfh-slot sfh-identity" data-slot="identity">
				<div class="sfh-ident-text">
					<h2 class="sfh-name">${esc(d.name)}</h2>
					<span class="sfh-sub">${esc(d.subtitle)}</span>
				</div>
				<div class="sfh-xp">
					<span class="sfh-label">${L('SFH.Stat.XP')}</span>
					<span class="sfh-num">${d.xp.value.toLocaleString()} / ${d.xp.max.toLocaleString()}</span>
					<div class="sfh-bar"><i style="width:${d.xp.pct}%"></i></div>
				</div>
				<div class="sfh-boxed sfh-level"><span class="sfh-label">${L('SFH.Stat.Level')}</span><span class="sfh-big">${d.level}</span></div>
				${box('rest-short', 'SFH.Action.ShortRest')}
				${box('rest-long', 'SFH.Action.LongRest')}
				${iconBtn('theme', 'SFH.Bar.Theme', 'fa-sun')}
				${iconBtn('chrome', 'SFH.Bar.Chrome', 'fa-image')}
				${iconBtn('hide', 'SFH.Bar.Hide', 'fa-eye-slash')}
			</header>`;
		}

		#vitals(d) {
			const v = d.vitals;
			const pips = (n, total, action, cls = '') => Array.from({ length: total }, (_, i) =>
				`<button type="button" class="sfh-pip ${cls} ${i < n ? 'is-on' : ''}" data-sfh="${action}" data-i="${i}" aria-label="${i + 1}"></button>`).join('');
			return `
			<section class="sfh-panel sfh-vitals">
				<div class="sfh-hp">
					<div class="sfh-row sfh-between">
						<span class="sfh-label">${L('SFH.Stat.HP')}</span>
						<button type="button" class="sfh-chip sfh-click" data-sfh="temp">${L('SFH.Stat.Temp')} ${v.hp.temp}</button>
					</div>
					<div class="sfh-row sfh-hp-row">
						<button type="button" class="sfh-btn sfh-sm" data-sfh="hp" data-delta="-5">−5</button>
						<button type="button" class="sfh-btn sfh-sm" data-sfh="hp" data-delta="-1">−</button>
						<span class="sfh-big sfh-grow">${v.hp.value}<span class="sfh-of">/${v.hp.max}</span></span>
						<button type="button" class="sfh-btn sfh-sm" data-sfh="hp" data-delta="1">+</button>
						<button type="button" class="sfh-btn sfh-sm" data-sfh="hp" data-delta="5">+5</button>
					</div>
					<div class="sfh-bar"><i style="width:${v.hp.pct}%"></i></div>
				</div>
				<div class="sfh-cells">
					<button type="button" class="sfh-cell sfh-click" data-sfh="roll-hd">
						<span class="sfh-label">${L('SFH.Stat.HitDice')}</span><span class="sfh-v">${v.hitDice.value}/${v.hitDice.max}</span>
					</button>
					<button type="button" class="sfh-cell sfh-click" data-sfh="toggle-inspiration" aria-pressed="${v.inspiration}">
						<span class="sfh-label">${L('SFH.Stat.Inspiration')}</span><span class="sfh-v ${v.inspiration ? 'is-lit' : ''}">${v.inspiration ? '●' : '○'}</span>
					</button>
					<div class="sfh-cell">
						<span class="sfh-label">${L('SFH.Stat.DeathSaves')}</span>
						<div class="sfh-pips">${pips(v.death.success, 3, 'roll-death')}</div>
						<div class="sfh-pips">${pips(v.death.failure, 3, 'roll-death', 'is-bad')}</div>
					</div>
					<div class="sfh-cell">
						<span class="sfh-label">${L('SFH.Stat.Exhaustion')}</span>
						<div class="sfh-row">
							<button type="button" class="sfh-btn sfh-sm" data-sfh="exhaustion" data-delta="-1">−</button>
							<span class="sfh-v">${v.exhaustion}</span>
							<button type="button" class="sfh-btn sfh-sm" data-sfh="exhaustion" data-delta="1">+</button>
						</div>
					</div>
				</div>
			</section>`;
		}

		/** Conditions as chips with a picker, the way the mock-up's Effects panel works. */
		#conditionPanel(d) {
			const chips = d.conditions.active.map((c) => `
				<span class="sfh-chip is-on">${esc(c.name)}
					<button type="button" data-sfh="toggle-status" data-key="${c.id}" aria-label="Remove">×</button>
				</span>`).join('');
			const options = d.conditions.available.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
			return `
			<section class="sfh-panel sfh-effects">
				<div class="sfh-row sfh-between">
					<span class="sfh-label">${L('SFH.Tab.Effects')}</span>
					<span class="sfh-num">${d.conditions.active.length}</span>
				</div>
				<div class="sfh-chips">${chips || `<span class="sfh-dim">${L('SFH.Empty.Effects')}</span>`}</div>
				<select class="sfh-select" data-sfh-select="status" aria-label="${L('SFH.Action.AddCondition')}">
					<option value="">${L('SFH.Action.AddCondition')}</option>${options}
				</select>
			</section>`;
		}

		#defenses(d) {
			const cells = d.defenses.map((s) => s.action
				? `<button type="button" class="sfh-cell sfh-click" data-sfh="${s.action}"><span class="sfh-label">${L(s.label)}</span><span class="sfh-v">${esc(s.value)}</span></button>`
				: `<div class="sfh-cell ${s.primary ? 'is-primary' : ''}"><span class="sfh-label">${L(s.label)}</span><span class="sfh-v">${esc(s.value)}</span></div>`).join('');
			return `<section class="sfh-panel sfh-defenses"><div class="sfh-cells">${cells}</div></section>`;
		}

		#nav() {
			const tabs = adapter.TABS;
			const mid = (tabs.length - 1) / 2;
			const buttons = tabs.map((t, i) => {
				const k = mid ? (i - mid) / mid : 0;
				const lift = Math.round(16 * (1 - k * k));      // an arc, highest in the middle
				const on = t.id === this.tab;
				return `<button type="button" class="sfh-navb ${on ? 'is-on' : ''}" data-sfh="tab" data-tab="${t.id}"
					role="tab" aria-selected="${on}" style="--sfh-lift:${lift}px"
					data-tooltip="${L(t.label)}" aria-label="${L(t.label)}">${icon(t.icon)}</button>`;
			}).join('');
			const current = tabs.find((t) => t.id === this.tab);
			return `<nav class="sfh-nav" data-slot="nav" role="tablist">
				<div class="sfh-nav-arc">${buttons}</div>
				<span class="sfh-nav-label">${L(current?.label ?? '')}</span>
			</nav>`;
		}

		/* ---------- tab bodies ---------- */

		#tab(d) {
			switch (this.tab) {
				case 'details': return this.#details(d);
				case 'inventory': return this.#inventory(d);
				case 'features': return this.#list(d.features);
				case 'spells': return this.#spells(d);
				case 'effects': return this.#effects(d);
				case 'biography': return `<div class="sfh-prose">${d.biography || `<p class="sfh-dim">${L('SFH.Empty.Biography')}</p>`}</div>`;
				default: return '';
			}
		}

		#details(d) {
			const abilities = d.abilities.map((a) => `
				<div class="sfh-ability">
					<span class="sfh-label">${esc(a.label)}</span>
					<button type="button" class="sfh-btn sfh-roll sfh-mod" data-sfh="roll-ability" data-key="${a.key}">${esc(a.mod)}</button>
					<span class="sfh-score">${a.score}</span>
					<button type="button" class="sfh-btn sfh-sm sfh-save" data-sfh="roll-save" data-key="${a.key}">${a.proficient ? '●' : '○'} ${L('SFH.Stat.Save')} ${esc(a.save)}</button>
				</div>`).join('');
			const skills = d.skills.map((s) => `
				<div class="sfh-line">
					<span class="sfh-prof" data-rank="${s.rank}">${s.rank === 2 ? '◆' : s.rank >= 1 ? '●' : '○'}</span>
					<button type="button" class="sfh-link sfh-grow" data-sfh="roll-skill" data-key="${s.key}">${esc(s.label)}</button>
					<span class="sfh-dim sfh-abbr">${esc(s.ability)}</span>
					<button type="button" class="sfh-btn sfh-roll sfh-sm" data-sfh="roll-skill" data-key="${s.key}">${esc(s.total)}</button>
				</div>`).join('');
			const traits = d.traits.map((t) => `
				<div class="sfh-trait">
					<span class="sfh-label">${L(t.label)}</span>
					<span>${esc(t.value)}</span>
				</div>`).join('');
			return `
				<div class="sfh-abilities">${abilities}</div>
				<div class="sfh-details-body">
					<div>
						<h3 class="sfh-sec">${L('SFH.Tab.Skills')}</h3>
						<div class="sfh-two">${skills}</div>
					</div>
					<div>
						<h3 class="sfh-sec">${L('SFH.Tab.Traits')}</h3>
						<div class="sfh-traits">${traits}</div>
					</div>
				</div>`;
		}

		#inventory(d) {
			const coins = d.currency.map((c) => `<div class="sfh-cell"><span class="sfh-label">${esc(c.key)}</span><span class="sfh-v">${c.value}</span></div>`).join('');
			return `
				<div class="sfh-coins">${coins}</div>
				<div class="sfh-row sfh-between"><span class="sfh-label">${L('SFH.Stat.Encumbrance')}</span><span class="sfh-num">${d.encumbrance.value} / ${d.encumbrance.max}</span></div>
				<div class="sfh-bar"><i style="width:${d.encumbrance.pct}%"></i></div>
				${this.#list(d.inventory, true)}`;
		}

		#list(rows, equip = false) {
			if (!rows.length) return `<p class="sfh-dim">${L('SFH.Empty.List')}</p>`;
			return `<div class="sfh-items">${rows.map((r) => `
				<div class="sfh-item" data-item-id="${r.id}">
					<img src="${esc(r.img)}" alt="">
					<button type="button" class="sfh-link sfh-grow" data-sfh="open-item" data-item-id="${r.id}">${esc(r.name)}</button>
					${r.quantity > 1 ? `<span class="sfh-num">×${r.quantity}</span>` : ''}
					${r.uses ? `<span class="sfh-num">${r.uses.value}/${r.uses.max}</span>` : ''}
					${equip ? `<button type="button" class="sfh-btn sfh-sm ${r.equipped ? 'is-on' : ''}" data-sfh="toggle-equip" data-item-id="${r.id}" aria-pressed="${r.equipped}">${L(r.equipped ? 'SFH.Action.Equipped' : 'SFH.Action.Equip')}</button>` : ''}
					${r.usable ? `<button type="button" class="sfh-btn sfh-sm sfh-use" data-sfh="use-item" data-item-id="${r.id}">${L('SFH.Action.Use')}</button>` : ''}
				</div>`).join('')}</div>`;
		}

		#spells(d) {
			if (!d.spells.length) return `<p class="sfh-dim">${L('SFH.Empty.Spells')}</p>`;
			return d.spells.map((lvl) => `
				<h3 class="sfh-sec">
					${lvl.level === 0 ? L('SFH.Spells.Cantrips') : game.i18n.format('SFH.Spells.Level', { level: lvl.level })}
					${lvl.slots ? `<span class="sfh-slots">${Array.from({ length: lvl.slots.max }, (_, i) =>
						`<button type="button" class="sfh-pip ${i < lvl.slots.value ? 'is-on' : ''}" data-sfh="slot" data-level="${lvl.level}" data-i="${i}" aria-label="${i + 1}"></button>`).join('')}</span>` : ''}
				</h3>
				${this.#list(lvl.spells)}`).join('');
		}

		#effects(d) {
			if (!d.effects.length) return `<p class="sfh-dim">${L('SFH.Empty.Effects')}</p>`;
			return `<div class="sfh-items">${d.effects.map((e) => `
				<div class="sfh-item ${e.disabled ? 'is-off' : ''}">
					<img src="${esc(e.img)}" alt="">
					<span class="sfh-grow">${esc(e.name)}</span>
					<span class="sfh-dim">${esc(e.duration)}</span>
					<button type="button" class="sfh-btn sfh-sm" data-sfh="toggle-effect" data-effect-id="${e.id}">${L(e.disabled ? 'SFH.Action.Enable' : 'SFH.Action.Disable')}</button>
				</div>`).join('')}</div>`;
		}

		/* ---------- behaviour ---------- */

		_onRender(context, options) {
			super._onRender(context, options);
			const root = this.element;
			root.classList.toggle('sfh-hidden', isHidden());
			root.style.setProperty('--sfh-scale', String(setting(S.scale)));

			const frame = root.querySelector('.sfh-hud');
			// Bind once. ApplicationV2 keeps the same root element across re-renders, so
			// binding per render stacks handlers: one click would then open as many theme
			// dialogs as there had been renders, which reads as a dialog that will not close.
			if (!this._sfhBound) {
				this._sfhBound = true;
				root.addEventListener('click', this.#onClick.bind(this));
				root.addEventListener('change', (event) => {
					const select = event.target.closest('[data-sfh-select="status"]');
					if (select?.value) adapter.act(this.actor, 'toggle-status', { key: select.value });
				});
				root.addEventListener('pointerover', this.#onHover.bind(this));
			}

			const extras = root.querySelector('.sfh-extras');
			if (extras && extrasEnabled(this.actor)) {
				extras.hidden = false;
				mountExtras(this, extras);
			}

			this.#observe(root, frame);

			if (!this._sfhBooted) {
				this._sfhBooted = true;
				if (isHidden()) setHidden(false);
				playSequence(frame, 'on');
			}
		}

		async #onClick(event) {
			const btn = event.target.closest('[data-sfh]');
			if (!btn || !this.element.contains(btn)) return;
			event.preventDefault();
			const { sfh: action, key, itemId, effectId, delta, level, tab } = btn.dataset;

			switch (action) {
				case 'tab': this.tab = tab; return this.render();
				case 'drawer': {
					const frame = this.element.querySelector('.sfh-hud');
					this._sfhDrawer = frame.dataset.drawer === 'open' ? 'closed' : 'open';
					frame.dataset.drawer = this._sfhDrawer;
					return;
				}
				case 'chrome': {
					const order = ['full', 'bare', 'clean'];
					return game.settings.set(MOD, S.chrome, order[(order.indexOf(setting(S.chrome)) + 1) % order.length]);
				}
				case 'hide':
					setHidden(true);
					return ui.notifications.info(game.i18n.format('SFH.HiddenHint', { key: hideKeyLabel() }));
				case 'theme': return openThemePicker(this.actor, themeFor(this.actor));
				case 'hp': return adapter.act(this.actor, 'adjust-hp', { delta });
				case 'temp': return adapter.act(this.actor, 'adjust-temp', { delta: 5 });
				case 'exhaustion': return adapter.act(this.actor, 'adjust-exhaustion', { delta });
				case 'slot': return adapter.act(this.actor, 'spend-slot', { level, delta: -1 });
				default:
					return adapter.act(this.actor, action, { key, itemId, effectId, delta, level });
			}
		}

		/** The readout follows the pointer over anything that names an item. */
		async #onHover(event) {
			const row = event.target.closest('[data-item-id]');
			const body = this.element.querySelector('.sfh-readout-body');
			if (!row || !body) return;
			const item = this.actor.items.get(row.dataset.itemId);
			if (!item || this._sfhReadoutId === item.id) return;
			this._sfhReadoutId = item.id;
			const editor = foundry.applications?.ux?.TextEditor?.implementation ?? globalThis.TextEditor;
			const description = await editor.enrichHTML(item.system?.description?.value ?? '', { relativeTo: item, rollData: this.actor.getRollData() });
			body.innerHTML = `<h4 class="sfh-readout-title">${esc(item.name)}</h4><div class="sfh-readout-text">${description}</div>`;
			body.scrollTop = 0;
		}

		/** The layout follows the sheet's width, so a narrow window compacts itself. */
		#observe(root, frame) {
			const compactAt = setting(S.compactAt);
			this._sfhResize?.disconnect();
			this._sfhResize = new ResizeObserver(([entry]) => {
				const w = entry.contentRect.width;
				const size = w < SIZES.mini ? 'mini' : w < compactAt ? 'compact' : 'wide';
				if (this._sfhSize !== size) {
					this._sfhSize = size;
					frame.dataset.size = size;
					if (size === 'wide') frame.dataset.drawer = this._sfhDrawer = 'closed';
				}
			});
			this._sfhResize.observe(root);
		}

		/* ---------- lifecycle ---------- */

		async close(options = {}) {
			const frame = this.element?.querySelector('.sfh-hud');
			if (frame && setting(S.closeSequence) && !options.sfhSkipSequence) await playSequence(frame, 'off');
			this._sfhResize?.disconnect();
			this._sfhResize = null;
			unmountExtras(this);
			return super.close(options);
		}

		/** Re-render when the character changes, the way a sheet does. */
		static hookUp() {
			Hooks.on('updateActor', (actor) => refresh(actor));
			Hooks.on('createItem', (item) => refresh(item.parent));
			Hooks.on('updateItem', (item) => refresh(item.parent));
			Hooks.on('deleteItem', (item) => refresh(item.parent));
			Hooks.on('createActiveEffect', (e) => refresh(e.parent));
			Hooks.on('updateActiveEffect', (e) => refresh(e.parent));
			Hooks.on('deleteActiveEffect', (e) => refresh(e.parent));
		}
	};
}

function refresh(actor) {
	if (!actor) return;
	for (const app of foundry.applications.instances.values()) {
		if (app.constructor.SFH_HUD && app.actor?.id === actor.id) app.render(false);
	}
}
