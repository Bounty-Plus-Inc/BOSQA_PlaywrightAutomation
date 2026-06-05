// This is for working with files and folders.
const fs = require('fs');
// This is for building safe file and folder paths.
const path = require('path');

function safeFileName(value) {
  return String(value || 'document')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    || 'document';
}

function getCapturedDocumentPath(transactionName, documentNo) {
  return path.resolve(
    process.cwd(),
    'test-results',
    'captured-documents',
    safeFileName(transactionName),
    `${safeFileName(documentNo)}.json`
  );
}

function writeCapturedDocument(transactionName, documentNo, data) {
  const filePath = getCapturedDocumentPath(transactionName, documentNo);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        transactionName,
        documentNo,
        capturedAt: new Date().toISOString(),
        ...data
      },
      null,
      2
    )
  );
  return filePath;
}

function readCapturedDocument(transactionName, documentNo) {
  const filePath = getCapturedDocumentPath(transactionName, documentNo);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

module.exports = {
  getCapturedDocumentPath,
  readCapturedDocument,
  writeCapturedDocument
};
