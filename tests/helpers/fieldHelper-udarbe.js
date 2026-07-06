const { expect } = require('@playwright/test');

async function fillField(pageObject, selector, value) {
  const input = await pageObject.findInAllFrames(selector);

  await input.fill(String(value));
  await expect(input).toHaveValue(String(value));

  return value;
}

module.exports = {
  fillField
};