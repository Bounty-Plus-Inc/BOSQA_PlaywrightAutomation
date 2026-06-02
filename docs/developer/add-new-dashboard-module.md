# Add A New Dashboard Module

Step 1: create `tests/<new-module>/` because the folder becomes the dashboard module group.

Step 2: create `tests/<new-module>/<test-name>.spec.js` because the dashboard only shows modules that contain test files.

Step 3: update `config/dashboard/testResults.js` because the first test needs dashboard result details.

Step 4: update `config/dashboard/testModules.js` because this controls the module button label, icon, and order.

Step 5: use the generated test ID because the dashboard follows the folder and file name.

Normal pattern:

```txt
tests/inventory/stock-transfer.spec.js
testId: inventory-stock-transfer
```

Step 6: update page object files only if the new module needs new navigation or screen actions.

Common files:

```txt
tests/pages/base/MainMenuPage.js
tests/pages/transactions/<PageName>.js
tests/pages/approvals/<PageName>.js
tests/pages/popups/<PopupName>.js
```

Step 7: no need to update `src/App.jsx` because the module button and test cards are created dynamically.

Step 8: run `node --check tests/<new-module>/<test-name>.spec.js` because this checks the new test file.

Step 9: run `npm run build` because this confirms the dashboard still compiles.

Step 10: run `npm run dev` because this lets you check that the new module button and test card appear in the UI.
