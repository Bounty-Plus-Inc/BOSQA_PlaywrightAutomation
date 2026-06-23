const findDocumentActions = [
  // Add a new test-case-level Find Document action by adding another object here.
  // Create the matching module navigation file first, then point navigationModulePath/exportName to it.
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
  },
    {
    id: 'Delivery-order',
    label: 'Delivery Order',
    testTitle: 'Delivery Order Document',
    moduleId: 'sales',
    testResultId: 'sales-delivery-order',
    moduleName: 'Delivery Order',
    navigationModulePath: '../pages/base/moduleNavigation/DeliveryOrderMenuPage',
    navigationExportName: 'DeliveryOrderMenuPage',
    openedScreenshot: '00_FIND_DOCUMENT_DELIVERY_ORDER_OPENED',
    loadedScreenshot: '01_FIND_DOCUMENT_DELIVERY_ORDER_LOADED'
  }
  
];

module.exports = { findDocumentActions };
