function readCurrentDocumentDataFromDocument() {
  const pageDocument = document;
  const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const toCamelCase = (value) =>
    String(value || '').replace(/_([a-z0-9])/gi, (_, letter) => letter.toUpperCase());
  const fieldAliases = {
    itemcode: 'itemCode',
    itemdesc: 'itemDesc',
    unitprice: 'unitPrice',
    vatcode: 'vatCode',
    linetotal: 'lineTotal',
    whscode: 'warehouseCode',
    uBusinessCenter: 'businessCenter',
    openquantity: 'openQuantity',
    discperc: 'discountPercent',
    discamount: 'discountAmount',
    rowstat: 'rowStatus',
    keys: 'keys'
  };
  const toKey = (fieldName) => fieldAliases[toCamelCase(fieldName)] || toCamelCase(fieldName);
  const getElementValue = (element) => {
    if (!element) return '';

    const tagName = element.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
      return normalizeText(element.value);
    }

    return normalizeText(element.innerText || element.textContent || '');
  };
  const getFieldValue = (selectors) => {
    for (const selector of selectors) {
      const value = getElementValue(pageDocument.querySelector(selector));
      if (value) return value;
    }

    return '';
  };
  const headerFields = {
    bpCode: getFieldValue([
      'input#df_bpcode[name="df_bpcode"]',
      'input#df_bpcode',
      'input[name="df_bpcode"]',
      '#df_bpcode'
    ]),
    bpRefNo: getFieldValue([
      'input#df_bprefno[name="df_bprefno"]',
      'input#df_bprefno',
      'input[name="df_bprefno"]',
      '#df_bprefno'
    ]),
    shipToCode: getFieldValue([
      'select#df_shiptocode[name="df_shiptocode"]',
      'input#df_shiptocode[name="df_shiptocode"]',
      '#df_shiptocode'
    ]),
    shipToAddress: getFieldValue([
      'textarea#df_shiptoaddress[name="df_shiptoaddress"]',
      'input#df_shiptoaddress[name="df_shiptoaddress"]',
      '#df_shiptoaddress'
    ]),
    shipType: getFieldValue([
      'select#df_shiptype[name="df_shiptype"]',
      'input#df_shiptype[name="df_shiptype"]',
      '#df_shiptype'
    ]),
    salesOrg: getFieldValue([
      'select#df_u_sales_org[name="df_u_sales_org"]',
      'input#df_u_sales_org[name="df_u_sales_org"]',
      '#df_u_sales_org'
    ]),
    distributionChannel: getFieldValue([
      'select#df_u_distribution_channel[name="df_u_distribution_channel"]',
      'input#df_u_distribution_channel[name="df_u_distribution_channel"]',
      '#df_u_distribution_channel'
    ]),
    division: getFieldValue([
      'select#df_u_division[name="df_u_division"]',
      'input#df_u_division[name="df_u_division"]',
      '#df_u_division'
    ]),
    businessCenter: getFieldValue([
      'select#df_u_business_center[name="df_u_business_center"]',
      'input#df_u_business_center[name="df_u_business_center"]',
      '#df_u_business_center'
    ])
  };
  const getMainTable = () => {
    const t1Table = pageDocument.querySelector('div.divTableBox table.tableBox#T1');
    if (t1Table) return t1Table;

    return pageDocument.querySelector('div.divTableBox table.tableBox[id], table.tableBox#T1');
  };
  const table = getMainTable();
  if (!table?.id) {
    return {
      ...headerFields,
      lineItems: []
    };
  }

  const tableId = table.id;
  const rowFieldPattern = new RegExp(`^(df|dd|sf)_([a-z0-9_]+)${tableId}r(\\d+)$`, 'i');
  const rowElements = Array.from(table.querySelectorAll(`[id*="${tableId}r"]`))
    .map((element) => {
      const match = rowFieldPattern.exec(element.id || '');
      if (!match) return null;

      const [, prefix, rawFieldName, rowNumberText] = match;
      const value = getElementValue(element);
      if (!value) return null;

      return {
        
        prefix: prefix.toLowerCase(),
        rawFieldName,
        key: toKey(rawFieldName),
        rowNumber: Number(rowNumberText),
        value
      };
    })
    .filter(Boolean);
  const rowNumbers = [...new Set(rowElements.map((element) => element.rowNumber))].sort(
    (a, b) => a - b
  );

  return {
    ...headerFields,
    lineItems: rowNumbers.map((rowNumber) => {
      const lineItem = { row: rowNumber };
      const rowValues = {};

      for (const element of rowElements.filter((entry) => entry.rowNumber === rowNumber)) {
        if (lineItem[element.key] && element.prefix !== 'df' && element.prefix !== 'sf') continue;

        lineItem[element.key] = element.value;
        rowValues[element.rawFieldName] = element.value;
      }

      return {
        ...lineItem,
        values: rowValues
      };
    })
  };
}

async function readCurrentDocumentData(page) {
  const headerFieldNames = [
    'bpCode',
    'bpRefNo',
    'shipToCode',
    'shipToAddress',
    'shipType',
    'salesOrg',
    'distributionChannel',
    'division',
    'businessCenter'
  ];
  const createEmptyDocumentData = () => ({
    bpCode: '',
    bpRefNo: '',
    shipToCode: '',
    shipToAddress: '',
    shipType: '',
    salesOrg: '',
    distributionChannel: '',
    division: '',
    businessCenter: '',
    lineItems: []
  });

  let latestDocumentData = createEmptyDocumentData();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const attemptDocumentData = createEmptyDocumentData();

    for (const frame of page.frames()) {
      try {
        if (frame.isDetached()) continue;

        const documentData = await frame.evaluate(readCurrentDocumentDataFromDocument);
        for (const fieldName of headerFieldNames) {
          if (documentData[fieldName] && !attemptDocumentData[fieldName]) {
            attemptDocumentData[fieldName] = documentData[fieldName];
          }
        }
        if (documentData.lineItems.length && !attemptDocumentData.lineItems.length) {
          attemptDocumentData.lineItems = documentData.lineItems;
        }
      } catch (e) {
        continue;
      }
    }

    if (headerFieldNames.some((fieldName) => attemptDocumentData[fieldName]) || attemptDocumentData.lineItems.length) {
      latestDocumentData = attemptDocumentData;
    }

    if (attemptDocumentData.lineItems.length) return attemptDocumentData;

    await page.waitForTimeout(500);
  }

  return latestDocumentData;
}

module.exports = {
  readCurrentDocumentData
};
