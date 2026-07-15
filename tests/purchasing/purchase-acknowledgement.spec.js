// This is for using Playwright test and assertion tools.
const { test } = require("@playwright/test");

// This is for logging in before test steps run.
const { LoginPage } = require("../pages/base/LoginPage");

// This is for opening the target BPI module.
const {
  PurchaseAcknowledgementMenuPage,
} = require("../pages/base/moduleNavigation/PurchaseAcknowledgementMenuPage");

// This is for transaction screen actions and checks.
const {
  PurchaseAcknowledgementPage,
} = require("../pages/transactions/PurchaseAcknowledgementPage");

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

test("Purchase Acknowledgement", async ({ page }) => {
  test.setTimeout(120000);

  const testId = "purchasing-purchase-acknowledgement";
  const testName = "purchasing purchase-acknowledgement";

  startRunSummary(testId, "Purchase Acknowledgement");

  const loginPage = new LoginPage(page);
  const moduleNavigation = new PurchaseAcknowledgementMenuPage(page);
  const transactionPage = new PurchaseAcknowledgementPage(page);
  const attachmentPage = new AttachmentPage(page);
  const transactionApprovalMenu = new TransactionApprovalMenuPage(page);
  const transactionApproval = new TransactionApprovalPage(page);

  const purchaseAcknowledgement = {
    buyer: process.env.BPI_PA_BUYER,
    acknowledgementType: process.env.BPI_PA_ACKNOWLEDGEMENT_TYPE,
  };

  await loginPage.loginAs();

  await test.step("Open Purchase Acknowledgement", async () => {
    await moduleNavigation.open();
    await transactionPage.expectLoaded();

    const documentNo = await transactionPage.getDocumentNumber();

    recordModuleDocNo("Purchase Acknowledgment", documentNo, "Open", testId);

    await takeStepScreenshot(
      page,
      testName,
      "00_PURCHASING_PURCHASE_ACKNOWLEDGEMENT_OPENED",
    );
  });

  await test.step("Select Buyer", async () => {
    await transactionPage.selectBuyer(purchaseAcknowledgement.buyer, {
      beforeSelect: async (buyerCFLPage) => {
        await takeStepScreenshot(
          buyerCFLPage,
          testName,
          "01_BUYER_BUTTON_POPUP",
        );
      },
    });
  });

  await test.step("Click Filter", async () => {
    await transactionPage.clickFilter();
    const hasPurchaseRequest = await transactionPage.verifySelectedDocument();
        const documentNo = await transactionPage.getDocumentNumber();

    if (!hasPurchaseRequest) {
    recordModuleDocNo("Purchase Acknowledgment", documentNo, "Failed", testId,"Empty PR List.");

      finishRunSummary("failed", testId);
      test.skip(true, "No Purchase Request found after filtering.");
    }
    await takeStepScreenshot(page, testName, "02_FILTER_BUTTON_CLICKED");
  });

  await test.step("Select Acknowledgement Type", async () => {
    await transactionPage.selectAcknowledgementType(
      purchaseAcknowledgement.acknowledgementType,
    );

    await takeStepScreenshot(
      page,
      testName,
      "03_ACKNOWLEDGEMENT_TYPE_SELECTED",
    );
  });

  

  await test.step("Save as Draft", async () => {
    await transactionPage.saveAsDraft();

    const isSuccessful = await transactionPage.isDraftSuccessful();

    // Record the document number

    if (isSuccessful) {
      const draftDocumentNo = await transactionPage.getDocumentNumber();

      recordModuleDocNo(
        "Purchase Acknowledgement",
        draftDocumentNo,
        "Draft",
        testId,
      );

      await takeStepScreenshot(
        page,
        testName,
        "04_PURCHASE_ACKNOWLEDGEMENT_SAVED_AS_DRAFT",
      );

      await transactionPage.clickAdd();

      await takeStepScreenshot(
        page,
        testName,
        "05_PURCHASE_ACKNOWLEDGEMENT_DOCUMENT_ADDED",
      );
    }

    const documentNo = await transactionPage.getDocumentNumber();

    recordModuleDocNo("Purchase Acknowledgement", documentNo, "Open", testId);
  });

  finishRunSummary("success", testId);
});
