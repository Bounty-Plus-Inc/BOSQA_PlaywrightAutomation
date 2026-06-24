// This is for using Playwright test and assertion tools.
const { test } = require('@playwright/test');
// This is for logging in before test steps run.
const { LoginPage } = require('../pages/base/LoginPage');
// This is for opening the target BPI module.
const { TestingModuleMenuPage } = require('../pages/base/moduleNavigation/TestingModuleMenuPage');
// This is for transaction screen actions and checks.
const { TestingScriptPage } = require('../pages/transactions/TestingScriptPage');
// This is for saving step screenshots.
const { takeStepScreenshot } = require('../helpers/screenshots');
// This is for recording the test result summary.
const {
  finishRunSummary,
  recordModuleDocNo,
  startRunSummary
} = require('../helpers/runSummary');

test('Testing Script', async ({ page }) => {
  test.setTimeout(120000);

  const testId = 'testing-module-testing-script';
  const testName = 'testing-module testing-script';
  const loginPage = new LoginPage(page);
  const moduleNavigation = new TestingModuleMenuPage(page);
  const transactionPage = new TestingScriptPage(page);

  startRunSummary(testId, 'Testing Script');

  await loginPage.loginAs();
  await moduleNavigation.open();
  await transactionPage.expectLoaded();
  recordModuleDocNo('Testing Module', '', 'Opened', testId);
  await takeStepScreenshot(page, testName, '00_TESTING_MODULE_TESTING_SCRIPT_OPENED');

  finishRunSummary('success', testId);
});
