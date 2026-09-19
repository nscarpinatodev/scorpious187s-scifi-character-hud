"""One-off: rebuild the HUD markup to match the approved mock-up."""
import pathlib

root = pathlib.Path(__file__).resolve().parents[1]
p = root / 'scripts/hud-app.mjs'
s = p.read_text(encoding='utf-8')


def cut(start, end):
    """Replace the slice from `start` up to `end` (exclusive) with new text."""
    i, j = s.index(start), s.index(end)
    return s[i:j]


FRAME = """			frame.innerHTML = `
				${chrome === 'clean' ? '' : `<div class="sfh-art" data-chrome="${chrome}">${theme.art()}</div>`}
				${this.#identity(data)}
				<div class="sfh-slot sfh-col" data-slot="aside">
					${this.#vitals(data)}
					${this.#effects(data)}
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

"""

IDENTITY = """		#identity(d) {
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

"""

VITALS = """		#vitals(d) {
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
		#effects(d) {
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

"""

DEFENSES = """		#defenses(d) {
			const cells = d.defenses.map((s) => s.action
				? `<button type="button" class="sfh-cell sfh-click" data-sfh="${s.action}"><span class="sfh-label">${L(s.label)}</span><span class="sfh-v">${esc(s.value)}</span></button>`
				: `<div class="sfh-cell ${s.primary ? 'is-primary' : ''}"><span class="sfh-label">${L(s.label)}</span><span class="sfh-v">${esc(s.value)}</span></div>`).join('');
			return `<section class="sfh-panel sfh-defenses"><div class="sfh-cells">${cells}</div></section>`;
		}

"""

NAV = """		#nav() {
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

"""

DETAILS = """		#details(d) {
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

"""

s = s.replace(cut('			frame.innerHTML = `', '			return frame;'), FRAME)
s = s.replace(cut('		#identity(d) {', '		#bar() {'), IDENTITY)
s = s.replace(cut('		#bar() {', '		#vitals(d) {'), '')
s = s.replace(cut('		#vitals(d) {', '		#defenses(d) {'), VITALS)
s = s.replace(cut('		#defenses(d) {', '		#nav() {'), DEFENSES)
s = s.replace(cut('		#nav() {', '		/* ---------- tab bodies ---------- */'), NAV)
s = s.replace(cut('		#details(d) {', '		#inventory(d) {'), DETAILS)

# Condition picker, and temp HP from the chip.
s = s.replace("""			root.addEventListener('click', this.#onClick.bind(this));""",
"""			root.addEventListener('click', this.#onClick.bind(this));
			root.addEventListener('change', (event) => {
				const select = event.target.closest('[data-sfh-select="status"]');
				if (select?.value) adapter.act(this.actor, 'toggle-status', { key: select.value });
			});""")
s = s.replace("""				case 'hp': return adapter.act(this.actor, 'adjust-hp', { delta });""",
"""				case 'hp': return adapter.act(this.actor, 'adjust-hp', { delta });
				case 'temp': return adapter.act(this.actor, 'adjust-temp', { delta: 5 });""")

p.write_text(s, encoding='utf-8')
print('patched hud-app.mjs')
