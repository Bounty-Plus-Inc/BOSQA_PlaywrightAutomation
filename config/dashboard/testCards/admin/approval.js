export const approvalCards = [
  {
    id: 'approval',
    title: 'Approval',
    subtitle: 'Transaction Approval',
    testScript: 'tests/admin/approval.spec.js',
    fields: [],
    buttons: [
      {
        id: 'run-approval',
        label: 'Run Approval',
        action: 'runTest',
        icon: 'play',
        runs: 'tests/admin/approval.spec.js'
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
