import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { firebaseSetup, orderApiPlan, paymentGatewaySetup } from '../config/integrations';
import {
  analyticsBars,
  authMethods,
  companyLinks,
  coupons,
  dashboardByRole,
  featureSections,
  initialApprovals,
  initialDeliveryTasks,
  initialOrders,
  inventoryAlerts,
  notifications,
  paymentMethods,
  products,
  reviewHighlights,
  roles,
  Role,
  settingsChecklist,
  supportSeedMessages,
} from '../data/demoData';
import { API_BASE_URL, apiRoutes, getApiStatusMessage, sampleAuthPayload, sampleOrderPayload } from '../services/api';
import {
  firebaseAuthProviders,
  firebaseCollections,
  firebaseConfigTemplate,
  firebaseSetupChecklist,
} from '../services/firebase';
import { buildPaymentSummary, paymentProviders, paymentWebhookSteps } from '../services/payment';
import { liveTrackingPoints, routeMetrics } from '../services/tracking';
import { formatCurrency } from '../utils/format';

type AppTab = 'Dashboard' | 'Shop' | 'Orders' | 'Team' | 'Support' | 'Setup';
type CartLine = (typeof products)[number] & { quantity: number };

const tabs: AppTab[] = ['Dashboard', 'Shop', 'Orders', 'Team', 'Support', 'Setup'];

export default function App() {
  const [selectedRole, setSelectedRole] = useState<Role>('Owner');
  const [activeTab, setActiveTab] = useState<AppTab>('Dashboard');
  const [search, setSearch] = useState('');
  const [selectedAuthMethod, setSelectedAuthMethod] = useState(authMethods[0]);
  const [name, setName] = useState('Test Company User');
  const [mobile, setMobile] = useState('9876543210');
  const [couponCode, setCouponCode] = useState('TEST100');
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0]);
  const [chatInput, setChatInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(true);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<number[]>([2, 4]);
  const [cart, setCart] = useState<Record<number, number>>({ 1: 1, 2: 1 });
  const [messages, setMessages] = useState(supportSeedMessages);
  const [approvals, setApprovals] = useState(initialApprovals);
  const [deliveryTasks, setDeliveryTasks] = useState(initialDeliveryTasks);
  const [orders, setOrders] = useState(initialOrders);
  const [feed, setFeed] = useState(notifications);
  const dashboard = dashboardByRole[selectedRole];

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(normalized) ||
        product.category.toLowerCase().includes(normalized) ||
        product.badge.toLowerCase().includes(normalized),
    );
  }, [search]);

  const matchedCoupon = useMemo(
    () => coupons.find((coupon) => coupon.code.toLowerCase() === couponCode.trim().toLowerCase()),
    [couponCode],
  );

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const product = products.find((item) => item.id === Number(id));
          return product ? { ...product, quantity } : null;
        })
        .filter((item): item is CartLine => item !== null),
    [cart],
  );

  const cartSubtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems],
  );

  const deliveryFee = cartSubtotal > 0 ? 80 : 0;
  const couponDiscount = useMemo(() => {
    if (!matchedCoupon || cartSubtotal < matchedCoupon.minimumOrder) return 0;
    if (matchedCoupon.type === 'flat') return matchedCoupon.value;
    if (matchedCoupon.type === 'percent') return Math.floor((cartSubtotal * matchedCoupon.value) / 100);
    if (matchedCoupon.type === 'delivery') return deliveryFee;
    return 0;
  }, [cartSubtotal, deliveryFee, matchedCoupon]);

  const finalTotal = Math.max(cartSubtotal + deliveryFee - couponDiscount, 0);
  const paymentSummary = useMemo(() => buildPaymentSummary(selectedPayment), [selectedPayment]);
  const pendingApprovals = approvals.filter((item) => item.status === 'Pending' || item.status === 'Review').length;
  const deliveredCount = deliveryTasks.filter((item) => item.status === 'Delivered').length;

  function toggleWishlist(productId: number) {
    setWishlistIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    );
  }

  function addToCart(productId: number) {
    setCart((current) => ({ ...current, [productId]: (current[productId] || 0) + 1 }));
    setFeed((current) => [`Product ${productId} cart me add hua`, ...current].slice(0, 6));
  }

  function updateCartQuantity(productId: number, delta: number) {
    setCart((current) => {
      const next = (current[productId] || 0) + delta;
      if (next <= 0) {
        const clone = { ...current };
        delete clone[productId];
        return clone;
      }
      return { ...current, [productId]: next };
    });
  }

  function handleLogin(mode: 'login' | 'signup') {
    setIsLoggedIn(true);
    setFeed((current) => [
      `${mode === 'login' ? 'Login' : 'Signup'} successful via ${selectedAuthMethod}`,
      ...current,
    ].slice(0, 6));
  }

  function handlePlaceOrder() {
    if (cartItems.length === 0) return;
    const nextId = orders[0].id + 1;
    const newOrder = {
      id: nextId,
      orderNumber: `TC-${nextId}`,
      status: 'Placed',
      paymentStatus: selectedPayment === 'Cash on Delivery' ? 'Pending' : 'Paid',
      paymentMethod: selectedPayment,
      total: finalTotal,
      items: cartItems.length,
      couponCode: matchedCoupon?.code,
    };

    setOrders((current) => [newOrder, ...current]);
    setCart({});
    setFeed((current) => [`Naya order ${newOrder.orderNumber} place hua`, ...current].slice(0, 6));
    setActiveTab('Orders');
  }

  function updateApproval(id: number, status: 'Approved' | 'Rejected') {
    setApprovals((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function updateDelivery(id: number) {
    const nextStatusMap = {
      'Pickup Ready': { status: 'Out for Delivery' as const, eta: '18 mins' },
      'Out for Delivery': { status: 'Delivered' as const, eta: 'Completed' },
      Delivered: { status: 'Delivered' as const, eta: 'Completed' },
    };

    setDeliveryTasks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...nextStatusMap[item.status] } : item,
      ),
    );
  }

  function sendSupportMessage() {
    const message = chatInput.trim();
    if (!message) return;

    setMessages((current) => [
      ...current,
      { id: current.length + 1, sender: 'Customer', message, time: 'Just now' },
      { id: current.length + 2, sender: 'Support', message: 'Team ne request receive kar li hai.', time: 'Just now' },
    ]);
    setChatInput('');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.badge}>test company app</Text>
          <Text style={styles.heroTitle}>Final business app demo with shopping, ops, support aur setup</Text>
          <Text style={styles.heroSubtitle}>
            Yeh version app ko kaafi zyada complete demo banata hai: cart, wishlist, orders, approvals, delivery,
            analytics, support aur integration setup sab ek hi jagah milta hai.
          </Text>
          <View style={styles.heroMetaRow}>
            <Text style={styles.heroMeta}>{isLoggedIn ? 'Logged in' : 'Guest mode'}</Text>
            <Text style={styles.heroMeta}>Cart items: {cartItems.length}</Text>
            <Text style={styles.heroMeta}>Pending approvals: {pendingApprovals}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsWrap}>
          <View style={styles.tabRow}>
            {tabs.map((tab) => {
              const active = tab === activeTab;
              return (
                <Pressable
                  key={tab}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{tab}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>रोल चुनें</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.roleRow}>
              {roles.map((role) => {
                const active = role.key === selectedRole;
                return (
                  <Pressable
                    key={role.key}
                    style={[styles.roleCard, active && styles.roleCardActive]}
                    onPress={() => setSelectedRole(role.key)}
                  >
                    <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>{role.label}</Text>
                    <Text style={[styles.roleDescription, active && styles.roleDescriptionActive]}>
                      {role.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {activeTab === 'Dashboard' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{dashboard.title}</Text>
              <View style={styles.statsGrid}>
                {dashboard.stats.map((stat) => (
                  <View key={stat.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick overview</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>Wishlist items: {wishlistIds.length}</Text>
                <Text style={styles.infoText}>Orders created: {orders.length}</Text>
                <Text style={styles.infoText}>Delivered tasks: {deliveredCount}</Text>
                <Text style={styles.infoText}>Current total in cart: {formatCurrency(finalTotal)}</Text>
              </View>
              {featureSections.map((section) => (
                <View key={section.title} style={styles.featureBlock}>
                  <Text style={styles.featureTitle}>{section.title}</Text>
                  {section.items.map((item) => (
                    <Text key={item} style={styles.featureItem}>
                      • {item}
                    </Text>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification feed</Text>
              {feed.map((item) => (
                <View key={item} style={styles.noticeCard}>
                  <Text style={styles.noticeText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'Shop' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Login / Sign-up</Text>
              <View style={styles.formCard}>
                <Text style={styles.infoTitle}>Authentication Method</Text>
                <View style={styles.chipRow}>
                  {authMethods.map((method) => {
                    const active = method === selectedAuthMethod;
                    return (
                      <Pressable
                        key={method}
                        style={[styles.miniChip, active && styles.miniChipActive]}
                        onPress={() => setSelectedAuthMethod(method)}
                      >
                        <Text style={[styles.miniChipText, active && styles.miniChipTextActive]}>{method}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="पूरा नाम"
                  placeholderTextColor="#64748B"
                  style={styles.searchInput}
                />
                <TextInput
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="मोबाइल नंबर"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                  style={styles.searchInput}
                />
                <View style={styles.actionRow}>
                  <Pressable style={styles.secondaryButton} onPress={() => handleLogin('login')}>
                    <Text style={styles.secondaryButtonText}>Login</Text>
                  </Pressable>
                  <Pressable style={styles.primaryButton} onPress={() => handleLogin('signup')}>
                    <Text style={styles.primaryButtonText}>Create Account</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Product Catalog</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="प्रोडक्ट, category ya badge search karein"
                placeholderTextColor="#6B7280"
                style={styles.searchInput}
              />
              {filteredProducts.map((product) => {
                const inWishlist = wishlistIds.includes(product.id);
                const qty = cart[product.id] || 0;
                return (
                  <View key={product.id} style={styles.productCard}>
                    <View style={styles.productTopRow}>
                      <View style={styles.productHeaderLeft}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productMeta}>
                          {product.category} · ⭐ {product.rating}
                        </Text>
                      </View>
                      <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                    </View>
                    <Text style={styles.productBadge}>{product.badge}</Text>
                    <Text style={styles.infoText}>{product.description}</Text>
                    <Text style={styles.productMeta}>Stock: {product.stock}</Text>
                    <Text style={styles.productMeta}>Cart qty: {qty}</Text>
                    <View style={styles.actionRow}>
                      <Pressable style={styles.secondaryButton} onPress={() => toggleWishlist(product.id)}>
                        <Text style={styles.secondaryButtonText}>{inWishlist ? 'Remove Wishlist' : 'Wishlist'}</Text>
                      </Pressable>
                      <Pressable style={styles.primaryButton} onPress={() => addToCart(product.id)}>
                        <Text style={styles.primaryButtonText}>Add to Cart</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cart & Coupon</Text>
              <View style={styles.formCard}>
                <TextInput
                  value={couponCode}
                  onChangeText={setCouponCode}
                  placeholder="Coupon code daalein"
                  placeholderTextColor="#64748B"
                  autoCapitalize="characters"
                  style={styles.searchInput}
                />
                <View style={[styles.infoCard, matchedCoupon ? styles.infoCardSuccess : styles.infoCardWarning]}>
                  <Text style={styles.infoTitle}>
                    {matchedCoupon ? `${matchedCoupon.code} available hai` : 'Coupon abhi match nahi hua'}
                  </Text>
                  <Text style={styles.infoText}>
                    {matchedCoupon
                      ? `${matchedCoupon.title} | Minimum order ${formatCurrency(matchedCoupon.minimumOrder)}`
                      : 'Demo coupons: TEST100, SAVE15, FREEDEL'}
                  </Text>
                </View>
                {cartItems.map((item) => (
                  <View key={item.id} style={styles.cartItemRow}>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.infoText}>
                        {formatCurrency(item.price)} × {item.quantity}
                      </Text>
                    </View>
                    <View style={styles.qtyRow}>
                      <Pressable style={styles.qtyButton} onPress={() => updateCartQuantity(item.id, -1)}>
                        <Text style={styles.qtyButtonText}>-</Text>
                      </Pressable>
                      <Text style={styles.qtyValue}>{item.quantity}</Text>
                      <Pressable style={styles.qtyButton} onPress={() => updateCartQuantity(item.id, 1)}>
                        <Text style={styles.qtyButtonText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
                <View style={styles.billCard}>
                  <Text style={styles.infoText}>Subtotal: {formatCurrency(cartSubtotal)}</Text>
                  <Text style={styles.infoText}>Delivery: {formatCurrency(deliveryFee)}</Text>
                  <Text style={styles.infoText}>Discount: -{formatCurrency(couponDiscount)}</Text>
                  <Text style={styles.billTotal}>Final Total: {formatCurrency(finalTotal)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment</Text>
              <View style={styles.chipRow}>
                {paymentMethods.map((method) => {
                  const active = method === selectedPayment;
                  return (
                    <Pressable
                      key={method}
                      style={[styles.miniChip, active && styles.miniChipActive]}
                      onPress={() => setSelectedPayment(method)}
                    >
                      <Text style={[styles.miniChipText, active && styles.miniChipTextActive]}>{method}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Selected payment</Text>
                <Text style={styles.infoText}>{selectedPayment}</Text>
                <Text style={styles.infoText}>{paymentSummary}</Text>
                <Text style={styles.infoText}>Status: {paymentGatewaySetup.status}</Text>
              </View>
              <View style={styles.actionRow}>
                <Pressable style={styles.primaryButton} onPress={handlePlaceOrder}>
                  <Text style={styles.primaryButtonText}>Place Order</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {activeTab === 'Orders' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Orders</Text>
              {orders.map((order) => (
                <View key={order.id} style={styles.productCard}>
                  <View style={styles.productTopRow}>
                    <View>
                      <Text style={styles.productName}>{order.orderNumber}</Text>
                      <Text style={styles.infoText}>
                        {order.items} items · {order.paymentMethod}
                      </Text>
                    </View>
                    <Text style={styles.productPrice}>{formatCurrency(order.total)}</Text>
                  </View>
                  <Text style={styles.infoText}>Order status: {order.status}</Text>
                  <Text style={styles.infoText}>Payment status: {order.paymentStatus}</Text>
                  <Text style={styles.infoText}>Coupon: {order.couponCode || 'None'}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Live Tracking</Text>
              <View style={styles.timelineCard}>
                <Text style={styles.timelineOrder}>Order #TC-2048</Text>
                <Text style={styles.timelineText}>Placed → Packed → Out for Delivery → Delivered</Text>
                <View style={styles.progressTrack}>
                  <View style={styles.progressFill} />
                </View>
                <Text style={styles.timelineMeta}>
                  Rider: {routeMetrics.rider} | ETA: {routeMetrics.eta}
                </Text>
              </View>
              {liveTrackingPoints.map((point) => (
                <View key={point.step} style={styles.timelineStepCard}>
                  <Text style={styles.timelineStepTitle}>{point.step}</Text>
                  <Text style={styles.infoText}>{point.label}</Text>
                  <Text style={styles.timelineMeta}>{point.time}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'Team' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Approval Requests</Text>
              {approvals.map((request) => (
                <View key={request.id} style={styles.productCard}>
                  <View style={styles.productTopRow}>
                    <View>
                      <Text style={styles.productName}>{request.name}</Text>
                      <Text style={styles.productMeta}>
                        {request.role} · {request.department}
                      </Text>
                    </View>
                    <Text style={styles.statusBadge}>{request.status}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable style={styles.secondaryButton} onPress={() => updateApproval(request.id, 'Rejected')}>
                      <Text style={styles.secondaryButtonText}>Reject</Text>
                    </Pressable>
                    <Pressable style={styles.primaryButton} onPress={() => updateApproval(request.id, 'Approved')}>
                      <Text style={styles.primaryButtonText}>Approve</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Board</Text>
              {deliveryTasks.map((task) => (
                <View key={task.id} style={styles.productCard}>
                  <Text style={styles.productName}>{task.customer}</Text>
                  <Text style={styles.infoText}>{task.address}</Text>
                  <Text style={styles.infoText}>
                    Status: {task.status} | ETA: {task.eta}
                  </Text>
                  <View style={styles.actionRow}>
                    <Pressable style={styles.primaryButton} onPress={() => updateDelivery(task.id)}>
                      <Text style={styles.primaryButtonText}>Update Status</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inventory & Analytics</Text>
              {inventoryAlerts.map((alert) => (
                <View key={alert.label} style={styles.noticeCard}>
                  <Text style={styles.noticeText}>
                    {alert.label} low stock alert · {alert.stock} units left
                  </Text>
                </View>
              ))}
              {analyticsBars.map((bar) => (
                <View key={bar.label} style={styles.chartCard}>
                  <View style={styles.productTopRow}>
                    <Text style={styles.productName}>{bar.label}</Text>
                    <Text style={styles.infoText}>{bar.value}%</Text>
                  </View>
                  <View style={styles.chartTrack}>
                    <View style={[styles.chartFill, { width: `${bar.value}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'Support' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Support Chat</Text>
              <View style={styles.formCard}>
                {messages.map((message) => (
                  <View
                    key={message.id}
                    style={[styles.chatBubble, message.sender === 'Support' ? styles.supportBubble : styles.customerBubble]}
                  >
                    <Text style={styles.chatSender}>{message.sender}</Text>
                    <Text style={styles.chatText}>{message.message}</Text>
                    <Text style={styles.chatTime}>{message.time}</Text>
                  </View>
                ))}
                <TextInput
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Apna message likhein"
                  placeholderTextColor="#64748B"
                  style={styles.searchInput}
                />
                <Pressable style={styles.primaryButton} onPress={sendSupportMessage}>
                  <Text style={styles.primaryButtonText}>Send Message</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {reviewHighlights.map((review) => (
                <View key={review.id} style={styles.productCard}>
                  <Text style={styles.productName}>
                    {review.name} · {'⭐'.repeat(review.rating)}
                  </Text>
                  <Text style={styles.infoText}>{review.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Company Links</Text>
              <View style={styles.chipRow}>
                {companyLinks.map((item) => (
                  <View key={item} style={styles.miniChip}>
                    <Text style={styles.miniChipText}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.contactCard}>
                <Text style={styles.contactTitle}>Company Info</Text>
                <Text style={styles.contactText}>
                  About Us, office address, map location, social links aur support escalation flow yahan integrate ho sakta hai.
                </Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'Setup' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Integration Setup</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Firebase Status</Text>
                <Text style={styles.infoText}>{firebaseSetup.status}</Text>
                {firebaseSetup.services.map((service) => (
                  <Text key={service} style={styles.featureItem}>
                    • {service}
                  </Text>
                ))}
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Firebase Collections</Text>
                {firebaseCollections.map((collection) => (
                  <Text key={collection} style={styles.featureItem}>
                    • {collection}
                  </Text>
                ))}
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Firebase Keys</Text>
                {Object.entries(firebaseConfigTemplate).map(([key, value]) => (
                  <Text key={key} style={styles.codeLine}>
                    {key}: {String(value)}
                  </Text>
                ))}
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Auth Providers</Text>
                {firebaseAuthProviders.map((provider) => (
                  <Text key={provider} style={styles.featureItem}>
                    • {provider}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment & API Setup</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Payment providers</Text>
                {paymentProviders.map((provider) => (
                  <Text key={provider.name} style={styles.featureItem}>
                    • {provider.name}: {provider.mode}
                  </Text>
                ))}
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Webhook steps</Text>
                {paymentWebhookSteps.map((step) => (
                  <Text key={step} style={styles.featureItem}>
                    • {step}
                  </Text>
                ))}
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>API Base URL</Text>
                <Text style={styles.codeLine}>{API_BASE_URL}</Text>
                <Text style={styles.infoText}>{getApiStatusMessage()}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Available routes</Text>
                {[...orderApiPlan, ...apiRoutes].map((route) => (
                  <Text key={route} style={styles.featureItem}>
                    • {route}
                  </Text>
                ))}
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Payload preview</Text>
                {Object.entries(sampleAuthPayload).map(([key, value]) => (
                  <Text key={key} style={styles.codeLine}>
                    auth.{key}: {String(value)}
                  </Text>
                ))}
                {Object.entries(sampleOrderPayload).map(([key, value]) => (
                  <Text key={key} style={styles.codeLine}>
                    order.{key}: {String(value)}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <View style={styles.infoCard}>
                {settingsChecklist.map((item) => (
                  <Text key={item} style={styles.featureItem}>
                    • {item}
                  </Text>
                ))}
                <View style={styles.switchRow}>
                  <Text style={styles.infoText}>Push notifications</Text>
                  <Pressable style={styles.toggleButton} onPress={() => setPushEnabled((value) => !value)}>
                    <Text style={styles.toggleText}>{pushEnabled ? 'ON' : 'OFF'}</Text>
                  </Pressable>
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.infoText}>Marketing messages</Text>
                  <Pressable style={styles.toggleButton} onPress={() => setMarketingEnabled((value) => !value)}>
                    <Text style={styles.toggleText}>{marketingEnabled ? 'ON' : 'OFF'}</Text>
                  </Pressable>
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.infoText}>Auto assign delivery</Text>
                  <Pressable style={styles.toggleButton} onPress={() => setAutoAssignEnabled((value) => !value)}>
                    <Text style={styles.toggleText}>{autoAssignEnabled ? 'ON' : 'OFF'}</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Setup checklist</Text>
                {firebaseSetupChecklist.map((step) => (
                  <Text key={step} style={styles.featureItem}>
                    • {step}
                  </Text>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomNav}>
          {tabs.map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.bottomNavItem, activeTab === tab && styles.bottomNavItemActive]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  tabsWrap: {
    marginBottom: 18,
  },
  tabRow: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  tabChipActive: {
    backgroundColor: '#0F172A',
  },
  tabChipText: {
    color: '#334155',
    fontWeight: '700',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  heroMeta: {
    color: '#DBEAFE',
    fontSize: 12,
    marginRight: 12,
    marginBottom: 6,
  },
  badge: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  roleCard: {
    width: 220,
    backgroundColor: '#E2E8F0',
    padding: 16,
    borderRadius: 18,
    marginRight: 12,
  },
  roleCardActive: {
    backgroundColor: '#2563EB',
  },
  roleTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  roleTitleActive: {
    color: '#FFFFFF',
  },
  roleDescription: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 19,
  },
  roleDescriptionActive: {
    color: '#DBEAFE',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#475569',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productHeaderLeft: {
    flex: 1,
    paddingRight: 12,
  },
  productName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  productBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 2,
  },
  productMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  secondaryButtonText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineOrder: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  timelineText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 12,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    width: '78%',
    height: '100%',
    backgroundColor: '#22C55E',
  },
  timelineMeta: {
    fontSize: 13,
    color: '#475569',
  },
  noticeCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  noticeText: {
    color: '#1E3A8A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  timelineStepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  timelineStepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  infoCardSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  infoCardWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  codeLine: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  cartItemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '800',
  },
  qtyValue: {
    marginHorizontal: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  billCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
  },
  billTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  chartTrack: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  chartFill: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  chatBubble: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  supportBubble: {
    backgroundColor: '#DBEAFE',
  },
  customerBubble: {
    backgroundColor: '#F1F5F9',
  },
  chatSender: {
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  chatText: {
    color: '#334155',
    lineHeight: 20,
  },
  chatTime: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  miniChip: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  miniChipActive: {
    backgroundColor: '#DBEAFE',
  },
  miniChipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  miniChipTextActive: {
    color: '#1D4ED8',
  },
  featureBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  featureItem: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E40AF',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 8,
  },
  bottomNavItem: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  bottomNavItemActive: {
    color: '#38BDF8',
  },
  statusBadge: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  toggleButton: {
    backgroundColor: '#0F172A',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
