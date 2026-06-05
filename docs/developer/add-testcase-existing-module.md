# Add A Test Case To An Existing Module

Step 1: create `tests/<module>/<test-name>.spec.js` because this is the actual Playwright test flow.

Step 2: update `config/dashboard/testResults.js` because this file gives the test its dashboard title, screenshot folder, and result step names.

Step 3: use the generated test ID because the dashboard follows the folder and file name.

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

Step 8: run `npm run dev` because this lets you check the button and results in the dashboard.
