import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private isRefreshing = false;
  
  // Angular Signal State
  readonly currentUser = signal<UserProfile | null>(this.loadUserFromStorage());
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userRoles = computed(() => this.currentUser()?.roles ?? []);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private loadUserFromStorage(): UserProfile | null {
    const userJson = localStorage.getItem('localmart_user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('localmart_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('localmart_refresh_token');
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(res => this.setSession(res))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(res => this.setSession(res))
    );
  }

  socialLogin(provider: string, email?: string, name?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/social-login`, { provider, email, name }).pipe(
      tap(res => this.setSession(res))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSessionAndRedirect();
      return throwError(() => new Error('No refresh token available.'));
    }

    if (this.isRefreshing) {
      return throwError(() => new Error('Refresh request already in progress.'));
    }

    this.isRefreshing = true;

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(res => {
        this.isRefreshing = false;
        this.setSession(res);
      }),
      catchError(err => {
        this.isRefreshing = false;
        this.clearSessionAndRedirect();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).pipe(
        catchError(() => of(null))
      ).subscribe();
    }
    this.clearSessionAndRedirect();
  }

  clearSessionAndRedirect(): void {
    localStorage.removeItem('localmart_token');
    localStorage.removeItem('localmart_refresh_token');
    localStorage.removeItem('localmart_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem('localmart_token', authResult.accessToken);
    if (authResult.refreshToken) {
      localStorage.setItem('localmart_refresh_token', authResult.refreshToken);
    }
    localStorage.setItem('localmart_user', JSON.stringify(authResult.user));
    this.currentUser.set(authResult.user);
  }

  hasRole(roleName: string): boolean {
    return this.userRoles().includes(roleName);
  }

  verifyVendorSetupToken(token: string): Observable<{ isValid: boolean; email?: string; reason?: string }> {
    return this.http.get<{ isValid: boolean; email?: string; reason?: string }>(`${this.apiUrl}/vendor/verify-token`, {
      params: { token }
    });
  }

  setVendorPassword(request: { token: string; newPassword: string; confirmPassword: string }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/vendor/set-password`, request);
  }
}
