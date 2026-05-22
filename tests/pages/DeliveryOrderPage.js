const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

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
  }

  async expectCopyFromVisible() {
    const copyFromButton = await this.findInAllFrames('a#btnCopyFrom[name="btnCopyFrom"]', 20);
    await expect(copyFromButton).toBeVisible({ timeout: 10000 });
    return copyFromButton;
  }

  async fillBusinessPartner(bpCode) {
    const bpCodeInput = await this.findInAllFrames('input#df_bpcode[name="df_bpcode"]', 20);
    await bpCodeInput.fill(bpCode);
    await expect(bpCodeInput).toHaveValue(bpCode);
  }

  async openCopyFromSalesOrdersPopup(bpCode, beforeOpen) {
    const copyFromButton = await this.expectCopyFromVisible();
    await this.fillBusinessPartner(bpCode);
    if (beforeOpen) {
      await beforeOpen();
    }

    await copyFromButton.click();
    const salesOrdersMenu = await this.findInAllFrames(
      'a[onclick*="popupCopyDocumentFromSalesOrders"]',
      20
    );
    await salesOrdersMenu.hover().catch(() => {});

    const popupPromise = this.page.context().waitForEvent('page', { timeout: 15000 });
    await salesOrdersMenu.click();
    const salesOrdersPopup = await popupPromise;
    await salesOrdersPopup.waitForLoadState('domcontentloaded');
    return salesOrdersPopup;
  }

  async copySalesOrderFromPopup(salesOrdersPopup, salesOrderDocNo, hooks = {}) {
    const popup = new BasePage(salesOrdersPopup);
    const chooseButton = await this.expectChooseVisible(popup);
    const selectedHeader = await this.selectSalesOrderHeader(popup, salesOrderDocNo);

    if (hooks.afterHeaderSelected) {
      await hooks.afterHeaderSelected(selectedHeader);
    }

    await chooseButton.click();
    await this.expectCopiedItemsVisible(popup, selectedHeader.docNo);

    if (hooks.afterItemsLoaded) {
      await hooks.afterItemsLoaded(selectedHeader);
    }

    await this.selectCopiedItems(popup);

    if (hooks.beforeFinish) {
      await hooks.beforeFinish(selectedHeader);
    }

    const finishButton = await popup.findInAllFrames('a.button[onclick*="selectDocItems"]', 20);
    await finishButton.click();
    await salesOrdersPopup.waitForEvent('close', { timeout: 15000 }).catch(() => {});
    await this.expectFirstLineItemCodeFilled();
    return selectedHeader;
  }

  async expectChooseVisible(popup) {
    const chooseButton = await popup
      .findInAllFrames('a.button[href="javascript:selectHeaders()"]', 10)
      .catch(() => popup.findInAllFrames('a.button:has-text("Choose")', 10));
    await expect(chooseButton).toBeVisible({ timeout: 10000 });
    return chooseButton;
  }

  async selectSalesOrderHeader(popup, salesOrderDocNo) {
    const row = await this.findSalesOrderHeaderRow(popup.page, salesOrderDocNo);
    const checkbox = await popup.findInAllFrames(`#df_checkedT1r${row.rowNumber}`, 10);
    await checkbox.scrollIntoViewIfNeeded().catch(() => {});
    await checkbox.check({ force: true }).catch(async () => {
      await checkbox.click({ force: true });
    });
    await expect(checkbox).toBeChecked();
    return row;
  }

  async findSalesOrderHeaderRow(popupPage, salesOrderDocNo) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      for (const frame of popupPage.frames()) {
        try {
          if (frame.isDetached()) continue;

          const row = await frame.evaluate((docNo) => {
            const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
            const rowFromId = (value) => {
              const match = String(value || '').match(/T1r(\d+)/i);
              return match ? match[1] : '';
            };

            const findRowByDocNo = () => {
              if (!docNo) return null;
              const elements = Array.from(document.querySelectorAll('input, label, td'));
              for (const element of elements) {
                const value = normalize(element.value || element.textContent || element.innerText);
                if (value !== docNo) continue;

                let current = element;
                while (current) {
                  const source = [
                    current.id,
                    current.getAttribute?.('name'),
                    current.getAttribute?.('onclick'),
                    current.getAttribute?.('for')
                  ]
                    .filter(Boolean)
                    .join(' ');
                  const rowNumber = rowFromId(source);
                  if (rowNumber && document.getElementById(`df_checkedT1r${rowNumber}`)) {
                    return rowNumber;
                  }
                  current = current.parentElement;
                }
              }
              return null;
            };

            const rowNumber =
              findRowByDocNo() ||
              rowFromId(document.querySelector('input[id^="df_checkedT1r"]')?.id);

            if (!rowNumber) return null;

            const hiddenDocNo =
              document.getElementById(`sf_keysT1r${rowNumber}`)?.value ||
              document.getElementById(`df_u_sodocnoT1r${rowNumber}`)?.value ||
              '';

            return {
              rowNumber,
              docNo: hiddenDocNo || docNo || ''
            };
          }, salesOrderDocNo || '');

          if (row) return row;
        } catch (e) {
          continue;
        }
      }
      await popupPage.waitForTimeout(500);
    }

    throw new Error(`Sales Order row not found in Delivery copy popup: ${salesOrderDocNo || '(first row)'}`);
  }

  async expectCopiedItemsVisible(popup, salesOrderDocNo) {
    const itemTable = await popup.findInAllFrames('div#divT2 table#T2', 20);
    await expect(itemTable).toBeVisible({ timeout: 10000 });

    await expect
      .poll(
        async () => {
          const firstDocNo = await popup
            .findInAllFrames('input#df_docnoT2r1[name="df_docnoT2r1"]', 3)
            .then((locator) => locator.inputValue())
            .catch(() => '');
          return firstDocNo;
        },
        { timeout: 15000 }
      )
      .not.toBe('');

    if (salesOrderDocNo) {
      const copiedDocNo = await popup
        .findInAllFrames('input#df_docnoT2r1[name="df_docnoT2r1"]', 3)
        .then((locator) => locator.inputValue())
        .catch(() => '');
      expect(copiedDocNo).toBe(salesOrderDocNo);
    }
  }

  async selectCopiedItems(popup) {
    const itemCheckbox = await popup
      .findInAllFrames('input#df_checkedT2', 5)
      .catch(() => popup.findInAllFrames('input#df_checkedT2r1', 10));
    await itemCheckbox.scrollIntoViewIfNeeded().catch(() => {});
    await itemCheckbox.check({ force: true }).catch(async () => {
      await itemCheckbox.click({ force: true });
    });
    await expect(itemCheckbox).toBeChecked();
  }

  async expectFirstLineItemCodeFilled() {
    await expect
      .poll(
        async () => {
          const itemCodeInput = await this.findInAllFrames(
            'input#df_itemcodeT1r1[name="df_itemcodeT1r1"]',
            3
          ).catch(() => null);
          return itemCodeInput ? itemCodeInput.inputValue().catch(() => '') : '';
        },
        { timeout: 20000 }
      )
      .not.toBe('');
  }

  async selectDocumentSeries(seriesLabel = 'Primary') {
    const docSeries = await this.findInAllFrames('select#df_docseries[name="df_docseries"]', 20);
    await docSeries.selectOption({ label: seriesLabel });
    await expect(docSeries).toHaveValue(/.+/);
  }

  async openGeneralUdfTab() {
    const generalUdfTab = await this.findInAllFrames('a#tab1nav5[title="General (UDF)"]', 20);
    await generalUdfTab.click();
    await this.findInAllFrames('img#cfl_u_invdeldate', 20);
  }

  async selectInvoiceDeliveryDateToday() {
    await this.openGeneralUdfTab();

    const calendarButton = await this.findInAllFrames('img#cfl_u_invdeldate', 20);
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null);
    await calendarButton.click();
    const calendarPopup = await popupPromise;

    if (calendarPopup) {
      await calendarPopup.waitForLoadState('domcontentloaded').catch(() => {});
      const calendar = new BasePage(calendarPopup);
      const todayButton = await calendar.findInAllFrames('a.cpTodayText', 20);
      await todayButton.click();
      await calendarPopup.waitForEvent('close', { timeout: 5000 }).catch(() => {});
    } else {
      const todayButton = await this.findInAllFrames('a.cpTodayText', 20);
      await todayButton.click();
    }

    await expect
      .poll(
        async () => {
          const deliveryDate = await this.findInAllFrames(
            'input#df_u_invdeldate[name="df_u_invdeldate"]',
            3
          ).catch(() => null);
          return deliveryDate ? deliveryDate.inputValue().catch(() => '') : '';
        },
        { timeout: 10000 }
      )
      .not.toBe('');
  }

  async openLogisticsTab() {
    const logisticsTab = await this.findInAllFrames('a#tab1nav2[title="Logistics"]', 20);
    await logisticsTab.click();
    await this.findInAllFrames('select#df_shiptocode[name="df_shiptocode"]', 20);
  }

  async selectShipToCode(shipToCode = 'SHIP TO') {
    await this.openLogisticsTab();
    const shipToSelect = await this.findInAllFrames('select#df_shiptocode[name="df_shiptocode"]', 20);
    await shipToSelect.selectOption({ label: shipToCode });
    await expect(shipToSelect).toHaveValue(shipToCode);
    await this.expectShipToAddressFilled();
  }

  async selectShipType(shipType = 'DELIVERY') {
    const shipTypeSelect = await this.findInAllFrames('select#df_shiptype[name="df_shiptype"]', 20);
    await shipTypeSelect.selectOption({ label: shipType });
    await expect(shipTypeSelect).toHaveValue(shipType);
  }

  async selectTruckerCode(truckerCode = '000') {
    await this.openGeneralUdfTab();
    await this.selectLookupFirstRow({
      triggerSelector: 'img#cfl_u_truckercode',
      outputSelector: 'input#df_u_truckercode[name="df_u_truckercode"]',
      expectedValue: truckerCode
    });
  }

  async selectPlateNumber() {
    await this.openGeneralUdfTab();
    await this.selectLookupFirstRow({
      triggerSelector: 'img#cfl_u_plateno',
      outputSelector: 'input#df_u_plateno[name="df_u_plateno"]'
    });
  }

  async selectLookupFirstRow({ triggerSelector, outputSelector, expectedValue }) {
    const trigger = await this.findInAllFrames(triggerSelector, 20);
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 8000 }).catch(() => null);
    await trigger.click();
    const lookupPopup = await popupPromise;
    const lookupPage = lookupPopup ? new BasePage(lookupPopup) : this;

    if (lookupPopup) {
      await lookupPopup.waitForLoadState('domcontentloaded').catch(() => {});
    }

    await this.doubleClickFirstLookupRow(lookupPage);

    if (lookupPopup) {
      await lookupPopup.waitForEvent('close', { timeout: 8000 }).catch(() => {});
    }

    const selectedValue = expect.poll(
      async () => {
        const output = await this.findInAllFrames(outputSelector, 3).catch(() => null);
        return output ? output.inputValue().catch(() => '') : '';
      },
      { timeout: 15000 }
    );

    if (expectedValue) {
      await selectedValue.toBe(expectedValue);
    } else {
      await selectedValue.not.toBe('');
    }
  }

  async doubleClickFirstLookupRow(lookupPage) {
    const firstRow = await lookupPage
      .findInAllFrames('table#T1 tr, #dd_codeT1r1, input#df_codeT1r1', 20)
      .catch(() => null);

    if (firstRow) {
      const didDoubleClick = await firstRow
        .dblclick({ force: true })
        .then(() => true)
        .catch(() => false);
      if (didDoubleClick) return;
    }

    for (const frame of lookupPage.page.frames()) {
      try {
        if (frame.isDetached()) continue;
        const didDispatch = await frame.evaluate(() => {
          const target =
            document.querySelector('#dd_codeT1r1') ||
            document.querySelector('input#df_codeT1r1') ||
            document.querySelector('table#T1 tr') ||
            document.querySelector('tr');

          if (!target) return false;
          const row = target.closest('tr') || target;
          row.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
          return true;
        });
        if (didDispatch) return;
      } catch (e) {
        continue;
      }
    }

    throw new Error('Lookup first row was not found for double click');
  }

  async saveAsDraft() {
    const saveAsDraftButton = await this.findInAllFrames(
      'a#btnSaveAsDraft[name="btnSaveAsDraft"]',
      20
    );
    await saveAsDraftButton.click();
    await this.page.waitForTimeout(1000);
    await this.expectLoaded();
    await expect.poll(async () => this.readStatus(), { timeout: 20000 }).toContain('D|Draft');
    return this.readDocumentNo();
  }

  async readStatus() {
    const docStatus = await this.findInAllFrames('select#df_docstatus[name="df_docstatus"]', 20);
    const value = await docStatus.inputValue().catch(() => '');
    const label = await docStatus.locator('option:checked').textContent().catch(() => '');
    return `${value}|${(label || '').trim()}`;
  }

  async readDocumentNo() {
    const docNo = await this.findInAllFrames('input#df_docno[name="df_docno"]', 20);
    return docNo.inputValue();
  }

  async expectShipToAddressFilled() {
    await expect
      .poll(
        async () => {
          const shipToAddress = await this.findInAllFrames(
            'textarea#df_shiptoaddress[name="df_shiptoaddress"]',
            3
          ).catch(() => null);
          return shipToAddress ? shipToAddress.inputValue().catch(() => '') : '';
        },
        { timeout: 10000 }
      )
      .not.toBe('');
  }
}

module.exports = { DeliveryOrderPage };
