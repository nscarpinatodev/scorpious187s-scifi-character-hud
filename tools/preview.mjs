/** Screenshot the harness in several states. node tools/preview.mjs */
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
await page.setViewport({ width: 1240, height: 860 });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file:///' + join(root, 'tools/harness.html').split('\\').join('/'));
await new Promise(r => setTimeout(r, 1500));
const wait = ms => new Promise(r => setTimeout(r, ms));
const shot = async () => await (await page.$('#app')).screenshot();
const shots = [];
await page.evaluate(() => harness.hover('a1')); await wait(300); shots.push(await shot());           // omni wide + readout
await page.evaluate(() => harness.set('chrome', 'clean')); await wait(400); shots.push(await shot()); // panels only
await page.evaluate(() => { harness.set('chrome', 'full'); harness.width(900); }); await wait(600); shots.push(await shot());  // compact
await page.evaluate(() => harness.drawer(true)); await wait(500); shots.push(await shot());           // drawer open
await page.evaluate(() => { harness.width(1160); harness.set('defaultTheme', 'wrist'); }); await wait(700); shots.push(await shot());
await page.evaluate(() => harness.set('defaultTheme', 'gdi')); await wait(700); shots.push(await shot());
console.log('errors:', errors.length ? errors.slice(0, 6) : 'none');
const imgs = await Promise.all(shots.map(b => sharp(b).resize(600, null, { fit: 'inside' }).toBuffer()));
const m = await sharp(imgs[0]).metadata();
await sharp({ create: { width: 3 * 610, height: 2 * (m.height + 10), channels: 3, background: '#181818' } })
  .composite(imgs.map((b, i) => ({ input: b, left: (i % 3) * 610, top: Math.floor(i / 3) * (m.height + 10) })))
  .png().toFile(join(root, 'tools/preview.png'));
await browser.close();
