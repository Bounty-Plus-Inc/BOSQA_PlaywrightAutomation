// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');

class ItemCFL extends BasePage {
  async expectLookupReady(itemCode) {
    await this.page.waitForLoadState('domcontentloaded');
    await this.findInAllFrames(`label:has-text("${itemCode}")`, 20);
  }

  async selectItemByLabel(itemCode) {
    await this.expectLookupReady(itemCode);
    const itemLabel = await this.findInAllFrames(`label:has-text("${itemCode}")`, 20);
    await itemLabel.click();

    const itemOkButton = await this.findInAllFrames('a.button:has-text("OK")', 20);
    await itemOkButton.click();
    await this.page.waitForEvent('close', { timeout: 4000 }).catch(() => {});
  }
}

module.exports = { ItemCFL };
