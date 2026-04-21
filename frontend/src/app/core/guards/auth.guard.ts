import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/app-data.model';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();

  if (user?.role === 'vendor' && !user.approved) {
    auth.logout();
    return router.createUrlTree(['/login'], { queryParams: { role: 'vendor' } });
  }

  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

export const roleGuard =
  (roles: UserRole[]): CanActivateFn =>
  (_route: ActivatedRouteSnapshot): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.user();

    if (user?.role === 'vendor' && !user.approved) {
      auth.logout();
      return router.createUrlTree(['/login'], { queryParams: { role: 'vendor' } });
    }

    if (user && roles.includes(user.role)) {
      return true;
    }

    return router.createUrlTree([user ? auth.dashboardRouteFor(user.role) : '/login']);
  };
