// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../../pages/base/BasePage');

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function toBasePage(pageOrPageObject, helperName) {
  if (!pageOrPageObject) {
    throw new Error(`A Playwright page or page object is required for ${helperName}.`);
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

  throw new Error(`Unsupported ${helperName} target. Pass a Playwright page or BasePage object.`);
}

async function selectFirstCflValue(pageOrPageObject, selectors, helperName) {
  const sourcePage = toBasePage(pageOrPageObject, helperName);
  const popupPromise = sourcePage.page.context().waitForEvent('page', {
    timeout: selectors.popupTimeout || 15000
  });
  const trigger = await sourcePage.findInAllFrames(selectors.trigger, 20);
  await trigger.scrollIntoViewIfNeeded().catch(() => {});
  await trigger.click();

  const popupPage = await popupPromise;
  const popup = new BasePage(popupPage);
  await popupPage.waitForLoadState('domcontentloaded').catch(() => {});

  const resultColumn = await popup.findInAllFrames(selectors.resultColumn, 20);
  const expectedValue = await readSelectedResultValue(popup, resultColumn, selectors);

  if (!expectedValue) {
    throw new Error(`${helperName} did not return a selectable value.`);
  }

  await sourcePage.findInAllFrames(selectors.output, 20);
  const outputMatched = await selectResultAndWaitForOutput({
    helperName,
    popup,
    popupPage,
    resultColumn,
    sourcePage,
    outputSelector: selectors.output,
    expectedValue
  });

  if (!outputMatched) {
    const actualValue = await readOutputValue(sourcePage, selectors.output);
    throw new Error(
      `${helperName} selected "${expectedValue}" but ${selectors.output} stayed ` +
        `"${actualValue || '(blank)'}".`
    );
  }

  return {
    label: selectors.label,
    expectedValue,
    actualValue: await readOutputValue(sourcePage, selectors.output),
    passed: true
  };
}

async function selectResultAndWaitForOutput({
  helperName,
  popup,
  popupPage,
  resultColumn,
  sourcePage,
  outputSelector,
  expectedValue
}) {
  const attempts = [
    {
      label: 'result column double-click',
      action: async () => resultColumn.dblclick({ force: true })
    },
    {
      label: 'result child double-click',
      action: async () => {
        const child = resultColumn.locator('label, input, a, span').first();
        await child.dblclick({ force: true, timeout: 1000 });
      }
    },
    {
      label: 'result row double-click',
      action: async () => {
        const row = resultColumn.locator('xpath=ancestor::tr[1]').first();
        await row.dblclick({ force: true });
      }
    },
    {
      label: 'result center mouse double-click',
      action: async () => {
        const box = await resultColumn.boundingBox();
        if (!box) throw new Error(`${helperName} result column has no bounding box.`);
        await popupPage.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
      }
    },
    {
      label: 'DOM double-click dispatch',
      action: async () => {
        await resultColumn.evaluate((node) => {
          const target = node.querySelector('label, input, a, span') || node;
          for (const type of ['mousedown', 'mouseup', 'click', 'mousedown', 'mouseup', 'click', 'dblclick']) {
            target.dispatchEvent(
              new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                detail: type === 'dblclick' ? 2 : 1
              })
            );
          }
        });
      }
    },
    {
      label: 'result row then OK',
      action: async () => {
        await resultColumn.locator('xpath=ancestor::tr[1]').first().click({ force: true });
        const okButton = await popup.findInAllFrames('a.button:has-text("OK"), a:has-text("OK")', 3);
        await okButton.click({ force: true });
      }
    }
  ];

  for (const attempt of attempts) {
    if (popupPage.isClosed()) break;

    await attempt.action().catch(() => {});
    await popupPage.waitForEvent('close', { timeout: 1000 }).catch(() => {});

    if (await waitForOutputValue(sourcePage, outputSelector, expectedValue, 1500)) {
      return true;
    }
  }

  return waitForOutputValue(sourcePage, outputSelector, expectedValue, 5000);
}

async function readSelectedResultValue(popup, resultColumn, selectors) {
  const valueField = String(selectors.valueField || '').trim();
  if (valueField) {
    const rowNumber = await findSelectedOrFirstRowNumber(popup, valueField);
    const fieldValue = await readPopupRowFieldValue(popup, valueField, rowNumber);
    if (fieldValue) return fieldValue;
  }

  return normalizeText(
    await resultColumn
      .evaluate((node) => {
        const input = node.querySelector('input');
        const label = node.querySelector('label');
        return input?.value || label?.textContent || node.textContent || node.innerText || '';
      })
      .catch(() => '')
  );
}

async function findSelectedOrFirstRowNumber(popup, valueField) {
  for (const frame of popup.page.frames()) {
    try {
      if (frame.isDetached()) continue;

      const rowNumber = await frame.evaluate((fieldName) => {
        const rowFromId = (value) => {
          const match = String(value || '').match(/T1r(\d+)/i);
          return match ? match[1] : '';
        };

        const highlightedRow = Array.from(document.querySelectorAll('tr')).find((row) => {
          const style = window.getComputedStyle(row);
          const rowText = `${row.className || ''} ${row.getAttribute('style') || ''} ${style.backgroundColor}`;
          return /selected|highlight|#ffd|255,\s*217|yellow/i.test(rowText);
        });
        if (highlightedRow) {
          const highlightedField = highlightedRow.querySelector(
            `[id^="df_${fieldName}T1r"], [id^="dd_${fieldName}T1r"]`
          );
          const highlightedRowNumber = rowFromId(highlightedField?.id);
          if (highlightedRowNumber) return highlightedRowNumber;
        }

        const firstField = document.querySelector(
          `[id^="df_${fieldName}T1r"], [id^="dd_${fieldName}T1r"]`
        );
        return rowFromId(firstField?.id) || '1';
      }, valueField);

      if (rowNumber) return rowNumber;
    } catch (e) {
      continue;
    }
  }

  return '1';
}

async function readPopupRowFieldValue(popup, valueField, rowNumber = '1') {
  const selectors = [
    `#df_${valueField}T1r${rowNumber}`,
    `#dd_${valueField}T1r${rowNumber}`
  ];

  for (const selector of selectors) {
    const field = await popup.findInAllFrames(selector, 2).catch(() => null);
    if (!field) continue;

    const value = normalizeText(
      await field
        .evaluate((element) => {
          if ('value' in element) return element.value;
          return element.innerText || element.textContent || '';
        })
        .catch(() => '')
    );
    if (value) return value;
  }

  return '';
}

async function waitForOutputValue(sourcePage, outputSelector, expectedValue, timeout = 1500) {
  return expect
    .poll(
      async () => readOutputValue(sourcePage, outputSelector),
      { timeout, intervals: [100, 150, 250, 500] }
    )
    .toBe(expectedValue)
    .then(() => true)
    .catch(() => false);
}

async function readOutputValue(sourcePage, outputSelector) {
  const output = await sourcePage.findInAllFrames(outputSelector, 1).catch(() => null);
  if (!output) return '';

  return normalizeText(
    await output
      .evaluate((element) => {
        if ('value' in element) return element.value;
        return element.innerText || element.textContent || '';
      })
      .catch(() => '')
  );
}

module.exports = {
  normalizeText,
  selectFirstCflValue
};
