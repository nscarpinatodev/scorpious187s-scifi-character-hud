import { DeviceChrome } from '../device/chrome.mjs';

/**
 * Clear the HUD while a player is placing something on the canvas.
 *
 * A spell's area, an area-fire weapon's burst: the player has to click the map, and the
 * projection is standing on it. On Foundry 14 every system places these through
 * `canvas.regions.placeRegion` or `placeRegions`, whether it starts from a button on the
 * projection, the system's own sheet or a chat card, so that is the one place to watch. Both
 * return a promise that settles when the player confirms, skips or dismisses.
 *
 * The wrappers only watch: the arguments, the result and any error pass through untouched.
 */
export function watchPlacement() {
	// on the base class, which a system's own layer reaches through super
	const proto = foundry.canvas?.layers?.RegionLayer?.prototype;
	if (proto?.placeRegion) {
		// placeRegions calls placeRegion once per region; watching it too stops the HUD
		// flickering back between them
		for (const name of ['placeRegion', 'placeRegions']) {
			const original = proto[name];
			if (!original) continue;
			proto[name] = async function (...args) {
				const token = Symbol(name);
				DeviceChrome.suspend(token);
				try {
					return await original.apply(this, args);
				} finally {
					DeviceChrome.resume(token);
				}
			};
		}
	} else {
		// Foundry 13 has no placeRegion: templates are placed on their own canvas layer
		Hooks.on('activateTemplateLayer', () => DeviceChrome.suspend('template-layer'));
		Hooks.on('deactivateTemplateLayer', () => DeviceChrome.resume('template-layer'));
	}

	// a placement abandoned by a change of scene may never settle
	Hooks.on('canvasTearDown', () => DeviceChrome.resumeAll());
}
