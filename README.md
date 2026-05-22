# Playwright Automation

Local Playwright automation dashboard for the BPI test environment.

## Setup

Install dependencies:

```bash
npm install
```

Install Playwright browsers if needed:

```bash
npx playwright install
```

## Run The Local UI

Start the dashboard:

```bash
npm run dev
```

Open the local URL shown by Vite, usually:

```txt
http://localhost:5173
```

When a developer clicks `Headed` or `UI`, the Playwright test runs on that developer's own machine.

## Run Tests Directly

Run all tests:

```bash
npm test
```

Run headed:

```bash
npm run playwright-headed
```

Run Playwright UI mode:

```bash
npm run playwright-ui
```

Open the latest Playwright report:

```bash
npm run playwright-report
```

## Environment

Copy the example environment file for local credentials:

```bash
copy .env.example .env
```

Then edit `.env`:

```txt
BPI_BASE_URL=http://10.2.0.178:81
BPI_USERID=playwrightAut
BPI_PASSWORD=playwrightPass
BPI_SALES_BPCODE=10000010
BPI_SALES_ITEMCODE=10000002
BPI_DELIVERY_BPCODE=10000010
```

OS environment variables can still override `.env` when needed:

```bash
set BPI_USERID=your_login_id
set BPI_PASSWORD=your_password
```

PowerShell:

```powershell
$env:BPI_USERID = "your_login_id"
$env:BPI_PASSWORD = "your_password"
```

## GitHub Notes

Do not commit generated or local-only folders:

- `node_modules/`
- `dist/`
- `playwright-report/`
- `test-results/`
- `.env` files

Those are already ignored by `.gitignore`.
