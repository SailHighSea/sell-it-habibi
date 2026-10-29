# Design sources

- `icon/` – SVG sources for the app icon (souk awning + price tag). `node design/icon/build.js` renders `assets/images/*` (needs Playwright).
- `demo/` – SVG illustrations used as demo-mode listing photos. `node design/demo/build.js` renders `assets/demo/*.jpg`. `photo.png` is the sample photo used for the Sell screenshot.
- `screenshots.js` – regenerates `docs/screenshots/` from the web build:
  `npx expo export -p web --output-dir /tmp/web-dist && (cd /tmp/web-dist && python3 -m http.server 8099 &) && node design/screenshots.js`
- `mockups.html`, `icons.html` – early mockups and icon proposals.
