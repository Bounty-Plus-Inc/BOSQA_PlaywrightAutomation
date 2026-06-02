import fs from 'fs';
import path from 'path';
import { testResults } from './testResults.js';

export function findLatestVideo(rootDir) {
  if (!fs.existsSync(rootDir)) return null;

  const videos = [];
  const visit = (folder) => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const entryPath = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith('.webm')) {
        videos.push({
          path: entryPath,
          modifiedAt: fs.statSync(entryPath).mtimeMs
        });
      }
    }
  };

  visit(rootDir);
  return videos.sort((a, b) => b.modifiedAt - a.modifiedAt)[0]?.path || null;
}

export function findLatestTestVideo(testId, searchTerms = []) {
  const testResultsDir = path.resolve(process.cwd(), 'test-results');
  if (!fs.existsSync(testResultsDir)) return null;

  const normalizedTerms = [testId, ...searchTerms]
    .filter(Boolean)
    .map((term) => String(term).toLowerCase());
  const candidates = [];
  for (const entry of fs.readdirSync(testResultsDir, { withFileTypes: true })) {
    const entryName = entry.name.toLowerCase();
    if (!entry.isDirectory() || !normalizedTerms.some((term) => entryName.includes(term))) {
      continue;
    }

    const videoPath = findLatestVideo(path.join(testResultsDir, entry.name));
    if (videoPath) {
      candidates.push({
        path: videoPath,
        modifiedAt: fs.statSync(videoPath).mtimeMs
      });
    }
  }

  return candidates.sort((a, b) => b.modifiedAt - a.modifiedAt)[0]?.path || null;
}

export function readRunSummary(testId) {
  const result = testResults[testId];
  if (!result) return null;

  const summaryPath = path.resolve(process.cwd(), `test-results/${testId}-summary.json`);
  if (!fs.existsSync(summaryPath)) {
    return {
      testId,
      title: result.title,
      status: 'not-run',
      modules: []
    };
  }

  return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
}

export function imageToDataUri(imagePath) {
  const image = fs.readFileSync(imagePath);
  return `data:image/png;base64,${image.toString('base64')}`;
}

export function getResultSteps(testId) {
  const result = testResults[testId];
  if (!result) return [];

  const screenshotsDir = path.resolve(process.cwd(), result.screenshotsDir);
  if (!fs.existsSync(screenshotsDir)) return [];

  const availableScreenshots = new Set(
    fs.readdirSync(screenshotsDir).filter((fileName) => fileName.toLowerCase().endsWith('.png'))
  );

  return Object.keys(result.steps)
    .filter((fileName) => availableScreenshots.has(fileName))
    .map((fileName) => {
      const screenshotPath = path.resolve(screenshotsDir, fileName);
      return {
        fileName,
        title: result.steps[fileName].title,
        description: result.steps[fileName].description,
        imageDataUri: imageToDataUri(screenshotPath)
      };
    });
}
