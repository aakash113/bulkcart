export type UserRole = 'customer' | 'vendor' | 'admin';
export type AuthMode = 'login' | 'signup';

export interface SessionUser {
  id: string;
  role: UserRole;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  approved: boolean;
}

export interface AuthResponse {
  token: string;
  user: SessionUser;
  message?: string;
}

export interface OtpRequestResponse {
  requestId: string;
  message: string;
  expiresAt: string;
  devOtp?: string;
}

export interface OtpVerifyResponse {
  verificationToken: string;
  message: string;
}

export interface ExperienceData {
  topBarLinks: string[];
  hero: {
    badge: string;
    heading: string;
    description: string;
    stats: Array<{ label: string; value: string }>;
    points: string[];
  };
  categories: Array<{ name: string; count: number }>;
  highlights: Array<{ title: string; body: string }>;
  pricing: Array<{ tier: string; price: string; copy: string }>;
  testimonials: Array<{ quote: string; author: string; role: string }>;
  faq: Array<{ question: string; answer: string }>;
  demoCredentials: Array<{ role: string; email: string; password: string }>;
}

export interface Product {
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

export interface ProductResponse {
  filters: {
    categories: string[];
    certifications: string[];
  };
  items: Product[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CartResponse {
  items: CartItem[];
  summary: {
    subtotal: number;
    serviceFee: number;
    shipping: number;
    total: number;
  };
}

export interface Order {
  id: string;
  customerId: string;
  vendorId: string;
  customerName: string;
  vendorName: string;
  status: string;
  total: number;
  createdAt: string;
  eta: string;
  paymentStatus: string;
  paymentReference?: string;
  paymentMethod?: string;
  cardLast4?: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export interface OrdersResponse {
  items: Order[];
  summary: {
    totalOrders: number;
    totalRevenue: number;
    openOrders: number;
  };
}

export interface DashboardResponse {
  headline: string;
  stats: Array<{ label: string; value: string }>;
  charts?: Record<string, Array<{ label: string; value: number }>>;
  recentOrders?: Order[];
  quickActions?: string[];
  productHealth?: Array<{
    id: string;
    name: string;
    inventory: number;
    minOrderQuantity: number;
    leadTimeDays: number;
  }>;
  approvals?: Array<{
    id: string;
    company: string;
    contact: string;
    approved: boolean;
    location: string;
    email?: string;
  }>;
  disputes?: Array<{
    id: string;
    reason: string;
    orderId: string;
    status: string;
  }>;
  analytics?: Record<string, Array<{ label: string; value: number }>>;
}

export interface PaymentIntentResponse {
  paymentIntentId: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  cardLast4: string;
  cardBrand: string;
  paymentMethodLabel: string;
}
