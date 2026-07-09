// This is for using Playwright test and assertion tools.
const { test } = require('@playwright/test');
// This is for logging in before test steps run.
const { LoginPage } = require('../pages/base/LoginPage');
// This is for opening the target BPI module.
const {
  TransactionApprovalMenuPage
} = require('../pages/base/moduleNavigation/TransactionApprovalMenuPage');
// This is for approval screen actions and checks.
const { TransactionApprovalPage } = require('../pages/approvals/TransactionApprovalPage');
// This is for saving step screenshots.
const { takeStepScreenshot } = require('../helpers/screenshots');
// This is for recording the test result summary.
const {
  finishRunSummary,
  recordModuleDocNo,
  startRunSummary
} = require('../helpers/runSummary');

test('Approval', async ({ page }) => {
  test.setTimeout(120000);

  const testId = 'admin-approval';
  const testName = 'approval';
  const loginPage = new LoginPage(page);
  const transactionApprovalMenu = new TransactionApprovalMenuPage(page);
  const approval = new TransactionApprovalPage(page);

  startRunSummary(testId, 'Approval');

  await loginPage.loginAs();
  await transactionApprovalMenu.open();
  await approval.expectLoaded();
  recordModuleDocNo('Transaction Approval', '', 'Opened', testId);
  await takeStepScreenshot(page, testName, '00_APPROVAL_PAGE_OPENED');

  const approvalRemark = await approval.approveDocument(async () => {
    await takeStepScreenshot(page, testName, '01_APPROVAL_ROW_SELECTED');
  });

  recordModuleDocNo('Transaction Approval', '', approvalRemark, testId);
  await takeStepScreenshot(page, testName, '02_APPROVAL_SUCCESS_OPEN');

  finishRunSummary(approvalRemark, testId);
});
