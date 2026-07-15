// This is for using Playwright test and assertion tools.
const { expect } = require("@playwright/test");
// This is for shared page object behavior.
const { BasePage } = require("../base/BasePage");
const { BuyerCFL } = require("../popups/BuyerCFL");

class PurchaseAcknowledgementPage extends BasePage {
  async expectLoaded() {
    await expect
      .poll(
        async () => {
          const bodyFrame = this.page.frame({ name: "iframeBody" });
          return bodyFrame ? bodyFrame.url() : this.page.url();
        },
        { timeout: 20000 },
      )
      .not.toBe("");
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

  async clickFilter() {
    const filterButton = await this.findInAllFrames(
      "xpath=/html/body/form[1]/table[2]/tbody/tr/td[2]/table/tbody/tr[3]/td/table/tbody/tr[10]/td[2]/a",
      20,
    );

    await filterButton.click();
  }

async verifySelectedDocument() {
  const locator = this.page.locator('xpath=//*[@id="dd_u_docnoT1r1"]');

  const exists = await locator.count();

  if (exists === 0) {
    console.log("No Purchase Request found after filtering.");
    return false;
  }

  const documentNo = (await locator.textContent())?.trim();

  return true;
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

  async getStatusMessage() {
    const statusMessage = await this.findInAllFrames(
      'xpath=//*[@id="statusMsgColumn"]',
      20,
    );
    await this.page.waitForTimeout(1500);
    return ((await statusMessage.textContent()) || "").trim();
  }

  async isDraftSuccessful() {
    for (let i = 0; i < 10; i++) {
      const message = (await this.getStatusMessage()).toLowerCase();

      if (
        message.includes("successfully.") ||
        message.includes("Successfully")
      ) {
        return true;
      }

      await this.page.waitForTimeout(500);
    }

    return false;
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

  async selectAcknowledgementType(acknowledgementType) {
    const value = acknowledgementType.trim();

    const dropdown = await this.findInAllFrames(
      'xpath=//*[@id="df_u_acknowtype"]',
      20,
    );

    await dropdown.selectOption({ label: value });

    if (value.toLowerCase() === "return to maker") {
      const comment = await this.findInAllFrames(
        'xpath=//*[@id="df_u_acknowcommentT1r1"]',
        20,
      );

      const remarks = await this.findInAllFrames(
        'xpath=//*[@id="df_u_acknowremarks"]',
        20,
      );

      const genericComment =
        "Automation Test - Return to maker. Please review and update the required details before resubmitting.";

      await comment.fill(genericComment);
      await remarks.fill(genericComment);
    }
  }

  async getDocumentNumber() {
    const documentNumber = await this.findInAllFrames(
      'xpath=//*[@id="df_docno"]',
      20,
    );

    return ((await documentNumber.inputValue()) || "").trim();
  }
}

module.exports = { PurchaseAcknowledgementPage };
