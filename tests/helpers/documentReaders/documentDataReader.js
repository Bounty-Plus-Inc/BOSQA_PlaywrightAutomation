const {
  createEmptyHeaderData,
  getHeaderFieldNames,
  readHeadersFromDocument
} = require('./headerReader');
const { readLineItemsFromDocument } = require('./lineItemReader');

function createEmptyDocumentData(documentConfig = {}) {
  return {
    ...createEmptyHeaderData(documentConfig.headers || []),
    lineItems: []
  };
}

async function readDocumentData(page, documentConfig = {}, options = {}) {
  const headerFields = documentConfig.headers || [];
  const headerFieldNames = getHeaderFieldNames(headerFields);
  let latestDocumentData = createEmptyDocumentData(documentConfig);

  for (let attempt = 0; attempt < (options.attempts || 20); attempt += 1) {
    const attemptDocumentData = createEmptyDocumentData(documentConfig);

    for (const frame of page.frames()) {
      try {
        if (frame.isDetached()) continue;

        const headerData = await frame.evaluate(readHeadersFromDocument, headerFields);
        for (const fieldName of headerFieldNames) {
          if (headerData[fieldName] && !attemptDocumentData[fieldName]) {
            attemptDocumentData[fieldName] = headerData[fieldName];
          }
        }

        const lineItems = await frame.evaluate(
          readLineItemsFromDocument,
          documentConfig.lineItems || {}
        );
        if (lineItems.length && !attemptDocumentData.lineItems.length) {
          attemptDocumentData.lineItems = lineItems;
        }
      } catch (e) {
        continue;
      }
    }

    if (
      headerFieldNames.some((fieldName) => attemptDocumentData[fieldName]) ||
      attemptDocumentData.lineItems.length
    ) {
      latestDocumentData = attemptDocumentData;
    }

    if (attemptDocumentData.lineItems.length) return attemptDocumentData;

    await page.waitForTimeout(options.intervalMs || 500);
  }

  return latestDocumentData;
}

module.exports = {
  createEmptyDocumentData,
  readDocumentData
};
