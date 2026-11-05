import { MOD } from '../constants.mjs';

/**
 * Everyone's volume, for the GM, from the Playlists tab: a button under Foundry's own volume
 * sliders asks every connected player what theirs are set to, and lists the answers.
 *
 * A player's volumes are their own client settings, kept in their browser, so the GM's Foundry
 * cannot read them: each player's answers over the module's socket. Each answer also says whether
 * that player has muted Foundry, and whether their browser is still holding sound back until they
 * click somewhere, which is the usual reason someone hears nothing. Nothing is shown until the
 * button is pressed, and pressing it again puts the list away.
 */

/** Foundry's three channels: what the panel calls each, and the setting it is kept in. */
const CHANNELS = [
	['music', 'globalPlaylistVolume', 'AUDIO.CHANNELS.MUSIC.label'],
	['environment', 'globalAmbientVolume', 'AUDIO.CHANNELS.ENVIRONMENT.label'],
	['interface', 'globalInterfaceVolume', 'AUDIO.CHANNELS.INTERFACE.label'],
];

/** How long to wait for answers before showing who did not answer. */
const WAIT = 1500;

const channel = `module.${MOD}`;
const asking = new Map();
let shown = null;
let busy = false;

/** This client's own volumes, as its sliders show them, and what may be keeping it quiet. */
export function myVolumes() {
	const levels = {};
	for (const [key, setting] of CHANNELS) {
		try {
			levels[key] = Number(game.settings.get('core', setting));
		} catch {
			levels[key] = null;
		}
	}
	return { userId: game.user.id, ...levels, muted: !!game.audio?.globalMute, locked: !!game.audio?.locked };
}

/** The module's socket messages for this: a GM asking, and a player answering that GM. */
export function onVolumeMessage(data) {
	if (data?.type === 'volumeAsk') {
		game.socket.emit(channel, { type: 'volumeAnswer', ask: data.ask, to: data.from, answer: myVolumes() });
		return true;
	}
	if (data?.type === 'volumeAnswer' && data.to === game.user.id) {
		asking.get(data.ask)?.(data.answer);
		return true;
	}
	return false;
}

/** Ask everyone connected, and wait until they have all answered or the time is up. */
export async function askVolumes(wait = WAIT) {
	const others = game.users.filter((u) => u.active && u.id !== game.user.id);
	const answers = new Map([[game.user.id, myVolumes()]]);
	if (!others.length) return answers;
	const ask = foundry.utils.randomID();
	await new Promise((resolve) => {
		const timer = setTimeout(resolve, wait);
		asking.set(ask, (answer) => {
			if (!others.some((u) => u.id === answer?.userId)) return;
			answers.set(answer.userId, answer);
			if (others.every((u) => answers.has(u.id))) {
				clearTimeout(timer);
				resolve();
			}
		});
		game.socket.emit(channel, { type: 'volumeAsk', ask, from: game.user.id });
	});
	asking.delete(ask);
	return answers;
}

/** A level as the player's own slider shows it. */
function percent(volume) {
	if (volume == null || Number.isNaN(volume)) return '—';
	const { volumeToInput, volumeToPercentage } = foundry.audio?.AudioHelper ?? {};
	return volumeToInput && volumeToPercentage ? volumeToPercentage(volumeToInput(volume)) : `${Math.round(volume * 100)}%`;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/** The list: one block a person, their three levels, and anything keeping them quiet. */
function panel(answers) {
	const l = (key) => game.i18n.localize(key);
	const rows = game.users.filter((u) => u.active).map((user) => {
		const a = answers.get(user.id);
		const color = esc(user.color?.css ?? user.color ?? '#888');
		if (!a) {
			return `<li class="sfh-vol-who off"><div class="sfh-vol-name"><i class="sfh-vol-dot" style="--pip:${color}"></i>${esc(user.name)}</div>
				<div class="sfh-vol-note bad">${esc(l('SFH.Volume.NoAnswer'))}</div></li>`;
		}
		const levels = CHANNELS.map(([key, , label]) => `<span class="${a[key] === 0 ? 'bad' : ''}"><b>${esc(l(label))}</b> ${esc(percent(a[key]))}</span>`).join('');
		const notes = [a.muted ? l('SFH.Volume.Muted') : '', a.locked ? l('SFH.Volume.Locked') : ''].filter(Boolean);
		return `<li class="sfh-vol-who"><div class="sfh-vol-name"><i class="sfh-vol-dot" style="--pip:${color}"></i>${esc(user.name)}</div>
			<div class="sfh-vol-levels">${levels}</div>
			${notes.length ? `<div class="sfh-vol-note bad">${esc(notes.join(' · '))}</div>` : ''}</li>`;
	}).join('');
	return `<div class="sfh-volumes" aria-live="polite"><ol class="plain">${rows}</ol></div>`;
}

/** Put the button, and the list if it is out, under the Playlists tab's volume sliders. */
export function addVolumeCheck(html) {
	if (!game.user.isGM) return;
	const root = html instanceof HTMLElement ? html : html?.[0];
	const wrapper = root?.querySelector('.global-volume .wrapper');
	if (!wrapper || wrapper.querySelector('.sfh-vol-check')) return;
	const l = (key) => game.i18n.localize(key);
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'sfh-vol-check';
	button.dataset.tooltip = l('SFH.Volume.Hint');
	button.innerHTML = `<i class="fa-solid fa-users" inert></i> <span>${esc(l(shown ? 'SFH.Volume.Hide' : 'SFH.Volume.Show'))}</span>`;
	wrapper.append(button);
	if (shown) wrapper.insertAdjacentHTML('beforeend', panel(shown));
	button.addEventListener('click', async (event) => {
		event.preventDefault();
		event.stopPropagation();
		if (busy) return;
		if (shown) {
			shown = null;
			wrapper.querySelector('.sfh-volumes')?.remove();
			button.querySelector('span').textContent = l('SFH.Volume.Show');
			return;
		}
		busy = true;
		button.disabled = true;
		button.querySelector('span').textContent = l('SFH.Volume.Asking');
		try {
			shown = await askVolumes();
		} finally {
			busy = false;
		}
		// the tab may have been drawn again while waiting; the new one shows it as it is drawn
		if (!button.isConnected) return;
		button.disabled = false;
		button.querySelector('span').textContent = l('SFH.Volume.Hide');
		wrapper.querySelector('.sfh-volumes')?.remove();
		wrapper.insertAdjacentHTML('beforeend', panel(shown));
	});
}
