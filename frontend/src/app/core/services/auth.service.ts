import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, SessionUser, UserRole } from '../models/app-data.model';
import { ApiService } from './api.service';

interface StoredSession {
  token: string;
  user: SessionUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'bulkcart-session';
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly sessionState = signal<StoredSession | null>(this.readSession());

  readonly session = computed(() => this.sessionState());
  readonly user = computed(() => this.sessionState()?.user ?? null);
  readonly isLoggedIn = computed(() => !!this.sessionState());

  login(payload: { email: string; password: string; role: UserRole }) {
    return this.api.login(payload).pipe(tap((response) => this.persistSession(response)));
  }

  signup(payload: {
    role: 'customer' | 'vendor';
    name: string;
    company: string;
    email: string;
    password: string;
    phone: string;
    location: string;
    otpVerificationToken: string;
    businessDescription?: string;
  }) {
    return this.api.signup(payload).pipe(tap((response) => this.persistSession(response)));
  }

  logout() {
    this.sessionState.set(null);
    localStorage.removeItem(this.storageKey);
    this.router.navigateByUrl('/');
  }

  dashboardRouteFor(role: UserRole): string {
    return `/dashboard/${role}`;
  }

  private persistSession(response: AuthResponse) {
    const session = {
      token: response.token,
      user: response.user,
    };

    this.sessionState.set(session);
    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  private readSession(): StoredSession | null {
    const raw = localStorage.getItem(this.storageKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
