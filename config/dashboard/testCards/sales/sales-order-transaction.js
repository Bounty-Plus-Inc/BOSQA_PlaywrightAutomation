export const salesOrderTransactionCards = [
  {
    id: 'transaction',
    title: 'Transaction',
    subtitle: 'Sales Order',
    testScript: 'tests/sales/sales-order-transaction.spec.js',
    fields: [
      {
        id: 'customerCode',
        type: 'text',
        label: 'Customer Code',
        envKey: 'BPI_SALES_BPCODE',
        required: true
      },
      {
        id: 'itemCode',
        type: 'text',
        label: 'Item Code',
        envKey: 'BPI_SALES_ITEMCODE',
        required: true
      }
    ],
    buttons: [
      {
        id: 'run-transaction',
        label: 'Automate Transaction',
        action: 'runTest',
        icon: 'play',
        runs: 'tests/sales/sales-order-transaction.spec.js'
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
