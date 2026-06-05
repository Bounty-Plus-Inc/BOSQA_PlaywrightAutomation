# Scaffold Generator Add-On

This add-on owns the code that creates new dashboard modules and Playwright test cases.

Call flow:

1. Dashboard calls `/api/create-scaffold`.
2. `config/dashboard/playwrightRunnerApi.js` calls `createTestScaffold`.
3. `scripts/create-test-scaffold.js` also calls the same add-on for terminal usage.
4. `createTestScaffold.js` creates the spec, navigation page, transaction page, dashboard config entries, and guide file.

Terminal usage stays the same:

```powershell
npm run create-scaffold -- --module "Invoices" --test "AR Invoice"
```
