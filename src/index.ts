
import { PlaywrightCrawler, RequestQueue, log, Request } from 'crawlee';
import type { Page, ElementHandle } from 'playwright';
import * as fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

interface PhraseRow {
  lessonTitle: string;
  lessonNum: number;
  slideIndex: number;
  pinyin: string;
  chinese: string;
  translation: string;
  notes: string;
  audioFast: string;
  audioSlow: string;
}

const lessonOrder = new Map<string, number>();
let nextOrder = 1;

function getLessonOrder(lessonTitle: string): number {
  if (!lessonOrder.has(lessonTitle)) {
    lessonOrder.set(lessonTitle, nextOrder++);
  }
  return lessonOrder.get(lessonTitle)!;
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"\\]/g, c => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;'
  }[c] as string));
}


async function main() {
  log.info('🔧 Starting main()');

  const rows: PhraseRow[] = [];
  log.info('Rows array initialized');

  const requestQueue = await RequestQueue.open();
  log.info('RequestQueue opened');

  const userDataDir = path.resolve(__dirname, '../user-data');
  log.info(`Using userDataDir: ${userDataDir}`);

  const crawler = new PlaywrightCrawler({
    requestQueue,
    launchContext: {
      launchOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      userDataDir,
    },
    preNavigationHooks: [
      async ({ page }: { page: Page }) => {
        log.info(`preNavigationHooks: at URL ${page.url()}`);
        if (page.url().includes('/login')) {
          log.info('➡️ Detected login page; performing login');

          // Minimal Changes Start Here: Email+Password Login Logic
          const EMAIL = 'aivc24014@uniwa.gr'; // Replace with your email
          const PASSWORD = 'tpeoC!!!12';       // Replace with your password

          // Filling the email and password fields based on HTML provided
          await page.waitForSelector('input[name="email"]', { timeout: 30000 });
          await page.type('input[name="email"]', EMAIL, { delay: 50 });

          await page.waitForSelector('input[name="password"]', { timeout: 30000 });
          await page.type('input[name="password"]', PASSWORD, { delay: 50 });

          // Click the login button
          await page.click('button[type="submit"]');

          // Wait for navigation after login
          await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 });
          log.info('✅ Logged in successfully via email+password');
        }
      },
    ],
    requestHandler: async ({ page, request }: { page: Page; request: Request }) => {
      log.info(`🔍 requestHandler start for ${request.url}`);

      if (request.userData.label === 'root') {
        log.info('→ Handling HOME/SERIAL-COURSE list page');
        await page.waitForSelector('a.open_lesson');
        const lessonLinks = await page.$$eval(
          'a.open_lesson',
          (els: Element[]) => els.map((a) => (a as HTMLAnchorElement).href)
        );

        for (const link of lessonLinks) {
          await requestQueue.addRequest({
            url: link,
            userData: { label: 'lesson-page' },
          });
        }

      } else if (request.userData.label === 'lesson-page') {
        const lessonTitle = await page.$eval(
          '.serial_course_title',
          (el: Element) => el.textContent!.trim()
        );
        const lessonOrderNum = getLessonOrder(lessonTitle);

        const slides = (await page.$$('[id^=main_slide-]')) as ElementHandle<Element>[];

        for (let idx = 0; idx < slides.length; idx++) {
          const slideHandle = slides[idx];
          const slideIndex = idx + 1;

          const pinyin = await slideHandle.$eval(
            'tr.pinyin .show_pinyin_text',
            (el: Element) => el.textContent?.trim().replace(/,/g, '') ?? ''
          );
          const chinese = await slideHandle.$eval(
            'tr.chinese_characters .show_simplified_characters_text',
            (el: Element) => el.textContent?.trim().replace(/,/g, '') ?? ''
          );
          const translation = await slideHandle.$eval(
            'tr.english .show_translation_characters_text',
            (el: Element) => el.textContent?.trim().replace(/,/g, '') ?? ''
          );
          const notes = (
            await slideHandle.$$eval(
              '.parent_lesson_note .lesson_note_div',
              (els: Element[]) => (els[0]?.textContent || '').trim().replace(/,/g, '')
            )
          ) || '';

          const audioFast = (await slideHandle.getAttribute('data-audio-fast')) || '';
          const audioSlow = (await slideHandle.getAttribute('data-audio-slow')) || '';

          rows.push({ lessonTitle, lessonNum: lessonOrderNum, slideIndex, pinyin, chinese, translation, notes, audioFast, audioSlow });
        }
      }
    },
    failedRequestHandler: async ({ request }) => {
      log.error(`❌ Request ${request.url} failed too many times`);
    },
  });

  await requestQueue.addRequest({
    url: 'https://console.immersivechinese.com/',
    userData: { label: 'root' },
  });

  log.info('🏃 Starting crawler.run()');
  await crawler.run();
log.info('🏁 crawler.run() finished');

  if (rows.length === 0) return;

  rows.sort((a, b) => a.lessonNum - b.lessonNum || a.slideIndex - b.slideIndex);
  const headers = Object.keys(rows[0]) as Array<keyof PhraseRow>;

  // CSV
  const csvLines = [headers.join(','), ...rows.map(r =>
    headers.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join(',')
  )];
  fs.writeFileSync('output.csv', csvLines.join('\n'), 'utf8');
  log.info(`✅ CSV written to output.csv (${rows.length} rows)`);

  // TSV
  const tsvLines = [headers.join('\t'), ...rows.map(r =>
    headers.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join('\t')
  )];
  fs.writeFileSync('output.tsv', tsvLines.join('\n'), 'utf8');
  log.info(`✅ TSV written to output.tsv (${rows.length} rows)`);

  // JSON
  fs.writeFileSync('output.json', JSON.stringify(rows, null, 2), 'utf8');
  log.info(`✅ JSON written to output.json (${rows.length} rows)`);

  // XML
  const xmlItems = rows.map(r => {
    const fields = headers.map(h => `<${h}>${escapeXml(String(r[h]))}</${h}>`).join('');
    return `<row>${fields}</row>`;
  });
  fs.writeFileSync('output.xml', `<?xml version="1.0"?><rows>${xmlItems.join('')}</rows>`, 'utf8');
  log.info(`✅ XML written to output.xml (${rows.length} rows)`);

  // Excel
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Data');
  sheet.addRow(headers);
  rows.forEach(r => sheet.addRow(Object.values(r)));
  await workbook.xlsx.writeFile('output.xlsx');
  log.info(`✅ XLSX written to output.xlsx (${rows.length} rows)`);
}

main().catch(err => {
  log.error('Fatal error in main()', err);
  process.exit(1);
});
