// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../pages/base/BasePage');

const BP_CODE_SELECTORS = [
  'input#df_bpcode[name="df_bpcode"]',
  'input#df_bpcode',
  'input[name="df_bpcode"]'
];

function toBasePage(pageOrPageObject) {
  if (!pageOrPageObject) {
    throw new Error('A Playwright page or page object is required to fill BP Code.');
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

  throw new Error('Unsupported BP Code target. Pass a Playwright page or BasePage object.');
}

function resolveBpCode(value, { envKey } = {}) {
  const resolvedValue = String(value || (envKey ? process.env[envKey] : '') || '').trim();
  if (!resolvedValue) {
    throw new Error(`BP Code is required. Pass a value or set ${envKey || 'the BP code env variable'}.`);
  }

  return resolvedValue;
}

function getSalesBpCode(value) {
  return resolveBpCode(value, { envKey: 'BPI_SALES_BPCODE' });
}

function getDeliveryBpCode(value) {
  return resolveBpCode(value, { envKey: 'BPI_DELIVERY_BPCODE' });
}

async function fillBpCodeField(pageOrPageObject, value, options = {}) {
  const {
    envKey,
    selectors = BP_CODE_SELECTORS,
    timeout = 20000
  } = options;
  const bpCode = resolveBpCode(value, { envKey });
  const basePage = toBasePage(pageOrPageObject);

  for (const selector of selectors) {
    const bpCodeInput = await basePage.findInAllFrames(selector, Math.ceil(timeout / 500)).catch(() => null);
    if (!bpCodeInput) continue;

    await bpCodeInput.fill(bpCode);
    await expect(bpCodeInput).toHaveValue(bpCode, { timeout: 5000 });
    return bpCode;
  }

  throw new Error(`BP Code field was not found. Tried selectors: ${selectors.join(', ')}`);
}

module.exports = {
  BP_CODE_SELECTORS,
  fillBpCodeField,
  getDeliveryBpCode,
  getSalesBpCode,
  resolveBpCode
};
