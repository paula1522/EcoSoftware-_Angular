import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service';

export const ErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const isAuthRequest = /\/api\/auth\/(login|registro|register)/i.test(req.url);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo cerramos sesion en 401 real para evitar expulsar usuarios por 403 funcional.
      if (error.status === 401 && !isAuthRequest && authService.isAuthenticated()) {
        authService.logout();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
