// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');

class FindDocumentPage extends BasePage {
  async openFindPopup() {
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 8000 }).catch(() => null);
    const findButton = await this.findVisibleInAllFrames('a.button[onclick*="onPageFind"]', 20);
    await findButton.click();

    const popupPage = await popupPromise;
    if (popupPage) {
      await popupPage.waitForLoadState('domcontentloaded');
      return new BasePage(popupPage);
    }

    await this.findInAllFrames('input#inputfilter[name="inputfilter"]', 20);
    return this;
  }

  async filterByDocumentNo(popup, documentNo) {
    const filterInput = await popup.findInAllFrames('input#inputfilter[name="inputfilter"]', 20);
    await filterInput.fill(documentNo);

    const filterButton = await popup.findVisibleInAllFrames(
      'a.button[onclick*="Grid_Filter"]',
      20
    );
    await filterButton.click();

    const matchingDocLabel = await this.findMatchingDocNoLabel(popup, documentNo);
    await expect(matchingDocLabel).toHaveText(documentNo, { timeout: 10000 });
    return matchingDocLabel;
  }

  async selectDocumentFromResults(popup, documentNo) {
    const matchingDocLabel = await this.filterByDocumentNo(popup, documentNo);
    const popupPage = popup.page;

    await matchingDocLabel.click();

    const okButton = await popup
      .findVisibleInAllFrames('a.button[onclick*="editTableRow(\'T1\')"]', 20)
      .catch(() => popup.findVisibleInAllFrames('a.button:has-text("OK")', 10));
    await okButton.click();

    if (popupPage !== this.page) {
      await popupPage.waitForEvent('close', { timeout: 10000 }).catch(() => {});
    }

    await expect
      .poll(async () => this.readLoadedDocumentNo(), { timeout: 20000 })
      .toBe(documentNo);
  }

  async findMatchingDocNoLabel(popup, documentNo) {
    const selectors = [
      `label[id^="dd_docnoT1"]:has-text("${documentNo}")`,
      `td#col_docnoT1 label:has-text("${documentNo}")`,
      `input[id^="df_docnoT1"][value="${documentNo}"]`
    ];

    for (const selector of selectors.slice(0, 2)) {
      const match = await popup.findInAllFrames(selector, 20).catch(() => null);
      if (match) return match;
    }

    const hiddenInput = await popup.findInAllFrames(selectors[2], 20).catch(() => null);
    if (hiddenInput) {
      const inputId = await hiddenInput.getAttribute('id');
      if (inputId) {
        const labelId = inputId.replace('df_docno', 'dd_docno');
        const label = await popup.findInAllFrames(`#${labelId}`, 10).catch(() => null);
        if (label) return label;
      }
    }

    throw new Error(`Document number not found in Find Field: ${documentNo}`);
  }

  async readLoadedDocumentNo() {
    const selectors = [
      'input#df_docno[name="df_docno"]',
      'input[id="df_docno"]',
      'label#dd_docno',
      'label[id^="dd_docno"]'
    ];

    for (const selector of selectors) {
      const locator = await this.findInAllFrames(selector, 4).catch(() => null);
      if (!locator) continue;

      const value = await locator.inputValue().catch(async () => locator.textContent().catch(() => ''));
      const normalized = (value || '').trim();
      if (normalized) return normalized;
    }

    return '';
  }
}

module.exports = { FindDocumentPage };
