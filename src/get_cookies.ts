// import { chromium } from 'playwright-extra';
// import stealth from 'puppeteer-extra-plugin-stealth';

// chromium.use(stealth());  // loads all stealth evasions :contentReference[oaicite:3]{index=3}

// (async () => {
//   // Persist your profile so you don’t re-auth every run
//   const context = await chromium.launchPersistentContext('auth-profile', {
//     headless: false,
//     args: [
//       '--no-sandbox',
//       '--disable-setuid-sandbox',
//       '--disable-blink-features=AutomationControlled',  // extra stealth flag
//     ],
//     // override UA to a real Chrome on Windows
//     userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
//                '(KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
//   });
//   const page = await context.newPage();
//   await page.goto('https://console.immersivechinese.com/');
//   // complete SSO here…
//   await context.storageState({ path: 'auth-state.json' });
//   await context.close();
// })();


import puppeteer from 'puppeteer';
import fs from 'fs';

async function getCookies() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto('https://console.immersivechinese.com/login', { waitUntil: 'networkidle0' });

  // 1) Grab the Google‑login href and navigate directly
  const loginHref = await page.$eval('a#googlelogin_check', (a: HTMLAnchorElement) => {
    a.removeAttribute('target');
    return a.href;
  });
  await page.goto(loginHref, { waitUntil: 'networkidle0' });

  // 2) Wait for either the email input OR the account‑chooser button
  //    We poll for whichever appears first, up to 30s:
  const start = Date.now();
  const timeout = 30_000;
  while (true) {
    // try email field
    if (await page.$('input[type="email"]')) break;
    // try “Use another account” button by its data‑identifier attribute
    const chooser = await page.$('div[jsname="B34EJ"]'); 
      // ← common jsname for that button; inspect and adjust if yours differs
    if (chooser) {
      await chooser.click();
      break;
    }
    if (Date.now() - start > timeout)
      throw new Error('Timed out waiting for email input or chooser');
    await new Promise(res => setTimeout(res, 200));
  }

  // 3) Now we know the email input is present
  await page.waitForSelector('input[type="email"]', { visible: true });
  await page.type('input[type="email"]', "TO BE FILLED MANUALLY OR FROM ENV VARS *********************************************************"!);
  await page.click('#identifierNext');

  // 4) Password
  await page.waitForSelector('input[type="password"]', { visible: true });
  await page.type('input[type="password"]', "TO BE FILLED MANUALLY OR FROM ENV VARS *********************************************************"!);
  await page.click('#passwordNext');

  // 5) Back in your app: wait for a known post‑login element
  await page.waitForSelector('.navbar', { visible: true });

  // 6) Dump cookies
  const cookies = await page.cookies();
  fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));

  await browser.close();
}

getCookies().catch(console.error);


// "regas,apn@gmail.com"
// "tpeoC!!!12"