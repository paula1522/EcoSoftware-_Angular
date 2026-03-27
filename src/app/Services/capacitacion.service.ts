import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ✅ Importa tus modelos
import {
  Capacitacion,
  CapacitacionDTO,
  EstadoCurso,
  Modulo,
  ModuloDTO,
  EvaluacionDTO,
  IntentoEvaluacionDTO,
  Inscripcion,
  Progreso,
  ProgresoDTO,
  UploadResultDto,
  CloudinaryUploadResponse,
} from '../Models/capacitacion.model';


@Injectable({
  providedIn: 'root'
})
export class CapacitacionesService {
  exportarExcel() {
    throw new Error('Method not implemented.');
  }

private readonly baseApiUrl = (environment.apiBaseUrl || environment.apiUrl || '').replace(/\/$/, '');
private readonly apiUrl = `${this.baseApiUrl}/api/capacitaciones`;
  constructor(private http: HttpClient) {}

  // ===========================
  // CAPACITACIONES
  // ===========================
  crearCapacitacion(dto: CapacitacionDTO): Observable<CapacitacionDTO> {
    return this.http.post<CapacitacionDTO>(this.apiUrl, dto, this.withAuthHeaderIfAvailable());
  }

  actualizarCapacitacion(id: number, dto: CapacitacionDTO): Observable<CapacitacionDTO> {
    return this.http.put<CapacitacionDTO>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarCapacitacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obtenerCapacitacionPorId(id: number): Observable<CapacitacionDTO> {
    return this.http.get<CapacitacionDTO>(`${this.apiUrl}/${id}`);
  }

  subirImagenCapacitacion(id: number, file: File): Observable<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CloudinaryUploadResponse>(`${this.apiUrl}/${id}/imagen`, formData);
  }

  listarTodasCapacitaciones(): Observable<CapacitacionDTO[]> {
    return this.http.get<CapacitacionDTO[]>(this.apiUrl);
  }

  obtenerMisCapacitaciones(usuarioId: number){
  return this.http.get<CapacitacionDTO[]>(
    `${this.apiUrl}/mis-capacitaciones/${usuarioId}`
  );
}

  // ===========================
  // CARGA MASIVA EXCEL
  // ===========================
  cargarCapacitacionesDesdeExcel(file: File): Observable<UploadResultDto> {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post<UploadResultDto>(`${this.apiUrl}/cargar-excel`, formData);
}

  validarCapacitacion(nombre?: string, descripcion?: string): Observable<boolean> {
  let params = new HttpParams();
  if (nombre) params = params.set('nombre', nombre);
  if (descripcion) params = params.set('descripcion', descripcion);
  return this.http.get<boolean>(`${this.apiUrl}/validar`, { params });
}
validarCapacitacionPorNombre(nombre: string): Observable<boolean> {
  return this.http.get<boolean>(`${this.apiUrl}/validar`, { params: { nombre } });
}

// valida el excel sin intentar cargarlo (llama al endpoint /validar-excel)
validarExcel(file: File): Observable<Capacitacion[]> {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post<Capacitacion[]>(`${this.apiUrl}/validar-excel`, formData);
}

obtenerCapacitacionPorNombre(nombre: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/buscarPorNombre`, { params: { nombre } });
}
  generarPlantillaExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/plantilla`, { responseType: 'blob' });
  }

  // ===========================
  // MODULOS
  // ===========================
  crearModulo(dto: ModuloDTO): Observable<ModuloDTO> {
    return this.http.post<ModuloDTO>(`${this.apiUrl}/modulos`, dto);
  }

  crearModuloPorCapacitacion(capacitacionId: number, dto: ModuloDTO): Observable<ModuloDTO> {
    return this.http.post<ModuloDTO>(`${this.apiUrl}/${capacitacionId}/modulos`, dto);
  }

  actualizarModulo(id: number, dto: ModuloDTO): Observable<ModuloDTO> {
    return this.http.put<ModuloDTO>(`${this.apiUrl}/modulos/${id}`, dto);
  }

  eliminarModulo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/modulos/${id}`);
  }

  listarModulosPorCapacitacion(capacitacionId: number): Observable<ModuloDTO[]> {
    return this.http.get<ModuloDTO[]>(`${this.apiUrl}/${capacitacionId}/modulos`);
  }

  subirPdfModulo(moduloId: number, file: File): Observable<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CloudinaryUploadResponse>(`${this.apiUrl}/modulos/${moduloId}/pdf`, formData);
  }

  // ===========================
  // EVALUACIONES
  // ===========================
  crearEvaluacion(moduloId: number, dto: EvaluacionDTO): Observable<EvaluacionDTO> {
    return this.http.post<EvaluacionDTO>(`${this.apiUrl}/modulos/${moduloId}/evaluaciones`, dto);
  }

  listarEvaluacionesPorModulo(moduloId: number): Observable<EvaluacionDTO[]> {
    return this.http.get<EvaluacionDTO[]>(`${this.apiUrl}/modulos/${moduloId}/evaluaciones`);
  }

  actualizarEvaluacion(evaluacionId: number, dto: EvaluacionDTO): Observable<EvaluacionDTO> {
    return this.http.put<EvaluacionDTO>(`${this.apiUrl}/evaluaciones/${evaluacionId}`, dto);
  }

  eliminarEvaluacion(evaluacionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/evaluaciones/${evaluacionId}`);
  }

  // ===========================
  // INTENTOS DE EVALUACION
  // ===========================
  registrarIntentoEvaluacion(evaluacionId: number, payload: { usuarioId: number; puntajeObtenido: number }): Observable<IntentoEvaluacionDTO> {
    return this.http.post<IntentoEvaluacionDTO>(`${this.apiUrl}/evaluaciones/${evaluacionId}/intentos`, payload);
  }

  listarIntentosPorEvaluacionYUsuario(evaluacionId: number, usuarioId: number): Observable<IntentoEvaluacionDTO[]> {
    return this.http.get<IntentoEvaluacionDTO[]>(`${this.apiUrl}/evaluaciones/${evaluacionId}/intentos/usuario/${usuarioId}`);
  }

  // ===========================
  // PROGRESO
  // ===========================
  obtenerProgresoUsuarioPorCurso(usuarioId: number, cursoId: number): Observable<ProgresoDTO> {
    return this.http.get<ProgresoDTO>(`${this.apiUrl}/progreso/usuario/${usuarioId}/curso/${cursoId}`);
  }

  // Cargar módulos por Excel
  cargarModulosDesdeExcel(capacitacionId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.apiUrl}/${capacitacionId}/modulos/cargar-excel`,
      formData,
      { responseType: 'text' }
    );
  }

  generarPlantillaModulosExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/modulos/plantilla`, { responseType: 'blob' });
  }

  // ===========================
  // INSCRIPCIONES
  // ===========================
  inscribirse(usuarioId: number, cursoId: number): Observable<Inscripcion> {
    let params = new HttpParams()
      .set('usuarioId', usuarioId)
      .set('cursoId', cursoId);
    // Cambia null por {} en el body
    return this.http.post<Inscripcion>(`${this.apiUrl}/inscripciones`, {}, { params });
  }

  actualizarEstadoInscripcion(id: number, estado: EstadoCurso): Observable<Inscripcion> {
    let params = new HttpParams().set('estado', estado);
    return this.http.put<Inscripcion>(`${this.apiUrl}/inscripciones/${id}`, null, { params });
  }

  listarInscripcionesPorUsuario(usuarioId: number): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.apiUrl}/inscripciones/usuario/${usuarioId}`);
  }

  listarInscripcionesPorCurso(cursoId: number): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.apiUrl}/inscripciones/curso/${cursoId}`);
  }

  // ===========================
  // PROGRESO
  // ===========================
  registrarProgreso(dto: Progreso): Observable<Progreso> {
    return this.http.post<Progreso>(`${this.apiUrl}/progreso`, dto);
  }

  actualizarProgreso(id: number, dto: Progreso): Observable<Progreso> {
    return this.http.put<Progreso>(`${this.apiUrl}/progreso/${id}`, dto);
  }

  listarProgresosPorUsuario(usuarioId: number): Observable<Progreso[]> {
    return this.http.get<Progreso[]>(`${this.apiUrl}/progreso/usuario/${usuarioId}`);
  }

  listarProgresosPorCurso(cursoId: number): Observable<Progreso[]> {
    return this.http.get<Progreso[]>(`${this.apiUrl}/progreso/curso/${cursoId}`);
  }

  private withAuthHeaderIfAvailable(): { headers?: HttpHeaders } {
    const rawToken = localStorage.getItem('jwt_token') || localStorage.getItem('token') || '';
    const normalized = this.normalizeToken(rawToken);
    if (!normalized) {
      return {};
    }

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${normalized}`,
      }),
    };
  }

  private normalizeToken(raw: string): string {
    let token = (raw || '').trim();
    if (!token) {
      return '';
    }

    if (token.toLowerCase().startsWith('bearer ')) {
      token = token.slice(7).trim();
    }

    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      token = token.slice(1, -1).trim();
    }

    return token;
  }

}
