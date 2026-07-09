// This is for using Playwright test and assertion tools.
const { test } = require('@playwright/test');
// This is for logging in before test steps run.
const { LoginPage } = require('../pages/base/LoginPage');
// This is for driving the Find Document flow.
const { FindDocumentPage } = require('../pages/utilities/FindDocumentPage');
// This is for opening the Sales Order transaction module.
const { SalesOrderMenuPage } = require('../pages/base/moduleNavigation/SalesOrderMenuPage');
// This is for opening the Delivery Order transaction module.
const { DeliveryOrderMenuPage } = require('../pages/base/moduleNavigation/DeliveryOrderMenuPage');
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
// This is for Delivery Order transaction actions.
const { DeliveryOrderPage } = require('../pages/transactions/DeliveryOrderPage');
// This is for approval screen actions and checks.
const { CreditLimitPage } = require('../pages/approvals/CreditLimitPage');
// This is for approval screen actions and checks.
const { TransactionApprovalPage } = require('../pages/approvals/TransactionApprovalPage');
// This is for saving step screenshots.
const { takeStepScreenshot } = require('../helpers/screenshots');
// This is for storing captured document data.
const { writeCapturedDocument } = require('../helpers/capturedDocumentStore');
// This is for reading current module header fields and line items.
const { readDocumentData } = require('../helpers/documentReaders/documentDataReader');
// This is for Sales Order document header and line item field definitions.
const {
  SalesOrderDocumentData
} = require('../helpers/documentReaders/config/SalesOrderDocumentData');
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

function getFailureMessage(error) {
  return String(error?.message || error || 'Unknown failure')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function recordAutomationFailure({ testId, action, documentNo, documentMode, error }) {
  const failureScope = documentMode === 'replicate' ? `${action.moduleName} Replicate` : action.moduleName;
  recordModuleDocNo(
    failureScope,
    documentNo || '-',
    'Failed',
    testId,
    getFailureMessage(error)
  );
}

const documentDataConfigsByActionId = {
  'sales-order': SalesOrderDocumentData
};

async function replicateSalesOrderTransaction({ capturedData, page, testId, testName }) {
  const salesOrderMenu = new SalesOrderMenuPage(page);
  const creditLimitCheckingMenu = new CreditLimitCheckingMenuPage(page);
  const creditLimitApprovalMenu = new CreditLimitApprovalMenuPage(page);
  const transactionApprovalMenu = new TransactionApprovalMenuPage(page);
  const deliveryOrderMenu = new DeliveryOrderMenuPage(page);
  const salesOrder = new SalesOrder(page);
  const creditLimit = new CreditLimitPage(page);
  const transactionApproval = new TransactionApprovalPage(page);
  const deliveryOrder = new DeliveryOrderPage(page);
  const approverUserId = process.env.BPI_USERID || 'playwrightAut';
  const resolveDeliverySourceDocNo = (memory) =>
    process.env.BPI_DELIVERY_SALES_ORDER_DOCNO ||
    process.env.BPI_DELIVERY_COPY_FROM_DOCNO ||
    memory.docNo ||
    '';

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

    const approvalRemark = await transactionApproval.approveDocument(
      async () => {
        await takeStepScreenshot(page, testName, '09_RECREATE_TRANSACTION_APPROVAL_SELECTED');
      },
      { docNo: memory.docNo }
    );

    recordModuleDocNo('Transaction Approval', memory.docNo, approvalRemark, testId);
    await takeStepScreenshot(page, testName, '10_RECREATE_TRANSACTION_APPROVAL_DONE');
  };

  const runDeliveryOrderCopyFrom = async (memory) => {
    const sourceDocNo = resolveDeliverySourceDocNo(memory);

    await deliveryOrderMenu.open();
    await deliveryOrder.expectLoaded();
    recordModuleDocNo('Delivery Order', sourceDocNo, 'Opened', testId);
    await takeStepScreenshot(page, testName, '12_RECREATE_DELIVERY_ORDER_OPENED');

    const copyResult = await deliveryOrder.copyFromSalesOrder({
      bpCode: memory.bpCode,
      salesOrderDocNo: sourceDocNo,
      hooks: {
        beforeSelectBp: async (bpCFLPage) => {
          await takeStepScreenshot(bpCFLPage, testName, '13_RECREATE_DELIVERY_BP_CFL_POPUP');
        },
        afterBpSelected: async (selectedBpCode) => {
          recordValidationResult(
            testId,
            'Delivery Order BP Code',
            memory.bpCode,
            selectedBpCode
          );
          await takeStepScreenshot(page, testName, '14_RECREATE_DELIVERY_BP_SELECTED');
        },
        afterCopyFromOpened: async (copyFrom) => {
          await takeStepScreenshot(copyFrom.page, testName, '15_RECREATE_DELIVERY_COPY_FROM_POPUP');
        },
        afterHeaderSelected: async (selectedHeader, copyFrom) => {
          recordValidationResult(
            testId,
            'Delivery Order Copy From Sales Order',
            sourceDocNo,
            selectedHeader.docNo || sourceDocNo
          );
          await takeStepScreenshot(
            copyFrom.page,
            testName,
            '16_RECREATE_DELIVERY_SOURCE_SELECTED'
          );
        },
        afterItemsLoaded: async (copyFrom) => {
          await takeStepScreenshot(copyFrom.page, testName, '17_RECREATE_DELIVERY_ITEMS_LOADED');
        },
        afterItemSelected: async (copyFrom) => {
          await takeStepScreenshot(copyFrom.page, testName, '18_RECREATE_DELIVERY_ITEMS_SELECTED');
        },
        afterFinished: async () => {
          await takeStepScreenshot(page, testName, '19_RECREATE_DELIVERY_ITEMS_COPIED');
        }
      }
    });

    recordModuleDocNo(
      'Delivery Order Copy From',
      sourceDocNo,
      copyResult.sourceDocNo,
      testId,
      'Sales Order source document was copied into Delivery Order.'
    );
  };

  await salesOrderMenu.open();
  await salesOrder.expectCustomerLabelVisible();
  await salesOrder.recreateFromCapturedData(capturedData, {
    afterValidation: ({ testScript, expectedValue, actualValue }) => {
      recordValidationResult(testId, testScript, expectedValue, actualValue);
    }
  });

  const docSeriesResult = await salesOrder.selectDocSeriesByLabel('Sales Order');
  recordValidationResult(
    testId,
    'Sales Order Doc Series',
    docSeriesResult.expectedValue,
    docSeriesResult.actualValue
  );

  await salesOrder.saveAsDraft();
  const draftMemory = await salesOrder.readDocumentMemory();
  recordModuleDocNo('Recreated Sales Order', draftMemory.docNo, 'Draft', testId);
  await takeStepScreenshot(page, testName, '06_RECREATE_STATUS_DRAFT');

  const addOutcome = await salesOrder.addOrUpdateUntilOpen();
  const readLatestMemory = () =>
    salesOrder.readDocumentMemory({
      fallbackBpCode: draftMemory.bpCode,
      fallbackDocNo: draftMemory.docNo
    });

  if (!addOutcome.isOpen) {
    if (!addOutcome.isCreditLimitBlocked) {
      if (addOutcome.isProcessEndedSuccessfully) {
        const memory = await readLatestMemory();
        recordModuleDocNo('Sales Order', memory.docNo, 'For Transaction Approval', testId);
        await runTransactionApproval(memory);
        await runDeliveryOrderCopyFrom(memory);
        return 'success';
      }

      const memory = await readLatestMemory();
      recordModuleDocNo('Sales Order', memory.docNo, 'Not Open', testId);
      await takeStepScreenshot(page, testName, 'ZZ_RECREATE_STATUS_NOT_OPEN_LATEST');
      return 'not-open';
    }

    const memory = await readLatestMemory();
    recordModuleDocNo('Sales Order', memory.docNo, 'Credit Limit Blocked', testId);
    await takeStepScreenshot(page, testName, 'ZZ_RECREATE_CREDIT_LIMIT_BLOCKING_MESSAGE');
    await runCreditLimitChecking(memory);
    await runTransactionApproval(memory);
    await runDeliveryOrderCopyFrom(memory);
    return 'success';
  }

  const memory = await readLatestMemory();
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

      try {
        await loginPage.loginAs();
        await moduleNavigation.open();
        await page.waitForTimeout(3000);
        await takeStepScreenshot(page, testName, action.openedScreenshot);

        const findPopup = await findDocument.openFindPopup();
        await findDocument.selectDocumentFromResults(findPopup, documentNo);

        recordValidationResult(testId, action.moduleName, documentNo, documentNo);
        await takeStepScreenshot(page, testName, action.loadedScreenshot);

        if (documentMode === 'replicate') {
          const documentDataConfig = documentDataConfigsByActionId[action.id] || {};
          const capturedData = await readDocumentData(page, documentDataConfig);
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
      } catch (error) {
        recordAutomationFailure({
          testId,
          action,
          documentNo,
          documentMode,
          error
        });
        finishRunSummary('failed', testId);
        throw error;
      }
    });
  }
});
