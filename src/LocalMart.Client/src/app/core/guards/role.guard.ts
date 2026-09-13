import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as Array<string>;
  const user = authService.currentUser();

  if (user && user.roles && allowedRoles && user.roles.some(role => allowedRoles.includes(role))) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
