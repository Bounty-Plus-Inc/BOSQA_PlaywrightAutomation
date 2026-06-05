// This is for shared page object behavior.
const { BasePage } = require('../BasePage');

class SalesOrderMenuPage extends BasePage {
  async open() {
    const salesTab = await this.findInAllFrames('a[onclick*="selectTab(\'SALES\')"]');
    await salesTab.click();

    const salesOrderSubtab = await this.findInAllFrames('a[id="subtab110.1"]');
    await salesOrderSubtab.hover();

    const salesOrderMenu = await this.findInAllFrames('a#menuSalesOrder');
    await salesOrderMenu.click();
  }
}

module.exports = { SalesOrderMenuPage };
