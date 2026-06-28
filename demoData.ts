export type Role = 'Owner' | 'Manager' | 'Staff' | 'Customer';

export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  rating: number;
  description: string;
  badge: string;
};

export type Coupon = {
  code: string;
  title: string;
  type: 'flat' | 'percent' | 'delivery';
  value: number;
  minimumOrder: number;
};

export type ApprovalRequest = {
  id: number;
  name: string;
  role: string;
  department: string;
  status: 'Pending' | 'Review' | 'Approved' | 'Rejected';
};

export type DeliveryTask = {
  id: number;
  customer: string;
  address: string;
  status: 'Pickup Ready' | 'Out for Delivery' | 'Delivered';
  eta: string;
};

export type Order = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  items: number;
  couponCode?: string;
};

export type SupportMessage = {
  id: number;
  sender: 'Customer' | 'Support';
  message: string;
  time: string;
};

export const roles: { key: Role; label: string; description: string }[] = [
  { key: 'Owner', label: 'Owner', description: 'पूरा कंट्रोल, revenue aur business settings' },
  { key: 'Manager', label: 'Manager', description: 'Stock, orders aur team workflow manage karein' },
  { key: 'Staff', label: 'Staff', description: 'Delivery, support aur assigned operations tasks' },
  { key: 'Customer', label: 'Customer', description: 'Shopping, tracking, profile aur support use karein' },
];

export const dashboardByRole: Record<Role, { title: string; stats: { label: string; value: string }[] }> = {
  Owner: {
    title: 'Owner Command Center',
    stats: [
      { label: 'आज की बिक्री', value: '₹48,500' },
      { label: 'Monthly Revenue', value: '₹8.2L' },
      { label: 'Pending Approvals', value: '06' },
      { label: 'Open Tickets', value: '09' },
    ],
  },
  Manager: {
    title: 'Manager Operations',
    stats: [
      { label: 'Active Orders', value: '42' },
      { label: 'Low Stock Alerts', value: '05' },
      { label: 'Team Online', value: '18' },
      { label: 'Return Requests', value: '03' },
    ],
  },
  Staff: {
    title: 'Staff Workboard',
    stats: [
      { label: 'Assigned Tasks', value: '11' },
      { label: 'Deliveries Today', value: '07' },
      { label: 'Chats Pending', value: '04' },
      { label: 'Completion Rate', value: '91%' },
    ],
  },
  Customer: {
    title: 'Customer Home',
    stats: [
      { label: 'Saved Items', value: '11' },
      { label: 'Reward Points', value: '1,240' },
      { label: 'Current Cart', value: '03' },
      { label: 'Last Orders', value: '07' },
    ],
  },
};

export const authMethods = ['Mobile OTP', 'Google Login', 'Facebook Login'];
export const paymentMethods = ['UPI', 'Credit / Debit Card', 'Net Banking', 'Cash on Delivery'];

export const products: Product[] = [
  {
    id: 1,
    name: 'Premium Shirt',
    price: 899,
    category: 'Fashion',
    stock: 120,
    rating: 4.6,
    description: 'Office aur casual dono use ke liye premium cotton shirt.',
    badge: 'Best Seller',
  },
  {
    id: 2,
    name: 'Smart Watch',
    price: 2499,
    category: 'Electronics',
    stock: 48,
    rating: 4.7,
    description: 'Fitness tracking, calls aur notifications ke saath smart wearable.',
    badge: 'Trending',
  },
  {
    id: 3,
    name: 'Office Bag',
    price: 1299,
    category: 'Lifestyle',
    stock: 76,
    rating: 4.4,
    description: 'Laptop, files aur travel essentials ke liye durable bag.',
    badge: 'Work Pick',
  },
  {
    id: 4,
    name: 'Wireless Earbuds',
    price: 1799,
    category: 'Electronics',
    stock: 31,
    rating: 4.5,
    description: 'Clear audio, compact case aur long battery life.',
    badge: 'Hot Deal',
  },
  {
    id: 5,
    name: 'Running Shoes',
    price: 2199,
    category: 'Sports',
    stock: 22,
    rating: 4.3,
    description: 'Lightweight design with comfort sole for daily running.',
    badge: 'New Launch',
  },
];

export const coupons: Coupon[] = [
  { code: 'TEST100', title: 'पहले ऑर्डर पर flat discount', type: 'flat', value: 100, minimumOrder: 999 },
  { code: 'SAVE15', title: 'Fashion aur lifestyle items par 15% off', type: 'percent', value: 15, minimumOrder: 1499 },
  { code: 'FREEDEL', title: 'Delivery charge free offer', type: 'delivery', value: 80, minimumOrder: 499 },
];

export const initialApprovals: ApprovalRequest[] = [
  { id: 1, name: 'Rohit Kumar', role: 'Staff Access', department: 'Delivery', status: 'Pending' },
  { id: 2, name: 'Neha Singh', role: 'Manager Access', department: 'Operations', status: 'Review' },
  { id: 3, name: 'Aman Verma', role: 'Staff Access', department: 'Support', status: 'Approved' },
];

export const initialDeliveryTasks: DeliveryTask[] = [
  { id: 1, customer: 'Priya Sharma', address: 'Sector 62, Noida', status: 'Pickup Ready', eta: '15 mins' },
  { id: 2, customer: 'Imran Ali', address: 'Raj Nagar, Ghaziabad', status: 'Out for Delivery', eta: '22 mins' },
  { id: 3, customer: 'Nisha Gupta', address: 'Indirapuram, Ghaziabad', status: 'Delivered', eta: 'Completed' },
];

export const initialOrders: Order[] = [
  {
    id: 2048,
    orderNumber: 'TC-2048',
    status: 'Out for Delivery',
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    total: 2599,
    items: 2,
    couponCode: 'TEST100',
  },
  {
    id: 2047,
    orderNumber: 'TC-2047',
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'Card',
    total: 1799,
    items: 1,
  },
];

export const supportSeedMessages: SupportMessage[] = [
  { id: 1, sender: 'Customer', message: 'Mera order kab deliver hoga?', time: '10:15 AM' },
  { id: 2, sender: 'Support', message: 'Order rider ko assign ho chuka hai. ETA 25 mins.', time: '10:17 AM' },
];

export const notifications = [
  'Flash sale 6 PM tak live hai',
  '2 approvals aaj pending hain',
  'Ek product low stock me aa gaya hai',
  'Delivery rider 2.4 km door hai',
];

export const inventoryAlerts = [
  { label: 'Running Shoes', stock: 22 },
  { label: 'Wireless Earbuds', stock: 31 },
  { label: 'Smart Watch', stock: 48 },
];

export const analyticsBars = [
  { label: 'Sales', value: 86 },
  { label: 'Orders', value: 72 },
  { label: 'Support', value: 58 },
  { label: 'Delivery', value: 79 },
];

export const reviewHighlights = [
  { id: 1, name: 'Sanya', rating: 5, text: 'Fast delivery aur product quality bahut acchi thi.' },
  { id: 2, name: 'Harsh', rating: 4, text: 'Coupon apply hua aur checkout smooth tha.' },
  { id: 3, name: 'Aditi', rating: 5, text: 'Support chat ne issue jaldi solve kar diya.' },
];

export const companyLinks = ['Instagram', 'Facebook', 'LinkedIn', 'YouTube'];

export const settingsChecklist = [
  'Push notifications enable',
  'Marketing messages allow',
  'Auto-assign delivery tasks',
  'Daily report email',
];

export const featureSections = [
  {
    title: 'Core business modules',
    items: ['Auth', 'Catalog', 'Cart', 'Wishlist', 'Orders', 'Tracking', 'Payments', 'Invoices'],
  },
  {
    title: 'Operations modules',
    items: ['Approvals', 'Inventory', 'Delivery board', 'Analytics', 'Notifications', 'Support chat'],
  },
];
