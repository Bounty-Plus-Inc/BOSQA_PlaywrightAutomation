const { test } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { MainMenuPage } = require('../pages/MainMenuPage');
const { TransactionApprovalPage } = require('../pages/TransactionApprovalPage');
const { takeStepScreenshot } = require('../helpers/screenshots');
const {
  finishRunSummary,
  recordModuleDocNo,
  startRunSummary
} = require('../helpers/runSummary');

test('Approval', async ({ page }) => {
  test.setTimeout(120000);

  const testId = 'approval';
  const testName = 'approval';
  const loginPage = new LoginPage(page);
  const menu = new MainMenuPage(page);
  const approval = new TransactionApprovalPage(page);

  startRunSummary(testId, 'Approval');

  await loginPage.loginAs();
  await menu.openTransactionApproval();
  await approval.expectLoaded();
  recordModuleDocNo('Transaction Approval', '', 'Opened', testId);
  await takeStepScreenshot(page, testName, '00_APPROVAL_PAGE_OPENED');

  await approval.approveDocument(async () => {
    await takeStepScreenshot(page, testName, '01_APPROVAL_ROW_SELECTED');
  });

  recordModuleDocNo('Transaction Approval', '', 'Success for Approval Stage', testId);
  await takeStepScreenshot(page, testName, '02_APPROVAL_SUCCESS_OPEN');

  finishRunSummary('Success for Approval Stage', testId);
});
