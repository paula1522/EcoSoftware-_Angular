import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EvaluacionDTO,
  IntentoEvaluacionDTO,
  ModuloDTO,
  ProgresoDTO,
  UploadPdfResponseDTO,
} from '../models/capacitaciones-modulos.models';

@Injectable({
  providedIn: 'root',
})
export class CapacitacionesModulosApiService {
  private readonly apiBase = (environment.apiBaseUrl || environment.apiUrl || '').replace(/\/$/, '');
  private readonly prefix = `${this.apiBase}/api/capacitaciones`;

  constructor(private readonly http: HttpClient) {}

  crearModuloPorCapacitacion(capacitacionId: number, dto: ModuloDTO): Observable<ModuloDTO> {
    return this.http.post<ModuloDTO>(`${this.prefix}/${capacitacionId}/modulos`, dto);
  }

  crearModulo(dto: ModuloDTO): Observable<ModuloDTO> {
    return this.http.post<ModuloDTO>(`${this.prefix}/modulos`, dto);
  }

  listarModulosPorCapacitacion(capacitacionId: number): Observable<ModuloDTO[]> {
    return this.http.get<ModuloDTO[]>(`${this.prefix}/${capacitacionId}/modulos`);
  }

  actualizarModulo(id: number, dto: ModuloDTO): Observable<ModuloDTO> {
    return this.http.put<ModuloDTO>(`${this.prefix}/modulos/${id}`, dto);
  }

  eliminarModulo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.prefix}/modulos/${id}`);
  }

  subirPdfModulo(moduloId: number, file: File): Observable<UploadPdfResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadPdfResponseDTO>(`${this.prefix}/modulos/${moduloId}/pdf`, formData);
  }

  listarEvaluacionesPorModulo(moduloId: number): Observable<EvaluacionDTO[]> {
    return this.http.get<EvaluacionDTO[]>(`${this.prefix}/modulos/${moduloId}/evaluaciones`);
  }

  crearEvaluacion(moduloId: number, dto: EvaluacionDTO): Observable<EvaluacionDTO> {
    return this.http.post<EvaluacionDTO>(`${this.prefix}/modulos/${moduloId}/evaluaciones`, dto);
  }

  actualizarEvaluacion(evaluacionId: number, dto: EvaluacionDTO): Observable<EvaluacionDTO> {
    return this.http.put<EvaluacionDTO>(`${this.prefix}/evaluaciones/${evaluacionId}`, dto);
  }

  eliminarEvaluacion(evaluacionId: number): Observable<void> {
    return this.http.delete<void>(`${this.prefix}/evaluaciones/${evaluacionId}`);
  }

  registrarIntentoEvaluacion(evaluacionId: number, dto: IntentoEvaluacionDTO): Observable<IntentoEvaluacionDTO> {
    return this.http.post<IntentoEvaluacionDTO>(`${this.prefix}/evaluaciones/${evaluacionId}/intentos`, dto);
  }

  listarIntentosPorEvaluacionYUsuario(evaluacionId: number, usuarioId: number): Observable<IntentoEvaluacionDTO[]> {
    return this.http.get<IntentoEvaluacionDTO[]>(`${this.prefix}/evaluaciones/${evaluacionId}/intentos/usuario/${usuarioId}`);
  }

  obtenerProgresoUsuarioPorCurso(usuarioId: number, cursoId: number): Observable<ProgresoDTO> {
    return this.http.get<ProgresoDTO>(`${this.prefix}/progreso/usuario/${usuarioId}/curso/${cursoId}`);
  }
}
