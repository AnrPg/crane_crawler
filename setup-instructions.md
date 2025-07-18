# Setup Instructions

## Quick Start

1. **Clone the repository**

   ```bash
   git clone git@github.com:AnrPg/crane_crawler.git
   cd crane_crawler
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Set up environment variables**

   - Create a `.env` file in the project root with your login credentials:
     ```ini
     IMM_CHINESE_EMAIL=you@example.com
     IMM_CHINESE_PASSWORD=YourPassword123
     ```

4. **Install Playwright browsers**

   ```bash
   npx playwright install
   ```

5. **Run the crawler**

   - In development mode (with live TS compilation and verbose logs):
     ```bash
     yarn dev
     ```
   - Or build and start the production build:
     ```bash
     yarn build
     yarn start
     ```

---

## File Structure

```
crane_crawler/
├── src/
│   └── index.ts           # Main scraper script
├── dist/                  # Compiled output (after build)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── .eslintrc.js           # ESLint configuration
├── .gitignore             # Git ignore patterns
├── README.md              # Project documentation
└── setup-instructions.md  # This file
```

---

## Development Workflow

1. **Type checking**:
   ```bash
   yarn type-check
   ```
2. **Linting**:
   ```bash
   yarn lint
   ```
3. **Formatting**:
   ```bash
   yarn format
   ```
4. **Build for production**:
   ```bash
   yarn build
   ```
5. **Run tests** (if added later)
   ```bash
   yarn test
   ```

---

## Authentication

The crawler includes built-in login logic. Ensure your `.env` file is populated with valid credentials. Playwright’s `user-data/` profile folder will cache your session to avoid re-login on subsequent runs.

---

## Configuration & Customization

- **Selectors**: If the website’s HTML changes, update selectors in `src/index.ts`.
- **Crawl settings**: Adjust concurrency, timeouts, or retry logic by tweaking the `PlaywrightCrawler` options.
- **Output naming**: By default, outputs are written as `output.csv`, `output.tsv`, `output.json`, `output.xml`, and `output.xlsx` in the project root. You can rename or change destination paths in the code.

---

## Output Files

After a successful run, you’ll find:

- `output.csv`
- `output.tsv`
- `output.json`
- `output.xml`
- `output.xlsx`

Use these with flashcard tools (e.g., Anki), spreadsheets, or custom scripts for further processing.
