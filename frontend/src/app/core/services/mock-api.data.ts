import {
  AuthResponse,
  CartResponse,
  DashboardResponse,
  ExperienceData,
  Order,
  OrdersResponse,
  Product,
  ProductResponse,
  SessionUser,
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
