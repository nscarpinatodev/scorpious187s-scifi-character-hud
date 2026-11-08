import * as pf2eFamily from './pf2e-family.mjs';
import * as dnd5e from './dnd5e.mjs';
import * as d35e from './d35e.mjs';

/**
 * One adapter per game system. An adapter answers three questions:
 *
 *   read(actor)            what the panels show
 *   tabBody(actor, tab)    what the projection's main panel shows
 *   describe(doc)          optional: a document's description as HTML, if the system has its own way
 *   readoutMeta(doc)       optional: [label, value] pairs for the readout to list
 *   readoutTraits(doc)     optional: the readout's chips, if not the document's traits
 *   readoutActions(doc, actor)  optional: buttons for the readout, as markup
 *   readoutEntry(actor, key)    optional: what the readout shows for a key that is not a document
 *   describeEntry(actor, key)   optional: that entry's description as HTML
 *   readRoll(message)      optional: a chat message, as the latest-roll strip shows it
 *   searchItems(text)      optional: the Inventory tab's quick search, as markup
 *   onGiveRequest(data)    optional: the GM's side of giving an item to someone else's character
 *   setField(actor, field, value)  optional: save a typed field marked `data-field`
 *   decorate(actor, body, live)    optional: fill in what the system answers asynchronously, once a tab is drawn
 *   act(actor, action, k)  what the system should do when a button is pressed
 *
 * and may offer searchItems(text), the results of a quick search box in one of its tab bodies,
 * and readRoll(message), a chat message as the latest-roll strip shows it.
 *
 * Adding a system means adding a file here. Nothing else in the module knows or cares
 * which system is running.
 */
const ADAPTERS = [pf2eFamily, dnd5e, d35e];

export function getAdapter(systemId = game.system?.id) {
	return ADAPTERS.find((a) => a.SYSTEMS.includes(systemId)) ?? null;
}

export function supportedSystems() {
	return ADAPTERS.flatMap((a) => a.SYSTEMS);
}
