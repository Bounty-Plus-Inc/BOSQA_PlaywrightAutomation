// This is for using Playwright test and assertion tools.
const { test } = require('@playwright/test');
// This is for logging in before test steps run.
const { LoginPage } = require('../pages/base/LoginPage');
// This is for driving the Find Document flow.
const { FindDocumentPage } = require('../pages/utilities/FindDocumentPage');
// This is for saving step screenshots.
const { takeStepScreenshot } = require('../helpers/screenshots');
// This is for storing captured document data.
const { writeCapturedDocument } = require('../helpers/capturedDocumentStore');
// This is for reading current module header fields and line items.
const { readDocumentData } = require('../helpers/documentReaders/documentDataReader');
// This is for listing Find Document dropdown options.
const { findDocumentActions } = require('./findDocumentActions');
// This is for routing each action to its module-owned replicate workflow.
const { replicateFlowsByActionId } = require('./replicateFlows');
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

function recordAutomationFailure({ testId, action, documentNo, error }) {
  const failureScope = `${action.moduleName} Replicate`;
  recordModuleDocNo(
    failureScope,
    documentNo || '-',
    'Failed',
    testId,
    getFailureMessage(error)
  );
}

test.describe('Find Document', () => {
  for (const action of findDocumentActions) {
    test(action.testTitle, async ({ page }) => {
      test.setTimeout(300000);

      const testId = 'utilities-find-document';
      const testName = 'find document';
      const documentNo = process.env.BPI_FIND_DOCUMENT_NO || '';
      const selectedActionId = process.env.BPI_TEST_ACTION_ID || '';
      let finalStatus = 'success';
      const loginPage = new LoginPage(page);
      const moduleNavigation = createNavigationPage(action, page);
      const findDocument = new FindDocumentPage(page);
      const replicateFlow = replicateFlowsByActionId[action.id] || null;

      test.skip(
        Boolean(selectedActionId) && selectedActionId !== action.id,
        `Skipping ${action.label}; selected action is ${selectedActionId}`
      );
      test.skip(!documentNo, 'BPI_FIND_DOCUMENT_NO is required for Find Document.');

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

        const documentDataConfig = replicateFlow?.documentDataConfig || {};
        const capturedData = await readDocumentData(page, documentDataConfig);
        const lineItems = capturedData.lineItems || [];
        writeCapturedDocument(action.moduleName, documentNo, {
          source: 'Find Document',
          mode: 'replicate',
          ...capturedData,
          lineItems
        });

        if (replicateFlow?.replicate) {
          finalStatus = await replicateFlow.replicate({
            capturedData,
            page,
            testId,
            testName,
            action,
            documentNo,
            recordValidationResult,
            recordModuleDocNo,
            takeStepScreenshot
          });
        } else {
          recordModuleDocNo(action.moduleName, '', 'Replicate not configured', testId);
        }

        finishRunSummary(finalStatus, testId);
      } catch (error) {
        recordAutomationFailure({
          testId,
          action,
          documentNo,
          error
        });
        finishRunSummary('failed', testId);
        throw error;
      }
    });
  }
});
