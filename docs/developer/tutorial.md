# Developer Tutorial

Reusable function guide: `docs/developer/documentation.md`

Add a testcase to an existing module:

Step 1: create `tests/<module>/<test-name>.spec.js` because this is the actual Playwright test flow.

Step 2: update `config/dashboard/testResults.js` because this file gives the test its dashboard title, screenshot folder, and result step names.

Step 3: use the generated test ID because the dashboard now follows the folder and file name.

Normal pattern:

```txt
tests/sales/sales-return.spec.js
testId: sales-sales-return
```

Step 4: update page object files only if the test needs new screen actions.

Common files:

```txt
tests/pages/base/moduleNavigation/<TargetModule>MenuPage.js
tests/pages/transactions/<PageName>.js
tests/pages/approvals/<PageName>.js
tests/pages/popups/<CFLName>.js
```

Step 5: no need to update `src/App.jsx` because the dashboard detects the spec file automatically.

Step 6: run `node --check tests/<module>/<test-name>.spec.js` because this checks syntax before running the browser test.

Step 7: run `npx playwright test tests/<module>/<test-name>.spec.js --headed` because this confirms the test works by itself.


Add a new module:

Step 1: create `tests/<new-module>/` because the folder becomes the dashboard module group.

Step 2: create `tests/<new-module>/<test-name>.spec.js` because the dashboard only shows modules that contain test files.

Step 3: update `config/dashboard/testResults.js` because the first test needs dashboard result details.

Step 4: update `config/dashboard/testModules.js` because this controls the module button label, icon, and order.

Step 5: update page object files only if the new module needs new navigation or screen actions.

Step 6: no need to update `src/App.jsx` because the module button and test cards are created dynamically.

Step 7: run `npm run build` because this confirms the dashboard still compiles.

Step 8: run `npm run dev` because this lets you check that the new module button and test card appear in the UI.
