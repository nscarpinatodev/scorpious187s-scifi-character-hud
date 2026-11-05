/**
 * Pre-flight checks, run with `node tools/check.mjs`.
 *
 * Catches the mistakes that only show up in Foundry otherwise: malformed JSON, an i18n key
 * used in code but missing from lang/en.json, a stylesheet or script the manifest lists but
 * the repo does not have, and unbalanced braces in CSS.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const fail = (msg) => problems.push(msg);

/* ---- manifest ---- */
const manifest = JSON.parse(readFileSync(join(root, 'module.json'), 'utf8'));
for (const file of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map((l) => l.path)]) {
	if (!existsSync(join(root, file))) fail(`module.json lists a missing file: ${file}`);
}

/* ---- language ---- */
const lang = JSON.parse(readFileSync(join(root, 'lang/en.json'), 'utf8'));
const langKeys = new Set(Object.keys(lang));

const walk = (dir, out = []) => {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) walk(path, out);
		else out.push(path);
	}
	return out;
};

const scripts = walk(join(root, 'scripts')).filter((f) => f.endsWith('.mjs'));
const used = new Set();
for (const file of scripts) {
	const src = readFileSync(file, 'utf8');
	for (const m of src.matchAll(/['"`](SFH\.[A-Za-z0-9._]+)['"`]/g)) used.add(m[1]);
}
for (const key of used) if (!langKeys.has(key)) fail(`i18n key used in code but missing from en.json: ${key}`);
for (const key of langKeys) if (!used.has(key)) fail(`i18n key in en.json that no script uses: ${key}`);

/* ---- styles ---- */
for (const file of manifest.styles) {
	const css = readFileSync(join(root, file), 'utf8');
	const open = (css.match(/\{/g) ?? []).length;
	const close = (css.match(/\}/g) ?? []).length;
	if (open !== close) fail(`${file}: unbalanced braces (${open} open, ${close} close)`);
	// a pseudo-element inside :is(), :where() or :not() makes the whole rule invalid, silently
	for (const m of css.matchAll(/:(?:is|where|not)\([^)]*::/g)) {
		fail(`${file}: a pseudo-element inside ${m[0].split('(')[0]}() drops the whole rule (line ${css.slice(0, m.index).split('\n').length})`);
	}
}

/* ---- every font a stylesheet points at is there, and every font has its license beside it ---- */
for (const file of manifest.styles) {
	const css = readFileSync(join(root, file), 'utf8');
	for (const [, url] of css.matchAll(/url\("?(\.\.\/fonts\/[^")]+)"?\)/g)) {
		if (!existsSync(join(root, 'styles', url))) fail(`${file} points at a missing font: ${url}`);
	}
}
const fontDir = join(root, 'fonts');
for (const font of existsSync(fontDir) ? readdirSync(fontDir) : []) {
	if (!/\.(woff2|ttf)$/.test(font)) continue;
	const license = `OFL-${font.split(/[-.]/)[0].toLowerCase()}.txt`;
	if (!existsSync(join(fontDir, license))) fail(`fonts/${font} has no ${license} beside it`);
}

/* ---- the palette every device must define (the omni-tool's is the unqualified default) ---- */
const deviceCss = readFileSync(join(root, 'styles/device.css'), 'utf8');
const required = ['--sfh-bg-rgb', '--sfh-hot', '--sfh-glow', '--sfh-bright', '--sfh-text', '--sfh-dim', '--sfh-line',
	'--sfh-line-2', '--sfh-hover', '--sfh-panel', '--sfh-cell', '--sfh-acc', '--sfh-bad', '--sfh-face', '--sfh-display', '--sfh-mono'];
const { DEVICES } = await import(new URL('../scripts/constants.mjs', import.meta.url));
// a look keeps its whole palette in styles/looks.css, over its device's
const looksCss = existsSync(join(root, 'styles/looks.css')) ? readFileSync(join(root, 'styles/looks.css'), 'utf8') : '';
for (const [device, def] of Object.entries(DEVICES)) {
	const [css, file, selector] = def.base
		? [looksCss, 'styles/looks.css', `body[data-sfh-device][data-sfh-look="${device}"] {`]
		: [deviceCss, 'styles/device.css', device === 'omni' ? 'body[data-sfh-device] {' : `body[data-sfh-device="${device}"] {`];
	const block = css.split(selector)[1]?.split('}')[0] ?? '';
	for (const prop of required) if (!block.includes(`${prop}:`)) fail(`device ${device} is missing ${prop} in ${file}`);
	if (def.base && !DEVICES[def.base]) fail(`look ${device} dresses a device that does not exist: ${def.base}`);
	// the settings offer a category, then the looks in it
	if (!['scifi', 'fantasy'].includes(def.genre)) fail(`device ${device} has no category (genre: 'scifi' or 'fantasy') in scripts/constants.mjs`);
	if (def.base && !manifest.styles.includes('styles/looks.css')) fail('module.json does not list styles/looks.css');
}

/* ---- the scene-control icons exist in the Font Awesome Foundry ships (when it is installed here) ---- */
const faCss = 'C:/Program Files/Foundry Virtual Tabletop/resources/app/public/fonts/fontawesome/css/all.min.css';
if (existsSync(faCss)) {
	const css = readFileSync(faCss, 'utf8');
	// aliases share a rule: `.fa-bolt,.fa-zap{--fa:...}`
	const icons = new Set([...css.matchAll(/(?:\.fa-[a-z0-9-]+,)*\.fa-[a-z0-9-]+\{--fa:/g)]
		.flatMap((m) => m[0].match(/\.fa-[a-z0-9-]+/g).map((c) => c.slice(4))));
	const { CONTROL_ICONS, TOOL_ICONS } = await import(new URL('../scripts/interface/controls.mjs', import.meta.url));
	const classes = [...Object.values(CONTROL_ICONS), ...Object.values(TOOL_ICONS).flatMap(Object.values)];
	for (const cls of classes) {
		const name = cls.split(' ').find((c) => c.startsWith('fa-') && !['fa-solid', 'fa-regular', 'fa-light', 'fa-thin', 'fa-duotone', 'fa-sharp'].includes(c))?.slice(3);
		if (!icons.has(name)) fail(`scripts/interface/controls.mjs: "${cls}" is not in Foundry's Font Awesome`);
	}
}

/* ---- report ---- */
if (problems.length) {
	console.error(`${problems.length} problem(s):`);
	for (const p of problems) console.error(` - ${p}`);
	process.exit(1);
}
console.log(`OK — ${scripts.length} scripts, ${langKeys.size} strings, ${manifest.styles.length} stylesheets.`);
