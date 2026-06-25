const { expect } = require('@playwright/test');

async function selectFromCfl(pageObject, {
  value,
  inputSelector,
  cflSelector,
  filterSelector = '#df_inputfilter',
  okButtonName = 'OK',
  timeout = 15000
}) {
  const input = await pageObject.findInAllFrames(inputSelector);

  const popupPromise = pageObject.page.context().waitForEvent('page', {
    timeout
  });

  await (await pageObject.findInAllFrames(cflSelector)).click();

  const cflPage = await popupPromise;
  await cflPage.waitForLoadState('domcontentloaded');

  const filterInput = cflPage.locator(filterSelector);

  await filterInput.fill(value);
  await filterInput.press('Enter');

  await cflPage.locator('tr.tableBoxSelectedRow').waitFor({
    state: 'visible',
    timeout: 10000
  });

  await Promise.all([
    cflPage.waitForEvent('close').catch(() => {}),
    cflPage.getByRole('link', { name: okButtonName }).click()
  ]);

  await expect
    .poll(
      async () => await input.inputValue(),
      { timeout }
    )
    .toBe(value);

  return value;
}

module.exports = {
  selectFromCfl
};