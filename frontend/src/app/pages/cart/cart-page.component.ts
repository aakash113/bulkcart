import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../core/layout/site-header.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartResponse } from '../../core/models/app-data.model';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink, SiteHeaderComponent],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.css'],
})
export class CartPageComponent {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly cart = signal<CartResponse | null>(null);
  protected readonly notice = signal('');
  protected readonly paymentMessage = signal('');
  protected readonly processingPayment = signal(false);
  protected readonly paymentForm = {
    cardHolder: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    billingZip: '',
  };

  constructor() {
    effect(() => {
      const user = this.auth.user();

      if (user?.role === 'customer') {
        this.loadCart(user.id);
      }
    });
  }

  protected changeQuantity(productId: string, quantity: number) {
    const user = this.auth.user();

    if (!user) {
      return;
    }

    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    this.api.updateCartItem({ userId: user.id, productId, quantity }).subscribe({
      next: (response) => this.cart.set(response),
      error: (error) => this.notice.set(error.error?.message ?? 'Could not update cart'),
    });
  }

  protected removeItem(productId: string) {
    const user = this.auth.user();

    if (!user) {
      return;
    }

    this.api.removeCartItem(user.id, productId).subscribe((response) => this.cart.set(response));
  }

  protected checkout() {
    const user = this.auth.user();

    if (!user) {
      return;
    }

    if (!this.paymentForm.cardHolder || !this.paymentForm.cardNumber || !this.paymentForm.expiryMonth || !this.paymentForm.expiryYear || !this.paymentForm.cvv || !this.paymentForm.billingZip) {
      this.paymentMessage.set('Complete the payment form before placing the order.');
      return;
    }

    this.processingPayment.set(true);
    this.paymentMessage.set('');
    this.notice.set('');

    this.api
      .createPaymentIntent({
        userId: user.id,
        cardHolder: this.paymentForm.cardHolder,
        cardNumber: this.paymentForm.cardNumber.replace(/\s+/g, ''),
        expiryMonth: this.paymentForm.expiryMonth,
        expiryYear: this.paymentForm.expiryYear,
        cvv: this.paymentForm.cvv,
        billingZip: this.paymentForm.billingZip,
      })
      .subscribe({
        next: (paymentIntent) => {
          this.api.checkout(user.id, paymentIntent.paymentIntentId).subscribe({
            next: () => {
              this.processingPayment.set(false);
              this.notice.set(`Order placed successfully. Payment captured via ${paymentIntent.paymentMethodLabel}.`);
              this.loadCart(user.id);
              this.router.navigateByUrl('/orders');
            },
            error: (error: HttpErrorResponse) => {
              this.processingPayment.set(false);
              this.paymentMessage.set(error.error?.message ?? 'Checkout failed');
            },
          });
        },
        error: (error: HttpErrorResponse) => {
          this.processingPayment.set(false);
          this.paymentMessage.set(error.error?.message ?? 'Payment authorization failed');
        },
      });
  }

  protected formatCardNumber(value: string) {
    this.paymentForm.cardNumber = value
      .replace(/\D/g, '')
      .slice(0, 19)
      .replace(/(.{4})/g, '$1 ')
      .trim();
  }

  protected digitsOnly(field: 'expiryMonth' | 'expiryYear' | 'cvv', value: string, maxLength: number) {
    this.paymentForm[field] = value.replace(/\D/g, '').slice(0, maxLength);
  }

  protected formatBillingZip(value: string) {
    this.paymentForm.billingZip = value.replace(/[^A-Za-z0-9 -]/g, '').slice(0, 12);
  }

  protected canCheckout() {
    return !!this.cart()?.items.length && !this.processingPayment();
  }

  private loadCart(userId: string) {
    this.api.getCart(userId).subscribe({
      next: (response) => this.cart.set(response),
      error: (error: HttpErrorResponse) => {
        this.notice.set(error.error?.message ?? 'Could not load cart');
      },
    });
  }
}
