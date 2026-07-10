// This is for shared page object behavior.
const { BasePage } = require('../BasePage');

class InventoryMenuPage extends BasePage {
  async openTransaction(transactionName) {
    const mainTab = await this.findInAllFrames(
      'a[onclick*="selectTab(\'Inventory\')"]'
    );
    await mainTab.click();

    await (await this.findInAllFrames('text=Inventory Transactions')).click();

    await (await this.findInAllFrames(`text=${transactionName}`)).click();
  }


}

module.exports = { InventoryMenuPage };
