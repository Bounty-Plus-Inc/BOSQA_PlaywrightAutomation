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

const { getItemCode } = require('../helpers/itemCode');

test('Goods Receipt', async ({ page }) => {
  test.setTimeout(120000);

  const testId = 'inventory-goods-receipt';
  const testName = 'inventory goods-receipt';
  const loginPage = new LoginPage(page);
  const goodsReceiptMenu = new InventoryMenuPage(page);
  const goodsReceiptPage = new GoodsReceiptPage(page);
  let itemCode = getItemCode();


  startRunSummary(testId, 'Goods Receipt');

await loginPage.loginAs();
await goodsReceiptMenu.open();
await goodsReceiptPage.expectLoaded();

await takeStepScreenshot(
  page,
  testName,
  '00_INVENTORY_GOODS_RECEIPT_OPENED'
);

try {
  const itemLocator = await goodsReceiptPage.findInAllFrames(
    'input#df_itemcodeT1[name="df_itemcodeT1"], input#df_itemcodeT1',
    3
  ).catch(() => null);

  const existing = itemLocator
    ? String(await itemLocator.inputValue().catch(() => '')).trim()
    : '';

  if (existing) {
    itemCode = existing;
    console.log(`[GOODS RECEIPT] Using item code from UI: ${itemCode}`);
  } else {
    await goodsReceiptPage.inputItemCode(itemCode);
  }
} catch (e) {
  await goodsReceiptPage.inputItemCode(itemCode);
}

await takeStepScreenshot(
  page,
  testName,
  '01_INVENTORY_GOODS_RECEIPT_ITEM_ADDED'
);

recordModuleDocNo(
  'Inventory - Open',
  '',
  'Opened',
  testId
);

recordModuleDocNo(
  'Inventory - Item',
  itemCode,
  'Item Added',
  testId
);

finishRunSummary('success', testId);
});
