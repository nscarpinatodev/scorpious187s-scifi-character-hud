/*
 * The D&D 5e sheet harness's script: just enough of Foundry for sheet-tabs.mjs (the setting, the
 * system's id, the words), three sheets built as the system builds them, and Foundry's own tab
 * handling in miniature: a click on a tab lights it, shows its section, and names it on the sheet.
 */
const store = { sheetTabs: false };
globalThis.game = {
	system: { id: 'dnd5e' },
	settings: { get: (mod, key) => store[key] },
	i18n: { localize: (key) => key },
};

const { applySheetTabs, dressSheet } = await import('../scripts/interface/sheet-tabs.mjs');

/** The system's tabs part: templates/shared/sidebar-tabs.hbs, with the side its sheet class gives it. */
const tabsPart = (tabs, active) => `<nav class="tabs tabs-right" data-group="primary" data-application-part="tabs" aria-roledescription="Form Tab Navigation">${
	tabs.map(([id, label, icon]) => `<a class="item control ${id === active ? 'active' : ''}" data-action="tab" data-group="primary" data-tab="${id}" data-tooltip aria-label="${label}">${
		icon.startsWith('fa') ? `<i class="${icon}" inert></i>` : `<dnd5e-icon src="${icon}"></dnd5e-icon>`}</a>`).join('')}</nav>`;

const sections = (tabs, active, extra = '') => tabs.map(([id, label]) => `<section class="tab ${id} ${extra} ${id === active ? 'active' : ''}" data-group="primary" data-tab="${id}" data-application-part="${id}">
	<div class="filler" style="min-height:300px">${label}</div></section>`).join('');

const frame = (id, classes, style, title, content) => `<form id="${id}" class="application sheet dnd5e2 actor standard-form ${classes} vertical-tabs themed theme-light interactable" style="position:absolute;${style}">
	<header class="window-header">
		<i class="window-icon fa-fw fa-solid fa-user" inert></i>
		<h1 class="window-title">${title}</h1>
		<button type="button" class="header-control icon fa-solid fa-ellipsis-vertical" data-action="toggleControls" aria-label="Controls"></button>
		<button type="button" class="header-control icon fa-solid fa-xmark" data-action="close" aria-label="Close"></button>
	</header>
	<section class="window-content">${content}</section>
</form>`;

const CHARACTER = [
	['details', 'Details', 'fas fa-cog'], ['inventory', 'Inventory', 'systems/dnd5e/icons/svg/backpack.svg'],
	['features', 'Features', 'fas fa-list'], ['spells', 'Spells', 'fas fa-book'], ['effects', 'Effects', 'fas fa-bolt'],
	['biography', 'Biography', 'fas fa-feather'], ['bastion', 'Bastion', 'fas fa-chess-rook'], ['specialTraits', 'Special Traits', 'fas fa-star'],
];
const NPC = [
	['features', 'Features', 'fas fa-list'], ['inventory', 'Inventory', 'systems/dnd5e/icons/svg/backpack.svg'],
	['spells', 'Spells', 'fas fa-book'], ['effects', 'Effects', 'fas fa-bolt'], ['biography', 'Biography', 'fas fa-feather'],
	['specialTraits', 'Special Traits', 'fas fa-star'],
];
const VEHICLE = [
	['inventory', 'Inventory', 'systems/dnd5e/icons/svg/backpack.svg'], ['crew', 'Crew & Passengers', 'fas fa-users'],
	['effects', 'Effects', 'fas fa-bolt'], ['description', 'Description', 'fas fa-feather'],
];

const score = (abbr, flipped = false) => `<div class="ability-score ${flipped ? 'flipped' : ''}" data-ability="${abbr}">
	<a class="label rollable ability-check">${abbr}</a><div class="mod">+2</div><div class="score">14</div></div>`;

/**
 * The character: header, body (as _onFirstRender nests it), ability scores, warnings, tabs. The
 * header has the system's own controls in it, to be clicked. In the dark theme the system draws
 * the banner as a layer 300px tall over the top of the sheet (.window-content::before); in the
 * light theme it is the header's own background and there is no such layer. A test that is to see
 * what the layer covers has to put the sheet in the dark theme (theme-dark for theme-light).
 */
const character = (id, style, { optional = 0 } = {}) => frame(id, 'character tab-details', style, 'Vex Kaori', `
	<header class="sheet-header" data-application-part="header">
		<div class="left optional-ability-${optional}"><input type="text" name="name" class="document-name uninput" value="Vex Kaori"><div class="class roboto-upper">Fighter 5</div></div>
		<div class="right"><div class="level-badge badge">5</div>
			<button type="button" class="inspiration unbutton" data-action="toggleInspiration" aria-label="Inspiration"></button>
			<div><div class="sheet-header-buttons">
				<button type="button" class="short-rest gold-button" data-action="rest" aria-label="Short Rest"><i class="fa-solid fa-utensils" inert></i></button>
				<button type="button" class="long-rest gold-button" data-action="rest" aria-label="Long Rest"><i class="fa-solid fa-campground" inert></i></button>
			</div><div class="xp-label">XP</div><div class="xp-bar"></div></div></div>
	</header>
	<div class="sheet-body"><div class="main-content" data-container-id="main">
		<div class="sidebar" data-application-part="sidebar"><div class="card"><div class="filler" style="min-height:220px">Portrait</div></div></div>
		<div class="tab-body" data-container-id="tabs">${sections(CHARACTER, 'details', '')}</div>
	</div></div>
	<section class="ability-scores optional-ability-${optional}" data-application-part="abilityScores"><div class="rows">
		<div class="top">${['hon', 'san'].slice(0, optional).map((a) => score(a, true)).join('')}</div>
		<div class="bottom">${['str', 'dex', 'con', 'int', 'wis', 'cha'].map((a) => score(a)).join('')}</div>
	</div></section>
	<dialog class="warnings" data-application-part="warnings"></dialog>
	${tabsPart(CHARACTER, 'details')}`);

const npc = (id, style) => frame(id, 'npc tab-features', style, 'Goblin Boss', `
	<header class="sheet-header" data-application-part="header">
		<div class="left"><div class="portrait"><div class="filler" style="min-height:120px">Portrait</div></div><div class="bottom vitals"><div class="filler">AC · HP</div></div></div>
		<div class="right stats"><div class="top"><div class="filler">Goblin Boss · CR 1</div></div>
			<div class="middle ability-scores card flexrow">${['str', 'dex', 'con', 'int', 'wis', 'cha'].map((a) => `<div class="ability-score">${a}</div>`).join('')}</div>
			<div class="bottom"></div></div>
	</header>
	<div class="sheet-body"><div class="main-content" data-container-id="main">
		<div class="sidebar" data-application-part="sidebar"><div class="filler" style="min-height:200px">Skills</div></div>
		<div class="tab-body" data-container-id="tabs">${sections(NPC, 'features')}</div>
	</div></div>
	<dialog class="warnings" data-application-part="warnings"></dialog>
	${tabsPart(NPC, 'features')}`);

/** The vehicle: no header part; the collapser, the sidebar, the stations, the tabs, then the body. */
const vehicle = (id, style, stations = true) => frame(id, `vehicle tab-inventory ${stations ? 'has-stations' : ''}`, style, 'The Sea Ghost', `
	<button type="button" class="sidebar-collapser unbutton always-interactive" data-action="toggleSidebar" data-application-part="sidebarCollapser"><i class="fas fa-caret-left" inert></i></button>
	<aside class="sheet-sidebar" data-application-part="sidebar"><div class="portrait"><div class="filler" style="min-height:140px">Portrait</div></div><div class="name">The Sea Ghost</div></aside>
	<section class="sheet-stations" data-application-part="stations"><div class="filler" style="min-height:200px">Stations</div></section>
	${tabsPart(VEHICLE, 'inventory')}
	<div class="sheet-body"><div class="main-content" data-container-id="main">
		<div class="tab-body" data-container-id="tabs">${sections(VEHICLE, 'inventory')}</div>
	</div></div>`);

document.body.insertAdjacentHTML('beforeend', [
	character('sheet-character', 'left:20px;top:20px;width:800px;height:860px'),
	npc('sheet-npc', 'left:860px;top:20px;width:700px;height:700px'),
	vehicle('sheet-vehicle', 'left:860px;top:760px;width:1000px;height:800px'),
].join(''));

/* Foundry's changeTab, and the class the system keeps on the sheet for the tab that is open */
document.addEventListener('click', (event) => {
	const tab = event.target.closest('[data-action="tab"]');
	const sheet = tab?.closest('.application');
	if (!sheet) return;
	for (const el of sheet.querySelectorAll('nav.tabs > .item, .tab-body > .tab')) el.classList.toggle('active', el.dataset.tab === tab.dataset.tab);
	for (const name of [...sheet.classList]) if (name.startsWith('tab-')) sheet.classList.remove(name);
	sheet.classList.add(`tab-${tab.dataset.tab}`);
});

/** The system redrawing its tabs part: a fresh nav, as its template writes it, and the render hook after. */
const redrawTabs = (sheet) => {
	const old = sheet.querySelector('nav.tabs');
	const active = old.querySelector('.item.active')?.dataset.tab;
	const list = sheet.classList.contains('character') ? CHARACTER : sheet.classList.contains('npc') ? NPC : VEHICLE;
	old.insertAdjacentHTML('afterend', tabsPart(list, active));
	old.remove();
	dressSheet(sheet);
};

const set = (on) => { store.sheetTabs = on; applySheetTabs(); };
globalThis.SFH5 = { store, set, applySheetTabs, dressSheet, redrawTabs, builders: { character, npc, vehicle } };
applySheetTabs();
