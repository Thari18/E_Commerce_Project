import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token && req.url.includes('/api/v1/')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Avoid infinite loop if failure occurs during refresh or login/register endpoint
      const isAuthEndpoint = req.url.includes('/api/v1/auth/login') ||
                             req.url.includes('/api/v1/auth/refresh') ||
                             req.url.includes('/api/v1/auth/register');

      if (error.status === 401 && !isAuthEndpoint) {
        return authService.refreshToken().pipe(
          switchMap(authRes => {
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${authRes.accessToken}`
              }
            });
            return next(retryReq);
          }),
          catchError(refreshErr => {
            authService.clearSessionAndRedirect();
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
