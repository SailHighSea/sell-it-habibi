// Renders the SVG sources in this folder into the PNGs the app uses (assets/images).
// Needs Playwright with Chromium:  node design/icon/build.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const here = __dirname;
const out = path.join(here, '..', '..', 'assets', 'images');

// [source svg, output png, pixel size, transparent background?]
const JOBS = [
  ['icon.svg', 'icon.png', 1024, false],
  ['adaptive-foreground.svg', 'android-icon-foreground.png', 1024, true],
  ['adaptive-background.svg', 'android-icon-background.png', 1024, false],
  ['adaptive-monochrome.svg', 'android-icon-monochrome.png', 1024, true],
  ['splash-light.svg', 'splash-icon.png', 1024, true],
  ['splash-dark.svg', 'splash-icon-dark.png', 1024, true],
  ['notification.svg', 'notification-icon.png', 96, true],
  ['icon.svg', 'favicon.png', 64, false],
];

(async () => {
  const browser = await chromium.launch();
  for (const [src, dest, size, transparent] of JOBS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    const svg = fs.readFileSync(path.join(here, src), 'utf8').replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`);
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await page.screenshot({ path: path.join(out, dest), omitBackground: transparent, clip: { x: 0, y: 0, width: size, height: size } });
    await page.close();
    console.log('wrote', dest, `${size}px`);
  }
  await browser.close();
})();
