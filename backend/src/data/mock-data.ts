export type UserRole = 'customer' | 'vendor' | 'admin';

export interface UserRecord {
  id: string;
  role: UserRole;
  name: string;
  company: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  approved?: boolean;
}

export interface ProductRecord {
  id: string;
  name: string;
  category: string;
  supplierId: string;
  supplierName: string;
  origin: string;
  unit: string;
  price: number;
  minOrderQuantity: number;
  rating: number;
  reviews: number;
  leadTimeDays: number;
  certifications: string[];
  inventory: number;
  sku: string;
  image: string;
  description: string;
  tierPricing: Array<{ minQty: number; price: number }>;
}

export interface CartItemRecord {
  productId: string;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  customerId: string;
  vendorId: string;
  customerName: string;
  vendorName: string;
  status: 'Pending' | 'Approved' | 'Packed' | 'In Transit' | 'Delivered';
  total: number;
  createdAt: string;
  eta: string;
  paymentStatus: 'Pending' | 'Paid';
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export const roles = ['customer', 'vendor', 'admin'] as const;
export const productCategories = [
  'Grains',
  'Spices',
  'Oils',
  'Dry Goods',
  'Beverages',
  'Produce',
] as const;
export const certifications = ['Organic', 'Halal', 'Kosher', 'Fair Trade', 'HACCP'] as const;

export const users: UserRecord[] = [
  {
    id: 'cust-1',
    role: 'customer',
    name: 'Maya Joseph',
    company: 'City Bistro Group',
    email: 'demo@restaurant.com',
    password: 'demo123',
    phone: '+1 212 555 0190',
    location: 'New York, NY',
  },
  {
    id: 'vendor-1',
    role: 'vendor',
    name: 'Daniel Ortega',
    company: 'Harbor Foods Supply',
    email: 'demo@supplier.com',
    password: 'demo123',
    phone: '+1 713 555 0128',
    location: 'Houston, TX',
    approved: true,
  },
  {
    id: 'admin-1',
    role: 'admin',
    name: 'Avery Chen',
    company: 'BulkCart HQ',
    email: 'admin@bulkcart.com',
    password: 'admin123',
    phone: '+1 646 555 0184',
    location: 'New York, NY',
  },
];

export const products: ProductRecord[] = [
  {
    id: 'prod-1',
    name: 'Premium Basmati Rice',
    category: 'Grains',
    supplierId: 'vendor-1',
    supplierName: 'Harbor Foods Supply',
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
    supplierId: 'vendor-1',
    supplierName: 'Harbor Foods Supply',
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
    supplierId: 'vendor-1',
    supplierName: 'Harbor Foods Supply',
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
  {
    id: 'prod-4',
    name: 'Sparkling Mineral Water',
    category: 'Beverages',
    supplierId: 'vendor-1',
    supplierName: 'Harbor Foods Supply',
    origin: 'Italy',
    unit: '24-pack',
    price: 21,
    minOrderQuantity: 15,
    rating: 4.6,
    reviews: 89,
    leadTimeDays: 5,
    certifications: ['Fair Trade'],
    inventory: 310,
    sku: 'BEV-122',
    image:
      'https://images.unsplash.com/photo-1564419434660-1c7b7964be31?auto=format&fit=crop&w=1200&q=80',
    description: 'Hospitality-grade bottled water for hotels and cafes.',
    tierPricing: [
      { minQty: 15, price: 21 },
      { minQty: 60, price: 19.5 },
      { minQty: 120, price: 18.25 },
    ],
  },
  {
    id: 'prod-5',
    name: 'Canned Chickpeas',
    category: 'Dry Goods',
    supplierId: 'vendor-1',
    supplierName: 'Harbor Foods Supply',
    origin: 'Spain',
    unit: '12-can case',
    price: 16,
    minOrderQuantity: 12,
    rating: 4.5,
    reviews: 71,
    leadTimeDays: 7,
    certifications: ['Kosher', 'HACCP'],
    inventory: 286,
    sku: 'DRY-230',
    image:
      'https://images.unsplash.com/photo-1515543904379-3d757afe72e0?auto=format&fit=crop&w=1200&q=80',
    description: 'Consistent canned legumes suitable for commissaries.',
    tierPricing: [
      { minQty: 12, price: 16 },
      { minQty: 48, price: 14.6 },
      { minQty: 100, price: 13.8 },
    ],
  },
  {
    id: 'prod-6',
    name: 'Fresh Roma Tomatoes',
    category: 'Produce',
    supplierId: 'vendor-1',
    supplierName: 'Harbor Foods Supply',
    origin: 'Mexico',
    unit: '10kg crate',
    price: 24,
    minOrderQuantity: 8,
    rating: 4.4,
    reviews: 53,
    leadTimeDays: 2,
    certifications: ['Organic'],
    inventory: 120,
    sku: 'PRO-018',
    image:
      'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=1200&q=80',
    description: 'Fresh produce replenished daily for fast-turn kitchens.',
    tierPricing: [
      { minQty: 8, price: 24 },
      { minQty: 40, price: 22.5 },
      { minQty: 80, price: 21.25 },
    ],
  },
];

export const carts: Record<string, CartItemRecord[]> = {
  'cust-1': [
    { productId: 'prod-1', quantity: 20 },
    { productId: 'prod-3', quantity: 40 },
  ],
};

export const orders: OrderRecord[] = [
  {
    id: 'ORD-10021',
    customerId: 'cust-1',
    vendorId: 'vendor-1',
    customerName: 'City Bistro Group',
    vendorName: 'Harbor Foods Supply',
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
  {
    id: 'ORD-10019',
    customerId: 'cust-1',
    vendorId: 'vendor-1',
    customerName: 'City Bistro Group',
    vendorName: 'Harbor Foods Supply',
    status: 'Delivered',
    total: 1296,
    createdAt: '2026-03-17T13:10:00.000Z',
    eta: '2026-03-21T15:00:00.000Z',
    paymentStatus: 'Paid',
    items: [
      { productId: 'prod-2', name: 'Cold-Pressed Sunflower Oil', quantity: 24, unitPrice: 54, subtotal: 1296 },
    ],
  },
];
