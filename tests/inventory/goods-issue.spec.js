// This is for using Playwright test and assertion tools.
const { test, expect } = require('@playwright/test');
// This is for logging in before test steps run.
const { LoginPage } = require('../pages/base/LoginPage');
// This is for opening the target BPI module.
const { InventoryMenuPage } = require('../pages/base/moduleNavigation/InventoryMenuPage');
// This is for transaction screen actions and checks.
const { GoodsIssuePage } = require('../pages/transactions/GoodsIssuePage');
// This is for saving step screenshots.
const { takeStepScreenshot } = require('../helpers/screenshots');
// This is for recording the test result summary.
const {
  finishRunSummary,
  recordModuleDocNo,
  startRunSummary
} = require('../helpers/runSummary');
// This is for reading values from .env
const { getValue } = require('../helpers/envHelper');
const { handleTestFailure } = require('../helpers/testErrorHandler');

test('Goods Issue', async ({ page }) => {
  test.setTimeout(120000);

  const testId = 'inventory-goods-issue';
  const testName = 'inventory goods-issue';

  const loginPage = new LoginPage(page);
  const moduleNavigation = new InventoryMenuPage(page);
  const transactionPage = new GoodsIssuePage(page);

  // Environment values
  let itemCode = getValue(undefined, 'BPI_ITEMCODE');
  let whsCode = getValue(undefined, 'BPI_WHSCODE');
  let profitCenter = getValue(undefined, 'BPI_PROFIT_CENTER');
  let quantity = Number(getValue(undefined, 'BPI_QUANTITY'));
  let secondaryQuantity = Number(getValue(undefined, 'BPI_SECONDARY_QUANTITY'));
  let unitPrice = Number(getValue(undefined, 'BPI_UNIT_PRICE'));
  let testPassed = false;
  try {
    startRunSummary(testId, 'Goods Issue');

    // Login
    await loginPage.loginAs();
    await moduleNavigation.openTransaction('Goods Issue');
    await transactionPage.expectLoaded();

    recordModuleDocNo('Inventory', '', 'Opened', testId);

    await takeStepScreenshot(
      page,
      testName,
      '00_INVENTORY_GOODS_ISSUE_OPENED'
    );

    // Item
    itemCode = await transactionPage.ensureFieldValue(
      '#df_itemcodeT1',
      itemCode,
      transactionPage.inputItemCode.bind(transactionPage),
      'Item Code'
    );

    await takeStepScreenshot(
      page,
      testName,
      '01_INVENTORY_GOODS_ISSUE_ITEM_ADDED'
    );

    await transactionPage.inputQuantity(quantity);

    const warehouseResult = await transactionPage.clickItemLink(whsCode, quantity);
    await transactionPage.validateWarehouseResult({
      warehouseResult,
      page,
      testName,
      testId,
      whsCode,
      quantity
    });

    whsCode = await transactionPage.ensureFieldValue(
      '#df_whscodeT1',
      whsCode,
      transactionPage.inputWhsCode.bind(transactionPage),
      'Warehouse'
    );

    profitCenter = await transactionPage.ensureFieldValue(
      '#df_drcodeT1',
      profitCenter,
      transactionPage.inputProfitCenter.bind(transactionPage),
      'Profit Center'
    );

    const hasBatch = await transactionPage.clickInventoryButtonIfExistsGI();

    if (hasBatch) {
      await takeStepScreenshot(
        page,
        testName,
        '08_INVENTORY_BATCH_POPUP_COMPLETED'
      );
    }

    //
    // Update Line
    //
    await transactionPage.clickUpdate();

    await takeStepScreenshot(
      page,
      testName,
      '05_INVENTORY_GOODS_ISSUE_ITEM_UPDATED'
    );

    await transactionPage.clickAdd();

    await takeStepScreenshot(
      page,
      testName,
      '06_INVENTORY_GOODS_ISSUE_DOCUMENT_ADDED'
    );

    await transactionPage.clickGeneralUDFButton();

    await transactionPage.validateJournalEntryLink();

    const journalPage = await transactionPage.clickJournalEntry();

    const journal = await transactionPage.validateJournalEntry(journalPage);

    await takeStepScreenshot(
      page,
      testName,
      '07_INVENTORY_GOODS_RECEIPT_JOURNAL_ENTRY'
    );

    // Close popup and return to Goods Receipt
    await transactionPage.closeJournalEntry(journalPage);
    recordModuleDocNo(
      'Journal Entry Validation',
      journal.documentNo,
      'Passed',
      testId,
      `JE Doc#: ${journal.journalDocumentNo}, Amount: ${journal.totalAmount}, Debit: ${journal.totalDebit}, Credit: ${journal.totalCredit}`
    );

    testPassed = true;

  } catch (error) {
    const customError = new Error(
      `Goods Issue failed: ${error.message}`
    );

    customError.cause = error;

    await handleTestFailure(
      page,
      testName,
      customError,
      testId
    );

    throw customError;
  } finally {
    finishRunSummary(testPassed ? 'success' : 'failed', testId);
  }
});