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
  const getMainTable = () => {
    const t1Table = pageDocument.querySelector('div.divTableBox table.tableBox#T1');
    if (t1Table) return t1Table;

    return pageDocument.querySelector('div.divTableBox table.tableBox[id], table.tableBox#T1');
  };
  const table = getMainTable();
  if (!table?.id) {
    return {
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
  for (let attempt = 0; attempt < 20; attempt += 1) {
    for (const frame of page.frames()) {
      try {
        if (frame.isDetached()) continue;

        const documentData = await frame.evaluate(readCurrentDocumentDataFromDocument);
        if (documentData.lineItems.length) return documentData;
      } catch (e) {
        continue;
      }
    }

    await page.waitForTimeout(500);
  }

  return {
    lineItems: []
  };
}

module.exports = {
  readCurrentDocumentData
};
