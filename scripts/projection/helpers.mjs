/**
 * Markup helpers, taken from the mock-up (design/4-slots.js).
 *
 * The projection is built as strings, exactly as the mock-up builds it, so the markup the
 * design was signed off against is the markup that ships. Behavior is attached by one
 * delegated listener reading `data-act`, not by wiring each button.
 */

export const esc = (s) =>
	String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

export const sgn = (n) => (n >= 0 ? '+' : '') + n;

export const pct = (v, m) => Math.max(0, Math.min(100, m ? (v / m) * 100 : 0));

export const lbl = (t) => `<span class="lbl">${esc(t)}</span>`;

export const bar = (v, m, cls = '') => `<div class="barx ${cls}"><i style="width:${pct(v, m)}%"></i></div>`;

/** A roll button. `act` says what the adapter should do; `k` is what to do it to. */
export const actBtn = (text, act, k, { cls = '', extra = '', title = '', disabled = false } = {}) =>
	`<button type="button" class="b ${cls} ${extra}" data-act="${esc(act)}" data-k="${esc(k)}"${
		title ? ` data-tooltip="${esc(title)}"` : ''
	}${disabled ? ' disabled' : ''}>${esc(text)}</button>`;

export const rollBtn = (text, act, k, extra = '') => actBtn(text, act, k, { cls: 'roll', extra });

/** Marks an element as something the readout panel can describe. */
export const ro = (key) => `data-ro="${esc(key)}"`;

/** A name that opens its entry in the readout. */
export const nameBtn = (name, key) =>
	`<button type="button" class="nm" ${ro(key)} data-act="read" data-k="${esc(key)}"${/^(item|effect):/.test(key) ? ' draggable="true"' : ''}>${esc(name)}</button>`;

export const COST_GLYPH = { 1: '◆', 2: '◆◆', 3: '◆◆◆', R: '⟲', F: '◇', A: 'A', B: 'BA' };

/** Absolute placement inside the 1280-wide board the mock-up was drawn on. */
export const pos = ([x, y, w, h]) => `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
