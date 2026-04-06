import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../core/layout/site-header.component';
import { AuthMode, UserRole } from '../../core/models/app-data.model';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SiteHeaderComponent],
  templateUrl: './auth-page.component.html',
  styleUrls: ['./auth-page.component.css'],
})
export class AuthPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  protected readonly roles: UserRole[] = ['customer', 'vendor', 'admin'];
  protected readonly mode = signal<AuthMode>((this.route.snapshot.data['mode'] as AuthMode) ?? 'login');
  protected readonly selectedRole = signal<UserRole>(
    (this.route.snapshot.queryParamMap.get('role') as UserRole) ?? 'customer',
  );
  protected readonly errorMessage = signal('');
  protected readonly infoMessage = signal('');
  protected readonly loading = signal(false);
  protected readonly otpRequestId = signal('');
  protected readonly otpVerificationToken = signal('');
  protected readonly otpVerified = signal(false);
  protected readonly otpCodeSent = signal(false);
  protected readonly otpSending = signal(false);
  protected readonly otpVerifying = signal(false);
  protected readonly otpExpiry = signal('');
  protected readonly devOtpHint = signal('');
  protected readonly heading = computed(() =>
    this.mode() === 'login' ? 'Sign in to BulkCart' : 'Create your BulkCart account',
  );

  protected readonly form = {
    name: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    businessDescription: '',
    otpCode: '',
  };

  constructor() {
    if (this.mode() === 'signup' && this.selectedRole() === 'admin') {
      this.selectedRole.set('customer');
    }
  }

  protected setRole(role: UserRole) {
    this.selectedRole.set(role);
    this.errorMessage.set('');
    this.infoMessage.set('');
  }

  protected handleEmailChange(value: string) {
    this.form.email = value;
    this.otpCodeSent.set(false);
    this.otpVerified.set(false);
    this.otpRequestId.set('');
    this.otpVerificationToken.set('');
    this.devOtpHint.set('');
    this.form.otpCode = '';
  }

  protected switchMode(mode: AuthMode) {
    this.router.navigate([`/${mode}`], {
      queryParams: { role: this.selectedRole() },
    });
  }

  protected useDemo(role: UserRole) {
    this.selectedRole.set(role);
    if (role === 'customer') {
      this.form.email = 'demo@restaurant.com';
      this.form.password = 'demo123';
    } else if (role === 'vendor') {
      this.form.email = 'demo@supplier.com';
      this.form.password = 'demo123';
    } else {
      this.form.email = 'admin@bulkcart.com';
      this.form.password = 'admin123';
    }
  }

  protected sendOtp() {
    this.errorMessage.set('');
    this.infoMessage.set('');

    if (!this.form.email) {
      this.errorMessage.set('Enter your email before requesting OTP.');
      return;
    }

    this.otpSending.set(true);
    this.otpVerified.set(false);
    this.otpVerificationToken.set('');

    this.api.requestOtp({ email: this.form.email, purpose: 'signup' }).subscribe({
      next: (response) => {
        this.otpSending.set(false);
        this.otpRequestId.set(response.requestId);
        this.otpExpiry.set(response.expiresAt);
        this.devOtpHint.set(response.devOtp ?? '');
        this.otpCodeSent.set(true);
        this.infoMessage.set('OTP sent. Verify the code to continue signup.');
      },
      error: (error: HttpErrorResponse) => {
        this.otpSending.set(false);
        this.errorMessage.set(error.error?.message ?? 'Could not send OTP');
      },
    });
  }

  protected verifyOtp() {
    this.errorMessage.set('');
    this.infoMessage.set('');

    if (!this.otpRequestId() || !this.form.otpCode) {
      this.errorMessage.set('Request OTP first, then enter the code.');
      return;
    }

    this.otpVerifying.set(true);

    this.api
      .verifyOtp({
        requestId: this.otpRequestId(),
        email: this.form.email,
        purpose: 'signup',
        code: this.form.otpCode,
      })
      .subscribe({
        next: (response) => {
          this.otpVerifying.set(false);
          this.otpVerificationToken.set(response.verificationToken);
          this.otpVerified.set(true);
          this.infoMessage.set(response.message);
        },
        error: (error: HttpErrorResponse) => {
          this.otpVerifying.set(false);
          this.errorMessage.set(error.error?.message ?? 'OTP verification failed');
        },
      });
  }

  protected submit() {
    this.errorMessage.set('');
    this.infoMessage.set('');
    this.loading.set(true);

    const role = this.selectedRole();

    if (this.mode() === 'signup') {
      if (!this.form.name || !this.form.company || !this.form.phone || !this.form.location) {
        this.loading.set(false);
        this.errorMessage.set('Please complete all required signup fields.');
        return;
      }

      if (this.form.password.length < 8) {
        this.loading.set(false);
        this.errorMessage.set('Password must be at least 8 characters.');
        return;
      }

      if (this.form.password !== this.form.confirmPassword) {
        this.loading.set(false);
        this.errorMessage.set('Password and confirm password must match.');
        return;
      }

      if (!this.otpVerified() || !this.otpVerificationToken()) {
        this.loading.set(false);
        this.errorMessage.set('Complete OTP verification before creating the account.');
        return;
      }
    }

    const request =
      this.mode() === 'login'
        ? this.auth.login({
            email: this.form.email,
            password: this.form.password,
            role,
          })
        : this.auth.signup({
            role: role === 'admin' ? 'customer' : role,
            name: this.form.name,
            company: this.form.company,
            email: this.form.email,
            password: this.form.password,
            phone: this.form.phone,
            location: this.form.location,
            otpVerificationToken: this.otpVerificationToken(),
            businessDescription: this.form.businessDescription || undefined,
          });

    request.subscribe({
      next: () => {
        this.loading.set(false);
        const user = this.auth.user();
        if (user) {
          this.router.navigateByUrl(
            user.role === 'customer' ? '/catalog' : this.auth.dashboardRouteFor(user.role),
          );
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.message ?? 'Something went wrong');
      },
    });
  }
}
