/**
 * D&D 5e: a roll's dice open inside its card.
 *
 * On its compact chat cards (an attack, a check, a save, damage: most of them, from 6.1) the
 * system shows what was rolled in a pop-up hung under the total: the card stays the size it was,
 * and the list lies over whatever is below, the next card or the foot of the chat. Here a click
 * on the total opens the list in the card instead, under the roll's row, so the card grows, the
 * cards below move down, and the chat can be scrolled to it like the rest. A second click closes
 * it, as on the system's larger cards.
 *
 * The system redraws parts of these cards after they are posted (the summary of who saved), so
 * nothing is changed in the card itself: the click is caught on its way down, the pop-up it
 * would have opened is stopped, and the list is marked open for the stylesheet
 * (styles/interface.css) to lay it in the card.
 */

let bound = false;

function onClick(event) {
	const button = event.target?.closest?.('button.dice-roll');
	const list = button?.nextElementSibling;
	if (!list?.matches?.('.roll-breakdown[popover]') || !button.closest('.message.compact')) return;
	// the button's own action is to open the pop-up
	event.preventDefault();
	if (button.disabled) return;
	if (list.matches(':popover-open')) list.hidePopover();
	const open = list.classList.toggle('sfh-open');
	button.setAttribute('aria-expanded', String(open));
}

/** Open the dice of D&D 5e's compact cards in the card. Safe to call more than once. */
export function openRollsInCard() {
	if (bound || game.system?.id !== 'dnd5e') return;
	bound = true;
	document.addEventListener('click', onClick, true);
}
