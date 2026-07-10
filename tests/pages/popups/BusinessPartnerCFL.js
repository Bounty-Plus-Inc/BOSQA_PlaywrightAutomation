// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');

class BusinessPartnerCFL extends BasePage {
  async expectLookupReady() {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page).toHaveURL(/cflbusinesspartners\.php/i, {
      timeout: 20000,
    });

    const okButton = await this.findInAllFrames(
      'a.button[onclick*="editTableRow(\'T1\')"]'
    );

    await expect(okButton).toBeVisible({ timeout: 20000 });
    await expect(okButton).toHaveText(/OK/i);
  }

  async selectDisplayedCode(rowSelector = '#dd_custnoT1r2') {
    const selectedCodeElement = await this.findInAllFrames(rowSelector);

    const selectedCode =
      (await selectedCodeElement.textContent())?.trim() || '';

    if (!selectedCode) {
      throw new Error(`Code was empty for row selector: ${rowSelector}`);
    }

    await selectedCodeElement.click();

    const okButton = await this.findInAllFrames(
      'a.button[onclick*="editTableRow(\'T1\')"]'
    );

    const closePromise = this.page
      .waitForEvent('close', { timeout: 1200 })
      .catch(() => {});

    await okButton.click();
    await closePromise;

    return selectedCode;
  }

  async selectCode(preferredCode, options = {}) {
    const {
      entityName = 'Code',
      fieldName,
      columnId,
    } = options;

    if (!preferredCode) {
      throw new Error(`${entityName} is required.`);
    }

    if (!fieldName) {
      throw new Error('fieldName is required.');
    }

    if (!columnId) {
      throw new Error('columnId is required.');
    }

    await this.expectLookupReady();

    const filterInput = await this.findInAllFrames('#df_inputfilter', 20);
    await filterInput.fill(preferredCode);

    const filterButton = await this.findInAllFrames(
      'xpath=/html/body/form/table[2]/tbody/tr/td[2]/table/tbody/tr[2]/td/table/tbody/tr[2]/td[3]/a',
      20
    ).catch(() =>
      this.findInAllFrames('a.button[onclick*="Grid_Filter"]', 20)
    );

    await filterButton.click();

    const codeCell = await this.findInAllFrames(
      `xpath=//*[@id="${columnId}"]`,
      20
    );

    await expect
      .poll(
        async () => {
          const text =
            ((await codeCell.textContent().catch(() => '')) || '').trim();

          const hiddenValue = await this.readHiddenValue(
            preferredCode,
            fieldName
          );

          return hiddenValue || text;
        },
        { timeout: 10000 }
      )
      .not.toBe('');

    const selectedCode = await this.findFilteredCode(
      preferredCode,
      fieldName
    );

    if (selectedCode !== preferredCode) {
      throw new Error(
        `${entityName} filter returned "${selectedCode || '(empty)'}" instead of "${preferredCode}".`
      );
    }

    const okButton = await this.findInAllFrames(
      'xpath=/html/body/form/table[2]/tbody/tr/td[2]/table/tbody/tr[7]/td/table/tbody/tr/td[2]/table/tbody/tr/td[1]/a',
      20
    ).catch(() =>
      this.findInAllFrames(
        'a.button[onclick*="editTableRow(\'T1\')"]',
        20
      )
    );

    const closePromise = this.page
      .waitForEvent('close', { timeout: 1200 })
      .catch(() => {});

    await okButton.click();
    await closePromise;

    return selectedCode;
  }

  async readHiddenValue(preferredCode, fieldName) {
    const hiddenCode = await this.findInAllFrames(
      `input[id^="df_${fieldName}T1r"][value="${preferredCode}"]`,
      1
    ).catch(() => null);

    return hiddenCode
      ? await hiddenCode.inputValue().catch(() => '')
      : '';
  }

  async findFilteredCode(preferredCode, fieldName) {
    const hiddenValue = await this.readHiddenValue(
      preferredCode,
      fieldName
    );

    if (hiddenValue) {
      return hiddenValue;
    }

    const visibleCode = await this.findInAllFrames(
      `label[id^="dd_${fieldName}T1r"]`,
      10
    ).catch(() => null);

    return visibleCode
      ? ((await visibleCode.textContent()) || '').trim()
      : '';
  }
}

module.exports = { BusinessPartnerCFL };