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

export function buildPdfHtml(result, summary, steps) {
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

