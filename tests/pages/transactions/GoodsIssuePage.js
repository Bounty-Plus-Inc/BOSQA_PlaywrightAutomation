// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');
const { selectFromCfl } = require('../../helpers/cflHelper-udarbe');
const { fillField } = require('../../helpers/fieldHelper-udarbe');
const { takeStepScreenshot } = require('../../helpers/screenshots');
const { recordModuleDocNo } = require('../../helpers/runSummary');
class GoodsIssuePage extends BasePage {
  async expectLoaded() {
    await expect
      .poll(async () => {
        const frame = this.page.frame({ name: 'iframeBody' });
        return frame?.url() ?? '';
      }, {
        timeout: 30000
      })
      .toContain('GoodsIssue');
  }

  async getDocumentNo() {
    const input = await this.findInAllFrames('#df_docno');
    return (await input.inputValue()).trim();
  }

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

  async inputQuantity(quantity) {
    await fillField(this, '#df_quantityT1', quantity);
  }

  async clickItemLink(whsCode, quantity) {
    const popupPromise = this.page.context().waitForEvent('page');

    await (await this.findInAllFrames('#lnkbtn_itemcodeT1')).click();

    const popup = await popupPromise;

    await popup.waitForLoadState('domcontentloaded');
    await popup.waitForTimeout(2000);

    // Open Inventory tab
    await popup.locator('#tab1nav5').click();

    await popup.waitForTimeout(2000);

    // Wait warehouse table loaded
    await popup.locator('input[id^="df_warehouseT1"]').first().waitFor({
      state: 'attached',
      timeout: 30000
    });


    // Find warehouse hidden input
    const warehouseInput = popup.locator(
      `input[id^="df_warehouseT1"][value="${whsCode}"]`
    );


    const warehouseFound = await warehouseInput.count() > 0;


    if (!warehouseFound) {

      console.log(`[INFO] Warehouse NOT found: ${whsCode}`);

      await popup.close();
      await this.page.bringToFront();

      return {
        warehouseFound: false,
        quantityAvailable: 0,
        quantityValid: false
      };
    }


    console.log(`[INFO] Warehouse found: ${whsCode}`);


    // Get exact row
    const warehouseRow = warehouseInput
      .first()
      .locator('xpath=ancestor::tr[1]');


    // Debug row
    console.log(
      await warehouseRow.innerText()
    );


    // Find available qty inside same row
    const availableQtyInput = warehouseRow.locator(
      'input[id^="df_availableqtyT1"]'
    ).first();


    const availableQtyValue = await availableQtyInput.inputValue();


    const availableQty = Number(
      availableQtyValue.replace(/,/g, '')
    );


    console.log(`[INFO] Available Qty: ${availableQty}`);
    console.log(`[INFO] Requested Qty: ${quantity}`);


    const quantityValid = quantity <= availableQty;


    await popup.close();
    await this.page.bringToFront();


    return {
      warehouseFound: true,
      quantityAvailable: availableQty,
      quantityValid
    };
  }

  async validateWarehouseResult({
    warehouseResult,
    page,
    testName,
    testId,
    whsCode,
    quantity
  }) {

    if (!warehouseResult.warehouseFound) {

      await takeStepScreenshot(
        page,
        testName,
        '02_WAREHOUSE_NOT_FOUND'
      );

      throw new Error(
        `Warehouse "${whsCode}" was not found in Item Availability.`
      );
    }


    if (!warehouseResult.quantityValid) {

      await takeStepScreenshot(
        page,
        testName,
        '03_WAREHOUSE_INSUFFICIENT_STOCK'
      );

      throw new Error(
        `Insufficient stock. Requested: ${quantity}, Available: ${warehouseResult.quantityAvailable}`
      );
    }


    recordModuleDocNo(
      'Warehouse Validation',
      whsCode,
      'Passed',
      testId,
      `Warehouse "${whsCode}" available qty: ${warehouseResult.quantityAvailable}`
    );

    return true;
  }

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

  console.log('[INFO] Clicking Add...');

  const addButton = await this.findInAllFrames('#btnAdd');

  await Promise.all([
    this.page.waitForEvent('dialog')
      .then(dialog => {
        console.log('[INFO] Dialog detected. Accepting...');
        return dialog.accept();
      })
      .catch(() => {
        console.log('[INFO] No dialog appeared.');
      }),

    addButton.click()
  ]);


  await this.page.bringToFront();


  console.log('[INFO] Waiting for document number...');

  await expect.poll(
    async () => {
      try {
        return await this.getDocumentNo();
      } catch {
        return '';
      }
    },
    {
      timeout: 60000
    }
  ).not.toBe('');


  console.log('[INFO] Document generated successfully.');
}



async clickGeneralUDFButton() {

  console.log('[INFO] Opening General (UDF) tab...');

  const generalTab = await this.findInAllFrames('#tab1nav4');


  await generalTab.waitFor({
    state: 'visible',
    timeout: 30000
  });


  await generalTab.evaluate(el => {
    el.click();
  });


  console.log('[INFO] General (UDF) tab clicked.');


  await expect.poll(async () => {

    try {

      const activeTab = await this.findInAllFrames('.tabberactive a');

      const title = await activeTab.getAttribute('title');

      return title === 'General (UDF)';

    } catch {

      return false;

    }

  }, {
    timeout: 30000
  }).toBe(true);


  console.log('[INFO] General (UDF) tab active.');
}



async validateJournalEntryLink() {

  console.log('[INFO] Waiting for Journal Entry link...');


  await expect.poll(async () => {

    try {

      const jeLink = await this.findInAllFrames('#lnkbtn_jelink');

      return await jeLink.isVisible();


    } catch {

      return false;

    }


  }, {
    timeout: 60000
  }).toBe(true);


  console.log('[INFO] Journal Entry link is visible.');
}



async clickJournalEntry() {

  console.log('[INFO] Opening Journal Entry...');


  const jeLink = await this.findInAllFrames('#lnkbtn_jelink');


  await expect(jeLink).toBeVisible({
    timeout: 60000
  });


  const popupPromise = this.page.context().waitForEvent('page');


  await jeLink.click();


  const journalPage = await popupPromise;


  await journalPage.waitForLoadState('domcontentloaded');


  console.log('[INFO] Journal Entry popup opened.');


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

  async clickInventoryButtonIfExistsGI() {
    const button = await this.findInAllFrames('#btnInventory').catch(() => null);

    if (!button || !(await button.isVisible())) {
      console.log('[INFO] Inventory button does not exist.');
      return false;
    }

    console.log('[INFO] Inventory button exists. Clicking...');

    const popupPromise = this.page.context().waitForEvent('page');

    await button.click();

    const popup = await popupPromise;

    await popup.waitForLoadState('domcontentloaded');

    //
    // Wait batch popup loaded
    //
    await popup.locator('xpath=//*[@id="dd_qtyT12r1"]').waitFor({
      state: 'visible',
      timeout: 60000
    });

    console.log('[INFO] Batch popup loaded.');


    //
    // Auto Select Batch
    //
    console.log('[INFO] Clicking Auto Select...');

    const autoSelectButton = popup.locator(
      'a[onclick*="autoselectBatchNumbers"]'
    );

    await expect(autoSelectButton).toBeVisible({
      timeout: 30000
    });

    await autoSelectButton.click();

    console.log('[INFO] Auto Select clicked.');


    //
    // Wait for batch allocation
    //
    const totalSelected = popup.locator('#dd_selectedqtyT13r1');
    const requiredQty = popup.locator('#df_qty');


    await expect(totalSelected).toBeVisible({
      timeout: 30000
    });

    await expect(requiredQty).toBeVisible({
      timeout: 30000
    });


    // Allow JS calculation/update
    await popup.waitForTimeout(3000);


    //
    // Validate selected quantity
    //
    console.log('[INFO] Validating selected batch quantity...');


    const selectedQty = Number(
      (await totalSelected.textContent())
        .replace(/,/g, '')
        .trim()
    );


    const qty = Number(
      (await requiredQty.inputValue())
        .replace(/,/g, '')
    );


    console.log(`[INFO] Required Qty: ${qty}`);
    console.log(`[INFO] Selected Qty: ${selectedQty}`);


    if (selectedQty !== qty) {

      console.log('[ERROR] Batch quantity mismatch.');

      throw new Error(
        `Batch quantity mismatch. Required: ${qty}, Selected: ${selectedQty}`
      );
    }


    console.log('[INFO] Batch quantity matched.');


    //
    // Commit Batch
    //
    console.log('[INFO] Clicking OK...');


    const okButton = popup.locator(
      'a[onclick*="commitBatchNumbers"]'
    );


    await expect(okButton).toBeVisible({
      timeout: 30000
    });


    await okButton.click();


    //
    // Wait popup close
    //
    await popup.waitForEvent('close', {
      timeout: 30000
    }).catch(() => {
      console.log('[INFO] Popup already closed.');
    });


    console.log('[INFO] Batch popup closed.');


    //
    // Return to Goods Issue
    //
    await this.page.bringToFront();


    const addButton = await this.findInAllFrames('#btnAdd');


    await expect(addButton).toBeVisible({
      timeout: 30000
    });


    console.log('[INFO] Returned to Goods Issue.');

    return true;
  }

}

module.exports = { GoodsIssuePage };
