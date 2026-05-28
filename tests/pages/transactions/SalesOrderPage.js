const { expect } = require('@playwright/test');
const { BasePage } = require('../base/BasePage');
const { BusinessPartnerPopup } = require('../popups/BusinessPartnerPopup');
const { ItemPopup } = require('../popups/ItemPopup');
const { readCurrentDocNo } = require('../../helpers/docNoReader');

class SalesOrderPage extends BasePage {
  async expectCustomerLabelVisible() {
    await expect
      .poll(
        async () => {
          try {
            const customerLabel = await this.findInAllFrames(
              'label#cf_bpcode[name="cf_bpcode"]'
            );
            return await customerLabel.textContent();
          } catch (e) {
            return '';
          }
        },
        { timeout: 20000 }
      )
      .toContain('Customer');
  }

  async selectInitialCustomerFromLookup(preferredCode = process.env.BPI_SALES_BPCODE || '10000010') {
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 15000 });
    const customerLookup = await this.findInAllFrames(
      'img#cfl_bpcode[onclick*="OpenCFLbusinesspartners"]'
    );
    await customerLookup.click();

    const customerPopupPage = await popupPromise;
    const customerPopup = new BusinessPartnerPopup(customerPopupPage);
    await customerPopup.expectLookupReady();
    const selectedCustomerCode = await customerPopup.selectCustomerCode(preferredCode);

    const bpCodeInput = await this.findInAllFrames('input#df_bpcode[name="df_bpcode"]');
    await expect(bpCodeInput).toHaveValue(selectedCustomerCode, { timeout: 7000 });
    return selectedCustomerCode;
  }

  async selectDocSeries(value) {
    const docSeriesSelect = await this.findInAllFrames(
      'select#df_docseries[name="df_docseries"]'
    );
    await docSeriesSelect.selectOption(value);
    await expect(docSeriesSelect).toHaveValue(value);
  }

  async selectBusinessPartner(preferredCode) {
    const cflButton = await this.findInAllFrames('#cfl_bpcode');
    const bpPopupPromise = this.page.context().waitForEvent('page', { timeout: 15000 });
    await cflButton.click();

    const bpPopupPage = await bpPopupPromise;
    await bpPopupPage.waitForLoadState('domcontentloaded');
    const bpPopup = new BusinessPartnerPopup(bpPopupPage);
    const selectedCustomerCode = await bpPopup.selectCustomerCode(preferredCode);
    const bpCodeInput = await this.findInAllFrames('input#df_bpcode[name="df_bpcode"]');
    await expect(bpCodeInput).toHaveValue(selectedCustomerCode, { timeout: 2000 });
    return selectedCustomerCode;
  }

  async addItems({ itemCode, unitPrice, businessCenter, count = 1 }) {
    for (let index = 0; index < count; index += 1) {
      await this.addItem({
        itemCode,
        unitPrice,
        businessCenter
      });
    }
  }

  async addItem({ itemCode, unitPrice, businessCenter }) {
    const itemCfl = await this.findInAllFrames('#cfl_itemcodeT1', 6);
    const itemPopupPromise = this.page.context().waitForEvent('page', { timeout: 2000 });
    await itemCfl.click();

    const itemPopupPage = await itemPopupPromise;
    const itemPopup = new ItemPopup(itemPopupPage);
    await itemPopup.selectItemByLabel(itemCode);

    await (await this.findInAllFrames('#df_unitpriceT1')).fill(unitPrice);
    await (await this.findInAllFrames('#df_u_business_centerT1')).selectOption(businessCenter);
    await (await this.findInAllFrames('#T1_btnUpdate')).click();
    await this.waitForItemEntryReady();
  }

  async waitForItemEntryReady() {
    await this.findInAllFrames('#cfl_itemcodeT1', 6);
  }

  async fillHeaderDetails({ distributionChannel, divisionIndex }) {
    await (await this.findInAllFrames('#tab1nav5')).click();
    await (await this.findInAllFrames('#df_u_distribution_channel')).selectOption(
      distributionChannel
    );
    await (await this.findInAllFrames('#df_u_division')).selectOption({ index: divisionIndex });
  }

  async saveAsDraft() {
    await (await this.findInAllFrames('#tab1nav1')).click();
    await (await this.findInAllFrames('#btnSaveAsDraft')).click();

    await expect
      .poll(async () => this.readStatus(), { timeout: 2000 })
      .toContain('D|Draft');
  }

  async addOrUpdateUntilOpen() {
    const actionResult = await this.withDialogCapture(() => this.clickAddOrUpdateButton());
    const actionButtonUsed = actionResult.result;
    let statusMsg = await this.readSubmitMessage(actionResult.dialogMessages);
    if (this.isCreditLimitBlocked(statusMsg)) {
      return {
        isOpen: false,
        statusMsg,
        isCreditLimitBlocked: true
      };
    }

    let openStatusResult = await expect
      .poll(async () => this.readStatus(), { timeout: 5000 })
      .toContain('O|Open')
      .then(() => true)
      .catch(() => false);

    statusMsg = await this.readSubmitMessage(actionResult.dialogMessages);
    if (!openStatusResult && this.isCreditLimitBlocked(statusMsg)) {
      return {
        isOpen: false,
        statusMsg,
        isCreditLimitBlocked: true
      };
    }

    if (!openStatusResult) {
      const alternateSelector =
        actionButtonUsed === 'btnAdd'
          ? 'a#btnUpdate[name="btnUpdate"]'
          : 'a#btnAdd[name="btnAdd"]';
      const alternateResult = await this.withDialogCapture(() =>
        this.clickIfExists(alternateSelector, 6)
      );
      if (alternateResult.result) {
        statusMsg = await this.readSubmitMessage(alternateResult.dialogMessages);
        if (this.isCreditLimitBlocked(statusMsg)) {
          return {
            isOpen: false,
            statusMsg,
            isCreditLimitBlocked: true
          };
        }

        openStatusResult = await expect
          .poll(async () => this.readStatus(), { timeout: 5000 })
          .toContain('O|Open')
          .then(() => true)
          .catch(() => false);
        statusMsg = await this.readSubmitMessage(alternateResult.dialogMessages);
        if (!openStatusResult && this.isCreditLimitBlocked(statusMsg)) {
          return {
            isOpen: false,
            statusMsg,
            isCreditLimitBlocked: true
          };
        }
      }
    }

    statusMsg = await this.readSubmitMessage();
    return {
      isOpen: openStatusResult,
      statusMsg,
      isCreditLimitBlocked: !openStatusResult && this.isCreditLimitBlocked(statusMsg)
    };
  }

  async clickAddOrUpdateButton() {
    try {
      const btnAdd = await this.findInAllFrames('a#btnAdd[name="btnAdd"]', 6);
      await btnAdd.click();
      return 'btnAdd';
    } catch (e) {
      const btnUpdate = await this.findInAllFrames('a#btnUpdate[name="btnUpdate"]', 10);
      await btnUpdate.click();
      return 'btnUpdate';
    }
  }

  async withDialogCapture(action) {
    const dialogMessages = [];
    const handler = async (dialog) => {
      dialogMessages.push(dialog.message());
      await dialog.accept().catch(async () => {
        await dialog.dismiss().catch(() => {});
      });
    };

    this.page.on('dialog', handler);
    try {
      const result = await action();
      await this.page.waitForTimeout(500);
      return { result, dialogMessages };
    } finally {
      this.page.off('dialog', handler);
    }
  }

  async readStatus() {
    const docStatus = await this.findInAllFrames('select#df_docstatus[name="df_docstatus"]', 20);
    const value = await docStatus.inputValue().catch(() => '');
    const label = await docStatus.locator('option:checked').textContent().catch(() => '');
    return `${value}|${(label || '').trim()}`;
  }

  async readSubmitMessage(extraMessages = []) {
    const statusMsg = await this.readStatusMessage(extraMessages);
    if (statusMsg) return statusMsg;

    return this.readRaiseErrorDiagnostics();
  }

  async readStatusMessage(extraMessages = []) {
    const joinedExtraMessages = extraMessages.filter(Boolean).join(' | ').trim();
    if (joinedExtraMessages) return joinedExtraMessages;

    const selectors = [
      'label#statusMsg',
      '#statusMsg',
      '[id*="statusMsg"]',
      '[id*="raiseerror"]',
      '[class*="status"]',
      'text=/credit limit/i'
    ];

    for (const selector of selectors) {
      const statusMsgEl = await this.findInAllFrames(selector, 4).catch(() => null);
      const statusMsg = statusMsgEl ? ((await statusMsgEl.textContent()) || '').trim() : '';
      if (statusMsg) return statusMsg;
    }

    return '';
  }

  async readRaiseErrorDiagnostics() {
    for (const frame of this.page.frames()) {
      try {
        if (frame.isDetached()) continue;
        const diagnostics = await frame.evaluate(() => {
          const selectors = [
            '#raiseerror',
            '[id*="raise" i]',
            '[class*="raise" i]',
            '[id*="error" i]',
            '[class*="error" i]',
            '[id*="status" i]',
            '[class*="status" i]'
          ];

          const matches = selectors
            .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
            .filter((element, index, elements) => elements.indexOf(element) === index)
            .map((element) => {
              const style = window.getComputedStyle(element);
              return {
                id: element.id || '',
                className:
                  typeof element.className === 'string' ? element.className : String(element.className || ''),
                text: (element.innerText || element.textContent || '').trim(),
                backgroundColor: style.backgroundColor,
                color: style.color,
                display: style.display,
                visibility: style.visibility
              };
            });

          const creditText = (document.body.innerText || '')
            .split(/\n+/)
            .map((line) => line.trim())
            .filter((line) => /credit limit|raiseerror|invalid action|for checking/i.test(line))
            .join(' | ');

          return { matches, creditText };
        });

        if (diagnostics.creditText) return diagnostics.creditText;

        const visibleRaiseError = diagnostics.matches.find(
          (match) =>
            match.display !== 'none' &&
            match.visibility !== 'hidden' &&
            /(raise|error|status)/i.test(`${match.id} ${match.className}`)
        );
        if (visibleRaiseError?.text) return visibleRaiseError.text;
      } catch (e) {
        continue;
      }
    }

    return '';
  }

  async readDocumentMemory() {
    return {
      bpCode: await (await this.findInAllFrames('input#df_bpcode[name="df_bpcode"]')).inputValue(),
      docNo: await readCurrentDocNo(this)
    };
  }

  isCreditLimitBlocked(statusMsg) {
    return /credit limit/i.test(statusMsg) && /(invalid action|for checking|raiseerror)/i.test(statusMsg);
  }
}

module.exports = { SalesOrderPage };
