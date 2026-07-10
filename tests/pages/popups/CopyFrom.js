// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');

class CopyFrom extends BasePage {
  async expectLoaded() {
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    const bodyText = await this.page.locator('body').textContent().catch(() => '');
    expect(String(bodyText || '').trim().length).toBeGreaterThan(0);
  }

  async clickChoose() {
    const chooseButton = await this.findInAllFrames('a.button[href="javascript:selectHeaders()"]', 10)
      .catch(() => this.findInAllFrames('a.button:has-text("Choose")', 10));
    await chooseButton.click();
  }

  async clickFinish() {
    const finishButton = await this.findInAllFrames('a.button[onclick*="selectDocItems"]', 20)
      .catch(() => this.findInAllFrames('a.button:has-text("Finish")', 20));
    await finishButton.click();
  }

  async selectHeaderRow({ docNo = '', tableId = 'T1' } = {}) {
    const rowNumber = await this.findRowNumber({ docNo, tableId });
    const checkbox = await this.findInAllFrames(`#df_checked${tableId}r${rowNumber}`, 10);
    await checkbox.scrollIntoViewIfNeeded().catch(() => {});
    await checkbox.check({ force: true }).catch(async () => {
      await checkbox.click({ force: true });
    });
    await expect(checkbox).toBeChecked();
    return { rowNumber, docNo };
  }

  async selectFirstItem({ tableId = 'T2' } = {}) {
    const rowNumber = await this.findRowNumber({ tableId });
    const checkbox = await this.findInAllFrames(`input#df_checked${tableId}r${rowNumber}`, 5)
      .catch(() => this.findInAllFrames(`input#df_checked${tableId}`, 10));
    await checkbox.scrollIntoViewIfNeeded().catch(() => {});
    await checkbox.check({ force: true }).catch(async () => {
      await checkbox.click({ force: true });
    });
    await expect(checkbox).toBeChecked();
    return { rowNumber };
  }

  async expectItemsLoaded({ tableId = 'T2' } = {}) {
    const itemTable = await this.findInAllFrames(`div#div${tableId} table#${tableId}`, 20)
      .catch(() => this.findInAllFrames(`table#${tableId}`, 20));
    await expect(itemTable).toBeVisible({ timeout: 10000 });
  }

  async findRowNumber({ docNo = '', tableId = 'T1' } = {}) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      for (const frame of this.page.frames()) {
        try {
          if (frame.isDetached()) continue;

          const rowNumber = await frame.evaluate(({ expectedDocNo, targetTableId }) => {
            const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
            const rowFromId = (value) => {
              const match = String(value || '').match(new RegExp(`${targetTableId}r(\\d+)`, 'i'));
              return match ? match[1] : '';
            };

            if (expectedDocNo) {
              const elements = Array.from(document.querySelectorAll('input, label, td'));
              for (const element of elements) {
                const value = normalize(element.value || element.textContent || element.innerText);
                if (value !== expectedDocNo) continue;

                let current = element;
                while (current) {
                  const source = [
                    current.id,
                    current.getAttribute?.('name'),
                    current.getAttribute?.('onclick'),
                    current.getAttribute?.('for')
                  ]
                    .filter(Boolean)
                    .join(' ');
                  const foundRowNumber = rowFromId(source);
                  if (foundRowNumber && document.getElementById(`df_checked${targetTableId}r${foundRowNumber}`)) {
                    return foundRowNumber;
                  }
                  current = current.parentElement;
                }
              }

              return '';
            }

            const checkedInput = document.querySelector(`input[id^="df_checked${targetTableId}r"]`);
            if (checkedInput) return rowFromId(checkedInput.id);

            const legacyCheckedInput = document.querySelector(`input#df_checked${targetTableId}`);
            return legacyCheckedInput ? '1' : '';
          }, { expectedDocNo: docNo, targetTableId: tableId });

          if (rowNumber) return rowNumber;
        } catch (e) {
          continue;
        }
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error(`Copy From row not found in ${tableId}: ${docNo || '(first row)'}`);
  }

  async readTableRowValues({ tableId = 'T2', rowNumber = 1, fields = [] } = {}) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      for (const frame of this.page.frames()) {
        try {
          if (frame.isDetached()) continue;

          const values = await frame.evaluate(({ targetTableId, targetRowNumber, targetFields }) => {
            const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
            const rowExists = Boolean(
              document.getElementById(`df_checked${targetTableId}r${targetRowNumber}`) ||
                document.getElementById(`df_itemcode${targetTableId}r${targetRowNumber}`) ||
                document.querySelector(`table#${targetTableId}`)
            );
            if (!rowExists) return null;

            return Object.fromEntries(
              targetFields.map((fieldName) => {
                const input = document.getElementById(`df_${fieldName}${targetTableId}r${targetRowNumber}`);
                const label = document.getElementById(`dd_${fieldName}${targetTableId}r${targetRowNumber}`);
                const element = input || label;

                return [
                  fieldName,
                  {
                    found: Boolean(element),
                    value: normalize(input?.value || label?.textContent || label?.innerText)
                  }
                ];
              })
            );
          }, {
            targetTableId: tableId,
            targetRowNumber: rowNumber,
            targetFields: fields
          });

          if (values) return values;
        } catch (e) {
          continue;
        }
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error(`Unable to read Copy From ${tableId} row ${rowNumber}.`);
  }
}

module.exports = { CopyFrom };
