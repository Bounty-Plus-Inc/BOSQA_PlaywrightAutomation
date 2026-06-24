// This is for shared page object behavior.
const { BasePage } = require('../BasePage');

class TestingModuleMenuPage extends BasePage {
  async open() {
    throw new Error('TODO: Add menu navigation selectors for TestingModuleMenuPage.');

    // Example:
    // const mainTab = await this.findInAllFrames('a[onclick*="selectTab(\'SALES\')"]', 10);
    // await mainTab.click();
    // const menuItem = await this.findInAllFrames('a#menuYourModule', 20);
    // await menuItem.click();
  }
}

module.exports = { TestingModuleMenuPage };
