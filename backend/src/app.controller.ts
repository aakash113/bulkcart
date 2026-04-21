import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { asRecord, email, enumValue, positiveInt, requiredString, stringArray } from './common/validation';
import { certifications, productCategories, roles, type UserRole } from './data/mock-data';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('experience')
  getExperience() {
    return this.appService.getExperience();
  }

  @Post('auth/login')
  login(@Body() body: unknown) {
    const input = asRecord(body);
    return this.appService.login(
      email(input, 'email'),
      requiredString(input, 'password', { min: 6, max: 80 }),
      enumValue(input, 'role', roles),
    );
  }

  @Post('auth/signup')
  signup(@Body() body: unknown) {
    const input = asRecord(body);

    return this.appService.signup({
      role: enumValue(input, 'role', ['customer', 'vendor']),
      name: requiredString(input, 'name', { min: 2, max: 80 }),
      company: requiredString(input, 'company', { min: 2, max: 120 }),
      email: email(input, 'email'),
      password: requiredString(input, 'password', { min: 8, max: 80 }),
      phone: requiredString(input, 'phone', { min: 7, max: 30 }),
      location: requiredString(input, 'location', { min: 2, max: 120 }),
      otpVerificationToken: requiredString(input, 'otpVerificationToken', { min: 24, max: 120 }),
      businessDescription: input.businessDescription
        ? requiredString(input, 'businessDescription', { min: 10, max: 240 })
        : undefined,
    });
  }

  @Post('auth/request-otp')
  requestOtp(@Body() body: unknown) {
    const input = asRecord(body);
    return this.appService.requestOtp(
      email(input, 'email'),
      requiredString(input, 'purpose', { min: 4, max: 40 }),
    );
  }

  @Post('auth/verify-otp')
  verifyOtp(@Body() body: unknown) {
    const input = asRecord(body);
    return this.appService.verifyOtp(
      requiredString(input, 'requestId'),
      email(input, 'email'),
      requiredString(input, 'purpose', { min: 4, max: 40 }),
      requiredString(input, 'code', { min: 6, max: 6 }),
    );
  }

  @Get('products')
  getProducts(@Query() query: Record<string, string | string[] | undefined>) {
    return this.appService.getProducts({
      search: typeof query.search === 'string' ? query.search.trim() : undefined,
      category:
        typeof query.category === 'string' && productCategories.includes(query.category as never)
          ? query.category
          : undefined,
      certifications: stringArray(query, 'certifications', certifications),
      sort:
        typeof query.sort === 'string' &&
        ['featured', 'price-asc', 'price-desc', 'rating', 'lead-time'].includes(query.sort)
          ? (query.sort as 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'lead-time')
          : undefined,
    });
  }

  @Get('cart/:userId')
  getCart(@Param('userId') userId: string) {
    return this.appService.getCart(userId);
  }

  @Post('cart/items')
  addCartItem(@Body() body: unknown) {
    const input = asRecord(body);
    return this.appService.addCartItem(
      requiredString(input, 'userId'),
      requiredString(input, 'productId'),
      positiveInt(input, 'quantity', { min: 1, max: 10000 }),
    );
  }

  @Patch('cart/items/:productId')
  updateCartItem(@Param('productId') productId: string, @Body() body: unknown) {
    const input = asRecord(body);
    return this.appService.updateCartItem(
      requiredString(input, 'userId'),
      productId,
      positiveInt(input, 'quantity', { min: 1, max: 10000 }),
    );
  }

  @Delete('cart/items/:productId')
  removeCartItem(
    @Param('productId') productId: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    const userId = query.userId;

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.appService.removeCartItem(userId, productId);
  }

  @Post('cart/checkout')
  checkout(@Body() body: unknown) {
    const input = asRecord(body);
    return this.appService.checkout(
      requiredString(input, 'userId'),
      requiredString(input, 'paymentIntentId'),
    );
  }

  @Post('payments/create-intent')
  createPaymentIntent(@Body() body: unknown) {
    const input = asRecord(body);
    return this.appService.createPaymentIntent({
      userId: requiredString(input, 'userId'),
      cardHolder: requiredString(input, 'cardHolder', { min: 2, max: 120 }),
      cardNumber: requiredString(input, 'cardNumber', { min: 13, max: 19 }),
      expiryMonth: requiredString(input, 'expiryMonth', { min: 2, max: 2 }),
      expiryYear: requiredString(input, 'expiryYear', { min: 2, max: 4 }),
      cvv: requiredString(input, 'cvv', { min: 3, max: 4 }),
      billingZip: requiredString(input, 'billingZip', { min: 3, max: 12 }),
    });
  }

  @Get('orders')
  getOrders(@Query() query: Record<string, string | undefined>) {
    const role = query.role as UserRole | undefined;
    const userId = query.userId;

    if (!role || !roles.includes(role)) {
      throw new BadRequestException(`role must be one of: ${roles.join(', ')}`);
    }

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.appService.getOrders(role, userId, {
      supplier: query.supplier?.trim(),
      status: query.status?.trim(),
      orderId: query.orderId?.trim(),
      dateFrom: query.dateFrom?.trim(),
      dateTo: query.dateTo?.trim(),
    });
  }

  @Get('orders/:orderId/history')
  getOrderHistory(@Param('orderId') orderId: string, @Query() query: Record<string, string | undefined>) {
    const role = query.role as UserRole | undefined;
    const userId = query.userId;

    if (!role || !roles.includes(role)) {
      throw new BadRequestException(`role must be one of: ${roles.join(', ')}`);
    }

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.appService.getOrderHistory(orderId, role, userId);
  }

  @Post('orders/drafts')
  createOrderDraft(@Body() body: unknown) {
    const input = asRecord(body);
    const lines = this.parseDraftLines(input.lines);

    return this.appService.createOrderDraft({
      userId: requiredString(input, 'userId'),
      supplier: requiredString(input, 'supplier'),
      lines,
    });
  }

  @Patch('orders/drafts/:draftId')
  updateOrderDraft(@Param('draftId') draftId: string, @Body() body: unknown) {
    const input = asRecord(body);
    const lines = this.parseDraftLines(input.lines);

    return this.appService.updateOrderDraft(draftId, {
      userId: requiredString(input, 'userId'),
      supplier: requiredString(input, 'supplier'),
      lines,
    });
  }

  @Get('orders/drafts/:draftId')
  getOrderDraft(@Param('draftId') draftId: string, @Query() query: Record<string, string | undefined>) {
    const userId = query.userId;
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.appService.getOrderDraft(draftId, userId);
  }

  @Post('orders/drafts/:draftId/submit')
  submitOrderDraft(@Param('draftId') draftId: string, @Body() body: unknown) {
    const input = asRecord(body);
    return this.appService.submitOrderDraft(draftId, requiredString(input, 'userId'));
  }

  @Post('orders/bulk-import')
  bulkImportOrders(@Body() body: unknown) {
    const input = asRecord(body);
    const rowsRaw = input.rows;
    if (!Array.isArray(rowsRaw)) {
      throw new BadRequestException('rows must be an array');
    }

    const rows = rowsRaw.map((item, index) => {
      const row = asRecord(item, `rows[${index}]`);
      return {
        sku: requiredString(row, 'sku'),
        quantity: this.requiredNumber(row, 'quantity'),
      };
    });

    return this.appService.bulkImportOrders(rows);
  }

  @Post('products/manage')
  upsertProduct(@Body() body: unknown) {
    const input = asRecord(body);
    return this.appService.upsertProduct({
      id: typeof input.id === 'string' ? input.id : undefined,
      supplierId: requiredString(input, 'supplierId'),
      supplierName: requiredString(input, 'supplierName'),
      name: requiredString(input, 'name'),
      sku: requiredString(input, 'sku'),
      category: requiredString(input, 'category'),
      unit: requiredString(input, 'unit'),
      origin: requiredString(input, 'origin'),
      description: requiredString(input, 'description'),
      image: requiredString(input, 'image'),
      inventory: this.requiredNumber(input, 'inventory'),
      minOrderQuantity: this.requiredNumber(input, 'minOrderQuantity'),
      price: this.requiredNumber(input, 'price'),
    });
  }

  @Delete('products/manage/:productId')
  deleteManagedProduct(@Param('productId') productId: string) {
    return this.appService.deleteManagedProduct(productId);
  }

  @Post('products/pricing')
  updateProductPricing(@Body() body: unknown) {
    const input = asRecord(body);
    const volumeTiersRaw = input.volumeTiers;
    const customerOverridesRaw = input.customerOverrides;

    if (!Array.isArray(volumeTiersRaw) || !Array.isArray(customerOverridesRaw)) {
      throw new BadRequestException('volumeTiers and customerOverrides must be arrays');
    }

    const volumeTiers = volumeTiersRaw.map((item, index) => {
      const row = asRecord(item, `volumeTiers[${index}]`);
      return {
        minQty: this.requiredNumber(row, 'minQty'),
        price: this.requiredNumber(row, 'price'),
      };
    });

    const customerOverrides = customerOverridesRaw.map((item, index) => {
      const row = asRecord(item, `customerOverrides[${index}]`);
      return {
        customerId: requiredString(row, 'customerId'),
        price: this.requiredNumber(row, 'price'),
      };
    });

    return this.appService.updateProductPricing({
      productId: requiredString(input, 'productId'),
      basePrice: this.requiredNumber(input, 'basePrice'),
      volumeTiers,
      customerOverrides,
    });
  }

  @Post('shipments')
  createShipment(@Body() body: unknown) {
    const input = asRecord(body);
    return this.appService.createShipment({
      orderId: requiredString(input, 'orderId'),
      warehouse: requiredString(input, 'warehouse'),
      carrier: requiredString(input, 'carrier'),
      trackingNumber: requiredString(input, 'trackingNumber'),
      lineCount: this.requiredNumber(input, 'lineCount'),
    });
  }

  @Get('shipments')
  getShipments() {
    return this.appService.getShipments();
  }

  @Get('reports/spending')
  getSpendingReport(@Query() query: Record<string, string | undefined>) {
    return this.appService.getSpendingReport({
      supplier: query.supplier?.trim(),
      category: query.category?.trim(),
      fromDate: query.fromDate?.trim(),
      toDate: query.toDate?.trim(),
      role: (query.role as UserRole | undefined) ?? undefined,
      userId: query.userId?.trim(),
    });
  }

  @Get('reports/reorder-suggestions')
  getReorderSuggestions(@Query() query: Record<string, string | undefined>) {
    const userId = query.userId;
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.appService.getReorderSuggestions(userId);
  }

  @Get('billing/subscription-tiers')
  getSubscriptionTiers() {
    return this.appService.getSubscriptionTiers();
  }

  @Post('billing/subscription-tiers')
  upsertSubscriptionTiers(@Body() body: unknown) {
    const input = asRecord(body);
    const tiersRaw = input.tiers;
    if (!Array.isArray(tiersRaw)) {
      throw new BadRequestException('tiers must be an array');
    }

    const tiers = tiersRaw.map((item, index) => {
      const tier = asRecord(item, `tiers[${index}]`);
      return {
        name: requiredString(tier, 'name'),
        minVolume: this.requiredNumber(tier, 'minVolume'),
        maxVolume: this.requiredNumber(tier, 'maxVolume'),
        subscriptionFee: this.requiredNumber(tier, 'subscriptionFee'),
        commissionRate: this.requiredNumber(tier, 'commissionRate'),
      };
    });

    return this.appService.upsertSubscriptionTiers(tiers);
  }

  @Get('billing/commission-preview')
  previewCommission(@Query() query: Record<string, string | undefined>) {
    const transactionVolumeRaw = query.transactionVolume;
    if (!transactionVolumeRaw) {
      throw new BadRequestException('transactionVolume is required');
    }
    const transactionVolume = Number(transactionVolumeRaw);
    if (!Number.isFinite(transactionVolume) || transactionVolume <= 0) {
      throw new BadRequestException('transactionVolume must be greater than 0');
    }
    return this.appService.previewCommission(transactionVolume);
  }

  @Get('dashboard/:role/:userId')
  getDashboard(@Param('role') role: UserRole, @Param('userId') userId: string) {
    if (!roles.includes(role)) {
      throw new BadRequestException(`role must be one of: ${roles.join(', ')}`);
    }

    return this.appService.getDashboard(role, userId);
  }

  @Post('admin/vendors/:vendorId/approve')
  approveVendor(@Param('vendorId') vendorId: string, @Body() body: unknown) {
    const input = asRecord(body);
    return this.appService.approveVendor(requiredString(input, 'adminId'), vendorId);
  }

  @Post('admin/vendors/:vendorId/decline')
  declineVendor(@Param('vendorId') vendorId: string, @Body() body: unknown) {
    const input = asRecord(body);
    return this.appService.declineVendor(requiredString(input, 'adminId'), vendorId);
  }

  private requiredNumber(input: Record<string, unknown>, field: string) {
    const value = input[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new BadRequestException(`${field} must be a number`);
    }
    return value;
  }

  private parseDraftLines(raw: unknown) {
    if (!Array.isArray(raw)) {
      throw new BadRequestException('lines must be an array');
    }

    return raw.map((item, index) => {
      const line = asRecord(item, `lines[${index}]`);
      return {
        productId: requiredString(line, 'productId'),
        quantity: this.requiredNumber(line, 'quantity'),
        unitPrice: this.requiredNumber(line, 'unitPrice'),
      };
    });
  }
}
