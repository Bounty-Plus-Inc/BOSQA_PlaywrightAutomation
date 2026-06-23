export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeFileName(value) {
  return String(value || 'test-results')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function formatRemarks(remarks) {
  const normalized = String(remarks || '').trim().toLowerCase();
  if (normalized === 'met') return 'Validated successfully against the expected value.';
  if (normalized === 'not met') return 'Actual value differs from the expected value.';
  return remarks || '-';
}

function getDocumentationGroups(entries = []) {
  return entries.reduce(
    (groups, entry) => {
      const lineMatch = /^Sales Order Row\s+(\d+)\s+(.+)$/i.exec(entry.module || '');
      if (!lineMatch) {
        groups.headers.push(entry);
        return groups;
      }

      const rowNumber = Number.parseInt(lineMatch[1], 10);
      const fieldName = lineMatch[2];
      const existingGroup = groups.lineItems.find((lineItem) => lineItem.rowNumber === rowNumber);
      const lineEntry = {
        ...entry,
        displayModule: fieldName
      };

      if (existingGroup) {
        existingGroup.entries.push(lineEntry);
      } else {
        groups.lineItems.push({
          rowNumber,
          entries: [lineEntry]
        });
      }

      return groups;
    },
    { headers: [], lineItems: [] }
  );
}

function buildDocumentationTable(entries) {
  return `<table>
    <thead>
      <tr>
        <th>Test Script</th>
        <th>Expected Value</th>
        <th>Actual Result</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${entries
        .map(
          (entry) => `<tr>
            <td>${escapeHtml(entry.displayModule || entry.module)}</td>
            <td>${escapeHtml(entry.docNo || '-')}</td>
            <td>${escapeHtml(entry.status)}</td>
            <td>${escapeHtml(formatRemarks(entry.remarks))}</td>
          </tr>`
        )
        .join('')}
    </tbody>
  </table>`;
}

export function buildPdfHtml(result, summary, steps) {
  const generatedAt = new Date().toLocaleString();
  const modules = summary?.modules || [];
  const documentationGroups = getDocumentationGroups(modules);

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
      .summary h3 {
        margin: 0;
        border-bottom: 1px solid #d8dee7;
        color: #16202a;
        font-size: 13px;
        padding: 8px 10px;
      }
      .summary-group + .summary-group { border-top: 1px solid #d8dee7; }
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
            <h2>Documentation Table</h2>
            ${
              documentationGroups.headers.length
                ? `<div class="summary-group">
                    <h3>Headers</h3>
                    ${buildDocumentationTable(documentationGroups.headers)}
                  </div>`
                : ''
            }
            ${documentationGroups.lineItems
              .sort((a, b) => a.rowNumber - b.rowNumber)
              .map(
                (lineItem) => `<div class="summary-group">
                  <h3>Line Item ${lineItem.rowNumber}</h3>
                  ${buildDocumentationTable(lineItem.entries)}
                </div>`
              )
              .join('')}
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
