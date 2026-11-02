import * as pf2eFamily from './pf2e-family.mjs';
import * as dnd5e from './dnd5e.mjs';

/**
 * One adapter per game system. An adapter answers three questions:
 *
 *   read(actor)            what the panels show
 *   tabBody(actor, tab)    what the projection's main panel shows
 *   act(actor, action, k)  what the system should do when a button is pressed
 *
 * and may offer searchItems(text), the results of a quick search box in one of its tab bodies.
 *
 * Adding a system means adding a file here. Nothing else in the module knows or cares
 * which system is running.
 */
const ADAPTERS = [pf2eFamily, dnd5e];

export function getAdapter(systemId = game.system?.id) {
	return ADAPTERS.find((a) => a.SYSTEMS.includes(systemId)) ?? null;
}

export function supportedSystems() {
	return ADAPTERS.flatMap((a) => a.SYSTEMS);
}
