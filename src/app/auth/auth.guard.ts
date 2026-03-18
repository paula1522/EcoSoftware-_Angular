import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1️⃣ Verificar autenticación
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const user = authService.getUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // 2️⃣ 🔥 VALIDAR ESTADO DE REGISTRO
  if (user.estadoRegistro === 'PENDIENTE_DOCUMENTACION') {
    return router.createUrlTree(['/subir-documentos']);
  }

  if (user.estadoRegistro !== 'APROBADO') {
    return router.createUrlTree(['/login']);
  }

  // 3️⃣ Verificar roles
  const rolesPermitidos = route.data?.['roles'] as string[] | undefined;
  const rolUsuario = user.rol;

  if (rolesPermitidos && !rolesPermitidos.includes(rolUsuario)) {
    return router.createUrlTree(['/login']);
  }

  return true;
};