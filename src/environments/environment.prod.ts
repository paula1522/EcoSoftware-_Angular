/**
 * Archivo de configuración para el entorno de producción.
 * 
 * Este archivo se usa automáticamente cuando ejecutas:
 * `ng build --configuration=production`
 * 
 * Variables principales:
 * - production: indica que la app está en modo producción (true)
 * - apiUrl: URL base de la API en producción
 */
export const environment = {
  production: true,
  apiUrl: 'https://api.ecosoftware.com/api'
};
