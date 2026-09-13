import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  
  // Angular Signal State
  readonly currentUser = signal<UserProfile | null>(this.loadUserFromStorage());
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userRoles = computed(() => this.currentUser()?.roles ?? []);

  constructor(private http: HttpClient) {}

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

  logout(): void {
    localStorage.removeItem('localmart_token');
    localStorage.removeItem('localmart_user');
    this.currentUser.set(null);
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem('localmart_token', authResult.accessToken);
    localStorage.setItem('localmart_user', JSON.stringify(authResult.user));
    this.currentUser.set(authResult.user);
  }

  hasRole(roleName: string): boolean {
    return this.userRoles().includes(roleName);
  }
}
