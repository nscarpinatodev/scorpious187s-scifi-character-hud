import { MOD, S } from '../constants.mjs';
import { setting } from '../settings.mjs';
import { applyShell, playSequence } from '../shell.mjs';
import { unmountExtras } from '../me-extras.mjs';

/**
 * PF2e / SF2e adapter.
 *
 * Both systems ship the same character sheet class, an ApplicationV1 `ActorSheet` whose
 * behaviour is bound to elements by CSS selector. We subclass it and add exactly one
 * thing — the shell — after the system has finished rendering and binding. The system's
 * data preparation, listeners, drag-drop and tab handling are untouched.
 */

/** Find the system's own character sheet class through the sheet registry. */
export function findBaseSheet() {
	const entries = Object.values(CONFIG.Actor.sheetClasses?.character ?? {});
	const match = entries.find((e) => e.cls?.name === 'CharacterSheetPF2e')
		?? entries.find((e) => e.default && e.id?.startsWith(`${game.system.id}.`));
	return match?.cls ?? null;
}

export function makePf2eHudSheet(Base) {
	return class SciFiHudCharacterSheet extends Base {
		/** Marks our sheets for the settings refresh and the hide keybinding. */
		static SFH_HUD = true;

		static get defaultOptions() {
			const options = super.defaultOptions;
			options.classes = [...options.classes, 'sfh-sheet'];
			options.width = Math.max(options.width ?? 750, 1080);
			options.height = Math.max(options.height ?? 750, 760);
			options.resizable = true;
			return options;
		}

		/** @override — the system renders as usual, then we restructure what it drew. */
		activateListeners($html) {
			super.activateListeners($html);
			const form = $html instanceof HTMLElement ? $html : $html?.[0];
			if (!form) return;
			try {
				applyShell(this, form);
			} catch (err) {
				// A broken shell must never cost someone their character sheet.
				console.error(`${MOD} | shell failed, leaving the standard sheet in place`, err);
				form.classList.add('sfh-failed');
				ui.notifications.error(game.i18n.localize('SFH.ShellFailed'));
			}
		}

		/** @override — optionally play the shutdown before the window goes. */
		async close(options = {}) {
			const root = this.element instanceof HTMLElement ? this.element : this.element?.[0];
			const frame = root?.querySelector('.sfh-frame');
			if (frame && setting(S.closeSequence) && !options.sfhSkipSequence) {
				await playSequence(frame, 'off');
			}
			this._sfhResize?.disconnect();
			this._sfhResize = null;
			unmountExtras(this);
			return super.close(options);
		}
	};
}
