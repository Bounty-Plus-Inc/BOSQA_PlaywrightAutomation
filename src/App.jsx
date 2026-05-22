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

export default function App() {
  const [showSalesCategories, setShowSalesCategories] = useState(false);
  const [showAddOns, setShowAddOns] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [runStatus, setRunStatus] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [resultsStatus, setResultsStatus] = useState('');
  const [resultSteps, setResultSteps] = useState([]);
  const [resultSummary, setResultSummary] = useState(null);
  const [resultVideoUrl, setResultVideoUrl] = useState('');
  const [activeResultTest, setActiveResultTest] = useState(allTests[0]);

  const selectPanel = (panel) => {
    setShowSalesCategories(panel === 'sales');
    setShowAddOns(panel === 'addons');
    setRunStatus('');
  };

  const openRunModePopup = (test) => {
    setSelectedTest(test);
    setActiveResultTest(test);
    setRunStatus('');
  };

  const runSelectedTest = async (mode) => {
    if (!selectedTest) return;

    setRunStatus(`Starting ${selectedTest.label} in ${mode} mode...`);
    try {
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spec: selectedTest.spec,
          mode
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start Playwright');
      setRunStatus(`${selectedTest.label} started in ${mode} mode. When it finishes, open View Results.`);
      setSelectedTest(null);
    } catch (error) {
      setRunStatus(`Error: ${error.message}`);
    }
  };

  const openResults = async (test = activeResultTest) => {
    setActiveResultTest(test);
    setShowResults(true);
    setResultsStatus(`Loading latest ${test.label} steps...`);
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
      setResultsStatus(
        stepsData.steps.length ? '' : `No ${test.label} screenshots found yet. Run the test first.`
      );
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

  return (
    <main className="mx-auto my-10 w-[min(980px,92%)]">
      <h1 className="m-0 text-4xl font-bold uppercase tracking-[0.06em] md:text-5xl">
        STANDARD REGRESSION TEST
      </h1>
      <p className="mb-7 mt-2 text-slate-600">Automation Control Panel</p>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_30px_rgba(22,31,43,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="m-0 text-2xl font-semibold">FIRST: SALES</h2>
        </div>


        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => selectPanel('sales')}
            className={`rounded-lg px-4 py-2 font-semibold text-white transition-colors ${
              showSalesCategories ? 'bg-teal-800' : 'bg-teal-700 hover:bg-teal-800'
            }`}
          >
            Run Sales Tests
          </button>
          <button
            type="button"
            onClick={() => selectPanel('addons')}
            className={`rounded-lg px-4 py-2 font-semibold text-white transition-colors ${
              showAddOns ? 'bg-indigo-800' : 'bg-indigo-700 hover:bg-indigo-800'
            }`}
          >
            Adds-On
          </button>
          <button
            type="button"
            onClick={openResults}
            className="rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-200"
          >
            View Results
          </button>
        </div>

        <div
          className={`grid transition-all duration-300 ease-out ${
            showSalesCategories
              ? 'mt-5 grid-rows-[1fr] opacity-100'
              : 'mt-0 grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-slate-200 pt-4">
              <div
                className={`rounded-xl border border-slate-200 bg-slate-50 p-4 transition-transform duration-300 ease-out ${
                  showSalesCategories ? 'translate-y-0' : '-translate-y-2'
                }`}
              >
              <h3 className="m-0 text-base font-semibold">Category</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {salesTests.map((test) => (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() => openRunModePopup(test)}
                    className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
                  >
                    {test.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {salesTests.map((test) => (
                  <button
                    key={`${test.id}-results`}
                    type="button"
                    onClick={() => openResults(test)}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
                  >
                    View {test.label}
                  </button>
                ))}
              </div>
              {runStatus && <p className="mt-3 text-sm text-slate-700">{runStatus}</p>}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`grid transition-all duration-300 ease-out ${
            showAddOns ? 'mt-5 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-slate-200 pt-4">
              <div
                className={`rounded-xl border border-slate-200 bg-slate-50 p-4 transition-transform duration-300 ease-out ${
                  showAddOns ? 'translate-y-0' : '-translate-y-2'
                }`}
              >
              <h3 className="m-0 text-base font-semibold">Adds-On</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {addOnTests.map((test) => (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() => openRunModePopup(test)}
                    className="rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white hover:bg-indigo-800"
                  >
                    {test.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {addOnTests.map((test) => (
                  <button
                    key={`${test.id}-results`}
                    type="button"
                    onClick={() => openResults(test)}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
                  >
                    View {test.label}
                  </button>
                ))}
              </div>
              {runStatus && <p className="mt-3 text-sm text-slate-700">{runStatus}</p>}
              </div>
            </div>
          </div>
        </div>

        {selectedTest && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="run-mode-title"
          >
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 id="run-mode-title" className="m-0 text-xl font-semibold">
                    {selectedTest.label}
                  </h3>
                  <p className="mb-0 mt-1 text-sm text-slate-600">Choose how to run this test.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTest(null)}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-xl leading-none text-slate-700 hover:bg-slate-200"
                  aria-label="Close"
                >
                  x
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => runSelectedTest('headed')}
                  className="rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800"
                >
                  Headed
                </button>
                <button
                  type="button"
                  onClick={() => runSelectedTest('ui')}
                  className="rounded-lg bg-rose-700 px-4 py-3 font-semibold text-white hover:bg-rose-800"
                >
                  UI
                </button>
              </div>
            </div>
          </div>
        )}

        {showResults && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="results-title"
          >
            <div className="print-results mx-auto my-6 w-full max-w-5xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 id="results-title" className="m-0 text-2xl font-semibold">
                    {activeResultTest.label} Results
                  </h3>
                  <p className="mb-0 mt-1 text-sm text-slate-600">
                    Step-by-step view from the latest saved screenshots.
                  </p>
                </div>
                <div className="no-print flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportResultsToPdf}
                    disabled={!resultSteps.length && !resultSummary?.modules?.length}
                    className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResults(false)}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-xl leading-none text-slate-700 hover:bg-slate-200"
                    aria-label="Close results"
                  >
                    x
                  </button>
                </div>
              </div>

              {resultsStatus && <p className="mt-4 text-sm text-slate-700">{resultsStatus}</p>}

              <div className="mt-5 space-y-5">
                {resultSteps.map((step, index) => (
                  <article
                    key={step.fileName}
                    className="print-avoid overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-700 text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="m-0 text-base font-semibold text-slate-900">
                          {step.title}
                        </h4>
                        <p className="m-0 text-sm text-slate-600">{step.description}</p>
                      </div>
                    </div>
                    <img
                      src={step.screenshotUrl}
                      alt={step.title}
                      className="block w-full bg-white"
                      loading="lazy"
                    />
                  </article>
                ))}

                {resultSummary?.modules?.length > 0 && (
                  <section className="print-avoid rounded-lg border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h4 className="m-0 text-base font-semibold text-slate-900">
                        Module Document Numbers
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="border-b border-slate-200 px-4 py-3 font-semibold">
                              Module
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 font-semibold">
                              Doc No
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 font-semibold">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultSummary.modules.map((entry) => (
                            <tr key={`${entry.module}-${entry.docNo}`}>
                              <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">
                                {entry.module}
                              </td>
                              <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                                {entry.docNo || '-'}
                              </td>
                              <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                                {entry.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {resultSummary?.status === 'success' && resultVideoUrl && (
                  <section className="no-print overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                    <div className="border-b border-slate-800 px-4 py-3">
                      <h4 className="m-0 text-base font-semibold text-white">
                        Success Video Presentation
                      </h4>
                    </div>
                    <video
                      className="block w-full bg-black"
                      src={resultVideoUrl}
                      controls
                      autoPlay
                      muted
                      loop
                    />
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
