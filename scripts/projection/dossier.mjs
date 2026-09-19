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

/** @returns {{shields?: object, paragon?: number, renegade?: number}|null} */
export function readDossier(actor) {
	if (!actor) return null;
	const conversion = game.modules.get(ME_MODULE)?.active;
	const shieldModule = game.modules.get(SHIELD_MODULE)?.active;
	if (!conversion && !shieldModule) return null;

	const out = {};

	// Paragon / Renegade, as the conversion module's tracker stores them
	const paragon = actor.getFlag('world', 'paragon');
	const renegade = actor.getFlag('world', 'renegade');
	if (typeof paragon === 'number') out.paragon = paragon;
	if (typeof renegade === 'number') out.renegade = renegade;

	// Shields: whatever the shield module is keeping, else a shield item on the actor
	const shields = readShields(actor);
	if (shields) out.shields = shields;

	return Object.keys(out).length ? out : null;
}

function readShields(actor) {
	const flag = actor.getFlag(SHIELD_MODULE, 'shield') ?? actor.getFlag('world', 'shields');
	if (flag && typeof flag === 'object' && flag.max) {
		return { value: flag.value ?? 0, max: flag.max, regen: flag.regen ?? 0 };
	}
	// the conversion's Kinetic Shield is an equipment item carrying its own values
	const item = actor.items?.find((i) => /kinetic shield/i.test(i.name));
	const max = item?.getFlag(ME_MODULE, 'shieldMax') ?? item?.system?.hp?.max;
	if (!max) return null;
	return {
		value: item.getFlag(ME_MODULE, 'shieldValue') ?? item.system?.hp?.value ?? max,
		max,
		regen: item.getFlag(ME_MODULE, 'shieldRegen') ?? 0,
	};
}
