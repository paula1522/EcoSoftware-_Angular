import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  SolicitudRecoleccion,
  EstadoPeticion,
  Localidad,
  TipoResiduo
} from '../Models/solicitudes.model';

// Interfaces para gráficos (opcionales)
export interface PendientesAceptadas {
  pendientes: number;
  aceptadas: number;
}

export interface RechazadasPorMotivo {
  motivo: string | null;
  cantidad: number;
}

export interface SolicitudesPorLocalidad {
  localidad: string;
  cantidad: number;
}

export interface SolicitudesEstadoItem {
  estado: string;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudRecoleccionService {
  private apiUrl = `http://localhost:8082/api/solicitudes`;
  private adminDashboardUrl = 'https://ecosoftware-spring-boot.azurewebsites.net/api/admin/dashboard';

  constructor(private http: HttpClient) {}

  // ================================
  // CRUD
  // ================================

  /** Obtener todas las solicitudes */
  listar(): Observable<SolicitudRecoleccion[]> {
    return this.http.get<SolicitudRecoleccion[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /** Crear una nueva solicitud */
  crearSolicitud(solicitud: SolicitudRecoleccion): Observable<SolicitudRecoleccion> {
    return this.http.post<SolicitudRecoleccion>(this.apiUrl, solicitud).pipe(
      catchError(this.handleError)
    );
  }

  /** Obtener solicitud por ID */
  obtenerPorId(id: number): Observable<SolicitudRecoleccion> {
    return this.http.get<SolicitudRecoleccion>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /** Actualizar solicitud existente */
  actualizarSolicitud(id: number, solicitud: SolicitudRecoleccion): Observable<SolicitudRecoleccion> {
    return this.http.put<SolicitudRecoleccion>(`${this.apiUrl}/${id}`, solicitud).pipe(
      catchError(this.handleError)
    );
  }

  /** Subir evidencia (imagen) */
  subirEvidencia(id: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${id}/evidencia`, formData, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  /** Cancelar solicitud (solo si está pendiente) */
  cancelarSolicitud(id: number): Observable<SolicitudRecoleccion> {
    return this.http.post<SolicitudRecoleccion>(`${this.apiUrl}/${id}/cancelar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // ================================
  // Filtros
  // ================================

  /** Listar por estado */
  listarPorEstado(estado: EstadoPeticion): Observable<SolicitudRecoleccion[]> {
    return this.http.get<SolicitudRecoleccion[]>(`${this.apiUrl}/estado/${estado}`).pipe(
      catchError(this.handleError)
    );
  }

  /** Listar por usuario (ciudadano) */
  listarPorUsuario(id: number): Observable<SolicitudRecoleccion[]> {
    return this.http.get<SolicitudRecoleccion[]>(`${this.apiUrl}/usuario/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /** Listar por usuario y estado */
  listarPorUsuarioYEstado(id: number, estado: EstadoPeticion): Observable<SolicitudRecoleccion[]> {
    return this.http.get<SolicitudRecoleccion[]>(`${this.apiUrl}/usuario/${id}/estado/${estado}`).pipe(
      catchError(this.handleError)
    );
  }

  // ================================
  // Acciones especiales
  // ================================

  /** Aceptar solicitud (rol recolector/admin) */
  aceptarSolicitud(id: number): Observable<SolicitudRecoleccion> {
    return this.http.post<SolicitudRecoleccion>(`${this.apiUrl}/${id}/aceptar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /** Rechazar solicitud con motivo */
  rechazarSolicitud(id: number, motivo: string): Observable<SolicitudRecoleccion> {
    return this.http.post<SolicitudRecoleccion>(
      `${this.apiUrl}/${id}/rechazar`,
      null,
      { params: { motivo } }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ================================
  // Exportaciones (Excel, PDF)
  // ================================

  exportarExcel(
    estado?: EstadoPeticion,
    localidad?: Localidad,
    fechaDesde?: string,
    fechaHasta?: string
  ): Observable<Blob> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    if (localidad) params = params.set('localidad', localidad);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get(`${this.apiUrl}/export/excel`, { params, responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  exportarPDF(
    estado?: EstadoPeticion,
    localidad?: Localidad,
    fechaDesde?: string,
    fechaHasta?: string
  ): Observable<Blob> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    if (localidad) params = params.set('localidad', localidad);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get(`${this.apiUrl}/export/pdf`, { params, responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  

 

  // ================================
  // DEBUGGING: Obtener todas las solicitudes para análisis
  // ================================

  obtenerTodasLasSolicitudes(): Observable<SolicitudRecoleccion[]> {
    return this.listar();
  }


  getPendientesYAceptadas(): Observable<PendientesAceptadas> {
    return this.http.get<PendientesAceptadas>(`${this.apiUrl}/graficos/pendientes-aceptadas`);
  }

  getRechazadasPorMotivo(): Observable<RechazadasPorMotivo[]> {
    return this.http.get<any[]>(`${this.apiUrl}/graficos/rechazadas-por-motivo`).pipe(
      map(data => data.map(item => ({
        motivo: item[0],
        cantidad: item[1]
      })))
    );
  }

  getSolicitudesPorLocalidad(): Observable<SolicitudesPorLocalidad[]> {
    return this.http.get<any[]>(`${this.apiUrl}/graficos/solicitudes-por-localidad`).pipe(
      map(data => data.map(item => ({
        localidad: item[0],
        cantidad: item[1]
      })))
    );
  }

 getSolicitudesPorLocalidadFactory(): Observable<SolicitudesPorLocalidad[]> {
  // Intenta primero el endpoint original, luego devuelve datos de prueba como fallback
  return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/graficas/localidades`).pipe(
    map(res => {
      // res "respuesta"= { "Suba": 2, "Kennedy": 2, ... } Convertir a array de objetos
      return Object.keys(res).map(localidad => ({
        localidad,
        cantidad: res[localidad]
      }));
    })
  );
}

// Datos de prueba cuando el endpoint no responde
private getMockSolicitudesPorLocalidad(): SolicitudesPorLocalidad[] {
  return [
    { localidad: 'Candelaria', cantidad: 2 },
    { localidad: 'Chapinero', cantidad: 1 },
    { localidad: 'Teusaquillo', cantidad: 1 },
    { localidad: 'Engativá', cantidad: 1 },
    { localidad: 'Rafael Uribe Uribe', cantidad: 1 }
  ];
}

  // ================================
  // ADMIN DASHBOARD
  // ================================
  getAdminSolicitudesEstadoDetalle(): Observable<SolicitudesEstadoItem[]> {
    return this.http.get<any>(`${this.adminDashboardUrl}/solicitudes-estado`).pipe(
      map((res: any) => {
        if (Array.isArray(res)) {
          return res.map((item: any) => ({
            estado: String(item?.estado ?? item?.Estado ?? item?.[0] ?? item?.label ?? 'Sin estado'),
            cantidad: Number(item?.cantidad ?? item?.Cantidad ?? item?.[1] ?? item?.value ?? 0)
          }));
        }

        if (res && typeof res === 'object') {
          return Object.keys(res).map((key: string) => ({
            estado: key,
            cantidad: Number((res as Record<string, unknown>)[key] ?? 0)
          }));
        }

        return [];
      }),
      catchError(() => of([]))
    );
  }

  getAdminSolicitudesPorLocalidad(): Observable<SolicitudesPorLocalidad[]> {
    return this.http.get<any>(`${this.adminDashboardUrl}/solicitudes-localidad`).pipe(
      map((res: any) => {
        if (Array.isArray(res)) {
          return res.map((item: any) => ({
            localidad: String(item?.localidad ?? item?.Localidad ?? item?.[0] ?? 'Sin localidad'),
            cantidad: Number(item?.cantidad ?? item?.Cantidad ?? item?.[1] ?? 0)
          }));
        }

        if (res && typeof res === 'object') {
          return Object.keys(res).map((localidad: string) => ({
            localidad,
            cantidad: Number((res as Record<string, unknown>)[localidad] ?? 0)
          }));
        }

        return [];
      }),
      catchError(() => of(this.getMockSolicitudesPorLocalidad()))
    );
  }


 // ================================
  // Manejo de errores
  // ================================
  private handleError(error: any) {
    console.error('Error en solicitud HTTP:', error);
    let errorMsg = 'Ocurrió un error. Intenta nuevamente.';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMsg = error.error.message;
    } else {
      // Error del backend
      errorMsg = error.error?.message || `Error ${error.status}: ${error.statusText}`;
    }
    return throwError(() => new Error(errorMsg));
  }
}