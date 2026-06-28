export const paymentProviders = [
  { name: 'Razorpay', mode: 'UPI + Cards + Webhooks' },
  { name: 'PhonePe PG', mode: 'UPI focused checkout' },
  { name: 'Cashfree', mode: 'Cards + UPI + settlements' },
];

export const paymentWebhookSteps = [
  'Order create hone par payment intent banega',
  'Success callback me payment status verify hoga',
  'Webhook ke baad invoice aur order state update hogi',
  'Failed payment par retry option dikhaya jayega',
];

export function buildPaymentSummary(selectedPayment: string) {
  return `Selected method ${selectedPayment} ke saath payment flow ready hai, bas merchant keys aur callback URL add karne hain.`;
}
