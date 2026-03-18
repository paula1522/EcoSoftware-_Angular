import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors} from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';
import { LocalidadNombrePipe } from './core/pipes/LocalidadNombrePipe';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    LocalidadNombrePipe
  ]
};
