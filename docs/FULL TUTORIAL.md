# BOS/BPI Automation Framework Full Tutorial

## 1. How The Framework Works

![Framework overview](./screenshots/full-tutorial/01-framework-overview.png)

```text
Framework scaffold creates the base files.
Navigation page opens the ERP module.
Transaction page contains field and button actions.
Spec file controls the test flow.
Test card creates dashboard fields and buttons.
envKey sends dashboard input into Playwright.
Utilities handle shared flows like Find Document.
Document readers capture loaded document data for replicate.
```

Keep this rule:

```text
Generic helpers must not assume Sales Order.
Module-specific values must live in module configs, specs, or page objects.
```

## 2. Create A New Module

![Create a new module](./screenshots/full-tutorial/02-create-new-module.png)

Open the dashboard:

```text
Framework -> Scaffold Generator
```

Enter:

```text
Module name: Your Module
Test case name: Your Script
```

The framework creates:

```text
tests/your-module/your-script.spec.js
tests/pages/base/moduleNavigation/YourModuleMenuPage.js
tests/pages/transactions/YourScriptPage.js
docs/generated/your-module-your-script-scaffold.txt
```

The framework updates:

```text
config/dashboard/testModules.js
config/dashboard/testResults.js
```

The test case ID becomes:

```text
your-module-your-script
```

Format:

```text
module-name-test-case-name
```

## 3. File Responsibilities

![File responsibilities](./screenshots/full-tutorial/03-file-responsibilities.png)

```text
tests/your-module/your-script.spec.js
Main Playwright test flow.

tests/pages/base/moduleNavigation/YourModuleMenuPage.js
ERP menu navigation.

tests/pages/transactions/YourScriptPage.js
Field filling, buttons, validation, module-specific methods.

config/dashboard/testModules.js
Dashboard sidebar module label, icon, and order.

config/dashboard/testResults.js
Result title, screenshots, item count env, utility metadata.

config/dashboard/testCards
Dashboard card fields and run/view buttons.

tests/pages/popups
Reusable CFL popup helpers.

tests/helpers/documentReaders
Reusable document capture helpers.
```

## 4. Step 1: Fix Navigation

![Fix navigation](./screenshots/full-tutorial/04-step-1-fix-navigation.png)

Open:

```text
tests/pages/base/moduleNavigation/YourModuleMenuPage.js
```

Replace the scaffold TODO.

Example shape:

```js
async open() {
  const mainTab = await this.findInAllFrames('xpath=...');
  await mainTab.click();

  const moduleMenu = await this.findInAllFrames('xpath=...');
  await moduleMenu.click();
}
```

Rule:

```text
Navigation page only opens the module.
Do not place transaction field logic here.
```

## 5. Step 2: Add Page Object Actions

![Add page object actions](./screenshots/full-tutorial/05-step-2-add-page-object-actions.png)

Open:

```text
tests/pages/transactions/YourScriptPage.js
```

Add methods for fields and buttons.

Example:

```js
async fillRemarks(remarks) {
  const remarksInput = await this.findInAllFrames('#df_remarks');
  await remarksInput.fill(remarks);
}
```

Example with validation:

```js
async fillReferenceNo(referenceNo) {
  const input = await this.findInAllFrames('#df_bprefno');
  await input.fill(referenceNo);
  await expect(input).toHaveValue(referenceNo);
}
```

Rule:

```text
Spec calls methods.
Page object knows selectors.
```

## 6. Step 3: Build The Spec Flow

![Build the spec flow](./screenshots/full-tutorial/06-step-3-build-the-spec-flow.png)

Open:

```text
tests/your-module/your-script.spec.js
```

Typical flow:

```text
set testId
startRunSummary(testId, title)
login
open module
expect loaded
read env values
call page object methods
save/add/update
recordModuleDocNo(..., testId)
finishRunSummary(status, testId)
```

Example:

```js
const testId = 'your-module-your-script';
const remarks = process.env.BPI_YOUR_REMARKS || '';

startRunSummary(testId, 'Your Script');

await loginPage.loginAs();
await moduleNavigation.open();
await transactionPage.expectLoaded();
await transactionPage.fillRemarks(remarks);

recordModuleDocNo('Your Module', '', 'Completed', testId);
finishRunSummary('success', testId);
```

Important:

```text
Always pass testId.
Shared summary helpers do not default to Sales Order.
```

## 7. Step 4: Add A Dashboard Card

![Add a dashboard card](./screenshots/full-tutorial/07-step-4-add-a-dashboard-card.png)

Create a card only when dashboard users need inputs or buttons.

Create:

```text
config/dashboard/testCards/your-module/your-script.js
```

Example:

```js
export const yourScriptCards = [
  {
    id: 'transaction',
    title: 'Transaction',
    subtitle: 'Your Script',
    testScript: 'tests/your-module/your-script.spec.js',
    fields: [
      {
        id: 'remarks',
        type: 'text',
        label: 'Remarks',
        envKey: 'BPI_YOUR_REMARKS',
        required: false
      }
    ],
    buttons: [
      {
        id: 'run-transaction',
        label: 'Automate Transaction',
        action: 'runTest',
        icon: 'play',
        runs: 'tests/your-module/your-script.spec.js'
      },
      {
        id: 'view-results',
        label: 'View Results',
        action: 'viewResults',
        icon: 'eye',
        variant: 'secondary'
      }
    ]
  }
];
```

## 8. Step 5: Register The Card

![Register the card](./screenshots/full-tutorial/08-step-5-register-the-card.png)

Open:

```text
config/dashboard/testCards/index.js
```

Add import:

```js
import { yourScriptCards } from './your-module/your-script.js';
```

Add mapping:

```js
'your-module-your-script': yourScriptCards
```

Rule:

```text
The mapping key must match the test case ID.
```

## 9. How Card Fields Reach Playwright

![How card fields reach Playwright](./screenshots/full-tutorial/09-how-card-fields-reach-playwright.png)

Card field:

```js
{
  id: 'remarks',
  type: 'text',
  label: 'Remarks',
  envKey: 'BPI_YOUR_REMARKS'
}
```

Dashboard user types:

```text
Created by functional user
```

Runner sends:

```text
process.env.BPI_YOUR_REMARKS = Created by functional user
```

Spec reads:

```js
const remarks = process.env.BPI_YOUR_REMARKS || '';
```

Spec passes to page object:

```js
await transactionPage.fillRemarks(remarks);
```

Page object fills ERP:

```js
async fillRemarks(remarks) {
  const input = await this.findInAllFrames('#df_remarks');
  await input.fill(remarks);
}
```

Full path:

```text
Dashboard field
envKey
process.env
spec variable
page object method
ERP selector
```

## 10. Field Types

![Field types](./screenshots/full-tutorial/10-field-types.png)

Text:

```js
type: 'text'
```

Number:

```js
type: 'number'
```

Dropdown:

```js
{
  id: 'mode',
  type: 'dropdown',
  label: 'Mode',
  envKey: 'BPI_YOUR_MODE',
  options: [
    { label: 'Display', value: 'display' },
    { label: 'Replicate', value: 'replicate' }
  ]
}
```

Read dropdown:

```js
const mode = process.env.BPI_YOUR_MODE || '';
```

## 11. Module-Specific Env Names

![Module-specific env names](./screenshots/full-tutorial/11-module-specific-env-names.png)

Use env names that belong to the module.

Good:

```text
BPI_SALES_BPCODE
BPI_DELIVERY_BPCODE
BPI_PURCHASING_VENDOR_CODE
BPI_INVENTORY_ITEM_CODE
```

Avoid generic helpers defaulting to one module:

```text
Generic helper should not default to BPI_SALES_BPCODE.
```

Current standard:

```text
Generic helper accepts envKey.
Module spec or page object passes envKey.
```

Example:

```js
await fillBpCodeField(this, bpCode, {
  envKey: 'BPI_DELIVERY_BPCODE'
});
```

## 12. Item Count

![Item count](./screenshots/full-tutorial/12-item-count.png)

The runner always sends:

```text
BPI_TEST_ITEM_COUNT
```

If a module needs a module-specific item count env, set it in:

```text
config/dashboard/testResults.js
```

Example:

```js
itemCountEnvKey: 'BPI_SALES_ITEM_COUNT'
```

Then the runner sends both:

```text
BPI_TEST_ITEM_COUNT
BPI_SALES_ITEM_COUNT
```

Future module example:

```js
itemCountEnvKey: 'BPI_PURCHASING_LINE_COUNT'
```

## 13. Using Popup/CFL Helpers

![Using popup CFL helpers](./screenshots/full-tutorial/13-using-popup-cfl-helpers.png)

Popup helpers live in:

```text
tests/pages/popups
```

Examples:

```text
BusinessPartnerCFL.js
ItemCFL.js
WarehouseCFL.js
ProfitCenterCFL.js
```

Use popup helpers from the transaction page object.

Do not put popup steps directly in the spec unless it is temporary debugging.

Good flow:

```text
spec.js
calls transactionPage.selectItemCode(itemCode)

transaction page
clicks CFL button
opens popup helper
validates returned ERP field

popup helper
searches and selects popup row
```

## 14. Example: Using ItemCFL In A Module

![Using ItemCFL in a module](./screenshots/full-tutorial/14-using-itemcfl-in-a-module.png)

In transaction page:

```js
const { expect } = require('@playwright/test');
const { ItemCFL, DEFAULT_ITEM_SELECTORS } = require('../popups/ItemCFL');
```

Method shape:

```js
async selectItemCode(itemCode) {
  const itemCflButton = await this.findInAllFrames(DEFAULT_ITEM_SELECTORS.trigger);
  const popupPromise = this.page.context().waitForEvent('page', { timeout: 15000 });

  await itemCflButton.click();

  const popupPage = await popupPromise;
  const itemCFL = new ItemCFL(popupPage);
  await itemCFL.selectItemByLabel(itemCode);

  const itemInput = await this.findInAllFrames('#df_itemcodeT1');
  await expect(itemInput).toHaveValue(itemCode);
}
```

Spec usage:

```js
await transactionPage.selectItemCode(itemCode);
```

Rule:

```text
Popup helper handles popup.
Transaction page handles module field button and validation.
Spec only calls the transaction method.
```

## 15. Example: Using Business Partner Field Helper

![Using Business Partner field helper](./screenshots/full-tutorial/15-using-business-partner-field-helper.png)

Generic helper:

```text
tests/helpers/bpCode.js
```

Use it with explicit envKey:

```js
await fillBpCodeField(this, bpCode, {
  envKey: 'BPI_YOUR_MODULE_BPCODE'
});
```

If your module needs a CFL instead of direct fill, create a method in the transaction page:

```js
async selectBusinessPartner(bpCode) {
  const cflButton = await this.findInAllFrames('#cfl_bpcode');
  const popupPromise = this.page.context().waitForEvent('page');
  await cflButton.click();

  const popupPage = await popupPromise;
  const bpCFL = new BusinessPartnerCFL(popupPage);
  const selectedCode = await bpCFL.selectCustomerCode(bpCode);

  const input = await this.findInAllFrames('#df_bpcode');
  await expect(input).toHaveValue(selectedCode);
}
```

## 16. Utilities

![Utilities](./screenshots/full-tutorial/16-utilities.png)

Utilities are shared flows that can appear beside a test.

Current utility:

```text
Find Document
```

Main files:

```text
tests/utilities/findDocumentActions.js
tests/utilities/find-document.spec.js
config/dashboard/testResults.js
```

Display mode:

```text
Open module
Find document
Load document
Stop
```

Replicate mode:

```text
Open module
Find document
Load document
Capture data
Recreate transaction
```

## 17. Add Find Document To A Module

![Add Find Document to a module](./screenshots/full-tutorial/17-add-find-document-to-a-module.png)

Open:

```text
tests/utilities/findDocumentActions.js
```

Add:

```js
{
  id: 'your-module',
  label: 'Your Module',
  testTitle: 'Your Module Document',
  moduleId: 'your-module',
  testResultId: 'your-module-your-script',
  moduleName: 'Your Module',
  navigationModulePath: '../pages/base/moduleNavigation/YourModuleMenuPage',
  navigationExportName: 'YourModuleMenuPage',
  openedScreenshot: '00_FIND_DOCUMENT_YOUR_MODULE_OPENED',
  loadedScreenshot: '01_FIND_DOCUMENT_YOUR_MODULE_LOADED'
}
```

This attaches Find Document to the target test card.

## 18. Reusable Document Capture

![Reusable document capture](./screenshots/full-tutorial/18-reusable-document-capture.png)

Reader files:

```text
tests/helpers/documentReaders/headerReader.js
tests/helpers/documentReaders/lineItemReader.js
tests/helpers/documentReaders/documentDataReader.js
```

Module configs:

```text
tests/helpers/documentReaders/config
```

Current config:

```text
SalesOrderDocumentData.js
```

Meaning:

```text
headerReader.js
Reads configured header selectors.

lineItemReader.js
Reads configured line item table.

documentDataReader.js
Combines headers and line items.

SalesOrderDocumentData.js
Defines what Sales Order wants to capture.
```

## 19. Create Document Capture For A New Module

![Create document capture for a new module](./screenshots/full-tutorial/19-create-document-capture-for-a-new-module.png)

Create:

```text
tests/helpers/documentReaders/config/YourModuleDocumentData.js
```

Example:

```js
const YourModuleDocumentData = {
  headers: [
    {
      key: 'bpCode',
      selectors: ['#df_bpcode']
    },
    {
      key: 'referenceNo',
      selectors: ['#df_bprefno']
    }
  ],
  lineItems: {
    tableSelectors: [
      'div.divTableBox table.tableBox#T1',
      'div.divTableBox table.tableBox[id]'
    ],
    fieldAliases: {
      itemcode: 'itemCode',
      itemdesc: 'itemDesc',
      whscode: 'warehouseCode'
    }
  }
};

module.exports = {
  YourModuleDocumentData
};
```

Use it:

```js
const { readDocumentData } = require('../helpers/documentReaders/documentDataReader');
const { YourModuleDocumentData } = require('../helpers/documentReaders/config/YourModuleDocumentData');

const capturedData = await readDocumentData(page, YourModuleDocumentData);
```

## 20. What fieldAliases Does

![What fieldAliases does](./screenshots/full-tutorial/20-what-fieldaliases-does.png)

ERP row field:

```text
itemcode
```

Alias:

```js
fieldAliases: {
  itemcode: 'itemCode'
}
```

Captured JSON:

```js
{
  itemCode: '13800292'
}
```

Use aliases when:

```text
ERP field name is ugly.
You want a clean JSON name.
Replicate code expects a business-friendly name.
```

No alias needed when:

```text
The automatic camelCase name is already okay.
```

## 21. Recreate Transaction

![Recreate transaction](./screenshots/full-tutorial/21-recreate-transaction.png)

Recreate files live in:

```text
tests/pages/ReCreateTransaction
```

Example:

```text
SalesOrder.js
```

These files take captured data and create a new transaction.

Flow:

```text
Find Document Replicate
capture document data
open new transaction
wire headers
wire line items
save as draft
add/update
approval or credit limit flow if needed
```

## 22. New Module Maintenance Checklist

![New module maintenance checklist](./screenshots/full-tutorial/22-new-module-maintenance-checklist.png)

When creating a new module:

```text
1. Create scaffold from Framework.
2. Fill navigation selectors.
3. Add page object methods.
4. Add spec flow.
5. Add card only if dashboard inputs/buttons are needed.
6. Register card in testCards/index.js.
7. Use module-specific env names.
8. Pass testId to all runSummary calls.
9. Use popup helpers from transaction page objects.
10. Add Find Document action if needed.
11. Add DocumentData config if replicate needs capture.
12. Add ReCreateTransaction file if replicate needs recreation.
13. Run node --check.
14. Run npm test -- --list.
15. Run the new spec headed first.
```

## 23. Common Commands

![Common commands](./screenshots/full-tutorial/23-common-commands.png)

Syntax check:

```text
node --check tests/your-module/your-script.spec.js
```

List tests:

```text
npm test -- --list
```

Run one test headed:

```text
npx playwright test tests/your-module/your-script.spec.js --headed
```

Run dashboard build:

```text
npm run build
```

## 24. Clean Rules

![Clean rules](./screenshots/full-tutorial/24-clean-rules.png)

```text
Do not put module-specific defaults in generic helpers.
Do not put selectors directly in specs unless temporary.
Do not make documentLineItems import Sales Order config.
Do not reuse Sales env names for other modules.
Do not add cards unless dashboard users need inputs.
```

Preferred pattern:

```text
Module-specific data -> module config/spec/page object
Reusable behavior -> helpers
Dashboard UI -> testCards
Shared utilities -> tests/utilities
```
