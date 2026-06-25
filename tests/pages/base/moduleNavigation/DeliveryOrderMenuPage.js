// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../BasePage');

class DeliveryOrderMenuPage extends BasePage {
  async open() {
    const menuFrame = await this.findDeliveryMainTabFrame();
    const salesMainTab = menuFrame.locator('xpath=//*[@id="MainTab20.0"]/span/a');
    await salesMainTab.waitFor({ state: 'visible', timeout: 10000 });
    await salesMainTab.click();
    await this.page.waitForTimeout(500);

    const deliverySubtab = menuFrame.locator('xpath=//*[@id="subtab115.1"]');
    await deliverySubtab.waitFor({ state: 'visible', timeout: 10000 });
    await expect(deliverySubtab).toHaveText('Delivery', { timeout: 10000 });
    await deliverySubtab.hover();
    await this.page.waitForTimeout(500);

    const deliveryOrderMenu = menuFrame.locator('xpath=//*[@id="menuSalesDelivery"]');
    await deliveryOrderMenu.waitFor({ state: 'visible', timeout: 10000 });
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

    await this.clearDeliveryMenuHover();
  }

  async clearDeliveryMenuHover() {
    const viewport = this.page.viewportSize() || { width: 1280, height: 720 };
    await this.page.mouse.move(
      Math.max(viewport.width - 24, 24),
      Math.max(viewport.height - 24, 24)
    );
    await this.page.waitForTimeout(300);
  }

  async findDeliveryMainTabFrame() {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      for (const frame of this.page.frames()) {
        try {
          if (frame.isDetached()) continue;

          const hasSalesMainTab = await frame.evaluate(() =>
            Boolean(document.querySelector('[id="MainTab20.0"] span a'))
          );
          if (hasSalesMainTab) return frame;
        } catch (e) {
          continue;
        }
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error('Delivery main tab frame was not found.');
  }
}

module.exports = { DeliveryOrderMenuPage };
