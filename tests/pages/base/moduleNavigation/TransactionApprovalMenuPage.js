// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../BasePage');

class TransactionApprovalMenuPage extends BasePage {
  async open() {
    const transactionApprovalSelector =
      'a#menuu_transactionalapprovals[href*="U_TRANSACTIONALAPPROVALS"]';
    const approvalSubTabSelector = 'a[id="subtab510.0"]';
    let approvalSubTabWasVisible = false;

    const hoverApprovalAndClickTransactionApproval = async () => {
      const approvalSubTab = await this.findVisibleInAllFrames(approvalSubTabSelector, 20);
      approvalSubTabWasVisible = true;
      await approvalSubTab.hover();
      await this.page.waitForTimeout(350);
      const transactionApprovalMenu = await this.findVisibleInAllFrames(
        transactionApprovalSelector,
        20
      );
      await transactionApprovalMenu.click({ timeout: 5000 });
    };

    await hoverApprovalAndClickTransactionApproval().catch(async () => {
      if (approvalSubTabWasVisible) {
        await hoverApprovalAndClickTransactionApproval();
        return;
      }

      const adminMainTab = await this.findVisibleInAllFrames(
        'a[onclick*="selectTab(\'ADMIN\')"]',
        10
      );
      await adminMainTab.click();
      await this.page.waitForTimeout(500);
      await hoverApprovalAndClickTransactionApproval();
    });

    await expect
      .poll(
        () => {
          const bodyFrame = this.page.frame({ name: 'iframeBody' });
          return bodyFrame ? bodyFrame.url() : '';
        },
        { timeout: 20000 }
      )
      .toContain('U_TRANSACTIONALAPPROVALS');
  }
}

module.exports = { TransactionApprovalMenuPage };
