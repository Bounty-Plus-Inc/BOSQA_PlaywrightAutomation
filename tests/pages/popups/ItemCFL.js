const { BasePage } = require('../base/BasePage');

class ItemCFL extends BasePage {
  async selectItemByLabel(itemCode) {
    await this.page.waitForLoadState('domcontentloaded');
    const itemLabel = await this.findInAllFrames(`label:has-text("${itemCode}")`, 20);
    await itemLabel.click();

    const itemOkButton = await this.findInAllFrames('a.button:has-text("OK")', 20);
    await itemOkButton.click();
    await this.page.waitForEvent('close', { timeout: 4000 }).catch(() => {});
  }
}

module.exports = { ItemCFL };
