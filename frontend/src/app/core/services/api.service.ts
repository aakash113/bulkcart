import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  CartResponse,
  DashboardResponse,
  ExperienceData,
  OrdersResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  PaymentIntentResponse,
  ProductResponse,
  UserRole,
} from '../models/app-data.model';
import { MOCK_EXPERIENCE } from './mock-api.data';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getExperience(): Observable<ExperienceData> {
    return this.http
      .get<ExperienceData>(`${this.baseUrl}/experience`)
      .pipe(catchError(() => of(MOCK_EXPERIENCE).pipe(delay(120))));
  }

  login(payload: { email: string; password: string; role: UserRole }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, payload);
  }

  signup(payload: {
    role: 'customer' | 'vendor';
    name: string;
    company: string;
    email: string;
    password: string;
    phone: string;
    location: string;
    otpVerificationToken: string;
    businessDescription?: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/signup`, payload);
  }

  requestOtp(payload: { email: string; purpose: string }): Observable<OtpRequestResponse> {
    return this.http.post<OtpRequestResponse>(`${this.baseUrl}/auth/request-otp`, payload);
  }

  verifyOtp(payload: {
    requestId: string;
    email: string;
    purpose: string;
    code: string;
  }): Observable<OtpVerifyResponse> {
    return this.http.post<OtpVerifyResponse>(`${this.baseUrl}/auth/verify-otp`, payload);
  }

  getProducts(filters: {
    search?: string;
    category?: string;
    certifications?: string[];
    sort?: string;
  }): Observable<ProductResponse> {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    if (filters.category) {
      params = params.set('category', filters.category);
    }

    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }

    if (filters.certifications?.length) {
      params = params.set('certifications', filters.certifications.join(','));
    }

    return this.http.get<ProductResponse>(`${this.baseUrl}/products`, { params });
  }

  getCart(userId: string): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.baseUrl}/cart/${userId}`);
  }

  addCartItem(payload: {
    userId: string;
    productId: string;
    quantity: number;
  }): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.baseUrl}/cart/items`, payload);
  }

  updateCartItem(payload: {
    userId: string;
    productId: string;
    quantity: number;
  }): Observable<CartResponse> {
    return this.http.patch<CartResponse>(`${this.baseUrl}/cart/items/${payload.productId}`, {
      userId: payload.userId,
      quantity: payload.quantity,
    });
  }

  removeCartItem(userId: string, productId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.baseUrl}/cart/items/${productId}`, {
      params: { userId },
    });
  }

  createPaymentIntent(payload: {
    userId: string;
    cardHolder: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    billingZip: string;
  }): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(`${this.baseUrl}/payments/create-intent`, payload);
  }

  checkout(userId: string, paymentIntentId: string): Observable<{ message: string; order: unknown; cart: CartResponse }> {
    return this.http.post<{ message: string; order: unknown; cart: CartResponse }>(`${this.baseUrl}/cart/checkout`, {
      userId,
      paymentIntentId,
    });
  }

  getOrders(role: UserRole, userId: string): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(`${this.baseUrl}/orders`, {
      params: { role, userId },
    });
  }

  getDashboard(role: UserRole, userId: string): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.baseUrl}/dashboard/${role}/${userId}`);
  }

  approveVendor(adminId: string, vendorId: string): Observable<{ message: string; user: AuthResponse['user'] }> {
    return this.http.post<{ message: string; user: AuthResponse['user'] }>(
      `${this.baseUrl}/admin/vendors/${vendorId}/approve`,
      { adminId },
    );
  }
}
