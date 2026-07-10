# Replicate Data

This guide explains how to set up a **Find Document Replicate** automation flow.
It is written for automation QA engineers who need to add or maintain replicate behavior.

Replicate means:

1. Open an existing document through **Find Document**.
2. Read header and line-item data from the loaded document.
3. Create a new transaction using the captured data.
4. Validate the recreated transaction and any next-step modules.

Current main example: **Sales Order replicate**.

---

## 1. How Replicate Works

The replicate flow starts in:

```txt
tests/utilities/find-document.spec.js
```

High-level flow:

```txt
findDocumentActions.js
  -> open selected module
  -> Find Document popup
  -> load source document
  -> readDocumentData()
  -> write captured JSON
  -> call replicate function
  -> recreate transaction
  -> validate result
```

For Sales Order:

```txt
Find Document
  -> read Sales Order data
  -> recreate Sales Order
  -> Save as Draft
  -> Add/Update
  -> Transaction Approval if needed
  -> Delivery Order Copy From
  -> Delivery Order Save as Draft
  -> Attachment
```

---

## 2. Files You Usually Edit

For a new replicate module, these are the main files:

```txt
tests/utilities/findDocumentActions.js
tests/helpers/documentReaders/config/<Module>DocumentData.js
tests/pages/ReCreateTransaction/<Module>.js
tests/utilities/replicateFlows/<module>Replicate.js
tests/utilities/replicateFlows/index.js
```

Optional files when the replicate has follow-up modules:

```txt
tests/pages/transactions/<NextModule>Page.js
tests/pages/approvals/<ApprovalPage>.js
tests/pages/base/moduleNavigation/<ModuleMenuPage>.js
tests/helpers/customCFL/*
tests/helpers/popup-attachment.js
```

---

## 3. Environment Setup

From the dashboard:

```txt
Find Document
  -> Select Sales Order
  -> Enter the source document number
  -> Click EXECUTE DOCUMENT
```

For direct terminal runs, use these `.env` values:

```env
BPI_TEST_ACTION_ID=sales-order
BPI_FIND_DOCUMENT_NO=SO0000179182
```

Run:

```bash
npx playwright test tests/utilities/find-document.spec.js
```

Meaning:

```txt
BPI_TEST_ACTION_ID=sales-order
  selects one action from findDocumentActions.js

BPI_FIND_DOCUMENT_NO=SO0000179182
  source document to open and copy
```

Find Document now executes the replicate flow directly. There is no Display mode flag to set.

---

## 4. Step 1 - Register The Module Action

Edit:

```txt
tests/utilities/findDocumentActions.js
```

Add an action object:

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

Important fields:

```txt
id
  Used by BPI_TEST_ACTION_ID.

navigationModulePath
  File that opens the module.

navigationExportName
  Class exported by the navigation file.

openedScreenshot / loadedScreenshot
  Screenshot names used by dashboard metadata.
```

If adding a new module, create or confirm the matching navigation page first.

Example navigation file:

```txt
tests/pages/base/moduleNavigation/SalesOrderMenuPage.js
```

---

## 5. Step 2 - Create Document Data Config

Create a config file:

```txt
tests/helpers/documentReaders/config/<Module>DocumentData.js
```

Example:

```txt
tests/helpers/documentReaders/config/SalesOrderDocumentData.js
```

This file tells the framework what data to capture from the source document.

### Header Fields

Header fields are one-value fields such as customer, ship type, business center, etc.

Example:

```js
{
  key: 'bpCode',
  selectors: [
    'input#df_bpcode[name="df_bpcode"]',
    'input#df_bpcode',
    'input[name="df_bpcode"]',
    '#df_bpcode'
  ]
}
```

How to choose selectors:

1. Open the source document manually.
2. Inspect the field in Chrome DevTools.
3. Prefer stable selectors like:

```txt
input#df_bpcode
select#df_shiptocode
textarea#df_shiptoaddress
```

4. Add fallback selectors if the field can render differently.

The `key` becomes the captured data property:

```js
capturedData.bpCode
```

### Line Item Fields

Line items are read from table rows.

Example:

```js
lineItems: {
  tableSelectors: [
    'div.divTableBox table.tableBox#T1',
    'div.divTableBox table.tableBox[id]',
    'table.tableBox#T1'
  ],
  fieldAliases: {
    itemcode: 'itemCode',
    itemdesc: 'itemDesc',
    unitprice: 'unitPrice',
    whscode: 'warehouseCode',
    uBusinessCenter: 'businessCenter'
  }
}
```

The reader scans row fields like:

```txt
df_itemcodeT1r1
dd_itemcodeT1r1
df_unitpriceT1r1
dd_unitpriceT1r1
```

Field name logic:

```txt
df_itemcodeT1r1 -> itemcode -> itemCode
df_u_quantity1T1r1 -> u_quantity1 -> uQuantity1
df_whscodeT1r1 -> whscode -> warehouseCode if aliased
```

Use `fieldAliases` when the automatic key is not the key you want in recreate code.

---

## 6. Step 3 - Create The Replicate Flow File

Create:

```txt
tests/utilities/replicateFlows/<module>Replicate.js
```

Example:

```txt
tests/utilities/replicateFlows/salesOrderReplicate.js
```

Import the module data config and any page objects needed by this module:

```js
const {
  SalesOrderDocumentData
} = require('../../helpers/documentReaders/config/SalesOrderDocumentData');
const { SalesOrder } = require('../../pages/ReCreateTransaction/SalesOrder');
```

Export a flow object:

```js
async function replicateSalesOrderTransaction({
  capturedData,
  page,
  testId,
  testName,
  recordValidationResult,
  recordModuleDocNo,
  takeStepScreenshot
}) {
  const salesOrder = new SalesOrder(page);

  await salesOrder.recreateFromCapturedData(capturedData, {
    afterValidation: ({ testScript, expectedValue, actualValue }) => {
      recordValidationResult(testId, testScript, expectedValue, actualValue);
    }
  });

  // Continue module-specific draft/add/approval/follow-up logic here.
  return 'success';
}

const salesOrderReplicateFlow = {
  actionId: 'sales-order',
  documentDataConfig: SalesOrderDocumentData,
  replicate: replicateSalesOrderTransaction
};

module.exports = {
  salesOrderReplicateFlow
};
```

Important:

```txt
actionId
  Must match the action id from findDocumentActions.js.

documentDataConfig
  Tells Find Document what source document fields to capture.

replicate
  Runs only this module's recreate and follow-up workflow.
```

If the `actionId` does not match, the source document may open, but the replicate flow will not be found.

---

## 7. Step 4 - Register The Flow

Edit:

```txt
tests/utilities/replicateFlows/index.js
```

Add the new flow:

```js
const { salesOrderReplicateFlow } = require('./salesOrderReplicate');
const { yourModuleReplicateFlow } = require('./yourModuleReplicate');

const replicateFlowsByActionId = {
  [salesOrderReplicateFlow.actionId]: salesOrderReplicateFlow,
  [yourModuleReplicateFlow.actionId]: yourModuleReplicateFlow
};

module.exports = {
  replicateFlowsByActionId
};
```

The registry key comes from the flow's `actionId`, and that value must match:

```txt
tests/utilities/findDocumentActions.js
```

Do not add module-specific imports or `if action.id === ...` logic to `find-document.spec.js`.

---

## 8. Step 5 - Understand Captured Data

The capture happens here:

```js
const capturedData = await readDocumentData(page, documentDataConfig);
```

Reader file:

```txt
tests/helpers/documentReaders/documentDataReader.js
```

Header reader:

```txt
tests/helpers/documentReaders/headerReader.js
```

Line reader:

```txt
tests/helpers/documentReaders/lineItemReader.js
```

Captured data shape:

```js
{
  bpCode: 'C000001',
  shipToCode: 'MAIN',
  businessCenter: 'NCRCL',
  lineItems: [
    {
      row: 1,
      itemCode: '10000006',
      itemDesc: 'FCA 1-REGULAR',
      unitPrice: '500.000000',
      uQuantity1: '50',
      uQuantity2: '0.000',
      warehouseCode: 'FGGPBEMNINACACULL',
      values: {
        itemcode: '10000006',
        unitprice: '500.000000',
        u_quantity1: '50'
      }
    }
  ]
}
```

The framework also writes the captured document to:

```txt
test-results/captured-documents
```

Use that output when debugging whether capture or recreate is wrong.

---

## 9. Step 6 - Create The ReCreateTransaction Page

Create:

```txt
tests/pages/ReCreateTransaction/<Module>.js
```

Example:

```txt
tests/pages/ReCreateTransaction/SalesOrder.js
```

This file turns captured data into a new transaction.

Common structure:

```js
class SalesOrder extends SalesOrderPage {
  async recreateFromCapturedData(capturedData, hooks = {}) {
    // 1. read captured header fields
    // 2. validate required values
    // 3. select customer/vendor/BP
    // 4. fill header fields
    // 5. loop captured line items
    // 6. validate recreated rows
  }

  async recreateLineItem(lineItem, hooks = {}, targetRowNumber = 1) {
    // 1. select item
    // 2. validate item description
    // 3. fill price/quantity/warehouse/profit center
    // 4. click Update
    // 5. validate persisted row
  }
}
```

Use the captured keys from your data config:

```js
const itemCode = String(lineItem.itemCode || '').trim();
const unitPrice = this.readCapturedLineValue(lineItem, 'unitPrice', 'unitprice');
const warehouseCode = this.readCapturedLineValue(lineItem, 'warehouseCode', 'whscode');
```

Use fallback keys because line data can exist in two places:

```txt
lineItem.unitPrice
lineItem.values.unitprice
```

---

## 10. Step 7 - Keep Business Decisions In The Flow

Put module-specific decisions inside:

```txt
tests/utilities/replicateFlows/<module>Replicate.js
```

Example:

```js
async function replicateSalesOrderTransaction(context) {
  const { page, testId, recordModuleDocNo } = context;
  const salesOrder = new SalesOrder(page);
  const draftOutcome = await salesOrder.saveAsDraft();

  if (draftOutcome.isPostingDateOrDueDateInvalid) {
    const memory = await salesOrder.readDocumentMemory();
    recordModuleDocNo(
      'Sales Order',
      memory.docNo,
      'Created Transaction is not valid to current posting period or Duedate',
      testId,
      'Check Posting Date or Due Date setup to proceed the selected transaction.'
    );
    return 'success';
  }

  const addOutcome = await salesOrder.addOrUpdateUntilOpen();

  // Continue approval / delivery / success handling here.
  return 'success';
}
```

Keep business decisions in this function:

```txt
If credit limit blocked -> run Credit Limit Checking
If transaction approval needed -> run Transaction Approval
If open -> success
If posting period setup issue -> success with setup remarks
```

---

## 11. Step 8 - How Find Document Routes The Flow

The generic spec reads the registry:

```txt
tests/utilities/find-document.spec.js
```

Current pattern:

```js
const replicateFlow = replicateFlowsByActionId[action.id] || null;
const documentDataConfig = replicateFlow?.documentDataConfig || {};
const capturedData = await readDocumentData(page, documentDataConfig);

if (replicateFlow?.replicate) {
  finalStatus = await replicateFlow.replicate({
    capturedData,
    page,
    testId,
    testName,
    action,
    documentNo,
    recordValidationResult,
    recordModuleDocNo,
    takeStepScreenshot
  });
} else {
  recordModuleDocNo(action.moduleName, '', 'Replicate not configured', testId);
}
```

For a new module, only update `replicateFlows/index.js`. The spec should stay generic.

---

## 12. Step 9 - Add Validations To The Result Table

Use:

```js
recordModuleDocNo(moduleName, expectedOrDocNo, actualOrStatus, testId, remarks);
```

Example:

```js
recordModuleDocNo(
  'Delivery Order IRCD Version',
  '1',
  actualValue,
  testId,
  'Validated successfully against the expected value.'
);
```

For expected vs actual validation, this helper is passed into the replicate flow by `find-document.spec.js`:

```js
recordValidationResult(testId, testScript, expectedValue, actualValue);
```

Use result table records for anything a QA reviewer must see:

```txt
Created document number
Draft/Open status
Posting-period setup issue
Approval success
Copied line validation
Attachment validation
```

---

## 13. Step 10 - Add Screenshots

Use:

```js
await takeStepScreenshot(page, testName, 'SCREENSHOT_NAME');
```

Popup example:

```js
await takeStepScreenshot(copyFrom.page, testName, '15_RECREATE_DELIVERY_COPY_FROM_POPUP');
```

Screenshots are saved in:

```txt
test-results/screenshots/<test_name>
```

If the dashboard needs to display the screenshot, also update:

```txt
config/dashboard/testResults.js
```

Add a metadata entry:

```js
'15_RECREATE_DELIVERY_COPY_FROM_POPUP.png': {
  title: 'Copy From Sales Order opened',
  description: 'The Delivery Order Copy From popup opened.'
}
```

---

## 14. Step 11 - Common Selector Collection Guide

When setting up replicate, collect these from DevTools.

### Header Fields

Get selectors for:

```txt
BP / Customer / Vendor code
Reference number
Ship To / Bill To
Posting date / due date if needed
Business center
Any required UDFs
```

Prefer:

```txt
input#df_fieldname
select#df_fieldname
textarea#df_fieldname
```

### Line Item Fields

For row tables, inspect row 1.

Common pattern:

```txt
df_itemcodeT1r1
dd_itemcodeT1r1
df_itemdescT1r1
df_unitpriceT1r1
df_u_quantity1T1r1
df_whscodeT1r1
```

Field name is the middle part:

```txt
df_unitpriceT1r1 -> unitprice
df_u_quantity1T1r1 -> u_quantity1
```

Add aliases only when needed.

### Buttons

Collect:

```txt
Save as Draft
Add / Update
Line Update button
CFL buttons
Tabs
OK / Finish buttons
```

Example:

```txt
#btnSaveAsDraft
#btnAdd
#T1_btnUpdate
#tab1nav5
#cfl_itemcodeT1
```

---

## 15. Current Sales Order Replicate Notes

Sales Order replicate currently supports:

```txt
Header capture
Line item capture
Sales Order recreation
U Quantity 1 / U Quantity 2 fallback
Posting-period validation after Save as Draft
Credit limit flow
Transaction approval flow
Delivery Order Copy From
Copied line validation
Delivery Order header/detail completion
Delivery Order Save as Draft
IRCD Version validation
Popup attachment upload
```

Important files:

```txt
tests/pages/ReCreateTransaction/SalesOrder.js
tests/utilities/replicateFlows/salesOrderReplicate.js
tests/pages/transactions/SalesOrderPage.js
tests/pages/transactions/DeliveryOrderPage.js
tests/pages/approvals/TransactionApprovalPage.js
tests/helpers/customCFL
tests/helpers/popup-attachment.js
```

---

## 16. Debugging Checklist

### Source document opens but no data is captured

Check:

```txt
tests/helpers/documentReaders/config/<Module>DocumentData.js
```

Verify:

```txt
tableSelectors match the real table
header selectors match loaded fields
fieldAliases use actual row field names
```

### Captured data is correct but recreate fails

Check:

```txt
tests/pages/ReCreateTransaction/<Module>.js
```

Verify:

```txt
required fields are not blank
CFL selectors are correct
line item update button is clicked
row validation selectors match persisted row
```

### Result table says Replicate not configured

Check:

```txt
tests/utilities/replicateFlows/index.js
```

You probably created the flow but did not register it:

```js
const replicateFlowsByActionId = {
  [yourModuleReplicateFlow.actionId]: yourModuleReplicateFlow
};
```

### Wrong value captured from popup CFL

Do not read broad column/footer text.
Read row fields like:

```txt
df_codeT1r1
dd_codeT1r1
df_u_platenoT1r1
dd_u_platenoT1r1
```

### Date field looks correct on screen but automation reads blank

Use polling and DOM value read:

```js
await expect.poll(async () => readFieldValue()).toBe(expected);
```

Do not read immediately after clicking the date.

---

## 17. New Module Template

Use this checklist when adding a new replicate module.

```txt
1. Add action in tests/utilities/findDocumentActions.js
2. Create tests/helpers/documentReaders/config/<Module>DocumentData.js
3. Create tests/pages/ReCreateTransaction/<Module>.js
4. Code recreateFromCapturedData()
5. Code recreateLineItem()
6. Create tests/utilities/replicateFlows/<module>Replicate.js
7. Export actionId, documentDataConfig, and replicate from the flow file
8. Register the flow in tests/utilities/replicateFlows/index.js
9. Add screenshots and dashboard metadata if needed
10. Run from the dashboard with EXECUTE DOCUMENT, or use BPI_TEST_ACTION_ID and BPI_FIND_DOCUMENT_NO for terminal runs
11. Check captured document JSON in test-results/captured-documents
12. Check result table summary JSON in test-results
```

---

## 18. Minimum Test Run

Use this for Sales Order replicate:

```env
BPI_TEST_ACTION_ID=sales-order
BPI_FIND_DOCUMENT_NO=SO0000179182
```

Run:

```bash
npx playwright test tests/utilities/find-document.spec.js
```

After the run, inspect:

```txt
test-results/utilities-find-document-summary.json
test-results/captured-documents
test-results/screenshots/find_document
```
