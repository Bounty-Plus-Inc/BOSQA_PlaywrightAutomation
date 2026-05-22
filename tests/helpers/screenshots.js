const fs = require('fs');

async function takeStepScreenshot(page, testName, stepName) {
  const folder = `./test-results/screenshots/${testName.replace(/\s+/g, '_')}`;
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  const path = `${folder}/${stepName.replace(/\s+/g, '_')}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`Screenshot taken: ${stepName}`);
}

module.exports = { takeStepScreenshot };
