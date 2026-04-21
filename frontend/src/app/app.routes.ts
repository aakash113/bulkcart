import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { AuthPageComponent } from './pages/auth/auth-page.component';
import { CartPageComponent } from './pages/cart/cart-page.component';
import { CatalogPageComponent } from './pages/catalog/catalog-page.component';
import { CustomerDashboardPageComponent } from './pages/customer-dashboard/customer-dashboard-page.component';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { LandingPageComponent } from './pages/landing/landing-page.component';
import { OrdersPageComponent } from './pages/orders/orders-page.component';
import { OperationsPageComponent } from './pages/operations/operations-page.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: AuthPageComponent, data: { mode: 'login' } },
  { path: 'signup', component: AuthPageComponent, data: { mode: 'signup' } },
  { path: 'catalog', component: CatalogPageComponent, canActivate: [authGuard] },
  { path: 'cart', component: CartPageComponent, canActivate: [authGuard, roleGuard(['customer'])] },
  { path: 'orders', component: OrdersPageComponent, canActivate: [authGuard] },
  { path: 'operations', component: OperationsPageComponent, canActivate: [authGuard, roleGuard(['vendor', 'admin'])] },
  {
    path: 'dashboard/customer',
    component: CustomerDashboardPageComponent,
    canActivate: [authGuard, roleGuard(['customer'])],
  },
  {
    path: 'dashboard/vendor',
    component: DashboardPageComponent,
    canActivate: [authGuard, roleGuard(['vendor'])],
    data: { role: 'vendor' },
  },
  {
    path: 'dashboard/admin',
    component: DashboardPageComponent,
    canActivate: [authGuard, roleGuard(['admin'])],
    data: { role: 'admin' },
  },
  { path: '**', redirectTo: '' },
];
