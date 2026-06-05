import fs from 'fs';
import path from 'path';
import { readRunSummary } from './resultFiles.js';
import { testModules } from './testModules.js';
import { testResults } from './testResults.js';

function toAppPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function slugToTitle(value) {
  return String(value || '')
    .replace(/\.spec$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSpecFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];

  const specs = [];
  const visit = (folder) => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const entryPath = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.spec.js')) {
        const specPath = toAppPath(path.relative(process.cwd(), entryPath));
        if (specPath.split('/').length >= 3) {
          specs.push(specPath);
        }
      }
    }
  };

  visit(rootDir);
  return specs.sort();
}

function getModuleId(specPath) {
  return specPath.split('/')[1] || 'other';
}

function getFallbackResultId(specPath) {
  const moduleId = getModuleId(specPath);
  const fileName = specPath.split('/').pop().replace(/\.spec\.js$/i, '');
  return `${moduleId}-${fileName}`;
}

function getTestSummary(resultId, hasResultDetails) {
  if (!hasResultDetails) {
    return {
      status: 'not-configured',
      modules: []
    };
  }

  return readRunSummary(resultId);
}

function getModuleStats(tests) {
  return tests.reduce(
    (stats, test) => {
      stats.total += 1;
      if (test.status === 'success') {
        stats.success += 1;
      } else if (test.status === 'not-run') {
        stats.notRun += 1;
      } else if (test.status === 'not-configured') {
        stats.notConfigured += 1;
      } else {
        stats.other += 1;
      }

      return stats;
    },
    {
      total: 0,
      success: 0,
      notRun: 0,
      notConfigured: 0,
      other: 0
    }
  );
}

export function getTestCatalog() {
  const testsDir = path.resolve(process.cwd(), 'tests');
  const specs = getSpecFiles(testsDir);
  const modulesById = new Map();
  const testsBySpec = {};

  const addTest = (moduleId, test) => {
    const moduleConfig = testModules[moduleId] || {};

    if (!modulesById.has(moduleId)) {
      modulesById.set(moduleId, {
        id: moduleId,
        label: moduleConfig.label || slugToTitle(moduleId),
        icon: moduleConfig.icon || 'file',
        order: moduleConfig.order ?? 100,
        tests: []
      });
    }

    modulesById.get(moduleId).tests.push(test);
  };

  for (const spec of specs) {
    const moduleId = getModuleId(spec);
    const resultId = getFallbackResultId(spec);
    const result = testResults[resultId];
    const hasResultDetails = Boolean(result);
    const summary = getTestSummary(resultId, hasResultDetails);
    const test = {
      id: resultId,
      label: result?.title || slugToTitle(spec.split('/').pop().replace(/\.js$/i, '')),
      spec,
      resultId,
      hasResultDetails,
      status: summary?.status || 'not-run',
      modules: summary?.modules || [],
      dataInputs: result?.dataInputs || [],
      actions: result?.actions || [],
      documentRunModes: result?.documentRunModes || [],
      documentNumberInput: Boolean(result?.documentNumberInput),
      utilities: []
    };

    if (!result?.hideFromModules) {
      addTest(moduleId, test);
    }
    testsBySpec[spec] = test;
  }

  const findDocumentTest = Object.values(testsBySpec).find(
    (test) => test.resultId === 'utilities-find-document'
  );
  if (findDocumentTest) {
    for (const action of findDocumentTest.actions || []) {
      if (!action.testResultId) continue;

      const targetTest = Object.values(testsBySpec).find((test) => test.id === action.testResultId);
      if (!targetTest) continue;

      targetTest.utilities.push({
        id: `find-document-${action.id}`,
        label: action.label,
        utilityLabel: findDocumentTest.label,
        spec: findDocumentTest.spec,
        resultId: findDocumentTest.resultId,
        hasResultDetails: findDocumentTest.hasResultDetails,
        status: findDocumentTest.status,
        modules: findDocumentTest.modules,
        documentNumberInput: findDocumentTest.documentNumberInput,
        documentRunModes: findDocumentTest.documentRunModes,
        action: {
          id: action.id,
          label: action.label
        }
      });
    }
  }

  addTest('framework', {
    id: 'framework-scaffold-generator',
    label: 'Scaffold Generator',
    spec: '',
    resultId: 'framework-scaffold-generator',
    hasResultDetails: false,
    status: 'ready',
    modules: [],
    dataInputs: [],
    actions: [],
    documentRunModes: [],
    documentNumberInput: false,
    utilities: [],
    scaffoldGenerator: true
  });

  const modules = [...modulesById.values()]
    .map((module) => {
      const tests = module.tests.sort((a, b) => a.label.localeCompare(b.label));
      return {
        ...module,
        tests,
        stats: getModuleStats(tests)
      };
    })
    .sort((a, b) => {
      if (a.id === 'framework') return 1;
      if (b.id === 'framework') return -1;
      return a.order - b.order || a.label.localeCompare(b.label);
    });

  return {
    modules,
    tests: modules.flatMap((module) => module.tests),
    testsBySpec
  };
}
