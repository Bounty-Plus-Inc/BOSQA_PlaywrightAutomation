# Playwright Folder Overview

Created: 2026-05-15

## Scope

This document summarizes the `d:\PlayWright` folder after reading the project-owned source, test, config, docs, and UI files, plus inventorying the generated and dependency folders.

The folder contains 3,567 files using about 104.8 MB. Most files are from `node_modules`, generated build output, Playwright reports, and screenshots.

## Top-Level Structure

| Path | Purpose |
| --- | --- |
| `src/` | React control panel for launching and viewing the Standard Regression Test. |
| `tests/` | Playwright specs, page-object classes, and test helpers. |
| `scripts/` | CLI helper for selecting headed or UI Playwright mode. |
| `docs/` | Existing visual documentation for the standard sales process. |
| `ui/` | Standalone static HTML mockup of the regression-test control panel. |
| `test-results/` | Latest Playwright result metadata and saved step screenshots. |
| `playwright-report/` | Generated HTML Playwright report. |
| `dist/` | Generated Vite production build. |
| `node_modules/` | Installed third-party dependencies. |

## Project Type

This is a JavaScript Playwright automation project with a Vite + React front end.

Main packages:

- Playwright test runner: `@playwright/test`
- Front end: `vite`, `react`, `react-dom`
- Styling: `tailwindcss`, `postcss`, `autoprefixer`
- Type support: `typescript`, `@types/node`

## NPM Scripts

| Script | Command |
| --- | --- |
| `npm test` | Runs `playwright test`. |
| `npm run playwright-test` | Runs `playwright test`. |
| `npm run playwright-headed` | Runs Playwright in headed mode. |
| `npm run playwright-ui` | Runs Playwright UI mode. |
| `npm run playwright-select` | Opens the custom mode selector in `scripts/select-playwright-mode.js`. |
| `npm run playwright-report` | Opens the Playwright HTML report. |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Builds the Vite app. |
| `npm run preview` | Previews the production build. |

## Playwright Configuration

`playwright.config.js` sets:

- `testDir` to `./tests`
- one Chromium project using Desktop Chrome
- base URL to `http://10.2.0.178:81`
- HTML reporter
- traces on first retry
- screenshots only on failure
- video retained on failure
- CI retries set to 2 and CI workers set to 1

## React Control Panel

The React app starts from:

- `index.html`
- `src/main.jsx`
- `src/App.jsx`
- `src/index.css`

The app presents a "STANDARD REGRESSION TEST" control panel focused on the Sales standard process. It lets a user:

- open the Sales test category
- choose the `Standard Process` test
- run it in `headed` or `ui` mode
- open a results modal showing the latest saved screenshots

The front end calls Vite middleware endpoints defined in `vite.config.js`.

## Vite API Middleware

`vite.config.js` adds a custom plugin named `playwright-runner-api`.

Endpoints:

- `POST /api/run-test`
  - accepts a spec and mode
  - currently allows only `tests/sales/so-with-credit-limit.spec.js`
  - currently allows only `headed` and `ui`
  - launches `npx playwright test <spec> --headed` or `--ui` as a detached process

- `GET /api/test-steps?testId=sales-so-with-credit-limit`
  - reads available screenshot files from `test-results/screenshots/sales_standard_process`
  - returns ordered step metadata for files that exist

- `GET /api/test-screenshot?testId=sales-so-with-credit-limit&file=<name>`
  - streams one known screenshot file as `image/png`
  - rejects unknown test IDs, unknown file names, and paths outside the screenshot directory

## Test Specs

### `tests/login.spec.js`

Logs in through `LoginPage`, expects redirect to `/bpi/index.php`, and checks that `Bounty Plus Inc.` is visible somewhere in the page frames.

### `tests/sales/so-with-credit-limit.spec.js`

Runs the Sales standard process with a 180-second timeout.

Flow:

1. Log in.
2. Open Sales Order.
3. Confirm the Customer label.
4. Select an initial customer through lookup.
5. Select document series `359`.
6. Select business partner `10000010`.
7. Add item `10000002` with unit price `100` and business center `NCRCL`.
8. Fill header details with distribution channel `OUTRIGHT` and division index `1`.
9. Save as draft and confirm `D|Draft`.
10. Try Add/Update until the document becomes `O|Open`.
11. If blocked by credit limit, capture the blocking message, open Credit Limit Checking, approve the matching Sales Order, and confirm Open status.

The approver defaults to the `BPI_USERID` environment variable or `playwrightAut`.

## Page Objects

| File | Responsibility |
| --- | --- |
| `tests/pages/base/BasePage.js` | Shared frame-aware locator helpers, click helpers, visibility helpers, and cross-frame text checks. |
| `tests/pages/base/LoginPage.js` | Login navigation, exact value entry, login submit, and company visibility assertion. |
| `tests/pages/base/MainMenuPage.js` | Opens Sales Order, Delivery Order, Credit Limit, and approval pages through the application menu. |
| `tests/pages/transactions/SalesOrderPage.js` | Handles Sales Order form actions, popup selection, item entry, header details, draft save, Add/Update behavior, status reading, credit-limit detection, and document memory capture. |
| `tests/pages/transactions/DeliveryOrderPage.js` | Handles Delivery Order form actions, Copy From Sales Orders, logistics fields, lookup selections, and draft save. |
| `tests/pages/approvals/CreditLimitPage.js` | Creates a credit-limit check, filters by customer, selects the matching Sales Order row, approves it, clicks Add, and verifies success/Open status. |
| `tests/pages/approvals/TransactionApprovalPage.js` | Handles transaction approval filtering, row selection, approval decision, Add, and Open/uneditable status verification. |
| `tests/pages/popups/BusinessPartnerPopup.js` | Reads and selects business partner/customer rows from lookup popups. |
| `tests/pages/popups/ItemPopup.js` | Selects an item by visible label and confirms the popup. |

## Helpers

| File | Responsibility |
| --- | --- |
| `tests/helpers/login.js` | Compatibility wrapper around `LoginPage.loginAs()`. |
| `tests/helpers/screenshots.js` | Saves full-page screenshots to `test-results/screenshots/<test_name>/`. |
| `scripts/select-playwright-mode.js` | Prompts for headed or UI mode, then spawns `npx playwright`. |

## Screenshot Outputs

Latest saved screenshots are in:

`test-results/screenshots/sales_standard_process/`

Current files:

- `00_SalesOrder_Page_Opened.png`
- `01_Customer_Label_Visible.png`
- `02_BP_Code_Returned.png`
- `03_DocSeries_Selected.png`
- `01_BP_Selected.png`
- `04_Item_Updated.png`
- `05_Header_Details_Filled.png`
- `06_Status_Draft.png`
- `ZZ_Credit_Limit_Blocking_Message.png`
- `08_CREDIT_LIMIT_STANDARD.png`
- `09_CREDIT_LIMIT_APPROVED.png`

The current `.last-run.json` reports:

```json
{
  "status": "passed",
  "failedTests": []
}
```

## Existing Documentation

`docs/standard-process-visuals.md` documents the expected screenshot sequence for the standard process. It includes the main happy-path screenshots and the failure visual rule for `ZZ_Status_Not_Open_Latest.png`.

Note: the current screenshot directory has the credit-limit screenshots and blocking message, but does not currently contain `07_Status_Open_After_Add.png` or `ZZ_Status_Not_Open_Latest.png`.

## Static UI Mockup

`ui/standard-regression-test.html` is a standalone HTML/CSS/JS mockup. It shows the same general control-panel concept, but it does not run tests or load real results. The active application is the Vite React app under `src/`.

## Generated And Vendor Areas

These areas were inventoried but are generated or external:

- `node_modules/`: installed dependencies, largest part of the folder.
- `dist/`: Vite build output.
- `playwright-report/`: generated Playwright report output.
- `test-results/`: Playwright run state and screenshots.

## Notes

- The project is not currently inside a Git repository; `git status` reports that no `.git` parent exists.
- The test suite is tightly coupled to the BPI app at `http://10.2.0.178:81`.
- The automation relies heavily on frame-aware selectors because the target app uses frames.
- Local `.env` credentials and test values are loaded automatically. Keep BP/customer values separate from item values: `BPI_SALES_BPCODE` / `BPI_DELIVERY_BPCODE` default to `10000010`, while `BPI_SALES_ITEMCODE` defaults to `10000002`.
- The React app's run button depends on the Vite dev server middleware. Opening the built/static files alone will not provide `/api/run-test` or `/api/test-steps`.
