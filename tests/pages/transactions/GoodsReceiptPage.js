// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');
const { selectFromCfl } = require('../../helpers/cflHelper');

class GoodsReceiptPage extends BasePage {
  async expectLoaded() {
    await expect
      .poll(
        async () => {
          const bodyFrame = this.page.frame({ name: 'iframeBody' });
          return bodyFrame ? bodyFrame.url() : this.page.url();
        },
        { timeout: 20000 }
      )
      .toContain('GoodsReceipt');
  }
  // async inputItemCode(itemCode) {
  //   const itemCodeInput = await this.findInAllFrames(
  //     'input#df_itemcodeT1[name="df_itemcodeT1"], input#df_itemcodeT1'
  //   );

  //   const popupPromise = this.page.context().waitForEvent('page', {
  //     timeout: 15000
  //   });

  //   await (await this.findInAllFrames('#cfl_itemcodeT1')).click();

  //   const cflPage = await popupPromise;
  //   await cflPage.waitForLoadState('domcontentloaded');

  //   const filterInput = cflPage.locator('#df_inputfilter');

  //   await filterInput.fill(itemCode);
  //   await filterInput.press('Enter');

  //   // Wait for result row
  //   await cflPage.locator('tr.tableBoxSelectedRow').waitFor({
  //     state: 'visible',
  //     timeout: 10000
  //   });

  //   // Click OK and wait for CFL popup to close
  //   await Promise.all([
  //     cflPage.waitForEvent('close').catch(() => { }),
  //     cflPage.getByRole('link', { name: 'OK' }).click()
  //   ]);

  //   // Verify item code was returned to the main page
  //   await expect
  //     .poll(
  //       async () => await itemCodeInput.inputValue(),
  //       { timeout: 15000 }
  //     )
  //     .toBe(itemCode);
  // }

  async inputItemCode(itemCode) {
    await selectFromCfl(this, {
      value: itemCode,
      inputSelector: '#df_itemcodeT1',
      cflSelector: '#cfl_itemcodeT1'
    });
  }






}

module.exports = { GoodsReceiptPage };
