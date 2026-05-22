const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class CreditLimitPage extends BasePage {
  async createCheck({ customerNo, approverUserId, docNo, beforeAdd }) {
    await this.completeApprovalFlow({
      customerNo,
      approverUserId,
      docNo,
      filterSelector: 'a.button[onclick*="delay()"]',
      approve: () => this.selectApprovedDecision(),
      beforeAdd
    });
  }

  async createApproval({ customerNo, docNo, remarksUserId, beforeAdd }) {
    await this.completeApprovalFlow({
      customerNo,
      docNo,
      filterSelector: 'a.button[onclick*="u_getSalesOrdersFCGPSBFFISales"]',
      approve: () => this.selectApprovedStatus(),
      remarks: this.buildApprovalRemarks(remarksUserId, docNo),
      beforeAdd
    });
  }

  async completeApprovalFlow({
    customerNo,
    approverUserId,
    docNo,
    filterSelector,
    approve,
    remarks,
    beforeAdd
  }) {
    await this.ensureVisibleInAnyFrame('a#btnAdd[name="btnAdd"]');
    const addButton = await this.findInAllFrames('a#btnAdd[name="btnAdd"]', 20);
    await expect(addButton).toBeVisible({ timeout: 10000 });

    const customerNoInput = await this.findInAllFrames(
      'input#df_u_custno[name="df_u_custno"]',
      20
    );
    await customerNoInput.fill(customerNo);
    await expect(customerNoInput).toHaveValue(customerNo);

    if (approverUserId) {
      const approverInput = await this.findInAllFrames(
        'input#df_u_approverid[name="df_u_approverid"]',
        20
      );
      await approverInput.evaluate((el, value) => {
        el.removeAttribute('readonly');
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, approverUserId);
      await expect(approverInput).toHaveValue(approverUserId);
    }

    const filterButton = await this.findInAllFrames(filterSelector, 20);
    await filterButton.click();

    const resultTab = await this.findInAllFrames('xpath=//*[@id="tab1"]', 20);
    await expect(resultTab).toBeVisible({ timeout: 10000 });
    await this.expectResultsTableVisible();

    await this.selectSalesOrderInResults(docNo);
    await approve();
    if (remarks) {
      await this.fillRemarks(remarks);
    }
    if (beforeAdd) {
      await beforeAdd();
    }
    await this.clickAdd();
    await this.expectApprovalSucceeded();
  }

  async expectResultsTableVisible() {
    const resultBox = await this.findInAllFrames('div#divT1', 20);
    await expect(resultBox).toBeVisible({ timeout: 10000 });

    const resultTable = await this.findInAllFrames('table#T1[name="T1"]', 20);
    await expect(resultTable).toBeVisible({ timeout: 10000 });
  }

  async selectSalesOrderInResults(docNo) {
    if (!docNo) {
      throw new Error('Unable to select credit-limit row because Sales Order docNo is empty');
    }

    const row = await this.findSalesOrderResultRow(docNo);
    await this.expectSalesOrderDocNoVisible(row.rowNumber, docNo);

    const checkbox = await this.findInAllFrames(`#${row.checkboxId}`, 10);
    await checkbox.scrollIntoViewIfNeeded().catch(() => {});
    await expect(checkbox).toBeVisible({ timeout: 10000 });

    const tagName = await checkbox.evaluate((element) => element.tagName.toLowerCase());
    const inputType = await checkbox.evaluate((element) => element.getAttribute('type') || '');

    if (tagName === 'input' && inputType.toLowerCase() === 'checkbox') {
      await checkbox.check({ force: true });
      await expect(checkbox).toBeChecked();
      return;
    }

    await checkbox.click({ force: true });
  }

  async expectSalesOrderDocNoVisible(rowNumber, docNo) {
    const row = await this.findInAllFrames(
      `xpath=//*[@id="dd_u_docnoT1r${rowNumber}"]/ancestor::tr[contains(@class,"tableBoxRow")]`,
      10
    );
    await expect(row).toBeVisible({ timeout: 10000 });

    const docNoInput = await this.findInAllFrames(`#df_u_docnoT1r${rowNumber}`, 10);
    await expect(docNoInput).toHaveValue(docNo);

    const docNoLabel = await this.findInAllFrames(`#dd_u_docnoT1r${rowNumber}`, 10);
    await expect(docNoLabel).toBeVisible({ timeout: 10000 });
    await expect(docNoLabel).toHaveText(docNo);
  }

  async selectApprovedDecision() {
    const decisionSelect = await this.findInAllFrames('select#df_u_decision[name="df_u_decision"]', 20);
    await decisionSelect.selectOption('FA').catch(async () => {
      await decisionSelect.selectOption({ index: 1 });
    });
    await expect(decisionSelect).toHaveValue('FA');
  }

  async selectApprovedStatus() {
    const approvalStatusSelect = await this.findInAllFrames(
      'select#df_u_approval_status[name="df_u_approval_status"]',
      20
    );
    await approvalStatusSelect.selectOption('A');
    await expect(approvalStatusSelect).toHaveValue('A');
  }

  async fillRemarks(remarks) {
    const remarksInput = await this.findInAllFrames(
      'input#df_u_remarks[name="df_u_remarks"]',
      20
    );
    await remarksInput.fill(remarks);
    await expect(remarksInput).toHaveValue(remarks);
  }

  buildApprovalRemarks(userId, docNo) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `Approve Playwright Automation by: ${userId} for document : ${docNo} ${yyyy}-${mm}-${dd}`;
  }

  async clickAdd() {
    const addButton = await this.findInAllFrames('xpath=//*[@id="btnAdd"]', 20);
    await addButton.click();
  }

  async expectApprovalSucceeded() {
    const statusMessage = await this.findInAllFrames('label#statusMsg', 20);
    await expect(statusMessage).toHaveText(/Operation ended successfully\./i, {
      timeout: 20000
    });

    const docStatus = await this.findInAllFrames('select#df_docstatus[name="df_docstatus"]', 20);
    await expect
      .poll(
        async () => {
          const value = await docStatus.inputValue().catch(() => '');
          const label = await docStatus.locator('option:checked').textContent().catch(() => '');
          return `${value}|${(label || '').trim()}`;
        },
        { timeout: 20000 }
      )
      .toContain('O|Open');
  }

  async findSalesOrderResultRow(docNo) {
    const resultListXPath =
      '/html/body/form[1]/table[2]/tbody/tr/td[2]/table/tbody/tr[4]/td/div/div[1]/div/div[2]';

    for (let attempt = 0; attempt < 10; attempt += 1) {
      for (const frame of this.page.frames()) {
        try {
          if (frame.isDetached()) continue;

          const row = await frame.evaluate(
            ({ resultListXPath, docNo }) => {
              const list = document.evaluate(
                resultListXPath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
              ).singleNodeValue;

              if (!list) return null;

              const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
              const findRowNumber = (element) => {
                let current = element;
                while (current && current !== list.parentElement) {
                  const rowSource = [
                    current.id,
                    current.getAttribute?.('name'),
                    current.getAttribute?.('onclick'),
                    current.getAttribute?.('for')
                  ]
                    .filter(Boolean)
                    .join(' ');
                  const match = rowSource.match(/T1r(\d+)/i);
                  if (match) return match[1];
                  current = current.parentElement;
                }
                return null;
              };

              const candidates = Array.from(list.querySelectorAll('input, label, span, div, td, a'))
                .map((element) => ({
                  element,
                  value: normalize(element.value || element.innerText || element.textContent)
                }))
                .filter((candidate) => candidate.value.includes(docNo));

              for (const candidate of candidates) {
                const rowNumber = findRowNumber(candidate.element);
                if (!rowNumber) continue;

                const checkboxId = `df_u_selectedT1r${rowNumber}`;
                if (!document.getElementById(checkboxId)) continue;

                const docNoInput = document.getElementById(`df_u_docnoT1r${rowNumber}`);
                const docNoLabel = document.getElementById(`dd_u_docnoT1r${rowNumber}`);
                if (!docNoInput || docNoInput.value !== docNo) continue;
                if (!docNoLabel || normalize(docNoLabel.innerText || docNoLabel.textContent) !== docNo) {
                  continue;
                }

                return {
                  rowNumber,
                  checkboxId,
                  matchedText: candidate.value
                };
              }

              return null;
            },
            { resultListXPath, docNo }
          );

          if (row) return row;
        } catch (e) {
          continue;
        }
      }
      await this.page.waitForTimeout(500);
    }

    throw new Error(`Sales Order docNo not found in credit-limit results: ${docNo}`);
  }
}

module.exports = { CreditLimitPage };
