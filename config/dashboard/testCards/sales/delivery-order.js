export const deliveryOrderCards = [
  {
    id: 'transaction',
    title: 'Transaction',
    subtitle: 'Delivery Order',
    testScript: 'tests/sales/delivery-order.spec.js',
    fields: [],
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
