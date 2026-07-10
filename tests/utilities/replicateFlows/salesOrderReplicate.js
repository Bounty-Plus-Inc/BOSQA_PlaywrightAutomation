// This file owns the Sales Order-specific replicate workflow used by Find Document.
const { SalesOrderMenuPage } = require('../../pages/base/moduleNavigation/SalesOrderMenuPage');
const { DeliveryOrderMenuPage } = require('../../pages/base/moduleNavigation/DeliveryOrderMenuPage');
const {
  CreditLimitApprovalMenuPage
} = require('../../pages/base/moduleNavigation/CreditLimitApprovalMenuPage');
const {
  CreditLimitCheckingMenuPage
} = require('../../pages/base/moduleNavigation/CreditLimitCheckingMenuPage');
const {
  TransactionApprovalMenuPage
} = require('../../pages/base/moduleNavigation/TransactionApprovalMenuPage');
const { SalesOrder } = require('../../pages/ReCreateTransaction/SalesOrder');
const { DeliveryOrderPage } = require('../../pages/transactions/DeliveryOrderPage');
const { CreditLimitPage } = require('../../pages/approvals/CreditLimitPage');
const { TransactionApprovalPage } = require('../../pages/approvals/TransactionApprovalPage');
const {
  SalesOrderDocumentData
} = require('../../helpers/documentReaders/config/SalesOrderDocumentData');

async function replicateSalesOrderTransaction({
  capturedData,
  page,
  testId,
  testName,
  recordValidationResult,
  recordModuleDocNo,
  takeStepScreenshot
}) {
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

  const draftOutcome = await salesOrder.saveAsDraft();
  const draftMemory = await salesOrder.readDocumentMemory();
  if (draftOutcome.isPostingDateOrDueDateInvalid) {
    recordModuleDocNo(
      'Sales Order',
      draftMemory.docNo,
      'Created Transaction is not valid to current posting period or Duedate',
      testId,
      'Check Posting Date or Due Date setup to proceed the selected transaction.'
    );
    return 'success';
  }

  recordModuleDocNo('Recreated Sales Order', draftMemory.docNo, 'Draft', testId);
  await takeStepScreenshot(page, testName, '06_RECREATE_STATUS_DRAFT');

  const addOutcome = await salesOrder.addOrUpdateUntilOpen();
  const readLatestMemory = () =>
    salesOrder.readDocumentMemory({
      fallbackBpCode: draftMemory.bpCode,
      fallbackDocNo: draftMemory.docNo
    });

  if (addOutcome.isPostingDateOrDueDateInvalid) {
    const memory = await readLatestMemory();
    recordModuleDocNo(
      'Sales Order',
      memory.docNo,
      'Created Transaction is not valid to current posting period or Duedate',
      testId,
      'Check Posting Date or Due Date setup to proceed the selected transaction.'
    );
    return 'success';
  }

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

const salesOrderReplicateFlow = {
  actionId: 'sales-order',
  documentDataConfig: SalesOrderDocumentData,
  replicate: replicateSalesOrderTransaction
};

module.exports = {
  salesOrderReplicateFlow
};
