import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config'; // ✅ Usa tu configuración global
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

bootstrapApplication(App, appConfig)
  .catch(err => console.error(err));
