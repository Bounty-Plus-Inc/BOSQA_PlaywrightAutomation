// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');

const DEFAULT_ITEM_SELECTORS = {
  trigger: 'xpath=//*[@id="cfl_itemcodeT1"]',
  filterInput: '#df_inputfilter',
  filterButton:
    'xpath=/html/body/form/table[2]/tbody/tr/td[2]/table/tbody/tr[2]/td/table/tbody/tr[5]/td[2]/a',
  resultColumn: 'xpath=//*[@id="col_itemcodeT1"]',
  okButton:
    'xpath=/html/body/form/table[2]/tbody/tr/td[2]/table/tbody/tr[7]/td/table/tbody/tr/td[1]/a'
};

function cssQuoted(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

class ItemCFL extends BasePage {
  async expectLookupReady(itemCode) {
    await this.page.waitForLoadState('domcontentloaded');
    await this.findInAllFrames(DEFAULT_ITEM_SELECTORS.filterInput, 20)
      .catch(() => this.findInAllFrames(`label:has-text("${itemCode}")`, 20));
  }

  async selectItemByLabel(itemCode) {
    await this.expectLookupReady(itemCode);
    await this.filterItemCode(itemCode);
    await this.expectFilteredItem(itemCode);

    const itemRow = await this.findItemRow(itemCode);
    await this.clickItemRow(itemRow);
    await this.confirmSelection(itemRow);
  }

  async clickItemRow(itemRow) {
    await itemRow.evaluate((element) => {
      const row = element.closest('tr');
      if (row && typeof row.click === 'function') {
        row.click();
        return;
      }

      element.click();
    });
  }

  async confirmSelection(itemRow) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const itemOkButton = await this.findInAllFrames(DEFAULT_ITEM_SELECTORS.okButton, 10);
      const closePromise = this.page
        .waitForEvent('close', { timeout: 2500 })
        .then(() => true)
        .catch(() => false);
      await itemOkButton.click();

      if (await closePromise) return;
      if (this.page.isClosed()) return;

      await this.page.waitForTimeout(250);
      await this.clickItemRow(itemRow).catch(() => {});
    }

    throw new Error('Item CFL did not close after confirming the selected row.');
  }

  async filterItemCode(itemCode) {
    const filterInput = await this.findInAllFrames(DEFAULT_ITEM_SELECTORS.filterInput, 8)
      .catch(() => null);
    if (!filterInput) return;

    await filterInput.fill(itemCode);
    const filterButton = await this.findInAllFrames(DEFAULT_ITEM_SELECTORS.filterButton, 10);
    await filterButton.click();
  }

  async expectFilteredItem(itemCode) {
    await this.findInAllFrames(DEFAULT_ITEM_SELECTORS.resultColumn, 10);
    await this.findItemRow(itemCode);
  }

  async findItemRow(itemCode) {
    const escapedItemCode = cssQuoted(itemCode);
    const resultColumn = await this.findInAllFrames(DEFAULT_ITEM_SELECTORS.resultColumn, 3)
      .catch(() => null);
    if (resultColumn) {
      const exactHandle = await resultColumn.evaluateHandle((column, code) => {
        const candidates = Array.from(column.querySelectorAll('input, label, span, td, a'));
        return candidates.find((element) => {
          const value = 'value' in element ? element.value : '';
          const text = element.innerText || element.textContent || '';
          return String(value || text || '').trim() === code;
        }) || null;
      }, itemCode).catch(() => null);
      const exactElement = exactHandle ? exactHandle.asElement() : null;
      if (exactElement) return exactElement;

      const text = await resultColumn.textContent().catch(() => '');
      if (String(text || '').split(/\s+/).includes(itemCode)) return resultColumn;
    }

    const itemInput = await this.findInAllFrames(
      `input[id^="df_itemcodeT1r"][value="${escapedItemCode}"]`,
      1
    ).catch(() => null);
    if (itemInput) return itemInput;

    const visibleLabel = await this.findInAllFrames(
      `label[id^="dd_itemcodeT1r"]:has-text("${escapedItemCode}")`,
      1
    ).catch(() => null);
    if (visibleLabel) return visibleLabel;

    const exactLabel = await this.findInAllFrames(
      `xpath=//label[normalize-space(.)="${itemCode}"]`,
      1
    ).catch(() => null);
    if (exactLabel) return exactLabel;

    return this.findInAllFrames(`label:has-text("${escapedItemCode}")`, 6);
  }
}

module.exports = { DEFAULT_ITEM_SELECTORS, ItemCFL };
