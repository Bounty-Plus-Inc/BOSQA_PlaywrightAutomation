import { useEffect, useState } from 'react';

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
  menu: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.4 15.6A8 8 0 0 1 8.4 3.6a8.5 8.5 0 1 0 12 12Z" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
};

function Icon({ name }) {
  return <span className="icon">{icons[name] || icons.file}</span>;
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';

    const storedTheme = window.localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [activePanel, setActivePanel] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [runStatus, setRunStatus] = useState('');
  const [catalogStatus, setCatalogStatus] = useState('Loading tests...');
  const [testModules, setTestModules] = useState([]);
  const [resultsStatus, setResultsStatus] = useState('');
  const [resultSteps, setResultSteps] = useState([]);
  const [resultSummary, setResultSummary] = useState(null);
  const [resultVideoUrl, setResultVideoUrl] = useState('');
  const [activeResultTest, setActiveResultTest] = useState(null);
  const [itemCount, setItemCount] = useState(1);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    const loadTestCatalog = async () => {
      try {
        const response = await fetch('/api/test-catalog');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load tests');

        if (!isMounted) return;

        const modules = data.modules || [];
        const tests = modules.flatMap((module) => module.tests || []);
        const firstPreviewTest = tests.find((test) => test.hasResultDetails) || tests[0] || null;
        setTestModules(modules);
        setActivePanel((current) => current || modules[0]?.id || '');
        setActiveResultTest((current) => current || firstPreviewTest);
        setCatalogStatus(tests.length ? '' : 'No tests found.');
      } catch (error) {
        if (!isMounted) return;
        setCatalogStatus(`Error: ${error.message}`);
      }
    };

    loadTestCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

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
    if (!test?.hasResultDetails) return;

    setActiveResultTest(test);
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
    if (!activeResultTest) return;

    const link = document.createElement('a');
    link.href = `/api/test-pdf?testId=${encodeURIComponent(activeResultTest.resultId)}`;
    link.download = `${activeResultTest.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-results.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const renderPreview = () => (
    <section className="print-results preview-panel" aria-label="Test preview">
      <div className="results-header">
        <div>
          <h2 id="results-title">{activeResultTest?.label || 'Results'}</h2>
          <p>{resultSummary?.status || 'Preview'}</p>
        </div>
        <div className="no-print results-actions">
          <button
            type="button"
            onClick={() => openResults(activeResultTest)}
            disabled={!activeResultTest?.hasResultDetails}
          >
            <Icon name="results" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={exportResultsToPdf}
            disabled={!resultSteps.length && !resultSummary?.modules?.length}
          >
            <span>PDF</span>
          </button>
        </div>
      </div>

      {resultsStatus && <p className="results-status">{resultsStatus}</p>}

      <div className="result-list">
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

        {resultSteps.map((step, index) => (
          <article key={step.fileName} className="print-avoid result-step">
            <div className="step-heading">
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
            </div>
            <img src={step.screenshotUrl} alt={step.title} loading="lazy" />
          </article>
        ))}

        {resultVideoUrl && (
          <section className="no-print result-video">
            <video src={resultVideoUrl} controls autoPlay muted loop />
          </section>
        )}
      </div>
    </section>
  );

  return (
    <main className={`app-shell ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="module-sidebar" aria-label="Test modules">
        <div className="sidebar-header">
          <div>
            <p>BOUNTY PLUS INC.</p>
            <strong>REGRESSION</strong>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen((current) => !current)}
            aria-label={isSidebarOpen ? 'Hide modules' : 'Show modules'}
            title={isSidebarOpen ? 'Hide modules' : 'Show modules'}
          >
            <Icon name={isSidebarOpen ? 'close' : 'menu'} />
          </button>
        </div>

        <nav className="module-nav">
          {testModules.map((module) => (
            <section className="module-group" key={module.id}>
              <button
                type="button"
                className={`module-button ${activePanel === module.id ? 'active' : ''}`}
                onClick={() => togglePanel(module.id)}
                title={module.label}
              >
                <Icon name={module.icon} />
                <span>{module.label}</span>
              </button>

              <div className={`module-tests ${activePanel === module.id ? 'open' : ''}`}>
                {(module.tests || []).map((test) => (
                  <article className="sidebar-test" key={test.id}>
                    <button
                      type="button"
                      className="test-name-button"
                      onClick={() => openResults(test)}
                      disabled={!test.hasResultDetails}
                    >
                      {test.label}
                    </button>
                    <div className="card-actions">
                      <button type="button" onClick={() => openRunModePopup(test)} aria-label={`Run ${test.label}`}>
                        <Icon name="play" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openResults(test)}
                        aria-label={`View ${test.label}`}
                        disabled={!test.hasResultDetails}
                      >
                        <Icon name="eye" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </nav>

        {catalogStatus && <p className="status-line">{catalogStatus}</p>}
      </aside>

      <section className="workspace">
        <header className="top-bar">
          <div>
            <p>BOUNTY PLUS INC.</p>
            <p>REGRESSION AUTOMATION</p>
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
            <button
              type="button"
              className="ghost-button"
              onClick={() => openResults(activeResultTest)}
              disabled={!activeResultTest?.hasResultDetails}
            >
              <Icon name="results" />
              <span>Results</span>
            </button>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <Icon name={theme === 'light' ? 'moon' : 'sun'} />
            </button>
          </div>
        </header>

        {runStatus && <p className="status-line">{runStatus}</p>}
        {renderPreview()}
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
              <button type="button" onClick={() => runSelectedTest('headless(On Testing Phase)')}>
                Headless
              </button>
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
    </main>
  );
}
