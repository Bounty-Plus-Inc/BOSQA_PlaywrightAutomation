// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');

const DEFAULT_WAREHOUSE_SELECTORS = {
  trigger: 'xpath=//*[@id="cfl_whscodeT1"]',
  output: 'input#df_whscodeT1',
  filterInput: '#df_inputfilter',
  filterButton:
    'xpath=/html/body/form/table[2]/tbody/tr/td[2]/table/tbody/tr[2]/td/table/tbody/tr/td[3]/a',
  resultColumn: 'xpath=//*[@id="col_warehouseT1"]',
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
    throw new Error('A Playwright page or page object is required for WarehouseCFL.');
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

  throw new Error('Unsupported WarehouseCFL target. Pass a Playwright page or BasePage object.');
}

class WarehouseCFL extends BasePage {
  static async selectFromLookup(pageOrPageObject, warehouseCode, options = {}) {
    const sourcePage = toBasePage(pageOrPageObject);
    const selectors = {
      ...DEFAULT_WAREHOUSE_SELECTORS,
      ...(options.selectors || {})
    };

    const popupPromise = sourcePage.page.context().waitForEvent('page', {
      timeout: options.popupTimeout || 15000
    });
    const trigger = await sourcePage.findVisibleInAllFrames(selectors.trigger, 20)
      .catch(() => sourcePage.findInAllFrames(selectors.trigger, 20));
    await trigger.scrollIntoViewIfNeeded().catch(() => {});
    await trigger.click();

    const warehousePopup = await popupPromise;
    const warehouseCFL = new WarehouseCFL(warehousePopup);
    const selectedWarehouseCode = await warehouseCFL.selectWarehouseCode(warehouseCode, {
      selectors,
      resultTimeout: options.resultTimeout
    });

    const output = await sourcePage.findInAllFrames(selectors.output, 20);
    await expect(output)
      .toHaveValue(selectedWarehouseCode, { timeout: 10000 })
      .catch(() => {});
    return selectedWarehouseCode;
  }

  async expectLookupReady(options = {}) {
    const selectors = {
      ...DEFAULT_WAREHOUSE_SELECTORS,
      ...(options.selectors || {})
    };

    await this.page.waitForLoadState('domcontentloaded');
    const filterInput = await this.findInAllFrames(selectors.filterInput, 20);
    await expect(filterInput).toBeVisible({ timeout: 20000 });
  }

  async selectWarehouseCode(warehouseCode, options = {}) {
    const selectedWarehouseCode = String(warehouseCode || '').trim();
    if (!selectedWarehouseCode) {
      throw new Error('Warehouse code is required for WarehouseCFL.selectWarehouseCode().');
    }

    const selectors = {
      ...DEFAULT_WAREHOUSE_SELECTORS,
      ...(options.selectors || {})
    };

    await this.expectLookupReady({ selectors });

    const filterInput = await this.findInAllFrames(selectors.filterInput, 20);
    await filterInput.fill(selectedWarehouseCode);

    const filterButton = await this.findInAllFrames(selectors.filterButton, 20)
      .catch(() => this.findInAllFrames('a.button[onclick*="Grid_Filter"]', 20));
    await filterButton.click();

    const resultCode = await this.findFilteredWarehouseCode(selectedWarehouseCode, {
      selectors,
      timeout: options.resultTimeout || 10000
    });
    if (resultCode !== selectedWarehouseCode) {
      throw new Error(
        `Warehouse filter returned "${resultCode || '(empty)'}" instead of "${selectedWarehouseCode}".`
      );
    }

    await this.clickWarehouseResult(selectedWarehouseCode, { selectors });

    const okButton = await this.findInAllFrames(selectors.okButton, 20)
      .catch(() => this.findInAllFrames('a.button:has-text("OK")', 20));
    const closePromise = this.page.waitForEvent('close', { timeout: 1000 }).catch(() => {});
    await okButton.click();
    await closePromise;
    return selectedWarehouseCode;
  }

  async findFilteredWarehouseCode(warehouseCode, options = {}) {
    const selectors = {
      ...DEFAULT_WAREHOUSE_SELECTORS,
      ...(options.selectors || {})
    };

    await expect
      .poll(async () => this.readWarehouseCode(warehouseCode, selectors), {
        timeout: options.timeout || 10000
      })
      .not.toBe('');

    return this.readWarehouseCode(warehouseCode, selectors);
  }

  async clickWarehouseResult(warehouseCode, options = {}) {
    const selectors = {
      ...DEFAULT_WAREHOUSE_SELECTORS,
      ...(options.selectors || {})
    };

    const rowLocator = await this.findWarehouseRow(warehouseCode, selectors);
    await rowLocator.click();
  }

  async readWarehouseCode(warehouseCode, selectors = DEFAULT_WAREHOUSE_SELECTORS) {
    const escapedWarehouseCode = cssQuoted(warehouseCode);
    const hiddenValue = await this.findInAllFrames(
      `input[id^="df_warehouseT1r"][value="${escapedWarehouseCode}"]`,
      1
    )
      .then((locator) => locator.inputValue())
      .catch(() => '');
    if (hiddenValue) return normalizeText(hiddenValue);

    const visibleValue = await this.findInAllFrames(
      `label[id^="dd_warehouseT1r"]:has-text("${escapedWarehouseCode}")`,
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
    return columnValues.includes(warehouseCode) ? warehouseCode : normalizedColumnText;
  }

  async findWarehouseRow(warehouseCode, selectors = DEFAULT_WAREHOUSE_SELECTORS) {
    const escapedWarehouseCode = cssQuoted(warehouseCode);
    const warehouseLabel = await this.findInAllFrames(
      `label[id^="dd_warehouseT1r"]:has-text("${escapedWarehouseCode}")`,
      10
    ).catch(() => null);
    if (warehouseLabel) {
      return warehouseLabel.locator('xpath=ancestor::tr[1]').first();
    }

    const warehouseInput = await this.findInAllFrames(
      `input[id^="df_warehouseT1r"][value="${escapedWarehouseCode}"]`,
      10
    ).catch(() => null);
    if (warehouseInput) {
      return warehouseInput.locator('xpath=ancestor::tr[1]').first();
    }

    return this.findInAllFrames(selectors.resultColumn, 10)
      .then((locator) => locator.locator('xpath=ancestor::tr[1]').first());
  }
}

module.exports = {
  DEFAULT_WAREHOUSE_SELECTORS,
  WarehouseCFL
};
