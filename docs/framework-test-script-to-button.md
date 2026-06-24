# Framework: Test Script To Button

## Quick Flow

```text
Create test script
Create card file
Register card
Add fields
Read fields in test script
Click button
```

## 1. Create Test Script

In the dashboard:

```text
Framework -> Scaffold Generator
```

Example input:

```text
Module name: Testing Module
Test case name: Testing Script
```

Expected files:

```text
tests/testing-module/testing-script.spec.js
tests/pages/base/moduleNavigation/TestingModuleMenuPage.js
tests/pages/transactions/TestingScriptPage.js
```

Test case ID:

```text
testing-module-testing-script
```

Format:

```text
module-name-test-case-name
```

## 2. Create Card File

Create:

```text
config/dashboard/testCards/testing-module/testing-script.js
```

Example:

```js
export const testingScriptCards = [
  {
    id: 'transaction',
    title: 'Transaction',
    subtitle: 'Testing Script',
    testScript: 'tests/testing-module/testing-script.spec.js',
    fields: [
      {
        id: 'customerCode',
        type: 'text',
        label: 'Customer Code',
        envKey: 'BPI_TEST_CUSTOMER_CODE',
        required: true
      },
      {
        id: 'itemCode',
        type: 'text',
        label: 'Item Code',
        envKey: 'BPI_TEST_ITEM_CODE',
        required: true
      }
    ],
    buttons: [
      {
        id: 'run-transaction',
        label: 'Automate Transaction',
        action: 'runTest',
        icon: 'play',
        runs: 'tests/testing-module/testing-script.spec.js'
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

## 3. Register Card

Open:

```text
config/dashboard/testCards/index.js
```

Add import:

```js
import { testingScriptCards } from './testing-module/testing-script.js';
```

Add mapping inside `testCards`:

```js
'testing-module-testing-script': testingScriptCards
```

Example:

```js
export const testCards = {
  'admin-approval': approvalCards,
  'sales-delivery-order': deliveryOrderCards,
  'sales-sales-order-transaction': salesOrderTransactionCards,
  'testing-module-testing-script': testingScriptCards
};
```

## 4. Use Fields In Test Script

Open:

```text
tests/testing-module/testing-script.spec.js
```

Read card fields:

```js
const customerCode = process.env.BPI_TEST_CUSTOMER_CODE || '';
const itemCode = process.env.BPI_TEST_ITEM_CODE || '';
```

Use them:

```js
await page.locator('#df_bpcode').fill(customerCode);
await page.locator('#df_itemcodeT1').fill(itemCode);
```

## 5. Button Rules

Run test button:

```js
action: 'runTest'
```

The file it runs:

```js
runs: 'tests/testing-module/testing-script.spec.js'
```

View result button:

```js
action: 'viewResults'
```

## 6. Field Types

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

Read dropdown value:

```js
const mode = process.env.BPI_TEST_MODE || '';
```

## 7. Important Rule

```text
Card file controls the UI.
Test script controls the automation.
envKey connects them.
```
