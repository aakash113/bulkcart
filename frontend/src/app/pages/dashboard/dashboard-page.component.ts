import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SiteHeaderComponent } from '../../core/layout/site-header.component';
import { DashboardResponse, UserRole } from '../../core/models/app-data.model';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, SiteHeaderComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css'],
})
export class DashboardPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly data = signal<DashboardResponse | null>(null);
  protected readonly role = signal<UserRole>((this.route.snapshot.data['role'] as UserRole) ?? 'customer');
  protected readonly notice = signal('');
  protected readonly actionVendorId = signal('');
  protected readonly actionType = signal<'approve' | 'decline' | ''>('');

  constructor() {
    effect(() => {
      const user = this.auth.user();
      const role = this.role();

      if (user) {
        this.loadDashboard(role, user.id);
      }
    });
  }

  protected barWidth(value: number, list: Array<{ label: string; value: number }>) {
    const highest = Math.max(...list.map((entry) => entry.value), 1);
    return `${(value / highest) * 100}%`;
  }

  protected approveVendor(vendorId: string) {
    const user = this.auth.user();

    if (!user || user.role !== 'admin') {
      return;
    }

    this.notice.set('');
    this.actionVendorId.set(vendorId);
    this.actionType.set('approve');

    this.api.approveVendor(user.id, vendorId).subscribe({
      next: (response) => {
        this.notice.set(response.message);
        this.actionVendorId.set('');
        this.actionType.set('');
        this.loadDashboard('admin', user.id);
      },
      error: (error: HttpErrorResponse) => {
        this.notice.set(error.error?.message ?? 'Could not approve vendor');
        this.actionVendorId.set('');
        this.actionType.set('');
      },
    });
  }

  protected declineVendor(vendorId: string) {
    const user = this.auth.user();

    if (!user || user.role !== 'admin') {
      return;
    }

    this.notice.set('');
    this.actionVendorId.set(vendorId);
    this.actionType.set('decline');

    this.api.declineVendor(user.id, vendorId).subscribe({
      next: (response) => {
        this.notice.set(response.message);
        this.actionVendorId.set('');
        this.actionType.set('');
        this.loadDashboard('admin', user.id);
      },
      error: (error: HttpErrorResponse) => {
        this.notice.set(error.error?.message ?? 'Could not decline vendor');
        this.actionVendorId.set('');
        this.actionType.set('');
      },
    });
  }

  private loadDashboard(role: UserRole, userId: string) {
    this.api.getDashboard(role, userId).subscribe({
      next: (response) => this.data.set(response),
      error: (error: HttpErrorResponse) => {
        this.notice.set(error.error?.message ?? 'Unable to load dashboard');
      },
    });
  }
}
