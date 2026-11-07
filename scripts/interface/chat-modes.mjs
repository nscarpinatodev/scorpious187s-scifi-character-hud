/**
 * Who a chat message is for, said on the message.
 *
 * Foundry marks a whisper with a faint "To:" line and a tint, and a blind roll with a tint alone;
 * dressed as the device's panels, those are easy to miss. So each private message says what it
 * is in so many words: a private GM roll, a blind roll, a self roll, or a whisper and between whom.
 */

const loc = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key));
const userName = (id) => game.users?.get(id)?.name ?? '';

/**
 * What a message is, for whoever is looking: null for one the whole table sees.
 * @returns {{kind: 'blind'|'private'|'self'|'whisper', icon: string, label: string}|null}
 */
export function messageMode(message) {
	const whisper = [...(message?.whisper ?? [])];
	const author = message?.author?.id ?? message?.author ?? null;
	const me = game.user?.id;
	const roll = !!message?.isRoll;
	if (message?.blind) {
		return { kind: 'blind', icon: 'fa-eye-slash', label: loc(game.user?.isGM ? 'SFH.Chat.BlindGM' : 'SFH.Chat.Blind') };
	}
	if (!whisper.length) return null;
	if (whisper.length === 1 && whisper[0] === author) {
		const label = roll ? loc('SFH.Chat.SelfRoll') : loc('SFH.Chat.Self', { name: userName(author) });
		return { kind: 'self', icon: 'fa-user-lock', label: author === me ? label : `${label} · ${userName(author)}` };
	}
	// a private GM roll: whispered to every GM, by a player or by a GM
	if (roll && whisper.every((id) => game.users?.get(id)?.isGM)) {
		return { kind: 'private', icon: 'fa-lock', label: author === me ? loc('SFH.Chat.PrivateRollMine') : loc('SFH.Chat.PrivateRoll', { name: userName(author) }) };
	}
	const names = whisper.filter((id) => id !== author).map(userName).filter(Boolean).join(', ') || userName(author);
	const label = author === me ? loc('SFH.Chat.WhisperTo', { names })
		: whisper.length === 1 && whisper[0] === me ? loc('SFH.Chat.WhisperFrom', { name: userName(author) })
			: loc('SFH.Chat.WhisperBetween', { name: userName(author), names });
	return { kind: 'whisper', icon: 'fa-comment-dots', label };
}

/** The label on a message as it is drawn, in the sidebar's log, a popped-out log or a notification. */
export function markMessage(message, html) {
	const el = html instanceof HTMLElement ? html : html?.[0];
	if (!el || el.querySelector('.sfh-mode')) return;
	const mode = messageMode(message);
	if (!mode) return;
	el.classList.add('sfh-moded', `sfh-mode-${mode.kind}`);
	const tag = document.createElement('span');
	tag.className = `sfh-mode sfh-mode-${mode.kind}`;
	tag.innerHTML = `<i class="fa-solid ${mode.icon}" inert></i> `;
	tag.append(document.createTextNode(mode.label));
	const header = el.querySelector('.message-header');
	const before = header?.querySelector('.whisper-to, .flavor-text');
	if (before) before.before(tag);
	else if (header) header.append(tag);
	else el.prepend(tag);
}
