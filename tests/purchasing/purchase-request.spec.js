// This is for using Playwright test and assertion tools.
const { test } = require("@playwright/test");

// This is for logging in before test steps run.
const { LoginPage } = require("../pages/base/LoginPage");

// This is for opening the target BPI module.
const {
  PurchasingMenuPage,
} = require("../pages/base/moduleNavigation/PurchasingMenuPage");

// This is for transaction screen actions and checks.
const {
  PurchaseRequestPage,
} = require("../pages/transactions/PurchaseRequestPage");

// This is for attachment-related actions and checks.
const { AttachmentPage } = require("../pages/attachments/AttachmentPage");

// This is for opening the Transaction Approval module.
const {
  TransactionApprovalMenuPage,
} = require("../pages/base/moduleNavigation/TransactionApprovalMenuPage");

// This is for approving transactions.
const {
  TransactionApprovalPage,
} = require("../pages/approvals/TransactionApprovalPage");

// This is for saving step screenshots.
const { takeStepScreenshot } = require("../helpers/screenshots");

// This is for recording the test result summary.
const {
  finishRunSummary,
  recordModuleDocNo,
  startRunSummary,
} = require("../helpers/runSummary");

test("Purchase Request", async ({ page }) => {
  test.setTimeout(120000);

  const testId = "purchasing-purchase-request";
  const testName = "purchasing purchase-request";

  startRunSummary(testId, "Purchase Request");

  const loginPage = new LoginPage(page);
  const moduleNavigation = new PurchasingMenuPage(page);
  const transactionPage = new PurchaseRequestPage(page);
  const attachmentPage = new AttachmentPage(page);
  const transactionApprovalMenu = new TransactionApprovalMenuPage(page);
  const transactionApproval = new TransactionApprovalPage(page);
  const purchaseRequest = {
    vendorCode: process.env.BPI_PR_VENDOR_CODE,
    itemCode: process.env.BPI_PR_ITEM_CODE,
    warehouseCode: process.env.BPI_PR_WAREHOUSE_CODE,
    requestedBy: process.env.BPI_PR_REQUESTED_BY,
    buyer: process.env.BPI_PR_BUYER,
    remarks: process.env.BPI_PR_REMARKS,
    attachmentFile: process.env.BPI_PR_ATTACHMENT_FILE,
  };

  console.log("Purchase Request Data:", purchaseRequest);

  await loginPage.loginAs();

  await test.step("Open Purchase Request", async () => {
    await moduleNavigation.open();
    await transactionPage.expectLoaded();

    recordModuleDocNo("Purchasing", "", "Draft", testId);

    await takeStepScreenshot(
      page,
      testName,
      "00_PURCHASING_PURCHASE_REQUEST_OPENED",
    );
  });

  await test.step("Select Vendor", async () => {
    await transactionPage.selectVendor(purchaseRequest.vendorCode, {
      beforeSelect: async (vendorCFLPage) => {
        await takeStepScreenshot(
          vendorCFLPage,
          testName,
          "01_VENDOR_CFL_POPUP",
        );
      },
    });

    await takeStepScreenshot(page, testName, "02_VENDOR_SELECTED");
  });

  await test.step("Select Item", async () => {
    await transactionPage.selectItem(purchaseRequest.itemCode, {
      beforeSelect: async (itemCFLPage) => {
        await takeStepScreenshot(itemCFLPage, testName, "03_ITEM_CFL_POPUP");
      },
    });

    await takeStepScreenshot(page, testName, "04_ITEM_SELECTED");
  });

  await test.step("Select Warehouse", async () => {
    await transactionPage.selectWarehouse(purchaseRequest.warehouseCode, {
      beforeSelect: async (warehouseCFLPage) => {
        await takeStepScreenshot(
          warehouseCFLPage,
          testName,
          "05_WAREHOUSE_CFL_POPUP",
        );
      },
    });

    await takeStepScreenshot(page, testName, "06_WAREHOUSE_SELECTED");
  });

  await test.step("Add Line Item", async () => {
    await transactionPage.addLineItem();

    await takeStepScreenshot(page, testName, "07_LINE_ITEM_ADDED");
  });

  await test.step("Fill Header Information", async () => {
    await transactionPage.selectRequestedBy(purchaseRequest.requestedBy);

    await takeStepScreenshot(page, testName, "08_REQUESTED_BY_SELECTED");

    await transactionPage.fillRemarks(purchaseRequest.remarks);

    await takeStepScreenshot(page, testName, "09_REMARKS_ENTERED");
  });


    await test.step("Accounting Tab", async () => {
    await transactionPage.openAccountingTab();

    await takeStepScreenshot(page, testName, "10_ACCOUNTING_TAB_OPENED");

    await transactionPage.selectPaymentTerm();

    await takeStepScreenshot(page, testName, "11_PAYMENT_SELECTED");

    await page.waitForTimeout(3000);
  });


  await test.step("General Tab", async () => {
    await transactionPage.openGeneralTab();

    await takeStepScreenshot(page, testName, "12_GENERAL_TAB_OPENED");

    await transactionPage.selectBuyer(purchaseRequest.buyer, {
      beforeSelect: async (buyerCFLPage) => {
        await takeStepScreenshot(buyerCFLPage, testName, "13_BUYER_CFL_POPUP");
      },
    });

    await takeStepScreenshot(page, testName, "14_BUYER_SELECTED");

    await transactionPage.selectApprovalMatrix({
      beforeSelect: async (approvalCFLPage) => {
        await takeStepScreenshot(
          approvalCFLPage,
          testName,
          "15_APPROVAL_MATRIX_CFL_POPUP",
        );
      },
    });
    await page.waitForTimeout(3000);
    await takeStepScreenshot(page, testName, "16_APPROVAL_MATRIX_SELECTED");
  });

  await test.step("Save Purchase Request as Draft", async () => {
    await transactionPage.saveAsDraft();
    await page.waitForTimeout(3000);
    await takeStepScreenshot(page, testName, "17_DOCUMENT_SAVED_AS_DRAFT");
  });


  await test.step("Add Purchase Request", async () => {
    await transactionPage.clickAdd();

    const attachmentRequired =
      await transactionPage.isAttachmentRequired();


    if (attachmentRequired) {
      await attachmentPage.openAttachmentWindow();

      await attachmentPage.uploadAttachment(
        purchaseRequest.attachmentFile
      );

      await takeStepScreenshot(
        page,
        testName,
        "18_ATTACHMENT_UPLOADED"
      );

      await transactionPage.clickAdd();

      await takeStepScreenshot(
        page,
        testName,
        "19_DOCUMENT_ADDED"
      );
    }
  });
  const memory = await transactionPage.readDocumentMemory();

  recordModuleDocNo(
    "Purchase Request",
    memory.docNo,
    "Pending Approval",
    testId,
  );

await test.step("Approve Purchase Request", async () => {
  await transactionApprovalMenu.open();

  await transactionApproval.expectLoaded();

  console.time("Approve Document");

  await transactionApproval.approveDocument(async () => {
    await takeStepScreenshot(
      page,
      testName,
      "20_TRANSACTION_APPROVAL_OPENED",
    );
  });

  console.timeEnd("Approve Document");

  recordModuleDocNo("Transaction Approval", memory.docNo, "Approved", testId);

  await takeStepScreenshot(page, testName, "21_PURCHASE_REQUEST_APPROVED");
});

  finishRunSummary("success", testId);
});
