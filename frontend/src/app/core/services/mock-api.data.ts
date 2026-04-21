import {
  AuthResponse,
  BulkOrderImportResponse,
  BulkOrderRowInput,
  CommissionPreviewResponse,
  CartResponse,
  DashboardResponse,
  ExperienceData,
  Order,
  OrderDraft,
  OrderDraftPayload,
  OrderFilter,
  OrderHistoryResponse,
  OrdersResponse,
  Product,
  ProductManagementPayload,
  ProductPricingPayload,
  ProductResponse,
  ReorderSuggestion,
  SessionUser,
  ShipmentPayload,
  ShipmentRecord,
  SpendingReportResponse,
  SubscriptionTierConfig,
  UserRole,
} from '../models/app-data.model';

type StoredUser = SessionUser & { password: string };

const customerUser: StoredUser = {
  id: 'cust-1',
  role: 'customer',
  name: 'Maya Joseph',
  company: 'City Bistro Group',
  email: 'demo@restaurant.com',
  password: 'demo123',
  phone: '+1 212 555 0190',
  location: 'New York, NY',
  approved: true,
};

const vendorUser: StoredUser = {
  id: 'vendor-1',
  role: 'vendor',
  name: 'Daniel Ortega',
  company: 'Harbor Foods Supply',
  email: 'demo@supplier.com',
  password: 'demo123',
  phone: '+1 713 555 0128',
  location: 'Houston, TX',
  approved: true,
};

const adminUser: StoredUser = {
  id: 'admin-1',
  role: 'admin',
  name: 'Avery Chen',
  company: 'BulkCart HQ',
  email: 'admin@bulkcart.com',
  password: 'admin123',
  phone: '+1 646 555 0184',
  location: 'New York, NY',
  approved: true,
};

export const MOCK_EXPERIENCE: ExperienceData = {
  topBarLinks: ['Sign In', 'Join Free', 'Admin Portal'],
  hero: {
    badge: 'B2B Wholesale Food Platform',
    heading: 'Wholesale food procurement, simplified.',
    description:
      'Connect directly with verified suppliers, compare prices, place bulk orders, and track deliveries with one live platform.',
    stats: [
      { label: 'Weekly GMV', value: '$2.4M' },
      { label: 'Verified buyers', value: '480+' },
      { label: 'Active suppliers', value: '38' },
      { label: 'On-time delivery rate', value: '94.2%' },
    ],
    points: [
      'Direct verified suppliers',
      'Smart MOQ and tier pricing',
      'PO-ready checkout and fast reorders',
    ],
  },
  categories: [
    { name: 'Grains', count: 72 },
    { name: 'Spices', count: 54 },
    { name: 'Oils', count: 41 },
    { name: 'Dry Goods', count: 63 },
    { name: 'Beverages', count: 58 },
    { name: 'Produce', count: 37 },
  ],
  highlights: [
    {
      title: 'For Customers',
      body: 'Browse bulk-ready inventory, compare suppliers, and reorder in one click.',
    },
    {
      title: 'For Vendors',
      body: 'Manage inventory, MOQ, tier pricing, and fulfillment from one dashboard.',
    },
    {
      title: 'For Admins',
      body: 'Approve vendors, monitor disputes, and track platform health and payouts.',
    },
  ],
  pricing: [
    { tier: 'Buyer', price: 'Free', copy: 'Browse, quote, order, and track.' },
    { tier: 'Growth Vendor', price: '$299/mo', copy: 'Advanced storefront and analytics.' },
    { tier: 'Enterprise', price: 'Custom', copy: 'Multi-warehouse workflows and SLAs.' },
  ],
  testimonials: [
    {
      quote: 'BulkCart cut our weekly sourcing time by half and made price comparisons painless.',
      author: 'Maya Joseph',
      role: 'Procurement Lead, City Bistro Group',
    },
    {
      quote: 'MOQ and tier pricing tools helped us convert more restaurant buyers in one quarter.',
      author: 'Daniel Ortega',
      role: 'Sales Director, Harbor Foods Supply',
    },
  ],
  faq: [
    {
      question: 'How are suppliers verified?',
      answer: 'Admins review tax, compliance, catalog quality, and fulfillment readiness before approval.',
    },
    {
      question: 'Can buyers reorder quickly?',
      answer: 'Yes. Recent orders can be reordered in one click from the dashboard and orders page.',
    },
    {
      question: 'Does BulkCart support tier pricing?',
      answer: 'Yes. Each product exposes MOQ and price breaks for larger quantities.',
    },
  ],
  demoCredentials: [
    { role: 'Customer', email: customerUser.email, password: customerUser.password },
    { role: 'Vendor', email: vendorUser.email, password: vendorUser.password },
    { role: 'Admin', email: adminUser.email, password: adminUser.password },
  ],
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Premium Basmati Rice',
    category: 'Grains',
    supplierId: vendorUser.id,
    supplierName: vendorUser.company,
    origin: 'India',
    unit: '25kg bag',
    price: 42,
    minOrderQuantity: 10,
    rating: 4.8,
    reviews: 281,
    leadTimeDays: 4,
    certifications: ['Organic', 'HACCP'],
    inventory: 420,
    sku: 'GRA-001',
    image:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80',
    description: 'Long-grain rice for restaurants and institutional buyers.',
    tierPricing: [
      { minQty: 10, price: 42 },
      { minQty: 50, price: 39 },
      { minQty: 100, price: 37 },
    ],
  },
  {
    id: 'prod-2',
    name: 'Cold-Pressed Sunflower Oil',
    category: 'Oils',
    supplierId: vendorUser.id,
    supplierName: vendorUser.company,
    origin: 'Turkey',
    unit: '20L tin',
    price: 58,
    minOrderQuantity: 6,
    rating: 4.7,
    reviews: 198,
    leadTimeDays: 6,
    certifications: ['Halal', 'HACCP'],
    inventory: 165,
    sku: 'OIL-002',
    image:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80',
    description: 'High-stability oil ideal for foodservice frying and prep.',
    tierPricing: [
      { minQty: 6, price: 58 },
      { minQty: 24, price: 54 },
      { minQty: 60, price: 51 },
    ],
  },
  {
    id: 'prod-3',
    name: 'Ground Turmeric',
    category: 'Spices',
    supplierId: vendorUser.id,
    supplierName: vendorUser.company,
    origin: 'Vietnam',
    unit: '5kg pouch',
    price: 18,
    minOrderQuantity: 20,
    rating: 4.9,
    reviews: 145,
    leadTimeDays: 3,
    certifications: ['Organic', 'Kosher'],
    inventory: 530,
    sku: 'SPI-014',
    image:
      'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=1200&q=80',
    description: 'Bright, export-grade turmeric for industrial kitchens.',
    tierPricing: [
      { minQty: 20, price: 18 },
      { minQty: 100, price: 16.5 },
      { minQty: 250, price: 15.75 },
    ],
  },
];

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-10021',
    customerId: customerUser.id,
    vendorId: vendorUser.id,
    customerName: customerUser.company,
    vendorName: vendorUser.company,
    status: 'In Transit',
    total: 1490,
    createdAt: '2026-03-24T10:30:00.000Z',
    eta: '2026-03-31T16:00:00.000Z',
    paymentStatus: 'Paid',
    items: [
      { productId: 'prod-1', name: 'Premium Basmati Rice', quantity: 20, unitPrice: 39, subtotal: 780 },
      { productId: 'prod-3', name: 'Ground Turmeric', quantity: 40, unitPrice: 17.75, subtotal: 710 },
    ],
  },
];

export const MOCK_USERS: StoredUser[] = [customerUser, vendorUser, adminUser];
const mockCartStore: Record<string, Record<string, number>> = {
  'cust-1': { 'prod-1': 20, 'prod-3': 40 },
};
const mockOtpStore = new Map<
  string,
  {
    email: string;
    purpose: string;
    code: string;
    expiresAt: string;
    verified: boolean;
    verificationToken?: string;
  }
>();
const mockPaymentStore = new Map<
  string,
  {
    id: string;
    userId: string;
    amount: number;
    status: 'authorized' | 'captured';
    cardLast4: string;
    cardBrand: string;
    paymentMethodLabel: string;
  }
>();

function asStoredUser(user: SessionUser, password: string): StoredUser {
  return {
    ...user,
    password,
  };
}

export function mockLogin(payload: { email: string; password: string; role: UserRole }) {
  const user = MOCK_USERS.find(
    (entry) =>
      entry.email.toLowerCase() === payload.email.toLowerCase() &&
      entry.password === payload.password &&
      entry.role === payload.role,
  );

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (user.role === 'vendor' && user.approved === false) {
    throw new Error('Vendor account is pending approval');
  }

  return authPayloadFor(user);
}

export function mockRequestOtp(payload: { email: string; purpose: string }) {
  const requestId = `local-otp-${Date.now()}`;
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString();

  mockOtpStore.set(requestId, {
    email: payload.email.toLowerCase(),
    purpose: payload.purpose,
    code,
    expiresAt,
    verified: false,
  });

  return {
    requestId,
    message: `OTP sent to ${payload.email}`,
    expiresAt,
    devOtp: code,
  };
}

export function mockVerifyOtp(payload: {
  requestId: string;
  email: string;
  purpose: string;
  code: string;
}) {
  const record = mockOtpStore.get(payload.requestId);
  if (!record) {
    throw new Error('OTP request not found');
  }

  if (record.email !== payload.email.toLowerCase() || record.purpose !== payload.purpose) {
    throw new Error('OTP request details do not match');
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    throw new Error('OTP expired. Request a new code.');
  }

  if (record.code !== payload.code) {
    throw new Error('Invalid OTP code');
  }

  record.verified = true;
  record.verificationToken = `local-otpvr-${Date.now()}`;
  mockOtpStore.set(payload.requestId, record);

  return {
    verificationToken: record.verificationToken,
    message: 'OTP verified successfully.',
  };
}

export function mockSignup(payload: {
  role: 'customer' | 'vendor';
  name: string;
  company: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  otpVerificationToken: string;
  businessDescription?: string;
}) {
  const exists = MOCK_USERS.find((entry) => entry.email.toLowerCase() === payload.email.toLowerCase());
  if (exists) {
    throw new Error('An account with this email already exists');
  }

  const otp = [...mockOtpStore.values()].find(
    (entry) => entry.email === payload.email.toLowerCase() && entry.purpose === 'signup',
  );

  if (!otp?.verified || otp.verificationToken !== payload.otpVerificationToken) {
    throw new Error('Complete OTP verification before signing up');
  }

  const user: SessionUser = {
    id: `${payload.role}-${Date.now()}`,
    role: payload.role,
    name: payload.name,
    company: payload.company,
    email: payload.email.toLowerCase(),
    phone: payload.phone,
    location: payload.location,
    approved: payload.role === 'vendor' ? false : true,
  };
  MOCK_USERS.push(asStoredUser(user, payload.password));
  if (!mockCartStore[user.id]) {
    mockCartStore[user.id] = {};
  }

  return authPayloadFor(
    asStoredUser(user, payload.password),
    payload.role === 'vendor'
      ? 'Vendor account created. Approval is pending admin review.'
      : 'Account created successfully.',
  );
}

export function authPayloadFor(user: StoredUser, message?: string): AuthResponse {
  return {
    token: `mock-token-${user.id}`,
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      company: user.company,
      email: user.email,
      phone: user.phone,
      location: user.location,
      approved: user.approved,
    },
    message,
  };
}

export function productResponse(filters?: {
  search?: string;
  category?: string;
  certifications?: string[];
  sort?: string;
}): ProductResponse {
  let items = [...MOCK_PRODUCTS];

  if (filters?.search) {
    const query = filters.search.toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.supplierName.toLowerCase().includes(query),
    );
  }

  if (filters?.category) {
    items = items.filter((item) => item.category === filters.category);
  }

  if (filters?.certifications?.length) {
    items = items.filter((item) =>
      filters.certifications?.every((certification) => item.certifications.includes(certification)),
    );
  }

  switch (filters?.sort) {
    case 'price-asc':
      items.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      items.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      items.sort((a, b) => b.rating - a.rating);
      break;
    case 'lead-time':
      items.sort((a, b) => a.leadTimeDays - b.leadTimeDays);
      break;
    default:
      items.sort((a, b) => b.rating - a.rating);
  }

  return {
    filters: {
      categories: [...new Set(MOCK_PRODUCTS.map((item) => item.category))],
      certifications: [...new Set(MOCK_PRODUCTS.flatMap((item) => item.certifications))],
    },
    items,
  };
}

export function cartResponse(cartItems: Record<string, number>): CartResponse {
  const items = Object.entries(cartItems)
    .map(([productId, quantity]) => {
      const product = MOCK_PRODUCTS.find((entry) => entry.id === productId);
      if (!product) {
        return null;
      }

      const unitPrice =
        [...product.tierPricing].sort((a, b) => b.minQty - a.minQty).find((tier) => quantity >= tier.minQty)
          ?.price ?? product.price;

      return {
        product,
        quantity,
        unitPrice,
        subtotal: Number((quantity * unitPrice).toFixed(2)),
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item);

  const subtotal = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const serviceFee = Number((subtotal * 0.025).toFixed(2));
  const shipping = subtotal ? 95 : 0;

  return {
    items,
    summary: {
      subtotal,
      serviceFee,
      shipping,
      total: Number((subtotal + serviceFee + shipping).toFixed(2)),
    },
  };
}

export function mockGetCart(userId: string) {
  if (!mockCartStore[userId]) {
    mockCartStore[userId] = {};
  }
  return cartResponse(mockCartStore[userId]);
}

export function mockAddCartItem(payload: { userId: string; productId: string; quantity: number }) {
  if (!mockCartStore[payload.userId]) {
    mockCartStore[payload.userId] = {};
  }

  const product = MOCK_PRODUCTS.find((entry) => entry.id === payload.productId);
  if (!product) {
    throw new Error('Product not found');
  }
  if (payload.quantity < product.minOrderQuantity) {
    throw new Error(`Quantity must be at least the minimum order quantity of ${product.minOrderQuantity}`);
  }

  mockCartStore[payload.userId][payload.productId] = payload.quantity;
  return cartResponse(mockCartStore[payload.userId]);
}

export function mockUpdateCartItem(payload: { userId: string; productId: string; quantity: number }) {
  return mockAddCartItem(payload);
}

export function mockRemoveCartItem(userId: string, productId: string) {
  if (!mockCartStore[userId]) {
    mockCartStore[userId] = {};
  }
  delete mockCartStore[userId][productId];
  return cartResponse(mockCartStore[userId]);
}

export function mockCreatePaymentIntent(payload: {
  userId: string;
  cardHolder: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  billingZip: string;
}) {
  const cart = mockGetCart(payload.userId);
  if (!cart.items.length) {
    throw new Error('Cart is empty');
  }
  const digits = payload.cardNumber.replace(/\D/g, '');
  if (digits.length < 4) {
    throw new Error('Enter a valid card number');
  }
  const cardLast4 = digits.slice(-4);
  const cardBrand = digits.startsWith('4') ? 'Visa' : /^5[1-5]/.test(digits) ? 'Mastercard' : 'Card';
  const paymentIntentId = `local-pay-${Date.now()}`;
  const paymentMethodLabel = `${cardBrand} ending in ${cardLast4}`;
  mockPaymentStore.set(paymentIntentId, {
    id: paymentIntentId,
    userId: payload.userId,
    amount: cart.summary.total,
    status: 'authorized',
    cardLast4,
    cardBrand,
    paymentMethodLabel,
  });

  return {
    paymentIntentId,
    amount: cart.summary.total,
    currency: 'USD',
    gateway: 'BulkCart Pay',
    status: 'authorized',
    cardLast4,
    cardBrand,
    paymentMethodLabel,
  };
}

export function mockCheckout(userId: string, paymentIntentId: string) {
  const cart = mockGetCart(userId);
  if (!cart.items.length) {
    throw new Error('Cart is empty');
  }

  const payment = mockPaymentStore.get(paymentIntentId);
  if (!payment || payment.userId !== userId || payment.status !== 'authorized') {
    throw new Error('Valid payment authorization is required');
  }

  const customer = MOCK_USERS.find((entry) => entry.id === userId);
  const vendor = MOCK_USERS.find((entry) => entry.role === 'vendor');
  if (!customer || !vendor) {
    throw new Error('Unable to create order');
  }

  const order: Order = {
    id: `ORD-${10000 + Math.floor(Math.random() * 90000)}`,
    customerId: customer.id,
    vendorId: vendor.id,
    customerName: customer.company,
    vendorName: vendor.company,
    status: 'Pending',
    total: cart.summary.total,
    createdAt: new Date().toISOString(),
    eta: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
    paymentStatus: 'Paid',
    paymentReference: payment.id,
    paymentMethod: payment.paymentMethodLabel,
    cardLast4: payment.cardLast4,
    items: cart.items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
  };

  MOCK_ORDERS.unshift(order);
  orderHistoryStore.set(order.id, [
    { status: 'Submitted', changedAt: order.createdAt, changedBy: order.customerName },
  ]);
  mockPaymentStore.set(paymentIntentId, { ...payment, status: 'captured' });
  mockCartStore[userId] = {};

  return {
    message: 'Order placed successfully',
    order,
    cart: cartResponse(mockCartStore[userId]),
  };
}

export function ordersResponse(role: UserRole, userId: string): OrdersResponse {
  const items =
    role === 'customer'
      ? MOCK_ORDERS.filter((order) => order.customerId === userId)
      : role === 'vendor'
        ? MOCK_ORDERS.filter((order) => order.vendorId === userId)
        : MOCK_ORDERS;

  return {
    items,
    summary: {
      totalOrders: items.length,
      totalRevenue: items.reduce((sum, item) => sum + item.total, 0),
      openOrders: items.filter((item) => item.status !== 'Delivered').length,
    },
  };
}

export function dashboardResponse(role: UserRole, userId: string): DashboardResponse {
  if (role === 'customer') {
    return {
      headline: 'Welcome back, Maya',
      stats: [
        { label: 'Monthly spend', value: '$18.4K' },
        { label: 'Open orders', value: '1' },
        { label: 'Favorite suppliers', value: '12' },
        { label: 'Reorder ready SKUs', value: '28' },
      ],
      charts: {
        spendByMonth: [
          { label: 'Jan', value: 10200 },
          { label: 'Feb', value: 12600 },
          { label: 'Mar', value: 18400 },
        ],
        categoryMix: [
          { label: 'Grains', value: 38 },
          { label: 'Oils', value: 24 },
          { label: 'Spices', value: 20 },
          { label: 'Produce', value: 18 },
        ],
      },
      quickActions: ['Reorder previous purchase', 'Review pending delivery', 'Compare supplier offers'],
      recentOrders: ordersResponse(role, userId).items,
    };
  }

  if (role === 'vendor') {
    return {
      headline: `${vendorUser.company} dashboard`,
      stats: [
        { label: 'Monthly revenue', value: '$82.6K' },
        { label: 'Active SKUs', value: `${MOCK_PRODUCTS.length}` },
        { label: 'Pending approvals', value: '3' },
        { label: 'Payout due', value: '$7.2K' },
      ],
      charts: {
        revenueTrend: [
          { label: 'Jan', value: 42000 },
          { label: 'Feb', value: 55800 },
          { label: 'Mar', value: 82600 },
        ],
      },
      productHealth: MOCK_PRODUCTS.map((product) => ({
        id: product.id,
        name: product.name,
        inventory: product.inventory,
        minOrderQuantity: product.minOrderQuantity,
        leadTimeDays: product.leadTimeDays,
      })),
      recentOrders: ordersResponse(role, userId).items,
    };
  }

  return {
    headline: 'BulkCart control center',
    stats: [
      { label: 'Platform GMV', value: '$2.4M' },
      { label: 'Pending vendor approvals', value: '7' },
      { label: 'Open disputes', value: '3' },
      { label: 'Take rate', value: '2.5%' },
    ],
    approvals: [
      {
        id: vendorUser.id,
        company: vendorUser.company,
        contact: vendorUser.name,
        approved: true,
        location: vendorUser.location,
      },
    ],
    disputes: [
      { id: 'DSP-101', reason: 'Damaged packaging', orderId: 'ORD-10021', status: 'Investigating' },
      { id: 'DSP-099', reason: 'Late delivery', orderId: 'ORD-10019', status: 'Awaiting vendor' },
    ],
    analytics: {
      ordersByStatus: [
        { label: 'Pending', value: 12 },
        { label: 'Approved', value: 8 },
        { label: 'In Transit', value: 5 },
        { label: 'Delivered', value: 19 },
      ],
    },
  };
}

export function mockApproveVendor(vendorId: string) {
  const vendor = MOCK_USERS.find((entry) => entry.id === vendorId && entry.role === 'vendor');
  if (!vendor) {
    throw new Error('Vendor not found');
  }
  vendor.approved = true;
  return {
    message: `${vendor.company} is now approved and can sign in.`,
    user: authPayloadFor(vendor).user,
  };
}

const orderHistoryStore = new Map<string, OrderHistoryResponse['history']>(
  MOCK_ORDERS.map((order) => [
    order.id,
    [
      { status: 'Submitted', changedAt: order.createdAt, changedBy: order.customerName },
      {
        status: 'Approved',
        changedAt: new Date(new Date(order.createdAt).getTime() + 1000 * 60 * 60 * 6).toISOString(),
        changedBy: order.vendorName,
      },
      {
        status: 'Shipped',
        changedAt: new Date(new Date(order.createdAt).getTime() + 1000 * 60 * 60 * 24).toISOString(),
        changedBy: `${order.vendorName} Warehouse`,
      },
      { status: 'Delivered', changedAt: order.eta, changedBy: 'Carrier POD' },
    ],
  ]),
);

let draftCounter = 1;
const draftStore = new Map<string, OrderDraft>();

const productPriceOverrides = new Map<string, ProductPricingPayload['customerOverrides']>();
const shipmentStore: ShipmentRecord[] = [];
let shipmentCounter = 1;

let subscriptionTiers: SubscriptionTierConfig[] = [
  {
    name: 'Starter',
    minVolume: 0,
    maxVolume: 10000,
    subscriptionFee: 199,
    commissionRate: 2.2,
  },
  {
    name: 'Growth',
    minVolume: 10001,
    maxVolume: 50000,
    subscriptionFee: 499,
    commissionRate: 1.8,
  },
  {
    name: 'Enterprise',
    minVolume: 50001,
    maxVolume: 10000000,
    subscriptionFee: 999,
    commissionRate: 1.4,
  },
];

export function orderHistoryResponse(orderId: string, role: UserRole, userId: string): OrderHistoryResponse {
  const order = MOCK_ORDERS.find((entry) => entry.id === orderId);

  if (!order) {
    throw new Error('Order not found');
  }

  const isAllowed =
    role === 'admin' ||
    (role === 'customer' && order.customerId === userId) ||
    (role === 'vendor' && order.vendorId === userId);

  if (!isAllowed) {
    throw new Error('You are not allowed to view this order history');
  }

  return {
    order,
    history: orderHistoryStore.get(order.id) ?? [],
  };
}

export function filteredOrdersResponse(role: UserRole, userId: string, filters: OrderFilter): OrdersResponse {
  let data = ordersResponse(role, userId).items;

  if (filters.supplier) {
    const supplier = filters.supplier.toLowerCase();
    data = data.filter((order) => order.vendorName.toLowerCase().includes(supplier));
  }

  if (filters.status) {
    data = data.filter((order) => order.status.toLowerCase() === filters.status?.toLowerCase());
  }

  if (filters.orderId) {
    const query = filters.orderId.toLowerCase();
    data = data.filter((order) => order.id.toLowerCase().includes(query));
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    if (!Number.isNaN(from)) {
      data = data.filter((order) => new Date(order.createdAt).getTime() >= from);
    }
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    if (!Number.isNaN(to)) {
      data = data.filter((order) => new Date(order.createdAt).getTime() <= to + 1000 * 60 * 60 * 24 - 1);
    }
  }

  return {
    items: data,
    summary: {
      totalOrders: data.length,
      totalRevenue: Number(data.reduce((sum, item) => sum + item.total, 0).toFixed(2)),
      openOrders: data.filter((item) => item.status !== 'Delivered').length,
    },
  };
}

export function saveOrderDraft(payload: OrderDraftPayload): OrderDraft {
  validateDraftPayload(payload);
  const id = `DRF-${String(draftCounter).padStart(5, '0')}`;
  draftCounter += 1;
  const lines = payload.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    unitPrice: Number(line.unitPrice.toFixed(2)),
    subtotal: Number((line.quantity * line.unitPrice).toFixed(2)),
  }));

  const draft: OrderDraft = {
    id,
    userId: payload.userId,
    supplier: payload.supplier,
    status: 'draft',
    updatedAt: new Date().toISOString(),
    lines,
    total: Number(lines.reduce((sum, line) => sum + line.subtotal, 0).toFixed(2)),
  };

  draftStore.set(id, draft);
  return draft;
}

export function updateOrderDraft(draftId: string, payload: OrderDraftPayload): OrderDraft {
  const existing = draftStore.get(draftId);

  if (!existing) {
    throw new Error('Draft not found');
  }

  validateDraftPayload(payload);
  const lines = payload.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    unitPrice: Number(line.unitPrice.toFixed(2)),
    subtotal: Number((line.quantity * line.unitPrice).toFixed(2)),
  }));

  const updated: OrderDraft = {
    ...existing,
    supplier: payload.supplier,
    lines,
    updatedAt: new Date().toISOString(),
    total: Number(lines.reduce((sum, line) => sum + line.subtotal, 0).toFixed(2)),
  };
  draftStore.set(draftId, updated);
  return updated;
}

export function getOrderDraft(draftId: string, userId: string): OrderDraft {
  const draft = draftStore.get(draftId);
  if (!draft || draft.userId !== userId) {
    throw new Error('Draft not found');
  }
  return draft;
}

export function submitOrderDraft(draftId: string, userId: string): Order {
  const draft = getOrderDraft(draftId, userId);
  if (!draft.lines.length) {
    throw new Error('Draft is empty');
  }

  const newOrder: Order = {
    id: `ORD-${10000 + Math.floor(Math.random() * 89999)}`,
    customerId: userId,
    vendorId: vendorUser.id,
    customerName: customerUser.company,
    vendorName: draft.supplier,
    status: 'Pending',
    total: draft.total,
    createdAt: new Date().toISOString(),
    eta: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
    paymentStatus: 'Pending',
    items: draft.lines.map((line) => ({
      productId: line.productId,
      name: MOCK_PRODUCTS.find((product) => product.id === line.productId)?.name ?? line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      subtotal: line.subtotal,
    })),
  };

  MOCK_ORDERS.unshift(newOrder);
  orderHistoryStore.set(newOrder.id, [
    { status: 'Submitted', changedAt: newOrder.createdAt, changedBy: customerUser.company, note: 'Created from draft' },
  ]);
  draftStore.set(draftId, {
    ...draft,
    status: 'submitted',
    updatedAt: new Date().toISOString(),
  });

  return newOrder;
}

export function bulkImportOrders(rows: BulkOrderRowInput[]): BulkOrderImportResponse {
  const lineResults: BulkOrderImportResponse['lineResults'] = rows.map((row, index) => {
    const product = MOCK_PRODUCTS.find((item) => item.sku.toLowerCase() === row.sku.toLowerCase());
    if (!product) {
      return {
        row: index + 1,
        sku: row.sku,
        quantity: row.quantity,
        valid: false,
        message: 'SKU not found',
        lineTotal: 0,
      };
    }

    if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
      return {
        row: index + 1,
        sku: row.sku,
        quantity: row.quantity,
        valid: false,
        message: 'Quantity must be greater than 0',
        lineTotal: 0,
      };
    }

    if (row.quantity < product.minOrderQuantity) {
      return {
        row: index + 1,
        sku: row.sku,
        quantity: row.quantity,
        valid: false,
        message: `Quantity must be at least MOQ ${product.minOrderQuantity}`,
        lineTotal: 0,
      };
    }

    const unitPrice =
      [...product.tierPricing].sort((a, b) => b.minQty - a.minQty).find((tier) => row.quantity >= tier.minQty)?.price ??
      product.price;
    const lineTotal = Number((row.quantity * unitPrice).toFixed(2));
    return {
      row: index + 1,
      sku: row.sku,
      quantity: row.quantity,
      valid: true,
      message: `Accepted (${product.name})`,
      lineTotal,
    };
  });

  const valid = lineResults.filter((entry) => entry.valid);
  return {
    validCount: valid.length,
    invalidCount: lineResults.length - valid.length,
    summaryTotal: Number(valid.reduce((sum, entry) => sum + entry.lineTotal, 0).toFixed(2)),
    lineResults,
  };
}

export function upsertProduct(payload: ProductManagementPayload): Product {
  if (!payload.name || !payload.sku || !payload.unit || payload.price <= 0) {
    throw new Error('Name, SKU, unit and price > 0 are required');
  }

  const duplicate = MOCK_PRODUCTS.find(
    (item) => item.sku.toLowerCase() === payload.sku.toLowerCase() && item.id !== payload.id,
  );

  if (duplicate) {
    throw new Error('Duplicate SKU is not allowed');
  }

  if (payload.id) {
    const existing = MOCK_PRODUCTS.find((item) => item.id === payload.id);
    if (!existing) {
      throw new Error('Product not found');
    }
    Object.assign(existing, {
      ...existing,
      ...payload,
      price: Number(payload.price.toFixed(2)),
    });
    return existing;
  }

  const created: Product = {
    id: `prod-${MOCK_PRODUCTS.length + 1}`,
    name: payload.name,
    category: payload.category,
    supplierId: payload.supplierId,
    supplierName: payload.supplierName,
    origin: payload.origin,
    unit: payload.unit,
    price: Number(payload.price.toFixed(2)),
    minOrderQuantity: payload.minOrderQuantity,
    rating: 4.5,
    reviews: 0,
    leadTimeDays: 5,
    certifications: [],
    inventory: payload.inventory,
    sku: payload.sku,
    image: payload.image,
    description: payload.description,
    tierPricing: [{ minQty: payload.minOrderQuantity, price: Number(payload.price.toFixed(2)) }],
  };
  MOCK_PRODUCTS.unshift(created);
  return created;
}

export function deleteProduct(productId: string) {
  const index = MOCK_PRODUCTS.findIndex((item) => item.id === productId);
  if (index < 0) {
    throw new Error('Product not found');
  }
  MOCK_PRODUCTS.splice(index, 1);
  productPriceOverrides.delete(productId);
  return { success: true };
}

export function updateProductPricing(payload: ProductPricingPayload): Product {
  if (payload.basePrice <= 0) {
    throw new Error('Base price must be greater than 0');
  }

  if (!payload.volumeTiers.length) {
    throw new Error('At least one volume tier is required');
  }

  const sorted = [...payload.volumeTiers].sort((a, b) => a.minQty - b.minQty);

  for (let index = 0; index < sorted.length; index += 1) {
    const tier = sorted[index];
    if (tier.price <= 0 || tier.minQty <= 0) {
      throw new Error('Tier quantity and price must be greater than 0');
    }
    if (index > 0 && tier.minQty <= sorted[index - 1].minQty) {
      throw new Error('Tier thresholds must not overlap');
    }
  }

  const product = MOCK_PRODUCTS.find((item) => item.id === payload.productId);
  if (!product) {
    throw new Error('Product not found');
  }

  product.price = Number(payload.basePrice.toFixed(2));
  product.tierPricing = sorted.map((tier) => ({
    minQty: tier.minQty,
    price: Number(tier.price.toFixed(2)),
  }));
  productPriceOverrides.set(product.id, payload.customerOverrides);
  return product;
}

export function createShipment(payload: ShipmentPayload): ShipmentRecord {
  if (!payload.carrier || !payload.warehouse || !payload.trackingNumber || payload.lineCount < 1) {
    throw new Error('Carrier, warehouse, tracking number and line count are required');
  }

  const shipment: ShipmentRecord = {
    id: `SHP-${String(shipmentCounter).padStart(4, '0')}`,
    orderId: payload.orderId,
    warehouse: payload.warehouse,
    carrier: payload.carrier.toUpperCase(),
    trackingNumber: payload.trackingNumber,
    createdAt: new Date().toISOString(),
    lineCount: payload.lineCount,
  };
  shipmentCounter += 1;
  shipmentStore.unshift(shipment);
  return shipment;
}

export function shipmentHistory() {
  return shipmentStore;
}

export function spendingReport(filters: {
  supplier?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
}): SpendingReportResponse {
  let source = [...MOCK_ORDERS];

  if (filters.fromDate) {
    source = source.filter((order) => new Date(order.createdAt).getTime() >= new Date(filters.fromDate ?? '').getTime());
  }
  if (filters.toDate) {
    source = source.filter((order) => new Date(order.createdAt).getTime() <= new Date(filters.toDate ?? '').getTime() + 86399999);
  }
  if (filters.supplier) {
    source = source.filter((order) => order.vendorName.toLowerCase().includes(filters.supplier?.toLowerCase() ?? ''));
  }

  const bySupplier = new Map<string, number>();
  const byCategory = new Map<string, number>();
  const byMonth = new Map<string, number>();

  source.forEach((order) => {
    bySupplier.set(order.vendorName, Number(((bySupplier.get(order.vendorName) ?? 0) + order.total).toFixed(2)));
    const month = new Date(order.createdAt).toLocaleString('en-US', { month: 'short' });
    byMonth.set(month, Number(((byMonth.get(month) ?? 0) + order.total).toFixed(2)));

    order.items.forEach((item) => {
      const product = MOCK_PRODUCTS.find((entry) => entry.id === item.productId);
      const category = product?.category ?? 'Uncategorized';
      if (!filters.category || category.toLowerCase() === filters.category.toLowerCase()) {
        byCategory.set(category, Number(((byCategory.get(category) ?? 0) + item.subtotal).toFixed(2)));
      }
    });
  });

  return {
    totals: {
      supplier: [...bySupplier.entries()].map(([label, value]) => ({ label, value })),
      category: [...byCategory.entries()].map(([label, value]) => ({ label, value })),
      monthly: [...byMonth.entries()].map(([label, value]) => ({ label, value })),
    },
    totalSpend: Number(source.reduce((sum, order) => sum + order.total, 0).toFixed(2)),
  };
}

export function reorderSuggestions(userId: string): ReorderSuggestion[] {
  const orders = MOCK_ORDERS.filter((entry) => entry.customerId === userId);
  const quantityByProduct = new Map<string, number[]>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = quantityByProduct.get(item.productId) ?? [];
      quantityByProduct.set(item.productId, [...existing, item.quantity]);
    });
  });

  return [...quantityByProduct.entries()].map(([productId, quantities]) => {
    const product = MOCK_PRODUCTS.find((entry) => entry.id === productId);
    const avg = quantities.reduce((sum, qty) => sum + qty, 0) / Math.max(quantities.length, 1);
    return {
      productId,
      productName: product?.name ?? productId,
      supplierName: product?.supplierName ?? vendorUser.company,
      suggestedQuantity: Math.max(Math.round(avg * 1.15), product?.minOrderQuantity ?? 1),
      confidence: Number(Math.min(0.99, 0.65 + quantities.length * 0.08).toFixed(2)),
    };
  });
}

export function upsertSubscriptionTiers(payload: SubscriptionTierConfig[]): SubscriptionTierConfig[] {
  if (!payload.length) {
    throw new Error('At least one tier is required');
  }

  const sorted = [...payload].sort((a, b) => a.minVolume - b.minVolume);
  sorted.forEach((tier, index) => {
    if (tier.subscriptionFee <= 0 || tier.commissionRate <= 0) {
      throw new Error('Rates must be greater than 0');
    }
    if (tier.maxVolume <= tier.minVolume) {
      throw new Error('Tier max volume must be greater than min volume');
    }
    if (index > 0 && tier.minVolume <= sorted[index - 1].maxVolume) {
      throw new Error('Tier ranges must not overlap');
    }
  });
  subscriptionTiers = sorted;
  return subscriptionTiers;
}

export function getSubscriptionTiers() {
  return subscriptionTiers;
}

export function commissionPreview(transactionVolume: number): CommissionPreviewResponse {
  const tier =
    subscriptionTiers.find((entry) => transactionVolume >= entry.minVolume && transactionVolume <= entry.maxVolume) ??
    subscriptionTiers[subscriptionTiers.length - 1];
  const commissionAmount = Number(((transactionVolume * tier.commissionRate) / 100).toFixed(2));
  return {
    transactionVolume,
    subscriptionFee: tier.subscriptionFee,
    commissionAmount,
    totalBillable: Number((tier.subscriptionFee + commissionAmount).toFixed(2)),
    appliedTier: tier.name,
  };
}

function validateDraftPayload(payload: OrderDraftPayload) {
  if (!payload.supplier.trim()) {
    throw new Error('Supplier is required');
  }

  if (!payload.lines.length) {
    throw new Error('At least one line item is required');
  }

  payload.lines.forEach((line, index) => {
    if (!line.productId) {
      throw new Error(`Line ${index + 1}: product is required`);
    }
    if (line.quantity <= 0) {
      throw new Error(`Line ${index + 1}: quantity must be greater than 0`);
    }
    if (line.unitPrice <= 0) {
      throw new Error(`Line ${index + 1}: unit price must be greater than 0`);
    }
  });
}
