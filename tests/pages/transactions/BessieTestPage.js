// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');

class BessieTestPage extends BasePage {
  async expectLoaded() {
    await expect
      .poll(
        async () => {
          const bodyFrame = this.page.frame({ name: 'iframeBody' });
          return bodyFrame ? bodyFrame.url() : this.page.url();
        },
        { timeout: 20000 }
      )
      .not.toBe('');
  }
}

module.exports = { BessieTestPage };
