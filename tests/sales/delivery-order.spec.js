// This is for using Playwright test and assertion tools.
const { test } = require('@playwright/test');
// This is for logging in before test steps run.
const { LoginPage } = require('../pages/base/LoginPage');
// This is for opening the target BPI module.
const { DeliveryOrderMenuPage } = require('../pages/base/moduleNavigation/DeliveryOrderMenuPage');
// This is for transaction screen actions and checks.
const { DeliveryOrderPage } = require('../pages/transactions/DeliveryOrderPage');
// This is for saving step screenshots.
const { takeStepScreenshot } = require('../helpers/screenshots');
// This is for recording the test result summary.
const {
  finishRunSummary,
  recordModuleDocNo,
  startRunSummary
} = require('../helpers/runSummary');

test('Delivery Order', async ({ page }) => {
  test.setTimeout(120000);

  const testId = 'sales-delivery-order';
  const testName = 'delivery order';
  const bpCode = process.env.BPI_DELIVERY_BPCODE || process.env.BPI_SALES_BPCODE || '';
  const loginPage = new LoginPage(page);
  const deliveryOrderMenu = new DeliveryOrderMenuPage(page);
  const deliveryOrder = new DeliveryOrderPage(page);

  startRunSummary(testId, 'Delivery Order');

  await loginPage.loginAs();
  await deliveryOrderMenu.open();
  await deliveryOrder.expectLoaded();
  recordModuleDocNo('Delivery Order', '', 'Opened', testId);
  await takeStepScreenshot(page, testName, '00_DELIVERY_ORDER_OPENED');

  if (!bpCode) {
    throw new Error('Set BPI_DELIVERY_BPCODE or BPI_SALES_BPCODE before running Delivery Order.');
  }

  await deliveryOrder.selectBusinessPartnerFromCfl(bpCode, {
    beforeSelect: async (bpCFLPage) => {
      await takeStepScreenshot(bpCFLPage, testName, '01_DELIVERY_BP_CFL_POPUP');
    }
  });
  recordModuleDocNo('Delivery Order BP Code', bpCode, 'Selected from CFL', testId);
  await takeStepScreenshot(page, testName, '02_DELIVERY_BP_SELECTED');

  const copyFromPopup = await deliveryOrder.openCopyFromPopup();
  recordModuleDocNo('Copy From', '', 'Opened', testId);
  await takeStepScreenshot(copyFromPopup.page, testName, '03_DELIVERY_COPY_FROM_POPUP');

  finishRunSummary('success', testId);
});
