const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class MainMenuPage extends BasePage {
  async openSalesOrder() {
    const salesTab = await this.findInAllFrames("a[onclick*=\"selectTab('SALES')\"]");
    await salesTab.click();

    const salesOrderSubtab = await this.findInAllFrames('a[id="subtab110.1"]');
    await salesOrderSubtab.hover();

    const salesOrderMenu = await this.findInAllFrames('a#menuSalesOrder');
    await salesOrderMenu.click();
  }

  async openCreditLimitChecking() {
    const salesMainTab = await this.findInAllFrames("a[onclick*=\"selectTab('SALES')\"]", 10);
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

  async openCreditLimitApproval() {
    const salesMainTab = await this.findInAllFrames("a[onclick*=\"selectTab('SALES')\"]", 10);
    await salesMainTab.click();

    const creditLimitSubTab = await this.findInAllFrames('a#subtab110.5', 6).catch(() => null);
    if (creditLimitSubTab) {
      await creditLimitSubTab.hover();
    }

    const creditLimitApprovalMenu = await this.findInAllFrames(
      'a#menuu_creditlimitapprovals',
      30
    );
    await creditLimitApprovalMenu.click({ timeout: 3000 }).catch(async () => {
      const triggered = await this.triggerClickInAnyFrame('a#menuu_creditlimitapprovals');
      if (!triggered) throw new Error('Unable to click credit limit approval menu');
    });

    await expect
      .poll(
        () => {
          const bodyFrame = this.page.frame({ name: 'iframeBody' });
          return bodyFrame ? bodyFrame.url() : '';
        },
        { timeout: 20000 }
      )
      .toContain('U_CREDITLIMITAPPROVALS');
  }

  async openDeliveryOrder() {
    const salesMainTab = await this.findInAllFrames("a[onclick*=\"selectTab('SALES')\"]", 10);
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

  async openTransactionApproval() {
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
        "a[onclick*=\"selectTab('ADMIN')\"]",
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

module.exports = { MainMenuPage };
