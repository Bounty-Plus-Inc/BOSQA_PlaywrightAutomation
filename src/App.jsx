import { useState } from 'react';

const salesTests = [
  {
    id: 'sales-standard',
    label: 'SO with Credit Limit',
    spec: 'tests/sales/standard.spec.js',
    resultId: 'sales-standard'
  },
  {
    id: 'delivery-order',
    label: 'Delivery Order',
    spec: 'tests/sales/delivery-order.spec.js',
    resultId: 'delivery-order'
  }
];

const addOnTests = [
  {
    id: 'approval',
    label: 'Approval',
    spec: 'tests/admin/approval.spec.js',
    resultId: 'approval'
  }
];

const allTests = [...salesTests, ...addOnTests];

const icons = {
  sales: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 9h18l-2 10H5L3 9Z" />
      <path d="M8 9V6a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  addons: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v18M3 12h18" />
      <path d="M6 6h12v12H6z" />
    </svg>
  ),
  results: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4h14v16H5z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 5 11 7-11 7V5Z" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
};

function Icon({ name }) {
  return <span className="icon">{icons[name]}</span>;
}

export default function App() {
  const [activePanel, setActivePanel] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  const [runStatus, setRunStatus] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [resultsStatus, setResultsStatus] = useState('');
  const [resultSteps, setResultSteps] = useState([]);
  const [resultSummary, setResultSummary] = useState(null);
  const [resultVideoUrl, setResultVideoUrl] = useState('');
  const [activeResultTest, setActiveResultTest] = useState(allTests[0]);
  const [itemCount, setItemCount] = useState(1);

  const togglePanel = (panel) => {
    setActivePanel((current) => (current === panel ? '' : panel));
    setRunStatus('');
  };

  const openRunModePopup = (test) => {
    setSelectedTest(test);
    setActiveResultTest(test);
    setRunStatus('');
  };

  const runSelectedTest = async (mode) => {
    if (!selectedTest) return;

    setRunStatus(`Starting ${selectedTest.label}...`);
    try {
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spec: selectedTest.spec,
          mode,
          itemCount
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start Playwright');
      setRunStatus(`${selectedTest.label} started.`);
      setSelectedTest(null);
    } catch (error) {
      setRunStatus(`Error: ${error.message}`);
    }
  };

  const openResults = async (test = activeResultTest) => {
    setActiveResultTest(test);
    setShowResults(true);
    setResultsStatus(`Loading ${test.label}...`);
    setResultSteps([]);
    setResultSummary(null);
    setResultVideoUrl('');

    try {
      const [stepsResponse, summaryResponse] = await Promise.all([
        fetch(`/api/test-steps?testId=${encodeURIComponent(test.resultId)}`),
        fetch(`/api/test-summary?testId=${encodeURIComponent(test.resultId)}`)
      ]);
      const stepsData = await stepsResponse.json();
      const summaryData = await summaryResponse.json();
      if (!stepsResponse.ok) throw new Error(stepsData.error || 'Unable to load results');
      if (!summaryResponse.ok) throw new Error(summaryData.error || 'Unable to load result summary');
      setResultSteps(stepsData.steps);
      setResultSummary(summaryData.summary);
      setResultVideoUrl(summaryData.videoUrl);
      setResultsStatus(stepsData.steps.length ? '' : 'No screenshots yet.');
    } catch (error) {
      setResultsStatus(`Error: ${error.message}`);
    }
  };

  const exportResultsToPdf = () => {
    const link = document.createElement('a');
    link.href = `/api/test-pdf?testId=${encodeURIComponent(activeResultTest.resultId)}`;
    link.download = `${activeResultTest.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-results.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const renderCategoryPanel = (id, title, tests) => (
    <section className={`category-panel ${activePanel === id ? 'open' : ''}`} aria-label={title}>
      <div className="category-inner">
        {tests.map((test, index) => (
          <article className="test-card" key={test.id} style={{ '--delay': `${index * 70}ms` }}>
            <strong>{test.label}</strong>
            <div className="card-actions">
              <button type="button" onClick={() => openRunModePopup(test)} aria-label={`Run ${test.label}`}>
                <Icon name="play" />
              </button>
              <button type="button" onClick={() => openResults(test)} aria-label={`View ${test.label}`}>
                <Icon name="eye" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  return (
    <main className="app-shell">
      <section className="control-panel">
        <header className="top-bar">
          <div>
            <p>Playwright</p>
            <h1>Regression Tests</h1>
          </div>
          <div className="top-actions">
            <label className="number-control">
              <span>Items</span>
              <input
                type="number"
                min="1"
                max="20"
                value={itemCount}
                onChange={(event) => {
                  const nextValue = Number.parseInt(event.target.value, 10) || 1;
                  setItemCount(Math.min(Math.max(nextValue, 1), 20));
                }}
              />
            </label>
            <button type="button" className="ghost-button" onClick={() => openResults(activeResultTest)}>
              <Icon name="results" />
              <span>Results</span>
            </button>
          </div>
        </header>

        <div className="primary-actions">
          <button
            type="button"
            className={`main-action ${activePanel === 'sales' ? 'active' : ''}`}
            onClick={() => togglePanel('sales')}
          >
            <Icon name="sales" />
            <span>Sales</span>
          </button>
          <button
            type="button"
            className={`main-action ${activePanel === 'addons' ? 'active' : ''}`}
            onClick={() => togglePanel('addons')}
          >
            <Icon name="addons" />
            <span>Adds-On</span>
          </button>
        </div>

        {renderCategoryPanel('sales', 'Sales tests', salesTests)}
        {renderCategoryPanel('addons', 'Add-on tests', addOnTests)}

        {runStatus && <p className="status-line">{runStatus}</p>}
      </section>

      {selectedTest && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="run-mode-title">
          <div className="modal-card">
            <div className="modal-header">
              <h2 id="run-mode-title">{selectedTest.label}</h2>
              <button type="button" onClick={() => setSelectedTest(null)} aria-label="Close">
                <Icon name="close" />
              </button>
            </div>
            <div className="mode-actions">
              <button type="button" onClick={() => runSelectedTest('headed')}>
                Headed
              </button>
              <button type="button" onClick={() => runSelectedTest('ui')}>
                UI
              </button>
            </div>
          </div>
        </div>
      )}

      {showResults && (
        <div className="results-backdrop" role="dialog" aria-modal="true" aria-labelledby="results-title">
          <div className="print-results results-card">
            <div className="results-header">
              <div>
                <h2 id="results-title">{activeResultTest.label}</h2>
                <p>Results</p>
              </div>
              <div className="no-print results-actions">
                <button
                  type="button"
                  onClick={exportResultsToPdf}
                  disabled={!resultSteps.length && !resultSummary?.modules?.length}
                >
                  <Icon name="file" />
                  <span>PDF</span>
                </button>
                <button type="button" onClick={() => setShowResults(false)} aria-label="Close results">
                  <Icon name="close" />
                </button>
              </div>
            </div>

            {resultsStatus && <p className="results-status">{resultsStatus}</p>}

            <div className="result-list">
              {resultSteps.map((step, index) => (
                <article key={step.fileName} className="print-avoid result-step">
                  <div className="step-heading">
                    <span>{index + 1}</span>
                    <h3>{step.title}</h3>
                  </div>
                  <img src={step.screenshotUrl} alt={step.title} loading="lazy" />
                </article>
              ))}

              {resultSummary?.modules?.length > 0 && (
                <section className="print-avoid module-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Module</th>
                        <th>Doc No</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultSummary.modules.map((entry) => (
                        <tr key={`${entry.module}-${entry.docNo}`}>
                          <td>{entry.module}</td>
                          <td>{entry.docNo || '-'}</td>
                          <td>{entry.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {resultSummary?.status === 'success' && resultVideoUrl && (
                <section className="no-print result-video">
                  <video src={resultVideoUrl} controls autoPlay muted loop />
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
