// This is for using Playwright test and assertion tools.
const { test } = require('@playwright/test');
// This is for logging in before test steps run.
const { LoginPage } = require('../pages/base/LoginPage');
// This is for opening the target BPI module.
const { PurchasingMenuPage } = require('../pages/base/moduleNavigation/PurchasingMenuPage');
// This is for transaction screen actions and checks.
const { PurchaseRequestPage } = require('../pages/transactions/PurchaseRequestPage');
// This is for saving step screenshots.
const { takeStepScreenshot } = require('../helpers/screenshots');
// This is for recording the test result summary.
const {
  finishRunSummary,
  recordModuleDocNo,
  startRunSummary
} = require('../helpers/runSummary');

test('Purchase Request', async ({ page }) => {
  test.setTimeout(120000);

  const testId = 'purchasing-purchase-request';
  const testName = 'purchasing purchase-request';
  const loginPage = new LoginPage(page);
  const moduleNavigation = new PurchasingMenuPage(page);
  const transactionPage = new PurchaseRequestPage(page);

  startRunSummary(testId, 'Purchase Request');

  await loginPage.loginAs();
  await moduleNavigation.open();
  await transactionPage.expectLoaded();
  recordModuleDocNo('Purchasing', '', 'Opened', testId);
  await takeStepScreenshot(page, testName, '00_PURCHASING_PURCHASE_REQUEST_OPENED');

  finishRunSummary('success', testId);
});

