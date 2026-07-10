const { BasePage } = require('../base/BasePage');

class ApprovalMatrixTitleCFL extends BasePage {
  async selectFirstRow() {
    const firstRow = await this.findInAllFrames(
      'xpath=//*[@id="col_U_APPROVALTITLETAB1T1"]',
      20
    );

      if (!firstRow) {
    throw new Error(
      'No Approval Matrix record was found in the Approval Matrix lookup.'
    );
  }
  

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

module.exports = { ApprovalMatrixTitleCFL };