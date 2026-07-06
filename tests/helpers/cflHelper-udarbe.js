const { expect } = require('@playwright/test');

async function selectFromCfl(
  pageObject,
  {
    value,
    inputSelector,
    cflSelector,
    filterSelector = '#df_inputfilter',
    okButtonName = 'OK',
    pressEnter = true,
    timeout = 30000
  }
) {
  const searchValue = String(value).trim();

  // Main page input
  const input = await pageObject.findInAllFrames(inputSelector);

  // Don't overwrite existing value
  const currentValue = (await input.inputValue()).trim();
  if (currentValue) {
    console.log(`${inputSelector} already has value: ${currentValue}`);
    return currentValue;
  }

  // Wait for CFL popup
  const popupPromise = pageObject.page.context().waitForEvent('page', {
    timeout
  });

  // Open CFL
  await (await pageObject.findInAllFrames(cflSelector)).click();

  // Popup page
  const cflPage = await popupPromise;
  await cflPage.waitForLoadState('domcontentloaded');

  // Filter textbox
  const filterInput = cflPage.locator(filterSelector);

  await expect(filterInput).toBeVisible({ timeout });
  await expect(filterInput).toBeEditable({ timeout });

  await filterInput.fill(searchValue);

  if (pressEnter) {
    await filterInput.press('Enter');
  }

  // Wait for result row
  const resultRow = cflPage.locator('tr.tableBoxSelectedRow');

  await expect(resultRow).toBeVisible({
    timeout
  });

  // Click OK and wait for popup to close
  await Promise.all([
    cflPage.waitForEvent('close').catch(() => {}),
    cflPage.getByRole('link', { name: okButtonName }).click()
  ]);

  // Give the main page time to update (best effort)
  await pageObject.page.waitForLoadState('networkidle').catch(() => {});
  await pageObject.page.waitForTimeout(1000);

  // Verify value returned using a fresh locator every poll
  await expect
    .poll(
      async () => {
        const freshInput = await pageObject.findInAllFrames(inputSelector);
        return (await freshInput.inputValue()).trim();
      },
      {
        timeout,
        intervals: [500]
      }
    )
    .toBe(searchValue);

  return searchValue;
}

module.exports = {
  selectFromCfl
};