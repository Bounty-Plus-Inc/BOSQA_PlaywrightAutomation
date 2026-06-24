export const deliveryOrderCards = [
  {
    id: 'transaction',
    title: 'Transaction',
    subtitle: 'Delivery Order',
    testScript: 'tests/sales/delivery-order.spec.js',
    fields: [
      {
        id: 'customerCode',
        type: 'text',
        label: 'Customer Code',
        envKey: 'BPI_DELIVERY_BPCODE',
        required: true
      }
    ],
    buttons: [
      {
        id: 'run-transaction',
        label: 'Automate Transaction',
        action: 'runTest',
        icon: 'play',
        runs: 'tests/sales/delivery-order.spec.js'
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
