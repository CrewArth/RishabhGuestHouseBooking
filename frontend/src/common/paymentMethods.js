/**
 * Shared list of all supported payment methods.
 * Used across the admin panel (PaymentPage, ReceiptPaymentModal, print utilities, etc.)
 * and the user-facing pages wherever payment method selection is needed.
 *
 * Format: array of { label, value, icon? } objects for maximum flexibility,
 * plus a simple string array (PAYMENT_METHODS) for backward compatibility.
 */

export const PAYMENT_METHODS = [
  'Cash',
  'Debit Card',
  'Credit Card',
  'UPI',
  'Bank Transfer',
  'Other',
];

export const DEFAULT_PAYMENT_METHOD = PAYMENT_METHODS[0]; // 'Cash'

/**
 * Extended list of payment methods with rich metadata (label, value, icon hints).
 * Use this when rendering select dropdowns, radio buttons, or UI cards.
 */
export const PAYMENT_METHODS_LIST = [
  {
    label: 'Cash',
    value: 'Cash',
    description: 'In-person cash payment',
  },
  {
    label: 'Debit Card',
    value: 'Debit Card',
    description: 'Debit card terminal / POS',
  },
  {
    label: 'Credit Card',
    value: 'Credit Card',
    description: 'Credit card terminal / POS',
  },
  {
    label: 'UPI',
    value: 'UPI',
    description: 'GPay, PhonePe, Paytm, BHIM etc.',
  },
  {
    label: 'Bank Transfer',
    value: 'Bank Transfer',
    description: 'NEFT, RTGS, IMPS, direct bank deposit',
  },
  {
    label: 'Other',
    value: 'Other',
    description: 'Cheque, wallet, or any other method',
  },
];
