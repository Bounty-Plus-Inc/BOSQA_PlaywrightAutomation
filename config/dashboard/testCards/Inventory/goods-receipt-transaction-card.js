export const goodsReceiptTransactionCards = [
  {
    id: 'transaction',
    title: 'Transaction',
    subtitle: '',
    testScript: 'tests/inventory/goods-receipt.spec.js',
    fields: [
      {
        id: 'itemCode',
        type: 'text',
        label: 'Item Code',
        envKey: 'BPI_ITEMCODE',
       
      }
    ],
    buttons: [
      {
        id: 'run-transaction',
        label: 'Automate Transaction',
        action: 'runTest',
        icon: 'play',
        runs: 'tests/inventory/goods-receipt.spec.js'
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
