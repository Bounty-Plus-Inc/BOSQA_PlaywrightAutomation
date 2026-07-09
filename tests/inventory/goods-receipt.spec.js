// This is for using Playwright test and assertion tools.
const { test } = require('@playwright/test');

// This is for logging in before test steps run.
const { LoginPage } = require('../pages/base/LoginPage');

// This is for opening the target BPI module.
const { InventoryMenuPage } = require('../pages/base/moduleNavigation/InventoryMenuPage');

// This is for transaction screen actions and checks.
const { GoodsReceiptPage } = require('../pages/transactions/GoodsReceiptPage');

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

test('Goods Receipt', async ({ page }) => {
  test.setTimeout(120000);

  const testId = 'inventory-goods-receipt';
  const testName = 'inventory goods-receipt';

  const loginPage = new LoginPage(page);
  const goodsReceiptMenu = new InventoryMenuPage(page);
  const goodsReceiptPage = new GoodsReceiptPage(page);

  // Environment values
  let itemCode = getValue(undefined, 'BPI_ITEMCODE');
  let whsCode = getValue(undefined, 'BPI_WHSCODE');
  let profitCenter = getValue(undefined, 'BPI_PROFIT_CENTER');
  let quantity = Number(getValue(undefined, 'BPI_QUANTITY'));
  let secondaryQuantity = Number(getValue(undefined, 'BPI_SECONDARY_QUANTITY'));
  let unitPrice = Number(getValue(undefined, 'BPI_UNIT_PRICE'));

  startRunSummary(testId, 'Goods Receipt');

  //
  // Login & Open Screen
  //
  await loginPage.loginAs();
  await goodsReceiptMenu.openTransaction('Goods Receipt');
  await goodsReceiptPage.expectLoaded();

  await takeStepScreenshot(
    page,
    testName,
    '00_INVENTORY_GOODS_RECEIPT_OPENED'
  );

  //
  // Item
  //
  itemCode = await goodsReceiptPage.ensureFieldValue(
    '#df_itemcodeT1',
    itemCode,
    goodsReceiptPage.inputItemCode.bind(goodsReceiptPage),
    'Item Code'
  );

  await takeStepScreenshot(
    page,
    testName,
    '01_INVENTORY_GOODS_ISSUE_ITEM_ADDED'
  );

  //
  // Line Details
  //
  // quantity = Number(
  //   await goodsReceiptPage.ensureFieldValue(
  //     '#df_quantityT1',
  //     quantity,
  //     goodsReceiptPage.inputQuantity.bind(goodsReceiptPage),
  //     'Quantity'
  //   )
  // );

  // secondaryQuantity = Number(
  //   await goodsReceiptPage.ensureFieldValue(
  //     '#df_u_quantityT1',
  //     secondaryQuantity,
  //     goodsReceiptPage.inputSecondaryQuantity.bind(goodsReceiptPage),
  //     'Secondary Quantity'
  //   )
  // );

  await goodsReceiptPage.inputQuantity(quantity);
  await goodsReceiptPage.inputSecondaryQuantity(secondaryQuantity);

  whsCode = await goodsReceiptPage.ensureFieldValue(
    '#df_whscodeT1',
    whsCode,
    goodsReceiptPage.inputWhsCode.bind(goodsReceiptPage),
    'Warehouse'
  );

  profitCenter = await goodsReceiptPage.ensureFieldValue(
    '#df_drcodeT1',
    profitCenter,
    goodsReceiptPage.inputProfitCenter.bind(goodsReceiptPage),
    'Profit Center'
  );

  unitPrice = Number(
    await goodsReceiptPage.ensureFieldValue(
      '#df_unitpriceT1',
      unitPrice,
      goodsReceiptPage.inputUnitPrice.bind(goodsReceiptPage),
      'Unit Price'
    )
  );
  const hasBatch = await goodsReceiptPage.clickInventoryButtonIfExists();

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
  await goodsReceiptPage.clickUpdate();

  await takeStepScreenshot(
    page,
    testName,
    '05_INVENTORY_GOODS_RECEIPT_ITEM_UPDATED'
  );

  //
  // Add Document
  //
  await goodsReceiptPage.clickAdd();

  await takeStepScreenshot(
    page,
    testName,
    '06_INVENTORY_GOODS_RECEIPT_DOCUMENT_ADDED'
  );

  //
  // Journal Entry Validation
  //
  const journalPage = await goodsReceiptPage.clickJournalEntry();

  const journal = await goodsReceiptPage.validateJournalEntry(journalPage);
  await takeStepScreenshot(
    page,
    testName,
    '07_INVENTORY_GOODS_RECEIPT_JOURNAL_ENTRY'
  );

  // Close popup and return to Goods Receipt
  await goodsReceiptPage.closeJournalEntry(journalPage);
  recordModuleDocNo(
    'Journal Entry Validation',
    journal.documentNo,
    'Passed',
    testId,
    `JE Doc#: ${journal.journalDocumentNo}, Amount: ${journal.totalAmount}, Debit: ${journal.totalDebit}, Credit: ${journal.totalCredit}`
  );

  //
  // Summary
  //
  [
    ['Inventory - Open', '', 'Opened'],
    ['Inventory - Item', itemCode, 'Item Added'],
    ['Inventory - Item Update', '', 'Item Updated'],
    ['Inventory - Document Added', journal.documentNo, 'Document Added']
  ].forEach(([module, docNo, status]) =>
    recordModuleDocNo(module, docNo, status, testId)
  );

  finishRunSummary('success', testId);
});