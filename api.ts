export const API_BASE_URL = 'http://localhost:4000';

export const apiRoutes = [
  'GET /health',
  'GET /dashboard/summary',
  'POST /auth/login',
  'POST /auth/signup',
  'GET /products',
  'GET /orders',
  'POST /orders',
  'GET /orders/:id/tracking',
  'GET /approvals',
  'PATCH /approvals/:id',
  'GET /delivery/tasks',
  'PATCH /delivery/tasks/:id',
  'GET /notifications',
  'GET /reviews',
  'GET /support/messages',
  'POST /support/messages',
  'GET /settings',
  'PATCH /settings',
];

export const sampleAuthPayload = {
  name: 'Test Company User',
  mobile: '9876543210',
  role: 'Customer',
};

export const sampleOrderPayload = {
  productId: 2,
  quantity: 1,
  paymentMethod: 'UPI',
  couponCode: 'TEST100',
  total: 2599,
  items: 2,
};

export function getApiStatusMessage() {
  return 'Backend API scaffold ready hai. Isko real DB aur auth tokens ke saath connect kiya ja sakta hai.';
}
