const { expect } = require('@playwright/test');
const { BasePage } = require('../base/BasePage');
const { selectFromCfl } = require('../../helpers/cflHelper-udarbe');
const { fillField } = require('../../helpers/fieldHelper-udarbe');

class GoodsReceiptPage extends BasePage {
  async expectLoaded() {
    await expect
      .poll(
        async () => {
          const bodyFrame = this.page.frame({ name: 'iframeBody' });
          return bodyFrame ? bodyFrame.url() : this.page.url();
        },
        { timeout: 20000 }
      )
      .toContain('GoodsReceipt');
  }

  async getDocumentNo() {
    const input = await this.findInAllFrames('#df_docno');
    return (await input.inputValue()).trim();
  }

  // ============================================================
  // Generic helpers
  // ============================================================

  async ensureFieldValue(selector, value, fillAction, fieldName = 'Field') {
    const locator = await this.findInAllFrames(selector).catch(() => null);

    const existing = locator
      ? String(await locator.inputValue().catch(() => '')).trim()
      : '';

    if (existing) {
      console.log(`[${fieldName}] Using existing value: ${existing}`);
      return existing;
    }

    await fillAction(value);

    return value;
  }

  // ============================================================
  // CFL fields
  // ============================================================

  async inputItemCode(itemCode) {
    await selectFromCfl(this, {
      value: itemCode,
      inputSelector: '#df_itemcodeT1',
      cflSelector: '#cfl_itemcodeT1'
    });
  }

  async inputWhsCode(whsCode) {
    await selectFromCfl(this, {
      value: whsCode,
      inputSelector: '#df_whscodeT1',
      cflSelector: '#cfl_whscodeT1'
    });
  }

  async inputProfitCenter(profitCenter) {
    await selectFromCfl(this, {
      value: profitCenter,
      inputSelector: '#df_drcodeT1',
      cflSelector: '#cfl_drcodeT1'
    });
  }

  async clickInventoryButtonIfExists() {
    const button = await this.findInAllFrames('#btnInventory').catch(() => null);

    if (!button || !(await button.isVisible())) {
      console.log('[INFO] Inventory button does not exist.');
      return false;
    }

    console.log('[INFO] Inventory button exists. Clicking...');

    // Wait for popup
    const popupPromise = this.page.context().waitForEvent('page');

    await button.click();

    const popup = await popupPromise;

    await popup.waitForLoadState('domcontentloaded');
    await popup.waitForTimeout(5000);

    // Wait until controls are ready
    await popup.locator('#df_batchT15').waitFor({
      state: 'visible',
      timeout: 60000
    });

    // Read required quantity
    const requiredQty = await popup.locator('#df_requiredqty').inputValue();

    // Dates
    const today = new Date();
    const expDate = new Date(today);
    expDate.setFullYear(today.getFullYear() + 1);

    const formatDate = date =>
      `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;

    // Fill values
    await popup.locator('#df_batchT15').fill('123');
    await popup.locator('#df_qtyT15').fill(requiredQty);
    await popup.locator('#df_u_batchcodeT15').fill('123');
    await popup.locator('#df_u_proddateT15').fill(formatDate(today));
    await popup.locator('#df_u_expdateT15').fill(formatDate(expDate));

    console.log('[INFO] Clicking Update...');

    await popup.locator('#T15_btnUpdate').click();

    // Give the popup time to process
    await popup.waitForTimeout(2000);

    console.log('[INFO] Clicking OK...');

    const okButton = popup.getByRole('link', { name: 'OK' });

    await Promise.all([
      popup.waitForEvent('close'),
      okButton.click()
    ]);

    console.log('[INFO] Popup closed.');

    // Return to Goods Receipt page
    await this.page.bringToFront();

    const addButton = await this.findInAllFrames('#btnAdd');

    await expect(addButton).toBeVisible({
      timeout: 30000
    });

    console.log('[INFO] Returned to Goods Receipt.');

    return true;
  }
  // ============================================================
  // Normal input fields
  // ============================================================

  async inputQuantity(quantity) {
    await fillField(this, '#df_quantityT1', quantity);
  }

  async inputSecondaryQuantity(quantity) {
    await fillField(this, '#df_u_quantityT1', quantity);
  }

  async inputUnitPrice(unitPrice) {
    await fillField(this, '#df_unitpriceT1', unitPrice);
  }

  // ============================================================
  // Buttons
  // ============================================================

  async clickUpdate() {
    const updateButton = await this.findInAllFrames('#T1_btnUpdate');

    console.log('[INFO] Clicking Update...');

    await updateButton.click();

    // Give BPI time to process the update
    await this.page.waitForLoadState('networkidle').catch(() => { });
    await this.page.waitForTimeout(3000);

    // Wait until Add button is ready
    const addButton = await this.findInAllFrames('#btnAdd');

    await expect(addButton).toBeVisible({
      timeout: 30000
    });

    await expect(addButton).toBeEnabled({
      timeout: 30000
    });

    console.log('[INFO] Goods Receipt update completed.');
  }


  async clickAdd() {
    const printPopupPromise = this.page.context().waitForEvent('page');

    await Promise.all([
      this.page.waitForEvent('dialog').then(dialog => dialog.accept()),
      (await this.findInAllFrames('#btnAdd')).click()
    ]);

    const printPopup = await printPopupPromise;

    await printPopup.waitForLoadState('domcontentloaded');

    // Close the print popup
    await Promise.all([
      printPopup.waitForEvent('close'),
      printPopup.getByRole('link', { name: 'Cancel' }).click()
    ]);

    // Return focus to Goods Receipt
    await this.page.bringToFront();

    // Wait until document is generated
    await expect
      .poll(() => this.getDocumentNo(), {
        timeout: 60000
      })
      .not.toBe('');

    // Wait until Journal Entry link appears
    const jeLink = await this.findInAllFrames('#lnkbtn_jelink');

    await expect(jeLink).toBeVisible({
      timeout: 60000
    });
  }
  async clickJournalEntry() {
    const popupPromise = this.page.context().waitForEvent('page');

    await (await this.findInAllFrames('#lnkbtn_jelink')).click();

    const journalPage = await popupPromise;
    await journalPage.waitForLoadState('domcontentloaded');

    return journalPage;
  }

  async closeJournalEntry(journalPage) {
    await journalPage.close();
    await this.page.bringToFront();
  }

  //validation
  async validateJournalEntry(journalPage) {
    // Goods Receipt page
    const grDocNo = (
      await (await this.findInAllFrames('#df_docno')).inputValue()
    ).trim();

    const totalAmount = parseFloat(
      (
        await (await this.findInAllFrames('#df_totalamount')).inputValue()
      ).replace(/,/g, '')
    );

    // Journal Entry popup
    const jeDocNo = (
      await journalPage.locator('#df_docno').inputValue()
    ).trim();

    const totalDebit = parseFloat(
      (
        await journalPage.locator('#df_totalgldebit').inputValue()
      ).replace(/,/g, '')
    );

    const totalCredit = parseFloat(
      (
        await journalPage.locator('#df_totalglcredit').inputValue()
      ).replace(/,/g, '')
    );

    // Assertions
    expect(jeDocNo).toBe(grDocNo);
    expect(totalDebit).toBe(totalAmount);
    expect(totalCredit).toBe(totalAmount);

    return {
      documentNo: grDocNo,
      journalDocumentNo: jeDocNo,
      totalAmount,
      totalDebit,
      totalCredit
    };
  }
}

module.exports = {
  GoodsReceiptPage
};