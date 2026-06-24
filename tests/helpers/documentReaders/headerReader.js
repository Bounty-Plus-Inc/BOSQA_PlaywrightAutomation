function getHeaderFieldNames(headerFields = []) {
  return headerFields.map((field) => field.key);
}

function createEmptyHeaderData(headerFields = []) {
  return Object.fromEntries(getHeaderFieldNames(headerFields).map((fieldName) => [fieldName, '']));
}

function readHeadersFromDocument(headerFields = []) {
  const pageDocument = document;
  const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const getElementValue = (element) => {
    if (!element) return '';

    const tagName = element.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
      return normalizeText(element.value);
    }

    return normalizeText(element.innerText || element.textContent || '');
  };
  const getFieldValue = (selectors) => {
    for (const selector of selectors || []) {
      const value = getElementValue(pageDocument.querySelector(selector));
      if (value) return value;
    }

    return '';
  };

  return Object.fromEntries(
    (headerFields || []).map((field) => [field.key, getFieldValue(field.selectors)])
  );
}

async function readHeaderData(page, options = {}) {
  const headerFields = options.headerFields || [];
  const headerFieldNames = getHeaderFieldNames(headerFields);
  let latestHeaderData = createEmptyHeaderData(headerFields);

  for (let attempt = 0; attempt < (options.attempts || 20); attempt += 1) {
    const attemptHeaderData = createEmptyHeaderData(headerFields);

    for (const frame of page.frames()) {
      try {
        if (frame.isDetached()) continue;

        const headerData = await frame.evaluate(readHeadersFromDocument, headerFields);
        for (const fieldName of headerFieldNames) {
          if (headerData[fieldName] && !attemptHeaderData[fieldName]) {
            attemptHeaderData[fieldName] = headerData[fieldName];
          }
        }
      } catch (e) {
        continue;
      }
    }

    if (headerFieldNames.some((fieldName) => attemptHeaderData[fieldName])) {
      latestHeaderData = attemptHeaderData;
      return latestHeaderData;
    }

    await page.waitForTimeout(options.intervalMs || 500);
  }

  return latestHeaderData;
}

module.exports = {
  createEmptyHeaderData,
  getHeaderFieldNames,
  readHeaderData,
  readHeadersFromDocument
};
