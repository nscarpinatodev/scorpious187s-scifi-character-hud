import { MOD, S } from '../constants.mjs';

/**
 * The scene controls down the left of the screen, in the devices' idiom.
 *
 * Foundry gathers those controls through the `getSceneControlButtons` hook each time it
 * prepares them, and every canvas layer contributes its own entry. Only the icons change:
 * each control keeps its name, order, tools and behavior, and anything not listed here —
 * other modules' controls among them — is left as it came. All of these are Font Awesome
 * Pro 7 icons, which Foundry ships.
 */

/** Layer controls, by name. */
export const CONTROL_ICONS = {
	tokens: 'fa-solid fa-user-astronaut',
	templates: 'fa-solid fa-radar',
	tiles: 'fa-solid fa-solar-panel',
	drawings: 'fa-solid fa-bezier-curve',
	walls: 'fa-solid fa-shield-halved',
	lighting: 'fa-solid fa-flashlight',
	sounds: 'fa-solid fa-waveform',
	regions: 'fa-solid fa-vector-square',
	// a datapad; a crosshair would read as the token layer's target tool
	notes: 'fa-solid fa-tablet-screen-button',
};

/** Tools, by control and then tool name. The rest of the tools are clear as they are. */
export const TOOL_ICONS = {
	tokens: {
		target: 'fa-solid fa-crosshairs',
		unconstrainedMovement: 'fa-solid fa-person-to-portal',
	},
	sounds: {
		sound: 'fa-solid fa-tower-broadcast',
	},
};

/* Foundry hands over records keyed by name; accept a list too, in case that ever changes. */
const entry = (group, name) => (Array.isArray(group) ? group.find((c) => c?.name === name) : group?.[name]);

/** The `getSceneControlButtons` hook. */
export function restyleControls(controls) {
	if (!game.settings.get(MOD, S.controlIcons)) return;
	for (const [name, icon] of Object.entries(CONTROL_ICONS)) {
		const control = entry(controls, name);
		if (control) control.icon = icon;
	}
	for (const [name, tools] of Object.entries(TOOL_ICONS)) {
		const control = entry(controls, name);
		for (const [tool, icon] of Object.entries(tools)) {
			const button = entry(control?.tools, tool);
			if (button) button.icon = icon;
		}
	}
}

/** Draw the controls again from scratch, so a change of setting shows without a reload. */
export function redrawControls() {
	ui.controls?.render({ reset: true });
}
