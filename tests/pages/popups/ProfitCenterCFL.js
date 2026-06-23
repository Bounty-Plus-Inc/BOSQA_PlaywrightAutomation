// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');

const DEFAULT_PROFIT_CENTER_SELECTORS = {
  trigger: 'img#cfl_drcodeT1',
  output: 'input#df_drcodeT1',
  filterInput: '#df_inputfilter',
  filterButton:
    'xpath=/html/body/form/table[2]/tbody/tr/td[2]/table/tbody/tr[2]/td/table/tbody/tr/td[3]/a',
  resultColumn: 'xpath=//*[@id="col_profitcenterT1"]',
  okButton:
    'xpath=/html/body/form/table[2]/tbody/tr/td[2]/table/tbody/tr[7]/td/table/tbody/tr/td/a[1]'
};

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cssQuoted(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function toBasePage(pageOrPageObject) {
  if (!pageOrPageObject) {
    throw new Error('A Playwright page or page object is required for ProfitCenterCFL.');
  }

  if (typeof pageOrPageObject.findInAllFrames === 'function') {
    return pageOrPageObject;
  }

  if (pageOrPageObject.page && typeof pageOrPageObject.page.frames === 'function') {
    return new BasePage(pageOrPageObject.page);
  }

  if (typeof pageOrPageObject.frames === 'function') {
    return new BasePage(pageOrPageObject);
  }

  throw new Error('Unsupported ProfitCenterCFL target. Pass a Playwright page or BasePage object.');
}

class ProfitCenterCFL extends BasePage {
  static async selectFromLookup(pageOrPageObject, profitCenterCode, options = {}) {
    const sourcePage = toBasePage(pageOrPageObject);
    const selectors = {
      ...DEFAULT_PROFIT_CENTER_SELECTORS,
      ...(options.selectors || {})
    };

    const popupPromise = sourcePage.page.context().waitForEvent('page', {
      timeout: options.popupTimeout || 15000
    });
    const trigger = await sourcePage.findInAllFrames(selectors.trigger, 20);
    await trigger.click();

    const profitCenterPopup = await popupPromise;
    const profitCenterCFL = new ProfitCenterCFL(profitCenterPopup);
    const selectedProfitCenterCode = await profitCenterCFL.selectProfitCenterCode(
      profitCenterCode,
      {
        selectors,
        resultTimeout: options.resultTimeout
      }
    );

    const output = await sourcePage.findInAllFrames(selectors.output, 20);
    await expect(output).toHaveValue(selectedProfitCenterCode, { timeout: 10000 });
    return selectedProfitCenterCode;
  }

  async expectLookupReady(options = {}) {
    const selectors = {
      ...DEFAULT_PROFIT_CENTER_SELECTORS,
      ...(options.selectors || {})
    };

    await this.page.waitForLoadState('domcontentloaded');
    const filterInput = await this.findInAllFrames(selectors.filterInput, 20);
    await expect(filterInput).toBeVisible({ timeout: 20000 });
  }

  async selectProfitCenterCode(profitCenterCode, options = {}) {
    const selectedProfitCenterCode = String(profitCenterCode || '').trim();
    if (!selectedProfitCenterCode) {
      throw new Error('Profit center code is required for ProfitCenterCFL.selectProfitCenterCode().');
    }

    const selectors = {
      ...DEFAULT_PROFIT_CENTER_SELECTORS,
      ...(options.selectors || {})
    };

    await this.expectLookupReady({ selectors });

    const filterInput = await this.findInAllFrames(selectors.filterInput, 20);
    await filterInput.fill(selectedProfitCenterCode);

    const filterButton = await this.findInAllFrames(selectors.filterButton, 20)
      .catch(() => this.findInAllFrames('a.button[onclick*="Grid_Filter"]', 20));
    await filterButton.click();

    const resultCode = await this.findFilteredProfitCenterCode(selectedProfitCenterCode, {
      selectors,
      timeout: options.resultTimeout || 10000
    });
    if (resultCode !== selectedProfitCenterCode) {
      throw new Error(
        `Profit center filter returned "${resultCode || '(empty)'}" instead of "${selectedProfitCenterCode}".`
      );
    }

    await this.clickProfitCenterResult(selectedProfitCenterCode, { selectors });

    const okButton = await this.findInAllFrames(selectors.okButton, 20)
      .catch(() => this.findInAllFrames('a.button:has-text("OK")', 20));
    const closePromise = this.page.waitForEvent('close', { timeout: 1000 }).catch(() => {});
    await okButton.click();
    await closePromise;
    return selectedProfitCenterCode;
  }

  async findFilteredProfitCenterCode(profitCenterCode, options = {}) {
    const selectors = {
      ...DEFAULT_PROFIT_CENTER_SELECTORS,
      ...(options.selectors || {})
    };

    await expect
      .poll(async () => this.readProfitCenterCode(profitCenterCode, selectors), {
        timeout: options.timeout || 10000
      })
      .not.toBe('');

    return this.readProfitCenterCode(profitCenterCode, selectors);
  }

  async clickProfitCenterResult(profitCenterCode, options = {}) {
    const selectors = {
      ...DEFAULT_PROFIT_CENTER_SELECTORS,
      ...(options.selectors || {})
    };

    const rowLocator = await this.findProfitCenterRow(profitCenterCode, selectors);
    await rowLocator.click();
  }

  async readProfitCenterCode(profitCenterCode, selectors = DEFAULT_PROFIT_CENTER_SELECTORS) {
    const escapedProfitCenterCode = cssQuoted(profitCenterCode);
    const hiddenValue = await this.findInAllFrames(
      `input[id^="df_profitcenterT1r"][value="${escapedProfitCenterCode}"]`,
      1
    )
      .then((locator) => locator.inputValue())
      .catch(() => '');
    if (hiddenValue) return normalizeText(hiddenValue);

    const visibleValue = await this.findInAllFrames(
      `label[id^="dd_profitcenterT1r"]:has-text("${escapedProfitCenterCode}")`,
      1
    )
      .then((locator) => locator.textContent())
      .catch(() => '');
    if (visibleValue) return normalizeText(visibleValue);

    const resultColumnText = await this.findInAllFrames(selectors.resultColumn, 3)
      .then((locator) => locator.textContent())
      .catch(() => '');
    const normalizedColumnText = normalizeText(resultColumnText);
    const columnValues = normalizedColumnText.split(/\s+/);
    return columnValues.includes(profitCenterCode) ? profitCenterCode : normalizedColumnText;
  }

  async findProfitCenterRow(profitCenterCode, selectors = DEFAULT_PROFIT_CENTER_SELECTORS) {
    const escapedProfitCenterCode = cssQuoted(profitCenterCode);
    const profitCenterLabel = await this.findInAllFrames(
      `label[id^="dd_profitcenterT1r"]:has-text("${escapedProfitCenterCode}")`,
      10
    ).catch(() => null);
    if (profitCenterLabel) {
      return profitCenterLabel.locator('xpath=ancestor::tr[1]').first();
    }

    const profitCenterInput = await this.findInAllFrames(
      `input[id^="df_profitcenterT1r"][value="${escapedProfitCenterCode}"]`,
      10
    ).catch(() => null);
    if (profitCenterInput) {
      return profitCenterInput.locator('xpath=ancestor::tr[1]').first();
    }

    return this.findInAllFrames(selectors.resultColumn, 10)
      .then((locator) => locator.locator('xpath=ancestor::tr[1]').first());
  }
}

module.exports = {
  DEFAULT_PROFIT_CENTER_SELECTORS,
  ProfitCenterCFL
};
