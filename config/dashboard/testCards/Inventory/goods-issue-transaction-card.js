export const goodsIssueTransactionCards = [
  {
    id: 'transaction',
    title: 'Transaction',
    subtitle: '',
    testScript: 'tests/inventory/goods-issue.spec.js',

    fields: [
      {
        id: 'itemCode',
        type: 'text',
        label: 'Item Code',
        envKey: 'BPI_ITEMCODE'
      },
      {
        id: 'whsCode',
        type: 'text',
        label: 'Warehouse Code',
        envKey: 'BPI_WHSCODE'
        
      },
      {
        id: 'profitCenter',
        type: 'text',
        label: 'Profit Center',
        envKey: 'BPI_PROFIT_CENTER'
      },
      {
        id: 'quantity',
        type: 'number',
        label: 'Quantity',
        envKey: 'BPI_QUANTITY',
       
      },
    //   {
    //     id: 'secondaryQuantity',
    //     type: 'number',
    //     label: 'Secondary Quantity',
    //     envKey: 'BPI_SECONDARY_QUANTITY',
    //   },
    //   {
    //     id: 'unitPrice',
    //     type: 'number',
    //     label: 'Unit Price',
    //     envKey: 'BPI_UNIT_PRICE',
    //   }
    ],

    buttons: [
      {
        id: 'run-transaction',
        label: 'Automate Transaction',
        action: 'runTest',
        icon: 'play',
        runs: 'tests/inventory/goods-issue.spec.js'
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