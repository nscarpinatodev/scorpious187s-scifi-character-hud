import { MOD, S } from '../constants.mjs';
import { setting } from '../settings.mjs';
import { applyDockShell } from '../shell-v2.mjs';
import { playSequence } from '../shell.mjs';
import { unmountExtras } from '../me-extras.mjs';

/**
 * D&D 5e adapter (system 5.x–6.x).
 *
 * The 5e character sheet is an ApplicationV2 whose sections are declared parts. We subclass
 * it and add the HUD in `_onRender`, which runs after every render — including a single
 * part refreshing — so the dock is rebuilt whenever the system redraws.
 */

/** Find the system's own character sheet class through the sheet registry. */
export function findBase5eSheet() {
	const entries = Object.values(CONFIG.Actor.sheetClasses?.character ?? {});
	const match = entries.find((e) => e.cls?.name === 'CharacterActorSheet')
		?? entries.find((e) => e.default && e.id?.startsWith('dnd5e.'));
	return match?.cls ?? null;
}

export function makeDnd5eHudSheet(Base) {
	return class SciFiHudCharacterSheet5e extends Base {
		static SFH_HUD = true;

		/*
		 * Only `position` is declared here. ApplicationV2 merges DEFAULT_OPTIONS down the
		 * class chain, and an array like `classes` can replace the system's rather than
		 * extend it — which would strip 5e's own styling. Ours are added at render time.
		 */
		static DEFAULT_OPTIONS = {
			position: { width: 1000, height: 820 },
		};

		/** @override — the system renders its parts, then we dock the HUD around them. */
		_onRender(context, options) {
			super._onRender(context, options);
			try {
				this.element?.classList.add('sfh-sheet', 'sfh-v2');
				applyDockShell(this, this.element);
			} catch (err) {
				console.error(`${MOD} | dock failed, leaving the standard sheet in place`, err);
				this.element?.classList.add('sfh-failed');
				ui.notifications.error(game.i18n.localize('SFH.ShellFailed'));
			}
		}

		/** @override — optionally play the shutdown before the window goes. */
		async close(options = {}) {
			const content = this.element?.querySelector('.window-content');
			if (content && setting(S.closeSequence) && !options.sfhSkipSequence) {
				await playSequence(content, 'off');
			}
			this._sfhResize?.disconnect();
			this._sfhResize = null;
			unmountExtras(this);
			return super.close(options);
		}
	};
}
