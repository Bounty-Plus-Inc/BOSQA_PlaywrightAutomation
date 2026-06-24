const SalesOrderDocumentData = {
  headers: [
    {
      key: 'bpCode',
      selectors: [
        'input#df_bpcode[name="df_bpcode"]',
        'input#df_bpcode',
        'input[name="df_bpcode"]',
        '#df_bpcode'
      ]
    },
    {
      key: 'bpRefNo',
      selectors: [
        'input#df_bprefno[name="df_bprefno"]',
        'input#df_bprefno',
        'input[name="df_bprefno"]',
        '#df_bprefno'
      ]
    },
    {
      key: 'shipToCode',
      selectors: [
        'select#df_shiptocode[name="df_shiptocode"]',
        'input#df_shiptocode[name="df_shiptocode"]',
        '#df_shiptocode'
      ]
    },
    {
      key: 'shipToAddress',
      selectors: [
        'textarea#df_shiptoaddress[name="df_shiptoaddress"]',
        'input#df_shiptoaddress[name="df_shiptoaddress"]',
        '#df_shiptoaddress'
      ]
    },
    {
      key: 'shipType',
      selectors: [
        'select#df_shiptype[name="df_shiptype"]',
        'input#df_shiptype[name="df_shiptype"]',
        '#df_shiptype'
      ]
    },
    {
      key: 'salesOrg',
      selectors: [
        'select#df_u_sales_org[name="df_u_sales_org"]',
        'input#df_u_sales_org[name="df_u_sales_org"]',
        '#df_u_sales_org'
      ]
    },
    {
      key: 'distributionChannel',
      selectors: [
        'select#df_u_distribution_channel[name="df_u_distribution_channel"]',
        'input#df_u_distribution_channel[name="df_u_distribution_channel"]',
        '#df_u_distribution_channel'
      ]
    },
    {
      key: 'division',
      selectors: [
        'select#df_u_division[name="df_u_division"]',
        'input#df_u_division[name="df_u_division"]',
        '#df_u_division'
      ]
    },
    {
      key: 'businessCenter',
      selectors: [
        'select#df_u_business_center[name="df_u_business_center"]',
        'input#df_u_business_center[name="df_u_business_center"]',
        '#df_u_business_center'
      ]
    }
  ],
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
      vatcode: 'vatCode',
      linetotal: 'lineTotal',
      whscode: 'warehouseCode',
      uBusinessCenter: 'businessCenter',
      openquantity: 'openQuantity',
      discperc: 'discountPercent',
      discamount: 'discountAmount',
      rowstat: 'rowStatus',
      keys: 'keys'
    }
  }
};

module.exports = {
  SalesOrderDocumentData
};
