import { createRequire } from 'module';
const require = createRequire('C:/Users/djsco/OneDrive/Documents/GitHub/mass-effect-sf2e-conversion/package.json');
const puppeteer = require('puppeteer-core');
const files = [
  'C:/Users/djsco/AppData/Local/FoundryVTT/Data/modules/scorpious187s-scifi-character-hud/styles/hud-sheet.css',
  'C:/Users/djsco/AppData/Local/FoundryVTT/Data/modules/scorpious187s-scifi-character-hud/styles/hud-core.css',
];
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
for (const f of files) {
  const css = (await import('node:fs')).readFileSync(f, 'utf8');
  const info = await page.evaluate((text) => {
    const style = document.createElement('style');
    style.textContent = text;
    document.head.appendChild(style);
    const rules = [...style.sheet.cssRules];
    return { count: rules.length, selectors: rules.filter(r => r.selectorText).map(r => r.selectorText).slice(0, 6) };
  }, css);
  console.log(f.split('/').pop(), info.count, 'rules');
  console.log('  first:', info.selectors.join(' | '));
}
await browser.close();
