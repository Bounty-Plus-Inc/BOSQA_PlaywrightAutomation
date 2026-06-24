# BOS/BPI Automation Framework Full Tutorial

## 1. Main Idea

```text
Framework creates the test structure.
Page objects control the ERP screens.
Cards create dashboard inputs and buttons.
envKey sends dashboard input to Playwright.
Document readers capture loaded document data for replicate.
```

## 2. Create A Test Script

In the dashboard:

```text
Framework -> Scaffold Generator
```

Enter:

```text
Module name: Your Module
Test case name: Your Script
```

Framework creates:

```text
tests/your-module/your-script.spec.js
tests/pages/base/moduleNavigation/YourModuleMenuPage.js
tests/pages/transactions/YourScriptPage.js
docs/generated/your-module-your-script-scaffold.txt
```

Framework also updates:

```text
config/dashboard/testModules.js
config/dashboard/testResults.js
```

Test case ID format:

```text
your-module-your-script
```

## 3. What Each File Does

```text
spec.js
Main test flow.

ModuleMenuPage.js
Opens the ERP module.

YourScriptPage.js
Screen actions and validations.

testModules.js
Dashboard module label, icon, and order.

testResults.js
Result title, screenshots, Find Document utility setup.

testCards
Dashboard fields and buttons.
```

## 4. Add Navigation

Open:

```text
tests/pages/base/moduleNavigation/YourModuleMenuPage.js
```

Replace the scaffold TODO with real ERP menu clicks.

Example shape:

```js
async open() {
  const mainTab = await this.findInAllFrames('xpath=...');
  await mainTab.click();

  const menuItem = await this.findInAllFrames('xpath=...');
  await menuItem.click();
}
```

## 5. Add Page Object Actions

Open:

```text
tests/pages/transactions/YourScriptPage.js
```

Add reusable actions here.

Example:

```js
async fillCustomerCode(customerCode) {
  const input = await this.findInAllFrames('#df_bpcode');
  await input.fill(customerCode);
}
```

Rule:

```text
Selectors should mostly live in page objects.
The spec should call clean methods.
```

## 6. Add Test Flow

Open:

```text
tests/your-module/your-script.spec.js
```

The flow usually looks like:

```text
login
open module
wait for page
fill fields
click actions
validate result
record summary
take screenshots
```

## 7. Dashboard Card

Create card only if the dashboard user needs inputs/buttons.

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
        id: 'customerCode',
        type: 'text',
        label: 'Customer Code',
        envKey: 'BPI_TEST_CUSTOMER_CODE',
        required: true
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

## 8. Register Card

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
Mapping key must match the test case ID.
```

## 9. Use Dashboard Inputs

Card field:

```js
{
  id: 'customerCode',
  envKey: 'BPI_TEST_CUSTOMER_CODE'
}
```

Test script:

```js
const customerCode = process.env.BPI_TEST_CUSTOMER_CODE || '';
```

Flow:

```text
Dashboard input
envKey
Playwright process.env
spec.js
page object
ERP field
```

## 10. Field Types

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
  envKey: 'BPI_TEST_MODE',
  options: [
    { label: 'Display', value: 'display' },
    { label: 'Replicate', value: 'replicate' }
  ]
}
```

## 11. Use CFL Helpers

CFL popup helpers live in:

```text
tests/pages/popups
```

Example:

```text
ItemCFL.js
WarehouseCFL.js
BusinessPartnerCFL.js
ProfitCenterCFL.js
```

For a new transaction, call CFL from the transaction page object.

Example:

```js
await this.selectItemCodeWithRetry(itemCode);
```

Rule:

```text
CFL helper handles popup.
Transaction page handles field button and validation.
Spec only calls the transaction method.
```

## 12. Display And Replicate

Display / Replicate is the Find Document utility.

Main files:

```text
tests/utilities/findDocumentActions.js
tests/utilities/find-document.spec.js
config/dashboard/testResults.js
```

Add a module action in:

```text
tests/utilities/findDocumentActions.js
```

Example:

```js
{
  id: 'sales-order',
  label: 'Sales Order',
  testTitle: 'Sales Order Document',
  moduleId: 'sales',
  testResultId: 'sales-sales-order-transaction',
  moduleName: 'Sales Order',
  navigationModulePath: '../pages/base/moduleNavigation/SalesOrderMenuPage',
  navigationExportName: 'SalesOrderMenuPage',
  openedScreenshot: '00_FIND_DOCUMENT_SALES_ORDER_OPENED',
  loadedScreenshot: '01_FIND_DOCUMENT_SALES_ORDER_LOADED'
}
```

Modes:

```text
Display
Open module -> Find document -> Load document -> Stop

Replicate
Open module -> Find document -> Load document -> Capture data -> Recreate transaction
```

## 13. Reusable Document Readers

Reader files:

```text
tests/helpers/documentReaders/headerReader.js
tests/helpers/documentReaders/lineItemReader.js
tests/helpers/documentReaders/documentDataReader.js
```

Module configs:

```text
tests/helpers/documentReaders/config/SalesOrderDocumentData.js
```

Meaning:

```text
headerReader.js
Reads header selectors.

lineItemReader.js
Reads table row fields.

documentDataReader.js
Combines headers and line items.

SalesOrderDocumentData.js
Sales Order-specific header and line item config.
```

## 14. Add A New Document Data Config

Create:

```text
tests/helpers/documentReaders/config/YourModuleDocumentData.js
```

Shape:

```js
const YourModuleDocumentData = {
  headers: [
    {
      key: 'bpCode',
      selectors: ['#df_bpcode']
    }
  ],
  lineItems: {
    tableSelectors: ['div.divTableBox table.tableBox#T1'],
    fieldAliases: {
      itemcode: 'itemCode',
      itemdesc: 'itemDesc'
    }
  }
};
```

Then use:

```js
const capturedData = await readDocumentData(page, YourModuleDocumentData);
```

## 15. Current Sales Order Capture

Sales Order config is here:

```text
tests/helpers/documentReaders/config/SalesOrderDocumentData.js
```

It captures:

```text
bpCode
bpRefNo
shipToCode
shipToAddress
shipType
salesOrg
distributionChannel
division
businessCenter
lineItems
```

## 16. Short Rules

```text
Need a new test?
Use Framework scaffold.

Need dashboard input?
Create testCards config.

Need popup selection?
Use or create CFL helper.

Need Display / Replicate?
Add Find Document action.

Need captured document data?
Create DocumentData config.
```
