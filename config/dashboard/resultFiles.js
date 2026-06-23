import fs from 'fs';
import path from 'path';
import { testResults } from './testResults.js';

const MIN_VIDEO_BYTES = 50 * 1024;

function isStableVideo(filePath) {
  if (!filePath.toLowerCase().endsWith('.webm')) return false;
  if (filePath.split(path.sep).some((part) => part.startsWith('.playwright-artifacts'))) {
    return false;
  }

  const stat = fs.statSync(filePath);
  return stat.size >= MIN_VIDEO_BYTES;
}

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

      if (entry.isFile() && isStableVideo(entryPath)) {
        const stat = fs.statSync(entryPath);
        videos.push({
          path: entryPath,
          modifiedAt: stat.mtimeMs,
          size: stat.size
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

    const matchedSpecificTerms = normalizedTerms
      .filter((term) => term !== testId)
      .filter((term) => entryName.includes(term));
    const score = matchedSpecificTerms.reduce((total, term) => total + term.length, 0);
    const videoPath = findLatestVideo(path.join(testResultsDir, entry.name));
    if (videoPath) {
      const stat = fs.statSync(videoPath);
      candidates.push({
        path: videoPath,
        modifiedAt: stat.mtimeMs,
        size: stat.size,
        score
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score || b.modifiedAt - a.modifiedAt)[0]?.path || null;
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
