// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../BasePage');

class CreditLimitCheckingMenuPage extends BasePage {
  async open() {
    const salesMainTab = await this.findInAllFrames('a[onclick*="selectTab(\'SALES\')"]', 10);
    await salesMainTab.click();

    const creditLimitSubTab = await this.findInAllFrames('a#subtab110.5', 6).catch(() => null);
    if (creditLimitSubTab) {
      await creditLimitSubTab.hover();
    }

    const creditLimitMenu = await this.findInAllFrames('a#menuu_creditlimitchecking', 30);
    await creditLimitMenu.click({ timeout: 3000 }).catch(async () => {
      const triggered = await this.triggerClickInAnyFrame('a#menuu_creditlimitchecking');
      if (!triggered) throw new Error('Unable to click credit limit menu');
    });

    await expect
      .poll(
        () => {
          const bodyFrame = this.page.frame({ name: 'iframeBody' });
          return bodyFrame ? bodyFrame.url() : '';
        },
        { timeout: 20000 }
      )
      .toContain('U_CREDITLIMITCHECKING');
  }
}

module.exports = { CreditLimitCheckingMenuPage };
