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
}

/* ---- the palette every device must define (the omni-tool's is the unqualified default) ---- */
const deviceCss = readFileSync(join(root, 'styles/device.css'), 'utf8');
const required = ['--sfh-bg-rgb', '--sfh-hot', '--sfh-glow', '--sfh-bright', '--sfh-text', '--sfh-dim', '--sfh-line',
	'--sfh-line-2', '--sfh-hover', '--sfh-panel', '--sfh-cell', '--sfh-acc', '--sfh-face', '--sfh-mono'];
const { DEVICES } = await import(new URL('../scripts/constants.mjs', import.meta.url));
for (const device of Object.keys(DEVICES)) {
	const selector = device === 'omni' ? 'body[data-sfh-device] {' : `body[data-sfh-device="${device}"] {`;
	const block = deviceCss.split(selector)[1]?.split('}')[0] ?? '';
	for (const prop of required) if (!block.includes(`${prop}:`)) fail(`device ${device} is missing ${prop} in styles/device.css`);
}

/* ---- report ---- */
if (problems.length) {
	console.error(`${problems.length} problem(s):`);
	for (const p of problems) console.error(` - ${p}`);
	process.exit(1);
}
console.log(`OK — ${scripts.length} scripts, ${langKeys.size} strings, ${manifest.styles.length} stylesheets.`);
