// This is for working with files and folders.
const fs = require('fs');

const DEFAULT_SCREENSHOT_DELAY_MS = 2500;

async function takeStepScreenshot(page, testName, stepName, delayMs = DEFAULT_SCREENSHOT_DELAY_MS) {
  const folder = `./test-results/screenshots/${testName.replace(/\s+/g, '_')}`;
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  const path = `${folder}/${stepName.replace(/\s+/g, '_')}.png`;
  if (delayMs > 0) {
    await page.waitForTimeout(delayMs);
  }
  await page.screenshot({ path, fullPage: true });
  console.log(`Screenshot taken: ${stepName}`);
}

module.exports = { DEFAULT_SCREENSHOT_DELAY_MS, takeStepScreenshot };
