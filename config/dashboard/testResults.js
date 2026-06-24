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
      }

    }
  },
  'sales-delivery-order': {
    title: 'Delivery Order',
    screenshotsDir: 'test-results/screenshots/delivery_order',
    dataInputs: [
      {
        id: 'customerCode',
        label: 'Customer Code',
        envKey: 'BPI_DELIVERY_BPCODE',
        required: true
      }
    ],
    steps: {
      '00_DELIVERY_ORDER_OPENED.png': {
        title: 'Delivery order screen opened',
        description: 'The Delivery Order standard transaction module opened successfully.'
      },
      '01_DELIVERY_BP_COPY_FROM_READY.png': {
        title: 'Business partner entered',
        description:
          'The BP Code was entered and the Copy From button was visible before opening source documents.'
      },
      '02_DELIVERY_SALES_ORDERS_POPUP.png': {
        title: 'Sales Orders popup opened',
        description:
          'The Copy From menu was opened and Sales Orders was selected, opening the source document popup.'
      },
      '03_DELIVERY_SO_HEADER_SELECTED.png': {
        title: 'Sales Order header selected',
        description:
          'The Choose button was visible and the matching Sales Order header row was selected in the popup.'
      },
      '04_DELIVERY_SO_ITEMS_LOADED.png': {
        title: 'Sales Order items loaded',
        description:
          'The selected Sales Order populated the item table in the popup before item selection.'
      },
      '05_DELIVERY_SO_ITEMS_SELECTED.png': {
        title: 'Sales Order items selected',
        description:
          'The copied Sales Order item checkbox was selected before finishing the popup.'
      },
      '06_DELIVERY_ITEMS_COPIED_TO_MAIN.png': {
        title: 'Delivery Order line populated',
        description:
          'The popup finished and the Delivery Order line item code was populated on the main form.'
      },
      '07_DELIVERY_DOCSERIES_PRIMARY.png': {
        title: 'Primary document series selected',
        description: 'The Delivery Order document series was changed to Primary.'
      },
      '08_DELIVERY_INV_DEL_DATE_TODAY.png': {
        title: 'Invoice delivery date selected',
        description:
          'The General (UDF) tab was opened and the invoice delivery date calendar selected Today.'
      },
      '09_DELIVERY_SHIP_TO_ADDRESS_FILLED.png': {
        title: 'Logistics details completed',
        description:
          'The Logistics tab was opened, SHIP TO and DELIVERY were selected, and the ship-to address was populated.'
      },
      '10_DELIVERY_TRUCKER_AND_PLATE_SELECTED.png': {
        title: 'Trucker and plate selected',
        description:
          'The General (UDF) tab was reopened, the trucker code lookup selected 000, and the plate number lookup selected the first row.'
      },
      '11_DELIVERY_SAVED_AS_DRAFT.png': {
        title: 'Delivery Order saved as draft',
        description: 'The Delivery Order was saved as draft and the page reloaded with draft status.'
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
