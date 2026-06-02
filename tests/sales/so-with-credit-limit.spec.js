const { test } = require('@playwright/test');
const { LoginPage } = require('../pages/base/LoginPage');
const { MainMenuPage } = require('../pages/base/MainMenuPage');
const { SalesOrderPage } = require('../pages/transactions/SalesOrderPage');
const { CreditLimitPage } = require('../pages/approvals/CreditLimitPage');
const { takeStepScreenshot } = require('../helpers/screenshots');
const {
  finishRunSummary,
  recordModuleDocNo,
  startRunSummary
} = require('../helpers/runSummary');

test('SO with Credit Limit', async ({ page }) => {
  test.setTimeout(240000);

  const testId = 'sales-so-with-credit-limit';
  const testName = 'sales standard process';
  const salesBpCode = process.env.BPI_SALES_BPCODE || '10000010';
  const salesItemCode = process.env.BPI_SALES_ITEMCODE || '10000002';
  const salesItemCount = Math.min(
    Math.max(Number.parseInt(process.env.BPI_SALES_ITEM_COUNT || '1', 10) || 1, 1),
    20
  );
  const approverUserId = process.env.BPI_USERID || 'playwrightAut';
  const loginPage = new LoginPage(page);
  const menu = new MainMenuPage(page);
  const salesOrder = new SalesOrderPage(page);
  const creditLimit = new CreditLimitPage(page);
  startRunSummary(testId, 'SO with Credit Limit');

  const runCreditLimitChecking = async (memory) => {
    await test.step('CREDIT LIMIT STANDARD', async () => {
      await menu.openCreditLimitChecking();
      await creditLimit.createCheck({
        customerNo: memory.bpCode,
        approverUserId,
        docNo: memory.docNo,
        beforeAdd: async () => {
          await takeStepScreenshot(page, testName, '08_CREDIT_LIMIT_STANDARD');
        }
      });
      recordModuleDocNo('Credit Limit Checking', memory.docNo, 'Approved', testId);
      await takeStepScreenshot(page, testName, '09_CREDIT_LIMIT_APPROVED');
    });

    await test.step('CREDIT LIMIT APPROVAL', async () => {
      await menu.openCreditLimitApproval();
      await creditLimit.createApproval({
        customerNo: memory.bpCode,
        // approverUserId is used in Credit Limit Checking, but Credit Limit Approval has no approver field.
        // approverUserId,
        remarksUserId: approverUserId,
        docNo: memory.docNo,
        beforeAdd: async () => {
          await takeStepScreenshot(page, testName, '10_CREDIT_LIMIT_APPROVAL');
        }
      });
      recordModuleDocNo('Credit Limit Approval', memory.docNo, 'Approved', testId);
      await takeStepScreenshot(page, testName, '11_CREDIT_LIMIT_APPROVAL_DONE');
    });
  };

  await loginPage.loginAs();

  await menu.openSalesOrder();
  await takeStepScreenshot(page, testName, '00_SalesOrder_Page_Opened');

  await salesOrder.expectCustomerLabelVisible();
  await takeStepScreenshot(page, testName, '01_Customer_Label_Visible');

  await salesOrder.selectInitialCustomerFromLookup(salesBpCode);
  await takeStepScreenshot(page, testName, '02_BP_Code_Returned');

  await salesOrder.selectDocSeries('359');
  await takeStepScreenshot(page, testName, '03_DocSeries_Selected');

  await salesOrder.addItems({
    itemCode: salesItemCode,
    unitPrice: '100',
    businessCenter: 'NCRCL',
    count: salesItemCount
  });
  await takeStepScreenshot(page, testName, '04_Item_Updated');

  await salesOrder.fillHeaderDetails({
    distributionChannel: 'OUTRIGHT',
    divisionIndex: 1
  });
  await takeStepScreenshot(page, testName, '05_Header_Details_Filled');

  await salesOrder.saveAsDraft();
  await takeStepScreenshot(page, testName, '06_Status_Draft');

  const addOutcome = await salesOrder.addOrUpdateUntilOpen();

  if (!addOutcome.isOpen) {
    console.log(`[SALES STANDARD] Add/Update status message: ${addOutcome.statusMsg || '(empty)'}`);

    if (!addOutcome.isCreditLimitBlocked) {
      await takeStepScreenshot(page, testName, 'ZZ_Status_Not_Open_Latest');
      finishRunSummary('not-open', testId);
      return;
    }

    const memory = await salesOrder.readDocumentMemory();
    recordModuleDocNo('Sales Order', memory.docNo, 'Credit Limit Blocked', testId);
    console.log(
      `[CREDIT LIMIT STANDARD] Memory saved -> bpCode: ${memory.bpCode}, docNo: ${memory.docNo}`
    );

    await takeStepScreenshot(page, testName, 'ZZ_Credit_Limit_Blocking_Message');
    await runCreditLimitChecking(memory);
    finishRunSummary('success', testId);
    return;
  }

  const memory = await salesOrder.readDocumentMemory();
  recordModuleDocNo('Sales Order', memory.docNo, 'Open', testId);
  finishRunSummary('success', testId);
  await takeStepScreenshot(page, testName, '07_Status_Open_After_Add');
});
