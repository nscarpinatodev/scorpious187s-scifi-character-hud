/** Screenshot the 5e harness. node tools/preview-5e.mjs */
import { createRequire } from 'module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1120, height: 900 });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file:///' + join(root, 'tools/harness-hud.html').replaceAll('\\', '/'));
await new Promise(r => setTimeout(r, 1500));
const wait = ms => new Promise(r => setTimeout(r, ms));
const shot = async () => await (await page.$('#app')).screenshot();
const shots = [];
await wait(300); shots.push(await shot());                                   // details
await page.evaluate(() => harness.tab('inventory')); await wait(400); shots.push(await shot());
await page.evaluate(() => harness.tab('spells')); await wait(400); shots.push(await shot());
await page.evaluate(() => { harness.tab('details'); harness.set('defaultTheme', 'gdi'); }); await wait(500); shots.push(await shot());
await page.evaluate(() => { harness.set('defaultTheme', 'omni'); harness.size('compact'); }); await wait(600); shots.push(await shot());
console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
console.log('slots:', await page.evaluate(() => [...document.querySelectorAll('.sfh-frame > [data-slot]')].map(e => e.dataset.slot)));
const imgs = await Promise.all(shots.map(b => sharp(b).resize(560, null, { fit: 'inside' }).toBuffer()));
const metas = await Promise.all(imgs.map(b => sharp(b).metadata()));
const h = Math.max(...metas.map(m => m.height));
await sharp({ create: { width: 3 * 570, height: 2 * h + 10, channels: 3, background: '#181818' } })
  .composite(imgs.map((b, i) => ({ input: b, left: (i % 3) * 570, top: Math.floor(i / 3) * (h + 10) })))
  .png().toFile(join(root, 'tools/preview-hud.png'));
await browser.close();
