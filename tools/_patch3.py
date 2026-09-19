"""Make the combat HUD actually reachable, and let HP be typed."""
import json
import pathlib

root = pathlib.Path(__file__).resolve().parents[1]


def sub(rel, a, b, n=1):
    p = root / rel
    s = p.read_text(encoding='utf-8')
    assert s.count(a) == n, (rel, a[:70], s.count(a))
    p.write_text(s.replace(a, b), encoding='utf-8')


# 1. The combat HUD's stylesheet was missing from the self-heal list, so on a world that
#    has not been relaunched it rendered unstyled.
sub('scripts/module.mjs', """	'styles/hud-sheet.css',""", """	'styles/hud-sheet.css',\n	'styles/combat-hud.css',""")

# 2. Fall back to a character the user owns, so a GM with no assigned character and no
#    token selected still gets a HUD instead of nothing at all.
sub('scripts/combat-hud.mjs', """/** Your own character when nothing is selected, so the HUD is there out of combat too. */
function defaultActor() {
	return canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
}""",
"""/**
 * Which actor the bar follows: the controlled token, else your assigned character, else
 * the first character you own. Without that last step a GM with neither sees nothing and
 * has no way to tell the HUD is working.
 */
function defaultActor() {
	const controlled = canvas.tokens?.controlled?.[0]?.actor;
	if (controlled?.isOwner) return controlled;
	if (game.user?.character?.isOwner) return game.user.character;
	if (forced && game.actors?.get(forced)?.isOwner) return game.actors.get(forced);
	return game.actors?.find((a) => a.type === 'character' && a.isOwner) ?? null;
}

/** An actor pinned through the API or the scene-control button. */
let forced = null;

export function showFor(actorOrId) {
	const actor = actorOrId?.id ? actorOrId : game.actors?.get(actorOrId);
	forced = actor?.id ?? null;
	show(actor ?? defaultActor());
}

/** Why is there no bar? Answers it without reading the source. */
export function hudDebug() {
	const el = document.getElementById(ROOT_ID);
	const info = {
		enabled: setting(S.combatHud),
		element: !!el,
		empty: el?.dataset.empty,
		hiddenByKeybind: isHidden(),
		actor: current?.name ?? null,
		controlledTokens: canvas.tokens?.controlled?.length ?? 0,
		assignedCharacter: game.user?.character?.name ?? null,
		ownedCharacters: game.actors?.filter((a) => a.type === 'character' && a.isOwner).length ?? 0,
		styleLinked: !!document.querySelector('link[href*="combat-hud.css"]'),
		adapter: !!adapter,
	};
	console.log(`${MOD} | combat HUD`, info);
	return info;
}""")

# 3. Typing HP and temp HP directly, which the bar could not do.
sub('scripts/combat-hud.mjs', """			<div class="sfh-chud-hp">
				<button type="button" class="sfh-chud-mini" data-chud="hp" data-delta="-1" aria-label="−1 HP">−</button>
				<div class="sfh-chud-hpbar"><i style="width:${d.hp.pct}%"></i><span>${d.hp.value} / ${d.hp.max}${d.hp.temp ? ` +${d.hp.temp}` : ''}</span></div>
				<button type="button" class="sfh-chud-mini" data-chud="hp" data-delta="1" aria-label="+1 HP">+</button>
			</div>""",
"""			<div class="sfh-chud-hp">
				<button type="button" class="sfh-chud-mini" data-chud="hp" data-delta="-1" aria-label="−1 HP">−</button>
				<div class="sfh-chud-hpbar">
					<i style="width:${d.hp.pct}%"></i>
					<span>
						<input type="number" class="sfh-chud-hpinput" value="${d.hp.value}" data-chud-field="hp" aria-label="${game.i18n.localize('SFH.Stat.HP')}">
						<em>/ ${d.hp.max}</em>
					</span>
				</div>
				<button type="button" class="sfh-chud-mini" data-chud="hp" data-delta="1" aria-label="+1 HP">+</button>
				<label class="sfh-chud-temp" data-tooltip="${game.i18n.localize('SFH.Stat.Temp')}">
					<span>${game.i18n.localize('SFH.Stat.Temp')}</span>
					<input type="number" value="${d.hp.temp}" data-chud-field="temp" aria-label="${game.i18n.localize('SFH.Stat.Temp')}">
				</label>
			</div>""")

sub('scripts/combat-hud.mjs', """		el.addEventListener('click', onClick);
		el.addEventListener('pointerover', onHover);""",
"""		el.addEventListener('click', onClick);
		el.addEventListener('pointerover', onHover);
		el.addEventListener('change', onFieldChange);
		el.addEventListener('keydown', (event) => {
			if (event.key === 'Enter' && event.target.matches('[data-chud-field]')) event.target.blur();
		});""")

sub('scripts/combat-hud.mjs', """/** Foundry's own tooltip carries the description, as Argon does. */""",
"""/** Typed HP and temporary HP, committed on change or Enter. */
async function onFieldChange(event) {
	const field = event.target.closest('[data-chud-field]');
	if (!field || !current) return;
	const value = Number(field.value);
	if (!Number.isFinite(value)) return render();
	await adapter.act(current, field.dataset.chudField === 'temp' ? 'set-temp' : 'set-hp', { value });
}

/** Foundry's own tooltip carries the description, as Argon does. */""")

# 4. A visible way to summon it: a scene-control button.
sub('scripts/combat-hud.mjs', """	if (game.ready) show(defaultActor());
}""",
"""	Hooks.on('getSceneControlButtons', (controls) => {
		const tokens = Array.isArray(controls) ? controls.find((c) => c.name === 'token') : controls.tokens;
		const tool = {
			name: 'sfh-combat-hud',
			title: game.i18n.localize('SFH.Settings.CombatHud'),
			icon: 'fa-solid fa-display',
			button: true,
			visible: true,
			onChange: () => toggle(),
			onClick: () => toggle(),
		};
		if (Array.isArray(tokens?.tools)) tokens.tools.push(tool);
		else if (tokens?.tools) tokens.tools[tool.name] = tool;
	});

	if (game.ready) show(defaultActor());
}

/** Turn the bar on or off from the scene controls. */
async function toggle() {
	const on = !setting(S.combatHud);
	await game.settings.set(MOD, S.combatHud, on);
	if (on) show(defaultActor());
	else document.getElementById(ROOT_ID)?.remove();
	ui.notifications.info(game.i18n.localize(on ? 'SFH.Hud.On' : 'SFH.Hud.Off'));
}""")

# 5. Adapter: set exact HP and temp values.
sub('scripts/systems/dnd5e.mjs', """		case 'adjust-temp': {""",
"""		case 'set-hp': {
			const max = num(actor.system.attributes.hp.max);
			return actor.update({ 'system.attributes.hp.value': Math.clamp(num(data.value), 0, max) });
		}
		case 'set-temp':
			return actor.update({ 'system.attributes.hp.temp': Math.max(0, num(data.value)) });
		case 'adjust-temp': {""")

# 6. API surface + strings.
sub('scripts/module.mjs', """import { initCombatHud, render as renderCombatHud, hideCombatHud } from './combat-hud.mjs';""",
"""import { initCombatHud, render as renderCombatHud, hideCombatHud, showFor, hudDebug } from './combat-hud.mjs';""")
sub('scripts/module.mjs', """			refresh: refreshOpenHuds,
			register: registerHudSheet,""",
"""			refresh: refreshOpenHuds,
			register: registerHudSheet,
			showHud: showFor,
			hudDebug,""")

p = root / 'lang/en.json'
d = json.loads(p.read_text(encoding='utf-8'))
d.update({'SFH.Hud.On': 'Combat HUD on.', 'SFH.Hud.Off': 'Combat HUD off.'})
p.write_text(json.dumps(d, indent='\t', ensure_ascii=False) + '\n', encoding='utf-8')

print('patched')
