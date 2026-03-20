import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UsuarioModel } from '../Models/usuario';
import { AuthResponse } from '../Models/api-responses';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  // ============================================================
  //  URL BASE DEL BACKEND SPRINGBOOT
  // ============================================================
  private apiUrlSpringboot = 'http://localhost:8082/api/personas';

  constructor(private http: HttpClient, private api: ApiService) {}

  // ============================================================
  // 1. LISTADOS GENERALES
  // ============================================================

  /** Trae todos los usuarios */
  listar(): Observable<UsuarioModel[]> {
    return this.http.get<UsuarioModel[]>(this.apiUrlSpringboot).pipe(
      catchError(err => throwError(() => err))
    );
  }

  /** Obtener usuario por ID */
  obtenerPorId(id: number): Observable<UsuarioModel> {
    return this.http.get<UsuarioModel>(`${this.apiUrlSpringboot}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ============================================================
  // 2. LOGIN Y AUTENTICACIÓN
  // ============================================================

  /** Login local (sin API Auth) */
  login(correo: string, contrasena: string): Observable<UsuarioModel | null> {
    return this.listar().pipe(
      map(usuarios => {
        const encontrado = usuarios.find(
          u => u.correo === correo && u.contrasena === contrasena
        );

        if (encontrado) {
          localStorage.setItem('usuarioLogueado', JSON.stringify(encontrado));
        }

        return encontrado || null;
      }),
      catchError(err => {
        console.error('Error en login', err);
        return throwError(() => err);
      })
    );
  }

  /** Login API (autenticación real) */
  loginApi(credentials: { correo: string; contrasena: string }): Observable<AuthResponse> {
  return this.api.post<AuthResponse>('/api/auth/login', credentials).pipe(
    map(response => {

      localStorage.setItem('token', response.token);
      localStorage.setItem('roles', response.rol);
      localStorage.setItem('correo', response.correo);
      localStorage.setItem('idUsuario', response.idUsuario.toString());

      return response;
    }),
    catchError(err => {
      console.error('Error en login API', err);
      return throwError(() => err);
    })
  );
}

  // ============================================================
  // 3. FILTROS DE USUARIO
  // ============================================================

  filtrarPorNombre(nombre: string): Observable<UsuarioModel[]> {
    return this.http.get<UsuarioModel[]>(
      `${this.apiUrlSpringboot}/filtrar-nombre?nombre=${nombre}`
    ).pipe(catchError(err => throwError(() => err)));
  }

  filtrarPorDocumento(documento: string): Observable<UsuarioModel[]> {
    return this.http.get<UsuarioModel[]>(
      `${this.apiUrlSpringboot}/filtrar-documento?documento=${documento}`
    ).pipe(catchError(err => throwError(() => err)));
  }

  filtrarPorCorreo(correo: string): Observable<UsuarioModel[]> {
    return this.http.get<UsuarioModel[]>(
      `${this.apiUrlSpringboot}/filtrar-correo?correo=${correo}`
    ).pipe(catchError(err => throwError(() => err)));
  }

  /** Filtro dinámico */
  filtrar(criterio: string, valor: string): Observable<UsuarioModel[]> {
    switch (criterio) {
      case 'nombre': return this.filtrarPorNombre(valor);
      case 'documento': return this.filtrarPorDocumento(valor);
      case 'correo': return this.filtrarPorCorreo(valor);
      default:
        console.warn('Criterio de filtro no reconocido:', criterio);
        return this.listar();
    }
  }

  // ============================================================
  // 4. CRUD COMPLETO DE USUARIOS
  // ============================================================

  /** Crear usuario */
  guardar(usuario: UsuarioModel): Observable<UsuarioModel> {
    return this.http.post<UsuarioModel>(`${this.apiUrlSpringboot}/registro`, usuario).pipe(
      catchError(err => throwError(() => err))
    );
  }

  

  /** Actualizar usuario */
  actualizar(id: number, usuario: UsuarioModel): Observable<UsuarioModel> {
    return this.http.put<UsuarioModel>(`${this.apiUrlSpringboot}/${id}`, usuario).pipe(
      catchError(err => throwError(() => err))
    );
  }

  /** Eliminación física */
  eliminarFisico(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrlSpringboot}/${id}`, {
      responseType: 'text' as 'json'
    }).pipe(catchError(err => throwError(() => err)));
  }

  /** Eliminación lógica */
  eliminarLogico(id: number): Observable<string> {
    return this.http.patch<string>(`${this.apiUrlSpringboot}/eliminar/${id}`, null, {
      responseType: 'text' as 'json'
    }).pipe(catchError(err => throwError(() => err)));
  }

cambiarEstado(id: number, estado: boolean) {
  return this.http.put(`${this.apiUrlSpringboot}/estado/${id}?estado=${estado}`, {});
}

  // ============================================================
  // 5. ENDPOINTS DE EXCEL & PDF
  // ============================================================

  /** Descargar Excel */
  descargarExcel(filtros?: { nombre?: string; correo?: string; documento?: string }): Observable<Blob> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.nombre) params = params.set('nombre', filtros.nombre);
      if (filtros.correo) params = params.set('correo', filtros.correo);
      if (filtros.documento) params = params.set('documento', filtros.documento);
    }
    return this.http.get(`${this.apiUrlSpringboot}/export/excel`, { responseType: 'blob', params })
      .pipe(catchError(err => throwError(() => err)));
  }

  /** Descargar PDF */
  descargarPDF(filtros?: { nombre?: string; correo?: string; documento?: string }): Observable<Blob> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.nombre) params = params.set('nombre', filtros.nombre);
      if (filtros.correo) params = params.set('correo', filtros.correo);
      if (filtros.documento) params = params.set('documento', filtros.documento);
    }
    return this.http.get(`${this.apiUrlSpringboot}/export/pdf`, { responseType: 'blob', params })
      .pipe(catchError(err => throwError(() => err)));
  }

  // ============================================================
  // 6. GESTIÓN DE ESTADÍSTICAS
  // ============================================================

  obtenerGraficoLocalidadRol(): Observable<any> {
    return this.http.get<any>(`${this.apiUrlSpringboot}/graficos/usuarios-localidad-rol`);
  }

  obtenerBarriosPorLocalidades(): Observable<any> {
    return this.http.get<any>(`${this.apiUrlSpringboot}/estadisticas/barrios-localidades`);
  }

  // ============================================================
  // 7. AUTOGESTIÓN DE SESIÓN
  // ============================================================

  obtenerUsuarioActual(): UsuarioModel | null {
    const data = localStorage.getItem('usuarioLogueado');
    return data ? JSON.parse(data) : null;
  }

  logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('rol');
  localStorage.removeItem('correo');
  localStorage.removeItem('idUsuario');
}

  isTokenExpired(): boolean {
    const expiresIn = Number(localStorage.getItem('expiresIn'));
    if (!expiresIn) return true;
    return Date.now() > expiresIn;
  }

  prepareRefreshToken(): void {
    // TODO: Refresh token
  }

  limpiarContrasenaParaEdicion(usuario: UsuarioModel): UsuarioModel {
    const usuarioEdit = { ...usuario };
    usuarioEdit.contrasena = '';
    return usuarioEdit;
  }

  // ============================================================
  // 8. ENDPOINTS NUEVOS (NO ESTABAN EN TU SERVICE)
  // ============================================================

  /** Descargar plantilla Excel por rol */
  descargarPlantilla(rol: string): Observable<Blob> {
    return this.http.get(`${this.apiUrlSpringboot}/plantilla/${rol}`, {
      responseType: 'blob'
    });
  }

  /** Cargar archivo Excel por rol */
  cargarExcel(file: File, rol: string): Observable<any> {
  const formData = new FormData();
  formData.append('archivo', file);

  return this.http.post(`${this.apiUrlSpringboot}/cargar/${rol}`, formData, {
    reportProgress: true,
    observe: 'events'
  });
}

  /** Endpoint test público */
  testPublic(): Observable<string> {
    return this.http.get(`${this.apiUrlSpringboot}/test-public`, {
      responseType: 'text'
    });
  }

  /** Endpoint test de registro */
  testRegistro(data: string): Observable<string> {
    return this.http.post(`${this.apiUrlSpringboot}/test-registro`, data, {
      responseType: 'text'
    });
  }

  /** Usuarios pendientes */
  obtenerUsuariosPendientes(): Observable<UsuarioModel[]> {
    return this.http.get<UsuarioModel[]>(`${this.apiUrlSpringboot}/pendientes`);
  }

  /** Contador de pendientes */
  contarPendientes(): Observable<number> {
    return this.http.get<number>(`${this.apiUrlSpringboot}/pendientes/count`);
  }

  /** Aprobar usuario */
  aprobarUsuario(id: number): Observable<string> {
    return this.http.patch(`${this.apiUrlSpringboot}/aprobar/${id}`, null, {
      responseType: 'text'
    });
  }

  /** Rechazar usuario */
  rechazarUsuario(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrlSpringboot}/rechazar/${id}`, {
      responseType: 'text'
    });
  }

  /** Subir documentos */
  subirDocumento(id: number, file: File, tipo: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);

    return this.http.post(`${this.apiUrlSpringboot}/${id}/documentos`, formData);
  }

  /** Ping backend */
  ping(): Observable<string> {
    return this.http.get(`${this.apiUrlSpringboot}/ping`, {
      responseType: 'text'
    });
  }
}
