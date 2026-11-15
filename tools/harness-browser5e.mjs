/*
 * The D&D 5e compendium browser harness's script: just enough of Foundry for sheet-tabs.mjs (the
 * setting, the system's id, the words), the browser built as the system builds it, and its tab
 * handling in miniature: a click on a tab lights it, and the Advanced toggle redraws the tabs part
 * with the other set of tabs, as the system does.
 */
const store = { sheetTabs: false };
globalThis.game = {
	system: { id: 'dnd5e' },
	settings: { get: (mod, key) => store[key] },
	i18n: { localize: (key) => key },
};

const { applySheetTabs, dressSheet } = await import('../scripts/interface/sheet-tabs.mjs');

/* CompendiumBrowser.TABS, labels as the English words have them */
const BASIC = [
	['classes', 'Classes', 'systems/dnd5e/icons/svg/items/class.svg', 'Item', 'class'],
	['subclasses', 'Subclasses', 'systems/dnd5e/icons/svg/items/subclass.svg', 'Item', 'subclass'],
	['races', 'Species', 'systems/dnd5e/icons/svg/items/race.svg', 'Item', 'race'],
	['feats', 'Feats', 'fas fa-star', 'Item', 'feat'],
	['backgrounds', 'Backgrounds', 'systems/dnd5e/icons/svg/items/background.svg', 'Item', 'background'],
	['physical', 'Items', 'systems/dnd5e/icons/svg/backpack.svg', 'Item', 'physical'],
	['spells', 'Spells', 'fas fa-book', 'Item', 'spell'],
	['monsters', 'Monsters', 'systems/dnd5e/icons/svg/actors/npc.svg', 'Actor', 'npc'],
	['vehicles', 'Vehicles', 'systems/dnd5e/icons/svg/actors/vehicle.svg', 'Actor', 'vehicle'],
];
const ADVANCED = [
	['actors', 'Actors', 'systems/dnd5e/icons/svg/actors/npc.svg', 'Actor', ''],
	['items', 'Items', 'systems/dnd5e/icons/svg/backpack.svg', 'Item', ''],
];

/** templates/compendium/browser-tabs.hbs, as the tabs part: its classes and id from PARTS. */
const tabsPart = (id, tabs, active) => `<nav data-group="primary" class="tabs tabs-left" id="${id}-tabs" data-application-part="tabs">${
	tabs.map(([tab, label, icon, doc, types]) => `<a class="item control ${tab === active ? 'active' : ''}" data-group="primary" data-tab="${tab}" data-action="tab"
		data-tooltip aria-label="${label}" data-document-class="${doc}" data-types="${types}">${
		icon.startsWith('fa') ? `<i class="${icon}"></i>` : `<dnd5e-icon src="${icon}"></dnd5e-icon>`}</a>`).join('')}</nav>`;

const entry = (name, i) => `<li class="item" data-entry-id="e${i}"><div class="item-row"><div class="item-name"><img class="item-image gold-icon" alt=""><div class="name name-stacked"><span class="title">${name}</span><span class="subtitle">Wondrous Item</span></div></div>
	<div class="item-detail item-source">SRD 5.2</div><div class="item-detail item-controls"></div></div></li>`;

/** The browser: header (the Advanced toggle), the sidebar's three parts, the results, the footer, the tabs. */
const browser = (id, style, { locked = false, advanced = false, select = false } = {}) => {
	const tabs = advanced ? ADVANCED : BASIC;
	return `<form id="${id}" class="application dnd5e2 compendium-browser vertical-tabs dialog-lg themed theme-light" style="position:absolute;${style}">
	<header class="window-header">
		<i class="window-icon fa-fw fa-solid fa-book-open-reader" inert></i>
		<h1 class="window-title">Compendium Browser</h1>
		<button type="button" class="header-control fas fa-cog icon" data-action="configureSources" aria-label="Configure Sources"></button>
		<button type="button" class="header-control icon fa-solid fa-xmark" data-action="close" aria-label="Close"></button>
	</header>
	<section class="window-content">
		<div class="header" id="${id}-header" data-application-part="header"><div class="mode-toggle">${locked ? '' : `<slide-toggle class="mode-slider header-control" data-action="toggleMode" ${advanced ? 'checked' : ''} id="${id}-header-mode-toggle"></slide-toggle><label for="${id}-header-mode-toggle">Advanced</label>`}</div></div>
		<div id="sidebar" class="sidebar flexcol">
			<div class="filter-element" id="${id}-sidebar-search" data-application-part="search"><search><input type="text" name="name" placeholder="Search Results" value=""></search></div>
			<div id="${id}-sidebar-types" data-application-part="types"><div class="filler" style="min-height:120px">Types</div></div>
			<div id="${id}-sidebar-filters" data-application-part="filters"><div class="filler" style="min-height:300px">Filters</div></div>
		</div>
		<div class="results" id="${id}-results" data-application-part="results"><section class="inventory-element"><section class="items-list browser-results"><div class="items-section card">
			<div class="items-header header"><h3 class="item-name">Results</h3><div class="item-header item-source">Source</div><div class="item-header item-controls"></div></div>
			<ol class="item-list unlist">${['Bag of Holding', 'Cloak of Elvenkind', 'Flame Tongue', 'Ring of Warmth', 'Staff of the Magi', 'Wand of Fireballs', 'Oathbow', 'Potion of Healing', 'Rope of Climbing', 'Boots of Speed', 'Deck of Many Things', 'Sending Stones'].map(entry).join('')}</ol>
		</div></section></section></div>
		<div class="footer" id="${id}-footer" data-application-part="footer"><div class="flexrow">${select ? '<div class="count">Select 1 item</div><button type="submit">Select</button>' : ''}</div></div>
		${tabsPart(id, locked ? [] : tabs, advanced ? 'items' : 'physical')}
	</section>
</form>`;
};

document.body.insertAdjacentHTML('beforeend', [
	browser('browser-basic', 'left:80px;top:20px;width:850px;height:700px'),
	browser('browser-advanced', 'left:1000px;top:20px;width:850px;height:700px', { advanced: true, select: true }),
	browser('browser-locked', 'left:80px;top:760px;width:850px;height:700px', { locked: true }),
	browser('browser-narrow', 'left:1000px;top:760px;width:750px;height:700px'),
].join(''));

/** The system's icons, from where it is installed, for the stand-in of its icon element. */
const icons = () => {
	for (const icon of document.querySelectorAll('dnd5e-icon[src]')) {
		icon.style.setProperty('--sfh-svg', `url("file:///C:/Users/djsco/AppData/Local/FoundryVTT/Data/${icon.getAttribute('src')}")`);
	}
};
icons();

/* Foundry's changeTab: a click on a tab lights it */
document.addEventListener('click', (event) => {
	const tab = event.target.closest('[data-action="tab"]');
	const app = tab?.closest('.application');
	if (!app) return;
	for (const el of app.querySelectorAll('nav.tabs > .item')) el.classList.toggle('active', el.dataset.tab === tab.dataset.tab);
});

/** The Advanced toggle: the system redraws the tabs part with the other set, and the render hook runs after. */
const toggleMode = (app, advanced) => {
	const old = app.querySelector('nav.tabs');
	old.insertAdjacentHTML('afterend', tabsPart(app.id, advanced ? ADVANCED : BASIC, advanced ? 'items' : 'physical'));
	old.remove();
	icons();
	dressSheet(app);
};

const set = (on) => { store.sheetTabs = on; applySheetTabs(); };
globalThis.SFH5 = { store, set, applySheetTabs, dressSheet, toggleMode };
applySheetTabs();
