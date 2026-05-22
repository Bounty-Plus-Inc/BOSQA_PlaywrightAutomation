const { test } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { MainMenuPage } = require('../pages/MainMenuPage');
const { DeliveryOrderPage } = require('../pages/DeliveryOrderPage');
const { takeStepScreenshot } = require('../helpers/screenshots');
const {
  finishRunSummary,
  getModuleDocNo,
  recordModuleDocNo,
  startRunSummary
} = require('../helpers/runSummary');

test('Delivery Order', async ({ page }) => {
  test.setTimeout(180000);

  const testId = 'delivery-order';
  const testName = 'delivery order';
  const bpCode = process.env.BPI_DELIVERY_BPCODE || '10000010';
  const salesOrderDocNo =
    process.env.BPI_DELIVERY_SODOCNO || getModuleDocNo('Sales Order', 'sales-standard');
  const loginPage = new LoginPage(page);
  const menu = new MainMenuPage(page);
  const deliveryOrder = new DeliveryOrderPage(page);

  startRunSummary(testId, 'Delivery Order');

  await loginPage.loginAs();
  await menu.openDeliveryOrder();
  await deliveryOrder.expectLoaded();
  recordModuleDocNo('Delivery Order', '', 'Opened', testId);
  await takeStepScreenshot(page, testName, '00_DELIVERY_ORDER_OPENED');

  const salesOrdersPopup = await deliveryOrder.openCopyFromSalesOrdersPopup(bpCode, async () => {
    await takeStepScreenshot(page, testName, '01_DELIVERY_BP_COPY_FROM_READY');
  });
  recordModuleDocNo('Delivery Order', '', `Copy From Sales Orders opened for BP ${bpCode}`, testId);
  await takeStepScreenshot(salesOrdersPopup, testName, '02_DELIVERY_SALES_ORDERS_POPUP');

  const selectedHeader = await deliveryOrder.copySalesOrderFromPopup(
    salesOrdersPopup,
    salesOrderDocNo,
    {
      afterHeaderSelected: async () => {
        await takeStepScreenshot(salesOrdersPopup, testName, '03_DELIVERY_SO_HEADER_SELECTED');
      },
      afterItemsLoaded: async () => {
        await takeStepScreenshot(salesOrdersPopup, testName, '04_DELIVERY_SO_ITEMS_LOADED');
      },
      beforeFinish: async () => {
        await takeStepScreenshot(salesOrdersPopup, testName, '05_DELIVERY_SO_ITEMS_SELECTED');
      }
    }
  );

  recordModuleDocNo('Source Sales Order', selectedHeader.docNo, 'Sales Order copied', testId);
  await takeStepScreenshot(page, testName, '06_DELIVERY_ITEMS_COPIED_TO_MAIN');

  await deliveryOrder.selectDocumentSeries('Primary');
  await takeStepScreenshot(page, testName, '07_DELIVERY_DOCSERIES_PRIMARY');

  await deliveryOrder.selectInvoiceDeliveryDateToday();
  await takeStepScreenshot(page, testName, '08_DELIVERY_INV_DEL_DATE_TODAY');

  await deliveryOrder.selectShipToCode('SHIP TO');
  await deliveryOrder.selectShipType('DELIVERY');
  await takeStepScreenshot(page, testName, '09_DELIVERY_SHIP_TO_ADDRESS_FILLED');

  await deliveryOrder.selectTruckerCode('000');
  await deliveryOrder.selectPlateNumber();
  await takeStepScreenshot(page, testName, '10_DELIVERY_TRUCKER_AND_PLATE_SELECTED');

  const deliveryOrderDocNo = await deliveryOrder.saveAsDraft();
  recordModuleDocNo('Delivery Order', deliveryOrderDocNo, 'Saved as Draft', testId);
  await takeStepScreenshot(page, testName, '11_DELIVERY_SAVED_AS_DRAFT');

  finishRunSummary('success', testId);
});
