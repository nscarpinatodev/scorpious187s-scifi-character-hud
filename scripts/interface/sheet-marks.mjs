import { MOD, S } from '../constants.mjs';
import { RARITIES, rarityOf, unprepared } from '../adapters/dnd5e.mjs';

/**
 * D&D 5e's own sheets, marked as the projection is: an item named in the color of its rarity, and
 * a character's unprepared spells grayed.
 *
 * The system's sheets say neither on a row. Each time a sheet is drawn, every item's row on it
 * (in its lists, and among a character's favorites) is given its rarity and whether it is a spell
 * waiting to be prepared, as attributes; styles/sheet-marks.css does the rest. Nothing of the
 * system's own markup is changed, and switching a setting off takes the attributes away again.
 *
 * Rarity goes on every actor sheet: a character's, an NPC's, a vehicle's. Graying is for a
 * character alone: an NPC's spells are its stat block's, prepared or not.
 */

const SHEETS = '.dnd5e2.sheet.actor';
const ROWS = 'li.item[data-item-id], li[data-favorite-id][data-item-id]';

/** A setting that is on unless it has been switched off. */
const wanted = (key) => {
	try { return game.settings.get(MOD, key) !== false; } catch { return true; }
};

const flag = (row, name, value) => {
	if (value === null) delete row.dataset[name];
	else if (row.dataset[name] !== value) row.dataset[name] = value;
};

/** A sheet has been drawn, or one of its parts redrawn: mark its rows. */
export function markSheet(app) {
	const element = app?.element;
	if (game.system?.id !== 'dnd5e' || !element?.matches?.(SHEETS)) return;
	const actor = app.actor ?? app.document;
	const colors = wanted(S.rarityColors);
	const gray = wanted(S.grayUnprepared);
	for (const row of element.querySelectorAll(ROWS)) {
		const item = actor?.items?.get?.(row.dataset.itemId);
		const rarity = colors && item ? rarityOf(item) : '';
		flag(row, 'sfhRarity', RARITIES.includes(rarity) ? rarity.toLowerCase() : null);
		flag(row, 'sfhUnprepared', gray && item && unprepared(actor, item) ? '' : null);
	}
}

/** A setting has changed: every open sheet follows. */
export function applySheetMarks() {
	if (game.system?.id !== 'dnd5e') return;
	for (const element of document.querySelectorAll(SHEETS)) {
		const app = globalThis.foundry?.applications?.instances?.get(element.id);
		if (app) markSheet(app);
	}
}
