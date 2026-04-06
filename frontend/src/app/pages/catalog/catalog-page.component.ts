import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductResponse } from '../../core/models/app-data.model';
import { SiteHeaderComponent } from '../../core/layout/site-header.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, RouterLink, SiteHeaderComponent],
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.css'],
})
export class CatalogPageComponent {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly filters = {
    search: signal(''),
    category: signal(''),
    sort: signal('featured'),
    certifications: signal<string[]>([]),
  };

  protected readonly productData = signal<ProductResponse | null>(null);

  protected readonly products = computed(() => this.productData()?.items ?? []);
  protected readonly availableFilters = computed(() => this.productData()?.filters);
  protected readonly notice = signal('');

  constructor() {
    this.reloadProducts();
  }

  protected reloadProducts() {
    this.api
      .getProducts({
        search: this.filters.search(),
        category: this.filters.category(),
        sort: this.filters.sort(),
        certifications: this.filters.certifications(),
      })
      .subscribe((response) => this.productData.set(response));
  }

  protected toggleCertification(certification: string) {
    const current = this.filters.certifications();
    this.filters.certifications.set(
      current.includes(certification)
        ? current.filter((item) => item !== certification)
        : [...current, certification],
    );
    this.reloadProducts();
  }

  protected addToCart(productId: string, minimumQuantity: number) {
    const user = this.auth.user();

    if (!user || user.role !== 'customer') {
      this.router.navigateByUrl('/login');
      return;
    }

    this.api.addCartItem({ userId: user.id, productId, quantity: minimumQuantity }).subscribe({
      next: () => this.notice.set('Added to cart'),
      error: (error) => this.notice.set(error.error?.message ?? 'Unable to add item'),
    });
  }
}
