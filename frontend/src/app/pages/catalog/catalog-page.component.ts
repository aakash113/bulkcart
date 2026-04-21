import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Product, ProductResponse } from '../../core/models/app-data.model';
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
  protected readonly selectedProductId = signal('');

  protected readonly productForm = signal({
    id: '',
    name: '',
    sku: '',
    category: 'Grains',
    unit: '',
    origin: 'USA',
    description: '',
    image: '',
    inventory: 1,
    minOrderQuantity: 1,
    price: 1,
  });

  protected readonly pricingForm = signal({
    productId: '',
    basePrice: 1,
    tiersText: '10:42\n50:39',
    customerPrice: 40,
    customerId: 'cust-1',
  });

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

  protected setProductField(
    field:
      | 'id'
      | 'name'
      | 'sku'
      | 'category'
      | 'unit'
      | 'origin'
      | 'description'
      | 'image'
      | 'inventory'
      | 'minOrderQuantity'
      | 'price',
    value: string,
  ) {
    this.productForm.update((state) => ({
      ...state,
      [field]: ['inventory', 'minOrderQuantity', 'price'].includes(field) ? Number(value) : value,
    }));
  }

  protected setPricingField(
    field: 'productId' | 'basePrice' | 'tiersText' | 'customerPrice' | 'customerId',
    value: string,
  ) {
    this.pricingForm.update((state) => ({
      ...state,
      [field]: ['basePrice', 'customerPrice'].includes(field) ? Number(value) : value,
    }));
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

  protected editProduct(product: Product) {
    this.productForm.set({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      origin: product.origin,
      description: product.description,
      image: product.image,
      inventory: product.inventory,
      minOrderQuantity: product.minOrderQuantity,
      price: product.price,
    });
    this.selectedProductId.set(product.id);
  }

  protected saveProduct() {
    const user = this.auth.user();
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      this.notice.set('Only suppliers/admin can manage products.');
      return;
    }

    const form = this.productForm();
    this.api
      .upsertProduct({
        id: form.id || undefined,
        supplierId: user.role === 'vendor' ? user.id : 'vendor-1',
        supplierName: user.role === 'vendor' ? user.company : 'Harbor Foods Supply',
        name: form.name,
        sku: form.sku,
        category: form.category,
        unit: form.unit,
        origin: form.origin,
        description: form.description,
        image: form.image,
        inventory: Number(form.inventory),
        minOrderQuantity: Number(form.minOrderQuantity),
        price: Number(form.price),
      })
      .subscribe({
        next: () => {
          this.notice.set('Product saved.');
          this.reloadProducts();
          this.productForm.set({
            id: '',
            name: '',
            sku: '',
            category: 'Grains',
            unit: '',
            origin: 'USA',
            description: '',
            image: '',
            inventory: 1,
            minOrderQuantity: 1,
            price: 1,
          });
        },
        error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Product save failed'),
      });
  }

  protected removeProduct(productId: string) {
    this.api.deleteProduct(productId).subscribe({
      next: () => {
        this.notice.set('Product removed.');
        this.reloadProducts();
      },
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Delete failed'),
    });
  }

  protected applyPricingConfig() {
    const form = this.pricingForm();
    if (!form.productId) {
      this.notice.set('Select a product before applying pricing rules.');
      return;
    }

    const tiers = form.tiersText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [qty, price] = line.split(':').map((item) => Number(item.trim()));
        return { minQty: qty, price };
      });

    this.api
      .updateProductPricing({
        productId: form.productId,
        basePrice: Number(form.basePrice),
        volumeTiers: tiers,
        customerOverrides: [{ customerId: form.customerId, price: Number(form.customerPrice) }],
      })
      .subscribe({
        next: () => {
          this.notice.set('Pricing rules updated.');
          this.reloadProducts();
        },
        error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Pricing update failed'),
      });
  }
}
