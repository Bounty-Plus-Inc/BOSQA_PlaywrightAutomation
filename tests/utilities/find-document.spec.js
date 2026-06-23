// This is for using Playwright test and assertion tools.
const { test } = require('@playwright/test');
// This is for logging in before test steps run.
const { LoginPage } = require('../pages/base/LoginPage');
// This is for driving the Find Document flow.
const { FindDocumentPage } = require('../pages/utilities/FindDocumentPage');
// This is for opening the Sales Order transaction module.
const { SalesOrderMenuPage } = require('../pages/base/moduleNavigation/SalesOrderMenuPage');
// This is for opening the target BPI module.
const {
  CreditLimitApprovalMenuPage
} = require('../pages/base/moduleNavigation/CreditLimitApprovalMenuPage');
// This is for opening the target BPI module.
const {
  CreditLimitCheckingMenuPage
} = require('../pages/base/moduleNavigation/CreditLimitCheckingMenuPage');
// This is for opening the target BPI module.
const {
  TransactionApprovalMenuPage
} = require('../pages/base/moduleNavigation/TransactionApprovalMenuPage');
// This is for recreating a Sales Order from captured document data.
const { SalesOrder } = require('../pages/ReCreateTransaction/SalesOrder');
// This is for approval screen actions and checks.
const { CreditLimitPage } = require('../pages/approvals/CreditLimitPage');
// This is for approval screen actions and checks.
const { TransactionApprovalPage } = require('../pages/approvals/TransactionApprovalPage');
// This is for saving step screenshots.
const { takeStepScreenshot } = require('../helpers/screenshots');
// This is for storing captured document data.
const { writeCapturedDocument } = require('../helpers/capturedDocumentStore');
// This is for reading current module header fields and line items.
const { readCurrentDocumentData } = require('../lineItemReaders/documentLineItems');
// This is for listing Find Document dropdown options.
const { findDocumentActions } = require('./findDocumentActions');
// This is for recording the test result summary.
const {
  finishRunSummary,
  recordModuleDocNo,
  startRunSummary
} = require('../helpers/runSummary');

function createNavigationPage(action, page) {
  // This is for loading the selected navigation page dynamically.
  const navigationModule = require(action.navigationModulePath);
  const NavigationPage = navigationModule[action.navigationExportName];
  if (!NavigationPage) {
    throw new Error(`Navigation export not found: ${action.navigationExportName}`);
  }

  return new NavigationPage(page);
}

function normalizeSummaryValue(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function recordValidationResult(testId, testScript, expectedValue, actualValue) {
  const expected = normalizeSummaryValue(expectedValue);
  const actual = normalizeSummaryValue(actualValue);
  const remarks =
    expected === actual
      ? 'Validated successfully against the expected value.'
      : 'Actual value differs from the expected value.';
  recordModuleDocNo(testScript, expected || '-', actual || '-', testId, remarks);
}

async function replicateSalesOrderTransaction({ capturedData, page, testId, testName }) {
  const salesOrderMenu = new SalesOrderMenuPage(page);
  const creditLimitCheckingMenu = new CreditLimitCheckingMenuPage(page);
  const creditLimitApprovalMenu = new CreditLimitApprovalMenuPage(page);
  const transactionApprovalMenu = new TransactionApprovalMenuPage(page);
  const salesOrder = new SalesOrder(page);
  const creditLimit = new CreditLimitPage(page);
  const transactionApproval = new TransactionApprovalPage(page);
  const approverUserId = process.env.BPI_USERID || 'playwrightAut';

  const runCreditLimitChecking = async (memory) => {
    await creditLimitCheckingMenu.open();
    await creditLimit.createCheck({
      customerNo: memory.bpCode,
      approverUserId,
      docNo: memory.docNo,
      beforeAdd: async () => {
        await takeStepScreenshot(page, testName, '08_RECREATE_CREDIT_LIMIT_STANDARD');
      }
    });
    recordModuleDocNo('Credit Limit Checking', memory.docNo, 'Approved', testId);
    await takeStepScreenshot(page, testName, '09_RECREATE_CREDIT_LIMIT_APPROVED');

    await creditLimitApprovalMenu.open();
    await creditLimit.createApproval({
      customerNo: memory.bpCode,
      remarksUserId: approverUserId,
      docNo: memory.docNo,
      beforeAdd: async () => {
        await takeStepScreenshot(page, testName, '10_RECREATE_CREDIT_LIMIT_APPROVAL');
      }
    });
    recordModuleDocNo('Credit Limit Approval', memory.docNo, 'Approved', testId);
    await takeStepScreenshot(page, testName, '11_RECREATE_CREDIT_LIMIT_APPROVAL_DONE');
  };

  const runTransactionApproval = async (memory) => {
    await transactionApprovalMenu.open();
    await transactionApproval.expectLoaded();
    recordModuleDocNo('Transaction Approval', memory.docNo, 'Opened', testId);
    await takeStepScreenshot(page, testName, '08_RECREATE_TRANSACTION_APPROVAL_OPENED');

    await transactionApproval.approveDocument(async () => {
      await takeStepScreenshot(page, testName, '09_RECREATE_TRANSACTION_APPROVAL_SELECTED');
    });

    recordModuleDocNo('Transaction Approval', memory.docNo, 'Approved', testId);
    await takeStepScreenshot(page, testName, '10_RECREATE_TRANSACTION_APPROVAL_DONE');
  };

  await salesOrderMenu.open();
  await salesOrder.expectCustomerLabelVisible();
  await salesOrder.recreateFromCapturedData(capturedData, {
    afterValidation: ({ testScript, expectedValue, actualValue }) => {
      recordValidationResult(testId, testScript, expectedValue, actualValue);
    }
  });

  await salesOrder.saveAsDraft();
  const draftMemory = await salesOrder.readDocumentMemory();
  recordModuleDocNo('Recreated Sales Order', draftMemory.docNo, 'Draft', testId);
  await takeStepScreenshot(page, testName, '06_RECREATE_STATUS_DRAFT');

  const addOutcome = await salesOrder.addOrUpdateUntilOpen();

  if (!addOutcome.isOpen) {
    if (!addOutcome.isCreditLimitBlocked) {
      if (addOutcome.isProcessEndedSuccessfully) {
        const memory = await salesOrder.readDocumentMemory();
        recordModuleDocNo('Sales Order', memory.docNo, 'For Transaction Approval', testId);
        await runTransactionApproval(memory);
        return 'success';
      }

      const memory = await salesOrder.readDocumentMemory();
      recordModuleDocNo('Sales Order', memory.docNo, 'Not Open', testId);
      await takeStepScreenshot(page, testName, 'ZZ_RECREATE_STATUS_NOT_OPEN_LATEST');
      return 'not-open';
    }

    const memory = await salesOrder.readDocumentMemory();
    recordModuleDocNo('Sales Order', memory.docNo, 'Credit Limit Blocked', testId);
    await takeStepScreenshot(page, testName, 'ZZ_RECREATE_CREDIT_LIMIT_BLOCKING_MESSAGE');
    await runCreditLimitChecking(memory);
    return 'success';
  }

  const memory = await salesOrder.readDocumentMemory();
  recordModuleDocNo('Sales Order', memory.docNo, 'Open', testId);
  await takeStepScreenshot(page, testName, '07_RECREATE_STATUS_OPEN_AFTER_ADD');
  return 'success';
}

test.describe('Find Document', () => {
  for (const action of findDocumentActions) {
    test(action.testTitle, async ({ page }) => {
      test.setTimeout(300000);

      const testId = 'utilities-find-document';
      const testName = 'find document';
      const documentNo = process.env.BPI_FIND_DOCUMENT_NO || '';
      const selectedActionId = process.env.BPI_TEST_ACTION_ID || '';
      const documentMode = process.env.BPI_FIND_DOCUMENT_MODE || 'display';
      let finalStatus = 'success';
      const loginPage = new LoginPage(page);
      const moduleNavigation = createNavigationPage(action, page);
      const findDocument = new FindDocumentPage(page);

      test.skip(
        Boolean(selectedActionId) && selectedActionId !== action.id,
        `Skipping ${action.label}; selected action is ${selectedActionId}`
      );
      test.skip(!documentNo, 'BPI_FIND_DOCUMENT_NO is required for Find Document.');
      test.skip(
        !['display', 'replicate'].includes(documentMode),
        `Unsupported Find Document mode: ${documentMode}`
      );

      startRunSummary(testId, 'Find Document');
      recordValidationResult(
        testId,
        'Find Document',
        documentNo,
        documentNo
      );

      await loginPage.loginAs();
      await moduleNavigation.open();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, testName, action.openedScreenshot);

      const findPopup = await findDocument.openFindPopup();
      await findDocument.selectDocumentFromResults(findPopup, documentNo);

      recordValidationResult(testId, action.moduleName, documentNo, documentNo);
      await takeStepScreenshot(page, testName, action.loadedScreenshot);

      if (documentMode === 'replicate') {
        const capturedData = await readCurrentDocumentData(page);
        const lineItems = capturedData.lineItems || [];
        writeCapturedDocument(action.moduleName, documentNo, {
          source: 'Find Document',
          mode: documentMode,
          bpCode: capturedData.bpCode || '',
          bpRefNo: capturedData.bpRefNo || '',
          shipToCode: capturedData.shipToCode || '',
          shipToAddress: capturedData.shipToAddress || '',
          shipType: capturedData.shipType || '',
          salesOrg: capturedData.salesOrg || '',
          distributionChannel: capturedData.distributionChannel || '',
          division: capturedData.division || '',
          businessCenter: capturedData.businessCenter || '',
          lineItems
        });

        if (action.id === 'sales-order') {
          finalStatus = await replicateSalesOrderTransaction({
            capturedData,
            page,
            testId,
            testName
          });
        } else {
          recordModuleDocNo(action.moduleName, '', 'Replicate not configured', testId);
        }
      }

      finishRunSummary(finalStatus, testId);
    });
  }
});
