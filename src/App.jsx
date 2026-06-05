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
  tools: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.7 6.3a4 4 0 0 0-5 5L4 17v3h3l5.7-5.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z" />
      <path d="M18 15l3 3-3 3-3-3" />
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

function formatStatus(status) {
  return String(status || 'not-run')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'success') return 'success';
  if (normalized === 'not-run') return 'idle';
  if (normalized === 'not-configured') return 'warning';
  if (normalized.includes('success')) return 'success';
  return 'warning';
}

function getModuleStats(tests) {
  return (tests || []).reduce(
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
    { total: 0, success: 0, notRun: 0, notConfigured: 0, other: 0 }
  );
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
  const [selectedAction, setSelectedAction] = useState(null);
  const [runStatus, setRunStatus] = useState('');
  const [toast, setToast] = useState(null);
  const [catalogStatus, setCatalogStatus] = useState('Loading tests...');
  const [testModules, setTestModules] = useState([]);
  const [resultsStatus, setResultsStatus] = useState('');
  const [resultSteps, setResultSteps] = useState([]);
  const [resultSummary, setResultSummary] = useState(null);
  const [resultVideoUrl, setResultVideoUrl] = useState('');
  const [activeResultTest, setActiveResultTest] = useState(null);
  const [itemCount, setItemCount] = useState(1);
  const [documentNumbers, setDocumentNumbers] = useState({});
  const [documentRunModes, setDocumentRunModes] = useState({});
  const [testInputValues, setTestInputValues] = useState({});
  const [scaffoldValues, setScaffoldValues] = useState({
    moduleName: '',
    testName: ''
  });
  const [scaffoldStatus, setScaffoldStatus] = useState('');
  const [scaffoldResult, setScaffoldResult] = useState(null);

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
        setTestModules(modules);
        setActivePanel((current) => current || modules[0]?.id || '');
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

  useEffect(() => {
    if (!toast) return undefined;

    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const activeModule = testModules.find((module) => module.id === activePanel);
  const activeTestModule =
    testModules.find((module) => (module.tests || []).some((test) => test.id === activeResultTest?.id)) ||
    activeModule;

  const showToast = (message, type = 'error') => {
    setToast({
      id: Date.now(),
      message,
      type
    });
  };

  const togglePanel = (panel) => {
    setActivePanel((current) => (current === panel ? '' : panel));
    setActiveResultTest(null);
    setResultSteps([]);
    setResultSummary(null);
    setResultVideoUrl('');
    setResultsStatus('');
    setRunStatus('');
  };

  const validateRunSelection = (test, action = null) => {
    const documentNumber = (documentNumbers[test.id] || '').trim();
    const documentRunMode = documentRunModes[test.id] || test.documentRunModes?.[0]?.id || '';
    const runLabel = action ? `${test.label}: ${action.label}` : test.label;
    const missingInput = (test.dataInputs || []).find(
      (input) => input.required && !(testInputValues[test.id]?.[input.id] || '').trim()
    );

    if (missingInput) {
      showToast(`Enter ${missingInput.label} before starting ${test.label}.`);
      return false;
    }

    if (test.documentNumberInput && !documentNumber) {
      showToast(`Enter a document number before starting ${runLabel}.`);
      return false;
    }

    if (test.actions?.length && !action) {
      showToast(`Select a document before starting ${test.label}.`);
      return false;
    }

    if (test.documentRunModes?.length && !documentRunMode) {
      showToast(`Select an action before starting ${runLabel}.`);
      return false;
    }

    return true;
  };

  const openRunModePopup = (test, action = null) => {
    if (!validateRunSelection(test, action)) return;

    setSelectedTest(test);
    setSelectedAction(action);
    setActiveResultTest(test);
    setResultSteps([]);
    setResultSummary(null);
    setResultVideoUrl('');
    setResultsStatus('');
    setRunStatus('');
  };

  const runSelectedTest = async (mode) => {
    if (!selectedTest) return;

    const runLabel = selectedAction ? `${selectedTest.label}: ${selectedAction.label}` : selectedTest.label;
    const documentNumber = (documentNumbers[selectedTest.id] || '').trim();
    const documentRunMode =
      documentRunModes[selectedTest.id] || selectedTest.documentRunModes?.[0]?.id || '';
    const dataInputs = testInputValues[selectedTest.id] || {};
    if (selectedTest.documentNumberInput && !documentNumber) {
      setRunStatus(`Enter a document number before starting ${runLabel}.`);
      return;
    }

    if (selectedTest.actions?.length && !selectedAction) {
      setRunStatus(`Select a document before starting ${selectedTest.label}.`);
      return;
    }

    if (selectedTest.documentRunModes?.length && !documentRunMode) {
      setRunStatus(`Select an action before starting ${runLabel}.`);
      return;
    }

    setRunStatus(`Starting ${runLabel}...`);
    try {
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spec: selectedTest.spec,
          mode,
          itemCount,
          actionId: selectedAction?.id || '',
          documentNumber,
          documentRunMode,
          dataInputs
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start Playwright');
      setRunStatus(`${runLabel} started.`);
      setSelectedTest(null);
      setSelectedAction(null);
    } catch (error) {
      showToast(error.message);
    }
  };

  const openResults = async (test = activeResultTest) => {
    setActiveResultTest(test);
    setResultSteps([]);
    setResultSummary(null);
    setResultVideoUrl('');

    if (!test?.hasResultDetails) {
      setResultsStatus('');
      return;
    }

    setResultsStatus(`Loading ${test.label}...`);

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
      setTestModules((modules) =>
        modules.map((module) => {
          const tests = (module.tests || []).map((entry) =>
            entry.id === test.id
              ? {
                  ...entry,
                  status: summaryData.summary?.status || entry.status,
                  modules: summaryData.summary?.modules || entry.modules
                }
              : entry
          );

          return {
            ...module,
            tests,
            stats: getModuleStats(tests)
          };
        })
      );
      setResultsStatus(stepsData.steps.length ? '' : 'No Result Steps Found.');
    } catch (error) {
      showToast(error.message);
    }
  };

  const clearModuleResults = async (module) => {
    if (!module) return;

    setResultsStatus(`Clearing ${module.label} results...`);
    try {
      const response = await fetch('/api/clear-module-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: module.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to clear module results');

      const modules = data.modules || [];

      setTestModules(modules);
      setResultSteps([]);
      setResultSummary(null);
      setResultVideoUrl('');
      setResultsStatus(`${module.label} results cleared.`);
    } catch (error) {
      showToast(error.message);
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

  const createScaffold = async () => {
    const moduleName = scaffoldValues.moduleName.trim();
    const testName = scaffoldValues.testName.trim();

    if (!moduleName) {
      showToast('Enter a module name before creating a scaffold.');
      return;
    }

    if (!testName) {
      showToast('Enter a test case name before creating a scaffold.');
      return;
    }

    setScaffoldStatus(`Creating ${moduleName} / ${testName}...`);
    setScaffoldResult(null);

    try {
      const response = await fetch('/api/create-scaffold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName,
          testName
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create scaffold');

      setScaffoldResult(data);
      setScaffoldStatus(`Created ${data.testId}. Restart the dashboard server to load the new module.`);
    } catch (error) {
      setScaffoldStatus('');
      showToast(error.message);
    }
  };

  const renderScaffoldGenerator = () => (
    <div className="scaffold-tool">
      <div className="scaffold-fields">
        <input
          className="test-data-input"
          type="text"
          value={scaffoldValues.moduleName}
          aria-label="New module name"
          placeholder="Module name"
          onChange={(event) =>
            setScaffoldValues((current) => ({
              ...current,
              moduleName: event.target.value
            }))
          }
        />
        <input
          className="test-data-input"
          type="text"
          value={scaffoldValues.testName}
          aria-label="New test case name"
          placeholder="Test case name"
          onChange={(event) =>
            setScaffoldValues((current) => ({
              ...current,
              testName: event.target.value
            }))
          }
        />
      </div>
      <div className="scaffold-actions">
        <button type="button" onClick={createScaffold}>
          Create
        </button>
        <a
          className={`download-link ${scaffoldResult?.guideDownloadUrl ? '' : 'disabled'}`}
          href={scaffoldResult?.guideDownloadUrl || '#'}
          onClick={(event) => {
            if (!scaffoldResult?.guideDownloadUrl) event.preventDefault();
          }}
        >
          Guide
        </a>
      </div>
      {scaffoldStatus && <p className="scaffold-status">{scaffoldStatus}</p>}
      {scaffoldResult && (
        <div className="scaffold-output">
          <span>{scaffoldResult.guidePath}</span>
          <span>{scaffoldResult.createdFiles.length} created</span>
          <span>{scaffoldResult.changedFiles.length} updated</span>
          <span>{scaffoldResult.skippedFiles.length} skipped</span>
        </div>
      )}
    </div>
  );

  const renderTestActions = (test) => {
    if (
      !test?.actions?.length &&
      !test?.documentNumberInput &&
      !test?.documentRunModes?.length &&
      !test?.dataInputs?.length
    ) {
      return null;
    }

    return (
      <div className="test-actions" aria-label={`${test.label} actions`}>
        {(test.dataInputs || []).map((input) => (
          <input
            className="test-data-input"
            type="text"
            value={testInputValues[test.id]?.[input.id] || ''}
            aria-label={`${test.label} ${input.label}`}
            placeholder={input.label}
            key={`${test.id}-${input.id}`}
            onChange={(event) =>
              setTestInputValues((current) => ({
                ...current,
                [test.id]: {
                  ...(current[test.id] || {}),
                  [input.id]: event.target.value
                }
              }))
            }
          />
        ))}
        {test.documentNumberInput && (
          <input
            className="document-number-input"
            type="text"
            value={documentNumbers[test.id] || ''}
            aria-label={`${test.label} document number`}
            placeholder="Document number"
            onChange={(event) =>
              setDocumentNumbers((current) => ({
                ...current,
                [test.id]: event.target.value
              }))
            }
          />
        )}
        {!!test.actions?.length && (
          <select
            className="test-action-select"
            defaultValue=""
            aria-label={`${test.label} document selection`}
            onChange={(event) => {
            const action = test.actions.find((entry) => entry.id === event.target.value);
            event.target.value = '';
            if (action) openRunModePopup(test, action);
            }}
          >
            <option value="" disabled>
              Select document
            </option>
            {test.actions.map((action) => (
              <option value={action.id} key={`${test.id}-${action.id}`}>
                {action.label}
              </option>
            ))}
          </select>
        )}
        {!!test.documentRunModes?.length && (
          <select
            className="document-run-mode-select"
            value={documentRunModes[test.id] || test.documentRunModes[0]?.id || ''}
            aria-label={`${test.label} action selection`}
            onChange={(event) =>
              setDocumentRunModes((current) => ({
                ...current,
                [test.id]: event.target.value
              }))
            }
          >
            {test.documentRunModes.map((mode) => (
              <option value={mode.id} key={`${test.id}-${mode.id}`}>
                {mode.label}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  const renderTestUtilities = (test) => {
    if (!test?.utilities?.length) return null;

    return (
      <div className="module-utility-strip" aria-label={`${test.label} utilities`}>
        {test.utilities.map((utility) => (
          <article className="module-utility-card" key={utility.id}>
            <div>
              <span>{utility.utilityLabel}</span>
              <strong>{utility.label}</strong>
            </div>
            <div className="module-utility-controls">
              <input
                className="document-number-input"
                type="text"
                value={documentNumbers[utility.id] || ''}
                aria-label={`${utility.label} document number`}
                placeholder="Document number"
                onChange={(event) =>
                  setDocumentNumbers((current) => ({
                    ...current,
                    [utility.id]: event.target.value
                  }))
                }
              />
              {!!utility.documentRunModes?.length && (
                <select
                  className="document-run-mode-select"
                  value={documentRunModes[utility.id] || utility.documentRunModes[0]?.id || ''}
                  aria-label={`${utility.label} action selection`}
                  onChange={(event) =>
                    setDocumentRunModes((current) => ({
                      ...current,
                      [utility.id]: event.target.value
                    }))
                  }
                >
                  {utility.documentRunModes.map((mode) => (
                    <option value={mode.id} key={`${utility.id}-${mode.id}`}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => openRunModePopup(utility, utility.action)}
                aria-label={`Run ${utility.utilityLabel} ${utility.label}`}
              >
                <Icon name="play" />
                <span>{utility.label}</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  };

  const renderPreview = () => {
    if (!activeResultTest) return null;

    return (
      <section className="print-results preview-panel" aria-label={`${activeResultTest.label} dashboard`}>
        <section className="module-overview" aria-label={`${activeResultTest.label} result overview`}>
          <div className="module-overview-header">
            <div>
              <p>{activeTestModule?.label || 'Test Case'}</p>
              <h2>{activeResultTest.label}</h2>
            </div>
            <div className="module-overview-actions">
              {renderTestUtilities(activeResultTest)}
              <button
                type="button"
                className="clear-button"
                onClick={() => clearModuleResults(activeTestModule)}
                disabled={!activeTestModule}
              >
                Clear Results
              </button>
            </div>
          </div>

          {activeResultTest.scaffoldGenerator ? (
            renderScaffoldGenerator()
          ) : (
            <div className="selected-test-actions">
              <div className="card-actions">
                <button
                  type="button"
                  onClick={() => openRunModePopup(activeResultTest)}
                  aria-label={`Run ${activeResultTest.label}`}
                >
                  <Icon name="play" />
                </button>
                <button
                  type="button"
                  onClick={() => openResults(activeResultTest)}
                  aria-label={`View ${activeResultTest.label}`}
                  disabled={!activeResultTest.hasResultDetails}
                >
                  <Icon name="eye" />
                </button>
              </div>
              {renderTestActions(activeResultTest)}
            </div>
          )}
        </section>

        <div className="results-header">
          <div>
            <h2 id="results-title">Documentation Result:</h2>
            <p>{resultSummary?.status || activeResultTest.label}</p>
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
  };

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
                {(activePanel === module.id ? module.tests || [] : []).map((test) => (
                  <article className="sidebar-test" key={test.id}>
                    <button
                      type="button"
                      className="test-name-button"
                      onClick={() => openResults(test)}
                    >
                      {test.label}
                      <span className={`status-badge ${getStatusClass(test.status)}`}>
                        {formatStatus(test.status)}
                      </span>
                    </button>
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
              <div className="modal-title">
                <h2 id="run-mode-title">{selectedTest.label}</h2>
                {selectedAction && <p>{selectedAction.label}</p>}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTest(null);
                  setSelectedAction(null);
                }}
                aria-label="Close"
              >
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
      {toast && (
        <aside className={`toast ${toast.type}`} role="alert" key={toast.id}>
          {toast.message}
        </aside>
      )}
    </main>
  );
}
