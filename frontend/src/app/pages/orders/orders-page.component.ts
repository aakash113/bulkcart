import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { SiteHeaderComponent } from '../../core/layout/site-header.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { OrdersResponse } from '../../core/models/app-data.model';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, SiteHeaderComponent],
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.css'],
})
export class OrdersPageComponent {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly orders = signal<OrdersResponse | null>(null);

  constructor() {
    effect(() => {
      const user = this.auth.user();

      if (user) {
        this.api.getOrders(user.role, user.id).subscribe((response) => this.orders.set(response));
      }
    });
  }
}
