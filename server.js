const http = require('http');
const { URL } = require('url');
const { sendJson, parseBody, getIdFromPath } = require('./helpers');
const { store } = require('./store');

const PORT = process.env.PORT || 4000;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  try {
    if (req.method === 'GET' && pathname === '/') {
      sendJson(res, 200, {
        app: 'test-company-backend',
        status: 'running',
        endpoints: [
          'GET /health',
          'GET /dashboard/summary',
          'POST /auth/login',
          'POST /auth/signup',
          'GET /products',
          'GET /orders',
          'POST /orders',
          'GET /orders/:id/tracking',
          'GET /approvals',
          'PATCH /approvals/1',
          'GET /delivery/tasks',
          'PATCH /delivery/tasks/:id',
          'GET /notifications',
          'GET /reviews',
          'GET /support/messages',
          'POST /support/messages',
          'GET /settings',
          'PATCH /settings',
        ],
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/health') {
      sendJson(res, 200, { ok: true, service: 'test-company-backend' });
      return;
    }

    if (req.method === 'GET' && pathname === '/dashboard/summary') {
      sendJson(res, 200, {
        salesToday: 48500,
        activeOrders: store.orders.length,
        pendingApprovals: store.approvals.filter((item) => item.status !== 'Approved').length,
        lowStockProducts: store.products.filter((item) => item.stock < 50),
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/auth/login') {
      const body = await parseBody(req);
      sendJson(res, 200, {
        message: 'Login successful',
        token: 'demo-token-123',
        user: {
          id: 1,
          name: body.name || 'Test Company User',
          mobile: body.mobile || '9876543210',
          role: body.role || 'Customer',
        },
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/auth/signup') {
      const body = await parseBody(req);
      const newUser = {
        id: store.users.length + 1,
        name: body.name || 'New User',
        mobile: body.mobile || '0000000000',
        role: body.role || 'Customer',
      };

      store.users.push(newUser);
      sendJson(res, 201, { message: 'Signup successful', user: newUser });
      return;
    }

    if (req.method === 'GET' && pathname === '/products') {
      sendJson(res, 200, { items: store.products });
      return;
    }

    if (req.method === 'GET' && pathname === '/orders') {
      sendJson(res, 200, { items: store.orders });
      return;
    }

    if (req.method === 'POST' && pathname === '/orders') {
      const body = await parseBody(req);
      const order = {
        id: store.orders.length + 2049,
        orderNumber: `TC-${store.orders.length + 2049}`,
        status: 'Placed',
        paymentStatus: body.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
        paymentMethod: body.paymentMethod || 'UPI',
        couponCode: body.couponCode || null,
        total: body.total || 0,
        items: body.items || 1,
        tracking: {
          progress: '20%',
          eta: '45 mins',
          steps: ['Placed', 'Packed', 'Out for Delivery', 'Delivered'],
        },
      };

      store.orders.push(order);
      sendJson(res, 201, { message: 'Order created', order });
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/orders/') && pathname.endsWith('/tracking')) {
      const id = Number(pathname.split('/')[2]);
      const order = store.orders.find((item) => item.id === id);
      if (!order) {
        sendJson(res, 404, { message: 'Order not found' });
        return;
      }
      sendJson(res, 200, { tracking: order?.tracking, order });
      return;
    }

    if (req.method === 'GET' && pathname === '/approvals') {
      sendJson(res, 200, { items: store.approvals });
      return;
    }

    if (req.method === 'PATCH' && pathname.startsWith('/approvals/')) {
      const id = getIdFromPath(pathname);
      const body = await parseBody(req);
      const approval = store.approvals.find((item) => item.id === id);

      if (!approval) {
        sendJson(res, 404, { message: 'Approval request not found' });
        return;
      }

      approval.status = body.status || 'Approved';
      sendJson(res, 200, { message: 'Approval updated', approval });
      return;
    }

    if (req.method === 'GET' && pathname === '/delivery/tasks') {
      sendJson(res, 200, { tasks: store.deliveryTasks });
      return;
    }

    if (req.method === 'PATCH' && pathname.startsWith('/delivery/tasks/')) {
      const id = getIdFromPath(pathname);
      const body = await parseBody(req);
      const task = store.deliveryTasks.find((item) => item.id === id);

      if (!task) {
        sendJson(res, 404, { message: 'Delivery task not found' });
        return;
      }

      task.status = body.status || task.status;
      task.eta = body.eta || task.eta;
      sendJson(res, 200, { message: 'Delivery task updated', task });
      return;
    }

    if (req.method === 'GET' && pathname === '/notifications') {
      sendJson(res, 200, { items: store.notifications });
      return;
    }

    if (req.method === 'GET' && pathname === '/reviews') {
      sendJson(res, 200, { items: store.reviews });
      return;
    }

    if (req.method === 'GET' && pathname === '/support/messages') {
      sendJson(res, 200, { items: store.supportMessages });
      return;
    }

    if (req.method === 'POST' && pathname === '/support/messages') {
      const body = await parseBody(req);
      const message = {
        id: store.supportMessages.length + 1,
        sender: body.sender || 'Customer',
        message: body.message || 'Hello',
        time: body.time || 'Just now',
      };

      store.supportMessages.push(message);
      sendJson(res, 201, { message: 'Support message saved', item: message });
      return;
    }

    if (req.method === 'GET' && pathname === '/settings') {
      sendJson(res, 200, { settings: store.settings });
      return;
    }

    if (req.method === 'PATCH' && pathname === '/settings') {
      const body = await parseBody(req);
      store.settings = { ...store.settings, ...body };
      sendJson(res, 200, { message: 'Settings updated', settings: store.settings });
      return;
    }

    sendJson(res, 404, { message: 'Route not found' });
  } catch (error) {
    sendJson(res, 500, { message: 'Server error', error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`test-company-backend running on http://localhost:${PORT}`);
});
