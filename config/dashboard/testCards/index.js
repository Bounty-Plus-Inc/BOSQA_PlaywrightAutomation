import { approvalCards } from './admin/approval.js';
import { deliveryOrderCards } from './sales/delivery-order.js';
import { salesOrderTransactionCards } from './sales/sales-order-transaction.js';
 
import { goodsReceiptTransactionCards } from './Inventory/goods-receipt-transaction-card.js';

export const testCards = {
  'admin-approval': approvalCards,
  'sales-delivery-order': deliveryOrderCards,
  'sales-sales-order-transaction': salesOrderTransactionCards,
  'inventory-goods-receipt' : goodsReceiptTransactionCards
};
 