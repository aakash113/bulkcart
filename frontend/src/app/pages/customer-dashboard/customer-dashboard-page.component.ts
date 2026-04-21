import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { SiteHeaderComponent } from '../../core/layout/site-header.component';
import { DashboardResponse, OrdersResponse } from '../../core/models/app-data.model';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-dashboard-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, SiteHeaderComponent],
  templateUrl: './customer-dashboard-page.component.html',
  styleUrls: ['./customer-dashboard-page.component.css'],
})
export class CustomerDashboardPageComponent {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly dashboard = signal<DashboardResponse | null>(null);
  protected readonly orders = signal<OrdersResponse | null>(null);
  protected readonly notice = signal('');

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user || user.role !== 'customer') {
        return;
      }

      this.loadCustomerData(user.id);
    });
  }

  protected barWidth(value: number, list: Array<{ label: string; value: number }>) {
    const highest = Math.max(...list.map((entry) => entry.value), 1);
    return `${(value / highest) * 100}%`;
  }

  private loadCustomerData(userId: string) {
    this.api.getDashboard('customer', userId).subscribe({
      next: (response) => this.dashboard.set(response),
      error: (error: HttpErrorResponse) => {
        this.notice.set(error.error?.message ?? 'Unable to load customer dashboard');
      },
    });

    this.api.getOrders('customer', userId).subscribe({
      next: (response) => this.orders.set(response),
      error: (error: HttpErrorResponse) => {
        this.notice.set(error.error?.message ?? 'Unable to load customer orders');
      },
    });
  }
}
