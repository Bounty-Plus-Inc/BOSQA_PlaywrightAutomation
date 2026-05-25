require('../../helpers/env');

const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.userId = page.locator('[name="df_userid"]');
    this.password = page.locator('[name="df_password"]');
    this.loginButton = page.locator('#btnLogin');
  }

  async goto() {
    await this.page.goto(
      '/bpi/login.php?userAction=logout&requestorURL=/bpi/index.php&objectcode=&df_code=&df_docno='
    );
  }

  async loginAs(
    userId = process.env.BPI_USERID || 'playwrightAut',
    password = process.env.BPI_PASSWORD || 'playwrightPass'
  ) {
    await this.goto();
    await this.setExactValue(this.userId, userId);
    await expect(this.userId).toHaveValue(userId);

    await this.setExactValue(this.password, password);
    await expect(this.password).toHaveValue(password);

    await this.page.waitForTimeout(250);
    await this.loginButton.click();
    await this.page.waitForURL(/index\.php/, { waitUntil: 'load' });
    return this.page;
  }

  async expectCompanyVisible(companyName = 'Bounty Plus Inc.') {
    const found = await this.hasVisibleTextInAnyFrame(companyName);
    expect(found).toBeTruthy();
  }

  async setExactValue(locator, value) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await locator.click();
      await locator.press('Control+A').catch(() => {});
      await locator.press('Backspace').catch(() => {});
      await locator.pressSequentially(value, { delay: 50 });
      const current = await locator.inputValue().catch(() => '');
      if (current === value) return;
      await locator.fill(value);
      const fallback = await locator.inputValue().catch(() => '');
      if (fallback === value) return;
    }
    throw new Error(`Unable to set exact value "${value}"`);
  }
}

module.exports = { LoginPage };
