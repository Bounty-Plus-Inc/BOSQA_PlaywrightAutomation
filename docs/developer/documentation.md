# Reusable Function Documentation

This file explains the reusable helpers and page-object methods used by the Playwright tests.

Use helpers for shared test behavior.
Use page objects for screen-specific actions.
Keep screen selectors inside page objects.
Keep module navigation selectors inside dedicated files under `tests/pages/base/moduleNavigation/`.


Base helpers:

`tests/pages/base/BasePage.js`

`new BasePage(page)`

Creates a wrapper around a Playwright `page`.

Use it when you need frame-aware helper methods.

```js
const { BasePage } = require('../pages/base/BasePage');
const basePage = new BasePage(page);
```

`findInAllFrames(selector, maxAttempts = 3)`

Finds the first matching element inside any frame.

Use this instead of `page.locator()` when the BPI screen may be inside an iframe.

```js
const button = await this.findInAllFrames('a#btnAdd[name="btnAdd"]', 20);
await button.click();
```

`findVisibleInAllFrames(selector, maxAttempts = 3)`

Finds the first visible matching element inside any frame.

Use this when hidden duplicate elements may exist.

```js
const menu = await this.findVisibleInAllFrames('a#menuSalesOrder', 20);
await menu.click();
```

`clickIfExists(selector, attempts = 4)`

Clicks an element if it exists.

Returns `true` if clicked, `false` if not found.

```js
const clicked = await this.clickIfExists('a#btnUpdate[name="btnUpdate"]', 6);
```

`triggerClickInAnyFrame(selector)`

Runs a DOM click directly inside the matching frame.

Use this as a fallback when normal Playwright click fails.

```js
const triggered = await this.triggerClickInAnyFrame('a#menuSalesDelivery');
```

`ensureVisibleInAnyFrame(selector)`

Forces a hidden element to become visible by changing DOM styles.

Use this only when the application hides a button that must be available for automation.

```js
await this.ensureVisibleInAnyFrame('a#btnAdd[name="btnAdd"]');
```

`hasVisibleTextInAnyFrame(text, timeout = 2000)`

Checks if text is visible in any frame.

Returns `true` or `false`.

```js
const found = await this.hasVisibleTextInAnyFrame('Bounty Plus Inc.');
```


Login:

`tests/pages/base/LoginPage.js`

`new LoginPage(page)`

Creates the login page object.

```js
const { LoginPage } = require('../pages/base/LoginPage');
const loginPage = new LoginPage(page);
```

`goto()`

Opens the logout/login URL.

Usually called by `loginAs()`.

```js
await loginPage.goto();
```

`loginAs(userId, password)`

Logs in to BPI.

If no values are passed, it uses `BPI_USERID`, `BPI_PASSWORD`, or the default test account.

```js
await loginPage.loginAs();
await loginPage.loginAs('myUser', 'myPassword');
```

`expectCompanyVisible(companyName = 'Bounty Plus Inc.')`

Checks that the company text is visible after login.

```js
await loginPage.expectCompanyVisible();
```

`setExactValue(locator, value)`

Clears and types a value carefully.

Usually used by `loginAs()`.

```js
await loginPage.setExactValue(loginPage.userId, 'playwrightAut');
```


Module navigation:

`tests/pages/base/moduleNavigation/`

Each target module has its own navigation page object with its own selectors and `open()` method.

Do not add module navigation to a shared menu page. Create or update the file for the specific module being opened.

```js
const { SalesOrderMenuPage } = require('../pages/base/moduleNavigation/SalesOrderMenuPage');
const salesOrderMenu = new SalesOrderMenuPage(page);
await salesOrderMenu.open();
```

Existing navigation files:

`SalesOrderMenuPage`

```js
const { SalesOrderMenuPage } = require('../pages/base/moduleNavigation/SalesOrderMenuPage');
const salesOrderMenu = new SalesOrderMenuPage(page);
await salesOrderMenu.open();
```

`DeliveryOrderMenuPage`

```js
const { DeliveryOrderMenuPage } = require('../pages/base/moduleNavigation/DeliveryOrderMenuPage');
const deliveryOrderMenu = new DeliveryOrderMenuPage(page);
await deliveryOrderMenu.open();
```

`CreditLimitCheckingMenuPage`

```js
const {
  CreditLimitCheckingMenuPage
} = require('../pages/base/moduleNavigation/CreditLimitCheckingMenuPage');
const creditLimitCheckingMenu = new CreditLimitCheckingMenuPage(page);
await creditLimitCheckingMenu.open();
```

`CreditLimitApprovalMenuPage`

```js
const {
  CreditLimitApprovalMenuPage
} = require('../pages/base/moduleNavigation/CreditLimitApprovalMenuPage');
const creditLimitApprovalMenu = new CreditLimitApprovalMenuPage(page);
await creditLimitApprovalMenu.open();
```

`TransactionApprovalMenuPage`

```js
const {
  TransactionApprovalMenuPage
} = require('../pages/base/moduleNavigation/TransactionApprovalMenuPage');
const transactionApprovalMenu = new TransactionApprovalMenuPage(page);
await transactionApprovalMenu.open();
```


Screenshots:

`tests/helpers/screenshots.js`

`takeStepScreenshot(page, testName, stepName)`

Waits briefly, then takes a full-page screenshot and saves it under:

```txt
test-results/screenshots/<testName>/<stepName>.png
```

Spaces become underscores.

```js
const { takeStepScreenshot } = require('../helpers/screenshots');

await takeStepScreenshot(page, 'sales return', '00_PAGE_OPENED');
```

Pass a popup page to document CFL or popup windows:

```js
await takeStepScreenshot(customerCFLPage, 'sales standard process', '02_BP_CFL_POPUP');
```


Run summaries:

`tests/helpers/runSummary.js`

`startRunSummary(testId, title)`

Starts a summary file for the test run.

Call this near the top of every spec.

```js
startRunSummary('sales-sales-return', 'Sales Return');
```

`recordModuleDocNo(moduleName, docNo, status, testId)`

Adds or updates one row in the result summary table.

Use it when a module opens, creates, copies, or approves a document.

```js
recordModuleDocNo('Sales Return', docNo, 'Saved as Draft', testId);
```

`finishRunSummary(status, testId)`

Finishes the test summary.

Call this before the test ends.

```js
finishRunSummary('success', testId);
finishRunSummary('not-open', testId);
```

`getModuleDocNo(moduleName, testId)`

Reads a document number from a previous summary.

Use this when one test depends on a document created by another test.

```js
const salesOrderDocNo = getModuleDocNo('Sales Order', 'sales-sales-order-transaction');
```


Document number reader:

`tests/helpers/docNoReader.js`

`readCurrentDocNo(pageOrPageObject, options = {})`

Reads the current document number from standard doc-no fields.

Accepts a Playwright `page`, a `BasePage`, or a page object.

```js
const { readCurrentDocNo } = require('../helpers/docNoReader');

const docNo = await readCurrentDocNo(page);
const docNo = await readCurrentDocNo(salesOrder);
```

`recordCurrentDocNo(moduleName, pageOrPageObject, status, testId, options = {})`

Reads the current document number and records it in the summary.

```js
const { recordCurrentDocNo } = require('../helpers/docNoReader');

const docNo = await recordCurrentDocNo('Delivery Order', page, 'Saved as Draft', testId);
```

`DEFAULT_DOCNO_SELECTORS`

Default selector list used by `readCurrentDocNo()`.

Use this only if you need to extend the selector list.

```js
const { DEFAULT_DOCNO_SELECTORS } = require('../helpers/docNoReader');
```


Environment loader:

`tests/helpers/env.js`

`loadEnv()`

Loads `.env` and `.env.local` into `process.env`.

This is automatically called when the helper is required.

```js
require('../helpers/env');
```


Legacy login helper:

`tests/helpers/login.js`

`login(page, userId, password)`

Compatibility helper for older tests.

Prefer `LoginPage.loginAs()` in new tests.

```js
const { login } = require('../helpers/login');

await login(page);
```


Business partner code helper:

`tests/helpers/bpCode.js`

`resolveBpCode(value, { envKey })`

Returns the passed value first, then the configured env value.

```js
const { resolveBpCode } = require('../helpers/bpCode');

const bpCode = resolveBpCode(customerCode, {
  envKey: 'BPI_SALES_BPCODE'
});
```

`getSalesBpCode(value)`

Returns a Sales BP code.

Order:

```txt
passed value
BPI_SALES_BPCODE
```

```js
const { getSalesBpCode } = require('../helpers/bpCode');

const bpCode = getSalesBpCode();
```

`getDeliveryBpCode(value)`

Returns a Delivery BP code.

Order:

```txt
passed value
BPI_DELIVERY_BPCODE
```

```js
const { getDeliveryBpCode } = require('../helpers/bpCode');

const bpCode = getDeliveryBpCode();
```

`fillBpCodeField(pageOrPageObject, value, options)`

Fills the reusable BP Code field.

Primary selector:

```txt
input#df_bpcode[name="df_bpcode"]
```

Order:

```txt
passed value
env value
```

```js
const { fillBpCodeField } = require('../helpers/bpCode');

await fillBpCodeField(page);
await fillBpCodeField(deliveryOrder, null, { envKey: 'BPI_DELIVERY_BPCODE' });
```

It throws an error if the BP Code field is not found.

Item code helper:

`tests/helpers/itemCode.js`

`getSalesItemCode(value)`

Returns a Sales item code.

Order:

```txt
passed value
BPI_SALES_ITEMCODE
```

```js
const { getSalesItemCode } = require('../helpers/itemCode');

const itemCode = getSalesItemCode();
const itemCode = getSalesItemCode(process.env.BPI_SALES_ITEMCODE);
```

It throws an error if no value is passed and `BPI_SALES_ITEMCODE` is empty.


Sales Order page:

`tests/pages/transactions/SalesOrderPage.js`

`new SalesOrderPage(page)`

Creates the Sales Order page object.

```js
const { SalesOrderPage } = require('../pages/transactions/SalesOrderPage');
const salesOrder = new SalesOrderPage(page);
```

`expectCustomerLabelVisible()`

Checks that the Sales Order customer area loaded.

```js
await salesOrder.expectCustomerLabelVisible();
```

`selectInitialCustomerFromLookup(preferredCode)`

Opens the customer lookup, selects the preferred customer, and verifies the BP code.

```js
const bpCode = await salesOrder.selectInitialCustomerFromLookup(process.env.BPI_SALES_BPCODE);
```

`selectDocSeries(value)`

Selects the document series by value.

```js
await salesOrder.selectDocSeries('359');
```

`selectBusinessPartner(preferredCode)`

Selects a business partner from the lookup after the page is already open.

```js
await salesOrder.selectBusinessPartner(process.env.BPI_SALES_BPCODE);
```

`addItems({ itemCode, unitPrice, businessCenter, count })`

Adds the same item multiple times.

```js
await salesOrder.addItems({
  itemCode: process.env.BPI_SALES_ITEMCODE,
  unitPrice: '100',
  businessCenter: 'NCRCL',
  count: 3
});
```

`addItem({ itemCode, unitPrice, businessCenter })`

Adds one item line.

```js
await salesOrder.addItem({
  itemCode: process.env.BPI_SALES_ITEMCODE,
  unitPrice: '100',
  businessCenter: 'NCRCL'
});
```

`fillHeaderDetails({ distributionChannel, divisionIndex })`

Fills Sales Order header UDF details.

```js
await salesOrder.fillHeaderDetails({
  distributionChannel: 'OUTRIGHT',
  divisionIndex: 1
});
```

`saveAsDraft()`

Saves the Sales Order as draft and waits for draft status.

```js
await salesOrder.saveAsDraft();
```

`addOrUpdateUntilOpen()`

Clicks Add or Update and checks if the document becomes Open.

Returns:

```txt
isOpen
statusMsg
isCreditLimitBlocked
```

```js
const outcome = await salesOrder.addOrUpdateUntilOpen();
```

`readStatus()`

Reads the status select as `value|label`.

```js
const status = await salesOrder.readStatus();
```

`readSubmitMessage(extraMessages = [])`

Reads submit/status/error messages after add or update.

```js
const message = await salesOrder.readSubmitMessage();
```

`readDocumentMemory()`

Returns the current BP code and document number.

```js
const memory = await salesOrder.readDocumentMemory();
```

`isCreditLimitBlocked(statusMsg)`

Checks if a status message means credit-limit blocking.

```js
if (salesOrder.isCreditLimitBlocked(message)) {
  // run credit limit flow
}
```


Delivery Order page:

`tests/pages/transactions/DeliveryOrderPage.js`

`new DeliveryOrderPage(page)`

Creates the Delivery Order page object.

```js
const { DeliveryOrderPage } = require('../pages/transactions/DeliveryOrderPage');
const deliveryOrder = new DeliveryOrderPage(page);
```

`expectLoaded()`

Checks that the Delivery Order page loaded.

```js
await deliveryOrder.expectLoaded();
```

`fillBusinessPartner(bpCode)`

Fills the BP Code field.

```js
await deliveryOrder.fillBusinessPartner();
```

`openCopyFromSalesOrdersPopup(bpCode, beforeOpen)`

Fills BP Code, opens Copy From > Sales Orders, and returns the popup page.

```js
const popup = await deliveryOrder.openCopyFromSalesOrdersPopup(process.env.BPI_DELIVERY_BPCODE);
```

`copySalesOrderFromPopup(salesOrdersPopup, salesOrderDocNo, hooks = {})`

Selects a Sales Order header and item from the popup, then copies it into Delivery Order.

Hooks are optional screenshot checkpoints.

```js
const selectedHeader = await deliveryOrder.copySalesOrderFromPopup(popup, salesOrderDocNo, {
  afterHeaderSelected: async () => {},
  afterItemsLoaded: async () => {},
  beforeFinish: async () => {}
});
```

`selectDocumentSeries(seriesLabel = 'Primary')`

Selects Delivery Order document series by label.

```js
await deliveryOrder.selectDocumentSeries('Primary');
```

`selectInvoiceDeliveryDateToday()`

Opens General UDF and selects today's invoice delivery date.

```js
await deliveryOrder.selectInvoiceDeliveryDateToday();
```

`selectShipToCode(shipToCode = 'SHIP TO')`

Opens Logistics and selects Ship To Code.

```js
await deliveryOrder.selectShipToCode('SHIP TO');
```

`selectShipType(shipType = 'DELIVERY')`

Selects ship type.

```js
await deliveryOrder.selectShipType('DELIVERY');
```

`selectTruckerCode(truckerCode = '000')`

Uses lookup to select trucker code.

```js
await deliveryOrder.selectTruckerCode('000');
```

`selectPlateNumber()`

Uses lookup to select the first available plate number.

```js
await deliveryOrder.selectPlateNumber();
```

`saveAsDraft()`

Saves Delivery Order as draft and returns the document number.

```js
const docNo = await deliveryOrder.saveAsDraft();
```

`readStatus()`

Reads the status select as `value|label`.

```js
const status = await deliveryOrder.readStatus();
```

`readDocumentNo()`

Reads the current document number.

```js
const docNo = await deliveryOrder.readDocumentNo();
```

Lower-level Delivery Order helpers:

Use these when building or debugging copy-from or lookup flows.

```txt
expectCopyFromVisible()
expectChooseVisible(popup)
selectSalesOrderHeader(popup, salesOrderDocNo)
findSalesOrderHeaderRow(popupPage, salesOrderDocNo)
expectCopiedItemsVisible(popup, salesOrderDocNo)
selectCopiedItems(popup)
expectFirstLineItemCodeFilled()
openGeneralUdfTab()
openLogisticsTab()
selectLookupFirstRow({ triggerSelector, outputSelector, expectedValue })
doubleClickFirstLookupRow(lookupPage)
expectShipToAddressFilled()
```


Credit Limit page:

`tests/pages/approvals/CreditLimitPage.js`

`new CreditLimitPage(page)`

Creates the Credit Limit page object.

```js
const { CreditLimitPage } = require('../pages/approvals/CreditLimitPage');
const creditLimit = new CreditLimitPage(page);
```

`createCheck({ customerNo, approverUserId, docNo, beforeAdd })`

Creates Credit Limit Checking approval for a Sales Order.

```js
await creditLimit.createCheck({
  customerNo: memory.bpCode,
  approverUserId,
  docNo: memory.docNo
});
```

`createApproval({ customerNo, docNo, remarksUserId, beforeAdd })`

Creates Credit Limit Approval for a Sales Order.

```js
await creditLimit.createApproval({
  customerNo: memory.bpCode,
  docNo: memory.docNo,
  remarksUserId: approverUserId
});
```

`completeApprovalFlow(options)`

Shared internal flow used by `createCheck()` and `createApproval()`.

Use directly only when building a similar approval screen.

`expectResultsTableVisible()`

Checks that the results table is visible.

```js
await creditLimit.expectResultsTableVisible();
```

`selectSalesOrderInResults(docNo)`

Selects the matching Sales Order row in credit-limit results.

```js
await creditLimit.selectSalesOrderInResults(docNo);
```

`selectApprovedDecision()`

Selects approved decision for Credit Limit Checking.

```js
await creditLimit.selectApprovedDecision();
```

`selectApprovedStatus()`

Selects approved status for Credit Limit Approval.

```js
await creditLimit.selectApprovedStatus();
```

`fillRemarks(remarks)`

Fills the remarks field.

```js
await creditLimit.fillRemarks('Approved by automation');
```

`buildApprovalRemarks(userId, docNo)`

Builds a standard approval remarks string.

```js
const remarks = creditLimit.buildApprovalRemarks(userId, docNo);
```

`clickAdd()`

Clicks Add on the approval screen.

```js
await creditLimit.clickAdd();
```

`expectApprovalSucceeded()`

Checks the success message and Open status.

```js
await creditLimit.expectApprovalSucceeded();
```

`findSalesOrderResultRow(docNo)`

Finds the Sales Order row metadata in credit-limit results.

```js
const row = await creditLimit.findSalesOrderResultRow(docNo);
```


Transaction Approval page:

`tests/pages/approvals/TransactionApprovalPage.js`

`new TransactionApprovalPage(page)`

Creates the Transaction Approval page object.

```js
const { TransactionApprovalPage } = require('../pages/approvals/TransactionApprovalPage');
const approval = new TransactionApprovalPage(page);
```

`expectLoaded()`

Checks that Transaction Approval loaded.

```js
await approval.expectLoaded();
```

`approveDocument(beforeAdd)`

Runs the approval flow:

```txt
filter
select approved
select all
add
expect open and uneditable
```

```js
await approval.approveDocument();
```

`clickFilter()`

Clicks the filter button.

```js
await approval.clickFilter();
```

`expectResultsTableVisible()`

Checks the result table.

```js
await approval.expectResultsTableVisible();
```

`selectApprovedDecision()`

Selects the Approved decision.

```js
await approval.selectApprovedDecision();
```

`selectAllDocuments()`

Checks the select-all checkbox.

```js
await approval.selectAllDocuments();
```

`clickAdd()`

Clicks Add.

```js
await approval.clickAdd();
```

`expectOpenAndUneditable()`

Checks that document status is Open and disabled.

```js
await approval.expectOpenAndUneditable();
```


CFL lookup page objects:

`tests/pages/popups/BusinessPartnerCFL.js`

`expectLookupReady()`

Checks that the business partner lookup loaded.

```js
await businessPartnerCFL.expectLookupReady();
```

`selectDisplayedCustomer(rowSelector = '#dd_custnoT1r2')`

Selects the displayed customer row and returns its code.

```js
const bpCode = await businessPartnerCFL.selectDisplayedCustomer();
```

`selectCustomerCode(preferredCode)`

Selects a specific customer code.

```js
const bpCode = await businessPartnerCFL.selectCustomerCode(process.env.BPI_SALES_BPCODE);
```

`tests/pages/popups/ItemCFL.js`

`selectItemByLabel(itemCode)`

Selects an item by visible label and clicks OK.

```js
await itemCFL.selectItemByLabel(process.env.BPI_SALES_ITEMCODE);
```


Dashboard config helpers:

`config/dashboard/testCatalog.js`

`getTestCatalog()`

Scans `tests/<module>/*.spec.js` and returns dashboard modules and tests.

Used by `/api/test-catalog`.

```js
const { modules, tests } = getTestCatalog();
```

`config/dashboard/testModules.js`

`testModules`

Controls dashboard module label, icon, and order.

```js
export const testModules = {
  sales: {
    label: 'Sales',
    icon: 'sales',
    order: 10
  }
};
```

`config/dashboard/testResults.js`

`testResults`

Controls result title, screenshot folder, and screenshot descriptions.

Add one entry per test result ID.

Test IDs are generated from the spec path.

```txt
tests/sales/sales-order-transaction.spec.js -> sales-sales-order-transaction
tests/sales/delivery-order.spec.js -> sales-delivery-order
tests/admin/approval.spec.js -> admin-approval
```
