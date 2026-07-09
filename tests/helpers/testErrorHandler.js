const { takeStepScreenshot } = require('./screenshots');

async function handleTestFailure(page, testName, error, testId) {

  console.error(`
====================================
❌ TEST FAILED

Test:
${testName}

Error:
${error.message}

====================================
`);

  await takeStepScreenshot(
    page,
    testName,
    'FAILED_ERROR'
  );
}

module.exports = {
  handleTestFailure
};