# Crane Crawler

**A web crawler for Immersive Chinese**

Built to gather all sentences, vocabulary, audio, and notes from Immersive Chinese into a single structured dataset. Exports data in CSV, TSV, JSON, XML, and XLSX formats—ready for flashcards, spaced-repetition apps, or further analysis.

---


## 🎯 Overview

Crane Crawler is a TypeScript-based web crawler that automates scraping of the [Immersive Chinese](https://console.immersivechinese.com/) serial‑course, one of the best websites for learning Chinese without a teacher. It handles both free and premium (locked) lessons, extracts pinyin, characters, English translations, notes, and audio URLs for each sentence, and saves everything in multiple export formats.

This makes it easy to:

- Build your own flashcards or decks for Anki, Quizlet, etc.
- Perform data analysis on sentence frequency or vocabulary progression.
- Generate custom pronunciation drills or listening practice.

---

## 🛠️ Technologies & Why We Chose Them

| Technology                 | Benefit & Alternative Comparison                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript**             | Static types catch bugs early; modern ES support. Vs. plain JavaScript—better maintainability and editor help.                                              |
| **Node.js (ES2019)**       | Event-driven, non-blocking I/O—perfect for high‑throughput scraping. Vs. Python—JS ecosystem aligns with web tech.                                          |
| **Yarn**                   | Fast, deterministic installs with lockfile. Vs. npm—locking and monorepo workflows are more stable.                                                         |
| **Crawlee**                | High‑level crawler framework with built‑in queueing, retries, and browser support. Vs. simplecrawler—extends Playwright.                                    |
| **Playwright/Chromium**    | Real browser context enables login, dynamic content, and audio attribute extraction. Vs. Puppeteer—similar, but Playwright’s cross‑browser APIs are richer. |
| **ExcelJS**                | Write XLSX natively from Node.js. Vs. CSV-only libraries—gives users spreadsheet output ready for review.                                                   |
| **Cheerio & got-scraping** | Optional lightweight HTML parsing for non-JS pages—faster for static endpoints. Vs. pure browser—less overhead.                                             |
| **danfojs-node**           | (Optional) Dataframe-like API in Node.js for in‑process data analysis or transformations. Vs. manual array handling.                                        |

---

## 🔧 Prerequisites

- **Node.js** (v14+)
- **Yarn** (latest)
- A **remote SSH server** (e.g., Kubernetes cluster) if running headlessly in production.

---

## 🏁 Installation

```bash
# Clone repository
git clone git@github.com:AnrPg/crane_crawler.git
cd crane_crawler

# Install dependencies
yarn install
```

---

## ⚙️ Configuration

1. **Credentials**: Create a `.env` file in the project root:
   ```ini
   IMM_CHINESE_EMAIL=you@example.com
   IMM_CHINESE_PASSWORD=YourPassword123
   ```
2. **user-data Directory**: By default the crawler uses `user-data/` for Playwright’s profile (to persist cookies and avoid re-login). Adjust in `src/index.ts` if needed.
3. **tsconfig.json**: Targets ES2019, `commonjs` module. Feel free to tweak for newer targets or ESM modules.

---

## 📖 Usage

### Development

```bash
yarn dev
```

Runs the crawler directly with `ts-node`, showing verbose logs.

### Build & Run

```bash
yarn build
yarn start
```

Transpiles to `dist/` and runs via `node dist/index.js`.

### Scripts

- `yarn lint` — ESLint the codebase.
- `yarn format` — Apply Prettier formatting.
- `yarn audit` — Check for vulnerable dependencies.

---

## 🧩 How It Works

1. **Entry Point**: `src/index.ts` calls `main()`, opening a Crawlee `RequestQueue`.
2. **Login Hook**: In `preNavigationHooks`, we detect the `/login` URL and perform an email+password login automatically, waiting for `networkidle`.
3. **Root Handler**:
   - Visits the homepage (`/serial-course`).
   - Queues each lesson link with label `lesson-page`.
4. **Lesson Handler**:
   - Reads `.serial_course_title` to assign an incremental lesson order.
   - Selects each slide (`[id^=main_slide-]`), extracting:
     - **Pinyin**, **Simplified Chinese**, **Translation**, **Notes**
     - **Audio URLs** (`data-audio-fast`, `data-audio-slow`)
   - Pushes rows into an in-memory array of `PhraseRow`.
5. **After Crawl**:
   - Sort rows by lesson number, slide index.
   - Write outputs:
     - **CSV**, **TSV**: Simple delimited text—great for quick imports.
     - **JSON**: Full object dump with typed fields.
     - **XML**: Encoded for legacy integrations.
     - **XLSX**: Excel spreadsheet via `ExcelJS`.

**Key Utility Functions**:

- `getLessonOrder(title: string)`: Ensures lesson titles map to sequential lesson IDs, even if ordering on the site changes.
- `escapeXml(str: string)`: Safely encodes text for XML output.

---

## 🎓 Export & Flashcards

- **CSV/TSV**: Import into Anki or other spaced-repetition software.
- **JSON**: Use custom scripts to transform into `.apkg` or cloud‑sync formats.
- **XLSX**: Review and curate manually in Excel/LibreOffice before import.

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push and open a Pull Request

---

## 📄 License

This project is [ISC](https://opensource.org/licenses/ISC)-licensed. Feel free to use and modify as you see fit.

---

> *“Immersive Chinese is the best website I have found so far for learning Chinese without a teacher.”*

**The scraped data are not included in the commits here to comply with Copyright regulations related to the site's premium (paid) content. Use the script at your own descretion/risk!**
Actually, to download the premium content, one should have an active, paid subscription.
---

## 🚀 Author

Apostolos Rigas

