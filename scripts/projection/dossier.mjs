import { ME_MODULE } from '../constants.mjs';

/**
 * The Mass Effect dossier panel.
 *
 * Reads what the conversion module and the shield module already track, and shows nothing
 * at all when neither is present — the panel is a window onto their data, never a second
 * copy of it. The Paragon/Renegade tracker lives in the conversion module; changing a value
 * here goes through the same flags it writes.
 */

const SHIELD_MODULE = 'mass-effect-shield-automation';

const active = (id) => !!game.modules.get(id)?.active;

/**
 * @returns {{shields?: object, paragon?: number, renegade?: number, credits?: string, omniGel?: object}|null}
 *
 * Each module's data is read only while that module is active: Foundry throws on a flag
 * whose module is not running, and a world with the conversion but not the shield module
 * is an ordinary one. Whatever is not running is simply not shown.
 */
export function readDossier(actor) {
	if (!actor) return null;
	const conversion = active(ME_MODULE);
	const shieldModule = active(SHIELD_MODULE);
	if (!conversion && !shieldModule) return null;

	const out = {};

	// Paragon / Renegade, as the conversion module's tracker stores them
	if (conversion) {
		const paragon = actor.getFlag('world', 'paragon');
		const renegade = actor.getFlag('world', 'renegade');
		if (typeof paragon === 'number') out.paragon = paragon;
		if (typeof renegade === 'number') out.renegade = renegade;
	}

	const shields = readShields(actor, { conversion, shieldModule });
	if (shields) out.shields = shields;

	// the credits the character carries, as the system writes its money, and the omni-gel
	if (conversion) {
		const credits = actor.inventory?.coins?.toString?.();
		if (credits) out.credits = credits;
		const gel = [...(actor.inventory ?? [])].find((i) => i.system?.slug === 'omni-gel' || /^omni-?gel$/i.test(i.name ?? ''));
		out.omniGel = { id: gel?.id ?? null, quantity: gel ? (gel.quantity ?? gel.system?.quantity ?? 0) : 0 };
	}

	return Object.keys(out).length ? out : null;
}

/**
 * The shields, from whoever keeps them.
 *
 * The conversion keeps them as the character's temporary hit points, with the maximum and the
 * regeneration on its Kinetic Shield (an equipment item or an effect carrying `shieldMax`), and a
 * shield capacitor or a regeneration mod changing them while it is invested or installed in worn
 * armor (scripts/shield-system.js in the conversion). Without it, the shield module's flag, or the
 * world's.
 */
function readShields(actor, { conversion, shieldModule }) {
	if (conversion) {
		const fromConversion = conversionShields(actor);
		if (fromConversion) return fromConversion;
	}
	for (const [scope, key] of [[shieldModule && SHIELD_MODULE, 'shield'], ['world', 'shields']]) {
		if (!scope) continue;
		const flag = actor.getFlag(scope, key);
		if (flag && typeof flag === 'object' && flag.max) {
			return { value: flag.value ?? 0, max: flag.max, regen: flag.regen ?? 0, keeper: { scope, key } };
		}
	}
	return null;
}

const meFlags = (item) => item?.flags?.[ME_MODULE] ?? {};
const equipmentOrEffect = (item) => item.type === 'equipment' || item.type === 'effect';

/** A mod counts installed in equipped armor, or, loose, when it is invested if it has to be. */
function modApplies(item) {
	if (item.system?.usage?.value?.startsWith?.('installed')) return !!item.isEquipped;
	const needsInvest = item.system?.traits?.value?.includes('invested');
	return !needsInvest || item.system?.equipped?.invested === true;
}

function conversionShields(actor) {
	const types = actor.itemTypes ?? {};
	const shield = [...(types.equipment ?? []), ...(types.effect ?? [])].find((i) => meFlags(i).shieldMax != null);
	if (!shield) return null;
	const installed = [...(actor.inventory ?? [])].flatMap((i) => [...(i.subitems?.contents ?? i.subitems ?? [])]);
	const candidates = [...(types.equipment ?? []), ...(types.effect ?? []), ...installed];
	const mod = (key) => candidates.find((i) => meFlags(i)[key] != null && equipmentOrEffect(i) && modApplies(i));
	const max = (meFlags(shield).shieldMax ?? 0) + (meFlags(mod('shieldHpBonus')).shieldHpBonus ?? 0);
	const regen = Math.round((meFlags(shield).shieldRegen ?? 0) * (meFlags(mod('regenMult')).regenMult ?? 1));
	return { value: actor.system?.attributes?.hp?.temp ?? 0, max, regen, keeper: 'temp' };
}

/**
 * Change the shields by `delta`, between empty and full, where whoever keeps them keeps them. The
 * conversion's are temporary hit points, and lowering those reads to it as damage, which it would
 * route through the barrier and armor first: this is a change to the shields alone, so it is
 * marked the way the conversion marks its own changes to them.
 */
export async function adjustShields(actor, delta) {
	const shields = readDossier(actor)?.shields;
	if (!shields || !Number.isFinite(delta)) return;
	const value = Math.max(0, Math.min(shields.max, shields.value + delta));
	if (value === shields.value) return;
	if (shields.keeper === 'temp') {
		return actor.update({ 'system.attributes.hp.temp': value }, { [ME_MODULE]: { shieldRemoval: true } });
	}
	const { scope, key } = shields.keeper;
	return actor.setFlag(scope, key, { ...actor.getFlag(scope, key), value });
}

/** Recharge the shields by their regeneration, as the start of a turn does, up to full. */
export function regenShields(actor) {
	const shields = readDossier(actor)?.shields;
	return shields?.regen ? adjustShields(actor, shields.regen) : undefined;
}
