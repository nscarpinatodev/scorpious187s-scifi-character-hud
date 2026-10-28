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
 * @returns {{shields?: object, paragon?: number, renegade?: number}|null}
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

	return Object.keys(out).length ? out : null;
}

function readShields(actor, { conversion, shieldModule }) {
	// whatever the shield module is keeping
	const flag = (shieldModule ? actor.getFlag(SHIELD_MODULE, 'shield') : null) ?? actor.getFlag('world', 'shields');
	if (flag && typeof flag === 'object' && flag.max) {
		return { value: flag.value ?? 0, max: flag.max, regen: flag.regen ?? 0 };
	}
	// else the conversion's Kinetic Shield, an equipment item carrying its own values
	if (!conversion) return null;
	const item = actor.items?.find((i) => /kinetic shield/i.test(i.name));
	const max = item?.getFlag(ME_MODULE, 'shieldMax') ?? item?.system?.hp?.max;
	if (!max) return null;
	return {
		value: item.getFlag(ME_MODULE, 'shieldValue') ?? item.system?.hp?.value ?? max,
		max,
		regen: item.getFlag(ME_MODULE, 'shieldRegen') ?? 0,
	};
}
