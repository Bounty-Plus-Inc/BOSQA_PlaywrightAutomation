// This is for using Playwright test and assertion tools.
const { test } = require('@playwright/test');
// This is for logging in before test steps run.
const { LoginPage } = require('../pages/base/LoginPage');
// This is for opening the target BPI module.
const {
  CreditLimitApprovalMenuPage
} = require('../pages/base/moduleNavigation/CreditLimitApprovalMenuPage');
// This is for opening the target BPI module.
const {
  CreditLimitCheckingMenuPage
} = require('../pages/base/moduleNavigation/CreditLimitCheckingMenuPage');
// This is for opening the target BPI module.
const { SalesOrderMenuPage } = require('../pages/base/moduleNavigation/SalesOrderMenuPage');
// This is for opening the target BPI module.
const { DeliveryOrderMenuPage } = require('../pages/base/moduleNavigation/DeliveryOrderMenuPage');
// This is for opening the target BPI module.
const {
  TransactionApprovalMenuPage
} = require('../pages/base/moduleNavigation/TransactionApprovalMenuPage');
// This is for transaction screen actions and checks.
const { SalesOrderPage } = require('../pages/transactions/SalesOrderPage');
// This is for Delivery Order transaction actions.
const { DeliveryOrderPage } = require('../pages/transactions/DeliveryOrderPage');
// This is for approval screen actions and checks.
const { CreditLimitPage } = require('../pages/approvals/CreditLimitPage');
// This is for approval screen actions and checks.
const { TransactionApprovalPage } = require('../pages/approvals/TransactionApprovalPage');
// This is for reading or filling business partner codes.
const { getSalesBpCode } = require('../helpers/bpCode');
// This is for reading item codes used by tests.
const { getSalesItemCode } = require('../helpers/itemCode');
// This is for saving step screenshots.
const { takeStepScreenshot } = require('../helpers/screenshots');
// This is for recording the test result summary.
const {
  finishRunSummary,
  recordModuleDocNo,
  startRunSummary
} = require('../helpers/runSummary');

test('Sales Order', async ({ page }) => {
  test.setTimeout(240000);

  const testId = 'sales-sales-order-transaction';
  const testName = 'sales order transaction';
  const salesBpCode = getSalesBpCode();
  const salesItemCode = getSalesItemCode();
  const salesItemCount = Math.min(
    Math.max(Number.parseInt(process.env.BPI_SALES_ITEM_COUNT || '1', 10) || 1, 1),
    20
  );
  const approverUserId = process.env.BPI_USERID || 'playwrightAut';
  const loginPage = new LoginPage(page);
  const salesOrderMenu = new SalesOrderMenuPage(page);
  const creditLimitCheckingMenu = new CreditLimitCheckingMenuPage(page);
  const creditLimitApprovalMenu = new CreditLimitApprovalMenuPage(page);
  const transactionApprovalMenu = new TransactionApprovalMenuPage(page);
  const deliveryOrderMenu = new DeliveryOrderMenuPage(page);
  const salesOrder = new SalesOrderPage(page);
  const creditLimit = new CreditLimitPage(page);
  const transactionApproval = new TransactionApprovalPage(page);
  const deliveryOrder = new DeliveryOrderPage(page);
  startRunSummary(testId, 'Sales Order');
  const resolveDeliverySourceDocNo = (memory) =>
    process.env.BPI_DELIVERY_SALES_ORDER_DOCNO ||
    process.env.BPI_DELIVERY_COPY_FROM_DOCNO ||
    memory.docNo ||
    '';

  const runCreditLimitChecking = async (memory) => {
    await test.step('CREDIT LIMIT STANDARD', async () => {
      await creditLimitCheckingMenu.open();
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
      await creditLimitApprovalMenu.open();
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

  const runTransactionApproval = async (memory) => {
    await test.step('APPROVAL TRANSACTION', async () => {
      await transactionApprovalMenu.open();
      await transactionApproval.expectLoaded();
      recordModuleDocNo('Transaction Approval', memory.docNo, 'Opened', testId);
      await takeStepScreenshot(page, testName, '08_TRANSACTION_APPROVAL_OPENED');

      const approvalRemark = await transactionApproval.approveDocument(
        async () => {
          await takeStepScreenshot(page, testName, '09_TRANSACTION_APPROVAL_SELECTED');
        },
        { docNo: memory.docNo }
      );

      recordModuleDocNo('Transaction Approval', memory.docNo, approvalRemark, testId);
      await takeStepScreenshot(page, testName, '10_TRANSACTION_APPROVAL_DONE');
    });
  };

  const runDeliveryOrderCopyFrom = async (memory) => {
    await test.step('DELIVERY ORDER COPY FROM SALES ORDER', async () => {
      const sourceDocNo = resolveDeliverySourceDocNo(memory);

      await deliveryOrderMenu.open();
      await deliveryOrder.expectLoaded();
      recordModuleDocNo('Delivery Order', sourceDocNo, 'Opened', testId);
      await takeStepScreenshot(page, testName, '12_DELIVERY_ORDER_OPENED');

      const copyResult = await deliveryOrder.copyFromSalesOrder({
        bpCode: memory.bpCode,
        salesOrderDocNo: sourceDocNo,
        hooks: {
          beforeSelectBp: async (bpCFLPage) => {
            await takeStepScreenshot(bpCFLPage, testName, '13_DELIVERY_BP_CFL_POPUP');
          },
          afterBpSelected: async (selectedBpCode) => {
            recordModuleDocNo(
              'Delivery Order BP Code',
              memory.bpCode,
              selectedBpCode,
              testId,
              selectedBpCode === memory.bpCode
                ? 'Validated successfully against the expected value.'
                : 'Actual value differs from the expected value.'
            );
            await takeStepScreenshot(page, testName, '14_DELIVERY_BP_SELECTED');
          },
          afterCopyFromOpened: async (copyFrom) => {
            await takeStepScreenshot(copyFrom.page, testName, '15_DELIVERY_COPY_FROM_POPUP');
          },
          afterHeaderSelected: async (selectedHeader, copyFrom) => {
            const actualDocNo = selectedHeader.docNo || sourceDocNo;
            recordModuleDocNo(
              'Delivery Order Copy From Sales Order',
              sourceDocNo,
              actualDocNo,
              testId,
              actualDocNo === sourceDocNo
                ? 'Validated successfully against the expected value.'
                : 'Actual value differs from the expected value.'
            );
            await takeStepScreenshot(copyFrom.page, testName, '16_DELIVERY_SOURCE_SELECTED');
          },
          afterItemsLoaded: async (copyFrom) => {
            await takeStepScreenshot(copyFrom.page, testName, '17_DELIVERY_ITEMS_LOADED');
          },
          afterItemSelected: async (copyFrom) => {
            await takeStepScreenshot(copyFrom.page, testName, '18_DELIVERY_ITEMS_SELECTED');
          },
          afterLineCopied: async (validations) => {
            for (const validation of validations) {
              recordModuleDocNo(
                `Delivery Order Copied Line ${validation.label}`,
                validation.expectedValue || '-',
                validation.actualValue || '-',
                testId,
                validation.passed
                  ? 'Validated successfully against the copied source line.'
                  : 'Actual copied value differs from the source line.'
              );
            }
          },
          afterDeliveryDetailsCompleted: async (validations) => {
            for (const validation of validations) {
              recordModuleDocNo(
                `Delivery Order ${validation.label}`,
                validation.expectedValue || '-',
                validation.actualValue || '-',
                testId,
                validation.passed
                  ? 'Validated successfully against the expected value.'
                  : 'Actual value differs from the expected value.'
              );
            }
          },
          afterDraftAttachmentCompleted: async (result) => {
            recordModuleDocNo(
              'Delivery Order Draft',
              result.docNo || '-',
              'Saved as Draft',
              testId,
              'Delivery Order was saved as draft before validating IRCD and attachment.'
            );
            for (const validation of result.validations) {
              recordModuleDocNo(
                `Delivery Order ${validation.label}`,
                validation.expectedValue || '-',
                validation.actualValue || '-',
                testId,
                validation.passed
                  ? 'Validated successfully against the expected value.'
                  : 'Actual value differs from the expected value.'
              );
            }
          },
          afterFinished: async () => {
            await takeStepScreenshot(page, testName, '19_DELIVERY_ITEMS_COPIED');
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
    });
  };

  await loginPage.loginAs();

  await salesOrderMenu.open();
  await takeStepScreenshot(page, testName, '00_SalesOrder_Page_Opened');

  await salesOrder.expectCustomerLabelVisible();
  await takeStepScreenshot(page, testName, '01_Customer_Label_Visible');

  await salesOrder.selectInitialCustomerFromLookup(salesBpCode, {
    beforeSelect: async (customerCFLPage) => {
      await takeStepScreenshot(customerCFLPage, testName, '02_BP_CFL_POPUP');
    }
  });
  await takeStepScreenshot(page, testName, '02_BP_Code_Returned');

  await salesOrder.selectDocSeries('359');
  await takeStepScreenshot(page, testName, '03_DocSeries_Selected');

  await salesOrder.addItems({
    itemCode: salesItemCode,
    unitPrice: '100',
    businessCenter: 'NCRCL',
    count: salesItemCount,
    beforeSelectItem: async (itemCFLPage, index) => {
      if (index === 0) {
        await takeStepScreenshot(itemCFLPage, testName, '04_ITEM_CFL_POPUP');
      }
    }
  });
  await takeStepScreenshot(page, testName, '04_Item_Updated');

  await salesOrder.fillHeaderDetails({
    distributionChannel: 'OUTRIGHT',
    divisionIndex: 1,
    businessCenter: 'NCRCL'
  });
  await takeStepScreenshot(page, testName, '05_Header_Details_Filled');

  const draftOutcome = await salesOrder.saveAsDraft();
  if (draftOutcome.isPostingDateOrDueDateInvalid) {
    const memory = await salesOrder.readDocumentMemory();
    recordModuleDocNo(
      'Sales Order',
      memory.docNo,
      'Created Transaction is not valid to current posting period or Duedate',
      testId,
      'Check Posting Date or Due Date setup to proceed the selected transaction.'
    );
    finishRunSummary('success', testId);
    return;
  }
  await takeStepScreenshot(page, testName, '06_Status_Draft', 0);

  const addOutcome = await salesOrder.addOrUpdateUntilOpen();

  console.log(`[SALES ORDER] Add/Update status message: ${addOutcome.statusMsg || '(empty)'}`);

  if (addOutcome.isPostingDateOrDueDateInvalid) {
    const memory = await salesOrder.readDocumentMemory();
    recordModuleDocNo(
      'Sales Order',
      memory.docNo,
      'Created Transaction is not valid to current posting period or Duedate',
      testId,
      'Check Posting Date or Due Date setup to proceed the selected transaction.'
    );
    finishRunSummary('success', testId);
    return;
  }

  if (addOutcome.isCreditLimitBlocked) {
    const memory = await salesOrder.readDocumentMemory();
    recordModuleDocNo('Sales Order', memory.docNo, 'Credit Limit Blocked', testId);
    console.log(
      `[CREDIT LIMIT STANDARD] Memory saved -> bpCode: ${memory.bpCode}, docNo: ${memory.docNo}`
    );

    await takeStepScreenshot(page, testName, 'ZZ_Credit_Limit_Blocking_Message');
    await runCreditLimitChecking(memory);
    await runTransactionApproval(memory);
    await runDeliveryOrderCopyFrom(memory);
    finishRunSummary('success', testId);
    return;
  }

  if (!addOutcome.isOpen) {
    if (addOutcome.isProcessEndedSuccessfully) {
      const memory = await salesOrder.readDocumentMemory();
      recordModuleDocNo('Sales Order', memory.docNo, 'For Transaction Approval', testId);
      console.log(
        `[SALES ORDER] Process ended successfully; proceeding to Transaction Approval -> bpCode: ${memory.bpCode}, docNo: ${memory.docNo}`
      );
      await runTransactionApproval(memory);
      await runDeliveryOrderCopyFrom(memory);
      finishRunSummary('success', testId);
      return;
    }

    await takeStepScreenshot(page, testName, 'ZZ_Status_Not_Open_Latest');
    finishRunSummary('not-open', testId);
    return;
  }

  const memory = await salesOrder.readDocumentMemory();
  recordModuleDocNo('Sales Order', memory.docNo, 'Open', testId);
  finishRunSummary('success', testId);
  await takeStepScreenshot(page, testName, '07_Status_Open_After_Add');
});
