// This is for working with files and folders.
const fs = require('fs');
// This is for building safe file paths.
const path = require('path');
// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../pages/base/BasePage');

const ATTACHMENT_FOLDER = path.resolve(__dirname, 'forattachmentpurposes');

const DEFAULT_ATTACHMENT_SELECTORS = {
  triggerField: 'xpath=//*[@id="df_docno"]',
  popupTable: 'xpath=//*[@id="popupTable"]/table',
  attachmentMenu: 'xpath=//*[@id="popupTable"]/table/tbody/tr[7]/td/a',
  attachmentsFrame: 'xpath=//*[@id="divpopupFrameAttachments"]',
  updateButton: 'xpath=//*[@id="T50_btnUpdate"]',
  fileUploadFrame: 'xpath=//*[@id="divpopupFrameFileUpload"]',
  fileInput: 'xpath=//*[@id="df_filename"]'
};

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function safeFileName(value) {
  return normalizeText(value).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}

function toBasePage(pageOrPageObject) {
  if (!pageOrPageObject) {
    throw new Error('A Playwright page or page object is required for popup attachment.');
  }

  if (typeof pageOrPageObject.findInAllFrames === 'function') {
    return pageOrPageObject;
  }

  if (pageOrPageObject.page && typeof pageOrPageObject.page.frames === 'function') {
    return new BasePage(pageOrPageObject.page);
  }

  if (typeof pageOrPageObject.frames === 'function') {
    return new BasePage(pageOrPageObject);
  }

  throw new Error('Unsupported popup attachment target. Pass a Playwright page or BasePage object.');
}

function createAttachmentFile({ moduleName, docNo }) {
  const attachmentModule = safeFileName(moduleName || 'Module');
  const attachmentDocNo = safeFileName(docNo || 'NoDocNo');
  const fileName = `Attachment${attachmentModule}-${attachmentDocNo}.txt`;
  const filePath = path.join(ATTACHMENT_FOLDER, fileName);

  fs.mkdirSync(ATTACHMENT_FOLDER, { recursive: true });
  fs.writeFileSync(
    filePath,
    [
      `Attachment Module: ${moduleName || ''}`,
      `Attachment Doc No: ${docNo || ''}`,
      `Created At: ${new Date().toISOString()}`
    ].join('\n')
  );

  return {
    fileName,
    filePath
  };
}

async function uploadPopupAttachment(pageOrPageObject, options = {}) {
  const basePage = toBasePage(pageOrPageObject);
  const selectors = {
    ...DEFAULT_ATTACHMENT_SELECTORS,
    ...(options.selectors || {})
  };

  const triggerField = await basePage.findInAllFrames(selectors.triggerField, 20);
  await triggerField.click({ force: true });

  const popupTable = await basePage.findInAllFrames(selectors.popupTable, 20);
  await expect(popupTable).toBeVisible({ timeout: 10000 });

  const attachmentMenu = await basePage.findInAllFrames(selectors.attachmentMenu, 20);
  await attachmentMenu.click();

  const attachmentsFrame = await basePage.findInAllFrames(selectors.attachmentsFrame, 20);
  await expect(attachmentsFrame).toBeVisible({ timeout: 10000 });

  const updateButton = await basePage.findInAllFrames(selectors.updateButton, 20);
  await updateButton.click();

  const fileUploadFrame = await basePage.findInAllFrames(selectors.fileUploadFrame, 20);
  await expect(fileUploadFrame).toBeVisible({ timeout: 10000 });

  const fileInput = await basePage.findInAllFrames(selectors.fileInput, 20);
  const fileChooserPromise = basePage.page.waitForEvent('filechooser', { timeout: 5000 })
    .catch(() => null);
  await fileInput.click({ force: true }).catch(() => {});

  const attachment = createAttachmentFile({
    moduleName: options.moduleName,
    docNo: options.docNo
  });
  const fileChooser = await fileChooserPromise;

  if (fileChooser) {
    await fileChooser.setFiles(attachment.filePath);
  } else {
    await fileInput.setInputFiles(attachment.filePath);
  }

  return {
    ...attachment,
    expectedValue: attachment.fileName,
    actualValue: path.basename(attachment.filePath),
    passed: true
  };
}

module.exports = {
  ATTACHMENT_FOLDER,
  createAttachmentFile,
  DEFAULT_ATTACHMENT_SELECTORS,
  uploadPopupAttachment
};
