import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../core/layout/site-header.component';
import { ApiService } from '../../core/services/api.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SiteHeaderComponent],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
})
export class LandingPageComponent {
  private readonly api = inject(ApiService);
  protected readonly experience = toSignal(this.api.getExperience(), { initialValue: null });
  protected readonly howItWorksMode = signal<'buyers' | 'suppliers'>('buyers');
  protected readonly openFaqIndex = signal(0);
  protected readonly categories = [
    { icon: '🌾', name: 'Grains & Rice', count: 145 },
    { icon: '🫙', name: 'Oils & Condiments', count: 87 },
    { icon: '🧀', name: 'Dairy & Cheese', count: 63 },
    { icon: '🥩', name: 'Meat & Poultry', count: 92 },
    { icon: '🥦', name: 'Fresh Produce', count: 210 },
    { icon: '🌽', name: 'Baking Supplies', count: 78 },
    { icon: '☕', name: 'Beverages', count: 55 },
    { icon: '🌿', name: 'Spices & Herbs', count: 134 },
  ];
  protected readonly painPoints = {
    oldWay: [
      'Manual phone & WhatsApp ordering',
      'Zero price transparency',
      'Long, unpredictable lead times',
      'Manual inventory management',
    ],
    bulkcartWay: [
      'Digital POs with one-click approval',
      'Real-time price comparison',
      'Fast 1–3 day delivery network',
      'Smart inventory & reorder alerts',
    ],
  };
  protected readonly roleCards = [
    {
      title: 'For Retailers & Buyers',
      subtitle: 'Restaurants, cafes, grocery shops, hotels, caterers',
      accent: 'buyer',
      cta: 'Start Ordering Free',
      bullets: [
        'Access 500+ verified wholesale suppliers in one place',
        'Real-time price comparison across multiple vendors',
        'Volume-based tiered pricing automatically applied',
        'Downloadable invoices and purchase history',
      ],
    },
    {
      title: 'For Suppliers & Vendors',
      subtitle: 'Distributors, wholesalers, food manufacturers, importers',
      accent: 'vendor',
      cta: 'Apply as a Supplier',
      bullets: [
        'Reach 480+ active retail buyers looking to purchase',
        'Tiered pricing management with custom volume discounts',
        'Automated order management and fulfillment workflows',
        'Analytics for products, customers, and revenue',
      ],
    },
  ];
  protected readonly buyerSteps = [
    {
      step: 'Step 01',
      icon: '👤',
      title: 'Register & Verify',
      bullets: ['Create free account', 'Submit business license', 'Get verified in 24 hrs'],
    },
    {
      step: 'Step 02',
      icon: '📈',
      title: 'Browse & Compare',
      bullets: ['Search 1,200+ products', 'Compare supplier prices', 'View bulk discounts'],
    },
    {
      step: 'Step 03',
      icon: '🧾',
      title: 'Place Bulk Orders',
      bullets: ['Digital purchase order', 'Instant confirmation', 'Secure payment checkout'],
    },
    {
      step: 'Step 04',
      icon: '🚚',
      title: 'Track & Receive',
      bullets: ['Real-time tracking', '1–3 day delivery', 'Digital invoice generated'],
    },
  ];
  protected readonly supplierSteps = [
    {
      step: 'Step 01',
      icon: '🏪',
      title: 'Create Storefront',
      bullets: ['Submit company profile', 'Upload compliance docs', 'Get approved by admin'],
    },
    {
      step: 'Step 02',
      icon: '📦',
      title: 'List Products',
      bullets: ['Add SKUs and specs', 'Set MOQ and tier pricing', 'Publish inventory live'],
    },
    {
      step: 'Step 03',
      icon: '✅',
      title: 'Manage Orders',
      bullets: ['Approve incoming POs', 'Coordinate fulfillment', 'Update shipment status'],
    },
    {
      step: 'Step 04',
      icon: '💸',
      title: 'Get Paid',
      bullets: ['Track settlements', 'View sales analytics', 'Scale with new buyers'],
    },
  ];
  protected readonly testimonials = [
    {
      quote:
        'BulkCart cut our procurement time by 70%. What used to take 3 hours of phone calls now takes 20 minutes online.',
      author: 'Sarah Mitchell',
      role: 'Owner, Green Grocer Market',
      tag: 'Customer',
      initials: 'SM',
    },
    {
      quote:
        'We grew our B2B revenue by 40% in 6 months after listing on BulkCart. The tiered pricing tools helped us win larger accounts.',
      author: 'Ahmed Khalid',
      role: 'CEO, Premium Foods Inc.',
      tag: 'Vendor',
      initials: 'AK',
    },
    {
      quote:
        'Managing 12 cafe locations means bulk buying is critical. BulkCart gives us real-time price comparison across all our suppliers.',
      author: 'Jessica Lim',
      role: 'Procurement Manager, City Cafes Group',
      tag: 'Customer',
      initials: 'JL',
    },
  ];
  protected readonly pricingPlans = [
    {
      audience: 'For Buyers',
      name: 'Free',
      price: '$0',
      suffix: '/month',
      cta: 'Get Started Free',
      featured: false,
      accent: 'buyer',
      bullets: [
        'Unlimited browsing & ordering',
        'Access to all verified suppliers',
        'Bulk pricing tiers automatically applied',
        'Order tracking & digital invoices',
        'Email support',
      ],
    },
    {
      audience: 'For Suppliers',
      name: 'Growth',
      price: '$299',
      suffix: '/month',
      cta: 'Apply as Supplier',
      featured: true,
      accent: 'vendor',
      bullets: [
        'Up to 500 product listings',
        'Tiered bulk pricing management',
        'Order management & fulfillment tools',
        'Sales analytics dashboard',
        'Automated invoicing & payout tracking',
      ],
    },
    {
      audience: 'For Large Operations',
      name: 'Enterprise',
      price: 'Custom',
      suffix: '',
      cta: 'Contact Sales',
      featured: false,
      accent: 'enterprise',
      bullets: [
        'Unlimited product listings',
        'Multi-warehouse inventory management',
        'API integration with ERP/POS systems',
        'Custom contract & payment terms',
        'Dedicated account manager',
      ],
    },
  ];
  protected readonly faqEntries = [
    {
      question: 'Who can register as a customer on BulkCart?',
      answer: 'Restaurants, cafes, grocery stores, hotels, caterers, and other food businesses can create buyer accounts.',
    },
    {
      question: 'How does supplier verification work?',
      answer: 'Vendors submit business and compliance details, then the admin team reviews documentation before approval.',
    },
    {
      question: 'What are the minimum order quantities?',
      answer: 'Each supplier sets MOQ per product, and BulkCart shows those limits before checkout.',
    },
    {
      question: 'How is payment handled?',
      answer: 'BulkCart supports secure digital checkout and records invoices, payment state, and order history centrally.',
    },
    {
      question: 'Can I compare prices across multiple suppliers?',
      answer: 'Yes. Buyers can compare live pricing, lead time, MOQ, and certifications side by side.',
    },
  ];
  protected readonly activeSteps = computed(() =>
    this.howItWorksMode() === 'buyers' ? this.buyerSteps : this.supplierSteps,
  );

  protected iconForCategory(name: string) {
    const iconMap: Record<string, string> = {
      Grains: '🌾',
      'Grains & Rice': '🌾',
      Oils: '🫙',
      'Oils & Condiments': '🫙',
      Dairy: '🧀',
      'Dairy & Cheese': '🧀',
      Meat: '🥩',
      'Meat & Poultry': '🥩',
      Produce: '🥦',
      'Fresh Produce': '🥦',
      Baking: '🌽',
      'Baking Supplies': '🌽',
      Beverages: '☕',
      Spices: '🌿',
      'Spices & Herbs': '🌿',
    };

    return iconMap[name] ?? '📦';
  }

  protected toggleFaq(index: number) {
    this.openFaqIndex.set(this.openFaqIndex() === index ? -1 : index);
  }
}
