const { expect } = require('@playwright/test');
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
    await okButton.click();
    await this.page.waitForEvent('close', { timeout: 5000 }).catch(() => {});
    return selectedCustomerCode;
  }

  async selectCustomerCode(preferredCode) {
    if (!preferredCode) {
      throw new Error('Customer code is required for BusinessPartnerCFL.selectCustomerCode().');
    }

    const codeSelectors = [preferredCode];

    for (const code of codeSelectors) {
      try {
        const hiddenCode = await this.findInAllFrames(
          `input[id^="df_custnoT1r"][value="${code}"]`,
          10
        );
        const hiddenCodeId = await hiddenCode.getAttribute('id');
        if (!hiddenCodeId) continue;
        const labelId = `#${hiddenCodeId.replace('df_custno', 'dd_custno')}`;
        const label = await this.findInAllFrames(labelId, 10);
        await label.click();

        const okButton = await this.findInAllFrames('a.button:has-text("OK")', 20);
        await okButton.click();
        await this.page.waitForEvent('close', { timeout: 5000 }).catch(() => {});
        return code;
      } catch (e) {
        continue;
      }
    }

    throw new Error(`Customer code not found in popup: ${preferredCode}`);
  }
}

module.exports = { BusinessPartnerCFL };
