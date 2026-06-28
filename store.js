const store = {
  users: [
    { id: 1, name: 'Test Company User', mobile: '9876543210', role: 'Customer' },
    { id: 2, name: 'Rohit Kumar', mobile: '9876500011', role: 'Staff' },
    { id: 3, name: 'Neha Singh', mobile: '9876500077', role: 'Manager' },
  ],
  products: [
    { id: 1, name: 'Premium Shirt', price: 899, category: 'Fashion', stock: 120, rating: 4.6 },
    { id: 2, name: 'Smart Watch', price: 2499, category: 'Electronics', stock: 48, rating: 4.7 },
    { id: 3, name: 'Office Bag', price: 1299, category: 'Lifestyle', stock: 76, rating: 4.4 },
    { id: 4, name: 'Wireless Earbuds', price: 1799, category: 'Electronics', stock: 31, rating: 4.5 },
  ],
  approvals: [
    { id: 1, name: 'Rohit Kumar', role: 'Staff Access', department: 'Delivery', status: 'Pending' },
    { id: 2, name: 'Neha Singh', role: 'Manager Access', department: 'Operations', status: 'Review' },
  ],
  deliveryTasks: [
    { id: 1, customer: 'Priya Sharma', address: 'Sector 62, Noida', status: 'Pickup Ready', eta: '15 mins' },
    { id: 2, customer: 'Imran Ali', address: 'Raj Nagar, Ghaziabad', status: 'Out for Delivery', eta: '22 mins' },
  ],
  orders: [
    {
      id: 2048,
      orderNumber: 'TC-2048',
      status: 'Out for Delivery',
      paymentStatus: 'Paid',
      paymentMethod: 'UPI',
      couponCode: 'TEST100',
      tracking: {
        progress: '78%',
        eta: '25 mins',
        steps: ['Placed', 'Packed', 'Out for Delivery', 'Delivered'],
      },
    },
  ],
  notifications: [
    { id: 1, message: 'Flash sale 6 PM tak live hai', type: 'marketing' },
    { id: 2, message: '2 approvals pending hain', type: 'admin' },
    { id: 3, message: 'Delivery rider 2.4 km door hai', type: 'delivery' },
  ],
  reviews: [
    { id: 1, name: 'Sanya', rating: 5, text: 'Fast delivery aur acchi quality.' },
    { id: 2, name: 'Harsh', rating: 4, text: 'Coupon apply hua aur checkout smooth tha.' },
  ],
  supportMessages: [
    { id: 1, sender: 'Customer', message: 'Mera order kab deliver hoga?', time: '10:15 AM' },
    { id: 2, sender: 'Support', message: 'Rider assign ho chuka hai. ETA 25 mins.', time: '10:17 AM' },
  ],
  settings: {
    pushEnabled: true,
    marketingEnabled: true,
    autoAssignDelivery: true,
    dailyReportEmail: true,
  },
};

module.exports = { store };
