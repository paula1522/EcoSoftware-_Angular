/**
 * Archivo de configuración para el entorno de desarrollo.
 * 
 * Este archivo se usa automáticamente cuando ejecutas la aplicación
 * con `ng serve` en tu máquina local.
 * 
 * Variables principales:
 * - production: indica si la app está en modo producción (false para dev)
 * - apiUrl: URL base de la API en desarrollo (Spring Boot corriendo localmente en 8082)
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8082/api'
};
