// This is for recording the test result summary.
const { recordModuleDocNo } = require('./runSummary');
// This is for shared page object behavior.
const { BasePage } = require('../pages/base/BasePage');

const DEFAULT_DOCNO_SELECTORS = [
  'input#df_docno[name="df_docno"]',
  'input#df_docno',
  'input[name="df_docno"]',
  '#df_docno',
  'input[id*="docno" i][name*="docno" i]',
  'input[id*="docno" i]',
  '[id*="docno" i]'
];

function normalizeDocNo(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function toBasePage(pageOrPageObject) {
  if (!pageOrPageObject) {
    throw new Error('A Playwright page or page object is required to read the doc no.');
  }

  if (typeof pageOrPageObject.findInAllFrames === 'function') {
    return pageOrPageObject;
  }

  if (pageOrPageObject.page && typeof pageOrPageObject.page.frames === 'function') {
    return new BasePage(pageOrPageObject.page);
  }

  if (typeof pageOrPageObject.frames === 'function') {
    return new BasePage(pageOrPageObject);
  }

  throw new Error('Unsupported doc no reader target. Pass a Playwright page or BasePage object.');
}

async function readLocatorText(locator) {
  const inputValue = await locator.inputValue().catch(() => '');
  if (normalizeDocNo(inputValue)) return inputValue;

  return locator.textContent().catch(() => '');
}

async function readCurrentDocNo(pageOrPageObject, options = {}) {
  const {
    selectors = DEFAULT_DOCNO_SELECTORS,
    timeout = 20000,
    required = true
  } = options;
  const basePage = toBasePage(pageOrPageObject);
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const selector of selectors) {
      const locator = await basePage.findInAllFrames(selector, 1).catch(() => null);
      if (!locator) continue;

      const docNo = normalizeDocNo(await readLocatorText(locator));
      if (docNo) return docNo;
    }

    await basePage.page.waitForTimeout(500);
  }

  if (required) {
    throw new Error(`Doc no was not found within ${timeout}ms.`);
  }

  return '';
}

async function recordCurrentDocNo(moduleName, pageOrPageObject, status = 'Completed', testId, options = {}) {
  const docNo = await readCurrentDocNo(pageOrPageObject, options);
  recordModuleDocNo(moduleName, docNo, status, testId);
  return docNo;
}

module.exports = {
  DEFAULT_DOCNO_SELECTORS,
  readCurrentDocNo,
  recordCurrentDocNo
};
