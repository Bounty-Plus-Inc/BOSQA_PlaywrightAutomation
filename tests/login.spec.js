// This is for using Playwright test and assertion tools.
const { test, expect } = require('@playwright/test');
// This is for logging in before test steps run.
const { LoginPage } = require('./pages/base/LoginPage');

test('login redirects to index and shows company name', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.loginAs();
  await expect(page).toHaveURL(/\/bpi\/index\.php\??/i, { timeout: 20000 });
  await loginPage.expectCompanyVisible();
});
