// This is for working with files and folders.
const fs = require('fs');
// This is for building safe file and folder paths.
const path = require('path');

function requireTestId(testId, helperName) {
  const resolvedTestId = String(testId || '').trim();
  if (!resolvedTestId) {
    throw new Error(`${helperName} requires an explicit testId.`);
  }

  return resolvedTestId;
}

function getSummaryPath(testId) {
  const resolvedTestId = requireTestId(testId, 'getSummaryPath');
  return path.resolve(process.cwd(), 'test-results', `${resolvedTestId}-summary.json`);
}

function ensureSummaryDir(testId) {
  fs.mkdirSync(path.dirname(getSummaryPath(testId)), { recursive: true });
}

function writeSummary(summary, testId = summary?.testId) {
  const resolvedTestId = requireTestId(testId, 'writeSummary');
  ensureSummaryDir(resolvedTestId);
  fs.writeFileSync(getSummaryPath(resolvedTestId), JSON.stringify(summary, null, 2));
}

function readSummary(testId) {
  const resolvedTestId = requireTestId(testId, 'readSummary');
  const summaryPath = getSummaryPath(resolvedTestId);
  if (!fs.existsSync(summaryPath)) {
    return {
      testId: resolvedTestId,
      title: resolvedTestId,
      status: 'running',
      modules: []
    };
  }

  return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
}

function startRunSummary(testId, title) {
  const resolvedTestId = requireTestId(testId, 'startRunSummary');
  writeSummary({
    testId: resolvedTestId,
    title: title || resolvedTestId,
    status: 'running',
    startedAt: new Date().toISOString(),
    modules: []
  }, resolvedTestId);
}

function recordModuleDocNo(
  moduleName,
  docNo,
  status = 'Completed',
  testId,
  remarks = ''
) {
  const resolvedTestId = requireTestId(testId, 'recordModuleDocNo');
  const summary = readSummary(resolvedTestId);
  const modules = summary.modules.filter((entry) => entry.module !== moduleName);
  modules.push({
    module: moduleName,
    docNo: docNo || '',
    status,
    remarks,
    recordedAt: new Date().toISOString()
  });

  writeSummary({
    ...summary,
    modules,
    updatedAt: new Date().toISOString()
  }, resolvedTestId);
}

function finishRunSummary(status = 'success', testId) {
  const resolvedTestId = requireTestId(testId, 'finishRunSummary');
  const summary = readSummary(resolvedTestId);
  writeSummary({
    ...summary,
    status,
    finishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, resolvedTestId);
}

function getModuleDocNo(moduleName, testId) {
  const summary = readSummary(requireTestId(testId, 'getModuleDocNo'));
  return summary.modules.find((entry) => entry.module === moduleName)?.docNo || '';
}

module.exports = {
  finishRunSummary,
  getModuleDocNo,
  getSummaryPath,
  recordModuleDocNo,
  readSummary,
  requireTestId,
  startRunSummary
};
