// src/app/auth/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const isRoutingProxyRequest = req.url.startsWith('/api/route') || req.url.startsWith('/api/nearest');
  const isPublicPuntosRequest = req.method === 'GET' && req.url.startsWith('/api/puntos');
  const masked = token ? (token.length > 16 ? token.slice(0,8) + '...' + token.slice(-6) : token) : null;
  console.log('[AuthInterceptor] token?', !!token, 'masked:', masked);

  if (isRoutingProxyRequest || isPublicPuntosRequest) {
    console.log('[AuthInterceptor] skipping Authorization header for public/proxy request', req.url);
    return next(req);
  }

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('[AuthInterceptor] attaching Authorization header to', req.url);
    return next(cloned);
  }

  console.log('[AuthInterceptor] no token, sending request without Authorization to', req.url);
  return next(req);

  
};
