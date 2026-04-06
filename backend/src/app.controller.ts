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

    return this.appService.getOrders(role, userId);
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
}
