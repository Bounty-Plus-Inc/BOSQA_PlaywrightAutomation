// This is for working with files and folders.
const fs = require('fs');
// This is for building safe file and folder paths.
const path = require('path');

function getSummaryPath(testId = 'sales-so-with-credit-limit') {
  return path.resolve(process.cwd(), 'test-results', `${testId}-summary.json`);
}

function ensureSummaryDir(testId) {
  fs.mkdirSync(path.dirname(getSummaryPath(testId)), { recursive: true });
}

function writeSummary(summary, testId = summary.testId || 'sales-so-with-credit-limit') {
  ensureSummaryDir(testId);
  fs.writeFileSync(getSummaryPath(testId), JSON.stringify(summary, null, 2));
}

function readSummary(testId = 'sales-so-with-credit-limit') {
  const summaryPath = getSummaryPath(testId);
  if (!fs.existsSync(summaryPath)) {
    return {
      testId,
      title:
        testId === 'sales-delivery-order'
          ? 'Delivery Order'
          : testId === 'admin-approval'
            ? 'Approval'
            : 'SO with Credit Limit',
      status: 'running',
      modules: []
    };
  }

  return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
}

function startRunSummary(testId = 'sales-so-with-credit-limit', title = 'SO with Credit Limit') {
  writeSummary({
    testId,
    title,
    status: 'running',
    startedAt: new Date().toISOString(),
    modules: []
  }, testId);
}

function recordModuleDocNo(moduleName, docNo, status = 'Completed', testId = 'sales-so-with-credit-limit') {
  const summary = readSummary(testId);
  const modules = summary.modules.filter((entry) => entry.module !== moduleName);
  modules.push({
    module: moduleName,
    docNo: docNo || '',
    status,
    recordedAt: new Date().toISOString()
  });

  writeSummary({
    ...summary,
    modules,
    updatedAt: new Date().toISOString()
  }, testId);
}

function finishRunSummary(status = 'success', testId = 'sales-so-with-credit-limit') {
  const summary = readSummary(testId);
  writeSummary({
    ...summary,
    status,
    finishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, testId);
}

function getModuleDocNo(moduleName, testId = 'sales-so-with-credit-limit') {
  const summary = readSummary(testId);
  return summary.modules.find((entry) => entry.module === moduleName)?.docNo || '';
}

module.exports = {
  finishRunSummary,
  getModuleDocNo,
  recordModuleDocNo,
  startRunSummary
};
