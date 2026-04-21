import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  BulkOrderImportResponse,
  BulkOrderRowInput,
  CommissionPreviewResponse,
  CartResponse,
  DashboardResponse,
  ExperienceData,
  OrderDraft,
  OrderDraftPayload,
  OrderFilter,
  OrderHistoryResponse,
  OrdersResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  PaymentIntentResponse,
  ProductResponse,
  ProductManagementPayload,
  ProductPricingPayload,
  ReorderSuggestion,
  ShipmentPayload,
  ShipmentRecord,
  SpendingReportResponse,
  SubscriptionTierConfig,
  UserRole,
} from '../models/app-data.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getExperience(): Observable<ExperienceData> {
    return this.http.get<ExperienceData>(`${this.baseUrl}/experience`);
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

  addCartItem(payload: { userId: string; productId: string; quantity: number }): Observable<CartResponse> {
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

  getOrders(role: UserRole, userId: string, filters?: OrderFilter): Observable<OrdersResponse> {
    let params = new HttpParams().set('role', role).set('userId', userId);
    if (filters?.supplier) {
      params = params.set('supplier', filters.supplier);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.orderId) {
      params = params.set('orderId', filters.orderId);
    }
    if (filters?.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }
    if (filters?.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }
    return this.http.get<OrdersResponse>(`${this.baseUrl}/orders`, { params });
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

  declineVendor(adminId: string, vendorId: string): Observable<{ message: string; vendorId: string }> {
    return this.http.post<{ message: string; vendorId: string }>(
      `${this.baseUrl}/admin/vendors/${vendorId}/decline`,
      { adminId },
    );
  }

  getOrderHistory(orderId: string, role: UserRole, userId: string): Observable<OrderHistoryResponse> {
    return this.http.get<OrderHistoryResponse>(`${this.baseUrl}/orders/${orderId}/history`, {
      params: { role, userId },
    });
  }

  saveOrderDraft(payload: OrderDraftPayload): Observable<OrderDraft> {
    return this.http.post<OrderDraft>(`${this.baseUrl}/orders/drafts`, payload);
  }

  updateOrderDraft(draftId: string, payload: OrderDraftPayload): Observable<OrderDraft> {
    return this.http.patch<OrderDraft>(`${this.baseUrl}/orders/drafts/${draftId}`, payload);
  }

  getOrderDraft(draftId: string, userId: string): Observable<OrderDraft> {
    return this.http.get<OrderDraft>(`${this.baseUrl}/orders/drafts/${draftId}`, { params: { userId } });
  }

  submitOrderDraft(draftId: string, userId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/orders/drafts/${draftId}/submit`, { userId });
  }

  importBulkOrders(rows: BulkOrderRowInput[]): Observable<BulkOrderImportResponse> {
    return this.http.post<BulkOrderImportResponse>(`${this.baseUrl}/orders/bulk-import`, { rows });
  }

  upsertProduct(payload: ProductManagementPayload): Observable<{ item: unknown }> {
    return this.http.post<{ item: unknown }>(`${this.baseUrl}/products/manage`, payload);
  }

  deleteProduct(productId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/products/manage/${productId}`);
  }

  updateProductPricing(payload: ProductPricingPayload): Observable<{ item: unknown }> {
    return this.http.post<{ item: unknown }>(`${this.baseUrl}/products/pricing`, payload);
  }

  createShipment(payload: ShipmentPayload): Observable<ShipmentRecord> {
    return this.http.post<ShipmentRecord>(`${this.baseUrl}/shipments`, payload);
  }

  getShipments(): Observable<ShipmentRecord[]> {
    return this.http.get<ShipmentRecord[]>(`${this.baseUrl}/shipments`);
  }

  getSpendingReport(filters: {
    supplier?: string;
    category?: string;
    fromDate?: string;
    toDate?: string;
    role?: UserRole;
    userId?: string;
  }): Observable<SpendingReportResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });
    return this.http.get<SpendingReportResponse>(`${this.baseUrl}/reports/spending`, { params });
  }

  getReorderSuggestions(userId: string): Observable<ReorderSuggestion[]> {
    return this.http.get<ReorderSuggestion[]>(`${this.baseUrl}/reports/reorder-suggestions`, {
      params: { userId },
    });
  }

  getSubscriptionTiers(): Observable<SubscriptionTierConfig[]> {
    return this.http.get<SubscriptionTierConfig[]>(`${this.baseUrl}/billing/subscription-tiers`);
  }

  upsertSubscriptionTiers(payload: SubscriptionTierConfig[]): Observable<SubscriptionTierConfig[]> {
    return this.http.post<SubscriptionTierConfig[]>(`${this.baseUrl}/billing/subscription-tiers`, { tiers: payload });
  }

  previewCommission(transactionVolume: number): Observable<CommissionPreviewResponse> {
    return this.http.get<CommissionPreviewResponse>(`${this.baseUrl}/billing/commission-preview`, {
      params: { transactionVolume },
    });
  }
}
