import { MOD, S } from '../constants.mjs';
import { setting } from '../settings.mjs';

/**
 * The sidebar's Scenes tab: clicking a scene views it, as the scene bar does, instead of opening
 * its configuration. Shift+click does the other one, so the configuration is still a click away,
 * and the setting can put Foundry's way back. The right-click menu is Foundry's own and keeps
 * both. Popped-out Scenes tabs are the same application, so they follow too.
 *
 * Foundry's directory routes every click on an entry through `_onClickEntry`; the Scenes tab
 * inherits it, so giving the Scenes tab its own changes no other directory.
 */
export function viewScenesOnClick() {
	const SceneDirectory = foundry.applications?.sidebar?.tabs?.SceneDirectory;
	if (!SceneDirectory?.prototype?._onClickEntry) {
		console.warn(`${MOD} | the Scenes tab has no entry click to change; a click still opens a scene's configuration`);
		return false;
	}
	const configure = SceneDirectory.prototype._onClickEntry;
	SceneDirectory.prototype._onClickEntry = async function (event, target, options) {
		const view = (setting(S.sceneClick) !== 'configure') !== !!event?.shiftKey;
		if (!view) return configure.call(this, event, target, options);
		event?.preventDefault?.();
		const id = target?.closest?.('[data-entry-id]')?.dataset.entryId;
		const scene = id ? this.collection.get(id) ?? await this.collection.getDocument?.(id) : null;
		return scene?.view();
	};
	return true;
}
