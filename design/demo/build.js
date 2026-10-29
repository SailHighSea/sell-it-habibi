// Renders the demo-listing illustrations (SVG) to small JPEGs in assets/demo. Needs Playwright:  node design/demo/build.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const here = __dirname;
const out = path.join(here, '..', '..', 'assets', 'demo');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 640 } });
  for (const f of fs.readdirSync(here).filter((n) => n.endsWith('.svg'))) {
    await page.setContent(`<html><body style="margin:0">${fs.readFileSync(path.join(here, f), 'utf8')}</body></html>`);
    await page.screenshot({ path: path.join(out, f.replace('.svg', '.jpg')), type: 'jpeg', quality: 82 });
  }
  await browser.close();
})();
