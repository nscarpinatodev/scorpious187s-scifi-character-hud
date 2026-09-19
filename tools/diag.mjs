import { createRequire } from 'module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 900 });
await page.goto('file:///' + join(root, 'tools/harness-hud.html').split(String.fromCharCode(92)).join('/'));
await new Promise(r => setTimeout(r, 1200));
for (const size of ['wide', 'compact']) {
  await page.evaluate((s) => harness.size(s), size);
  await new Promise(r => setTimeout(r, 400));
  const info = await page.evaluate(() => {
    const f = document.querySelector('.sfh-hud');
    const cs = getComputedStyle(f);
    const box = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return `${Math.round(r.x)},${Math.round(r.width)}`; };
    return {
      size: f.dataset.size,
      cols: cs.gridTemplateColumns,
      areas: cs.gridTemplateAreas.slice(0, 90),
      asideCount: document.querySelectorAll('[data-slot="aside"]').length,
      asideAll: [...document.querySelectorAll('[data-slot="aside"]')].map(e => { const r = e.getBoundingClientRect(); return `${e.className}|${Math.round(r.x)},${Math.round(r.width)}`; }),
      aside: box('[data-slot="aside"]'),
      proj: box('[data-slot="projection"]'),
      readout: box('[data-slot="readout"]'),
      appWidth: Math.round(document.getElementById('app').getBoundingClientRect().width),
    };
  });
  console.log(info);
}
await browser.close();
