// This is for using Playwright test and assertion tools.
const { test } = require('@playwright/test');
// This is for logging in before test steps run.
const { LoginPage } = require('../pages/base/LoginPage');
// This is for opening the target BPI module.
const { BessiemerMenuPage } = require('../pages/base/moduleNavigation/BessiemerMenuPage');
// This is for transaction screen actions and checks.
const { BessieTestPage } = require('../pages/transactions/BessieTestPage');
// This is for saving step screenshots.
const { takeStepScreenshot } = require('../helpers/screenshots');
// This is for recording the test result summary.
const {
  finishRunSummary,
  recordModuleDocNo,
  startRunSummary
} = require('../helpers/runSummary');

test('Bessie_test', async ({ page }) => {
  test.setTimeout(120000);

  const testId = 'bessiemer-bessie-test';
  const testName = 'bessiemer bessie-test';
  const loginPage = new LoginPage(page);
  const moduleNavigation = new BessiemerMenuPage(page);
  const transactionPage = new BessieTestPage(page);

  startRunSummary(testId, 'Bessie_test');

  await loginPage.loginAs();
  await moduleNavigation.open();
  await transactionPage.expectLoaded();
  recordModuleDocNo('Bessiemer', '', 'Opened', testId);
  await takeStepScreenshot(page, testName, '00_BESSIEMER_BESSIE_TEST_OPENED');

  finishRunSummary('success', testId);
});
