// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../BasePage');

class DeliveryOrderMenuPage extends BasePage {
  async open() {
    const salesMainTab = await this.findInAllFrames('a[onclick*="selectTab(\'SALES\')"]', 10);
    await salesMainTab.click();

    const salesOrderSubtab = await this.findInAllFrames('a[id="subtab110.1"]', 20);
    await salesOrderSubtab.hover();

    const deliveryOrderMenu = await this.findInAllFrames('a#menuSalesDelivery', 30);
    await deliveryOrderMenu.click({ timeout: 3000 }).catch(async () => {
      const triggered = await this.triggerClickInAnyFrame('a#menuSalesDelivery');
      if (!triggered) throw new Error('Unable to click delivery order menu');
    });

    await expect
      .poll(
        () => {
          const bodyFrame = this.page.frame({ name: 'iframeBody' });
          return bodyFrame ? bodyFrame.url() : '';
        },
        { timeout: 20000 }
      )
      .toContain('SalesDelivery.php');
  }
}

module.exports = { DeliveryOrderMenuPage };
