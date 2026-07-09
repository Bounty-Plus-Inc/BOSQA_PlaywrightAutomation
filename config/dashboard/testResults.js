import { createRequire } from 'module';

// This is for enabling CommonJS require inside this ES module.
const require = createRequire(import.meta.url);
// This is for listing Find Document dropdown options.
const { findDocumentActions } = require('../../tests/utilities/findDocumentActions.js');

function getFindDocumentSteps() {
  const baseSteps = Object.fromEntries(
    findDocumentActions.flatMap((action) => [
      [
        `${action.openedScreenshot}.png`,
        {
          title: `${action.label} module opened`,
          description:
            `The selected ${action.label} document search flow opened the module before using the document number.`
        }
      ],
      [
        `${action.loadedScreenshot}.png`,
        {
          title: `${action.label} document loaded`,
          description:
            'The Find popup filtered by document number, confirmed the matching row, and loaded the document details.'
        }
      ]
    ])
  );

  return {
    ...baseSteps,
    '06_RECREATE_STATUS_DRAFT.png': {
      title: 'Recreated Sales Order saved as draft',
      description:
        'The captured Sales Order data was entered into a new Sales Order and saved as draft.'
    },
    '07_RECREATE_STATUS_OPEN_AFTER_ADD.png': {
      title: 'Recreated Sales Order opened',
      description: 'The recreated Sales Order was submitted and reached Open status.'
    },
    '08_RECREATE_TRANSACTION_APPROVAL_OPENED.png': {
      title: 'Transaction Approval opened',
      description:
        'The recreated Sales Order required Transaction Approval and the approval module opened.'
    },
    '09_RECREATE_TRANSACTION_APPROVAL_SELECTED.png': {
      title: 'Transaction Approval selected',
      description:
        'The matching recreated Sales Order transaction was selected and approved.'
    },
    '10_RECREATE_TRANSACTION_APPROVAL_DONE.png': {
      title: 'Transaction Approval completed',
      description: 'Transaction Approval was saved successfully for the recreated Sales Order.'
    },
    '08_RECREATE_CREDIT_LIMIT_STANDARD.png': {
      title: 'Credit Limit Checking selected',
      description:
        'The recreated Sales Order required credit limit checking and the matching row was selected.'
    },
    '09_RECREATE_CREDIT_LIMIT_APPROVED.png': {
      title: 'Credit Limit Checking approved',
      description: 'Credit Limit Checking was approved for the recreated Sales Order.'
    },
    '10_RECREATE_CREDIT_LIMIT_APPROVAL.png': {
      title: 'Credit Limit Approval selected',
      description:
        'The recreated Sales Order was opened in Credit Limit Approval and prepared for approval.'
    },
    '11_RECREATE_CREDIT_LIMIT_APPROVAL_DONE.png': {
      title: 'Credit Limit Approval completed',
      description: 'Credit Limit Approval was saved successfully for the recreated Sales Order.'
    },
    '12_RECREATE_DELIVERY_ORDER_OPENED.png': {
      title: 'Delivery Order opened',
      description:
        'After approval, the Delivery Order module opened for Copy From processing.'
    },
    '13_RECREATE_DELIVERY_BP_CFL_POPUP.png': {
      title: 'Delivery BP Code lookup opened',
      description:
        'The Delivery Order Business Partner CFL opened before selecting the Sales Order customer.'
    },
    '14_RECREATE_DELIVERY_BP_SELECTED.png': {
      title: 'Delivery BP Code selected',
      description:
        'The Sales Order customer was selected and returned to the Delivery Order BP Code field.'
    },
    '15_RECREATE_DELIVERY_COPY_FROM_POPUP.png': {
      title: 'Copy From Sales Order opened',
      description:
        'The Delivery Order Copy From popup opened for selecting the approved Sales Order.'
    },
    '16_RECREATE_DELIVERY_SOURCE_SELECTED.png': {
      title: 'Copy From source selected',
      description:
        'The recreated Sales Order document number was selected in the Copy From popup.'
    },
    '17_RECREATE_DELIVERY_ITEMS_LOADED.png': {
      title: 'Copy From line items loaded',
      description:
        'The source Sales Order line items loaded after choosing the document header.'
    },
    '18_RECREATE_DELIVERY_ITEMS_SELECTED.png': {
      title: 'Copy From line items selected',
      description: 'The available Sales Order line item was selected for copying.'
    },
    '19_RECREATE_DELIVERY_ITEMS_COPIED.png': {
      title: 'Sales Order copied to Delivery',
      description:
        'The selected Sales Order items were copied back into the Delivery Order form.'
    },
    'ZZ_RECREATE_CREDIT_LIMIT_BLOCKING_MESSAGE.png': {
      title: 'Credit limit blocking message captured',
      description:
        'The recreated Sales Order could not open yet because it required credit limit processing.'
    },
    'ZZ_RECREATE_STATUS_NOT_OPEN_LATEST.png': {
      title: 'Recreated Sales Order did not open',
      description: 'The latest recreated Sales Order status was captured because it did not open.'
    }
  };
}

export const testResults = {
  'sales-sales-order-transaction': {
    title: 'Sales Order',
    screenshotsDir: 'test-results/screenshots/sales_order_transaction',
    itemCountEnvKey: 'BPI_SALES_ITEM_COUNT',
    dataInputs: [
      {
        id: 'customerCode',
        label: 'Customer Code',
        envKey: 'BPI_SALES_BPCODE',
        required: true
      },
      {
        id: 'itemCode',
        label: 'Item Code',
        envKey: 'BPI_SALES_ITEMCODE',
        required: true
      }
    ],
    steps: {
      '00_SalesOrder_Page_Opened.png': {
        title: 'Sales Order Module Opened',
        description: 'The test reached the sales order page and the form was ready to use.'
      },
      '01_Customer_Label_Visible.png': {
        title: 'Customer field confirmed',
        description: 'The customer area appeared, confirming the page loaded correctly.'
      },
      '02_BP_CFL_POPUP.png': {
        title: 'Customer CFL opened',
        description:
          'The Business Partner CFL popup opened and showed the customer list before selection.'
      },
      '02_BP_Code_Returned.png': {
        title: 'Customer selected',
        description: 'A customer was chosen from the lookup and returned to the order form.'
      },
      '03_DocSeries_Selected.png': {
        title: 'Document series selected',
        description: 'The order was assigned to the expected document series.'
      },
      '01_BP_Selected.png': {
        title: 'Business partner updated',
        description: 'The business partner selection was completed successfully.'
      },
      '04_ITEM_CFL_POPUP.png': {
        title: 'Item CFL opened',
        description: 'The Item CFL popup opened and showed the item list before selection.'
      },
      '04_Item_Updated.png': {
        title: 'Item added to the order',
        description: 'The item, price, and business center were entered and updated.'
      },
      '05_Header_Details_Filled.png': {
        title: 'Header details completed',
        description: 'Required order header details were filled in.'
      },
      '06_Status_Draft.png': {
        title: 'Order saved as draft',
        description: 'The order was saved and confirmed in draft status.'
      },
      '07_Status_Open_After_Add.png': {
        title: 'Order opened',
        description: 'The order was submitted and moved to open status.'
      },
      '08_TRANSACTION_APPROVAL_OPENED.png': {
        title: 'Transaction Approval opened',
        description:
          'The Sales Order process ended successfully and the Transaction Approval module opened.'
      },
      '09_TRANSACTION_APPROVAL_SELECTED.png': {
        title: 'Transaction Approval selected',
        description:
          'The approval list was filtered, Approved was selected, and the available transaction rows were checked.'
      },
      '10_TRANSACTION_APPROVAL_DONE.png': {
        title: 'Transaction Approval completed',
        description:
          'The Transaction Approval add/save completed and the approval document reached Open status.'
      },
      'ZZ_Credit_Limit_Blocking_Message.png': {
        title: 'Credit limit review needed',
        description: 'The order could not open yet because it requires credit limit checking.'
      },
      'ZZ_Status_Not_Open_Latest.png': {
        title: 'Order did not open',
        description: 'The latest status was captured because the order did not move to open status.'
      },
      '08_CREDIT_LIMIT_STANDARD.png': {
        title: 'Credit limit row selected',
        description:
          'The matching Sales Order was visible in the result table, selected, and marked Approved.'
      },
      '09_CREDIT_LIMIT_APPROVED.png': {
        title: 'Credit limit approved',
        description:
          'The matching Sales Order was found, selected, approved, added successfully, and confirmed as Open.'
      },
      '10_CREDIT_LIMIT_APPROVAL.png': {
        title: 'Credit limit approval row selected',
        description:
          'The approval page was filtered by customer, then the matching Sales Order was selected.'
      },
      '11_CREDIT_LIMIT_APPROVAL_DONE.png': {
        title: 'Credit limit approval completed',
        description:
          'The matching Sales Order was approved from Credit Limit Approval and saved successfully.'
      },
      '12_DELIVERY_ORDER_OPENED.png': {
        title: 'Delivery Order opened',
        description:
          'After approval, the Delivery Order module opened for Copy From processing.'
      },
      '13_DELIVERY_BP_CFL_POPUP.png': {
        title: 'Delivery BP Code lookup opened',
        description:
          'The Delivery Order Business Partner CFL opened before selecting the Sales Order customer.'
      },
      '14_DELIVERY_BP_SELECTED.png': {
        title: 'Delivery BP Code selected',
        description:
          'The Sales Order customer was selected and returned to the Delivery Order BP Code field.'
      },
      '15_DELIVERY_COPY_FROM_POPUP.png': {
        title: 'Copy From Sales Order opened',
        description:
          'The Delivery Order Copy From popup opened for selecting the approved Sales Order.'
      },
      '16_DELIVERY_SOURCE_SELECTED.png': {
        title: 'Copy From source selected',
        description:
          'The created Sales Order document number was selected in the Copy From popup.'
      },
      '17_DELIVERY_ITEMS_LOADED.png': {
        title: 'Copy From line items loaded',
        description:
          'The source Sales Order line items loaded after choosing the document header.'
      },
      '18_DELIVERY_ITEMS_SELECTED.png': {
        title: 'Copy From line items selected',
        description: 'The available Sales Order line item was selected for copying.'
      },
      '19_DELIVERY_ITEMS_COPIED.png': {
        title: 'Sales Order copied to Delivery',
        description:
          'The selected Sales Order items were copied back into the Delivery Order form.'
      }

    }
  },
  'sales-delivery-order': {
    title: 'Delivery Order',
    screenshotsDir: 'test-results/screenshots/delivery_order',
    dataInputs: [],
    steps: {
      '00_DELIVERY_ORDER_OPENED.png': {
        title: 'Delivery order screen opened',
        description: 'The Delivery Order standard transaction module opened successfully.'
      },
      '01_DELIVERY_BP_CFL_POPUP.png': {
        title: 'Business Partner CFL opened',
        description: 'The Delivery Order BP Code lookup opened before selecting the customer.'
      },
      '02_DELIVERY_BP_SELECTED.png': {
        title: 'Business partner selected',
        description: 'The previous Sales Order BP Code was selected and returned to the Delivery Order form.'
      },
      '03_DELIVERY_COPY_FROM_POPUP.png': {
        title: 'Copy From popup opened',
        description: 'The Copy From menu opened the source document popup successfully.'
      }
    }
  },
  'admin-approval': {
    title: 'Approval',
    screenshotsDir: 'test-results/screenshots/approval',
    steps: {
      '00_APPROVAL_PAGE_OPENED.png': {
        title: 'Transaction Approval opened',
        description:
          'The Admin tab was opened, Approval was hovered, and Transaction Approval loaded successfully.'
      },
      '01_APPROVAL_ROW_SELECTED.png': {
        title: 'Approval rows selected',
        description:
          'The Transaction Approval list was filtered, Approved was selected, and the table select-all checkbox was checked.'
      },
      '02_APPROVAL_SUCCESS_OPEN.png': {
        title: 'Success for Approval Stage',
        description:
          'The transaction was added successfully and the document status is Open and uneditable.'
      }
    }
  },
  'test-2-test-3': {
    title: 'Test_3',
    screenshotsDir: 'test-results/screenshots/test-2_test-3',
    steps: {
      '00_TEST_2_TEST_3_OPENED.png': {
        title: 'Test_3 opened',
        description: 'The Test_2 Test_3 screen opened successfully.'
      }
    }
  },
  'testing-module-testing-script': {
    title: 'Testing Script',
    screenshotsDir: 'test-results/screenshots/testing-module_testing-script',
    steps: {
      '00_TESTING_MODULE_TESTING_SCRIPT_OPENED.png': {
        title: 'Testing Script opened',
        description: 'The Testing Module Testing Script screen opened successfully.'
      }
    }
  },
  'inventory-goods-receipt': {
    title: 'Goods Receipt',
    screenshotsDir: 'test-results/screenshots/inventory_goods-receipt',
    steps: {
      '00_INVENTORY_GOODS_RECEIPT_OPENED.png': {
        title: 'Goods Receipt opened',
        description: 'The Goods Receipt transaction screen opened successfully.'
      },
       '01_INVENTORY_GOODS_RECEIPT_ITEM_ADDED.png': {
        title: 'Goods Receipt Item Added',
        description:
      'The item was selected from the CFL and loaded into the Goods Receipt document.'
      },
       '05_INVENTORY_GOODS_RECEIPT_ITEM_UPDATED.png': {
        title: 'Goods Receipt Item Updated',
        description: 'The warehouse, quantities, profit center and unit price were updated successfully.'
      },
       '06_INVENTORY_GOODS_RECEIPT_DOCUMENT_ADDED.png': {
        title: 'Goods Receipt Document Added',
        description:   'The Goods Receipt document was successfully added.'
      },
       '07_INVENTORY_GOODS_RECEIPT_JOURNAL_ENTRY.png': {
        title: 'Goods Receipt Document Added',
        description: 'The generated Journal Entry was opened and its document number, debit, credit and total amount were verified.'
      },
       '08_INVENTORY_BATCH_POPUP_COMPLETED.png': {
        title: 'Goods Receipt Batch Popup Completed',
         description: 'The batch popup was opened and the batch number was selected successfully.'
      }
       
    }
  },
  'inventory-goods-issue': {
    title: 'Goods Issue',
    screenshotsDir: 'test-results/screenshots/inventory_goods-issue',
    steps: {
      '00_INVENTORY_GOODS_ISSUE_OPENED.png': {
        title: 'Goods Issue opened',
        description: 'The Inventory Goods Issue screen opened successfully.'
      },
      '01_INVENTORY_GOODS_ISSUE_ITEM_ADDED.png': {
        title: 'Goods Issue Item Added',
        description:
      'The item was selected from the CFL and loaded into the Goods Issue document.'
      },
      '07_INVENTORY_GOODS_ISSUE_JOURNAL_ENTRY.png': {
        title: 'Goods Issue Document Added',
        description: 'The generated Journal Entry was opened and its document number, debit, credit and total amount were verified.'
      },
      '08_INVENTORY_BATCH_POPUP_COMPLETED.png': {
        title: 'Goods Issue Batch Popup Completed',
         description: 'The batch popup was opened and the batch number was selected successfully.'
      },
      '02_WAREHOUSE_NOT_FOUND.png': {
        title: 'Warehouse not found',
        description: 'The selected warehouse was not found in the Item Availability list.'
      },
      '03_WAREHOUSE_INSUFFICIENT_STOCK.png': {
        title: 'Warehouse Insufficient Stock',
         description: 'The selected warehouse has insufficient stock for the requested quantity.'
      },
      '06_INVENTORY_GOODS_ISSUE_DOCUMENT_ADDED.png': {
        title: 'Goods Issue Document Added',
        description:   'The Goods Issue document was successfully added.'
      },
      
    }
  },
  'utilities-find-document': {
    title: 'Find Document',
    screenshotsDir: 'test-results/screenshots/find_document',
    hideFromModules: true,
    documentNumberInput: true,
    actions: findDocumentActions.map((action) => ({
      id: action.id,
      label: action.label,
      moduleId: action.moduleId,
      testResultId: action.testResultId
    })),
    documentRunModes: [
      {
        id: 'display',
        label: 'Display'
      },
      {
        id: 'replicate',
        label: 'Replicate'
      }
    ],
    steps: getFindDocumentSteps()
  }

  
};
