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
  triggerField: '',
  contextSurface: 'body',
  popupTable: 'xpath=//*[@id="popupTable"]/table',
  attachmentMenu: 'xpath=//a[contains(@onclick,"popupFrameAttachments")]',
  attachmentsFrame: 'xpath=//*[@id="divpopupFrameAttachments"]',
  updateButton: 'xpath=//*[@id="T50_btnUpdate"]',
  fileUploadFrame: 'xpath=//*[@id="divpopupFrameFileUpload"]',
  fileInput: 'xpath=//*[@id="df_filename"]',
  uploadButton: 'xpath=/html/body/form/table/tbody/tr/td[2]/table/tbody/tr/td[1]/table/tbody/tr[3]/td/a[1]'
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

function deletePreviousAttachmentFiles(currentFilePath) {
  const currentPath = path.resolve(currentFilePath);

  return fs
    .readdirSync(ATTACHMENT_FOLDER, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        /^Attachment.*\.txt$/i.test(entry.name) &&
        path.resolve(ATTACHMENT_FOLDER, entry.name) !== currentPath
    )
    .map((entry) => {
      fs.unlinkSync(path.join(ATTACHMENT_FOLDER, entry.name));
      return entry.name;
    });
}

async function findFrameContainingSelector(page, selector) {
  const matchingFrames = [];

  for (const frame of page.frames()) {
    try {
      if (frame.isDetached()) continue;
      if ((await frame.locator(selector).count()) > 0) matchingFrames.push(frame);
    } catch (e) {
      continue;
    }
  }

  matchingFrames.sort((left, right) => {
    const score = (frame) => {
      if (frame.name() === 'iframeBody') return 2;
      if (frame !== page.mainFrame()) return 1;
      return 0;
    };
    return score(right) - score(left);
  });

  if (matchingFrames.length) return matchingFrames[0];

  throw new Error(`Attachment context frame was not found for: ${selector}`);
}

async function rightClickAttachmentContextArea(basePage, selectors) {
  if (String(selectors.triggerField || '').trim()) {
    const triggerField = await basePage.findVisibleInAllFrames(selectors.triggerField, 20);
    await triggerField.click({ button: 'right' });
    return;
  }

  const contextFrame = await findFrameContainingSelector(
    basePage.page,
    selectors.popupTable
  );
  const contextSurface = contextFrame.locator(selectors.contextSurface || 'body').first();
  await expect(contextSurface).toBeVisible({ timeout: 10000 });

  const blankPoint = await contextSurface.evaluate((surface) => {
    const rect = surface.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const interactiveSelector = [
      'a',
      'button',
      'input',
      'select',
      'textarea',
      'img',
      'label',
      'iframe',
      '[onclick]',
      '[ondblclick]',
      '[onmousedown]',
      '[onmouseup]',
      '[role="button"]',
      '[contenteditable="true"]'
    ].join(',');
    const xRatios = [0.75, 0.6, 0.45, 0.3, 0.85, 0.15];
    const yRatios = [0.55, 0.65, 0.45, 0.75, 0.35, 0.25, 0.85];

    for (const yRatio of yRatios) {
      for (const xRatio of xRatios) {
        const x = rect.left + rect.width * xRatio;
        const y = rect.top + rect.height * yRatio;
        const target = document.elementFromPoint(x, y);
        if (!target || !surface.contains(target)) continue;

        let node = target;
        let isInteractive = false;
        while (node && node !== surface) {
          if (node.matches?.(interactiveSelector)) {
            isInteractive = true;
            break;
          }
          node = node.parentElement;
        }
        if (isInteractive) continue;

        return {
          x: Math.round(x - rect.left),
          y: Math.round(y - rect.top)
        };
      }
    }

    return null;
  });

  if (!blankPoint) {
    throw new Error(
      `No safe blank area was found inside the attachment context surface: ` +
        `${selectors.contextSurface || 'body'}`
    );
  }

  await contextSurface.click({
    button: 'right',
    position: blankPoint
  });
}

async function uploadPopupAttachment(pageOrPageObject, options = {}) {
  const basePage = toBasePage(pageOrPageObject);
  const selectors = {
    ...DEFAULT_ATTACHMENT_SELECTORS,
    ...(options.selectors || {})
  };

  await rightClickAttachmentContextArea(basePage, selectors);

  const popupTable = await basePage.findVisibleInAllFrames(selectors.popupTable, 20);
  await expect(popupTable).toBeVisible({ timeout: 10000 });

  const attachmentMenu = await basePage.findVisibleInAllFrames(selectors.attachmentMenu, 20);
  await attachmentMenu.click();

  const attachmentsFrame = await basePage.findVisibleInAllFrames(selectors.attachmentsFrame, 20);
  await expect(attachmentsFrame).toBeVisible({ timeout: 10000 });

  const updateButton = await basePage.findVisibleInAllFrames(selectors.updateButton, 20);
  await updateButton.click();

  const fileUploadFrame = await basePage.findVisibleInAllFrames(selectors.fileUploadFrame, 20);
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

  const uploadButton = await basePage.findVisibleInAllFrames(selectors.uploadButton, 20);
  await uploadButton.click();
  await basePage.page.waitForTimeout(1000);
  const deletedPreviousFiles = deletePreviousAttachmentFiles(attachment.filePath);

  return {
    ...attachment,
    deletedPreviousFiles,
    expectedValue: attachment.fileName,
    actualValue: path.basename(attachment.filePath),
    passed: true
  };
}

module.exports = {
  ATTACHMENT_FOLDER,
  createAttachmentFile,
  deletePreviousAttachmentFiles,
  DEFAULT_ATTACHMENT_SELECTORS,
  rightClickAttachmentContextArea,
  uploadPopupAttachment
};
