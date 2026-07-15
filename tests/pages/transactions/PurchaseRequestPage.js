// This is for using Playwright test and assertion tools.
const { expect } = require("@playwright/test");

// This is for shared page object behavior.
const { BasePage } = require("../base/BasePage");

const { BusinessPartnerCFL } = require("../popups/BusinessPartnerCFL");

const { ItemCFL } = require("../popups/ItemCFL");
const { WarehouseCFL } = require("../popups/WarehouseCFL");
const { BuyerCFL } = require("../popups/BuyerCFL");
const { ApprovalMatrixTitleCFL } = require("../popups/ApprovalMatrixTitleCFL");
class PurchaseRequestPage extends BasePage {
  async expectLoaded() {
    await expect
      .poll(
        async () => {
          const bodyFrame = this.page.frame({ name: "iframeBody" });
          return bodyFrame ? bodyFrame.url() : "";
        },
        { timeout: 20000 },
      )
      .not.toBe("");

    const vendorButton = await this.findInAllFrames(
      'xpath=//*[@id="cfl_bpcode"]',
      20,
    );

    await expect(vendorButton).toBeVisible({
      timeout: 20000,
    });
  }
  async selectVendor(vendorCode, options = {}) {
    const { beforeSelect } = options;
    const vendorButton = await this.findInAllFrames(
      'xpath=//*[@id="cfl_bpcode"]',
      20,
    );

    const popupPromise = this.page.context().waitForEvent("page");

    await vendorButton.click();

    const popupPage = await popupPromise;
    await popupPage.waitForLoadState("domcontentloaded");

    if (beforeSelect) {
      await beforeSelect(popupPage);
    }

    const businessPartnerCFL = new BusinessPartnerCFL(popupPage);

    await businessPartnerCFL.selectCode(vendorCode, {
      entityName: "Supplier code",
      fieldName: "suppno",
      columnId: "col_suppnoT1",
    });

    // Wait until the popup closes and focus returns
    await this.page.waitForTimeout(500);
  }

  async selectItem(itemCode, options = {}) {
    const { beforeSelect } = options;
    const itemButton = await this.findInAllFrames(
      'xpath=//*[@id="cfl_itemcodeT1"]',
      20,
    );

    const popupPromise = this.page.context().waitForEvent("page");

    await itemButton.click();

    const popupPage = await popupPromise;
    await popupPage.waitForLoadState("domcontentloaded");
    if (beforeSelect) {
      await beforeSelect(popupPage);
    }

    const itemCFL = new ItemCFL(popupPage);

    await itemCFL.selectItemByLabel(itemCode);

    await this.page.waitForTimeout(500);
  }

  async selectWarehouse(warehouseCode, options = {}) {
    const { beforeSelect } = options;
    const warehouseButton = await this.findInAllFrames(
      'xpath=//*[@id="cfl_whscodeT1"]',
      20,
    );

    const popupPromise = this.page.context().waitForEvent("page");

    await warehouseButton.click();

    const popupPage = await popupPromise;
    await popupPage.waitForLoadState("domcontentloaded");
    if (beforeSelect) {
      await beforeSelect(popupPage);
    }
    const warehouseCFL = new WarehouseCFL(popupPage);

    await warehouseCFL.selectWarehouseCode(warehouseCode);

    await this.page.waitForTimeout(500);
  }
  async addLineItem() {
    const addButton = await this.findInAllFrames(
      'xpath=//*[@id="T1_btnUpdate"]',
      20,
    );

    await addButton.click();
  }

  async selectRequestedBy(requestedBy) {
    const dropdown = await this.findInAllFrames(
      'xpath=//*[@id="df_docowner"]',
      20,
    );

    await dropdown.selectOption({ label: requestedBy });
  }

  async fillRemarks(remarks) {
    const remarksTextbox = await this.findInAllFrames(
      'xpath=//*[@id="df_remarks"]',
      20,
    );

    await remarksTextbox.fill(remarks);
  }

  async openAccountingTab() {
    const accountingTab = await this.findInAllFrames(
      'xpath=//*[@id="tab1nav3"]',
      20,
    );

    await accountingTab.click();
  }

  async selectPaymentTerm() {
    const dropdown = await this.findInAllFrames(
      'xpath=//*[@id="df_paymentterm"]',
      20,
    );

    const options = await dropdown.locator("option").evaluateAll((options) =>
      options.map((option) => ({
        value: option.value,
        label: option.textContent.trim(),
      })),
    );

    const validOptions = options.filter((option) => option.value);

    validOptions.sort((a, b) => Number(a.value) - Number(b.value));

    const lowest = validOptions[0];

    await dropdown.selectOption({ value: lowest.value });
  }

  async openGeneralTab() {
    const generalTab = await this.findInAllFrames(
      'xpath=//*[@id="tab1nav5"]',
      20,
    );

    await generalTab.click();
  }

  async selectBuyer(buyerCode, options = {}) {
    const { beforeSelect } = options;

    const buyerButton = await this.findInAllFrames(
      'xpath=//*[@id="cfl_u_buyer"]',
      20,
    );

    const popupPromise = this.page.context().waitForEvent("page");

    await buyerButton.click();

    const popupPage = await popupPromise;
    await popupPage.waitForLoadState("domcontentloaded");

    if (beforeSelect) {
      await beforeSelect(popupPage);
    }

    const buyerCFL = new BuyerCFL(popupPage);

    await buyerCFL.selectBuyer(buyerCode);

    await this.page.waitForTimeout(500);
  }

  async selectApprovalMatrix(options = {}) {
    const { beforeSelect } = options;

    const button = await this.findInAllFrames(
      'xpath=//*[@id="cfl_u_approvalmatrixtitle"]',
      20,
    );

    const popupPromise = this.page.context().waitForEvent("page");

    await button.click();

    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");

    if (beforeSelect) {
      await beforeSelect(popup);
    }

    const approval = new ApprovalMatrixTitleCFL(popup);

    await approval.selectFirstRow();
  }

  async saveAsDraft() {
    const saveDraftButton = await this.findInAllFrames(
      'xpath=//*[@id="btnSaveAsDraft"]',
      20,
    );

    await saveDraftButton.waitFor({
      state: "visible",
      timeout: 10000,
    });

    await saveDraftButton.click();
  }

  async clickAdd() {
    const addButton = await this.findInAllFrames(
      'xpath=//*[@id="btnUpdate"]',
      20,
    );

    await addButton.waitFor({
      state: "visible",
      timeout: 10000,
    });

    await addButton.click();
  }

  async getStatusMessage() {
    const statusMessage = await this.findInAllFrames(
      'xpath=//*[@id="statusMsgColumn"]',
      20,
    );

    return ((await statusMessage.textContent()) || "").trim();
  }

  async isAttachmentRequired() {
    for (let i = 0; i < 10; i++) {
      const message = (await this.getStatusMessage()).toLowerCase();

      if (message.includes("attachment") || message.includes("attach")) {
        return true;
      }

      await this.page.waitForTimeout(500);
    }

    return false;
  }

  async getDocumentNumber() {
    const documentNumber = await this.findInAllFrames(
      'xpath=//*[@id="df_docno"]',
      20,
    );

    return ((await documentNumber.inputValue()) || "").trim();
  }

  async readDocumentMemory() {
    return {
      docNo: await this.getDocumentNumber(),
      status: await this.getStatusMessage(),
    };
  }
}

module.exports = { PurchaseRequestPage };
