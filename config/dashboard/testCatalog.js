import fs from 'fs';
import path from 'path';
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

export function getTestCatalog() {
  const testsDir = path.resolve(process.cwd(), 'tests');
  const specs = getSpecFiles(testsDir);
  const modulesById = new Map();
  const testsBySpec = {};

  for (const spec of specs) {
    const moduleId = getModuleId(spec);
    const moduleConfig = testModules[moduleId] || {};
    const resultId = getFallbackResultId(spec);
    const result = testResults[resultId];
    const test = {
      id: resultId,
      label: result?.title || slugToTitle(spec.split('/').pop().replace(/\.js$/i, '')),
      spec,
      resultId,
      hasResultDetails: Boolean(result)
    };

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
    testsBySpec[spec] = test;
  }

  const modules = [...modulesById.values()]
    .map((module) => ({
      ...module,
      tests: module.tests.sort((a, b) => a.label.localeCompare(b.label))
    }))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));

  return {
    modules,
    tests: modules.flatMap((module) => module.tests),
    testsBySpec
  };
}
