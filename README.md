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
QA Notes:
For .env account credentials make sure you have full access for everything for the test to run smoothly and not flaky:
for assurance of data driven test : use this credentials instead
```bash
BPI_USERID=playwrightAut
BPI_PASSWORD=playwrightPass
```

