import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { sendJson, readJsonBody } from './http.js';
import { buildPdfHtml, safeFileName } from './pdfBuilder.js';
import { getResultSteps, findLatestTestVideo, readRunSummary } from './resultFiles.js';
import { getTestCatalog } from './testCatalog.js';
import { testResults } from './testResults.js';

function toSlug(value) {
  return String(value || '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function getVideoSearchTerms(testId) {
  const test = getTestCatalog().tests.find((entry) => entry.resultId === testId);
  if (!test) return [];

  const specParts = test.spec.split('/');
  const moduleName = specParts[1] || '';
  const specName = (specParts.pop() || '').replace(/\.spec\.js$/i, '');

  return [
    `${moduleName}-${specName}`,
    specName,
    toSlug(test.label)
  ];
}

function removeInsideTestResults(targetPath) {
  const testResultsDir = path.resolve(process.cwd(), 'test-results');
  const resolvedTarget = path.resolve(targetPath);

  if (!resolvedTarget.startsWith(testResultsDir) || !fs.existsSync(resolvedTarget)) {
    return false;
  }

  fs.rmSync(resolvedTarget, { recursive: true, force: true });
  return true;
}

function clearTestResultFiles(test) {
  const removed = [];
  const result = testResults[test.resultId];
  const summaryPath = path.resolve(process.cwd(), 'test-results', `${test.resultId}-summary.json`);

  if (removeInsideTestResults(summaryPath)) {
    removed.push(summaryPath);
  }

  if (result?.screenshotsDir) {
    const screenshotsDir = path.resolve(process.cwd(), result.screenshotsDir);
    if (removeInsideTestResults(screenshotsDir)) {
      removed.push(screenshotsDir);
    }
  }

  const testResultsDir = path.resolve(process.cwd(), 'test-results');
  if (!fs.existsSync(testResultsDir)) return removed;

  const terms = [test.resultId, ...getVideoSearchTerms(test.resultId)]
    .filter(Boolean)
    .map((term) => String(term).toLowerCase());

  for (const entry of fs.readdirSync(testResultsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const entryName = entry.name.toLowerCase();
    if (!terms.some((term) => entryName.includes(term))) continue;

    const entryPath = path.join(testResultsDir, entry.name);
    if (removeInsideTestResults(entryPath)) {
      removed.push(entryPath);
    }
  }

  return removed;
}

export function createPlaywrightRunnerApi() {
  return {
    name: 'playwright-runner-api',
    configureServer(server) {
      server.middlewares.use('/api/test-catalog', (req, res) => {
        const catalog = getTestCatalog();
        sendJson(res, 200, {
          modules: catalog.modules,
          tests: catalog.tests
        });
      });

      server.middlewares.use('/api/run-test', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' });
          return;
        }

        let payload;
        try {
          payload = await readJsonBody(req);
        } catch (error) {
          sendJson(res, 400, { error: 'Invalid JSON body' });
          return;
        }

        const allowedModes = new Set(['headless(On Testing Phase)', 'headed', 'ui']);
        const spec = payload.spec;
        const mode = payload.mode;
        const itemCount = Math.min(
          Math.max(Number.parseInt(payload.itemCount ?? '1', 10) || 1, 1),
          20
        );

        if (!getTestCatalog().testsBySpec[spec]) {
          sendJson(res, 400, { error: 'Unknown test selected' });
          return;
        }

        if (!allowedModes.has(mode)) {
          sendJson(res, 400, { error: 'Unknown run mode selected' });
          return;
        }

        const modeArgs = mode === 'ui' ? ['--ui'] : mode === 'headed' ? ['--headed'] : [];
        const child = spawn('npx', ['playwright', 'test', spec, ...modeArgs], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            BPI_SALES_ITEM_COUNT: String(itemCount)
          },
          shell: true,
          detached: true,
          stdio: 'ignore'
        });

        child.unref();
        sendJson(res, 200, { ok: true, spec, mode, itemCount });
      });

      server.middlewares.use('/api/clear-module-results', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' });
          return;
        }

        let payload;
        try {
          payload = await readJsonBody(req);
        } catch (error) {
          sendJson(res, 400, { error: 'Invalid JSON body' });
          return;
        }

        const catalog = getTestCatalog();
        const module = catalog.modules.find((entry) => entry.id === payload.moduleId);
        if (!module) {
          sendJson(res, 400, { error: 'Unknown module selected' });
          return;
        }

        const removed = module.tests.flatMap((test) => clearTestResultFiles(test));
        const nextCatalog = getTestCatalog();
        sendJson(res, 200, {
          ok: true,
          moduleId: module.id,
          removedCount: removed.length,
          modules: nextCatalog.modules,
          tests: nextCatalog.tests
        });
      });

      server.middlewares.use('/api/test-steps', (req, res) => {
        const requestUrl = new URL(req.url || '', 'http://localhost');
        const testId = requestUrl.searchParams.get('testId');
        const result = testResults[testId];

        if (!result) {
          sendJson(res, 400, { error: 'Unknown test results requested' });
          return;
        }

        const screenshotsDir = path.resolve(process.cwd(), result.screenshotsDir);
        if (!fs.existsSync(screenshotsDir)) {
          sendJson(res, 200, { steps: [] });
          return;
        }

        const availableScreenshots = new Set(
          fs.readdirSync(screenshotsDir).filter((fileName) => fileName.toLowerCase().endsWith('.png'))
        );

        const steps = Object.keys(result.steps)
          .filter((fileName) => availableScreenshots.has(fileName))
          .map((fileName) => ({
            fileName,
            title: result.steps[fileName].title,
            description: result.steps[fileName].description,
            screenshotUrl: `/api/test-screenshot?testId=${encodeURIComponent(
              testId
            )}&file=${encodeURIComponent(fileName)}`
          }));

        sendJson(res, 200, { steps });
      });

      server.middlewares.use('/api/test-screenshot', (req, res) => {
        const requestUrl = new URL(req.url || '', 'http://localhost');
        const testId = requestUrl.searchParams.get('testId');
        const fileName = requestUrl.searchParams.get('file');
        const result = testResults[testId];

        if (!result || !fileName || !result.steps[fileName]) {
          res.statusCode = 404;
          res.end('Screenshot not found');
          return;
        }

        const screenshotsDir = path.resolve(process.cwd(), result.screenshotsDir);
        const screenshotPath = path.resolve(screenshotsDir, fileName);

        if (!screenshotPath.startsWith(screenshotsDir) || !fs.existsSync(screenshotPath)) {
          res.statusCode = 404;
          res.end('Screenshot not found');
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'image/png');
        fs.createReadStream(screenshotPath).pipe(res);
      });

      server.middlewares.use('/api/test-summary', (req, res) => {
        const requestUrl = new URL(req.url || '', 'http://localhost');
        const testId = requestUrl.searchParams.get('testId');
        const summary = readRunSummary(testId);

        if (!summary) {
          sendJson(res, 400, { error: 'Unknown test summary requested' });
          return;
        }

        const latestVideoPath = findLatestTestVideo(testId, getVideoSearchTerms(testId));
        sendJson(res, 200, {
          summary,
          videoUrl: latestVideoPath ? `/api/test-video?testId=${encodeURIComponent(testId)}` : ''
        });
      });

      server.middlewares.use('/api/test-pdf', async (req, res) => {
        const requestUrl = new URL(req.url || '', 'http://localhost');
        const testId = requestUrl.searchParams.get('testId');
        const result = testResults[testId];
        const summary = readRunSummary(testId);

        if (!result || !summary) {
          sendJson(res, 400, { error: 'Unknown test PDF requested' });
          return;
        }

        let browser;
        try {
          const { chromium } = await import('playwright');
          const steps = getResultSteps(testId);
          const html = buildPdfHtml(result, summary, steps);
          browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
          await page.setContent(html, { waitUntil: 'networkidle' });
          const pdf = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: {
              top: '10mm',
              right: '10mm',
              bottom: '10mm',
              left: '10mm'
            }
          });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${safeFileName(result.title)}-results.pdf"`
          );
          res.setHeader('Content-Length', pdf.length);
          res.end(pdf);
        } catch (error) {
          sendJson(res, 500, { error: `Unable to export PDF: ${error.message}` });
        } finally {
          if (browser) await browser.close();
        }
      });

      server.middlewares.use('/api/test-video', (req, res) => {
        const requestUrl = new URL(req.url || '', 'http://localhost');
        const testId = requestUrl.searchParams.get('testId');

        if (!testResults[testId]) {
          res.statusCode = 404;
          res.end('Video not found');
          return;
        }

        const testResultsDir = path.resolve(process.cwd(), 'test-results');
        const latestVideoPath = findLatestTestVideo(testId, getVideoSearchTerms(testId));

        if (!latestVideoPath || !latestVideoPath.startsWith(testResultsDir)) {
          res.statusCode = 404;
          res.end('Video not found');
          return;
        }

        const stat = fs.statSync(latestVideoPath);
        const range = req.headers.range;
        res.setHeader('Content-Type', 'video/webm');

        if (!range) {
          res.statusCode = 200;
          res.setHeader('Content-Length', stat.size);
          fs.createReadStream(latestVideoPath).pipe(res);
          return;
        }

        const [startText, endText] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startText, 10);
        const end = endText ? parseInt(endText, 10) : stat.size - 1;

        if (Number.isNaN(start) || Number.isNaN(end) || start >= stat.size) {
          res.statusCode = 416;
          res.setHeader('Content-Range', `bytes */${stat.size}`);
          res.end();
          return;
        }

        res.statusCode = 206;
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', end - start + 1);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
        fs.createReadStream(latestVideoPath, { start, end }).pipe(res);
      });
    }
  };
}
