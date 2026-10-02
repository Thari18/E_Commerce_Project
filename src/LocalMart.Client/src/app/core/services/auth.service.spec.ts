import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle login and set access and refresh tokens', () => {
    const mockAuthResponse = {
      accessToken: 'mock_access_token_123',
      refreshToken: 'mock_refresh_token_456',
      user: {
        id: 'user_1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['Customer']
      }
    };

    service.login({ email: 'test@example.com', password: 'Password123!' }).subscribe(res => {
      expect(res.accessToken).toBe('mock_access_token_123');
      expect(res.refreshToken).toBe('mock_refresh_token_456');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);

    expect(service.getToken()).toBe('mock_access_token_123');
    expect(service.getRefreshToken()).toBe('mock_refresh_token_456');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should call refresh endpoint and update session', () => {
    localStorage.setItem('localmart_refresh_token', 'old_refresh_token_789');

    const mockRefreshResponse = {
      accessToken: 'new_access_token_999',
      refreshToken: 'new_refresh_token_000',
      user: {
        id: 'user_1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['Customer']
      }
    };

    service.refreshToken().subscribe(res => {
      expect(res.accessToken).toBe('new_access_token_999');
      expect(res.refreshToken).toBe('new_refresh_token_000');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'old_refresh_token_789' });
    req.flush(mockRefreshResponse);

    expect(service.getToken()).toBe('new_access_token_999');
    expect(service.getRefreshToken()).toBe('new_refresh_token_000');
  });

  it('should revoke session on logout and send request to backend', () => {
    localStorage.setItem('localmart_token', 'token_123');
    localStorage.setItem('localmart_refresh_token', 'refresh_123');

    service.logout();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'refresh_123' });
    req.flush({ success: true, message: 'Logged out' });

    expect(service.getToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });
});
