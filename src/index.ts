
/**
 * crane_crawler.ts
 *
 * A web scraper for Immersive Chinese (https://console.immersivechinese.com/) that:
 * 1. Automates Google login via Playwright (user intervenes only to complete 2FA).
 * 2. Crawls every “Lesson” in the Serial Course list.
 * 3. Extracts each phrase’s pinyin, simplified Chinese, translation, notes, audio-fast & audio-slow URLs.
 * 4. Assembles all rows into a CSV via danfojs-node.
 *
 * Uses:
 * • crawlee v2’s PlaywrightCrawler for dynamic navigation and rate-limiting.
 * • danfojs-node for DataFrame aggregation & CSV export.
 * • got-scraping for lightweight fetch of raw HTML (alternative to Playwright for static pages).
 * • simplecrawler (commented out) as an alternative for pure HTTP crawling.
 *
 * Installation:
 *   yarn add crawlee playwright danfojs-node got-scraping simplecrawler
 *
 * Usage:
 *   npx ts-node crane_crawler.ts --output output.csv
 *
 * Intuition:
 * • PlaywrightCrawler gives us headful browsing so we can handle Google OAuth flows.
 * • We pause for the human to finish Google login only once, then reuse the same session for all lesson pages.
 * • We collect data into an array of objects, then DataFrame for easy CSV.
 * • got-scraping could be swapped in for faster static HTML fetch if Google cookies are saved.
 */

import { PlaywrightCrawler, RequestQueue, Router, log } from 'crawlee';
import * as dfd from 'danfojs-node';
import * as fs from 'fs';
import got from 'got-scraping';
// import * as Crawler from 'simplecrawler'; // Alternative: pure HTTP crawler, but OAuth makes it tricky

interface PhraseRow {
  lesson: string;
  pinyin: string;
  chinese: string;
  translation: string;
  notes: string;
  audioFast: string;
  audioSlow: string;
}

async function main() {
  // 1️⃣ Create a queue to manage lesson-list and lesson-detail URLs
  const requestQueue = await RequestQueue.open();

  // 2️⃣ Launch a PlaywrightCrawler to handle dynamic login + scraping
  const crawler = new PlaywrightCrawler({
    launchContext: { headless: false }, // headful to allow Google login
    async preNavigation({ page, enqueueLinks }) {
      // Once at root, intercept login via Google
      if (page.url().includes('console.immersivechinese.com/login')) {
        log.info('➡️ Please click "Login with Google" and finish auth, then press ENTER in console');
        await waitForKeypress();
      }
    },
    requestHandler: async ({ page, request, enqueueLinks, log }) => {
      const url = request.url;
      log.info(`🔍 Crawling ${url}`);

      if (url.endsWith('/serial-course')) {
        // 1st page: list of lessons
        // Enqueue each lesson list-group-item
        const lessonLinks = await page.$$eval('#list-tab a.list-group-item', els => els.map(a => (a as HTMLAnchorElement).href));
        for (const link of lessonLinks) {
          await requestQueue.addRequest({ url: link, userData: { label: 'lesson-page' } });
        }
      }
      else if (request.userData.label === 'lesson-page') {
        // Detail page: loop through each phrase slider
        const lessonTitle = await page.$eval('.serial_course_title div', el => el.textContent.trim());
        const slides = await page.$$('[id^=main_slide-]');
        for (const slide of slides) {
          const pinyin = await slide.$eval('tr.pinyin .show_pinyin_text', el => el.textContent.trim());
          const chinese = await slide.$eval('tr.chinese_characters .show_simplified_characters_text', el => el.textContent.trim());
          const translation = await slide.$eval('tr.english .show_translation_characters_text', el => el.textContent.trim());
          // notes may be missing
          const notes = await slide.$$eval('.parent_lesson_note .lesson_note_div', els => els.length ? els[0].textContent.trim() : '');
          const audioFast = await slide.evaluate(el => el.getAttribute('data-audio-fast'));
          const audioSlow = await slide.evaluate(el => el.getAttribute('data-audio-slow'));
          rows.push({ lesson: lessonTitle, pinyin, chinese, translation, notes, audioFast, audioSlow });
        }
      }
    },
    // Optional: handle errors
    failedRequestHandler: async ({ request }) => {
      log.error(`❌ Request ${request.url} failed too many times`);
    }
  });

  // 3️⃣ Start by enqueuing the serial-course root URL
  await requestQueue.addRequest({ url: 'https://console.immersivechinese.com/serial-course', userData: { label: 'root' } });

  const rows: PhraseRow[] = [];

  // Run the crawler
  await crawler.run();

  // 4️⃣ After crawling: build DataFrame & write CSV
  const df = new dfd.DataFrame(rows);
  // Clean undesirable symbols: remove extra whitespace, curly HTML entities
  df['pinyin'] = df['pinyin'].str.replace(/\s+/g, ' ');

  // Save CSV
  const csv = await df.toCSV({ header: true });
  fs.writeFileSync('output.csv', csv, { encoding: 'utf8' });
  console.log('✅ CSV written to output.csv');
}

// Helper: wait for user key press in console
function waitForKeypress(): Promise<void> {
  return new Promise(resolve => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      resolve();
    });
  });
}

// Kick off
main().catch(err => {
  console.error(err);
  process.exit(1);
});

/**
 * Alternative approaches:
 *
 * 1) Use crawlee.CheerioCrawler + got-scraping:
 *    - Save cookies from a manual Playwright login, then reload them into got-scraping.
 *    - Faster headless runs as no browser engine.
 *
 * 2) Use simplecrawler (commented) for pure HTTP:
 *    - E.g.:
 *      const c = new Crawler('https://console.immersivechinese.com/serial-course');
 *      c.on('fetchcomplete', ... )
 *    - But handling OAuth & JS-driven UI is much more complex.
 */
