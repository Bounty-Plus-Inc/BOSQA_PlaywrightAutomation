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

test.describe('Find Document', () => {
  for (const action of findDocumentActions) {
    test(action.testTitle, async ({ page }) => {
      test.setTimeout(90000);

      const testId = 'utilities-find-document';
      const testName = 'find document';
      const documentNo = process.env.BPI_FIND_DOCUMENT_NO || '';
      const selectedActionId = process.env.BPI_TEST_ACTION_ID || '';
      const documentMode = process.env.BPI_FIND_DOCUMENT_MODE || 'display';
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
      recordModuleDocNo(
        'Find Document',
        documentNo,
        `${action.label} ${documentMode}`,
        testId
      );

      await loginPage.loginAs();
      await moduleNavigation.open();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, testName, action.openedScreenshot);

      const findPopup = await findDocument.openFindPopup();
      await findDocument.selectDocumentFromResults(findPopup, documentNo);

      if (documentMode === 'replicate') {
        const capturedData = await readCurrentDocumentData(page);
        const lineItems = capturedData.lineItems || [];
        writeCapturedDocument(action.moduleName, documentNo, {
          source: 'Find Document',
          mode: documentMode,
          lineItems
        });

        if (lineItems.length) {
          recordModuleDocNo(
            `${action.moduleName} Lines`,
            String(lineItems.length),
            'Captured for Replicate',
            testId
          );
        } else {
          recordModuleDocNo(`${action.moduleName} Lines`, '0', 'No lines captured', testId);
        }
      }

      recordModuleDocNo(action.moduleName, documentNo, 'Loaded from Find Document', testId);
      await takeStepScreenshot(page, testName, action.loadedScreenshot);

      finishRunSummary('success', testId);
    });
  }
});
