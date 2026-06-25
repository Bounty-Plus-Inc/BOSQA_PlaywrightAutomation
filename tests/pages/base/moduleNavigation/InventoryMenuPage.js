// This is for shared page object behavior.
const { BasePage } = require('../BasePage');

class InventoryMenuPage extends BasePage {
  async open() {
    

    // Example:
    const mainTab = await this.findInAllFrames('a[onclick*="selectTab(\'Inventory\')"]', 10);
    await mainTab.click();
    const menuSubMenu = await this.findInAllFrames('text=Inventory Transactions',20);
    await menuSubMenu.click();

   const menuItem = await this.findInAllFrames('xpath=//*[@id="menugoodsreceipt"]', 30);
    await menuItem.click();

  }
}

module.exports = { InventoryMenuPage };
