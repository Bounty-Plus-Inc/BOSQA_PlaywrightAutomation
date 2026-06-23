// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');

class BusinessPartnerCFL extends BasePage {
  async expectLookupReady() {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page).toHaveURL(/cflbusinesspartners\.php/i, { timeout: 20000 });

    const okButton = await this.findInAllFrames("a.button[onclick*=\"editTableRow('T1')\"]");
    await expect(okButton).toBeVisible({ timeout: 20000 });
    await expect(okButton).toHaveText(/OK/i);
  }

  async selectDisplayedCustomer(rowSelector = '#dd_custnoT1r2') {
    const selectedCustomerCodeElement = await this.findInAllFrames(rowSelector);
    const selectedCustomerCode =
      (await selectedCustomerCodeElement.textContent())?.trim() || '';
    if (!selectedCustomerCode) {
      throw new Error(`Customer code was empty for row selector: ${rowSelector}`);
    }

    await selectedCustomerCodeElement.click();

    const okButton = await this.findInAllFrames("a.button[onclick*=\"editTableRow('T1')\"]");
    const closePromise = this.page.waitForEvent('close', { timeout: 1200 }).catch(() => {});
    await okButton.click();
    await closePromise;
    return selectedCustomerCode;
  }

  async selectCustomerCode(preferredCode) {
    if (!preferredCode) {
      throw new Error('Customer code is required for BusinessPartnerCFL.selectCustomerCode().');
    }

    await this.expectLookupReady();

    const filterInput = await this.findInAllFrames('#df_inputfilter', 20);
    await filterInput.fill(preferredCode);

    const filterButton = await this.findInAllFrames(
      'xpath=/html/body/form/table[2]/tbody/tr/td[2]/table/tbody/tr[2]/td/table/tbody/tr[2]/td[3]/a',
      20
    ).catch(() => this.findInAllFrames('a.button[onclick*="Grid_Filter"]', 20));
    await filterButton.click();

    const customerCell = await this.findInAllFrames('xpath=//*[@id="col_custnoT1"]', 20);
    await expect
      .poll(async () => {
        const text = ((await customerCell.textContent().catch(() => '')) || '').trim();
        const hiddenValue = await this.readCustomerHiddenValue(preferredCode);
        return hiddenValue || text;
      }, { timeout: 10000 })
      .not.toBe('');

    const selectedCustomerCode = await this.findFilteredCustomerCode(preferredCode);
    if (selectedCustomerCode !== preferredCode) {
      throw new Error(
        `Customer code filter returned "${selectedCustomerCode || '(empty)'}" instead of "${preferredCode}".`
      );
    }

    const okButton = await this.findInAllFrames(
      'xpath=/html/body/form/table[2]/tbody/tr/td[2]/table/tbody/tr[7]/td/table/tbody/tr/td[2]/table/tbody/tr/td[1]/a',
      20
    ).catch(() => this.findInAllFrames("a.button[onclick*=\"editTableRow('T1')\"]", 20));
    const closePromise = this.page.waitForEvent('close', { timeout: 1200 }).catch(() => {});
    await okButton.click();
    await closePromise;
    return selectedCustomerCode;
  }

  async readCustomerHiddenValue(preferredCode) {
    const hiddenCode = await this.findInAllFrames(
      `input[id^="df_custnoT1r"][value="${preferredCode}"]`,
      1
    ).catch(() => null);
    return hiddenCode ? (await hiddenCode.inputValue().catch(() => '')) : '';
  }

  async findFilteredCustomerCode(preferredCode) {
    const hiddenValue = await this.readCustomerHiddenValue(preferredCode);
    if (hiddenValue) return hiddenValue;

    const visibleCustomer = await this.findInAllFrames('label[id^="dd_custnoT1r"]', 10)
      .catch(() => null);
    return visibleCustomer ? ((await visibleCustomer.textContent()) || '').trim() : '';
  }
}

module.exports = { BusinessPartnerCFL };
