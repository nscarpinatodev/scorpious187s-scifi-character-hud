"""Add the combat HUD's data to the 5e adapter, and wire the HUD into the module."""
import json
import pathlib

root = pathlib.Path(__file__).resolve().parents[1]


def sub(rel, a, b, n=1):
    p = root / rel
    s = p.read_text(encoding='utf-8')
    assert s.count(a) == n, (rel, a[:70], s.count(a))
    p.write_text(s.replace(a, b), encoding='utf-8')


# ---------------------------------------------------------------- 5e adapter
HUD = '''
/* -------------------------------------------- */
/*  The combat HUD's view model                  */
/* -------------------------------------------- */

/** Which action-economy group an item belongs to, from its activities. */
function activationOf(item) {
	const activities = item.system?.activities;
	const first = activities?.contents?.[0] ?? (activities ? [...activities][0] : null);
	return first?.activation?.type ?? item.system?.activation?.type ?? null;
}

const GROUPS = [
	{ id: 'action', label: 'SFH.Hud.Action', types: ['action', 'attack'] },
	{ id: 'bonus', label: 'SFH.Hud.BonusAction', types: ['bonus'] },
	{ id: 'reaction', label: 'SFH.Hud.Reaction', types: ['reaction'] },
	{ id: 'free', label: 'SFH.Hud.Free', types: ['special', 'legendary', 'lair', 'crew'] },
];

export function hud(actor) {
	const sys = actor.system ?? {};
	const attrs = sys.attributes ?? {};
	const hp = attrs.hp ?? {};

	const usable = actor.items.filter((i) => activationOf(i));
	const groups = GROUPS.map((g) => ({
		id: g.id,
		label: g.label,
		items: usable.filter((i) => g.types.includes(activationOf(i))).map(itemRow),
	}));

	return {
		name: actor.name,
		img: actor.img,
		subtitle: [sys.details?.race, Object.values(actor.classes ?? {}).map((c) => `${c.name} ${c.system?.levels ?? ''}`.trim()).join(' / ')]
			.filter(Boolean).join(' · '),
		img2: actor.prototypeToken?.texture?.src,
		hp: { value: num(hp.value), max: num(hp.max), temp: num(hp.temp), pct: pct(num(hp.value), num(hp.max)) },
		ac: attrs.ac?.value ?? 10,
		speed: `${attrs.movement?.walk ?? 0} ${attrs.movement?.units ?? 'ft'}`,
		groups,
		effects: actor.effects.contents.filter((e) => !e.disabled).map((e) => ({ name: e.name, img: e.img })),
		skills: Object.entries(sys.skills ?? {}).map(([key, s]) => ({
			key, label: CONFIG.DND5E?.skills?.[key]?.label ?? key, total: sgn(num(s.total)),
		})).sort((a, b) => a.label.localeCompare(b.label)),
		saves: Object.entries(sys.abilities ?? {}).map(([key, a]) => ({
			key, label: CONFIG.DND5E?.abilities?.[key]?.label ?? key.toUpperCase(), total: sgn(num(a.save?.value ?? a.save)),
		})),
		inventory: actor.items
			.filter((i) => ['weapon', 'equipment', 'consumable', 'tool'].includes(i.type))
			.map(itemRow),
	};
}
'''

sub('scripts/systems/dnd5e.mjs', '/** The reference block beside the skills: senses, languages and proficiencies. */',
    HUD.lstrip('\n') + '\n/** The reference block beside the skills: senses, languages and proficiencies. */')

# ---------------------------------------------------------------- settings
sub('scripts/constants.mjs', "	readout: 'readout',             // client — show the readout panel",
    "	readout: 'readout',             // client — show the readout panel\n	combatHud: 'combatHud',         // client — the bottom-docked combat HUD")

sub('scripts/settings.mjs', """	game.settings.register(MOD, S.sequences, {""",
"""	game.settings.register(MOD, S.combatHud, {
		name: 'SFH.Settings.CombatHud', hint: 'SFH.Settings.CombatHudHint',
		scope: 'client', config: true, type: Boolean, default: true,
		onChange: () => Hooks.callAll('sfhRefreshCombatHud'),
	});

	game.settings.register(MOD, S.sequences, {""")

# ---------------------------------------------------------------- module wiring
sub('scripts/module.mjs', """import { makeHudSheet } from './hud-app.mjs';
import * as dnd5eSystem from './systems/dnd5e.mjs';""",
"""import { makeHudSheet } from './hud-app.mjs';
import { initCombatHud, render as renderCombatHud, hideCombatHud } from './combat-hud.mjs';
import * as dnd5eSystem from './systems/dnd5e.mjs';""")

sub('scripts/module.mjs', """	if (setting(S.scale) !== 1) document.documentElement.style.setProperty('--sfh-scale', String(setting(S.scale)));""",
"""	if (setting(S.scale) !== 1) document.documentElement.style.setProperty('--sfh-scale', String(setting(S.scale)));

	// The combat HUD: a bar over the canvas for whichever token you control.
	const entry = SYSTEMS[game.system.id];
	if (entry?.kind === 'standalone') {
		initCombatHud(entry.system);
		Hooks.on('sfhRefreshCombatHud', () => renderCombatHud());
	}""")

sub('scripts/module.mjs', """			hide: (value = true) => setHidden(value),""",
"""			hide: (value = true) => { setHidden(value); hideCombatHud(value); },""")

# The hide keybinding should take the canvas HUD with it.
sub('scripts/module.mjs', """			setHidden(!isHidden());
			if (isHidden()) ui.notifications.info(game.i18n.format('SFH.HiddenHint', { key: hideKeyLabel() }));""",
"""			setHidden(!isHidden());
			hideCombatHud(isHidden());
			if (isHidden()) ui.notifications.info(game.i18n.format('SFH.HiddenHint', { key: hideKeyLabel() }));""")

# The keybinding should work with only the canvas HUD on screen.
sub('scripts/module.mjs', """			if (!document.querySelector('.sfh-app')) {""",
"""			if (!document.querySelector('.sfh-app, #sfh-combat-hud')) {""")

# ---------------------------------------------------------------- manifest + strings
p = root / 'module.json'
m = json.loads(p.read_text(encoding='utf-8'))
if 'styles/combat-hud.css' not in m['styles']:
    m['styles'].insert(m['styles'].index('styles/hud-sheet.css') + 1, 'styles/combat-hud.css')
p.write_text(json.dumps(m, indent='\t', ensure_ascii=False) + '\n', encoding='utf-8')

p = root / 'lang/en.json'
d = json.loads(p.read_text(encoding='utf-8'))
d.update({
    'SFH.Hud.Action': 'Action',
    'SFH.Hud.BonusAction': 'Bonus',
    'SFH.Hud.Reaction': 'Reaction',
    'SFH.Hud.Free': 'Other',
    'SFH.Hud.NoActions': 'Nothing here',
    'SFH.Hud.Saves': 'Saving throws',
    'SFH.Hud.OpenSheet': 'Open the character sheet',
    'SFH.Settings.CombatHud': 'Combat HUD',
    'SFH.Settings.CombatHudHint': 'A bar across the bottom of the canvas for the token you control: portrait, hit points, the action economy, and drawers for skills, saves and inventory.',
})
p.write_text(json.dumps(d, indent='\t', ensure_ascii=False) + '\n', encoding='utf-8')

print('patched')
