const { BasePage } = require('../base/BasePage');

class BuyerCFL extends BasePage {
  async selectBuyer(buyerCode) {
    const filterInput = await this.findInAllFrames('#df_inputfilter', 20);

    await filterInput.fill(buyerCode);

    const filterButton = await this.findInAllFrames(
      'a.button[onclick*="Grid_Filter"]',
      20
    );

    await filterButton.click();

    const firstRow = await this.findInAllFrames(
      'xpath=/html/body/form/table[2]/tbody/tr/td[2]/table/tbody/tr[4]/td/div/div[2]/table/tbody/tr[1]/td[1]',
      20
    );

    await firstRow.click();

    const okButton = await this.findInAllFrames(
      'a.button[onclick*="editTableRow"]',
      20
    );

    const closePromise = this.page.waitForEvent('close').catch(() => {});

    await okButton.click();

    await closePromise;
  }
}

module.exports = { BuyerCFL };