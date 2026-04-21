import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SiteHeaderComponent } from '../../core/layout/site-header.component';
import { BulkOrderRowInput, OrderDraft, OrderFilter, OrderHistoryResponse } from '../../core/models/app-data.model';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { OrdersResponse } from '../../core/models/app-data.model';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, SiteHeaderComponent],
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.css'],
})
export class OrdersPageComponent implements OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  protected readonly orders = signal<OrdersResponse | null>(null);
  protected readonly notice = signal('');

  protected readonly filters = signal<OrderFilter>({
    supplier: '',
    status: '',
    orderId: '',
    dateFrom: '',
    dateTo: '',
  });

  protected readonly historyOrderId = signal('');
  protected readonly historyData = signal<OrderHistoryResponse | null>(null);

  protected readonly draft = signal<OrderDraft | null>(null);
  protected readonly draftForm = signal({
    supplier: 'Harbor Foods Supply',
    lines: [{ productId: 'prod-1', quantity: 10, unitPrice: 42 }],
  });

  protected readonly bulkRowsText = signal('GRA-001,20\nSPI-014,40\nBAD-001,10');
  protected readonly bulkResult = signal<{
    validCount: number;
    invalidCount: number;
    summaryTotal: number;
    lineResults: Array<{
      row: number;
      sku: string;
      quantity: number;
      valid: boolean;
      message: string;
      lineTotal: number;
    }>;
  } | null>(null);

  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const user = this.auth.user();

      if (user) {
        this.loadOrders();
      }
    });
  }

  ngOnDestroy() {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }
  }

  protected loadOrders() {
    const user = this.auth.user();
    if (!user) {
      return;
    }

    this.api.getOrders(user.role, user.id, this.filters()).subscribe({
      next: (response) => this.orders.set(response),
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Unable to load orders'),
    });
  }

  protected applyFilters() {
    const current = this.filters();
    if (current.dateFrom && current.dateTo && current.dateFrom > current.dateTo) {
      this.notice.set('Invalid date range: "from" cannot be after "to".');
      return;
    }
    this.notice.set('');
    this.loadOrders();
  }

  protected resetFilters() {
    this.filters.set({
      supplier: '',
      status: '',
      orderId: '',
      dateFrom: '',
      dateTo: '',
    });
    this.notice.set('');
    this.loadOrders();
  }

  protected setFilter(field: keyof OrderFilter, value: string) {
    this.filters.update((current) => ({ ...current, [field]: value }));
  }

  protected loadHistory() {
    const user = this.auth.user();
    if (!user || !this.historyOrderId().trim()) {
      this.notice.set('Enter an order ID to load timeline history.');
      return;
    }

    this.api.getOrderHistory(this.historyOrderId().trim(), user.role, user.id).subscribe({
      next: (history) => {
        this.historyData.set(history);
        this.notice.set('');
      },
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Unable to load order history'),
    });
  }

  protected addDraftLine() {
    this.draftForm.update((state) => ({
      ...state,
      lines: [...state.lines, { productId: '', quantity: 1, unitPrice: 1 }],
    }));
    this.queueAutoSave();
  }

  protected setDraftSupplier(value: string) {
    this.draftForm.update((state) => ({ ...state, supplier: value }));
    this.queueAutoSave();
  }

  protected setDraftLineValue(index: number, field: 'productId' | 'quantity' | 'unitPrice', value: string) {
    this.draftForm.update((state) => ({
      ...state,
      lines: state.lines.map((entry, lineIndex) =>
        lineIndex === index
          ? {
              ...entry,
              [field]: field === 'productId' ? value : Number(value),
            }
          : entry,
      ),
    }));
    this.queueAutoSave();
  }

  protected removeDraftLine(index: number) {
    this.draftForm.update((state) => ({
      ...state,
      lines: state.lines.filter((_, lineIndex) => lineIndex !== index),
    }));
    this.queueAutoSave();
  }

  protected draftTotal() {
    return this.draftForm().lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  }

  protected queueAutoSave() {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }
    this.autosaveTimer = setTimeout(() => this.saveDraft(true), 900);
  }

  protected saveDraft(isAuto = false) {
    const user = this.auth.user();
    if (!user) {
      return;
    }

    const lines = this.draftForm().lines.filter((line) => line.productId.trim());
    if (!lines.length) {
      this.notice.set('Add at least one valid draft line.');
      return;
    }
    if (lines.some((line) => line.quantity <= 0 || line.unitPrice <= 0)) {
      this.notice.set('Draft lines require quantity > 0 and unit price > 0.');
      return;
    }

    const payload = {
      userId: user.id,
      supplier: this.draftForm().supplier,
      lines,
    };

    const draft = this.draft();
    const request = draft
      ? this.api.updateOrderDraft(draft.id, payload)
      : this.api.saveOrderDraft(payload);

    request.subscribe({
      next: (response) => {
        this.draft.set(response);
        this.notice.set(isAuto ? 'Draft auto-saved.' : 'Draft saved.');
      },
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Could not save draft'),
    });
  }

  protected submitDraft() {
    const user = this.auth.user();
    const draft = this.draft();
    if (!user || !draft) {
      this.notice.set('Save a draft before submitting.');
      return;
    }

    this.api.submitOrderDraft(draft.id, user.id).subscribe({
      next: (response) => {
        this.notice.set(response.message);
        this.loadOrders();
      },
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Could not submit draft'),
    });
  }

  protected runBulkValidation() {
    const rows = this.parseBulkRows(this.bulkRowsText());
    if (!rows.length) {
      this.notice.set('Enter at least one row in format: SKU,quantity');
      return;
    }

    this.api.importBulkOrders(rows).subscribe({
      next: (result) => {
        this.bulkResult.set(result);
        this.notice.set('');
      },
      error: (error: HttpErrorResponse) => this.notice.set(error.error?.message ?? 'Bulk import failed'),
    });
  }

  private parseBulkRows(text: string): BulkOrderRowInput[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [sku, qtyRaw] = line.split(',').map((part) => part.trim());
        return {
          sku,
          quantity: Number(qtyRaw),
        };
      })
      .filter((row) => row.sku && Number.isFinite(row.quantity));
  }
}
