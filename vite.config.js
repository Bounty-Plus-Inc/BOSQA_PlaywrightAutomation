import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const testResults = {
  'sales-standard': {
    title: 'SO with Credit Limit',
    screenshotsDir: 'test-results/screenshots/sales_standard_process',
    steps: {
      '00_SalesOrder_Page_Opened.png': {
        title: 'Sales order screen opened',
        description: 'The test reached the sales order page and the form was ready to use.'
      },
      '01_Customer_Label_Visible.png': {
        title: 'Customer field confirmed',
        description: 'The customer area appeared, confirming the page loaded correctly.'
      },
      '02_BP_Code_Returned.png': {
        title: 'Customer selected',
        description: 'A customer was chosen from the lookup and returned to the order form.'
      },
      '03_DocSeries_Selected.png': {
        title: 'Document series selected',
        description: 'The order was assigned to the expected document series.'
      },
      '01_BP_Selected.png': {
        title: 'Business partner updated',
        description: 'The business partner selection was completed successfully.'
      },
      '04_Item_Updated.png': {
        title: 'Item added to the order',
        description: 'The item, price, and business center were entered and updated.'
      },
      '05_Header_Details_Filled.png': {
        title: 'Header details completed',
        description: 'Required order header details were filled in.'
      },
      '06_Status_Draft.png': {
        title: 'Order saved as draft',
        description: 'The order was saved and confirmed in draft status.'
      },
      '07_Status_Open_After_Add.png': {
        title: 'Order opened',
        description: 'The order was submitted and moved to open status.'
      },
      'ZZ_Credit_Limit_Blocking_Message.png': {
        title: 'Credit limit review needed',
        description: 'The order could not open yet because it requires credit limit checking.'
      },
      'ZZ_Status_Not_Open_Latest.png': {
        title: 'Order did not open',
        description: 'The latest status was captured because the order did not move to open status.'
      },
      '08_CREDIT_LIMIT_STANDARD.png': {
        title: 'Credit limit row selected',
        description:
          'The matching Sales Order was visible in the result table, selected, and marked Approved.'
      },
      '09_CREDIT_LIMIT_APPROVED.png': {
        title: 'Credit limit approved',
        description:
          'The matching Sales Order was found, selected, approved, added successfully, and confirmed as Open.'
      },
      '10_CREDIT_LIMIT_APPROVAL.png': {
        title: 'Credit limit approval row selected',
        description:
          'The approval page was filtered by customer, then the matching Sales Order was selected.'
      },
      '11_CREDIT_LIMIT_APPROVAL_DONE.png': {
        title: 'Credit limit approval completed',
        description:
          'The matching Sales Order was approved from Credit Limit Approval and saved successfully.'
      }
    }
  },
  'delivery-order': {
    title: 'Delivery Order',
    screenshotsDir: 'test-results/screenshots/delivery_order',
    steps: {
      '00_DELIVERY_ORDER_OPENED.png': {
        title: 'Delivery order screen opened',
        description: 'The Delivery Order standard transaction module opened successfully.'
      },
      '01_DELIVERY_BP_COPY_FROM_READY.png': {
        title: 'Business partner entered',
        description:
          'The BP Code was entered and the Copy From button was visible before opening source documents.'
      },
      '02_DELIVERY_SALES_ORDERS_POPUP.png': {
        title: 'Sales Orders popup opened',
        description:
          'The Copy From menu was opened and Sales Orders was selected, opening the source document popup.'
      },
      '03_DELIVERY_SO_HEADER_SELECTED.png': {
        title: 'Sales Order header selected',
        description:
          'The Choose button was visible and the matching Sales Order header row was selected in the popup.'
      },
      '04_DELIVERY_SO_ITEMS_LOADED.png': {
        title: 'Sales Order items loaded',
        description:
          'The selected Sales Order populated the item table in the popup before item selection.'
      },
      '05_DELIVERY_SO_ITEMS_SELECTED.png': {
        title: 'Sales Order items selected',
        description:
          'The copied Sales Order item checkbox was selected before finishing the popup.'
      },
      '06_DELIVERY_ITEMS_COPIED_TO_MAIN.png': {
        title: 'Delivery Order line populated',
        description:
          'The popup finished and the Delivery Order line item code was populated on the main form.'
      },
      '07_DELIVERY_DOCSERIES_PRIMARY.png': {
        title: 'Primary document series selected',
        description:
          'The Delivery Order document series was changed to Primary.'
      },
      '08_DELIVERY_INV_DEL_DATE_TODAY.png': {
        title: 'Invoice delivery date selected',
        description:
          'The General (UDF) tab was opened and the invoice delivery date calendar selected Today.'
      },
      '09_DELIVERY_SHIP_TO_ADDRESS_FILLED.png': {
        title: 'Logistics details completed',
        description:
          'The Logistics tab was opened, SHIP TO and DELIVERY were selected, and the ship-to address was populated.'
      },
      '10_DELIVERY_TRUCKER_AND_PLATE_SELECTED.png': {
        title: 'Trucker and plate selected',
        description:
          'The General (UDF) tab was reopened, the trucker code lookup selected 000, and the plate number lookup selected the first row.'
      },
      '11_DELIVERY_SAVED_AS_DRAFT.png': {
        title: 'Delivery Order saved as draft',
        description:
          'The Delivery Order was saved as draft and the page reloaded with draft status.'
      }
    }
  },
  approval: {
    title: 'Approval',
    screenshotsDir: 'test-results/screenshots/approval',
    steps: {
      '00_APPROVAL_PAGE_OPENED.png': {
        title: 'Transaction Approval opened',
        description:
          'The Admin tab was opened, Approval was hovered, and Transaction Approval loaded successfully.'
      },
      '01_APPROVAL_ROW_SELECTED.png': {
        title: 'Approval rows selected',
        description:
          'The Transaction Approval list was filtered, Approved was selected, and the table select-all checkbox was checked.'
      },
      '02_APPROVAL_SUCCESS_OPEN.png': {
        title: 'Success for Approval Stage',
        description:
          'The transaction was added successfully and the document status is Open and uneditable.'
      }
    }
  }
};

const testSpecs = {
  'tests/sales/standard.spec.js': 'sales-standard',
  'tests/sales/delivery-order.spec.js': 'delivery-order',
  'tests/admin/approval.spec.js': 'approval'
};

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function findLatestVideo(rootDir) {
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

function findLatestTestVideo(testId) {
  const testResultsDir = path.resolve(process.cwd(), 'test-results');
  if (!fs.existsSync(testResultsDir)) return null;

  const candidates = [];
  for (const entry of fs.readdirSync(testResultsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.toLowerCase().includes(testId)) continue;

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

function readRunSummary(testId) {
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeFileName(value) {
  return String(value || 'test-results')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function imageToDataUri(imagePath) {
  const image = fs.readFileSync(imagePath);
  return `data:image/png;base64,${image.toString('base64')}`;
}

function getResultSteps(testId) {
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

function buildPdfHtml(result, summary, steps) {
  const generatedAt = new Date().toLocaleString();
  const modules = summary?.modules || [];

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(result.title)} Results</title>
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #ffffff;
        color: #16202a;
        font-family: "Segoe UI", Arial, sans-serif;
        font-size: 12px;
      }
      header {
        border-bottom: 1px solid #d8dee7;
        margin-bottom: 14px;
        padding-bottom: 10px;
      }
      h1 { margin: 0 0 4px; font-size: 24px; }
      .muted { color: #64748b; margin: 0; }
      .summary {
        border: 1px solid #d8dee7;
        border-radius: 6px;
        margin-bottom: 14px;
        overflow: hidden;
      }
      .summary h2, .step h2 {
        margin: 0;
        font-size: 14px;
        background: #f8fafc;
        border-bottom: 1px solid #d8dee7;
        padding: 8px 10px;
      }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #e6ebf1; padding: 7px 10px; text-align: left; }
      th { background: #f8fafc; color: #475569; font-weight: 700; }
      .step {
        border: 1px solid #d8dee7;
        border-radius: 6px;
        margin-bottom: 14px;
        overflow: hidden;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .step-title {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        background: #ffffff;
        border-bottom: 1px solid #d8dee7;
        padding: 9px 10px;
      }
      .badge {
        display: inline-grid;
        place-items: center;
        min-width: 24px;
        height: 24px;
        border-radius: 999px;
        background: #0f766e;
        color: #ffffff;
        font-weight: 700;
      }
      h3 { margin: 0 0 2px; font-size: 13px; }
      .step p { margin: 0; color: #64748b; }
      img {
        display: block;
        width: 100%;
        max-height: 145mm;
        object-fit: contain;
        background: #ffffff;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(result.title)} Results</h1>
      <p class="muted">Status: ${escapeHtml(summary?.status || 'not-run')} | Generated: ${escapeHtml(generatedAt)}</p>
    </header>
    ${
      modules.length
        ? `<section class="summary">
            <h2>Module Document Numbers</h2>
            <table>
              <thead>
                <tr><th>Module</th><th>Doc No</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${modules
                  .map(
                    (entry) => `<tr>
                      <td>${escapeHtml(entry.module)}</td>
                      <td>${escapeHtml(entry.docNo || '-')}</td>
                      <td>${escapeHtml(entry.status)}</td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </section>`
        : ''
    }
    ${steps
      .map(
        (step, index) => `<article class="step">
          <div class="step-title">
            <span class="badge">${index + 1}</span>
            <div>
              <h3>${escapeHtml(step.title)}</h3>
              <p>${escapeHtml(step.description)}</p>
            </div>
          </div>
          <img src="${step.imageDataUri}" alt="${escapeHtml(step.title)}" />
        </article>`
      )
      .join('')}
  </body>
</html>`;
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'playwright-runner-api',
      configureServer(server) {
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

          if (!testSpecs[spec]) {
            sendJson(res, 400, { error: 'Unknown test selected' });
            return;
          }

          if (!allowedModes.has(mode)) {
            sendJson(res, 400, { error: 'Unknown run mode selected' });
            return;
          }

          const modeArgs =
            mode === 'ui'
              ? ['--ui']
              : mode === 'headed'
                ? ['--headed']
                : [];
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

          const latestVideoPath = findLatestTestVideo(testId);
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
          const latestVideoPath = findLatestTestVideo(testId);

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
    }
  ]
});
