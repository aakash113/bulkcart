import { BadRequestException, Injectable, NotFoundException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { certifications, productCategories, type UserRole } from './data/mock-data';
import { Cart } from './schemas/cart.schema';
import { OtpCode } from './schemas/otp.schema';
import { OrderDraft } from './schemas/order-draft.schema';
import { Order } from './schemas/order.schema';
import { Payment } from './schemas/payment.schema';
import { Product } from './schemas/product.schema';
import { Shipment } from './schemas/shipment.schema';
import { User } from './schemas/user.schema';

interface ProductQuery {
  search?: string;
  category?: string;
  certifications?: string[];
  sort?: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'lead-time';
}

interface OrderFilterQuery {
  supplier?: string;
  status?: string;
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SubscriptionTier {
  name: string;
  minVolume: number;
  maxVolume: number;
  subscriptionFee: number;
  commissionRate: number;
}

@Injectable()
export class AppService implements OnModuleInit {
  private readonly orderHistoryStore = new Map<
    string,
    Array<{
      status: 'Submitted' | 'Approved' | 'Shipped' | 'Delivered';
      changedAt: string;
      changedBy: string;
      note?: string;
    }>
  >();
  private subscriptionTiers: SubscriptionTier[] = [
    { name: 'Starter', minVolume: 0, maxVolume: 10000, subscriptionFee: 199, commissionRate: 2.2 },
    { name: 'Growth', minVolume: 10001, maxVolume: 50000, subscriptionFee: 499, commissionRate: 1.8 },
    { name: 'Enterprise', minVolume: 50001, maxVolume: 10000000, subscriptionFee: 999, commissionRate: 1.4 },
  ];

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(OrderDraft.name) private readonly orderDraftModel: Model<OrderDraft>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    @InjectModel(Shipment.name) private readonly shipmentModel: Model<Shipment>,
    @InjectModel(OtpCode.name) private readonly otpCodeModel: Model<OtpCode>,
  ) {}

  async onModuleInit() {
    await this.seedIfNeeded();
  }

  getHealth() {
    return {
      ok: true,
      service: 'bulkcart-api',
      timestamp: new Date().toISOString(),
    };
  }

  getExperience() {
    return {
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
      categories: productCategories.map((category) => ({ name: category, count: 24 })),
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
        { role: 'Customer', email: 'demo@restaurant.com', password: 'demo123' },
        { role: 'Vendor', email: 'demo@supplier.com', password: 'demo123' },
        { role: 'Admin', email: 'admin@bulkcart.com', password: 'admin123' },
      ],
    };
  }

  async login(email: string, password: string, role: UserRole) {
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
      password,
      role,
    }).lean();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role === 'vendor' && user.approved === false) {
      throw new UnauthorizedException('Vendor account is pending approval');
    }

    return this.toAuthPayload(user);
  }

  async signup(payload: {
    role: Extract<UserRole, 'customer' | 'vendor'>;
    name: string;
    company: string;
    email: string;
    password: string;
    phone: string;
    location: string;
    otpVerificationToken: string;
    businessDescription?: string;
  }) {
    await this.consumeOtpVerification(payload.email, 'signup', payload.otpVerificationToken);

    const exists = await this.userModel.exists({ email: payload.email.toLowerCase() });

    if (exists) {
      throw new UnauthorizedException('An account with this email already exists');
    }

    const user = await this.userModel.create({
      id: `${payload.role}-${Date.now()}`,
      role: payload.role,
      name: payload.name,
      company: payload.company,
      email: payload.email.toLowerCase(),
      password: payload.password,
      phone: payload.phone,
      location: payload.location,
      approved: payload.role === 'vendor' ? false : true,
      businessDescription: payload.businessDescription,
    });

    await this.cartModel.create({ userId: user.id, items: [] });

    return {
      ...this.toAuthPayload(user.toObject()),
      message:
        payload.role === 'vendor'
          ? 'Vendor account created. Approval is pending admin review.'
          : 'Account created successfully.',
    };
  }

  async requestOtp(email: string, purpose: string) {
    const normalizedEmail = email.toLowerCase();
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const requestId = `otp-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString();

    await this.otpCodeModel.deleteMany({ email: normalizedEmail, purpose });

    await this.otpCodeModel.create({
      id: requestId,
      email: normalizedEmail,
      purpose,
      code,
      expiresAt,
      verified: false,
    });

    const emailDelivery = await this.sendOtpEmail(normalizedEmail, code, purpose, expiresAt);

    return {
      requestId,
      message: emailDelivery.sent
        ? `OTP sent to ${normalizedEmail}`
        : `Email delivery failed. Falling back to developer OTP for ${normalizedEmail}.`,
      expiresAt,
      devOtp: emailDelivery.sent ? undefined : code,
    };
  }

  async verifyOtp(requestId: string, email: string, purpose: string, code: string) {
    const normalizedEmail = email.toLowerCase();
    const otp = await this.otpCodeModel.findOne({
      id: requestId,
      email: normalizedEmail,
      purpose,
    });

    if (!otp) {
      throw new NotFoundException('OTP request not found');
    }

    if (new Date(otp.expiresAt).getTime() < Date.now()) {
      throw new UnauthorizedException('OTP expired. Request a new code.');
    }

    if (otp.code !== code) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    otp.verified = true;
    otp.verificationToken = `otpvr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await otp.save();

    return {
      verificationToken: otp.verificationToken,
      message: 'OTP verified successfully.',
    };
  }

  async getProducts(query: ProductQuery) {
    const mongoQuery: Record<string, unknown> = {};

    if (query.search) {
      mongoQuery.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { supplierName: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.category) {
      mongoQuery.category = query.category;
    }

    if (query.certifications?.length) {
      mongoQuery.certifications = { $all: query.certifications };
    }

    let items = await this.productModel.find(mongoQuery).lean();

    switch (query.sort) {
      case 'price-asc':
        items = items.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        items = items.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        items = items.sort((a, b) => b.rating - a.rating);
        break;
      case 'lead-time':
        items = items.sort((a, b) => a.leadTimeDays - b.leadTimeDays);
        break;
      default:
        items = items.sort((a, b) => b.rating - a.rating || a.price - b.price);
    }

    const categories = await this.productModel.distinct('category');
    const certificationList = await this.productModel.distinct('certifications');

    return {
      filters: {
        categories: categories.sort(),
        certifications: certificationList.sort(),
      },
      items: items.map((item) => this.cleanProduct(item)),
    };
  }

  async getCart(userId: string) {
    await this.ensureUser(userId);
    return this.buildCart(userId);
  }

  async addCartItem(userId: string, productId: string, quantity: number) {
    await this.ensureUser(userId, 'customer');
    const product = await this.findProduct(productId);

    if (quantity < product.minOrderQuantity) {
      throw new UnauthorizedException(
        `Quantity must be at least the minimum order quantity of ${product.minOrderQuantity}`,
      );
    }

    const cart = await this.ensureCart(userId);
    const existing = cart.items.find((item) => item.productId === productId);

    if (existing) {
      existing.quantity = quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    return this.buildCart(userId);
  }

  async updateCartItem(userId: string, productId: string, quantity: number) {
    await this.ensureUser(userId, 'customer');
    const product = await this.findProduct(productId);
    const cart = await this.ensureCart(userId);
    const item = cart.items.find((entry) => entry.productId === productId);

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity < product.minOrderQuantity) {
      throw new UnauthorizedException(
        `Quantity must be at least the minimum order quantity of ${product.minOrderQuantity}`,
      );
    }

    item.quantity = quantity;
    await cart.save();
    return this.buildCart(userId);
  }

  async removeCartItem(userId: string, productId: string) {
    await this.ensureUser(userId, 'customer');
    const cart = await this.ensureCart(userId);
    cart.items = cart.items.filter((item) => item.productId !== productId);
    await cart.save();
    return this.buildCart(userId);
  }

  async createPaymentIntent(payload: {
    userId: string;
    cardHolder: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    billingZip: string;
  }) {
    await this.ensureUser(payload.userId, 'customer');
    const cart = await this.buildCart(payload.userId);

    if (!cart.items.length) {
      throw new UnauthorizedException('Cart is empty');
    }

    const digits = payload.cardNumber.replace(/\D/g, '');
    const expiryMonth = Number(payload.expiryMonth);
    const normalizedYear =
      payload.expiryYear.length === 2 ? Number(`20${payload.expiryYear}`) : Number(payload.expiryYear);
    const billingZip = payload.billingZip.trim();

    if (!/^\d{13,19}$/.test(digits) || !this.passesLuhn(digits)) {
      throw new UnauthorizedException('Enter a valid card number');
    }

    if (!/^\d{3,4}$/.test(payload.cvv)) {
      throw new UnauthorizedException('Enter a valid CVV');
    }

    if (expiryMonth < 1 || expiryMonth > 12) {
      throw new UnauthorizedException('Enter a valid expiry month');
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (
      Number.isNaN(normalizedYear) ||
      normalizedYear < currentYear ||
      (normalizedYear === currentYear && expiryMonth < currentMonth)
    ) {
      throw new UnauthorizedException('Card has expired');
    }

    if (!/^[A-Za-z0-9 -]{3,12}$/.test(billingZip)) {
      throw new UnauthorizedException('Enter a valid billing ZIP/postal code');
    }

    const cardBrand = this.cardBrandFor(digits);
    const cardLast4 = digits.slice(-4);
    const paymentIntentId = `pay-${Date.now()}`;
    const gateway = 'BulkCart Pay';

    await this.paymentModel.create({
      id: paymentIntentId,
      userId: payload.userId,
      amount: cart.summary.total,
      currency: 'USD',
      status: 'authorized',
      gateway,
      cardLast4,
      cardBrand,
      paymentMethodLabel: `${cardBrand} ending in ${cardLast4}`,
    });

    return {
      paymentIntentId,
      amount: cart.summary.total,
      currency: 'USD',
      gateway,
      status: 'authorized',
      cardLast4,
      cardBrand,
      paymentMethodLabel: `${cardBrand} ending in ${cardLast4}`,
    };
  }

  async checkout(userId: string, paymentIntentId: string) {
    const customer = await this.ensureUser(userId, 'customer');
    const cart = await this.buildCart(userId);

    if (!cart.items.length) {
      throw new UnauthorizedException('Cart is empty');
    }

    const paymentIntent = await this.paymentModel.findOne({ id: paymentIntentId, userId });

    if (!paymentIntent || paymentIntent.status !== 'authorized') {
      throw new UnauthorizedException('Valid payment authorization is required');
    }

    if (Number(paymentIntent.amount.toFixed(2)) !== Number(cart.summary.total.toFixed(2))) {
      throw new UnauthorizedException('Payment amount does not match the latest cart total');
    }

    const vendor = await this.userModel.findOne({ role: 'vendor' }).lean();

    if (!vendor) {
      throw new NotFoundException('No vendor available');
    }

    const order = await this.orderModel.create({
      id: `ORD-${10000 + Math.floor(Math.random() * 90000)}`,
      customerId: customer.id,
      vendorId: vendor.id,
      customerName: customer.company,
      vendorName: vendor.company,
      status: 'Pending',
      total: cart.summary.total,
      createdAt: new Date().toISOString(),
      eta: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
      paymentStatus: 'Paid',
      paymentReference: paymentIntent.id,
      paymentMethod: paymentIntent.paymentMethodLabel,
      cardLast4: paymentIntent.cardLast4,
      items: cart.items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
    });

    const cartDoc = await this.ensureCart(userId);
    cartDoc.items = [];
    await cartDoc.save();
    paymentIntent.status = 'captured';
    await paymentIntent.save();

    return {
      message: 'Order placed successfully',
      order: this.cleanOrder(order.toObject()),
      cart: await this.buildCart(userId),
    };
  }

  async getOrders(role: UserRole, userId: string, filters?: OrderFilterQuery) {
    await this.ensureUser(userId, role);

    let items;
    if (role === 'customer') {
      items = await this.orderModel.find({ customerId: userId }).sort({ createdAt: -1 }).lean();
    } else if (role === 'vendor') {
      items = await this.orderModel.find({ vendorId: userId }).sort({ createdAt: -1 }).lean();
    } else {
      items = await this.orderModel.find().sort({ createdAt: -1 }).lean();
    }

    if (filters?.supplier) {
      const supplier = filters.supplier.toLowerCase();
      items = items.filter((order) => order.vendorName.toLowerCase().includes(supplier));
    }

    if (filters?.status) {
      const status = filters.status.toLowerCase();
      items = items.filter((order) => order.status.toLowerCase() === status);
    }

    if (filters?.orderId) {
      const orderId = filters.orderId.toLowerCase();
      items = items.filter((order) => order.id.toLowerCase().includes(orderId));
    }

    if (filters?.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      if (!Number.isNaN(from)) {
        items = items.filter((order) => new Date(order.createdAt).getTime() >= from);
      }
    }

    if (filters?.dateTo) {
      const to = new Date(filters.dateTo).getTime();
      if (!Number.isNaN(to)) {
        items = items.filter((order) => new Date(order.createdAt).getTime() <= to + 86399999);
      }
    }

    return {
      items: items.map((item) => this.cleanOrder(item)),
      summary: {
        totalOrders: items.length,
        totalRevenue: items.reduce((sum, order) => sum + order.total, 0),
        openOrders: items.filter((order) => order.status !== 'Delivered').length,
      },
    };
  }

  async getDashboard(role: UserRole, userId: string) {
    const user = await this.ensureUser(userId, role);

    if (role === 'customer') {
      const customerOrders = await this.orderModel.find({ customerId: userId }).lean();
      return {
        headline: `Welcome back, ${user.name.split(' ')[0]}`,
        stats: [
          { label: 'Monthly spend', value: '$18.4K' },
          { label: 'Open orders', value: `${customerOrders.filter((order) => order.status !== 'Delivered').length}` },
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
        quickActions: ['Reorder previous purchase', 'Review pending delivery', 'Compare new supplier offers'],
        recentOrders: customerOrders.slice(0, 3).map((order) => this.cleanOrder(order)),
      };
    }

    if (role === 'vendor') {
      const vendorOrders = await this.orderModel.find({ vendorId: userId }).lean();
      const catalog = await this.productModel.find({ supplierId: userId }).lean();
      return {
        headline: `${user.company} dashboard`,
        stats: [
          { label: 'Monthly revenue', value: '$82.6K' },
          { label: 'Active SKUs', value: `${catalog.length}` },
          { label: 'Pending approvals', value: `${vendorOrders.filter((order) => order.status === 'Pending').length}` },
          { label: 'Payout due', value: '$7.2K' },
        ],
        charts: {
          revenueTrend: [
            { label: 'Jan', value: 42000 },
            { label: 'Feb', value: 55800 },
            { label: 'Mar', value: 82600 },
          ],
        },
        productHealth: catalog.map((product) => ({
          id: product.id,
          name: product.name,
          inventory: product.inventory,
          minOrderQuantity: product.minOrderQuantity,
          leadTimeDays: product.leadTimeDays,
        })),
        recentOrders: vendorOrders.slice(0, 4).map((order) => this.cleanOrder(order)),
      };
    }

    const vendorApprovals = await this.userModel.find({ role: 'vendor' }).lean();
    return {
      headline: 'BulkCart control center',
      stats: [
        { label: 'Platform GMV', value: '$2.4M' },
        { label: 'Pending vendor approvals', value: `${vendorApprovals.filter((entry) => entry.approved === false).length}` },
        { label: 'Open disputes', value: '3' },
        { label: 'Take rate', value: '2.5%' },
      ],
      approvals: vendorApprovals.map((entry) => ({
        id: entry.id,
        company: entry.company,
        contact: entry.name,
        approved: entry.approved ?? false,
        location: entry.location,
        email: entry.email,
      })),
      disputes: [
        { id: 'DSP-101', reason: 'Damaged packaging', orderId: 'ORD-10021', status: 'Investigating' },
        { id: 'DSP-099', reason: 'Late delivery', orderId: 'ORD-10017', status: 'Awaiting vendor' },
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

  async approveVendor(adminId: string, vendorId: string) {
    await this.ensureUser(adminId, 'admin');

    const vendor = await this.userModel.findOne({ id: vendorId, role: 'vendor' });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    vendor.approved = true;
    await vendor.save();

    return {
      message: `${vendor.company} is now approved and can sign in.`,
      user: this.toAuthPayload(vendor.toObject()).user,
    };
  }

  async declineVendor(adminId: string, vendorId: string) {
    await this.ensureUser(adminId, 'admin');

    const vendor = await this.userModel.findOne({ id: vendorId, role: 'vendor' });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.approved) {
      throw new BadRequestException('Approved vendors cannot be declined from onboarding.');
    }

    await this.userModel.deleteOne({ _id: vendor._id });
    await this.cartModel.deleteMany({ userId: vendor.id });

    return {
      message: `${vendor.company} has been declined and removed from pending vendors.`,
      vendorId: vendor.id,
    };
  }

  async getOrderHistory(orderId: string, role: UserRole, userId: string) {
    const order = await this.orderModel.findOne({ id: orderId }).lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isAllowed =
      role === 'admin' ||
      (role === 'customer' && order.customerId === userId) ||
      (role === 'vendor' && order.vendorId === userId);

    if (!isAllowed) {
      throw new UnauthorizedException('You are not allowed to view this order history');
    }

    const history = this.getOrCreateOrderHistory(order);
    return { order: this.cleanOrder(order), history };
  }

  async createOrderDraft(payload: {
    userId: string;
    supplier: string;
    lines: Array<{ productId: string; quantity: number; unitPrice: number }>;
  }) {
    await this.ensureUser(payload.userId, 'customer');
    this.validateDraftLines(payload.lines);

    const id = `DRF-${Date.now()}`;
    const lines = payload.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice.toFixed(2)),
      subtotal: Number((line.quantity * line.unitPrice).toFixed(2)),
    }));

    const draft = await this.orderDraftModel.create({
      id,
      userId: payload.userId,
      supplier: payload.supplier,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      lines,
      total: Number(lines.reduce((sum, line) => sum + line.subtotal, 0).toFixed(2)),
    });

    return this.cleanDocument(draft.toObject());
  }

  async updateOrderDraft(
    draftId: string,
    payload: {
      userId: string;
      supplier: string;
      lines: Array<{ productId: string; quantity: number; unitPrice: number }>;
    },
  ) {
    await this.ensureUser(payload.userId, 'customer');
    this.validateDraftLines(payload.lines);

    const draft = await this.orderDraftModel.findOne({ id: draftId, userId: payload.userId });
    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    draft.supplier = payload.supplier;
    draft.lines = payload.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice.toFixed(2)),
      subtotal: Number((line.quantity * line.unitPrice).toFixed(2)),
    }));
    draft.total = Number(draft.lines.reduce((sum, line) => sum + line.subtotal, 0).toFixed(2));
    draft.updatedAt = new Date().toISOString();
    await draft.save();

    return this.cleanDocument(draft.toObject());
  }

  async getOrderDraft(draftId: string, userId: string) {
    await this.ensureUser(userId, 'customer');
    const draft = await this.orderDraftModel.findOne({ id: draftId, userId }).lean();
    if (!draft) {
      throw new NotFoundException('Draft not found');
    }
    return this.cleanDocument(draft);
  }

  async submitOrderDraft(draftId: string, userId: string) {
    const customer = await this.ensureUser(userId, 'customer');
    const draft = await this.orderDraftModel.findOne({ id: draftId, userId });
    if (!draft) {
      throw new NotFoundException('Draft not found');
    }
    if (!draft.lines.length) {
      throw new BadRequestException('Draft is empty');
    }

    const vendor = await this.userModel.findOne({ role: 'vendor', company: draft.supplier }).lean();
    if (!vendor) {
      throw new NotFoundException('Supplier not found');
    }

    const createdAt = new Date().toISOString();
    const order = await this.orderModel.create({
      id: `ORD-${10000 + Math.floor(Math.random() * 90000)}`,
      customerId: customer.id,
      vendorId: vendor.id,
      customerName: customer.company,
      vendorName: draft.supplier,
      status: 'Pending',
      total: draft.total,
      createdAt,
      eta: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
      paymentStatus: 'Pending',
      items: draft.lines.map((line) => ({
        productId: line.productId,
        name: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        subtotal: line.subtotal,
      })),
    });

    draft.status = 'submitted';
    draft.updatedAt = new Date().toISOString();
    await draft.save();

    this.orderHistoryStore.set(order.id, [
      {
        status: 'Submitted',
        changedAt: createdAt,
        changedBy: customer.company,
        note: 'Created from draft',
      },
    ]);

    return { message: 'Draft submitted successfully', order: this.cleanOrder(order.toObject()) };
  }

  async bulkImportOrders(rows: Array<{ sku: string; quantity: number }>) {
    if (!rows.length) {
      throw new BadRequestException('At least one row is required');
    }

    const products = await this.productModel.find().lean();
    const lineResults = rows.map((row, index) => {
      const product = products.find((entry) => entry.sku.toLowerCase() === row.sku.toLowerCase());

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

      const unitPrice = [...product.tierPricing]
        .sort((a, b) => b.minQty - a.minQty)
        .find((tier) => row.quantity >= tier.minQty)?.price;
      const lineTotal = Number((row.quantity * (unitPrice ?? product.price)).toFixed(2));

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

  async upsertProduct(payload: {
    id?: string;
    supplierId: string;
    supplierName: string;
    name: string;
    sku: string;
    category: string;
    unit: string;
    origin: string;
    description: string;
    image: string;
    inventory: number;
    minOrderQuantity: number;
    price: number;
  }) {
    if (!payload.name || !payload.sku || !payload.unit || payload.price <= 0) {
      throw new BadRequestException('name, sku, unit and price > 0 are required');
    }

    const duplicate = await this.productModel.findOne({
      sku: payload.sku,
      id: { $ne: payload.id },
    });

    if (duplicate) {
      throw new BadRequestException('Duplicate SKU is not allowed');
    }

    if (payload.id) {
      const updated = await this.productModel.findOneAndUpdate(
        { id: payload.id },
        {
          ...payload,
          price: Number(payload.price.toFixed(2)),
        },
        { new: true },
      );

      if (!updated) {
        throw new NotFoundException('Product not found');
      }

      return { item: this.cleanProduct(updated.toObject()) };
    }

    const created = await this.productModel.create({
      id: `prod-${Date.now()}`,
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
    });

    return { item: this.cleanProduct(created.toObject()) };
  }

  async deleteManagedProduct(productId: string) {
    const deleted = await this.productModel.findOneAndDelete({ id: productId });
    if (!deleted) {
      throw new NotFoundException('Product not found');
    }
    return { success: true };
  }

  async updateProductPricing(payload: {
    productId: string;
    basePrice: number;
    volumeTiers: Array<{ minQty: number; price: number }>;
    customerOverrides: Array<{ customerId: string; price: number }>;
  }) {
    if (payload.basePrice <= 0) {
      throw new BadRequestException('Base price must be greater than 0');
    }

    if (!payload.volumeTiers.length) {
      throw new BadRequestException('At least one volume tier is required');
    }

    const sorted = [...payload.volumeTiers].sort((a, b) => a.minQty - b.minQty);
    sorted.forEach((tier, index) => {
      if (tier.minQty <= 0 || tier.price <= 0) {
        throw new BadRequestException('Tier quantity and price must be greater than 0');
      }
      if (index > 0 && tier.minQty <= sorted[index - 1].minQty) {
        throw new BadRequestException('Tier thresholds must not overlap');
      }
    });

    payload.customerOverrides.forEach((override) => {
      if (override.price <= 0) {
        throw new BadRequestException('Override price must be greater than 0');
      }
    });

    const product = await this.productModel.findOne({ id: payload.productId });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.price = Number(payload.basePrice.toFixed(2));
    product.tierPricing = sorted.map((entry) => ({
      minQty: entry.minQty,
      price: Number(entry.price.toFixed(2)),
    }));
    await product.save();

    return { item: this.cleanProduct(product.toObject()) };
  }

  async createShipment(payload: {
    orderId: string;
    warehouse: string;
    carrier: string;
    trackingNumber: string;
    lineCount: number;
  }) {
    const allowedCarriers = ['UPS', 'FEDEX', 'DHL', 'USPS'];
    if (!allowedCarriers.includes(payload.carrier.toUpperCase())) {
      throw new BadRequestException(`carrier must be one of: ${allowedCarriers.join(', ')}`);
    }
    if (payload.lineCount < 1) {
      throw new BadRequestException('lineCount must be at least 1');
    }

    const order = await this.orderModel.findOne({ id: payload.orderId }).lean();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (payload.lineCount > order.items.length) {
      throw new BadRequestException('lineCount cannot exceed available order lines');
    }

    const shipment = await this.shipmentModel.create({
      id: `SHP-${Date.now()}`,
      orderId: payload.orderId,
      warehouse: payload.warehouse,
      carrier: payload.carrier.toUpperCase(),
      trackingNumber: payload.trackingNumber,
      createdAt: new Date().toISOString(),
      lineCount: payload.lineCount,
    });

    this.orderHistoryStore.set(order.id, [
      ...this.getOrCreateOrderHistory(order),
      {
        status: 'Shipped',
        changedAt: shipment.createdAt,
        changedBy: `${payload.carrier.toUpperCase()} carrier integration`,
        note: `Tracking ${payload.trackingNumber}`,
      },
    ]);

    return this.cleanDocument(shipment.toObject());
  }

  async getShipments() {
    const shipments = await this.shipmentModel.find().sort({ createdAt: -1 }).lean();
    return shipments.map((item) => this.cleanDocument(item));
  }

  async getSpendingReport(filters: {
    supplier?: string;
    category?: string;
    fromDate?: string;
    toDate?: string;
    role?: UserRole;
    userId?: string;
  }) {
    let orders = await this.orderModel.find().lean();

    if (filters.role === 'customer' && filters.userId) {
      orders = orders.filter((order) => order.customerId === filters.userId);
    }

    if (filters.supplier) {
      const supplier = filters.supplier.toLowerCase();
      orders = orders.filter((order) => order.vendorName.toLowerCase().includes(supplier));
    }

    if (filters.fromDate) {
      const from = new Date(filters.fromDate).getTime();
      if (!Number.isNaN(from)) {
        orders = orders.filter((order) => new Date(order.createdAt).getTime() >= from);
      }
    }

    if (filters.toDate) {
      const to = new Date(filters.toDate).getTime();
      if (!Number.isNaN(to)) {
        orders = orders.filter((order) => new Date(order.createdAt).getTime() <= to + 86399999);
      }
    }

    const bySupplier = new Map<string, number>();
    const byCategory = new Map<string, number>();
    const byMonth = new Map<string, number>();

    orders.forEach((order) => {
      bySupplier.set(order.vendorName, Number(((bySupplier.get(order.vendorName) ?? 0) + order.total).toFixed(2)));
      const month = new Date(order.createdAt).toLocaleString('en-US', { month: 'short' });
      byMonth.set(month, Number(((byMonth.get(month) ?? 0) + order.total).toFixed(2)));
    });

    const products = await this.productModel.find().lean();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((entry) => entry.id === item.productId);
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
      totalSpend: Number(orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)),
    };
  }

  async getReorderSuggestions(userId: string) {
    await this.ensureUser(userId, 'customer');
    const orders = await this.orderModel.find({ customerId: userId }).lean();
    const products = await this.productModel.find().lean();
    const quantityByProduct = new Map<string, number[]>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = quantityByProduct.get(item.productId) ?? [];
        quantityByProduct.set(item.productId, [...existing, item.quantity]);
      });
    });

    return [...quantityByProduct.entries()].map(([productId, quantities]) => {
      const product = products.find((entry) => entry.id === productId);
      const avg = quantities.reduce((sum, qty) => sum + qty, 0) / Math.max(1, quantities.length);
      return {
        productId,
        productName: product?.name ?? productId,
        supplierName: product?.supplierName ?? 'Unknown supplier',
        suggestedQuantity: Math.max(Math.round(avg * 1.15), product?.minOrderQuantity ?? 1),
        confidence: Number(Math.min(0.99, 0.65 + quantities.length * 0.08).toFixed(2)),
      };
    });
  }

  getSubscriptionTiers() {
    return this.subscriptionTiers;
  }

  upsertSubscriptionTiers(tiers: SubscriptionTier[]) {
    if (!tiers.length) {
      throw new BadRequestException('At least one tier is required');
    }

    const sorted = [...tiers].sort((a, b) => a.minVolume - b.minVolume);
    sorted.forEach((tier, index) => {
      if (!tier.name.trim()) {
        throw new BadRequestException('Tier name is required');
      }
      if (tier.subscriptionFee <= 0 || tier.commissionRate <= 0) {
        throw new BadRequestException('Tier rates must be greater than 0');
      }
      if (tier.maxVolume <= tier.minVolume) {
        throw new BadRequestException('Tier maxVolume must be greater than minVolume');
      }
      if (index > 0 && tier.minVolume <= sorted[index - 1].maxVolume) {
        throw new BadRequestException('Tier ranges must not overlap');
      }
    });

    this.subscriptionTiers = sorted;
    return this.subscriptionTiers;
  }

  previewCommission(transactionVolume: number) {
    if (!Number.isFinite(transactionVolume) || transactionVolume <= 0) {
      throw new BadRequestException('transactionVolume must be greater than 0');
    }

    const tier =
      this.subscriptionTiers.find(
        (entry) => transactionVolume >= entry.minVolume && transactionVolume <= entry.maxVolume,
      ) ?? this.subscriptionTiers[this.subscriptionTiers.length - 1];
    const commissionAmount = Number(((transactionVolume * tier.commissionRate) / 100).toFixed(2));

    return {
      transactionVolume,
      subscriptionFee: tier.subscriptionFee,
      commissionAmount,
      totalBillable: Number((tier.subscriptionFee + commissionAmount).toFixed(2)),
      appliedTier: tier.name,
    };
  }

  private validateDraftLines(lines: Array<{ productId: string; quantity: number; unitPrice: number }>) {
    if (!lines.length) {
      throw new BadRequestException('At least one draft line is required');
    }

    lines.forEach((line, index) => {
      if (!line.productId?.trim()) {
        throw new BadRequestException(`Line ${index + 1}: productId is required`);
      }
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        throw new BadRequestException(`Line ${index + 1}: quantity must be a positive integer`);
      }
      if (!Number.isFinite(line.unitPrice) || line.unitPrice <= 0) {
        throw new BadRequestException(`Line ${index + 1}: unitPrice must be greater than 0`);
      }
    });
  }

  private getOrCreateOrderHistory(order: any) {
    const existing = this.orderHistoryStore.get(order.id);
    if (existing) {
      return existing;
    }

    const createdAt = new Date(order.createdAt).toISOString();
    const approvedAt = new Date(new Date(order.createdAt).getTime() + 1000 * 60 * 60 * 6).toISOString();
    const shippedAt = new Date(new Date(order.createdAt).getTime() + 1000 * 60 * 60 * 24).toISOString();
    const fallback = [
      { status: 'Submitted' as const, changedAt: createdAt, changedBy: order.customerName },
      { status: 'Approved' as const, changedAt: approvedAt, changedBy: order.vendorName },
      { status: 'Shipped' as const, changedAt: shippedAt, changedBy: `${order.vendorName} Warehouse` },
      { status: 'Delivered' as const, changedAt: order.eta, changedBy: 'Carrier POD' },
    ];
    this.orderHistoryStore.set(order.id, fallback);
    return fallback;
  }

  private cleanDocument(doc: any) {
    const { _id, __v, createdAt, updatedAt, ...rest } = doc;
    return rest;
  }

  private toAuthPayload(user: Pick<User, 'id' | 'role' | 'name' | 'company' | 'email' | 'phone' | 'location' | 'approved'>) {
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
        approved: user.approved ?? true,
      },
    };
  }

  private async ensureUser(userId: string, role?: UserRole) {
    const user = await this.userModel.findOne({ id: userId }).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (role && user.role !== role) {
      throw new UnauthorizedException('User role does not match request');
    }
    return user;
  }

  private async consumeOtpVerification(email: string, purpose: string, verificationToken: string) {
    const otp = await this.otpCodeModel.findOne({
      email: email.toLowerCase(),
      purpose,
      verificationToken,
      verified: true,
    });

    if (!otp) {
      throw new UnauthorizedException('Complete OTP verification before signing up');
    }

    if (new Date(otp.expiresAt).getTime() < Date.now()) {
      throw new UnauthorizedException('OTP verification expired. Request a new code.');
    }

    await this.otpCodeModel.deleteOne({ _id: otp._id });
  }

  private async findProduct(productId: string) {
    const product = await this.productModel.findOne({ id: productId }).lean();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private tierPriceFor(product: Product, quantity: number) {
    return [...product.tierPricing]
      .sort((a, b) => b.minQty - a.minQty)
      .find((tier) => quantity >= tier.minQty)?.price ?? product.price;
  }

  private passesLuhn(cardNumber: string) {
    let shouldDouble = false;
    let sum = 0;

    for (let index = cardNumber.length - 1; index >= 0; index -= 1) {
      let digit = Number(cardNumber[index]);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  private cardBrandFor(cardNumber: string) {
    if (cardNumber.startsWith('4')) {
      return 'Visa';
    }

    if (/^5[1-5]/.test(cardNumber)) {
      return 'Mastercard';
    }

    if (/^3[47]/.test(cardNumber)) {
      return 'Amex';
    }

    return 'Card';
  }

  private async sendOtpEmail(email: string, code: string, purpose: string, expiresAt: string) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM || user;

    if (!host || !user || !pass) {
      return { sent: false };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from,
        to: email,
        subject: `BulkCart OTP for ${purpose}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0b1f3f;">
            <h2>BulkCart verification code</h2>
            <p>Your OTP is:</p>
            <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
            <p>This code expires at ${new Date(expiresAt).toLocaleString('en-US')}.</p>
            <p>If you did not request this code, you can ignore this email.</p>
          </div>
        `,
      });

      return { sent: true };
    } catch (error) {
      console.error('OTP email delivery failed:', error);
      return { sent: false };
    }
  }

  private async buildCart(userId: string) {
    const cart = await this.ensureCart(userId);
    const items = await Promise.all(
      cart.items.map(async (item) => {
        const product = await this.findProduct(item.productId);
        const unitPrice = this.tierPriceFor(product, item.quantity);
        const subtotal = Number((unitPrice * item.quantity).toFixed(2));
        return {
          product: this.cleanProduct(product),
          quantity: item.quantity,
          unitPrice,
          subtotal,
        };
      }),
    );

    const subtotal = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    const serviceFee = Number((subtotal * 0.025).toFixed(2));
    const shipping = subtotal > 0 ? 95 : 0;

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

  private async ensureCart(userId: string) {
    const carts = await this.cartModel.find({ userId }).sort({ updatedAt: -1, createdAt: -1 });

    if (!carts.length) {
      return this.cartModel.create({ userId, items: [] });
    }

    const primary = carts[0];

    if (carts.length > 1) {
      const merged = new Map<string, number>();

      carts.forEach((cart) => {
        cart.items.forEach((item) => {
          const existing = merged.get(item.productId) ?? 0;
          merged.set(item.productId, Math.max(existing, item.quantity));
        });
      });

      primary.items = Array.from(merged.entries()).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));
      await primary.save();
      await this.cartModel.deleteMany({
        _id: { $in: carts.slice(1).map((cart) => cart._id) },
      });
    }

    return primary;
  }

  private async seedIfNeeded() {
    const userCount = await this.userModel.estimatedDocumentCount();
    if (userCount > 0) {
      return;
    }

    await this.userModel.insertMany([
      {
        id: 'cust-1',
        role: 'customer',
        name: 'Maya Joseph',
        company: 'City Bistro Group',
        email: 'demo@restaurant.com',
        password: 'demo123',
        phone: '+1 212 555 0190',
        location: 'New York, NY',
        approved: true,
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
        approved: true,
      },
    ]);

    await this.productModel.insertMany([
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
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80',
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
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80',
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
        image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=1200&q=80',
        description: 'Bright, export-grade turmeric for industrial kitchens.',
        tierPricing: [
          { minQty: 20, price: 18 },
          { minQty: 100, price: 16.5 },
          { minQty: 250, price: 15.75 },
        ],
      },
    ]);

    await this.cartModel.create({
      userId: 'cust-1',
      items: [
        { productId: 'prod-1', quantity: 20 },
        { productId: 'prod-3', quantity: 40 },
      ],
    });

    await this.orderModel.create({
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
    });
  }

  private cleanProduct(product: any) {
    const { _id, __v, createdAt, updatedAt, ...rest } = product;
    return rest;
  }

  private cleanOrder(order: any) {
    const { _id, __v, updatedAt, ...rest } = order;
    return rest;
  }
}
