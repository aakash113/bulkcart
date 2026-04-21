import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SiteHeaderComponent } from '../../core/layout/site-header.component';
import {
  CommissionPreviewResponse,
  ReorderSuggestion,
  ShipmentRecord,
  SpendingReportResponse,
  SubscriptionTierConfig,
} from '../../core/models/app-data.model';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-operations-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, PercentPipe, SiteHeaderComponent],
  templateUrl: './operations-page.component.html',
  styleUrls: ['./operations-page.component.css'],
})
export class OperationsPageComponent {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly notice = signal('');

  protected readonly shipmentForm = signal({
    orderId: 'ORD-10021',
    warehouse: 'NYC-01',
    carrier: 'UPS',
    trackingNumber: '',
    lineCount: 1,
  });
  protected readonly shipments = signal<ShipmentRecord[]>([]);

  protected readonly reportFilters = signal({
    supplier: '',
    category: '',
    fromDate: '',
    toDate: '',
  });
  protected readonly report = signal<SpendingReportResponse | null>(null);
  protected readonly suggestions = signal<ReorderSuggestion[]>([]);

  protected readonly tiers = signal<SubscriptionTierConfig[]>([]);
  protected readonly previewVolume = signal(15000);
  protected readonly preview = signal<CommissionPreviewResponse | null>(null);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user) {
        return;
      }

      this.loadShipments();
      this.loadReport();
      this.loadSuggestions();
      this.loadTiers();
      this.loadPreview();
    });
  }

  protected barWidth(value: number, total: number) {
    if (!total) {
      return '0%';
    }
    return `${Math.max(5, (value / total) * 100)}%`;
  }

  protected setShipmentField(
    field: 'orderId' | 'warehouse' | 'carrier' | 'trackingNumber' | 'lineCount',
    value: string,
  ) {
    this.shipmentForm.update((state) => ({
      ...state,
      [field]: field === 'lineCount' ? Number(value) : value,
    }));
  }

  protected setReportFilter(field: 'supplier' | 'category' | 'fromDate' | 'toDate', value: string) {
    this.reportFilters.update((state) => ({ ...state, [field]: value }));
  }

  protected createShipment() {
    this.api.createShipment(this.shipmentForm()).subscribe({
      next: () => {
        this.notice.set('Shipment created.');
        this.loadShipments();
      },
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Shipment creation failed'),
    });
  }

  protected loadReport() {
    const user = this.auth.user();
    if (!user) {
      return;
    }

    this.api
      .getSpendingReport({
        ...this.reportFilters(),
        role: user.role,
        userId: user.id,
      })
      .subscribe({
      next: (response) => this.report.set(response),
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Unable to load report'),
      });
  }

  protected loadSuggestions() {
    const user = this.auth.user();
    if (!user) {
      return;
    }

    this.api.getReorderSuggestions(user.id).subscribe({
      next: (response) => this.suggestions.set(response),
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Unable to load suggestions'),
    });
  }

  protected addTier() {
    this.tiers.update((state) => [
      ...state,
      {
        name: `Tier ${state.length + 1}`,
        minVolume: state[state.length - 1]?.maxVolume ? state[state.length - 1].maxVolume + 1 : 0,
        maxVolume: (state[state.length - 1]?.maxVolume ?? 0) + 10000,
        subscriptionFee: 100,
        commissionRate: 2,
      },
    ]);
  }

  protected setTierField(
    index: number,
    field: 'name' | 'minVolume' | 'maxVolume' | 'subscriptionFee' | 'commissionRate',
    value: string,
  ) {
    this.tiers.update((state) =>
      state.map((entry, idx) =>
        idx === index
          ? {
              ...entry,
              [field]: field === 'name' ? value : Number(value),
            }
          : entry,
      ),
    );
  }

  protected saveTiers() {
    this.api.upsertSubscriptionTiers(this.tiers()).subscribe({
      next: (response) => {
        this.tiers.set(response);
        this.notice.set('Subscription tiers updated.');
        this.loadPreview();
      },
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Could not save tiers'),
    });
  }

  protected loadPreview() {
    this.api.previewCommission(this.previewVolume()).subscribe({
      next: (response) => this.preview.set(response),
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Could not calculate commission'),
    });
  }

  private loadShipments() {
    this.api.getShipments().subscribe({
      next: (response) => this.shipments.set(response),
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Unable to load shipments'),
    });
  }

  private loadTiers() {
    this.api.getSubscriptionTiers().subscribe({
      next: (response) => this.tiers.set(response),
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Unable to load tiers'),
    });
  }
}
