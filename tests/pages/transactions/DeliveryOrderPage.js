// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');
// This is for selecting a business partner from the CFL popup.
const { BusinessPartnerCFL } = require('../popups/BusinessPartnerCFL');
// This is for shared Copy From popup behavior.
const { CopyFrom } = require('../popups/CopyFrom');

class DeliveryOrderPage extends BasePage {
  async expectLoaded() {
    await expect
      .poll(
        () => {
          const bodyFrame = this.page.frame({ name: 'iframeBody' });
          return bodyFrame ? bodyFrame.url() : '';
        },
        { timeout: 20000 }
      )
      .toContain('SalesDelivery.php');

    const deliveryHeader = await this.findInAllFrames(
      'xpath=/html/body/form[1]/table[2]/tbody/tr/td[2]/table/tbody/tr/td/table/tbody/tr[2]/td/table/tbody/tr/td[1]',
      20
    );
    await expect(deliveryHeader).toHaveText(/\s*Delivery\s*/i, { timeout: 10000 });
    await this.clearNavigationHover();
  }

  async clearNavigationHover() {
    const viewport = this.page.viewportSize() || { width: 1280, height: 720 };
    await this.page.mouse.move(
      Math.max(viewport.width - 24, 24),
      Math.max(viewport.height - 24, 24)
    );
    await this.page.waitForTimeout(300);
  }

  async getDeliveryFrame() {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const bodyFrame = this.page.frame({ name: 'iframeBody' });
      if (bodyFrame && bodyFrame.url().includes('SalesDelivery.php')) {
        return bodyFrame;
      }

      await this.page.waitForTimeout(250);
    }

    throw new Error('Sales Delivery iframe was not found.');
  }

  async runAndWaitForPopup(action, timeout = 8000) {
    const popupPromise = Promise.race([
      this.page.waitForEvent('popup', { timeout }).catch(() => null),
      this.page.context().waitForEvent('page', { timeout }).catch(() => null)
    ]);
    await action().catch(() => {});
    return popupPromise;
  }

  async readBpCflDiagnostics(frame) {
    return frame.evaluate(() => {
      const cfl = document.getElementById('cfl_bpcode');
      if (!cfl) {
        return {
          found: false,
          frameUrl: window.location.href,
          title: document.title || ''
        };
      }

      const rect = cfl.getBoundingClientRect();
      const topElement = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );

      return {
        found: true,
        frameUrl: window.location.href,
        title: document.title || '',
        outerHTML: cfl.outerHTML,
        onclick: cfl.getAttribute('onclick') || '',
        visible: rect.width > 0 && rect.height > 0,
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        topElement: topElement
          ? {
              id: topElement.id || '',
              tagName: topElement.tagName || '',
              outerHTML: String(topElement.outerHTML || '').slice(0, 300)
            }
          : null
      };
    });
  }

  async expectCopyFromVisible() {
    const copyFromButton = await this.findInAllFrames('a#btnCopyFrom[name="btnCopyFrom"]', 20);
    await expect(copyFromButton).toBeVisible({ timeout: 10000 });
    return copyFromButton;
  }

  async selectBusinessPartnerFromCfl(bpCode, options = {}) {
    if (!String(bpCode || '').trim()) {
      throw new Error('Delivery Order BP Code is required.');
    }

    await this.clearNavigationHover();
    const deliveryFrame = await this.getDeliveryFrame();
    const cflButton = deliveryFrame
      .locator('img#cfl_bpcode[onclick*="OpenCFLbusinesspartners"]')
      .first();
    await cflButton.waitFor({ state: 'visible', timeout: 10000 });
    await cflButton.scrollIntoViewIfNeeded().catch(() => {});

    let bpCFLPage = await this.runAndWaitForPopup(async () => {
      await cflButton.click({ timeout: 8000 });
    });

    if (!bpCFLPage) {
      bpCFLPage = await this.runAndWaitForPopup(async () => {
        await cflButton.click({ force: true, timeout: 8000 });
      });
    }

    if (!bpCFLPage) {
      bpCFLPage = await this.runAndWaitForPopup(async () => {
        const box = await cflButton.boundingBox();
        if (!box) return;
        await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      });
    }

    if (!bpCFLPage) {
      bpCFLPage = await this.runAndWaitForPopup(async () => {
        await deliveryFrame.evaluate(() => {
          const cfl = document.getElementById('cfl_bpcode');
          if (!cfl) return false;
          cfl.click();
          return true;
        });
      });
    }

    if (!bpCFLPage) {
      bpCFLPage = await this.runAndWaitForPopup(async () => {
        await deliveryFrame.evaluate(() => {
          if (typeof window.OpenCFLbusinesspartners === 'function') {
            window.OpenCFLbusinesspartners('df_bpcode');
            return true;
          }

          if (typeof window.OpenCFLfs === 'function') {
            window.OpenCFLfs('df_bpcode');
            return true;
          }

          return false;
        });
      });
    }

    if (!bpCFLPage) {
      const diagnostics = await this.readBpCflDiagnostics(deliveryFrame).catch((error) => ({
        diagnosticsError: String(error?.message || error)
      }));
      throw new Error(
        `Delivery Order BP CFL did not open after clicking cfl_bpcode. Diagnostics: ${JSON.stringify(diagnostics)}`
      );
    }

    await bpCFLPage.waitForLoadState('domcontentloaded').catch(() => {});
    const bpCFL = new BusinessPartnerCFL(bpCFLPage);
    if (options.beforeSelect) {
      await options.beforeSelect(bpCFLPage);
    }

    const selectedCode = await bpCFL.selectCustomerCode(bpCode);
    const bpCodeInput = await this.findInAllFrames('input#df_bpcode[name="df_bpcode"], input#df_bpcode', 20);
    await expect(bpCodeInput).toHaveValue(selectedCode, { timeout: 5000 });
    return selectedCode;
  }

  async openCopyFromPopup({ menuSelector = 'a[onclick*="popupCopyDocumentFromSalesOrders"]' } = {}) {
    const copyFromButton = await this.expectCopyFromVisible();
    await copyFromButton.click();

    const copyFromMenu = await this.findInAllFrames(menuSelector, 20);
    await copyFromMenu.hover().catch(() => {});

    const popupPromise = this.page.context().waitForEvent('page', { timeout: 15000 });
    await copyFromMenu.click();

    const popupPage = await popupPromise;
    const copyFrom = new CopyFrom(popupPage);
    await copyFrom.expectLoaded();
    return copyFrom;
  }

  async copyFromSalesOrder({ bpCode, salesOrderDocNo, hooks = {} } = {}) {
    if (!String(salesOrderDocNo || '').trim()) {
      throw new Error('Delivery Order Copy From requires a Sales Order document number.');
    }

    const selectedBpCode = await this.selectBusinessPartnerFromCfl(bpCode, {
      beforeSelect: hooks.beforeSelectBp
    });

    if (hooks.afterBpSelected) {
      await hooks.afterBpSelected(selectedBpCode);
    }

    const copyFrom = await this.openCopyFromPopup();
    if (hooks.afterCopyFromOpened) {
      await hooks.afterCopyFromOpened(copyFrom);
    }

    const selectedHeader = await copyFrom.selectHeaderRow({
      docNo: salesOrderDocNo,
      tableId: 'T1'
    });
    if (hooks.afterHeaderSelected) {
      await hooks.afterHeaderSelected(selectedHeader, copyFrom);
    }

    await copyFrom.clickChoose();
    await copyFrom.expectItemsLoaded({ tableId: 'T2' });
    if (hooks.afterItemsLoaded) {
      await hooks.afterItemsLoaded(copyFrom);
    }

    await copyFrom.selectFirstItem({ tableId: 'T2' });
    if (hooks.afterItemSelected) {
      await hooks.afterItemSelected(copyFrom);
    }

    const closePromise = copyFrom.page.waitForEvent('close', { timeout: 15000 }).catch(() => {});
    await copyFrom.clickFinish();
    await closePromise;
    await this.expectFirstLineItemCodeFilled();

    if (hooks.afterFinished) {
      await hooks.afterFinished(selectedHeader, copyFrom);
    }

    return {
      bpCode: selectedBpCode,
      sourceDocNo: selectedHeader.docNo || salesOrderDocNo || '',
      sourceRowNumber: selectedHeader.rowNumber
    };
  }

  async expectFirstLineItemCodeFilled() {
    await expect
      .poll(
        async () => {
          const itemCodeInput = await this.findInAllFrames(
            'input#df_itemcodeT1r1[name="df_itemcodeT1r1"], input#df_itemcodeT1[name="df_itemcodeT1"], input#df_itemcodeT1',
            3
          ).catch(() => null);
          return itemCodeInput ? itemCodeInput.inputValue().catch(() => '') : '';
        },
        { timeout: 20000 }
      )
      .not.toBe('');
  }
}

module.exports = { DeliveryOrderPage };
