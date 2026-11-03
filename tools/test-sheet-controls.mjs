/*
 * Press the Spells, Skills and Inventory controls on the real projection and check each hands
 * the system what its own sheet would: the same method, with the same arguments. The system's
 * side is replaced by recorders in the shapes read from its source.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// puppeteer lives in the sibling conversion repo; this tool is dev-only
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const dir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');

const browser = await puppeteer.launch({
	executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`file:///${dir}/harness-device.html`);
await new Promise((r) => setTimeout(r, 900));

const results = await page.evaluate(async () => {
	const out = [];
	const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail: JSON.stringify(detail) });
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const { DeviceChrome: hud, Projection, actor } = SFH;
	const calls = [];
	const record = (name, value) => { calls.push([name, value]); return value; };
	const last = () => calls[calls.length - 1];

	// what the system's side looks like, from its source
	const items = {
		sc1: { id: 'sc1', uuid: 'Actor.asha.Item.sc1', system: { slots: { slot2: { value: 0, max: 2 } } }, update: async (d) => record('entry.update', d) },
		sc3: { id: 'sc3', uuid: 'Actor.asha.Item.sc3', update: async (d) => record('entry.update', d) },
		s1: { id: 's1', system: { location: { uses: { value: 0, max: 1 } } }, update: async (d) => record('spell.update', d) },
		lore1: { id: 'lore1', update: async (d) => record('lore.update', d) },
	};
	actor.items.get = (id) => items[id] ?? null;
	actor.update = async (d) => record('actor.update', d);
	actor.system.skills = {
		acrobatics: { rank: 3 }, athletics: { rank: 2 }, computers: { rank: 2 }, diplomacy: { rank: 3 }, intimidation: { rank: 3 },
		medicine: { rank: 1 }, occultism: { rank: 2 }, piloting: { rank: 2 }, stealth: { rank: 2 }, survival: { rank: 1 },
		// a lore item writes itself into system.skills with its itemId, and no lore flag yet
		warfare: { rank: 1, itemId: 'lore1' }, orphan: { rank: 0, lore: true },
	};
	actor.skills.warfare = { label: 'Warfare Lore', mod: 8, rank: 1, roll: () => {} };
	actor.skills.orphan = { label: 'Orphan Lore', mod: 0, rank: 0, roll: () => {} };
	actor.spellcasting.collections.get('sc3').setSlotExpendedState = async (...args) => record('setSlotExpendedState', args);

	const filter = { search: { text: 'stale' }, checkboxes: {} };
	game.pf2e = { compendiumBrowser: { tabs: { equipment: {
		getFilterData: async () => filter,
		open: async (options) => record('browser.open', options),
	} } } };

	// the character sheet, with the button the system binds its Spell Preparation to
	let prepared = 0;
	const sheet = {
		id: 'CharacterSheetPF2e-Actor-asha', rendered: false,
		render() {
			setTimeout(() => {
				const el = document.createElement('div');
				el.id = this.id;
				el.innerHTML = '<li data-item-id="sc3" data-container-id="sc3"><button data-action="open-spell-preparation"></button></li>';
				el.querySelector('button').addEventListener('click', () => { prepared += 1; });
				document.body.append(el);
				this.rendered = true;
				sheet.visibleWhileDrawn = getComputedStyle(el).visibility;
			}, 40);
			return this;
		},
		async close() { document.getElementById(this.id)?.remove(); this.rendered = false; },
	};
	actor.sheet = sheet;
	globalThis.foundry.applications = { instances: new Map() };

	hud.setPower(true, { silent: true });
	await wait(300);
	const stage = () => document.querySelector('#sfh-projection');
	const tab = async (id) => { stage().querySelector(`[data-act="tab"][data-k="${id}"]`).click(); await wait(120); };
	const press = async (selector) => {
		const el = stage().querySelector(selector);
		if (!el) return false;
		el.click();
		await wait(60);
		return true;
	};

	/* ---- the latest roll ---- */
	{
		const damage = [];
		const strikeForRoll = {
			label: 'M-23 Eviscerator',
			damage: async (o) => damage.push(['damage', o]),
			critical: async (o) => damage.push(['critical', o]),
		};
		const flagKey = game.system.id;
		const tokenObject = { id: 'tok' };
		const messages = new Map();
		const msg = (id, extra = {}) => {
			const m = {
				id, isContentVisible: true, visible: true, isCheckRoll: true, actor,
				rolls: [{ formula: '1d20 + 11', total: 21 }],
				flavor: '<h4 class="action"><strong>Strike</strong></h4>',
				flags: { [flagKey]: { context: { outcome: 'success', dc: { value: 18, scope: 'Attack' }, mapIncreases: 1, altUsage: null } } },
				target: { token: { object: tokenObject } },
				_strike: strikeForRoll,
				...extra,
			};
			messages.set(id, m);
			return m;
		};
		game.messages = { get: (id) => messages.get(id) };
		game.pf2e.settings = { metagame: { results: true, dcs: true } };
		const realI18n = game.i18n.localize;
		game.i18n.localize = (k) => ({ 'PF2E.Check.Result.Degree.Attack.success': 'Hit', 'PF2E.Check.Result.Degree.Attack.failure': 'Miss' }[k] ?? realI18n(k));
		const strip = () => stage().querySelector('[data-slot="latest"]');
		const main = () => stage().querySelector('[data-slot="projection"]');

		check('no roll, no strip', !strip());
		const heightWithout = parseFloat(main().style.height);
		const bottomWithout = parseFloat(main().style.top) + heightWithout;
		Projection.noteRoll(msg('m1'));
		await wait(100);
		check('a roll brings the strip', strip() && /M-23 Eviscerator/.test(strip().textContent));
		check('with its formula and total', /1d20 \+ 11/.test(strip().textContent) && strip().querySelector('.l-v').textContent === '21', strip().textContent);
		check('and its outcome and DC', /Hit vs 18/.test(strip().textContent), strip().textContent);
		check('the main panel makes room, keeping its foot', parseFloat(main().style.height) === heightWithout - 44 && parseFloat(main().style.top) + parseFloat(main().style.height) === bottomWithout);

		strip().querySelector('[data-act="latestDamage"][data-k="m1:damage"]').click();
		await wait(40);
		check('Damage rolls with what the card passes', damage.at(-1)?.[0] === 'damage' && damage.at(-1)[1].mapIncreases === 1 && damage.at(-1)[1].target === tokenObject && damage.at(-1)[1].checkContext?.dc?.value === 18, damage.at(-1)?.[1]?.mapIncreases);
		strip().querySelector('[data-act="latestDamage"][data-k="m1:critical"]').click();
		await wait(40);
		check('Critical too', damage.at(-1)?.[0] === 'critical');

		// what the system hides stays hidden
		game.pf2e.settings.metagame.results = false;
		game.pf2e.settings.metagame.dcs = false;
		Projection.noteRoll(msg('m2'));
		await wait(100);
		check('a hidden outcome and DC are not shown', !/Hit|18/.test(strip().textContent.replace('M-23', '').replace('1d20 + 11', '').replace('21', '')), strip().textContent);
		game.pf2e.settings.metagame.results = true;
		game.pf2e.settings.metagame.dcs = true;
		const before = strip().textContent;
		Projection.noteRoll(msg('m3', { isContentVisible: false, rolls: [{ formula: '1d20', total: 99 }] }));
		await wait(60);
		check('a blind roll does not appear', strip().textContent === before && !/99/.test(strip().textContent));
		Projection.noteRoll(msg('m4', { visible: false, rolls: [{ formula: '1d20', total: 98 }] }));
		await wait(60);
		check('nor a whisper to someone else', !/98/.test(strip().textContent));
		Projection.noteRoll(msg('m5', { actor: { id: 'someone-else' }, rolls: [{ formula: '1d20', total: 97 }] }));
		await wait(60);
		check('nor someone else\'s roll', !/97/.test(strip().textContent));
		Projection.noteRoll(msg('m6', { rolls: [] }));
		await wait(60);
		check('nor a message with no roll', strip().textContent.includes('21'));

		// not every roll is an attack
		Projection.noteRoll(msg('m7', {
			_strike: null, isCheckRoll: false, rolls: [{ formula: '3d8 + 6', total: 19 }], flavor: '<h4 class="action"><strong>Damage Roll: Piercing</strong></h4>', flags: { [flagKey]: { context: { type: 'damage-roll' } } },
		}));
		await wait(100);
		check('a damage roll shows, named by its card', /Damage Roll: Piercing/.test(strip().textContent) && strip().querySelector('.l-v').textContent === '19', strip().textContent);
		check('with nothing to follow up', !strip().querySelector('[data-act="latestDamage"]'));
		Projection.noteRoll(msg('m8', { flags: {}, flavor: '', _strike: null, isCheckRoll: false, rolls: [{ formula: '1d6', total: 4 }] }));
		await wait(100);
		check('a bare roll still has a name', /Roll/.test(strip().querySelector('.l-n').textContent), strip().textContent);

		// the whole thing fits, on every device and with a long name
		Projection.noteRoll(msg('m9', { _strike: { ...strikeForRoll, label: 'A Very Long Named Weapon Of Considerable Length And Grandeur' }, rolls: [{ formula: '1d20 + 11 + 2 + 1 + 3 - 2', total: 21 }] }));
		for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal', 'vambrace']) {
			game.settings.set(null, 'device', device);
			// the device change redraws and refits; measure once that has settled
			await wait(450);
			const box = strip().getBoundingClientRect();
			const inside = [...strip().children].every((el) => { const r = el.getBoundingClientRect(); return !r.width || r.left >= box.left - 0.5 && r.right <= box.right + 0.5 && r.top >= box.top - 0.5 && r.bottom <= box.bottom + 0.5; });
			const outside = [...strip().children].filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.left < box.left - 0.5 || r.right > box.right + 0.5 || r.top < box.top - 0.5 || r.bottom > box.bottom + 0.5); }).map((el) => [el.className, Math.round(el.getBoundingClientRect().left), Math.round(el.getBoundingClientRect().right), Math.round(box.left), Math.round(box.right)]);
			const gone = main().getBoundingClientRect();
			check(`${device}: the strip holds everything`, inside && strip().scrollWidth <= strip().clientWidth + 1, outside);
			check(`${device}: it clears the main panel`, gone.top >= box.bottom, [gone.top, box.bottom]);
		}
		game.settings.set(null, 'device', 'omni');
		await wait(150);

		const logs = [];
		ui.chat = { activate: () => logs.push('activate') };
		ui.sidebar = { expand: () => logs.push('expand') };
		strip().querySelector('[data-act="chatLog"]').click();
		await wait(30);
		check('Log opens the chat', logs.join() === 'activate,expand', logs);

		Projection.forgetRoll({ id: 'm1' });
		await wait(60);
		check('deleting an older message changes nothing', !!strip());
		Projection.forgetRoll({ id: 'm9' });
		await wait(100);
		check('deleting the shown one clears it', !strip());
		check('and the main panel takes its room back', parseFloat(main().style.height) === heightWithout);
		Projection.noteRoll(msg('m10'));
		await wait(100);
		strip().querySelector('[data-act="latestClear"]').click();
		await wait(100);
		check('× dismisses it', !strip() && parseFloat(main().style.height) === heightWithout);
		game.i18n.localize = realI18n;
	}

	/* ---- the readout ---- */
	{
		const long = `<p>${'A long description of how this works. '.repeat(120)}</p>`;
		items.long = { id: 'long', name: 'Long Item', type: 'feat', system: { description: { value: long }, traits: { value: [] } } };
		items.other = { id: 'other', name: 'Other Item', type: 'feat', system: { description: { value: '<p>Short.</p>' }, traits: { value: [] } } };
		actor.effects = { get: () => null };
		// what Foundry's enricher makes of a document link
		const enriched = [];
		foundry.applications ??= {};
		foundry.applications.ux = { TextEditor: { implementation: { enrichHTML: async (text, options) => {
			enriched.push(options);
			return text.replace(/@UUID\[([^\]]+)\]\{([^}]+)\}/g, '<a class="content-link" data-link data-uuid="$1">$2</a>');
		} } } };
		const readout = () => stage().querySelector('#sfh-readout');
		const slot = () => stage().querySelector('[data-slot="readout"]');
		const over = (el) => el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		const probe = (key) => {
			const el = document.createElement('button');
			el.dataset.ro = key;
			stage().querySelector('.proj-b').append(el);
			return el;
		};
		await tab('feats');
		const a = probe('item:long');
		const b = probe('item:other');
		const plain = stage().querySelector('.proj-h');

		over(a);
		await wait(200);
		check('hovering shows an item in the readout', /Long Item/.test(readout().textContent));
		check('the whole description is there', readout().textContent.length > 4000, readout().textContent.length);
		check('and a long one can scroll', readout().scrollHeight > readout().clientHeight && getComputedStyle(readout()).overflowY === 'auto', [readout().scrollHeight, readout().clientHeight]);

		over(plain);
		await wait(200);
		check('moving off it keeps it showing', /Long Item/.test(readout().textContent));
		over(slot());
		await wait(200);
		readout().scrollTop = 300;
		check('it scrolls under the pointer', readout().scrollTop === 300, readout().scrollTop);
		over(readout().querySelector('p'));
		await wait(200);
		check('and holds still while being read', /Long Item/.test(readout().textContent) && readout().scrollTop === 300);

		over(b);
		over(slot());
		await wait(200);
		check('crossing another row on the way does not swap it', /Long Item/.test(readout().textContent));
		over(b);
		await wait(200);
		check('settling on another row does', /Other Item/.test(readout().textContent));
		check('and it starts from the top', readout().scrollTop === 0);
		over(a);
		await wait(200);
		stage().dispatchEvent(new MouseEvent('mouseleave'));
		Projection.element.dispatchEvent(new MouseEvent('mouseleave'));
		await wait(50);
		check('leaving the projection keeps it too', /Long Item/.test(readout().textContent));

		// it never goes back to something it showed earlier
		const named = document.createElement('button');
		named.dataset.act = 'read';
		named.dataset.k = 'item:other';
		named.dataset.ro = 'item:other';
		stage().querySelector('.proj-b').append(named);
		named.click();
		await wait(30);
		check('clicking a name shows it', /Other Item/.test(readout().textContent));
		over(a);
		await wait(200);
		check('hovering something else shows that', /Long Item/.test(readout().textContent));
		over(plain);
		await wait(200);
		check('moving off does not go back to what was clicked', /Long Item/.test(readout().textContent));
		const pageTab = stage().querySelector('[data-act="tab"]:not([data-k="feats"])');
		over(pageTab);
		await wait(200);
		check('nor does reaching for a page tab', /Long Item/.test(readout().textContent));
		await tab(pageTab.dataset.k);
		check('and it stays through the change of page', /Long Item/.test(readout().textContent));
		await tab('feats');
		const keyed = probe('item:other');
		keyed.focus();
		await wait(30);
		check('the keyboard can point at things too', /Other Item/.test(readout().textContent));
		keyed.blur();

		// descriptions, as the system renders them
		const link = '<a class="content-link" data-link data-uuid="Compendium.sf2e.feat-effects.Item.8eqdNadBEcXMdnhQ"><i class="fa-solid fa-suitcase"></i>Effect: Watch Out</a>';
		const asked = [];
		items.watch = {
			id: 'watch', name: 'Watch Out', type: 'feat', isOwner: false,
			system: { description: { value: '<p>raw @UUID[Compendium.sf2e.feat-effects.Item.8eqdNadBEcXMdnhQ]{Effect: Watch Out}</p>' }, traits: { value: ['concentrate', 'envoy'] } },
			getDescription: async (options) => { asked.push(options); return { value: `<p><strong>Trigger</strong> A creature targets an ally.</p><p>${link}</p>` }; },
		};
		const watch = probe('item:watch');
		over(watch);
		await wait(200);
		const text = () => readout().querySelector('.ro-text');
		check('a description comes through the system', asked.length >= 1);
		check('asking for secrets only for an owner', asked.at(-1)?.secrets === false, asked.at(-1));
		check('no raw enricher tags', !/@UUID|Compendium\./.test(readout().textContent), readout().textContent);
		check('its link is a real one', text().querySelector('a.content-link[data-uuid]')?.textContent === 'Effect: Watch Out');
		check('and its paragraphs and bold survive', text().querySelectorAll('p').length === 2 && !!text().querySelector('strong'));
		const flat = () => readout().scrollWidth <= readout().clientWidth;
		check('nothing widens the panel', flat(), [readout().scrollWidth, readout().clientWidth]);

		items.wide = { id: 'wide', name: 'x'.repeat(120), type: 'feat', system: { description: { value: `<p>@UUID[${'y'.repeat(300)}]{${'z'.repeat(300)}} ${'q'.repeat(300)}</p>` }, traits: { value: [] } } };
		over(probe('item:wide'));
		await wait(200);
		check('not even an unbroken run of text', flat() && getComputedStyle(readout()).overflowX === 'hidden', [readout().scrollWidth, readout().clientWidth]);
		check('without a system\'s own, the enricher gets the document', enriched.at(-1)?.relativeTo === items.wide);

		// a slow one must not replace a newer one
		let release;
		items.slow = { id: 'slow', name: 'Slow Item', type: 'feat', system: { traits: { value: [] } }, getDescription: () => new Promise((r) => { release = () => r({ value: '<p>Slow text.</p>' }); }) };
		over(probe('item:slow'));
		await wait(200);
		over(watch);
		await wait(200);
		release();
		await wait(30);
		check('an older description cannot replace a newer one', /Watch Out/.test(readout().textContent) && !/Slow text/.test(readout().textContent));

		// a re-render keeps it, without a blink and in the same place
		items.watch.getDescription = async () => ({ value: `<p>${'A long line of description. '.repeat(120)}</p><p>${link}</p>` });
		over(probe('item:other'));
		await wait(200);
		over(watch);
		await wait(200);
		readout().scrollTop = 120;
		Projection.render();
		check('a re-render keeps the text at once', /A long line/.test(readout().textContent));
		await wait(60);
		check('and the place being read', readout().scrollTop === 120, readout().scrollTop);

		// one that fails says so
		const realError = console.error;
		console.error = () => {};
		items.bad = { id: 'bad', name: 'Bad Item', type: 'feat', system: { traits: { value: [] } }, getDescription: async () => { throw new Error('no'); } };
		over(probe('item:bad'));
		await wait(200);
		console.error = realError;
		check('one that cannot be read says so', /could not be read/.test(readout().textContent) && /Bad Item/.test(readout().textContent));
		over(probe('item:other'));
		await wait(200);
	}

	/* ---- the biography tab ---- */
	{
		// Foundry's editor, as far as the tab touches it: saving sends a change, then says it closed
		const wrecked = [];
		customElements.get('prose-mirror') ?? customElements.define('prose-mirror', class extends HTMLElement {
			connectedCallback() {
				if (this.ready) return;
				this.ready = true;
				this.saved = this.getAttribute('value') ?? '';
				this.typed = this.saved;
				this.removeAttribute('value');
			}
			disconnectedCallback() { if (this.hasAttribute('open')) wrecked.push(this.dataset.field); }
			get value() { return this.typed; }
			save() {
				if (this.typed !== this.saved) {
					this.saved = this.typed;
					this.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
				}
				this.removeAttribute('open');
				this.dispatchEvent(new Event('close', { bubbles: true, cancelable: true }));
			}
		});

		const bio = {
			appearance: '<p>Tall @UUID[Actor.x]{Link}</p>', backstory: '<p>Born on Mindoir.</p>', birthPlace: 'Mindoir', attitude: 'Wry', beliefs: 'Second chances', likes: 'Coffee', dislikes: 'Batarians', catchphrases: 'Not today.',
			campaignNotes: '<p>Owes Omega.</p>', allies: '<p>Vex</p>', enemies: '<p>Aria</p>', organizations: '<p>Alliance</p>',
			edicts: ['Protect the crew', 'Keep promises'], anathema: ['Abandon a squadmate'],
			visibility: { appearance: true, backstory: false, personality: true, campaign: false },
		};
		const realDetails = actor.system.details;
		const realOwner = actor.isOwner;
		const realUpdate = actor.update;
		const realSource = actor._source;
		const realEnrich = foundry.applications.ux.TextEditor.implementation.enrichHTML;
		actor.system.details = { ...realDetails, biography: bio, height: { value: '6 ft' }, weight: { value: '180 lb' } };
		actor._source = { system: { details: { biography: bio } } };
		actor.uuid = 'Actor.asha';
		actor.isOwner = true;
		const updates = [];
		actor.update = async (data) => { updates.push(data); };
		const enrichOptions = [];
		foundry.applications.ux.TextEditor.implementation.enrichHTML = async (html, options) => {
			enrichOptions.push(options);
			return (html ?? '').replace(/@UUID\[([^\]]+)\]\{([^}]+)\}/g, '<a class="content-link" data-link data-uuid="$1">$2</a>');
		};
		const body = () => stage().querySelector('.proj-b');
		const input = (field) => body().querySelector(`input[data-field="${field}"]`);
		const editor = (field) => body().querySelector(`prose-mirror[data-field="${field}"]`);
		const type = (el, value) => { el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); };
		const settle = () => wait(60);

		await tab('biography');
		await settle();
		check('every section is there', ['Appearance', 'Backstory', 'Personality', 'Campaign'].every((s) => [...body().querySelectorAll('.sec')].some((h) => h.textContent.includes(s))), body().querySelectorAll('.sec').length);
		const fields = { height: '6 ft', weight: '180 lb', birthPlace: 'Mindoir', attitude: 'Wry', beliefs: 'Second chances', likes: 'Coffee', dislikes: 'Batarians', catchphrases: 'Not today.', 'edicts.0': 'Protect the crew', 'edicts.1': 'Keep promises', 'anathema.0': 'Abandon a squadmate' };
		for (const [field, value] of Object.entries(fields)) check(`${field} shows its value`, input(field)?.value === value, input(field)?.value);
		for (const field of ['appearance', 'backstory', 'campaignNotes', 'allies', 'enemies', 'organizations']) check(`${field} has an editor`, !!editor(field));
		check('it shows links, not their tags', editor('appearance').querySelector('a.content-link')?.textContent === 'Link' && !/@UUID/.test(editor('appearance').textContent));
		check('and edits the raw text', editor('appearance').value === bio.appearance, editor('appearance').value);
		check('an owner sees secrets', enrichOptions.at(-1)?.secrets === true);

		updates.length = 0;
		type(input('likes'), 'Tea');
		await settle();
		check('typing saves through the actor', updates.at(-1)?.['system.details.biography.likes'] === 'Tea', updates.at(-1));
		type(input('height'), '2 m');
		await settle();
		check('height goes where the sheet puts it', updates.at(-1)?.['system.details.height.value'] === '2 m', updates.at(-1));
		type(input('edicts.1'), '  Never lie  ');
		await settle();
		check('a line of a list saves the whole list, trimmed', JSON.stringify(updates.at(-1)?.['system.details.biography.edicts']) === JSON.stringify(['Protect the crew', 'Never lie']), updates.at(-1));
		body().querySelector('[data-act="bioAdd"][data-k="anathema"]').click();
		await settle();
		check('add puts on an empty line', JSON.stringify(updates.at(-1)?.['system.details.biography.anathema']) === JSON.stringify(['Abandon a squadmate', '']), updates.at(-1));
		body().querySelector('[data-act="bioDelete"][data-k="edicts:0"]').click();
		await settle();
		check('delete takes the right one out', JSON.stringify(updates.at(-1)?.['system.details.biography.edicts']) === JSON.stringify(['Keep promises']), updates.at(-1));
		body().querySelector('[data-act="bioVisibility"][data-k="backstory"]').click();
		await settle();
		check('the eye flips who may read it', updates.at(-1)?.['system.details.biography.visibility.backstory'] === true, updates.at(-1));

		/* nothing is lost to a redraw */
		await settle();
		const typing = input('dislikes');
		typing.focus();
		typing.value = 'half typed';
		Projection.render();
		await settle();
		check('a redraw waits while a field is being typed in', input('dislikes') === typing && typing.value === 'half typed');
		input('beliefs').focus();
		await settle();
		check('and while moving to the next field', input('dislikes') === typing);
		input('beliefs').blur();
		await settle();
		check('then happens once they stop', input('dislikes') !== typing);

		const writing = editor('backstory');
		writing.setAttribute('open', '');
		writing.typed = '<p>New story.</p>';
		updates.length = 0;
		Projection.render();
		await settle();
		check('a redraw waits for an open editor', editor('backstory') === writing && wrecked.length === 0, wrecked);
		writing.save();
		await settle();
		check('saving it saves through the actor', updates.at(-1)?.['system.details.biography.backstory'] === '<p>New story.</p>', updates.at(-1));
		check('and the redraw comes after', editor('backstory') !== writing);

		const leaving = editor('allies');
		leaving.setAttribute('open', '');
		leaving.typed = '<p>Vex and Tali</p>';
		await tab('skills');
		check('changing page saves an open editor first', updates.at(-1)?.['system.details.biography.allies'] === '<p>Vex and Tali</p>' && wrecked.length === 0, [updates.at(-1), wrecked]);
		check('and does change page', !editor('allies'));
		await tab('biography');
		await settle();
		const closing = editor('enemies');
		closing.setAttribute('open', '');
		closing.typed = '<p>Aria and the Collectors</p>';
		await Projection.close();
		check('closing the projection saves one too', updates.at(-1)?.['system.details.biography.enemies'] === '<p>Aria and the Collectors</p>' && wrecked.length === 0, updates.at(-1));
		await Projection.open(actor);
		await tab('biography');
		await settle();

		/* an edit that fails says so */
		const failed = [];
		const realNotify = ui.notifications.error;
		const realConsole = console.error;
		ui.notifications.error = (m) => failed.push(m);
		console.error = () => {};
		actor.update = async () => { throw new Error('no'); };
		type(input('likes'), 'Nope');
		await settle();
		check('a save that fails says so', failed.length === 1, failed);
		ui.notifications.error = realNotify;
		console.error = realConsole;
		actor.update = async (data) => { updates.push(data); };

		/* it fits on every device */
		const deviceWas = document.body.dataset.sfhDevice;
		for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal', 'vambrace']) {
			game.settings.set(null, 'device', device);
			await wait(250);
			Projection.render();
			await settle();
			const box = body().getBoundingClientRect();
			const spilled = [...body().querySelectorAll('.sec, .sfh-bio, .sfh-in, .sfh-rich, .b')].filter((e) => { const r = e.getBoundingClientRect(); return r.left < box.left - 0.5 || r.right > box.right + 0.5; });
			check(`${device}: nothing runs off the side`, !spilled.length && body().scrollWidth <= body().clientWidth, spilled.map((e) => e.className));
			const short = [...body().querySelectorAll('input.sfh-in')].filter((e) => e.getBoundingClientRect().width < 60);
			check(`${device}: every field has room to type in`, !short.length, short.map((e) => e.dataset.field));
			const stacked = [...body().querySelectorAll('.sfh-bio-grid > .sfh-bio')];
			const clash = stacked.some((a, i) => stacked.slice(i + 1).some((b) => { const x = a.getBoundingClientRect(); const y = b.getBoundingClientRect(); return x.left < y.right - 0.5 && y.left < x.right - 0.5 && x.top < y.bottom - 0.5 && y.top < x.bottom - 0.5; }));
			check(`${device}: no field sits on another`, !clash);

			// an open editor as Foundry really builds it, with its real stylesheet: the last field,
			// so opening it has to bring it into view
			const opening = editor('organizations');
			// as long as Foundry's own: a format list, three more lists, and a dozen buttons
			const dropdown = (label) => `<li class="pm-dropdown"><button type="button"><span>${label}</span><i class="fa-solid fa-chevron-down"></i></button></li>`;
			const menuButtons = dropdown('Format') + ['', '', ''].map(() => dropdown('<i class="fa-solid fa-table"></i>')).join('')
				+ Array.from({ length: 12 }, () => '<li><button type="button"><i class="fa-solid fa-font"></i></button></li>').join('');
			opening.classList.add('editor', 'prosemirror', 'active');
			opening.classList.remove('inactive');
			opening.setAttribute('open', '');
			opening.innerHTML = `<div class="menu-container"><menu id="m">${menuButtons}</menu></div>
				<div class="editor-container"><div class="editor-content ProseMirror" contenteditable="true"><p>${'A line of the story. '.repeat(200)}</p></div></div>`;
			body().scrollTop = 0;
			opening.dispatchEvent(new Event('open'));
			await wait(20);
			const typingArea = opening.querySelector('.editor-content');
			const areaBox = typingArea.getBoundingClientRect();
			const scale = areaBox.height / (typingArea.offsetHeight || 1);
			check(`${device}: an open editor has room to type in`, typingArea.offsetHeight >= 180, typingArea.offsetHeight);
			check(`${device}: below its toolbar`, areaBox.top >= opening.querySelector('.menu-container').getBoundingClientRect().bottom - 1);
			check(`${device}: its text scrolls inside it`, typingArea.scrollHeight > typingArea.clientHeight && getComputedStyle(typingArea).overflowY === 'auto', [typingArea.scrollHeight, typingArea.clientHeight]);
			const seen = body().getBoundingClientRect();
			const editorBox = opening.getBoundingClientRect();
			check(`${device}: opening it brings it into view`, editorBox.top >= seen.top - 1 && editorBox.bottom <= seen.bottom + 1, [editorBox.top, editorBox.bottom, seen.top, seen.bottom, scale]);
			const bar = opening.querySelector('menu');
			check(`${device}: its toolbar fits on one row`, bar.scrollWidth <= bar.clientWidth + 1 && bar.lastElementChild.getBoundingClientRect().top < bar.firstElementChild.getBoundingClientRect().bottom, [bar.scrollWidth, bar.clientWidth]);
			check(`${device}: without scrolling`, getComputedStyle(bar).overflowX === 'hidden');
			const zoom = Number(getComputedStyle(bar.firstElementChild).zoom) || 1;
			check(`${device}: its buttons are no smaller than they need to be`, zoom >= 0.6, zoom);
			// Foundry's theme colors its buttons on the buttons themselves; on the Journal's paper its light ones vanish
			const ink = Object.assign(document.createElement('span'), { style: 'color:var(--text)' });
			opening.append(ink);
			const tool = opening.querySelector('menu button');
			check(`${device}: its toolbar's buttons are in the page's text color`, getComputedStyle(tool).color === getComputedStyle(ink).color, [getComputedStyle(tool).color, getComputedStyle(ink).color]);
			ink.remove();
			opening.removeAttribute('open');
		}
		game.settings.set(null, 'device', deviceWas);
		await wait(250);

		/* to someone else */
		actor.isOwner = false;
		Projection.render();
		await settle();
		check('without ownership there are no editors', !body().querySelector('prose-mirror'));
		check('no buttons', !body().querySelector('[data-act^="bio"]'));
		check('and no field can be typed in', [...body().querySelectorAll('input.sfh-in')].every((e) => e.disabled));
		check('sections shared with them show', [...body().querySelectorAll('.sec')].some((h) => h.textContent.includes('Appearance')) && [...body().querySelectorAll('.sec')].some((h) => h.textContent.includes('Personality')));
		check('those kept back do not', !/Mindoir|Owes Omega|Aria/.test(body().textContent), body().textContent.slice(0, 200));
		// the readout enriches too, and says which document for
		check('and they see no secrets', enrichOptions.filter((o) => !o.relativeTo).at(-1)?.secrets === false);
		bio.visibility = { appearance: false, backstory: false, personality: false, campaign: false };
		Projection.render();
		await settle();
		check('with nothing shared it says so', /shared/.test(body().textContent));

		actor.system.details = realDetails;
		actor.isOwner = realOwner;
		actor.update = realUpdate;
		actor._source = realSource;
		foundry.applications.ux.TextEditor.implementation.enrichHTML = realEnrich;
		await tab('actions');
	}

	/* ---- the feats tab: Navasi, a level 7 envoy, in the shape the system gives ---- */
	{
		const feat = (name, children = []) => ({ feat: { id: name.toLowerCase().replace(/\W+/g, '-'), name }, children });
		const slot = (label, name, children) => (name ? { label, ...feat(name, children) } : { label, placeholder: 'PF2E.EmptySlot', children: [] });
		const groups = [
			{ id: 'ancestryfeature', label: 'PF2E.Actor.Character.FeatSlot.AncestryFeaturesHeader', feats: [] },
			{ id: 'classfeature', label: 'PF2E.Actor.Character.FeatSlot.ClassFeaturesHeader', feats: [
				slot('1', 'Envoy Directives'),
				slot('1', 'Leadership Style', [{ label: null, ...feat('Guns Blazing', [{ label: null, ...feat('Incredible Initiative') }]) }]),
				slot('3', 'Wise to the Game'), slot('3', 'Adaptive Talent'),
				slot('5', 'Weapon Expertise'), slot('5', 'Perception Expertise'), slot('5', 'Improvised Mastery'),
				slot('7', 'Fortitude Expertise'), slot('7', 'Weapon Specialization'), slot('7', 'Leader\'s Confidence'),
			] },
			{ id: 'ancestry', label: 'PF2E.Actor.Character.FeatSlot.AncestryHeader', feats: [slot('1', 'Natural Ambition', [{ label: null, ...feat('Watch Out') }]), slot('5', 'Confident Actualization')] },
			{ id: 'class', label: 'PF2E.Actor.Character.FeatSlot.ClassHeader', feats: [slot('1', 'Size Up'), slot('2', 'Get in There!'), slot('4', 'Diverse Schemes'), slot('6', 'Hang in There')] },
			{ id: 'skill', label: 'PF2E.Actor.Character.FeatSlot.SkillHeader', feats: [slot('BG', 'Intimidating Shot'), slot('2', 'Battle Medicine'), slot('4', 'Kiss it Better'), slot('6', 'Take the Wheel')] },
			{ id: 'general', label: 'PF2E.Actor.Character.FeatSlot.GeneralHeader', feats: [slot('3', 'Fleet'), slot('7', 'Power Slide')] },
		];
		groups.bonus = { id: 'bonus', label: 'PF2E.Actor.Character.FeatSlot.BonusHeader', feats: [{ label: null, ...feat('Lie to Me') }] };
		const realFeats = actor.feats;
		actor.feats = groups;
		const body = () => stage().querySelector('.proj-b');
		await tab('feats');
		await wait(40);

		// what comes under each heading, in order, with how deep it is
		const listing = () => {
			const out2 = {};
			let current = null;
			for (const el of body().children) {
				if (el.classList.contains('sec')) out2[current = el.textContent.trim()] = [];
				else if (el.classList.contains('sfh-feat')) out2[current].push(`${el.querySelector('.sfh-slot').textContent}|${el.querySelector('.nm')?.textContent ?? el.querySelector('.grow').textContent}|${el.style.getPropertyValue('--depth')}`);
			}
			return out2;
		};
		const shown = listing();
		const expected = {
			'Class Features': ['1|Envoy Directives|0', '1|Leadership Style|0', '|Guns Blazing|1', '|Incredible Initiative|2', '3|Wise to the Game|0', '3|Adaptive Talent|0', '5|Weapon Expertise|0', '5|Perception Expertise|0', '5|Improvised Mastery|0', '7|Fortitude Expertise|0', '7|Weapon Specialization|0', '7|Leader\'s Confidence|0'],
			'Ancestry Feats': ['1|Natural Ambition|0', '|Watch Out|1', '5|Confident Actualization|0'],
			'Class Feats': ['1|Size Up|0', '2|Get in There!|0', '4|Diverse Schemes|0', '6|Hang in There|0'],
			'Skill Feats': ['BG|Intimidating Shot|0', '2|Battle Medicine|0', '4|Kiss it Better|0', '6|Take the Wheel|0'],
			'General Feats': ['3|Fleet|0', '7|Power Slide|0'],
			'Bonus Feats': ['|Lie to Me|0'],
		};
		for (const [heading, rows] of Object.entries(expected)) check(`${heading} lists what the system put there`, JSON.stringify(shown[heading]) === JSON.stringify(rows), shown[heading]);
		check('in the sheet\'s order', Object.keys(shown).join() === Object.keys(expected).join(), Object.keys(shown));
		check('a group with nothing in it is left out', !('Ancestry Features' in shown));
		check('every one of her 26 feats shows once', [...body().querySelectorAll('.nm')].length === 26, body().querySelectorAll('.nm').length);
		const name = (text) => [...body().querySelectorAll('.nm')].find((n) => n.textContent === text);
		const nestedLeft = (text) => name(text).closest('.sfh-feat').getBoundingClientRect().left;
		check('granted feats sit under what granted them', nestedLeft('Guns Blazing') > nestedLeft('Leadership Style') && nestedLeft('Incredible Initiative') > nestedLeft('Guns Blazing'));
		check('its row shows it in the readout', name('Watch Out').closest('.sfh-feat').dataset.ro === 'item:watch-out');

		groups[3].feats.push(slot('8', null));
		Projection.render();
		await wait(40);
		const empty = [...body().querySelectorAll('.sfh-feat.empty')];
		check('an open slot shows', empty.length === 1 && /Empty Slot|PF2E\.EmptySlot/.test(empty[0].textContent) && empty[0].querySelector('.sfh-slot').textContent === '8', empty.map((e) => e.textContent));
		groups[3].feats.pop();

		const deviceWas = document.body.dataset.sfhDevice;
		for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal', 'vambrace']) {
			game.settings.set(null, 'device', device);
			await wait(250);
			Projection.render();
			await wait(40);
			const box = body().getBoundingClientRect();
			const rows = [...body().querySelectorAll('.sfh-feat')];
			check(`${device}: every row stays inside the panel`, rows.every((r) => { const b = r.getBoundingClientRect(); return b.left >= box.left - 0.5 && b.right <= box.right + 0.5; }) && body().scrollWidth <= body().clientWidth);
			check(`${device}: its rows do not overlap`, rows.every((r, i) => !i || r.getBoundingClientRect().top >= rows[i - 1].getBoundingClientRect().bottom - 0.5));
		}
		game.settings.set(null, 'device', deviceWas);
		await wait(250);

		actor.feats = undefined;
		items.solo = { id: 'solo', name: 'Solo Feat', type: 'feat', system: { level: { value: 2 } } };
		const realTypes = actor.itemTypes.feat;
		actor.itemTypes.feat = [items.solo];
		Projection.render();
		await wait(40);
		check('anything without the system\'s groups still lists its feats', !!name('Solo Feat'));
		actor.itemTypes.feat = realTypes;
		actor.feats = realFeats;
		await tab('actions');
	}

	/* ---- strikes ---- */
	{
		const fired = [];
		const roll = (name) => ({ label: '+5', roll: async (o) => { fired.push(`${name} attack`); return o; } });
		const usage = (name, extra = {}) => ({ label: name, ready: true, handsAvailable: true, traits: [], variants: [roll(name)],
			damage: async () => fired.push(`${name} damage`), critical: async () => fired.push(`${name} critical`), ...extra });
		const auxCalls = [];
		const subitemCalls = [];
		const pistol = { id: 'pistol', update: async (d) => record('pistol.update', d), subitems: new Map([['mag1', { detach: async (o) => subitemCalls.push(['detach', 'mag1', o]) }]]) };
		const rifle = { id: 'rifle', update: async (d) => record('rifle.update', d), subitems: new Map() };
		actor.system.actions = [
			usage('Stowed Rifle', { ready: false, item: rifle, auxiliaryActions: [{ label: 'Draw', execute: async (o) => auxCalls.push(['draw', o]) }] }),
			usage('Secret Knife', { visible: false, item: rifle }),
			usage('Drawn Pistol', {
				item: pistol,
				altUsages: [usage('Burst', { type: 'auto-fire', item: { isRanged: true } })],
				ammunition: {
					requiresReload: true, capacity: 2, remaining: 1, selected: { id: 'mag1' },
					loaded: [{ id: 'mag1', name: 'Magazine', quantity: 8, max: 10 }, { id: 'mag2', name: 'Tracer', quantity: 3, max: 10 }],
				},
				auxiliaryActions: [{ label: 'Stow', execute: async (o) => auxCalls.push(['stow', o]) },
					{ label: 'Change Grip', options: [{ value: 'two', label: 'Two hands' }], execute: async (o) => auxCalls.push(['grip', o]) }],
			}),
			usage('Bow', { item: pistol, ammunition: { requiresReload: false, compatible: [{ id: 'arrows', label: 'Arrows (20)' }], selected: null } }),
			usage('Bound Hands', { ready: false, handsAvailable: false, item: rifle, auxiliaryActions: [{ label: 'Draw', execute: async () => {} }] }),
			usage('Thrown Rock', { quantity: 0, item: rifle }),
		];
		items.arrows = { id: 'arrows' };
		actor.itemTypes.action = [{ id: 'act1', uuid: 'Actor.asha.Item.act1', name: 'Biotic Charge', system: { actions: { value: 2 }, actionType: { value: 'action' }, traits: { value: [] } } }];
		actor.itemTypes.feat = [
			{ id: 'feat1', uuid: 'Actor.asha.Item.feat1', name: 'Nova Feat', actionCost: { type: 'action', value: 1 }, system: { actions: { value: 1 }, actionType: { value: 'action' }, traits: { value: [] } } },
			{ id: 'feat2', name: 'Passive Feat', actionCost: null, system: { traits: { value: [] } } },
			{ id: 'feat3', name: 'Suppressed Feat', actionCost: { type: 'free' }, suppressed: true, system: { traits: { value: [] } } },
		];
		await tab('actions');
		const row = (name) => [...stage().querySelectorAll('.li')].find((l) => l.querySelector('.nm')?.textContent === name);
		const within = (name, selector) => row(name)?.querySelector(selector);

		within('Drawn Pistol', '[data-act="strike"]').click();
		await wait(30);
		check('Attack fires the weapon it is on, with one stowed above it', fired.at(-1) === 'Drawn Pistol attack', fired);
		within('Drawn Pistol', '[data-act="strikeDamage"]').click();
		await wait(30);
		check('Damage does too', fired.at(-1) === 'Drawn Pistol damage', fired);
		within('Drawn Pistol', '[data-act="critical"]').click();
		await wait(30);
		check('and Critical', fired.at(-1) === 'Drawn Pistol critical', fired);
		check('a hidden strike is not shown', !row('Secret Knife'));
		// rows hold their content and stay clear of each other, on every device and every tab
		const layoutProblems = () => {
			const body = stage().querySelector('.proj-b');
			const rows = [...body.children].filter((el) => el.getBoundingClientRect().height > 0);
			const out = [];
			rows.forEach((el, i) => {
				const r = el.getBoundingClientRect();
				if (el.scrollHeight > el.clientHeight + 1) out.push(`${el.className} overflows: ${el.scrollHeight} > ${el.clientHeight}`);
				const next = rows[i + 1]?.getBoundingClientRect();
				if (next && next.top < r.bottom - 0.5) out.push(`${el.className} runs into the next row`);
			});
			return out;
		};
		for (const device of ['omni', 'wrist', 'gdi', 'tron', 'journal', 'vambrace']) {
			game.settings.set(null, 'device', device);
			await wait(150);
			await tab('actions');
			const found = layoutProblems();
			check(`${device}: strike rows hold their controls`, !found.length, found);
		}
		game.settings.set(null, 'device', 'omni');
		await wait(150);
		await tab('actions');

		check('a stowed weapon is listed, without attacks', row('Stowed Rifle') && !within('Stowed Rifle', '[data-act="strike"]'));
		within('Stowed Rifle', '[data-act="aux"]').click();
		await wait(30);
		check('Draw runs the system\'s action', auxCalls.at(-1)?.[0] === 'draw' && auxCalls.at(-1)[1].selection === null, auxCalls);
		check('with no hands free it says so and offers nothing', /Hands occupied/.test(row('Bound Hands').textContent) && !within('Bound Hands', '[data-act="aux"]'));
		check('none left, no attacks', /None left/.test(row('Thrown Rock').textContent) && !within('Thrown Rock', '[data-act="strike"]'));

		const altAttack = [...row('Drawn Pistol').querySelectorAll('[data-act="strike"]')].find((b) => b.dataset.k.split(':')[2] === '0');
		check('auto-fire is labeled', /Auto-fire/.test(row('Drawn Pistol').textContent));
		altAttack.click();
		await wait(30);
		check('auto-fire fires its own attack', fired.at(-1) === 'Burst attack', fired);
		[...row('Drawn Pistol').querySelectorAll('[data-act="strikeDamage"]')].find((b) => b.dataset.k.includes(':')).click();
		await wait(30);
		check('and its own damage', fired.at(-1) === 'Burst damage', fired);

		within('Drawn Pistol', 'select[data-pick="aux"]').value = 'two';
		within('Drawn Pistol', 'select[data-pick="aux"]').dispatchEvent(new Event('change', { bubbles: true }));
		await wait(60);
		check('a choice passes its selection', JSON.stringify(auxCalls.at(-1)) === JSON.stringify(['grip', { selection: 'two' }]), auxCalls);

		check('loaded ammunition shows its count', /Magazine/.test(row('Drawn Pistol').textContent) && /8 \/ 10/.test(row('Drawn Pistol').textContent));
		within('Drawn Pistol', '[data-act="unload"]').click();
		await wait(30);
		check('Unload detaches it', subitemCalls.at(-1)?.[0] === 'detach', subitemCalls);

		// the reload window looks its button up by this id, the first in the document
		const anchorId = 'sheet-Item.pistol-reload';
		let reloads = 0;
		let selected = 0;
		const armSheet = () => {
			sheet.rendered = true;
			const el = document.createElement('div');
			el.id = sheet.id;
			el.innerHTML = `<li data-strike data-action-index="2"><a data-action="reload" data-anchor-id="${anchorId}"></a><div class="loaded" data-item-id="mag2"><button data-action="select-ammo"></button></div></li>`;
			el.querySelector('[data-action="reload"]').addEventListener('click', () => { reloads += 1; });
			el.querySelector('[data-action="select-ammo"]').addEventListener('click', () => { selected += 1; });
			document.body.append(el);
			return el;
		};
		const sheetEl = armSheet();
		within('Drawn Pistol', '[data-act="reload"]').click();
		await wait(60);
		check('Reload presses the right strike\'s button on the sheet', reloads === 1, reloads);
		const pressedReload = within('Drawn Pistol', '[data-act="reload"]');
		check('...and its window will find the button on the HUD first', document.querySelector(`[data-anchor-id="${anchorId}"]`) === pressedReload, document.querySelector(`[data-anchor-id="${anchorId}"]`)?.outerHTML);
		within('Drawn Pistol', '[data-act="selectAmmo"]').click();
		await wait(60);
		check('choosing loaded ammunition does too', selected === 1, selected);
		sheetEl.remove();
		sheet.rendered = false;

		const link = within('Bow', 'select[data-pick="ammo"]');
		link.value = 'arrows';
		link.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(60);
		check('a bow links ammunition', last()?.[1]?.system?.selectedAmmoId === 'arrows', last());
		const unlink = within('Bow', 'select[data-pick="ammo"]');
		unlink.value = '';
		unlink.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(60);
		check('and can clear it', last()?.[1]?.system?.selectedAmmoId === null, last());

		/* ---- abilities ---- */
		check('feats with an action cost are listed', row('Nova Feat'));
		check('passive and suppressed feats are not', !row('Passive Feat') && !row('Suppressed Feat'));
		const macro = [];
		game.pf2e.rollItemMacro = async (uuid, event) => macro.push([uuid, event?.type]);
		items.feat1 = actor.itemTypes.feat[0];
		within('Nova Feat', '[data-act="use"]').click();
		await wait(30);
		check('Use goes through the system\'s own route', JSON.stringify(macro.at(-1)) === JSON.stringify(['Actor.asha.Item.feat1', 'click']), macro);
		const nova = actor.itemTypes.feat[0];
		const useNova = () => within('Nova Feat', '[data-act="use"]');
		const novaRow = () => useNova().closest('.li');
		const readoutNow = () => stage().querySelector('#sfh-readout').textContent.replace(/\s+/g, ' ');
		const overRow = async () => { novaRow().dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); await wait(200); };
		nova.system.traits.value = ['concentrate', 'envoy', 'mental', 'visual'];
		Projection.render();
		await wait(40);
		check('a row shows no traits', !novaRow().querySelector('.chip') && !/concentrate/i.test(novaRow().textContent));
		check('and no count', !/\d\s*\/\s*\d/.test(novaRow().textContent));
		novaRow().querySelector('.cost').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		await wait(200);
		check('anywhere on the row shows it in the readout', /Nova Feat/.test(readoutNow()), readoutNow().slice(0, 80));
		check('with all its traits', [...stage().querySelectorAll('#sfh-readout .chip')].map((c) => c.textContent).join() === 'concentrate,envoy,mental,visual');
		check('and without limited uses, no count there either', !/Uses/.test(readoutNow()));
		nova.system.frequency = { value: 1, max: 2, per: 'day' };
		Projection.render();
		await wait(40);
		await overRow();
		CONFIG.PF2E = { ...(CONFIG.PF2E ?? {}), frequencies: { day: 'Day' } };
		Projection.render();
		await wait(40);
		check('the readout shows how many uses are left', /Uses.*1 \/ 2/.test(readoutNow()), readoutNow().slice(0, 100));
		check('and how often they come back', /per Day|PF2E\.Frequency\.per Day/.test(readoutNow()), readoutNow().slice(0, 100));
		check('and its Use still works', !useNova().disabled && !useNova().classList.contains('spent'));
		nova.system.frequency = { value: 0, max: 2, per: 'day' };
		Projection.render();
		await wait(40);
		check('out of uses, the readout says so', /Uses.*0 \/ 2/.test(readoutNow()), readoutNow().slice(0, 100));
		check('its Use is disabled', useNova().disabled);
		check('crossed out', getComputedStyle(useNova()).textDecorationLine.includes('line-through'), getComputedStyle(useNova()).textDecorationLine);
		check('and dimmed', parseFloat(getComputedStyle(useNova()).opacity) < 0.6, getComputedStyle(useNova()).opacity);
		const usedBefore = macro.length;
		useNova().click();
		await wait(30);
		check('and does nothing', macro.length === usedBefore);
		delete nova.system.frequency;
		nova.system.traits.value = [];

		// every action the same size, however long its name, on every device
		const realActions = actor.itemTypes.action;
		const named = (id, name, type) => ({ id, uuid: id, name, type: 'action', system: { actionType: { value: type }, actions: { value: 1 }, traits: { value: ['manipulate', 'concentrate', 'envoy'] } } });
		actor.itemTypes.action = [named('u1', 'Stride', 'action'), named('u2', 'A Very Long Action Name That Would Certainly Not Fit On One Or Even Two Lines Of Its Column', 'action'), named('u3', 'Administer First Aid', 'reaction'), named('u4', 'Aid', 'free')];
		const deviceWas = document.body.dataset.sfhDevice;
		for (const device of ['omni', 'wrist', 'gdi', 'nod', 'tron', 'journal', 'vambrace']) {
			game.settings.set(null, 'device', device);
			await wait(250);
			Projection.render();
			await wait(60);
			const rows = [...stage().querySelectorAll('.sfh-actions > .li')];
			const heights = rows.map((r) => r.getBoundingClientRect().height);
			check(`${device}: every action is the same height`, rows.length >= 4 && Math.max(...heights) - Math.min(...heights) < 0.5, heights);
			const widths = rows.map((r) => r.getBoundingClientRect().width);
			check(`${device}: and the same width`, Math.max(...widths) - Math.min(...widths) < 0.5, widths);
			const inside = rows.every((r) => {
				const box = r.getBoundingClientRect();
				const use = r.querySelector('[data-act="use"]').getBoundingClientRect();
				const nameBox = r.querySelector('.nm').getBoundingClientRect();
				return use.right <= box.right + 0.5 && use.bottom <= box.bottom + 0.5 && nameBox.bottom <= box.bottom + 0.5 && nameBox.right <= use.left + 0.5 && Math.abs((use.top + use.bottom) - (box.top + box.bottom)) < 2;
			});
			check(`${device}: the name and Use stay on one line inside it`, inside);
		}
		game.settings.set(null, 'device', deviceWas);
		await wait(250);
		actor.itemTypes.action = realActions;
		Projection.render();
		await wait(40);

		/* ---- shield ---- */
		check('no shield, no row', !stage().querySelector('.sfh-shield'));
		actor.system.attributes.shield = { itemId: 'sh', name: 'Riot Shield', ac: 2, hardness: 5, hp: { value: 15, max: 20 }, raised: false, broken: false, destroyed: false };
		const raised = [];
		game.pf2e.actions = { raiseAShield: async (o) => raised.push(o.actors[0].id) };
		Projection.render();
		await wait(100);
		const shieldRowEl = () => stage().querySelector('.sfh-shield');
		check('a held shield shows its numbers', /Riot Shield/.test(shieldRowEl().textContent) && /AC \+2/.test(shieldRowEl().textContent) && /Hardness 5/.test(shieldRowEl().textContent));
		await press('[data-act="raiseShield"]');
		check('Raise goes through the system\'s action', raised[0] === actor.id, raised);
		const hpBox = shieldRowEl().querySelector('[data-commit="shieldHp"]');
		hpBox.value = '9';
		hpBox.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(40);
		check('shield hit points are typed', last()?.[1]?.['system.attributes.shield.hp.value'] === 9, last());
		actor.system.attributes.shield.raised = true;
		Projection.render();
		await wait(100);
		check('a raised shield says so', shieldRowEl().querySelector('[data-act="raiseShield"]').textContent === 'Raised');
		delete actor.system.attributes.shield;

		/* ---- speed ---- */
		actor.system.movement = { speeds: { land: { value: 35 } } };
		delete actor.system.attributes.speed;
		Projection.render();
		await wait(100);
		check('speed comes from where the system keeps it', /35 ft/.test(stage().querySelector('[data-slot="defenses"]').textContent), stage().querySelector('[data-slot="defenses"]').textContent);

		/* ---- recovery ---- */
		const recoveries = [];
		actor.rollRecovery = async (e) => recoveries.push(e?.type);
		check('no recovery check when not dying', !stage().querySelector('[data-act="recovery"]'));
		actor.system.attributes.dying = { value: 1, max: 4 };
		Projection.render();
		await wait(100);
		await press('[data-act="recovery"]');
		check('dying offers the recovery check', recoveries[0] === 'click', recoveries);
		const dyingCell = stage().querySelector('[data-act="recovery"]').closest('.cell');
		check('the button fits its box', dyingCell.scrollWidth <= dyingCell.clientWidth + 1, [dyingCell.scrollWidth, dyingCell.clientWidth]);
		actor.system.attributes.dying = { value: 0, max: 4 };
	}

	/* ---- focus points ---- */
	actor.system.resources = { ...(actor.system.resources ?? {}), focus: { value: 1, max: 2 } };
	const focusCalls = [];
	actor.updateResource = async (slug, value) => focusCalls.push([slug, value]);

	/* ---- spells ---- */
	await tab('spellcasting');
	const focusButtons = [...stage().querySelectorAll('[data-act="focus"]')];
	check('a focus entry shows the pool', focusButtons.length === 2 && /1 \/ 2/.test(focusButtons[0].closest('.kv').textContent));
	focusButtons[0].click();
	await wait(30);
	check('spending a focus point goes through the system', JSON.stringify(focusCalls.at(-1)) === JSON.stringify(['focus', 0]), focusCalls);
	focusButtons[1].click();
	await wait(30);
	check('and regaining one', JSON.stringify(focusCalls.at(-1)) === JSON.stringify(['focus', 2]), focusCalls);
	check('a cast prepared spell offers Restore', await press('[data-act="restoreSlot"][data-k="sc3:1:0"]'));
	check('...and restores that slot', JSON.stringify(last()) === JSON.stringify(['setSlotExpendedState', [1, 0, false]]), last());
	check('an uncast prepared spell still offers Cast', stage().querySelector('[data-act="cast"][data-k^="sc3:s2"]'));
	check('Restore is not faded with its row', getComputedStyle(stage().querySelector('[data-act="restoreSlot"]')).opacity === '1');

	check('a rank with spent slots offers Restore', await press('[data-act="restoreSlots"][data-k="sc1:2"]'));
	check('...and refills that rank', last()?.[1]?.['system.slots.slot2.value'] === 2, last());
	check('a full rank does not', !stage().querySelector('[data-act="restoreSlots"][data-k="sc3:1"]'));
	check('a focus pool does not', !stage().querySelector('[data-act="restoreSlots"][data-k^="sc2"]'));

	check('a spent innate spell offers Restore', await press('[data-act="restoreUses"][data-k="s1"]'));
	check('...and refills its uses', last()?.[1]?.['system.location.uses.value'] === 1, last());

	check('only a prepared entry offers Spell Preparation',
		stage().querySelector('[data-act="prepareSpells"][data-k="sc3"]') && !stage().querySelector('[data-act="prepareSpells"][data-k="sc1"]'));
	await press('[data-act="prepareSpells"][data-k="sc3"]');
	await wait(200);
	check('Spell Preparation presses the sheet\'s button', prepared === 1, prepared);
	check('...with the sheet out of sight', sheet.visibleWhileDrawn === 'hidden', sheet.visibleWhileDrawn);
	check('...and puts the sheet away after', !sheet.rendered && !document.getElementById(sheet.id));
	check('...leaving no trace of the veil', ![...document.querySelectorAll('head style')].some((s) => s.textContent.includes(sheet.id)));

	sheet.rendered = true;
	const openEl = document.createElement('div');
	openEl.id = sheet.id;
	openEl.innerHTML = '<li data-item-id="sc3"><button data-action="open-spell-preparation"></button></li>';
	openEl.querySelector('button').addEventListener('click', () => { prepared += 1; });
	document.body.append(openEl);
	await press('[data-act="prepareSpells"][data-k="sc3"]');
	await wait(60);
	check('an open sheet is used and left open', prepared === 2 && sheet.rendered && document.getElementById(sheet.id), prepared);
	openEl.remove();
	sheet.rendered = false;

	const front = [];
	foundry.applications.instances.set('spell-preparation-Actor.asha.Item.sc3', { bringToFront: () => front.push(1) });
	await press('[data-act="prepareSpells"][data-k="sc3"]');
	check('an open window comes to the front instead', front.length === 1 && prepared === 2);
	foundry.applications.instances.clear();

	/* ---- skills ---- */
	await tab('skills');
	const rank = (k) => stage().querySelector(`select[data-pick="rank"][data-k="${k}"]`);
	const choose = async (k, value) => {
		const el = rank(k);
		el.value = String(value);
		el.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(80);
	};
	check('a skill shows its training', rank('acrobatics')?.selectedOptions[0].textContent === 'M', rank('acrobatics')?.value);
	check('every rank is on offer', [...rank('acrobatics').options].map((o) => o.textContent).join('') === 'UTEML');
	await choose('acrobatics', 4);
	check('choosing a rank updates the actor', last()?.[1]?.['system.skills.acrobatics.rank'] === 4, last());
	await choose('acrobatics', 0);
	check('zero is a rank too', last()?.[1]?.['system.skills.acrobatics.rank'] === 0, last());
	await choose('warfare', 2);
	check('a lore updates its own item', last()?.[0] === 'lore.update' && last()[1]['system.proficient.value'] === 2, last());
	check('a lore with no item cannot be changed', rank('orphan')?.disabled);
	const box = rank('acrobatics').getBoundingClientRect();
	check('the picker stays chip-sized', box.width < 40 && box.height < 40, [box.width, box.height]);

	/* ---- quick search ---- */
	{
		const engine = [
			{ name: 'Medi-Gel', uuid: 'Compendium.x.Item.med', img: 'icons/a.webp', level: 1, price: { toString: () => '5 cr' } },
			{ name: 'Medkit <b>', uuid: 'Compendium.x.Item.kit', img: 'icons/b.webp', level: 3, price: { toString: () => '40 cr' } },
		];
		let inits = 0;
		let queries = [];
		game.pf2e.compendiumBrowser.tabs.equipment.init = async () => { inits += 1; };
		game.pf2e.compendiumBrowser.tabs.equipment.searchEngine = {
			search: (q) => { queries.push(q); return q === 'many' ? Array.from({ length: 20 }, (_, i) => ({ ...engine[0], uuid: `u${i}` })) : q.startsWith('med') ? engine : []; },
		};
		foundry.applications.ux = { SearchFilter: { cleanQuery: (t) => t.trim().toLowerCase() } };
		const added = [];
		const sourceItem = (extra = {}) => ({ name: 'Medi-Gel', isMagical: false, isOfType: (...t) => t.includes('physical'), clone: (d) => ({ cloned: true, d }), ...extra });
		let source = sourceItem();
		globalThis.fromUuid = async (u) => { record('fromUuid', u); return u === 'Compendium.x.Item.kit' ? { ...source, sheet: { render: (f) => record('sheet.render', f) } } : source; };
		actor.inventory.add = async (item, options) => { added.push([item, options]); return item; };
		actor.size = 'med';
		const type = async (text) => {
			const box = stage().querySelector('[data-browse]');
			box.value = text;
			box.dispatchEvent(new Event('input', { bubbles: true }));
			await wait(280);
		};
		const results = () => stage().querySelector('.sfh-results');
		await tab('inventory');
		await type('m');
		check('one letter does not search', queries.length === 0 && results().children.length === 0);
		const rapid = stage().querySelector('[data-browse]');
		rapid.value = 'me';
		rapid.dispatchEvent(new Event('input', { bubbles: true }));
		await wait(40);
		await type('medi');
		check('typing waits for a pause', queries.join() === 'medi', queries);
		check('it searches the browser\'s index', inits === 1);
		check('results list what was found', results().querySelectorAll('.qs').length === 2);
		check('with level and price', /Lv 1/.test(results().textContent) && /5 cr/.test(results().textContent), results().textContent);
		check('names are escaped', !results().querySelector('b') && /Medkit <b>/.test(results().textContent));

		await press('[data-act="addItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('Add puts it in the inventory, stacking', added.length === 1 && added[0][0].cloned && added[0][1].stack === true, added[0]);
		check('a medium actor gets it as it is', added[0][0].d === undefined);

		actor.size = 'lg';
		await press('[data-act="addItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('a large actor gets it sized up, non-sensitive', added[1][0].d?.system?.size === 'lg' && added[1][0].d.system.price.sizeSensitive === false, added[1]);
		actor.size = 'sm';
		await press('[data-act="addItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('a small actor uses medium gear', added[2][0].d === undefined, added[2]);
		actor.size = 'med';

		source = sourceItem({ isOfType: (...t) => t.includes('spell') });
		const beforeWrong = added.length;
		await press('[data-act="addItem"][data-k="Compendium.x.Item.med"]');
		await press('[data-act="buyItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('something that is not an item is refused', added.length === beforeWrong);

		// buying: the system takes the coins or refuses, and only then does the item arrive
		const price = { gp: 5 };
		source = sourceItem({ price: { value: price } });
		const paid = [];
		const told = [];
		const notifications = ui.notifications;
		ui.notifications = { info: (m) => told.push(['info', m]), warn: (m) => told.push(['warn', m]), error: notifications.error };
		let canPay = true;
		actor.inventory.removeCoins = async (coins) => { paid.push(coins); return canPay; };
		const beforeBuy = added.length;
		check('each result can be bought', results().querySelectorAll('[data-act="buyItem"]').length === 2);
		await press('[data-act="addItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('Add still costs nothing', paid.length === 0 && added.length === beforeBuy + 1);
		await press('[data-act="buyItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('Buy pays the item\'s price', paid.length === 1 && paid[0] === price, paid);
		check('...and adds it, stacking', added.length === beforeBuy + 2 && added[added.length - 1][1].stack === true);
		check('...and says it was bought', told[told.length - 1]?.[1]?.startsWith('PF2E.CompendiumBrowser.BoughtItemWithCharacter'), told);
		canPay = false;
		await press('[data-act="buyItem"][data-k="Compendium.x.Item.med"]');
		await wait(40);
		check('without the money nothing arrives', added.length === beforeBuy + 2 && paid.length === 2);
		check('...and it says so', told[told.length - 1]?.[0] === 'warn' && told[told.length - 1][1].startsWith('PF2E.CompendiumBrowser.FailedToBuyItemWithCharacter'), told);
		ui.notifications = notifications;
		source = sourceItem();

		stage().querySelector('[data-browse]').focus();
		Projection.render();
		await wait(60);
		check('a re-render keeps the search', stage().querySelector('[data-browse]').value === 'medi' && results().querySelectorAll('.qs').length === 2);
		check('and the focus', document.activeElement === stage().querySelector('[data-browse]'));

		await press('[data-act="viewItem"][data-k="Compendium.x.Item.kit"]');
		await wait(40);
		check('a result\'s name opens its sheet', last()?.[0] === 'sheet.render', last());

		await type('nothing here');
		check('no results says so', /Nothing found/.test(results().textContent));
		await type('many');
		check('results stop at a limit', results().querySelectorAll('.qs').length === 12 && /8 more/.test(results().textContent), results().textContent);

		// a slow first search must not overwrite a newer one
		const slow = game.pf2e.compendiumBrowser.tabs.equipment;
		let release;
		slow.init = () => new Promise((r) => { release = r; });
		await type('medi');
		slow.init = async () => {};
		await type('many');
		release();
		await wait(40);
		check('only the newest search shows', results().querySelectorAll('.qs').length === 12);

		stage().querySelector('[data-browse]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await wait(60);
		check('Escape clears it', stage().querySelector('[data-browse]').value === '' && results().children.length === 0);

		const failing = game.pf2e.compendiumBrowser.tabs.equipment;
		failing.init = async () => { throw new Error('no packs'); };
		const quiet = console.error;
		console.error = () => {};
		await type('medi');
		console.error = quiet;
		check('a failed search says so', /could not be run/.test(results().textContent));
		failing.init = async () => {};
		await type('');
	}

	/* ---- inventory ---- */
	for (const item of actor.inventory) items[item.id] = item;
	{
		const gel = actor.inventory.find((i) => i.id === 'i4');
		const used = [];
		gel.system.uses = { value: 2, max: 2 };
		gel.consume = async () => used.push('i4');
		const omni = actor.inventory.find((i) => i.id === 'i5');
		omni.system.uses = { value: 0, max: 1 };
		const ammo = actor.inventory.find((i) => i.id === 'i2');
		const box = { id: 'box', name: 'Ammo Box', type: 'consumable', isAmmo: true, quantity: 1, isEquipped: false, isInvested: null, system: { bulk: { value: 0 }, uses: { value: 5, max: 5 }, usage: { type: 'carried' }, equipped: { carryType: 'worn' } } };
		actor.inventory.push(box);
		items.box = box;
		await tab('inventory');
		const useOn = (id) => stage().querySelector(`[data-act="consume"][data-k="${id}"]`);
		check('a consumable can be used', useOn('i4'));
		useOn('i4').click();
		await wait(40);
		check('Use calls the system\'s consume', used[0] === 'i4', used);
		check('with no uses left it says so', !useOn('i5') && /None/.test([...stage().querySelectorAll('.li')].find((l) => l.textContent.includes('Omni-Gel')).textContent));
		check('ammunition has no Use, weapons neither', !useOn('box') && !useOn(ammo.id));
		actor.inventory.pop();
	}
	actor.changeCarryType = async (item, change) => record('changeCarryType', [item.id, change]);
	actor.toggleInvested = async (id) => record('toggleInvested', id);
	await tab('inventory');
	const carry = (id) => stage().querySelector(`select[data-pick="carry"][data-k="${id}"]`);
	const words = (id) => [...carry(id).options].map((o) => o.textContent).join('|');
	const carryTo = async (id, value) => {
		const el = carry(id);
		el.value = value;
		el.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(80);
	};
	check('armor offers Worn (Armor), as the sheet does', words('i3') === 'Held 1H|Held 2H|Worn (Armor)|Worn|Dropped', words('i3'));
	check('armor on shows as such', carry('i3').selectedOptions[0].textContent === 'Worn (Armor)' && carry('i3').classList.contains('on'));
	check('armor only carried shows as Worn', carry('i6').selectedOptions[0].textContent === 'Worn' && !carry('i6').classList.contains('on'));
	check('a weapon has no slot to wear', words('i2') === 'Held 1H|Held 2H|Worn|Dropped', words('i2'));
	check('a two-handed grip shows', carry('i1').value === 'held-2');
	check('an implant can be implanted', words('i7').includes('Implanted') && carry('i7').value === 'implanted', words('i7'));
	check('a worn item names its slot', words('i8').includes('Worn (Bracers)'), words('i8'));

	await carryTo('i6', 'worn-slot');
	check('Worn (Armor) goes through changeCarryType', JSON.stringify(last()) === JSON.stringify(['changeCarryType', ['i6', { handsHeld: 0, inSlot: true, carryType: 'worn' }]]), last());
	await carryTo('i2', 'held-1');
	check('Held 1H asks for one hand', last()[1][1].carryType === 'held' && last()[1][1].handsHeld === 1 && last()[1][1].inSlot === false, last());
	await carryTo('i2', 'dropped');
	check('Dropped goes through too', last()[1][1].carryType === 'dropped', last());
	const callsBefore = calls.length;
	await carryTo('i3', 'worn-slot');
	check('choosing what it already is does nothing', calls.length === callsBefore);

	check('no Stowed without a container', !words('i2').includes('Stowed'));
	actor.itemTypes.backpack = [{ system: { stowing: true }, isInContainer: false }];
	Projection.render();
	await wait(100);
	check('Stowed with one', words('i2').includes('Stowed'), words('i2'));
	await carryTo('i2', 'stowed');
	check('Stowed asks the system', last()[1][1].carryType === 'stowed', last());
	actor.itemTypes.backpack = [];

	check('only investable items have the gem',
		stage().querySelector('[data-act="invest"][data-k="i8"]') && !stage().querySelector('[data-act="invest"][data-k="i1"]'));
	check('an invested item shows it', stage().querySelector('[data-act="invest"][data-k="i7"]').getAttribute('aria-pressed') === 'true');
	await press('[data-act="invest"][data-k="i8"]');
	check('the gem asks the system', JSON.stringify(last()) === JSON.stringify(['toggleInvested', 'i8']), last());
	check('the old toggle is gone', !stage().querySelector('[data-act="equip"]'));

	/* ---- giving ---- */
	const give = (id) => stage().querySelector(`select[data-pick="give"][data-k="${id}"]`);
	const npc = { id: 'npc', name: 'Harbor Guard', type: 'npc', hasPlayerOwner: false };
	const ghost = { id: 'ghost', name: 'GM Spare', type: 'character', hasPlayerOwner: false };
	const vex = game.actors.get('vex');
	const stash = { id: 'party', name: 'The Party', type: 'party', hasPlayerOwner: false, visible: true };
	const hiddenStash = { id: 'party2', name: 'Secret Party', type: 'party', hasPlayerOwner: false };
	const roster = [actor, vex, npc, ghost, stash, hiddenStash, { id: 'zed', name: 'Aria', type: 'character', hasPlayerOwner: true }];
	const names = (id) => [...give(id).options].map((o) => o.textContent).join();
	Object.defineProperty(game, 'actors', { configurable: true, value: Object.assign(roster, { get: (id) => roster.find((a) => a.id === id) ?? null }) });
	Projection.render();
	await wait(100);
	check('every item can be given', actor.inventory.every((i) => give(i.id)));
	check('a player sees other players and what they can see, sorted', names('i2') === 'Give…,Aria,The Party,Vex Kaori', names('i2'));
	const realUser = Object.getOwnPropertyDescriptor(game, 'user');
	Object.defineProperty(game, 'user', { configurable: true, get: () => ({ character: actor, isGM: true }) });
	Projection.render();
	await wait(100);
	check('a GM sees every other character and stash', names('i2') === 'Give…,Aria,GM Spare,Secret Party,The Party,Vex Kaori', names('i2'));
	const unowned = roster.map((a) => (a === actor ? a : { ...a, hasPlayerOwner: false }));
	Object.defineProperty(game, 'actors', { configurable: true, value: Object.assign(unowned, { get: (id) => unowned.find((a) => a.id === id) ?? null }) });
	Projection.render();
	await wait(100);
	check('a GM alone in a world still has the list', names('i2').includes('Vex Kaori') && !give('i2').disabled, names('i2'));
	Object.defineProperty(game, 'actors', { configurable: true, value: Object.assign(roster, { get: (id) => roster.find((a) => a.id === id) ?? null }) });
	Object.defineProperty(game, 'user', realUser);
	Projection.render();
	await wait(100);
	sheet.moveItemBetweenActors = async (event, item, target) => record('moveItemBetweenActors', [event.type, item.id, target.id]);
	const giveTo = async (id, value) => {
		const el = give(id);
		el.value = value;
		el.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(80);
	};
	const beforeGive = calls.length;
	await giveTo('i2', '');
	check('Give… itself does nothing', calls.length === beforeGive);
	await giveTo('i2', 'vex');
	check('giving is the same call as dragging onto their sheet', JSON.stringify(last()) === JSON.stringify(['moveItemBetweenActors', ['change', 'i2', 'vex']]), last());
	check('the picker resets after', give('i2').value === '', give('i2').value);
	Object.defineProperty(game, 'actors', { configurable: true, value: Object.assign([actor], { get: (id) => (id === actor.id ? actor : null) }) });
	Projection.render();
	await wait(100);
	check('with nobody to give to the picker stays, grayed out', give('i2')?.disabled && give('i2').options.length === 1);
	check('...and says why', /no other character/.test(give('i2').title), give('i2')?.title);

	/* ---- money ---- */
	const coinButtons = (el) => {
		el.innerHTML = '<div class="coinage"><button data-action="add-coins"></button><button data-action="remove-coins"></button></div>';
		for (const b of el.querySelectorAll('button')) b.addEventListener('click', () => record('sheet button', b.dataset.action));
	};
	const originalRender = sheet.render;
	sheet.render = function render() {
		setTimeout(() => {
			const el = document.createElement('div');
			el.id = this.id;
			coinButtons(el);
			document.body.append(el);
			this.rendered = true;
		}, 40);
		return this;
	};
	await press('[data-act="addCoins"]');
	await wait(200);
	check('+ presses the sheet\'s add-coins', JSON.stringify(calls[calls.length - 1]) === JSON.stringify(['sheet button', 'add-coins']), last());
	check('...and leaves no sheet behind', !sheet.rendered && !document.getElementById(sheet.id));
	await press('[data-act="removeCoins"]');
	await wait(200);
	check('− presses the sheet\'s remove-coins', JSON.stringify(calls[calls.length - 1]) === JSON.stringify(['sheet button', 'remove-coins']), last());
	sheet.render = originalRender;
	const sameRight = [...stage().querySelectorAll('select[data-pick="carry"]')].map((s) => Math.round(s.getBoundingClientRect().right));
	check('the pickers line up', new Set(sameRight).size === 1, sameRight);

	const search = () => stage().querySelector('[data-browse]');
	await press('[data-act="browseEquipment"]');
	check('Browse opens the equipment tab', last()?.[0] === 'browser.open' && last()[1].filter === filter, last());
	check('...clearing any old search', filter.search.text === '', filter.search.text);
	search().value = '  medi-gel ';
	await press('[data-act="browseEquipment"]');
	check('Browse searches for what was typed', filter.search.text === 'medi-gel', filter.search.text);
	calls.length = 0;
	search().value = 'armor';
	search().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
	await wait(60);
	check('Enter does the same', last()?.[0] === 'browser.open' && filter.search.text === 'armor', filter.search.text);

	hud.setPower(false, { silent: true });
	return out;
});
await browser.close();

for (const r of results) if (!r.ok) console.log(`FAIL ${r.name} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length + errors.length;
console.log('errors:', errors.length ? errors : 'none');
console.log(failed ? `FAIL: ${failed} of ${results.length}` : `PASS: ${results.length} checks`);
process.exit(failed ? 1 : 0);
