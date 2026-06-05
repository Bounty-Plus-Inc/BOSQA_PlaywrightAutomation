// This is for working with files and folders.
const fs = require('fs');
// This is for building safe file and folder paths.
const path = require('path');

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function toWords(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-z0-9]+/i)
    .map((word) => word.trim())
    .filter(Boolean);
}

function toSlug(value) {
  return toWords(value).join('-').toLowerCase();
}

function toPascalCase(value) {
  return toWords(value)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeNewFile(filePath, content, createdFiles, skippedFiles) {
  ensureDir(filePath);
  if (fs.existsSync(filePath)) {
    skippedFiles.push(filePath);
    return;
  }

  fs.writeFileSync(filePath, content);
  createdFiles.push(filePath);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content, changedFiles) {
  fs.writeFileSync(filePath, content);
  changedFiles.push(filePath);
}

function quoteJs(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function updateTestModules(rootDir, moduleId, moduleLabel, changedFiles) {
  const filePath = path.join(rootDir, 'config', 'dashboard', 'testModules.js');
  const content = readFile(filePath);
  const moduleKeyPattern = new RegExp(
    `(?:^|\\n)\\s*(?:${moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${quoteJs(moduleId)}):\\s*{`
  );
  if (moduleKeyPattern.test(content)) return;

  const orders = [...content.matchAll(/order:\s*(\d+)/g)].map((match) => Number(match[1]));
  const nextOrder = orders.length ? Math.max(...orders) + 10 : 10;
  const entry = `,\n  ${quoteJs(moduleId)}: {\n    label: ${quoteJs(moduleLabel)},\n    icon: 'file',\n    order: ${nextOrder}\n  }`;
  const nextContent = content.replace(/\n};\s*$/, `${entry}\n};\n`);
  writeFile(filePath, nextContent, changedFiles);
}

function updateTestResults(rootDir, scaffold, changedFiles) {
  const filePath = path.join(rootDir, 'config', 'dashboard', 'testResults.js');
  const content = readFile(filePath);
  if (content.includes(`'${scaffold.testId}'`)) return;

  const stepName = `00_${scaffold.upperId}_OPENED.png`;
  const entry = `  ${quoteJs(scaffold.testId)}: {
    title: ${quoteJs(scaffold.testLabel)},
    screenshotsDir: ${quoteJs(`test-results/screenshots/${scaffold.moduleId}_${scaffold.testSlug}`)},
    steps: {
      ${quoteJs(stepName)}: {
        title: ${quoteJs(`${scaffold.testLabel} opened`)},
        description: ${quoteJs(`The ${scaffold.moduleLabel} ${scaffold.testLabel} screen opened successfully.`)}
      }
    }
  },
`;

  const marker = "  'utilities-find-document':";
  const nextContent = content.includes(marker)
    ? content.replace(marker, `${entry}${marker}`)
    : content.replace(/\n};\s*$/, `,\n${entry.slice(0, -2)}\n};\n`);

  writeFile(filePath, nextContent, changedFiles);
}

function getNavigationTemplate(className) {
  return `// This is for shared page object behavior.
const { BasePage } = require('../BasePage');

class ${className} extends BasePage {
  async open() {
    throw new Error(${quoteJs(`TODO: Add menu navigation selectors for ${className}.`)});

    // Example:
    // const mainTab = await this.findInAllFrames('a[onclick*="selectTab(\\'SALES\\')"]', 10);
    // await mainTab.click();
    // const menuItem = await this.findInAllFrames('a#menuYourModule', 20);
    // await menuItem.click();
  }
}

module.exports = { ${className} };
`;
}

function getPageObjectTemplate(className) {
  return `// This is for using Playwright test and assertion tools.
const { expect } = require('@playwright/test');
// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');

class ${className} extends BasePage {
  async expectLoaded() {
    await expect
      .poll(
        async () => {
          const bodyFrame = this.page.frame({ name: 'iframeBody' });
          return bodyFrame ? bodyFrame.url() : this.page.url();
        },
        { timeout: 20000 }
      )
      .not.toBe('');
  }
}

module.exports = { ${className} };
`;
}

function getSpecTemplate(scaffold) {
  return `// This is for using Playwright test and assertion tools.
const { test } = require('@playwright/test');
// This is for logging in before test steps run.
const { LoginPage } = require('../pages/base/LoginPage');
// This is for opening the target BPI module.
const { ${scaffold.navigationClass} } = require('../pages/base/moduleNavigation/${scaffold.navigationClass}');
// This is for transaction screen actions and checks.
const { ${scaffold.pageClass} } = require('../pages/transactions/${scaffold.pageClass}');
// This is for saving step screenshots.
const { takeStepScreenshot } = require('../helpers/screenshots');
// This is for recording the test result summary.
const {
  finishRunSummary,
  recordModuleDocNo,
  startRunSummary
} = require('../helpers/runSummary');

test(${quoteJs(scaffold.testLabel)}, async ({ page }) => {
  test.setTimeout(120000);

  const testId = ${quoteJs(scaffold.testId)};
  const testName = ${quoteJs(`${scaffold.moduleId} ${scaffold.testSlug}`)};
  const loginPage = new LoginPage(page);
  const moduleNavigation = new ${scaffold.navigationClass}(page);
  const transactionPage = new ${scaffold.pageClass}(page);

  startRunSummary(testId, ${quoteJs(scaffold.testLabel)});

  await loginPage.loginAs();
  await moduleNavigation.open();
  await transactionPage.expectLoaded();
  recordModuleDocNo(${quoteJs(scaffold.moduleLabel)}, '', 'Opened', testId);
  await takeStepScreenshot(page, testName, ${quoteJs(`00_${scaffold.upperId}_OPENED`)});

  finishRunSummary('success', testId);
});
`;
}

function getGuideTemplate(scaffold, createdFiles, changedFiles, skippedFiles) {
  const list = (items) => (items.length ? items.map((item) => `- ${item}`).join('\n') : '- None');
  return `Scaffold Guide

Module: ${scaffold.moduleLabel}
Module ID: ${scaffold.moduleId}
Test Case: ${scaffold.testLabel}
Test ID: ${scaffold.testId}

Created Files:
${list(createdFiles)}

Updated Files:
${list(changedFiles)}

Skipped Existing Files:
${list(skippedFiles)}

What each file does:

- tests/${scaffold.moduleId}/${scaffold.testSlug}.spec.js
  Main Playwright test flow. Fill in the actual business steps here.

- tests/pages/base/moduleNavigation/${scaffold.navigationClass}.js
  Opens the target BPI module. Replace the TODO with real menu selectors.

- tests/pages/transactions/${scaffold.pageClass}.js
  Page object for screen-specific actions and assertions.

- tests/lineItemReaders/documentLineItems.js
  Shared universal line-item reader used by Find Document replicate mode.

- config/dashboard/testModules.js
  Adds the dashboard module button when the module is new.

- config/dashboard/testResults.js
  Adds dashboard result metadata and screenshot names.

Next Steps:

1. Fill in menu navigation selectors in tests/pages/base/moduleNavigation/${scaffold.navigationClass}.js.
2. Add transaction actions in tests/pages/transactions/${scaffold.pageClass}.js.
3. Add test steps in tests/${scaffold.moduleId}/${scaffold.testSlug}.spec.js.
4. Run: node --check tests/${scaffold.moduleId}/${scaffold.testSlug}.spec.js
5. Run: npm run build
6. Run: npx playwright test tests/${scaffold.moduleId}/${scaffold.testSlug}.spec.js --headed
`;
}

function createTestScaffold(options = {}, rootDir = process.cwd()) {
  const moduleLabel = options.module || options.moduleLabel;
  const testLabel = options.test || options.testLabel || 'Standard Process';

  if (!moduleLabel) {
    throw new Error('Module name is required.');
  }

  const moduleId = toSlug(moduleLabel);
  const testSlug = toSlug(testLabel);
  if (!moduleId) {
    throw new Error('Module name must contain letters or numbers.');
  }

  if (!testSlug) {
    throw new Error('Test case name must contain letters or numbers.');
  }

  const testId = `${moduleId}-${testSlug}`;
  const navigationClass = `${toPascalCase(moduleLabel)}MenuPage`;
  const pageClass = `${toPascalCase(testLabel)}Page`;
  const upperId = `${moduleId}_${testSlug}`.replace(/[^a-z0-9]+/gi, '_').toUpperCase();
  const scaffold = {
    moduleLabel,
    moduleId,
    testLabel,
    testSlug,
    testId,
    navigationClass,
    pageClass,
    upperId
  };

  const createdFiles = [];
  const changedFiles = [];
  const skippedFiles = [];

  writeNewFile(
    path.join(rootDir, 'tests', moduleId, `${testSlug}.spec.js`),
    getSpecTemplate(scaffold),
    createdFiles,
    skippedFiles
  );
  writeNewFile(
    path.join(rootDir, 'tests', 'pages', 'base', 'moduleNavigation', `${navigationClass}.js`),
    getNavigationTemplate(navigationClass),
    createdFiles,
    skippedFiles
  );
  writeNewFile(
    path.join(rootDir, 'tests', 'pages', 'transactions', `${pageClass}.js`),
    getPageObjectTemplate(pageClass),
    createdFiles,
    skippedFiles
  );
  updateTestModules(rootDir, moduleId, moduleLabel, changedFiles);
  updateTestResults(rootDir, scaffold, changedFiles);

  const guidePath = path.join(
    rootDir,
    'docs',
    'generated',
    `${moduleId}-${testSlug}-scaffold.txt`
  );
  writeNewFile(
    guidePath,
    getGuideTemplate(scaffold, createdFiles, changedFiles, skippedFiles),
    createdFiles,
    skippedFiles
  );

  return {
    ...scaffold,
    guidePath,
    createdFiles,
    changedFiles,
    skippedFiles
  };
}

module.exports = {
  createTestScaffold,
  parseArgs,
  toPascalCase,
  toSlug
};
