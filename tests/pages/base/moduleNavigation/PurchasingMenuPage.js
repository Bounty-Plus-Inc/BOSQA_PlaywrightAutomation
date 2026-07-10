// This is for shared page object behavior.
const { BasePage } = require('../BasePage');

class PurchasingMenuPage extends BasePage {
async open() {
  const menuFrame = await this.findPurchasingMainTabFrame();

  const purchasingTab = menuFrame.locator(
    'xpath=//*[@id="MainTab40.0"]/span/a'
  );

  await purchasingTab.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  await purchasingTab.click();
  await this.page.waitForTimeout(500);

  const purchaseRequestSubtab = menuFrame.locator(
    'xpath=//*[@id="subtab105.0"]'
  );

  await purchaseRequestSubtab.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  const subtabText = (
    (await purchaseRequestSubtab.textContent()) || ''
  )
    .replace(/\s+/g, ' ')
    .trim();

  if (subtabText !== 'Purchase Request') {
    throw new Error(
      `Expected Purchase Request subtab, but found "${subtabText}".`
    );
  }

  await purchaseRequestSubtab.hover();
  await this.page.waitForTimeout(500);

  const purchaseRequestMenu = menuFrame.locator(
    'xpath=//*[@id="menuPurchaseRequest"]'
  );

    await purchaseRequestMenu.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);
    await purchaseRequestMenu.click({ timeout: 5000 });

  // Verify Purchase Request page loaded
 const loaded = await this.findInAllFrames('label#cf_bpcode[name="cf_bpcode"]', 20)
    .then(() => true)
    .catch(() => false);

  if (!loaded) {
    throw new Error('Unable to open Purchase Request.');
  }
}

  async findPurchasingMainTabFrame() {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      for (const frame of this.page.frames()) {
        try {
          if (frame.isDetached()) continue;

          const hasPurchasingMainTab = await frame.evaluate(() =>
            Boolean(document.querySelector('[id="MainTab40.0"] span a'))
          );

          if (hasPurchasingMainTab) {
            return frame;
          }
        } catch (e) {
          continue;
        }
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error('Purchasing main tab was not found.');
  }
}

module.exports = { PurchasingMenuPage };