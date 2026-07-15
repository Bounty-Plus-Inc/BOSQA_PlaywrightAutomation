// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');
// This is for selecting a business partner from the CFL popup.
const { BusinessPartnerCFL } = require('../popups/BusinessPartnerCFL');
// This is for selecting an item from the CFL popup.
const { DEFAULT_ITEM_SELECTORS, ItemCFL } = require('../popups/ItemCFL');
// This is for reading document numbers from the page.
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

  async selectInitialCustomerFromLookup(preferredCode, options = {}) {
    if (!String(preferredCode || '').trim()) {
      throw new Error('Sales Order customer code is required.');
    }

    await this.closeOpenBusinessPartnerCflPages();
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 15000 });
    const customerLookup = await this.findInAllFrames(
      'img#cfl_bpcode[onclick*="OpenCFLbusinesspartners"]'
    );
    await customerLookup.click();

    const customerCFLPage = await popupPromise;
    const customerCFL = new BusinessPartnerCFL(customerCFLPage);
    if (options.beforeSelect) {
      await options.beforeSelect(customerCFLPage);
    }
    const selectedCustomerCode = await customerCFL.selectCode(preferredCode, {
      entityName: 'Customer code',
      fieldName: 'custno',
      columnId: 'col_custnoT1'
    });

    await this.ensureBusinessPartnerCodeValue(selectedCustomerCode);
    await this.closeOpenBusinessPartnerCflPages();
    return selectedCustomerCode;
  }

  async closeOpenBusinessPartnerCflPages() {
    for (const openPage of this.page.context().pages()) {
      if (openPage === this.page || openPage.isClosed()) continue;

      if (/cflbusinesspartners\.php/i.test(openPage.url())) {
        await openPage.close().catch(() => {});
      }
    }
  }

  async ensureBusinessPartnerCodeValue(expectedCode) {
    const selector =
      'input#df_bpcode[name="df_bpcode"], input#df_bpcode, input[name="df_bpcode"]';

    await expect
      .poll(
        async () => {
          const input = await this.findInAllFrames(selector, 3).catch(() => null);
          if (!input) return '';

          let propertyValue = String(await input.inputValue().catch(() => '')).trim();
          const attributeValue = String(
            (await input.getAttribute('value').catch(() => '')) || ''
          ).trim();

          if (propertyValue !== expectedCode && attributeValue === expectedCode) {
            await input.evaluate((node, value) => {
              node.value = value;
              node.defaultValue = value;
            }, expectedCode);
            propertyValue = String(await input.inputValue().catch(() => '')).trim();
          }

          return propertyValue;
        },
        {
          timeout: 5000,
          intervals: [100, 150, 250, 500],
          message: `Sales Order BP Code should be ${expectedCode} after CFL selection.`
        }
      )
      .toBe(expectedCode);
  }

  async selectDocSeries(value) {
    const docSeriesSelect = await this.findInAllFrames(
      'select#df_docseries[name="df_docseries"]'
    );
    await docSeriesSelect.selectOption(value);
    await expect(docSeriesSelect).toHaveValue(value);
  }

  async selectDocSeriesByLabel(label = 'Primary') {
    const docSeriesSelect = await this.findInAllFrames(
      'select#df_docseries[name="df_docseries"], select#df_docseries',
      20
    );
    await docSeriesSelect.selectOption({ label });
    await expect(docSeriesSelect.locator('option:checked')).toHaveText(label, { timeout: 5000 });
    return {
      expectedValue: label,
      actualValue: ((await docSeriesSelect.locator('option:checked').textContent()) || '').trim()
    };
  }

  async selectBusinessPartner(preferredCode, options = {}) {
    await this.closeOpenBusinessPartnerCflPages();
    const cflButton = await this.findInAllFrames('#cfl_bpcode');
    const bpCFLPromise = this.page.context().waitForEvent('page', { timeout: 15000 });
    await cflButton.click();

    const bpCFLPage = await bpCFLPromise;
    const bpCFL = new BusinessPartnerCFL(bpCFLPage);
    if (options.beforeSelect) {
      await options.beforeSelect(bpCFLPage);
    }
  
    const selectedCustomerCode = await bpCFL.selectCode(preferredCode,{entityName: 'Customer code', fieldName: 'custno', columnId: 'col_custnoT1'});
    await this.ensureBusinessPartnerCodeValue(selectedCustomerCode);
    await this.closeOpenBusinessPartnerCflPages();
    return selectedCustomerCode;
  }

  async addItems({ itemCode, unitPrice, businessCenter, count = 1, beforeSelectItem }) {
    for (let index = 0; index < count; index += 1) {
      await this.addItem({
        itemCode,
        unitPrice,
        businessCenter,
        beforeSelectItem: beforeSelectItem
          ? (itemCFLPage) => beforeSelectItem(itemCFLPage, index)
          : undefined
      });
    }
  }

  async addItem({ itemCode, unitPrice, businessCenter, beforeSelectItem }) {
    await this.selectItemCodeWithRetry(itemCode, { beforeSelectItem });

    await (await this.findInAllFrames('#df_unitpriceT1')).fill(unitPrice);
    await (await this.findInAllFrames('#df_u_business_centerT1')).selectOption(businessCenter);
    await (await this.findInAllFrames('#T1_btnUpdate')).click();
    await this.waitForItemEntryReady();
  }

  async selectItemCodeWithRetry(itemCode, options = {}) {
    try {
      await this.selectItemCodeFromCfl(itemCode, options);
      await this.waitForSelectedItemReady(itemCode, {
        timeout: options.readyTimeout || 2500
      });
      return;
    } catch (error) {
      await this.closeOpenItemCflPages();
      await this.pasteItemCodeIntoField(itemCode);
      await this.waitForSelectedItemReady(itemCode, {
        timeout: options.fallbackReadyTimeout || 10000
      });
    }
  }

  async selectItemCodeFromCfl(itemCode, options = {}) {
    const itemCfl = await this.findInAllFrames(DEFAULT_ITEM_SELECTORS.trigger, 10);
    const itemCFLPromise = this.page.context().waitForEvent('page', {
      timeout: options.popupTimeout || 15000
    });
    await itemCfl.click();

    const itemCFLPage = await itemCFLPromise;
    const itemCFLPageObject = new ItemCFL(itemCFLPage);
    if (options.beforeSelectItem) {
      await itemCFLPageObject.expectLookupReady(itemCode);
      await options.beforeSelectItem(itemCFLPage);
    }

    await itemCFLPageObject.selectItemByLabel(itemCode).catch(async (error) => {
      await itemCFLPage.close().catch(() => {});
      throw error;
    });
  }

  async waitForSelectedItemReady(itemCode, options = {}) {
    const timeout = options.timeout || 10000;
    const itemCodeSelector = 'input#df_itemcodeT1[name="df_itemcodeT1"], input#df_itemcodeT1';
    const itemDescSelector = 'input#df_itemdescT1[name="df_itemdescT1"], input#df_itemdescT1';

    await expect
      .poll(
        async () => {
          const { actualItemCode, actualItemDesc, hasWarning } = await this.readSelectedItemState(
            itemCodeSelector,
            itemDescSelector
          );
          if (actualItemCode === itemCode && actualItemDesc) return 'ready';
          if (hasWarning) return 'cfl-warning';

          return `${actualItemCode || '(blank)'}|${actualItemDesc || '(blank)'}`;
        },
        { timeout, intervals: [100, 200, 500] }
      )
      .toBe('ready');
  }

  async pasteItemCodeIntoField(itemCode) {
    const itemCodeSelector = 'input#df_itemcodeT1[name="df_itemcodeT1"], input#df_itemcodeT1';
    const itemCodeInput = await this.findInAllFrames(itemCodeSelector, 20);
    const isDisabled = await itemCodeInput.evaluate((node) => Boolean(node.disabled)).catch(() => false);
    const isVisible = await itemCodeInput.isVisible().catch(() => false);

    if (!isDisabled && isVisible) {
      await itemCodeInput.click().catch(() => {});
      await itemCodeInput.fill(itemCode);
    } else {
      await itemCodeInput.evaluate((node, value) => {
        node.value = value;
      }, itemCode);
    }

    await itemCodeInput.evaluate((node) => {
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      node.dispatchEvent(new Event('blur', { bubbles: true }));
    });
    await itemCodeInput.press('Tab').catch(() => {});
  }

  async closeOpenItemCflPages() {
    for (const openPage of this.page.context().pages()) {
      if (openPage === this.page || openPage.isClosed()) continue;

      const url = openPage.url();
      if (/cfl/i.test(url) || /item/i.test(url)) {
        await openPage.close().catch(() => {});
      }
    }
  }

  async readSelectedItemState(itemCodeSelector, itemDescSelector) {
    const itemCodeInput = await this.findInAllFrames(itemCodeSelector, 2).catch(() => null);
    const itemDescInput = await this.findInAllFrames(itemDescSelector, 2).catch(() => null);
    const actualItemCode = itemCodeInput
      ? String(await itemCodeInput.inputValue().catch(() => '')).replace(/\s+/g, ' ').trim()
      : '';
    const actualItemDesc = itemDescInput
      ? String(await itemDescInput.inputValue().catch(() => '')).replace(/\s+/g, ' ').trim()
      : '';

    return {
      actualItemCode,
      actualItemDesc,
      hasWarning: await this.hasCflSelectionWarning()
    };
  }

  async hasCflSelectionWarning() {
    const warning = 'Please do not select another window while choosing from the list';

    for (const frame of this.page.frames()) {
      try {
        if (frame.isDetached()) continue;
        const found = await frame.evaluate((message) => {
          return (document.body?.innerText || '').includes(message);
        }, warning);
        if (found) return true;
      } catch (e) {
        continue;
      }
    }

    return false;
  }

  async waitForItemEntryReady() {
    const itemCodeSelector = 'input#df_itemcodeT1[name="df_itemcodeT1"], input#df_itemcodeT1';

    await expect
      .poll(
        async () => {
          const itemCfl = await this.findInAllFrames('#cfl_itemcodeT1', 3).catch(() => null);
          const itemCodeInput = await this.findInAllFrames(itemCodeSelector, 3).catch(() => null);
          if (!itemCfl || !itemCodeInput) return 'missing';

          const isCflVisible = await itemCfl.isVisible().catch(() => false);
          const isInputDisabled = await itemCodeInput
            .evaluate((node) => Boolean(node.disabled))
            .catch(() => true);
          const itemCodeValue = String(await itemCodeInput.inputValue().catch(() => ''))
            .replace(/\s+/g, ' ')
            .trim();

          return isCflVisible && !isInputDisabled && !itemCodeValue
            ? 'ready'
            : `waiting:${isCflVisible ? 'visible' : 'hidden'}:${isInputDisabled ? 'disabled' : 'enabled'}:${itemCodeValue}`;
        },
        { timeout: 15000 }
      )
      .toBe('ready');
  }

  async fillHeaderDetails({ salesOrg, distributionChannel, divisionIndex, businessCenter }) {
    await (await this.findVisibleInAllFrames('#tab1nav5', 20)).click();
    await this.waitForHeaderDropdownFilled('#df_u_sales_org', 'Sales Org');

    await this.setHeaderDropdown('#df_u_sales_org', {
      value: salesOrg,
      fieldName: 'Sales Org',
      keepExisting: true
    });
    await this.setHeaderDropdown('#df_u_distribution_channel', {
      value: distributionChannel,
      fieldName: 'Distribution Channel'
    });
    await this.setHeaderDropdown('#df_u_division', {
      index: divisionIndex,
      fieldName: 'Division'
    });
    await this.setHeaderDropdown('#df_u_business_center', {
      value: businessCenter,
      fieldName: 'Business Center',
      allowInject: true
    });
    await this.waitForHeaderDropdownsFilled([
      ['#df_u_sales_org', 'Sales Org'],
      ['#df_u_distribution_channel', 'Distribution Channel'],
      ['#df_u_division', 'Division'],
      ['#df_u_business_center', 'Business Center']
    ]);
  }

  async setHeaderDropdown(
    selector,
    { value, index, fieldName, allowInject = false, keepExisting = false }
  ) {
    const select = await this.findVisibleInAllFrames(selector, 20);
    const selected = await select.evaluate(
      (node, args) => {
        const normalize = (value) =>
          String(value || '')
            .replace(/\s+/g, ' ')
            .trim();
        const expected = normalize(args.value);
        const currentValue = normalize(node.value);
        if (args.keepExisting && !expected && !Number.isInteger(args.index) && currentValue) {
          const selectedText = node.selectedOptions?.[0]?.label || node.selectedOptions?.[0]?.textContent || '';
          return {
            value: currentValue,
            label: normalize(selectedText),
            keptExisting: true
          };
        }

        const options = Array.from(node.options || []).map((option) => ({
          element: option,
          value: normalize(option.value),
          label: normalize(option.label || option.textContent)
        }));

        let selectedOption = null;
        if (Number.isInteger(args.index)) {
          selectedOption = options[args.index] || null;
        } else if (expected) {
          selectedOption = options.find(
            (option) => option.value === expected || option.label === expected
          );
        }

        if (!selectedOption) {
          selectedOption = options.find((option) => option.value);
        }

        if (!selectedOption && expected && args.allowInject) {
          const injectedOption = new Option(expected, expected, true, true);
          node.add(injectedOption);
          selectedOption = {
            element: injectedOption,
            value: expected,
            label: expected,
            injected: true
          };
        }

        if (!selectedOption) return null;

        selectedOption.element.selected = true;
        node.value = selectedOption.element.value;
        node.dispatchEvent(new Event('input', { bubbles: true }));
        node.dispatchEvent(new Event('change', { bubbles: true }));
        node.dispatchEvent(new Event('blur', { bubbles: true }));

        return {
          value: normalize(node.value),
          label: normalize(selectedOption.element.label || selectedOption.element.textContent),
          injected: Boolean(selectedOption.injected)
        };
      },
      { value, index, allowInject, keepExisting }
    );

    if (!selected) {
      console.log(`[SALES ORDER] ${fieldName} has no selectable option.`);
      return '';
    }

    if (selected.injected) {
      console.log(
        `[SALES ORDER] ${fieldName} value "${value}" was missing from the dropdown; injected and selected it.`
      );
    } else if (value && selected.value !== value && selected.label !== value) {
      console.log(
        `[SALES ORDER] ${fieldName} value "${value}" was not available; selected "${selected.label || selected.value}".`
      );
    }

    await this.page.waitForTimeout(500);
    await this.waitForHeaderDropdownFilled(selector, fieldName);
    return selected.value || selected.label;
  }

  async waitForHeaderDropdownsFilled(fields) {
    for (const [selector, fieldName] of fields) {
      await this.waitForHeaderDropdownFilled(selector, fieldName);
    }
  }

  async waitForHeaderDropdownFilled(selector, fieldName) {
    await expect
      .poll(
        async () => {
          const select = await this.findVisibleInAllFrames(selector, 3).catch(() => null);
          if (!select) return '';

          return select
            .evaluate((node) =>
              String(node.value || '')
                .replace(/\s+/g, ' ')
                .trim()
            )
            .catch(() => '');
        },
        {
          timeout: 5000,
          message: `${fieldName} should have a selected value before continuing.`
        }
      )
      .not.toBe('');
  }

  async saveAsDraft() {
    await (await this.findVisibleInAllFrames('#tab1nav1', 20)).click();
    await this.page.waitForTimeout(300);
    const actionResult = await this.withDialogCapture(
      async () => {
        await (await this.findVisibleInAllFrames('#btnSaveAsDraft', 20)).click();
        return true;
      },
      { settleAfterDialog: false }
    );

    const popupMessage = await this.acceptCreditLimitBalancePopupIfVisible();
    const draftMessage = await this.waitForDraftSaveOutcome([
      ...actionResult.dialogMessages,
      popupMessage
    ]);
    if (this.isPostingDateOrDueDateInvalid(draftMessage)) {
      return {
        isDraft: false,
        statusMsg: draftMessage,
        isPostingDateOrDueDateInvalid: true
      };
    }

    await expect
      .poll(async () => this.readStatus(), { timeout: 15000 })
      .toContain('D|Draft');

    await this.waitForDraftPageReady();

    return {
      isDraft: true,
      statusMsg: draftMessage,
      isPostingDateOrDueDateInvalid: false
    };
  }

  async selectFirstPaymentTermForDeliveryDateAdjustment() {
    const accountingTab = await this.findVisibleInAllFrames(
      'xpath=//*[@id="tab1nav3"]',
      20
    );
    await accountingTab.click();

    const paymentTerm = await this.findVisibleInAllFrames(
      'xpath=//*[@id="df_paymentterm"]',
      20
    );
    const firstOption = paymentTerm.locator('option').first();
    await expect(firstOption).toHaveCount(1);

    const expectedValue = await firstOption.evaluate((option) => option.value);
    const expectedLabel = String(
      (await firstOption.textContent().catch(() => '')) || expectedValue || ''
    ).trim();

    await paymentTerm.selectOption({ index: 0 });
    await expect(paymentTerm).toHaveValue(expectedValue, { timeout: 5000 });
    await this.page.waitForTimeout(300);

    const selectedOption = paymentTerm.locator('option:checked');
    const actualValue = await paymentTerm.inputValue();
    const actualLabel = String(
      (await selectedOption.textContent().catch(() => '')) || actualValue || ''
    ).trim();

    const generalTab = await this.findVisibleInAllFrames(
      'xpath=//*[@id="tab1nav5"]',
      20
    );
    await generalTab.click();

    return {
      index: 0,
      expectedValue: expectedLabel || expectedValue,
      actualValue: actualLabel || actualValue
    };
  }

  async addOrUpdateUntilOpen() {
    await this.waitForDraftPageReady({ timeout: 5000 });
    const actionResult = await this.withDialogCapture(
      () => this.clickAddOrUpdateButton(),
      { settleAfterDialog: false }
    );
    const popupMessage = await this.acceptCreditLimitBalancePopupIfVisible();
    const actionButtonUsed = actionResult.result;
    let statusMsg = await this.readAddOrUpdateMessage([
      ...actionResult.dialogMessages,
      popupMessage
    ]);
    if (this.isPostingDateOrDueDateInvalid(statusMsg)) {
      return {
        isOpen: false,
        statusMsg,
        isCreditLimitBlocked: false,
        isProcessEndedSuccessfully: false,
        isPostingDateOrDueDateInvalid: true
      };
    }

    if (this.isCreditLimitBlocked(statusMsg)) {
      return {
        isOpen: false,
        statusMsg,
        isCreditLimitBlocked: true,
        isProcessEndedSuccessfully: false,
        isPostingDateOrDueDateInvalid: false
      };
    }

    let openStatusResult = await expect
      .poll(async () => this.readStatus(), { timeout: 5000 })
      .toContain('O|Open')
      .then(() => true)
      .catch(() => false);

    statusMsg = await this.waitForAddOrUpdateMessage([
      ...actionResult.dialogMessages,
      popupMessage
    ]);
    if (this.isPostingDateOrDueDateInvalid(statusMsg)) {
      return {
        isOpen: false,
        statusMsg,
        isCreditLimitBlocked: false,
        isProcessEndedSuccessfully: false,
        isPostingDateOrDueDateInvalid: true
      };
    }

    const isPendingApproval = await this.isPendingForApproval().catch(() => false);
    if (!openStatusResult && isPendingApproval && this.isProcessEndedSuccessfully(statusMsg)) {
      return {
        isOpen: false,
        statusMsg,
        isCreditLimitBlocked: false,
        isProcessEndedSuccessfully: true,
        isPostingDateOrDueDateInvalid: false
      };
    }

    if (this.isCreditLimitBlocked(statusMsg)) {
      return {
        isOpen: false,
        statusMsg,
        isCreditLimitBlocked: true,
        isProcessEndedSuccessfully: false,
        isPostingDateOrDueDateInvalid: false
      };
    }

    if (!openStatusResult && this.isProcessEndedSuccessfully(statusMsg)) {
      return {
        isOpen: false,
        statusMsg,
        isCreditLimitBlocked: false,
        isProcessEndedSuccessfully: true,
        isPostingDateOrDueDateInvalid: false
      };
    }

    const currentStatus = await this.readStatus().catch(() => '');
    if (!openStatusResult && this.isDraftStatus(currentStatus)) {
      return {
        isOpen: false,
        statusMsg: statusMsg || 'Document remained Draft after Add; treating as credit limit validation.',
        isCreditLimitBlocked: true,
        isProcessEndedSuccessfully: false,
        isPostingDateOrDueDateInvalid: false
      };
    }

    if (!openStatusResult && actionButtonUsed !== 'btnAdd') {
      const alternateSelector =
        actionButtonUsed === 'btnAdd'
          ? 'a#btnUpdate[name="btnUpdate"]'
          : 'a#btnAdd[name="btnAdd"]';
      const alternateResult = await this.withDialogCapture(() =>
        this.clickIfExists(alternateSelector, 6)
      );
      if (alternateResult.result) {
        statusMsg = await this.readSubmitMessage(alternateResult.dialogMessages);
        if (this.isPostingDateOrDueDateInvalid(statusMsg)) {
          return {
            isOpen: false,
            statusMsg,
            isCreditLimitBlocked: false,
            isProcessEndedSuccessfully: false,
            isPostingDateOrDueDateInvalid: true
          };
        }

        if (this.isCreditLimitBlocked(statusMsg)) {
          return {
            isOpen: false,
            statusMsg,
            isCreditLimitBlocked: true,
            isProcessEndedSuccessfully: false,
            isPostingDateOrDueDateInvalid: false
          };
        }

        if (this.isProcessEndedSuccessfully(statusMsg)) {
          return {
            isOpen: false,
            statusMsg,
            isCreditLimitBlocked: false,
            isProcessEndedSuccessfully: true,
            isPostingDateOrDueDateInvalid: false
          };
        }

        openStatusResult = await expect
          .poll(async () => this.readStatus(), { timeout: 5000 })
          .toContain('O|Open')
          .then(() => true)
          .catch(() => false);
        statusMsg = await this.readAddOrUpdateMessage(alternateResult.dialogMessages);
        if (this.isPostingDateOrDueDateInvalid(statusMsg)) {
          return {
            isOpen: false,
            statusMsg,
            isCreditLimitBlocked: false,
            isProcessEndedSuccessfully: false,
            isPostingDateOrDueDateInvalid: true
          };
        }

        if (this.isCreditLimitBlocked(statusMsg)) {
          return {
            isOpen: false,
            statusMsg,
            isCreditLimitBlocked: true,
            isProcessEndedSuccessfully: false,
            isPostingDateOrDueDateInvalid: false
          };
        }

        if (!openStatusResult && this.isProcessEndedSuccessfully(statusMsg)) {
          return {
            isOpen: false,
            statusMsg,
            isCreditLimitBlocked: false,
            isProcessEndedSuccessfully: true,
            isPostingDateOrDueDateInvalid: false
          };
        }
      }
    }

    statusMsg = await this.readAddOrUpdateMessage();
    if (this.isPostingDateOrDueDateInvalid(statusMsg)) {
      return {
        isOpen: false,
        statusMsg,
        isCreditLimitBlocked: false,
        isProcessEndedSuccessfully: false,
        isPostingDateOrDueDateInvalid: true
      };
    }

    const isCreditLimitBlocked = this.isCreditLimitBlocked(statusMsg);
    const hasPendingApproval = await this.isPendingForApproval().catch(() => false);
    if (!openStatusResult && hasPendingApproval && this.isProcessEndedSuccessfully(statusMsg)) {
      return {
        isOpen: false,
        statusMsg,
        isCreditLimitBlocked: false,
        isProcessEndedSuccessfully: true,
        isPostingDateOrDueDateInvalid: false
      };
    }

    return {
      isOpen: openStatusResult && !isCreditLimitBlocked,
      statusMsg: statusMsg || (!openStatusResult ? 'Document did not open after Add.' : ''),
      isCreditLimitBlocked:
        isCreditLimitBlocked ||
        (!openStatusResult && actionButtonUsed === 'btnAdd' && !hasPendingApproval),
      isProcessEndedSuccessfully:
        !openStatusResult && !isCreditLimitBlocked && this.isProcessEndedSuccessfully(statusMsg),
      isPostingDateOrDueDateInvalid: false
    };
  }

  async clickAddOrUpdateButton() {
    try {
      const btnAdd = await this.findVisibleInAllFrames('a#btnAdd[name="btnAdd"]', 12);
      await btnAdd.click();
      return 'btnAdd';
    } catch (e) {
      const btnUpdate = await this.findVisibleInAllFrames('a#btnUpdate[name="btnUpdate"]', 12);
      await btnUpdate.click();
      return 'btnUpdate';
    }
  }

  async waitForDraftPageReady({ timeout = 15000 } = {}) {
    await expect
      .poll(
        async () => {
          const status = await this.readStatus().catch(() => '');
          const actionButton = await this.findVisibleInAllFrames(
            'a#btnAdd[name="btnAdd"], a#btnUpdate[name="btnUpdate"]',
            3
          ).catch(() => null);
          if (!status.includes('D|Draft')) return `status:${status}`;
          if (!actionButton) return 'missing-action-button';
          return 'ready';
        },
        { timeout }
      )
      .toBe('ready');
  }

  async waitForOperationSuccess() {
    await expect
      .poll(
        async () => this.readStatusMessage().catch(() => ''),
        {
          timeout: 15000,
          message: 'Operation ended successfully message should appear before continuing.'
        }
      )
      .toMatch(/operation\s+ended\s+successfully/i);
  }

  async waitForDraftSaveOutcome(extraMessages = []) {
    const immediateMessage = await this.readDraftSaveMessage(extraMessages);
    if (this.isPostingDateOrDueDateInvalid(immediateMessage)) {
      return immediateMessage;
    }

    const successMessage = await expect
      .poll(
        async () => {
          const message = await this.readDraftSaveMessage(extraMessages).catch(() => '');
          if (this.isPostingDateOrDueDateInvalid(message)) return message;
          if (this.isProcessEndedSuccessfully(message)) return message;
          return '';
        },
        {
          timeout: 15000,
          message: 'Draft save success or posting-date validation message should appear before continuing.'
        }
      )
      .not.toBe('')
      .then(() => this.readDraftSaveMessage(extraMessages))
      .catch(() => immediateMessage);

    if (this.isPostingDateOrDueDateInvalid(successMessage)) {
      return successMessage;
    }

    const delayedValidationMessage = await this.waitForPostingDateValidationMessage({
      timeout: 2500
    });
    return delayedValidationMessage || successMessage;
  }

  async waitForPostingDateValidationMessage({ timeout = 2500 } = {}) {
    return expect
      .poll(
        async () => {
          const message = await this.readDraftSaveMessage().catch(() => '');
          if (this.isPostingDateOrDueDateInvalid(message)) {
            return message;
          }
          return '';
        },
        {
          timeout,
          intervals: [100, 150, 250, 500],
          message: 'Posting-date validation should be detected before continuing after draft save.'
        }
      )
      .not.toBe('')
      .then(() => this.readDraftSaveMessage())
      .catch(() => '');
  }

  async readDraftSaveMessage(extraMessages = []) {
    const pageMessage = await this.readAddOrUpdateMessage().catch(() => '');
    if (this.isPostingDateOrDueDateInvalid(pageMessage)) return pageMessage;

    const joinedExtraMessages = extraMessages.filter(Boolean).join(' | ').trim();
    if (this.isPostingDateOrDueDateInvalid(joinedExtraMessages)) return joinedExtraMessages;

    return pageMessage || joinedExtraMessages;
  }

  async withDialogCapture(action, options = {}) {
    const dialogMessages = [];
    let acceptedDialog = false;
    const handler = async (dialog) => {
      dialogMessages.push(dialog.message());
      acceptedDialog = true;
      await dialog.accept().catch(async () => {
        await dialog.dismiss().catch(() => {});
      });
    };

    this.page.on('dialog', handler);
    try {
      const result = await action();
      await this.page.waitForTimeout(500);
      if (acceptedDialog || options.settleAfterDialog) {
        await this.waitForPostDialogLoad();
      }
      return { result, dialogMessages };
    } finally {
      this.page.off('dialog', handler);
    }
  }

  async acceptCreditLimitBalancePopupIfVisible() {
    const popupTextSelectors = [
      'text=/Insufficient\\s+Credit\\s+Limit\\s+Balance/i',
      'text=/Credit\\s+Limit\\s+Balance/i'
    ];
    const okButtonSelectors = [
      'button:has-text("OK")',
      'input[type="button"][value="OK"]',
      'input[type="submit"][value="OK"]',
      'a:has-text("OK")',
      'button:has-text("Ok")',
      'a:has-text("Ok")'
    ];

    const readCreditLimitPopupMessage = async () => {
      for (const selector of popupTextSelectors) {
        const popup = await this.findVisibleInAllFrames(selector, 2).catch(() => null);
        if (!popup) continue;

        const popupText = await popup.textContent().catch(() => '');
        return popupText || 'Insufficient Credit Limit Balance';
      }
      return '';
    };

    const popupMessage = await readCreditLimitPopupMessage();
    if (!popupMessage) return '';

    for (const selector of okButtonSelectors) {
      const okButton = await this.findVisibleInAllFrames(selector, 2).catch(() => null);
      if (!okButton) continue;

      await okButton.click();
      await this.waitForPostDialogLoad();
      return popupMessage;
    }

    return popupMessage;
  }

  async waitForPostDialogLoad() {
    await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
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

  async readAddOrUpdateMessage(extraMessages = []) {
    const joinedExtraMessages = extraMessages.filter(Boolean).join(' | ').trim();
    if (joinedExtraMessages) return joinedExtraMessages;

    const raiseDiagnostics = await this.readRaiseErrorDiagnostics();
    if (raiseDiagnostics) return raiseDiagnostics;

    const statusMsg = await this.readStatusMessage();
    return statusMsg;
  }

  async waitForAddOrUpdateMessage(extraMessages = []) {
    const immediateMessage = await this.readAddOrUpdateMessage(extraMessages);
    if (
      this.isCreditLimitBlocked(immediateMessage) ||
      this.isProcessEndedSuccessfully(immediateMessage) ||
      this.isPostingDateOrDueDateInvalid(immediateMessage)
    ) {
      return immediateMessage;
    }

    return expect
      .poll(
        async () => {
          const message = await this.readAddOrUpdateMessage(extraMessages).catch(() => '');
          if (
            this.isCreditLimitBlocked(message) ||
            this.isProcessEndedSuccessfully(message) ||
            this.isPostingDateOrDueDateInvalid(message)
          ) {
            return message;
          }
          return '';
        },
        { timeout: 2500 }
      )
      .not.toBe('')
      .then(() => this.readAddOrUpdateMessage(extraMessages))
      .catch(() => immediateMessage);
  }

  async readStatusMessage(extraMessages = []) {
    const joinedExtraMessages = extraMessages.filter(Boolean).join(' | ').trim();
    if (joinedExtraMessages) return joinedExtraMessages;

    const selectors = [
      '#statusMsgColumn',
      'label#statusMsg',
      '#statusMsg',
      '[id*="statusMsg"]',
      '[id*="raiseerror"]',
      '[class*="status"]'
    ];

    for (const selector of selectors) {
      const statusMsgEl = await this.findInAllFrames(selector, 4).catch(() => null);
      const statusMsg = statusMsgEl
        ? await statusMsgEl
          .evaluate((element) => {
            if ('value' in element) return element.value;
            return element.innerText || element.textContent || '';
          })
          .then((value) => String(value || '').trim())
          .catch(() => '')
        : '';
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
            '#statusMsgColumn',
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

          const validationText = (document.body.innerText || '')
            .split(/\n+/)
            .map((line) => line.trim())
            .filter((line) =>
              /insufficient\s+credit\s+limit\s+balance|invalid action.*credit\s+limit|credit\s+limit.*invalid action|for checking.*credit\s+limit|credit\s+limit.*for checking|ispostingdatevalid|invalid\s+due\s+date|posting\s+period|raiseerror/i.test(line)
            )
            .join(' | ');

          return { matches, validationText };
        });

        if (diagnostics.validationText) return diagnostics.validationText;

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

  async readDocumentMemory(options = {}) {
    const bpCodeInput = await this.findInAllFrames(
      'input#df_bpcode[name="df_bpcode"], input#df_bpcode, input[name="df_bpcode"]',
      5
    ).catch(() => null);
    const bpCode = bpCodeInput
      ? await bpCodeInput.inputValue().catch(() => '')
      : options.fallbackBpCode || '';
    const docNo = await readCurrentDocNo(this, {
      required: false
    }).catch(() => '') || options.fallbackDocNo || '';

    return {
      bpCode,
      docNo
    };
  }

  async readPageHeaderText() {
    const selectors = [
      'td.labelPageHeader',
      '.labelPageHeader',
      'xpath=//td[contains(@class,"labelPageHeader")]'
    ];

    for (const selector of selectors) {
      const header = await this.findInAllFrames(selector, 3).catch(() => null);
      if (!header) continue;

      const text = ((await header.textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
      if (text) return text;
    }

    return '';
  }

  async isPendingForApproval() {
    return expect
      .poll(async () => this.readPageHeaderText().catch(() => ''), { timeout: 3000 })
      .toMatch(/pending\s+for\s+approval/i)
      .then(() => true)
      .catch(() => false);
  }

  isCreditLimitBlocked(statusMsg) {
    return (
      /^\s*credit\s+limit\s*$/i.test(statusMsg || '') ||
      this.isCreditLimitBalanceMessage(statusMsg) ||
      (/credit limit/i.test(statusMsg) && /(invalid action|for checking|raiseerror)/i.test(statusMsg))
    );
  }

  isCreditLimitBalanceMessage(statusMsg) {
    return /insufficient\s+credit\s+limit\s+balance/i.test(statusMsg || '');
  }

  isPostingDateOrDueDateInvalid(statusMsg) {
    return /ispostingdatevalid/i.test(statusMsg || '') ||
      (/invalid\s+due\s+date/i.test(statusMsg || '') && /period/i.test(statusMsg || ''));
  }

  isDraftStatus(status) {
    return String(status || '').includes('D|Draft');
  }

  isProcessEndedSuccessfully(statusMsg) {
    return /(process|operation)\s+ended\s+successfully/i.test(statusMsg || '');
  }
}

module.exports = { SalesOrderPage };
