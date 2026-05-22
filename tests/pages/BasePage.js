class BasePage {
  constructor(page) {
    this.page = page;
  }

  async findInAllFrames(selector, maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      for (const frame of this.page.frames()) {
        try {
          if (frame.isDetached()) continue;
          const element = frame.locator(selector);
          if ((await element.count()) > 0) return element.first();
        } catch (e) {
          continue;
        }
      }
      await this.page.waitForTimeout(500);
    }
    throw new Error(`Element not found after retries: ${selector}`);
  }

  async findVisibleInAllFrames(selector, maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      for (const frame of this.page.frames()) {
        try {
          if (frame.isDetached()) continue;
          const elements = frame.locator(selector);
          const count = await elements.count();
          for (let index = 0; index < count; index += 1) {
            const element = elements.nth(index);
            if (await element.isVisible().catch(() => false)) return element;
          }
        } catch (e) {
          continue;
        }
      }
      await this.page.waitForTimeout(500);
    }
    throw new Error(`Visible element not found after retries: ${selector}`);
  }

  async clickIfExists(selector, attempts = 4) {
    try {
      const button = await this.findInAllFrames(selector, attempts);
      await button.click();
      return true;
    } catch (e) {
      return false;
    }
  }

  async triggerClickInAnyFrame(selector) {
    for (const frame of this.page.frames()) {
      try {
        if (frame.isDetached()) continue;
        const triggered = await frame.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          if (typeof el.click === 'function') el.click();
          return true;
        }, selector);
        if (triggered) return true;
      } catch (e) {
        continue;
      }
    }
    return false;
  }

  async ensureVisibleInAnyFrame(selector) {
    for (const frame of this.page.frames()) {
      try {
        if (frame.isDetached()) continue;
        const updated = await frame.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          el.removeAttribute('hidden');
          el.style.display = 'inline-block';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
          return true;
        }, selector);
        if (updated) return true;
      } catch (e) {
        continue;
      }
    }
    return false;
  }

  async hasVisibleTextInAnyFrame(text, timeout = 2000) {
    for (const frame of this.page.frames()) {
      const hasText = await frame
        .locator(`text=${text}`)
        .first()
        .isVisible({ timeout })
        .catch(() => false);
      if (hasText) return true;
    }
    return false;
  }
}

module.exports = { BasePage };
