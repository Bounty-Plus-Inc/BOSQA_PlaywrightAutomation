// This is for shared page object behavior.
const { BasePage } = require('../BasePage');

class SalesOrderMenuPage extends BasePage {
  async open() {
    const menuFrame = await this.findSalesOrderMainTabFrame();
    const salesTab = menuFrame.locator('xpath=//*[@id="MainTab20.0"]/span/a');
    await salesTab.waitFor({ state: 'visible', timeout: 10000 });
    await salesTab.click();
    await this.page.waitForTimeout(500);

    const salesOrderSubtab = menuFrame.locator('xpath=//*[@id="subtab110.1"]');
    await salesOrderSubtab.waitFor({ state: 'visible', timeout: 10000 });
    const subtabText = ((await salesOrderSubtab.textContent()) || '').replace(/\s+/g, ' ').trim();
    if (subtabText !== 'Sales Order') {
      throw new Error(`Expected Sales Order subtab, but found "${subtabText || '(empty)'}".`);
    }
    await salesOrderSubtab.hover();
    await this.page.waitForTimeout(500);

    const salesOrderMenu = menuFrame.locator('xpath=//*[@id="menuSalesOrder"]');
    await salesOrderMenu.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);
    await salesOrderMenu.click({ timeout: 5000 });

    const loaded = await this.findInAllFrames('label#cf_bpcode[name="cf_bpcode"]', 20)
      .then(() => true)
      .catch(() => false);
    if (!loaded) {
      throw new Error('Unable to click Sales Order menu');
    }
  }

  async findSalesOrderMainTabFrame() {
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

    throw new Error('Sales Order main tab was not found.');
  }
}

module.exports = { SalesOrderMenuPage };
