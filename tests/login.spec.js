const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');

test('login redirects to index and shows company name', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.loginAs();
  await expect(page).toHaveURL(/\/bpi\/index\.php\??/i, { timeout: 20000 });
  await loginPage.expectCompanyVisible();
});
