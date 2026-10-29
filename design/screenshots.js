const { chromium } = require('playwright');
const S = __dirname + '/demo';
const OUT = __dirname + "/../docs/screenshots";
const URL = process.env.URL || 'http://localhost:8099/';
(async () => {
  const b = await chromium.launch();
  const mk = async (opts = {}) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, ...opts });
    // skip the first-run welcome unless a shot is about it
    await c.addInitScript(() => localStorage.setItem('sih.prefs.v1', JSON.stringify({ setup: true })));
    return c;
  };
  const see = (p, t, ms = 8000) => p.locator(`text=${t}`).locator('visible=true').first().waitFor({ timeout: ms });
  const shot = async (p, name) => { await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };
  const signIn = async (p) => {
    await p.getByRole('button', { name: 'Me' }).last().click();
    await p.getByRole('button', { name: 'Sign in' }).last().click();
    await p.getByLabel('Phone number').fill('50 123 4567');
    await p.getByRole('button', { name: 'Send code' }).click();
    await p.getByLabel('Verification code').fill('123456');
    await p.getByLabel('Display name').fill('Yousef A.');
    await p.getByLabel('City').fill('Dubai Marina');
    await p.getByRole('button', { name: 'Phones' }).click();
    await p.getByRole('button', { name: 'Electronics' }).click();
    await p.getByRole('button', { name: 'Start browsing' }).click();
    await see(p, 'Within 10 km');
  };

  // ---- guest, light ----
  let ctx = await mk(); let p = await ctx.newPage();
  await p.goto(URL); await see(p, 'Within 10 km'); await p.waitForTimeout(800);
  await shot(p, '01-home');
  await p.getByText('iPhone 15 Pro 256GB').first().click(); await see(p, 'Natural titanium');
  await shot(p, '02-listing');
  await p.goBack();
  await p.getByRole('button', { name: 'Search' }).last().click();
  await p.getByLabel('Search listings').fill('apple');
  await p.getByRole('button', { name: 'Filters', exact: true }).click();
  await p.getByRole('button', { name: 'Like new' }).click().catch(() => {});
  await p.getByRole('button', { name: '25 km' }).last().click().catch(() => {});
  await p.getByLabel('Search listings').fill('macbok');
  await p.getByRole('button', { name: 'Filters', exact: true }).click();
  await see(p, 'MacBook Air M2');
  await shot(p, '03-search');
  await ctx.close();

  // ---- guest, dark ----
  ctx = await mk({ colorScheme: 'dark' }); p = await ctx.newPage();
  await p.goto(URL); await see(p, 'Within 10 km'); await p.waitForTimeout(800);
  await shot(p, '04-home-dark');
  await ctx.close();

  // ---- signed in ----
  ctx = await mk(); p = await ctx.newPage();
  await p.goto(URL); await see(p, 'Within 10 km');
  await signIn(p);
  // sell with AI autofill
  await p.getByRole('button', { name: 'Sell' }).last().click(); await see(p, 'New listing');
  const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.getByRole('button', { name: 'Add photos' }).click()]);
  await chooser.setFiles(S + '/photo.png');
  await see(p, 'We filled this in from your photo');
  await p.getByLabel('Title').fill('Sony wireless headphones');
  await p.getByLabel('Price (AED)').fill('450');
  await shot(p, '05-sell');
  await p.goBack();
  // offer, counter
  await p.goto(URL); await see(p, 'Within 10 km');
  await p.getByText('MacBook Air M2').first().click(); await see(p, 'Stay safe');
  await p.getByRole('button', { name: 'Make an offer' }).click();
  await p.getByLabel('Your offer (AED)').fill('3000');
  await p.getByRole('button', { name: 'Send offer' }).click();
  await see(p, 'AED 3,705', 9000);
  await shot(p, '06-chat-offer');
  await p.getByRole('button', { name: 'Accept' }).click();
  await see(p, 'Offer of AED 3,705 accepted');
  // seller page with reviews
  await p.goto(URL); await see(p, 'Within 10 km');
  await p.getByText('iPhone 15 Pro 256GB').first().click(); await see(p, 'Stay safe');
  await p.getByText('Maya K.').first().click(); await see(p, 'Reviews');
  await shot(p, '07-seller-reviews');
  // chats list
  await p.goto(URL); await see(p, 'Within 10 km');
  await p.getByRole('button', { name: /^Chats/ }).last().click(); await see(p, 'Maya K.');
  await shot(p, '08-chats');
  // moderation
  await p.getByRole('button', { name: 'Me' }).last().click();
  await p.getByRole('button', { name: 'Moderation' }).click(); await see(p, 'Automatic flag');
  await shot(p, '09-moderation');
  await ctx.close();

  // ---- Arabic ----
  ctx = await mk(); p = await ctx.newPage();
  await p.goto(URL); await see(p, 'Within 10 km');
  await p.getByRole('button', { name: 'Me' }).last().click();
  await p.getByRole('button', { name: 'Settings' }).click();
  await p.getByRole('button', { name: 'العربية' }).click(); await see(p, 'اللغة');
  await p.goBack(); await p.getByRole('button', { name: 'الرئيسية' }).last().click();
  await see(p, 'ضمن 10 كم'); await p.waitForTimeout(800);
  await shot(p, '10-home-arabic');
  await ctx.close();

  // ---- wide web ----
  ctx = await mk({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 }); p = await ctx.newPage();
  await p.goto(URL); await see(p, 'Within 10 km'); await p.waitForTimeout(1000);
  await shot(p, '11-web');
  await ctx.close();
  // looks and palettes
  const variants = [['12-home-classic', { look: 'classic' }, 'light'], ['13-home-black', { appearance: 'black', palette: 'ocean' }, 'light'], ['14-home-sunset', { palette: 'sunset' }, 'light'], ['15-home-royal-dark', { palette: 'royal' }, 'dark']];
  for (const [name, prefs, scheme] of variants) {
    ctx = await mk({ colorScheme: scheme });
    await ctx.addInitScript((v) => localStorage.setItem('sih.prefs.v1', v), JSON.stringify({ setup: true, ...prefs }));
    p = await ctx.newPage();
    await p.goto(URL); await see(p, 'Within 10 km'); await p.waitForTimeout(900);
    await shot(p, name);
    await ctx.close();
  }
  // first-run welcome, with the phone's location allowed (near Kandy)
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, geolocation: { latitude: 7.29, longitude: 80.63 }, permissions: ['geolocation'] });
  p = await ctx.newPage();
  await p.goto(URL); await see(p, 'Where are you?'); await p.waitForTimeout(700);
  await p.getByRole('button', { name: 'Use my location' }).first().click(); await see(p, 'Found you near');
  await shot(p, '16-welcome-where');
  await p.getByRole('button', { name: 'Continue' }).click(); await see(p, 'How should it look?');
  await shot(p, '17-welcome-look');
  await ctx.close();
  await b.close();
})().catch((e) => { console.error('SHOTS FAIL', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(1); });
