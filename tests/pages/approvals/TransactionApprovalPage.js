// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');

class TransactionApprovalPage extends BasePage {
  async expectLoaded() {
    const pageHeader = await this.findInAllFrames('td.labelPageHeader', 20);
    await expect(pageHeader).toContainText('Transaction Approval', { timeout: 10000 });
  }

  async approveDocument(beforeAdd) {
    await this.clickFilter();
    await this.expectResultsTableVisible();
    await this.selectApprovedDecision();
    await this.selectAllDocuments();

    if (beforeAdd) {
      await beforeAdd();
    }

    await this.clickAdd();
    await this.expectOpenAndUneditable();
  }

  async clickFilter() {
    const filterButton = await this.findInAllFrames(
      'a.button[onclick*="u_getPRGPSBountyFresh"]',
      20
    );
    await expect(filterButton).toBeVisible({ timeout: 10000 });
    await filterButton.click();
  }

  async expectResultsTableVisible() {
    const resultBox = await this.findInAllFrames('div#divT1', 20);
    await expect(resultBox).toBeVisible({ timeout: 10000 });

    const resultTable = await this.findInAllFrames('table#T1', 20);
    await expect(resultTable).toBeVisible({ timeout: 10000 });
  }

  async selectApprovedDecision() {
    const decisionSelect = await this.findInAllFrames(
      'select#df_u_decision[name="df_u_decision"]',
      20
    );
    await decisionSelect.selectOption('A');
    await expect(decisionSelect).toHaveValue('A');
  }

  async selectAllDocuments() {
    const checkbox = await this.findInAllFrames(
      'input#df_u_selectedT1[name="df_u_selectedT1"]',
      20
    );
    await checkbox.scrollIntoViewIfNeeded().catch(() => {});
    await expect(checkbox).toBeVisible({ timeout: 10000 });
    await checkbox.check({ force: true }).catch(async () => {
      await checkbox.click({ force: true });
    });
    await expect(checkbox).toBeChecked();
  }

  async clickAdd() {
    const addButton = await this.findInAllFrames('a#btnAdd[name="btnAdd"]', 20);
    await addButton.click();
  }

  async expectOpenAndUneditable() {
    const docStatus = await this.findInAllFrames('select#df_docstatus[name="df_docstatus"]', 20);

    await expect
      .poll(
        async () => {
          const value = await docStatus.inputValue().catch(() => '');
          const label = await docStatus.locator('option:checked').textContent().catch(() => '');
          const disabled = await docStatus.evaluate((element) => element.disabled).catch(() => false);
          return `${value}|${(label || '').trim()}|${disabled ? 'disabled' : 'editable'}`;
        },
        { timeout: 20000 }
      )
      .toBe('O|Open|disabled');
  }
}

module.exports = { TransactionApprovalPage };
