// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');
// This is for selecting a business partner from the CFL popup.
const { BusinessPartnerCFL } = require('../popups/BusinessPartnerCFL');
// This is for shared Copy From popup behavior.
const { CopyFrom } = require('../popups/CopyFrom');
// This is for Delivery Order custom CFL fields.
const { PlateNumberCFL, TruckCFL } = require('../../helpers/customCFL');
// This is for attaching a generated file through the popup attachment flow.
const { uploadPopupAttachment } = require('../../helpers/popup-attachment');

const DELIVERY_COPY_LINE_FIELDS = [
  { label: 'Item Code', fieldName: 'itemcode' },
  { label: 'Item Description', fieldName: 'itemdesc' },
  { label: 'U Quantity 1', fieldName: 'u_quantity1', numeric: true },
  { label: 'U Quantity 2', fieldName: 'u_quantity2', numeric: true },
  { label: 'UOM', fieldName: 'uom' },
  { label: 'U UOM', fieldName: 'u_uom' },
  { label: 'Unit Price', fieldName: 'unitprice', numeric: true },
  { label: 'Discount Percent', fieldName: 'discperc', numeric: true },
  { label: 'Discount Amount', fieldName: 'discamount', numeric: true },
  { label: 'Price', fieldName: 'price', numeric: true },
  { label: 'VAT Code', fieldName: 'vatcode' },
  { label: 'Line Total', fieldName: 'linetotal', numeric: true },
  { label: 'Warehouse Code', fieldName: 'whscode' },
  { label: 'Warehouse Name', fieldName: 'u_warehousename' },
  { label: 'Profit Center Code', fieldName: 'drcode' },
  { label: 'Profit Center Name', fieldName: 'u_profitcentername' },
  { label: 'Business Center', fieldName: 'u_business_center' }
];
// ANG TAGAL MAG 5:30 GIATAY
class DeliveryOrderPage extends BasePage {
  async expectLoaded() {
    await expect
      .poll(
        () => {
          const bodyFrame = this.page.frame({ name: 'iframeBody' });
          return bodyFrame ? bodyFrame.url() : '';
        },
        { timeout: 20000 }
      )
      .toContain('SalesDelivery.php');

    const deliveryHeader = await this.findInAllFrames(
      'xpath=/html/body/form[1]/table[2]/tbody/tr/td[2]/table/tbody/tr/td/table/tbody/tr[2]/td/table/tbody/tr/td[1]',
      20
    );
    await expect(deliveryHeader).toHaveText(/\s*Delivery\s*/i, { timeout: 10000 });
    await this.clearNavigationHover();
  }

  async clearNavigationHover() {
    const viewport = this.page.viewportSize() || { width: 1280, height: 720 };
    await this.page.mouse.move(
      Math.max(viewport.width - 24, 24),
      Math.max(viewport.height - 24, 24)
    );
    await this.page.waitForTimeout(300);
  }

  async getDeliveryFrame() {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const bodyFrame = this.page.frame({ name: 'iframeBody' });
      if (bodyFrame && bodyFrame.url().includes('SalesDelivery.php')) {
        return bodyFrame;
      }

      await this.page.waitForTimeout(250);
    }

    throw new Error('Sales Delivery iframe was not found.');
  }

  async runAndWaitForPopup(action, timeout = 8000) {
    const popupPromise = Promise.race([
      this.page.waitForEvent('popup', { timeout }).catch(() => null),
      this.page.context().waitForEvent('page', { timeout }).catch(() => null)
    ]);
    await action().catch(() => {});
    return popupPromise;
  }

  async readBpCflDiagnostics(frame) {
    return frame.evaluate(() => {
      const cfl = document.getElementById('cfl_bpcode');
      if (!cfl) {
        return {
          found: false,
          frameUrl: window.location.href,
          title: document.title || ''
        };
      }

      const rect = cfl.getBoundingClientRect();
      const topElement = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );

      return {
        found: true,
        frameUrl: window.location.href,
        title: document.title || '',
        outerHTML: cfl.outerHTML,
        onclick: cfl.getAttribute('onclick') || '',
        visible: rect.width > 0 && rect.height > 0,
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        topElement: topElement
          ? {
              id: topElement.id || '',
              tagName: topElement.tagName || '',
              outerHTML: String(topElement.outerHTML || '').slice(0, 300)
            }
          : null
      };
    });
  }

  async expectCopyFromVisible() {
    const copyFromButton = await this.findInAllFrames('a#btnCopyFrom[name="btnCopyFrom"]', 20);
    await expect(copyFromButton).toBeVisible({ timeout: 10000 });
    return copyFromButton;
  }

  async selectBusinessPartnerFromCfl(bpCode, options = {}) {
    if (!String(bpCode || '').trim()) {
      throw new Error('Delivery Order BP Code is required.');
    }

    await this.clearNavigationHover();
    const deliveryFrame = await this.getDeliveryFrame();
    const cflButton = deliveryFrame
      .locator('img#cfl_bpcode[onclick*="OpenCFLbusinesspartners"]')
      .first();
    await cflButton.waitFor({ state: 'visible', timeout: 10000 });
    await cflButton.scrollIntoViewIfNeeded().catch(() => {});

    let bpCFLPage = await this.runAndWaitForPopup(async () => {
      await cflButton.click({ timeout: 8000 });
    });

    if (!bpCFLPage) {
      bpCFLPage = await this.runAndWaitForPopup(async () => {
        await cflButton.click({ force: true, timeout: 8000 });
      });
    }

    if (!bpCFLPage) {
      bpCFLPage = await this.runAndWaitForPopup(async () => {
        const box = await cflButton.boundingBox();
        if (!box) return;
        await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      });
    }

    if (!bpCFLPage) {
      bpCFLPage = await this.runAndWaitForPopup(async () => {
        await deliveryFrame.evaluate(() => {
          const cfl = document.getElementById('cfl_bpcode');
          if (!cfl) return false;
          cfl.click();
          return true;
        });
      });
    }

    if (!bpCFLPage) {
      bpCFLPage = await this.runAndWaitForPopup(async () => {
        await deliveryFrame.evaluate(() => {
          if (typeof window.OpenCFLbusinesspartners === 'function') {
            window.OpenCFLbusinesspartners('df_bpcode');
            return true;
          }

          if (typeof window.OpenCFLfs === 'function') {
            window.OpenCFLfs('df_bpcode');
            return true;
          }

          return false;
        });
      });
    }

    if (!bpCFLPage) {
      const diagnostics = await this.readBpCflDiagnostics(deliveryFrame).catch((error) => ({
        diagnosticsError: String(error?.message || error)
      }));
      throw new Error(
        `Delivery Order BP CFL did not open after clicking cfl_bpcode. Diagnostics: ${JSON.stringify(diagnostics)}`
      );
    }

    await bpCFLPage.waitForLoadState('domcontentloaded').catch(() => {});
    const bpCFL = new BusinessPartnerCFL(bpCFLPage);
    if (options.beforeSelect) {
      await options.beforeSelect(bpCFLPage);
    }

    const selectedCode = await bpCFL.selectCode(bpCode, {
      entityName: 'Customer code',
      fieldName: 'custno',
      columnId: 'col_custnoT1'
    });
    const bpCodeInput = await this.findInAllFrames('input#df_bpcode[name="df_bpcode"], input#df_bpcode', 20);
    await expect(bpCodeInput).toHaveValue(selectedCode, { timeout: 5000 });
    return selectedCode;
  }

  async openCopyFromPopup({ menuSelector = 'a[onclick*="popupCopyDocumentFromSalesOrders"]' } = {}) {
    const copyFromButton = await this.expectCopyFromVisible();
    await copyFromButton.click();

    const copyFromMenu = await this.findInAllFrames(menuSelector, 20);
    await copyFromMenu.hover().catch(() => {});

    const popupPromise = this.page.context().waitForEvent('page', { timeout: 15000 });
    await copyFromMenu.click();

    const popupPage = await popupPromise;
    const copyFrom = new CopyFrom(popupPage);
    await copyFrom.expectLoaded();
    return copyFrom;
  }

  async copyFromSalesOrder({ bpCode, salesOrderDocNo, hooks = {} } = {}) {
    if (!String(salesOrderDocNo || '').trim()) {
      throw new Error('Delivery Order Copy From requires a Sales Order document number.');
    }

    const selectedBpCode = await this.selectBusinessPartnerFromCfl(bpCode, {
      beforeSelect: hooks.beforeSelectBp
    });

    if (hooks.afterBpSelected) {
      await hooks.afterBpSelected(selectedBpCode);
    }

    const copyFrom = await this.openCopyFromPopup();
    if (hooks.afterCopyFromOpened) {
      await hooks.afterCopyFromOpened(copyFrom);
    }

    const selectedHeader = await copyFrom.selectHeaderRow({
      docNo: salesOrderDocNo,
      tableId: 'T1'
    });
    if (hooks.afterHeaderSelected) {
      await hooks.afterHeaderSelected(selectedHeader, copyFrom);
    }

    await copyFrom.clickChoose();
    await copyFrom.expectItemsLoaded({ tableId: 'T2' });
    if (hooks.afterItemsLoaded) {
      await hooks.afterItemsLoaded(copyFrom);
    }

    const selectedItem = await copyFrom.selectFirstItem({ tableId: 'T2' });
    const sourceLineValues = await copyFrom.readTableRowValues({
      tableId: 'T2',
      rowNumber: selectedItem.rowNumber,
      fields: DELIVERY_COPY_LINE_FIELDS.map((field) => field.fieldName)
    });
    if (hooks.afterItemSelected) {
      await hooks.afterItemSelected(copyFrom);
    }

    const closePromise = copyFrom.page.waitForEvent('close', { timeout: 15000 }).catch(() => {});
    await copyFrom.clickFinish();
    await closePromise;
    await this.expectFirstLineItemCodeFilled();
    const lineCopyValidations = await this.expectCopiedLineItem({
      sourceDocNo: selectedHeader.docNo || salesOrderDocNo || '',
      sourceLineValues,
      targetRowNumber: 1
    });

    if (hooks.afterLineCopied) {
      await hooks.afterLineCopied(lineCopyValidations);
    }

    const deliveryDetailValidations = await this.completeDeliveryDetails();

    if (hooks.afterDeliveryDetailsCompleted) {
      await hooks.afterDeliveryDetailsCompleted(deliveryDetailValidations);
    }

    const draftAttachmentResult = await this.saveAsDraftValidateIrcdAndAttach({
      moduleName: 'DeliveryOrder'
    });

    if (hooks.afterDraftAttachmentCompleted) {
      await hooks.afterDraftAttachmentCompleted(draftAttachmentResult);
    }

    if (hooks.afterFinished) {
      await hooks.afterFinished(selectedHeader, copyFrom, lineCopyValidations);
    }

    return {
      bpCode: selectedBpCode,
      sourceDocNo: selectedHeader.docNo || salesOrderDocNo || '',
      sourceRowNumber: selectedHeader.rowNumber,
      sourceLineRowNumber: selectedItem.rowNumber,
      lineCopyValidations,
      deliveryDetailValidations,
      draftAttachmentResult
    };
  }

  async expectFirstLineItemCodeFilled() {
    await expect
      .poll(
        async () => {
          const itemCodeInput = await this.findInAllFrames(
            'input#df_itemcodeT1r1[name="df_itemcodeT1r1"], input#df_itemcodeT1[name="df_itemcodeT1"], input#df_itemcodeT1',
            3
          ).catch(() => null);
          return itemCodeInput ? itemCodeInput.inputValue().catch(() => '') : '';
        },
        { timeout: 20000 }
      )
      .not.toBe('');
  }

  async completeDeliveryDetails() {
    const validations = [];

    validations.push(await this.selectPrimaryDocSeries());
    await (await this.findInAllFrames('xpath=//*[@id="tab1nav5"]', 20)).click();
    validations.push(await TruckCFL.selectFirstTruck(this));
    validations.push(await PlateNumberCFL.selectFirstPlateNumber(this));
    validations.push(await this.selectInvoiceDeliveryDate());

    return validations;
  }

  async selectPrimaryDocSeries() {
    const docSeries = await this.findInAllFrames('xpath=//*[@id="df_docseries"]', 20);
    await docSeries.selectOption({ label: 'Primary' }).catch(async () => {
      const optionValue = await docSeries
        .locator('option')
        .nth(15)
        .getAttribute('value');
      await docSeries.selectOption(optionValue);
    });

    await expect(docSeries.locator('option:checked')).toHaveText('Primary', { timeout: 5000 });

    return {
      label: 'Document Series',
      expectedValue: 'Primary',
      actualValue: this.normalizeComparableText(
        await docSeries.locator('option:checked').textContent().catch(() => '')
      ),
      passed: true
    };
  }

  async selectInvoiceDeliveryDate() {
    const previousValue = await this.readInvoiceDeliveryDateValue();
    const popupPromise = Promise.race([
      this.page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
      this.page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null)
    ]);
    const dateSelector = await this.findInAllFrames('xpath=//*[@id="cfl_u_invdeldate"]', 20);
    await dateSelector.click();

    const popupPage = await popupPromise;
    if (popupPage) {
      await popupPage.waitForLoadState('domcontentloaded').catch(() => {});
      const popupDate = await popupPage.locator('xpath=/html/body/center/table[2]/tbody/tr[8]/td/a');
      const closePromise = popupPage.waitForEvent('close', { timeout: 5000 }).catch(() => {});
      await popupDate.click();
      await closePromise;
    } else {
      const dateOption = await this.findInAllFrames(
        'xpath=/html/body/center/table[2]/tbody/tr[8]/td/a',
        20
      );
      await dateOption.click();
    }

    const expectedTodayValues = this.getTodayDateValues();
    const actualValue = await this.waitForInvoiceDeliveryDateToday({
      expectedTodayValues,
      previousValue
    });

    return {
      label: 'Invoice Delivery Date',
      expectedValue: expectedTodayValues[0],
      actualValue,
      passed: true
    };
  }

  async waitForInvoiceDeliveryDateToday({ expectedTodayValues, previousValue }) {
    let latestValue = '';

    const matched = await expect
      .poll(
        async () => {
          latestValue = await this.readInvoiceDeliveryDateValue();
          return expectedTodayValues.includes(latestValue) ? 'today' : latestValue;
        },
        {
          timeout: 10000,
          intervals: [100, 150, 250, 500],
          message: 'Invoice delivery date should be today after selecting the calendar date.'
        }
      )
      .toBe('today')
      .then(() => true)
      .catch(() => false);

    if (!matched) {
      throw new Error(
        `Invoice delivery date should be today's date. ` +
          `Expected one of "${expectedTodayValues.join(', ')}", actual "${latestValue || '(blank)'}". ` +
          `Previous="${previousValue}".`
      );
    }

    return latestValue;
  }

  async readInvoiceDeliveryDateValue() {
    const dateInput = await this.findInAllFrames('xpath=//*[@id="df_u_invdeldate"]', 3)
      .catch(() => null);
    if (!dateInput) return '';

    return this.normalizeComparableText(
      await dateInput
        .evaluate((element) => {
          if ('value' in element) return element.value;
          return element.innerText || element.textContent || '';
        })
        .catch(() => '')
    );
  }

  getTodayDateValues() {
    const today = new Date();
    const yyyy = String(today.getFullYear());
    const m = String(today.getMonth() + 1);
    const mm = m.padStart(2, '0');
    const d = String(today.getDate());
    const dd = d.padStart(2, '0');

    return Array.from(new Set([
      `${mm}/${dd}/${yyyy}`,
      `${m}/${d}/${yyyy}`,
      `${yyyy}-${mm}-${dd}`,
      `${yyyy}-${m}-${d}`,
      `${dd}/${mm}/${yyyy}`,
      `${d}/${m}/${yyyy}`
    ]));
  }

  async saveAsDraftValidateIrcdAndAttach({ moduleName = 'DeliveryOrder' } = {}) {
    await this.clickSaveAsDraft();
    const docNo = await this.readDocNoFromField();
    const ircdValidation = await this.validateIrcdVersion();
    const attachment = await uploadPopupAttachment(this, {
      moduleName,
      docNo
    });

    return {
      docNo,
      validations: [
        ircdValidation,
        {
          label: 'Popup Attachment',
          expectedValue: attachment.expectedValue,
          actualValue: attachment.actualValue,
          passed: attachment.passed
        }
      ],
      attachment
    };
  }

  async clickSaveAsDraft() {
    const dialogHandler = async (dialog) => {
      await dialog.accept().catch(async () => {
        await dialog.dismiss().catch(() => {});
      });
    };

    this.page.on('dialog', dialogHandler);
    try {
      const saveAsDraftButton = await this.findInAllFrames('xpath=//*[@id="btnSaveAsDraft"]', 20)
        .catch(() => this.findInAllFrames('#btnSaveAsDraft', 20));
      await saveAsDraftButton.click();
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await this.page.waitForTimeout(1000);
    } finally {
      this.page.off('dialog', dialogHandler);
    }
  }

  async readDocNoFromField() {
    await expect
      .poll(
        async () => {
          const docNoField = await this.findInAllFrames('xpath=//*[@id="df_docno"]', 3)
            .catch(() => null);
          if (!docNoField) return '';

          return this.normalizeComparableText(
            await docNoField
              .evaluate((element) => {
                if ('value' in element) return element.value;
                return element.innerText || element.textContent || '';
              })
              .catch(() => '')
          );
        },
        {
          timeout: 20000,
          message: 'Delivery Order doc no should be available from df_docno after Save as Draft.'
        }
      )
      .not.toBe('');

    const docNoField = await this.findInAllFrames('xpath=//*[@id="df_docno"]', 20);
    return this.normalizeComparableText(
      await docNoField
        .evaluate((element) => {
          if ('value' in element) return element.value;
          return element.innerText || element.textContent || '';
        })
        .catch(() => '')
    );
  }

  async validateIrcdVersion() {
    await (await this.findInAllFrames('xpath=//*[@id="tab1nav4"]', 20)).click();

    await expect
      .poll(
        async () => {
          const ircdVersion = await this.findInAllFrames('xpath=//*[@id="df_ircdversion"]', 3)
            .catch(() => null);
          if (!ircdVersion) return '';

          return this.normalizeComparableText(
            await ircdVersion
              .evaluate((element) => {
                if ('value' in element) return element.value;
                return element.innerText || element.textContent || '';
              })
              .catch(() => '')
          );
        },
        {
          timeout: 10000,
          message: 'Delivery Order IRCD Version should be 1 after Save as Draft.'
        }
      )
      .toBe('1');

    return {
      label: 'IRCD Version',
      expectedValue: '1',
      actualValue: '1',
      passed: true
    };
  }

  async expectCopiedLineItem({ sourceDocNo, sourceLineValues, targetRowNumber = 1 }) {
    const targetLineValues = await this.readLineItemRowValues({
      rowNumber: targetRowNumber,
      fields: DELIVERY_COPY_LINE_FIELDS.map((field) => field.fieldName).concat('basedocno')
    });
    const validations = [];

    for (const field of DELIVERY_COPY_LINE_FIELDS) {
      const expected = sourceLineValues[field.fieldName];
      const actual = targetLineValues[field.fieldName];

      if (!expected?.found) continue;
      if (!actual?.found) {
        throw new Error(
          `Delivery Order copied line ${field.label} field was available in Copy From but missing in Delivery Order.`
        );
      }

      const expectedValue = this.normalizeComparableText(expected.value);
      const actualValue = this.normalizeComparableText(actual.value);

      if (!this.valuesAreEquivalent(expectedValue, actualValue, { numeric: field.numeric })) {
        throw new Error(
          `Delivery Order copied line ${field.label} mismatch. ` +
            `Expected "${expectedValue}", actual "${actualValue}".`
        );
      }

      validations.push({
        label: field.label,
        expectedValue,
        actualValue,
        passed: true
      });
    }

    if (!validations.length) {
      throw new Error('Delivery Order copied line validation could not read any comparable Copy From fields.');
    }

    const actualBaseDocNo = this.normalizeComparableText(targetLineValues.basedocno?.value);
    const expectedBaseDocNo = this.normalizeComparableText(sourceDocNo);
    if (expectedBaseDocNo && actualBaseDocNo !== expectedBaseDocNo) {
      throw new Error(
        `Delivery Order copied line Base Doc No mismatch. ` +
          `Expected "${expectedBaseDocNo}", actual "${actualBaseDocNo}".`
      );
    }

    if (expectedBaseDocNo) {
      validations.push({
        label: 'Base Doc No',
        expectedValue: expectedBaseDocNo,
        actualValue: actualBaseDocNo,
        passed: true
      });
    }

    return validations;
  }

  async readLineItemRowValues({ rowNumber = 1, fields = [] } = {}) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      for (const frame of this.page.frames()) {
        try {
          if (frame.isDetached()) continue;

          const values = await frame.evaluate(({ targetRowNumber, targetFields }) => {
            const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
            const rowExists = Boolean(
              document.getElementById(`df_itemcodeT1r${targetRowNumber}`) ||
                document.querySelector('table#T1')
            );
            if (!rowExists) return null;

            return Object.fromEntries(
              targetFields.map((fieldName) => {
                const input = document.getElementById(`df_${fieldName}T1r${targetRowNumber}`);
                const label = document.getElementById(`dd_${fieldName}T1r${targetRowNumber}`);
                const element = input || label;

                return [
                  fieldName,
                  {
                    found: Boolean(element),
                    value: normalize(input?.value || label?.textContent || label?.innerText)
                  }
                ];
              })
            );
          }, { targetRowNumber: rowNumber, targetFields: fields });

          if (values) return values;
        } catch (e) {
          continue;
        }
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error(`Unable to read Delivery Order line row ${rowNumber}.`);
  }

  normalizeComparableText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  parseComparableNumber(value) {
    const normalized = this.normalizeComparableText(value).replace(/,/g, '');
    if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  valuesAreEquivalent(expectedValue, actualValue, options = {}) {
    const expectedText = this.normalizeComparableText(expectedValue);
    const actualText = this.normalizeComparableText(actualValue);
    if (actualText === expectedText) return true;

    if (!options.numeric) return false;

    const expectedNumber = this.parseComparableNumber(expectedText);
    const actualNumber = this.parseComparableNumber(actualText);
    if (expectedNumber === null || actualNumber === null) return false;

    return Math.abs(expectedNumber - actualNumber) < 0.000001;
  }
}

module.exports = { DeliveryOrderPage };
