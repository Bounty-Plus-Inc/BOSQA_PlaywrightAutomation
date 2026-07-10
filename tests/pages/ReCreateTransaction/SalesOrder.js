// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for the base Sales Order transaction page actions.
const { SalesOrderPage } = require('../transactions/SalesOrderPage');
// This is for selecting a profit center from the CFL popup.
const { ProfitCenterCFL } = require('../popups/ProfitCenterCFL');
// This is for selecting a warehouse from the CFL popup.
const { WarehouseCFL } = require('../popups/WarehouseCFL');

class SalesOrder extends SalesOrderPage {
  async recreateFromCapturedData(capturedData, hooks = {}) {
    const bpCode = String(capturedData?.bpCode || '').trim();
    const bpRefNo = String(capturedData?.bpRefNo || '').trim();
    const headerFields = {
      shipToCode: String(capturedData?.shipToCode || '').trim(),
      shipToAddress: String(capturedData?.shipToAddress || '').replace(/\s+/g, ' ').trim(),
      shipType: String(capturedData?.shipType || '').trim(),
      salesOrg: String(capturedData?.salesOrg || '').trim(),
      distributionChannel: String(capturedData?.distributionChannel || '').trim(),
      division: String(capturedData?.division || '').trim(),
      businessCenter: String(capturedData?.businessCenter || '').trim()
    };
    const lineItems = [...(capturedData?.lineItems || [])]
      .filter((lineItem) => String(lineItem.itemCode || '').trim())
      .sort((a, b) => Number(a.row || 0) - Number(b.row || 0));

    if (!bpCode) {
      throw new Error('Unable to recreate Sales Order because captured bpCode is empty.');
    }

    if (!lineItems.length) {
      throw new Error('Unable to recreate Sales Order because no captured line items have itemCode.');
    }

    const reportValidation = async (testScript, expectedValue, actualValue) => {
      if (hooks.afterValidation) {
        await hooks.afterValidation({
          testScript,
          expectedValue,
          actualValue
        });
      }
    };

    await this.selectInitialCustomerFromLookup(bpCode);
    const bpCodeInput = await this.findInAllFrames('input#df_bpcode[name="df_bpcode"], input#df_bpcode');
    const actualBpCode = this.normalizeComparableText(await bpCodeInput.inputValue().catch(() => ''));
    await reportValidation('Sales Order BP Code', bpCode, actualBpCode);

    if (bpRefNo) {
      const bpRefNoResult = await this.fillBpRefNo(bpRefNo);
      await reportValidation(
        'Sales Order BP Ref No',
        bpRefNoResult.expectedValue,
        bpRefNoResult.actualValue
      );
    }

    await this.recreateShipToHeaderFields(headerFields);

    for (const [index, lineItem] of lineItems.entries()) {
      await this.recreateLineItem(
        {
          ...lineItem,
          businessCenter:
            this.readCapturedLineValue(lineItem, 'businessCenter', 'uBusinessCenter', 'u_business_center') ||
            headerFields.businessCenter
        },
        hooks,
        index + 1
      );
    }

    await this.recreateUdfHeaderDropdowns(headerFields, reportValidation);
  }

  async fillBpRefNo(bpRefNo) {
    const bpRefNoInput = await this.findInAllFrames(
      'input#df_bprefno[name="df_bprefno"], input#df_bprefno',
      20
    );
    await bpRefNoInput.fill(bpRefNo || '');
    await expect(bpRefNoInput).toHaveValue(bpRefNo || '', { timeout: 3000 });
    return {
      expectedValue: bpRefNo || '',
      actualValue: this.normalizeComparableText(await bpRefNoInput.inputValue().catch(() => ''))
    };
  }

  async recreateShipToHeaderFields(headerFields) {
    const headerValidations = [
      {
        label: 'Ship To Code',
        selector:
          'select#df_shiptocode[name="df_shiptocode"], input#df_shiptocode[name="df_shiptocode"], #df_shiptocode',
        value: headerFields.shipToCode
      },
      {
        label: 'Ship To Address',
        selector:
          'textarea#df_shiptoaddress[name="df_shiptoaddress"], input#df_shiptoaddress[name="df_shiptoaddress"], #df_shiptoaddress',
        value: headerFields.shipToAddress
      },
      {
        label: 'Ship Type',
        selector:
          'select#df_shiptype[name="df_shiptype"], input#df_shiptype[name="df_shiptype"], #df_shiptype',
        value: headerFields.shipType
      }
    ];

    for (const validation of headerValidations) {
      if (!validation.value) continue;

      await this.setAndValidateHeaderField(
        validation.selector,
        validation.value,
        validation.label
      );
    }
  }

  async recreateUdfHeaderDropdowns(headerFields, reportValidation) {
    await (await this.findInAllFrames('#tab1nav5', 20)).click();

    const headerValidations = [
      {
        label: 'Sales Org',
        selector:
          'select#df_u_sales_org[name="df_u_sales_org"], select#df_u_sales_org',
        value: headerFields.salesOrg
      },
      {
        label: 'Distribution Channel',
        selector:
          'select#df_u_distribution_channel[name="df_u_distribution_channel"], select#df_u_distribution_channel',
        value: headerFields.distributionChannel
      },
      {
        label: 'Division',
        selector:
          'select#df_u_division[name="df_u_division"], select#df_u_division',
        value: headerFields.division
      },
      {
        label: 'Business Center',
        selector:
          'select#df_u_business_center[name="df_u_business_center"], select#df_u_business_center',
        value: headerFields.businessCenter
      }
    ];

    for (const validation of headerValidations) {
      if (!validation.value) continue;

      const result = await this.setAndValidateHeaderField(
        validation.selector,
        validation.value,
        validation.label
      );

      await reportValidation(
        `Sales Order Header ${validation.label}`,
        result.expectedValue,
        result.actualValue
      );
    }
  }

  async recreateLineItem(lineItem, hooks = {}, targetRowNumber = Number(lineItem.row || 0) || 1) {
    const itemCode = String(lineItem.itemCode || '').trim();
    const itemDesc = this.normalizeComparableText(lineItem.itemDesc);
    const unitPrice = this.readCapturedLineValue(lineItem, 'unitPrice', 'unitprice');
    const uQuantity1 = this.readCapturedLineValue(lineItem, 'uQuantity1', 'u_quantity1');
    const uQuantity2 = this.readCapturedLineValue(lineItem, 'uQuantity2', 'u_quantity2');
    const warehouseCode = this.readCapturedLineValue(lineItem, 'warehouseCode', 'whscode');
    const warehouseName = this.readCapturedLineValue(
      lineItem,
      'uWarehousename',
      'u_warehousename'
    );
    const profitCenterCode = this.readCapturedLineValue(lineItem, 'drcode');
    const profitCenterName = this.readCapturedLineValue(
      lineItem,
      'uProfitcentername',
      'u_profitcentername'
    );
    const businessCenter = this.readCapturedLineValue(
      lineItem,
      'businessCenter',
      'uBusinessCenter',
      'u_business_center'
    );

    if (!itemCode) {
      throw new Error(`Unable to recreate row ${lineItem.row || '(unknown)'} because itemCode is empty.`);
    }

    if (!itemDesc) {
      throw new Error(`Unable to recreate row ${lineItem.row || '(unknown)'} because itemDesc is empty.`);
    }

    const reportValidation = async (testScript, expectedValue, actualValue) => {
      if (hooks.afterValidation) {
        await hooks.afterValidation({
          lineItem: { ...lineItem, row: targetRowNumber },
          testScript,
          expectedValue,
          actualValue
        });
      }
    };

    await this.selectLineItemCode(itemCode);

    await this.expectLineInputValue(
      'input#df_itemdescT1[name="df_itemdescT1"], input#df_itemdescT1',
      itemDesc,
      'itemDesc'
    );

    await this.fillAndValidateLineInput(
      'input#df_unitpriceT1[name="df_unitpriceT1"], input#df_unitpriceT1',
      unitPrice,
      'unitPrice',
      { numeric: true }
    );

    const quantityResult = await this.recreateLineQuantities({
      uQuantity1,
      uQuantity2
    });

    await this.selectAndValidateWarehouse({
      warehouseCode,
      warehouseName,
      rowNumber: targetRowNumber
    });

    await this.selectAndValidateProfitCenter({
      profitCenterCode,
      profitCenterName
    });

    await this.selectAndValidateLineSelect(
      'select#df_u_business_centerT1[name="df_u_business_centerT1"], select#df_u_business_centerT1',
      businessCenter,
      'businessCenter'
    );

    await (await this.findInAllFrames('#T1_btnUpdate', 20)).click();
    await this.expectPersistedLineItem({
      rowNumber: targetRowNumber,
      values: {
        itemCode,
        itemDesc,
        unitPrice,
        uQuantity1,
        uQuantity2,
        validateUQuantity1: quantityResult.validateUQuantity1,
        warehouseCode,
        warehouseName,
        profitCenterCode,
        profitCenterName,
        businessCenter
      },
      reportValidation
    });
    await this.waitForItemEntryReady();
  }

  async selectLineItemCode(itemCode) {
    await this.selectItemCodeWithRetry(itemCode, {
      readyTimeout: 2500,
      fallbackReadyTimeout: 10000
    });
  }

  readCapturedLineValue(lineItem, ...keys) {
    for (const key of keys) {
      const value = lineItem?.[key] ?? lineItem?.values?.[key];
      const normalizedValue = this.normalizeComparableText(value);
      if (normalizedValue) return normalizedValue;
    }

    return '';
  }

  normalizeComparableText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  parseComparableNumber(value) {
    const normalized = this.normalizeComparableText(value).replace(/,/g, '');
    if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  valuesAreEquivalent(expectedValue, actualValue, options = {}) {
    const expectedText = this.normalizeComparableText(expectedValue);
    const actualText = this.normalizeComparableText(actualValue);
    if (actualText === expectedText) return true;

    if (!options.numeric) return false;

    const expectedNumber = this.parseComparableNumber(expectedText);
    const actualNumber = this.parseComparableNumber(actualText);
    if (expectedNumber === null || actualNumber === null) return false;

    return Math.abs(expectedNumber - actualNumber) < 0.000001;
  }

  async waitForEquivalentValue(readActualValue, expectedValue, options = {}) {
    const expectedText = this.normalizeComparableText(expectedValue);
    await expect
      .poll(
        async () => {
          const actualValue = await readActualValue();
          return this.valuesAreEquivalent(expectedText, actualValue, options)
            ? expectedText
            : this.normalizeComparableText(actualValue);
        },
        { timeout: 10000, intervals: [100, 150, 250, 500] }
      )
      .toBe(expectedText);
  }

  async fillAndValidateLineInput(selector, value, fieldName, options = {}) {
    if (!value) {
      throw new Error(`Unable to recreate line because captured ${fieldName} is empty.`);
    }

    const input = await this.findInAllFrames(selector, 20);
    const isDisabled = await input.evaluate((node) => Boolean(node.disabled)).catch(() => false);
    const isVisible = await input.isVisible().catch(() => false);

    if (!isDisabled && isVisible) {
      await input.fill(value);
      await this.dispatchFieldEvents(input);
      await input.press('Tab').catch(() => {});
    } else {
      await this.setFieldValueThroughDom(input, value);
    }

    const readActualValue = async () => {
      const currentInput = await this.findInAllFrames(selector, 3).catch(() => null);
      if (!currentInput) return '';

      const currentValue = await currentInput.inputValue().catch(() => '');
      return this.normalizeComparableText(currentValue);
    };

    await this.waitForEquivalentValue(readActualValue, value, options);

    return {
      expectedValue: value,
      actualValue: await readActualValue()
    };
  }

  async recreateLineQuantities({ uQuantity1, uQuantity2 }) {
    const uQuantity1Selector =
      'input#df_u_quantity1T1[name="df_u_quantity1T1"], input#df_u_quantity1T1';
    const uQuantity2Selector =
      'input#df_u_quantity2T1[name="df_u_quantity2T1"], input#df_u_quantity2T1';
    const uQuantity1Input = await this.findInAllFrames(uQuantity1Selector, 20);
    const isUQuantity1Editable = await this.isFieldEditable(uQuantity1Input);

    if (isUQuantity1Editable) {
      await this.fillAndValidateLineInput(
        uQuantity1Selector,
        uQuantity1,
        'uQuantity1',
        { numeric: true }
      );
    }

    await this.fillAndValidateLineInput(
      uQuantity2Selector,
      uQuantity2,
      'uQuantity2',
      { numeric: true }
    );

    return {
      validateUQuantity1: isUQuantity1Editable
    };
  }

  async isFieldEditable(locator) {
    const fieldState = await locator
      .evaluate((node) => ({
        disabled: Boolean(node.disabled),
        readOnly: Boolean(node.readOnly),
        ariaDisabled: node.getAttribute('aria-disabled') === 'true'
      }))
      .catch(() => ({ disabled: true, readOnly: true, ariaDisabled: true }));
    const isVisible = await locator.isVisible().catch(() => false);
    const isEditable = await locator.isEditable().catch(() => false);

    return (
      isVisible &&
      isEditable &&
      !fieldState.disabled &&
      !fieldState.readOnly &&
      !fieldState.ariaDisabled
    );
  }

  async expectLineInputValue(selector, expectedValue, fieldName) {
    if (!expectedValue) {
      throw new Error(`Unable to validate line because captured ${fieldName} is empty.`);
    }

    const readActualValue = async () => {
      const input = await this.findInAllFrames(selector, 3).catch(() => null);
      const value = input ? await input.inputValue().catch(() => '') : '';
      return this.normalizeComparableText(value);
    };

    await this.waitForEquivalentValue(readActualValue, expectedValue);

    return {
      expectedValue,
      actualValue: await readActualValue()
    };
  }

  async setAndValidateHeaderField(selector, expectedValue, fieldName) {
    const field = await this.findInAllFrames(selector, 20);
    const tagName = await field.evaluate((node) => node.tagName.toLowerCase());
    const isDisabled = await field.evaluate((node) => Boolean(node.disabled)).catch(() => false);
    const isVisible = await field.isVisible().catch(() => false);

    if (tagName === 'select' && isVisible && !isDisabled) {
      await field.selectOption(expectedValue).catch(async () => {
        await this.setFieldValueThroughDom(field, expectedValue);
      });
    } else if (isVisible && !isDisabled) {
      await field.fill(expectedValue);
    } else {
      await this.setFieldValueThroughDom(field, expectedValue);
    }

    const readActualValue = async () => {
      const currentField = await this.findInAllFrames(selector, 3).catch(() => null);
      if (!currentField) return '';

      const value = await currentField
        .evaluate((node) => {
          if ('value' in node) return node.value;
          return node.innerText || node.textContent || '';
        })
        .catch(() => '');
      return this.normalizeComparableText(value);
    };

    await this.waitForEquivalentValue(readActualValue, expectedValue);

    return {
      expectedValue,
      actualValue: await readActualValue()
    };
  }

  async setFieldValueThroughDom(locator, expectedValue) {
    await locator.evaluate((node, value) => {
      node.value = value;
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      node.dispatchEvent(new Event('blur', { bubbles: true }));
    }, expectedValue);
  }

  async dispatchFieldEvents(locator) {
    await locator.evaluate((node) => {
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      node.dispatchEvent(new Event('blur', { bubbles: true }));
    });
  }

  async expectPersistedLineItem({ rowNumber, values, reportValidation }) {
    const validations = [
      ['Item Code', 'itemcode', values.itemCode],
      ['Item Description', 'itemdesc', values.itemDesc],
      ['Unit Price', 'unitprice', values.unitPrice, { numeric: true }],
      ['U Quantity 2', 'u_quantity2', values.uQuantity2, { numeric: true }],
      ['Warehouse Code', 'whscode', values.warehouseCode],
      ['Warehouse Name', 'u_warehousename', values.warehouseName],
      ['Profit Center Code', 'drcode', values.profitCenterCode],
      ['Profit Center Name', 'u_profitcentername', values.profitCenterName],
      ['Business Center', 'u_business_center', values.businessCenter]
    ];

    if (values.validateUQuantity1 !== false) {
      validations.splice(
        3,
        0,
        ['U Quantity 1', 'u_quantity1', values.uQuantity1, { numeric: true }]
      );
    }

    for (const [label, fieldName, expectedValue, options = {}] of validations) {
      const result = await this.expectTableRowValue(
        fieldName,
        rowNumber,
        expectedValue,
        label,
        options
      );
      await reportValidation(
        `Sales Order Row ${rowNumber} ${label}`,
        result.expectedValue,
        result.actualValue
      );
    }
  }

  async expectTableRowValue(fieldName, rowNumber, expectedValue, fieldLabel, options = {}) {
    if (!expectedValue) {
      throw new Error(`Unable to validate row ${rowNumber} because captured ${fieldLabel} is empty.`);
    }

    const selector =
      `input#df_${fieldName}T1r${rowNumber}, ` +
      `label#dd_${fieldName}T1r${rowNumber}, ` +
      `#df_${fieldName}T1r${rowNumber}, ` +
      `#dd_${fieldName}T1r${rowNumber}`;
    const readActualValue = async () => {
      const element = await this.findInAllFrames(selector, 3).catch(() => null);
      if (!element) return '';

      const value = await element.evaluate((node) => {
        if ('value' in node) return node.value;
        return node.innerText || node.textContent || '';
      }).catch(() => '');
      return this.normalizeComparableText(value);
    };

    await this.waitForEquivalentValue(readActualValue, expectedValue, options);

    return {
      expectedValue,
      actualValue: await readActualValue()
    };
  }

  async selectAndValidateLineSelect(selector, value, fieldName) {
    if (!value) {
      throw new Error(
        `Unable to recreate line because captured ${fieldName} is empty on both the row and header.`
      );
    }

    const select = await this.findInAllFrames(selector, 20);
    await select.selectOption(value);
    await expect(select).toHaveValue(value, { timeout: 5000 });
    return {
      expectedValue: value,
      actualValue: this.normalizeComparableText(await select.inputValue().catch(() => ''))
    };
  }

  async selectAndValidateWarehouse({ warehouseCode, warehouseName, rowNumber }) {
    const warehouseInputSelector = 'input#df_whscodeT1[name="df_whscodeT1"], input#df_whscodeT1';
    const warehouseInput = await this.findInAllFrames(warehouseInputSelector, 20);
    const currentWarehouseCode = this.normalizeComparableText(
      await warehouseInput.inputValue().catch(() => '')
    );
    let usedCfl = false;

    if (currentWarehouseCode !== warehouseCode) {
      console.log(
        `[SALES ORDER RECREATE] Row ${rowNumber || '?'} warehouse is "${currentWarehouseCode || '(empty)'}"; selecting transaction warehouse "${warehouseCode}".`
      );
      await this.clearLineInput(warehouseInput);
      await WarehouseCFL.selectFromLookup(this, warehouseCode, {
        resultTimeout: 5000
      });
      await this.ensureLineInputValue(
        warehouseInputSelector,
        warehouseCode,
        `row ${rowNumber || '?'} warehouseCode`
      );
      usedCfl = true;
    }

    const warehouseCodeResult = await this.expectLineInputValue(
      warehouseInputSelector,
      warehouseCode,
      'warehouseCode'
    );
    const warehouseNameResult = await this.expectLineInputValue(
      'input#df_u_warehousenameT1[name="df_u_warehousenameT1"], input#df_u_warehousenameT1',
      warehouseName,
      'uWarehousename'
    );

    return {
      expectedWarehouseCode: warehouseCodeResult.expectedValue,
      actualWarehouseCode: warehouseCodeResult.actualValue,
      expectedWarehouseName: warehouseNameResult.expectedValue,
      actualWarehouseName: warehouseNameResult.actualValue,
      usedCfl
    };
  }

  async clearLineInput(locator) {
    await locator.evaluate((node) => {
      node.value = '';
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      node.dispatchEvent(new Event('blur', { bubbles: true }));
    });
  }

  async ensureLineInputValue(selector, expectedValue, fieldName) {
    const input = await this.findInAllFrames(selector, 20);
    const currentValue = this.normalizeComparableText(await input.inputValue().catch(() => ''));
    if (currentValue === expectedValue) return;

    console.log(
      `[SALES ORDER RECREATE] CFL did not update ${fieldName}; setting "${expectedValue}" directly.`
    );
    await input.evaluate((node, value) => {
      node.value = value;
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      node.dispatchEvent(new Event('blur', { bubbles: true }));
    }, expectedValue);
  }

  async selectAndValidateProfitCenter({ profitCenterCode, profitCenterName }) {
    const profitCenterInputSelector = 'input#df_drcodeT1[name="df_drcodeT1"], input#df_drcodeT1';
    const profitCenterInput = await this.findInAllFrames(profitCenterInputSelector, 20);
    const currentProfitCenterCode = this.normalizeComparableText(
      await profitCenterInput.inputValue().catch(() => '')
    );

    let usedCfl = false;
    if (!currentProfitCenterCode) {
      await ProfitCenterCFL.selectFromLookup(this, profitCenterCode, {
        resultTimeout: 5000
      });
      usedCfl = true;
    }

    const profitCenterCodeResult = await this.expectLineInputValue(
      profitCenterInputSelector,
      profitCenterCode,
      'drcode'
    );
    const profitCenterNameResult = await this.expectLineInputValue(
      'input#df_u_profitcenternameT1[name="df_u_profitcenternameT1"], input#df_u_profitcenternameT1',
      profitCenterName,
      'uProfitcentername'
    );

    return {
      expectedProfitCenterCode: profitCenterCodeResult.expectedValue,
      actualProfitCenterCode: profitCenterCodeResult.actualValue,
      expectedProfitCenterName: profitCenterNameResult.expectedValue,
      actualProfitCenterName: profitCenterNameResult.actualValue,
      usedCfl
    };
  }
}

module.exports = { SalesOrder };
